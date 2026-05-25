import * as bcrypt from "bcryptjs";
import { Errors } from "../utils/errors";
import * as usersRepo from "../repositories/users.repo";
import * as emailTokensRepo from "../repositories/email-tokens.repo";
import { sendVerificationEmail } from "./email.service";
import { signSessionToken, type Role } from "../middleware/auth";
import type { PublicUser } from "../domain/types";

const BCRYPT_ROUNDS = 12;

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  student_id?: string;
  program_id?: number;
  pickup_point_id?: number;
}

const INSTITUTIONAL_DOMAIN = "saintjeaningenieur.org";

export async function register(input: RegisterInput): Promise<{ user: PublicUser; needsVerification: true }> {
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) throw Errors.conflict("Email already registered");

  if (input.password.length < 8) {
    throw Errors.badRequest("Password must be at least 8 characters");
  }

  const isInstitutional = input.email.toLowerCase().endsWith(`@${INSTITUTIONAL_DOMAIN}`);
  const role: Role = input.role ?? "student";

  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const row = await usersRepo.createUser({
    role,
    full_name: input.full_name,
    email: input.email,
    password_hash,
    phone: input.phone ?? null,
    student_id: input.student_id ?? null,
    program_id: input.program_id ?? null,
    pickup_point_id: input.pickup_point_id ?? null,
    status: isInstitutional && role === "student" ? "approved" : "pending",
  });

  const token = emailTokensRepo.generateToken(60);
  await emailTokensRepo.insertToken(row.id, token, "verify");
  void sendVerificationEmail(row.email, row.full_name, token.token);

  return { user: usersRepo.toPublic(row), needsVerification: true };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  access_token: string;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const row = await usersRepo.findByEmail(input.email);
  if (!row) throw Errors.unauthorized("Invalid email or password");

  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) throw Errors.unauthorized("Invalid email or password");

  if (!row.is_active || row.status === "disabled") {
    throw Errors.forbidden("Account is disabled. Contact administrator.");
  }
  if (!row.is_email_verified) {
    throw Errors.forbidden("Please verify your email address first.");
  }
  if (row.status === "pending") {
    throw Errors.forbidden("Account pending administrator approval.");
  }

  const access_token = signSessionToken({
    sub: row.id,
    role: row.role_code,
    email: row.email,
    full_name: row.full_name,
  });

  return { user: usersRepo.toPublic(row), access_token };
}

export async function verifyEmail(token: string): Promise<{ verified: true }> {
  const used = await emailTokensRepo.consumeToken(token);
  if (!used) throw Errors.badRequest("Invalid or expired verification token");
  await usersRepo.markEmailVerified(used.user_id);
  return { verified: true };
}

export async function resendVerification(email: string): Promise<void> {
  const row = await usersRepo.findByEmail(email);
  if (!row || row.is_email_verified) return; // silent no-op
  const t = emailTokensRepo.generateToken(60);
  await emailTokensRepo.insertToken(row.id, t, "verify");
  void sendVerificationEmail(row.email, row.full_name, t.token);
}
