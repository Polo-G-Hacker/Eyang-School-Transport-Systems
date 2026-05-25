import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Errors } from "../utils/errors";
import * as qrRepo from "../repositories/qr.repo";
import * as paymentsRepo from "../repositories/payments.repo";
import * as usersRepo from "../repositories/users.repo";
import { currentPeriod, endOfPeriod, type Period } from "../utils/period";

const QR_ISSUER = "ests-transport";
const QR_AUDIENCE = "ests-scanner";

export interface QrPayload {
  uid: string;        // user id
  sid: string | null; // student id
  pid: string;        // payment id
  pm: string;         // period YYYY-MM
  iss: string;
  aud: string;
}

export async function issueForUser(userId: string, p: Period = currentPeriod()): Promise<{
  token: string;
  payload: QrPayload;
  expires_at: Date;
  user_full_name: string;
  student_id: string | null;
}> {
  const user = await usersRepo.findById(userId);
  if (!user) throw Errors.notFound("User not found");
  if (user.role_code !== "student") throw Errors.forbidden("Only students may receive QR passes");

  const payment = await paymentsRepo.findActive(userId, p);
  if (!payment) {
    throw Errors.forbidden("Active payment required to issue QR. Please ask the administrator to validate your monthly payment.");
  }

  const expires_at = endOfPeriod(p);
  const period_label = `${p.year}-${String(p.month).padStart(2, "0")}`;

  // Reuse existing token if it is still valid (signature + not revoked + payment still tied).
  const existing = await qrRepo.findCurrent(userId, p.year, p.month);
  if (existing && !existing.revoked_at && existing.expires_at > new Date() && existing.payment_id === payment.id) {
    try {
      jwt.verify(existing.token, env.qr.secret, { issuer: QR_ISSUER, audience: QR_AUDIENCE });
      return {
        token: existing.token,
        payload: { uid: user.id, sid: user.student_id, pid: payment.id, pm: period_label, iss: QR_ISSUER, aud: QR_AUDIENCE },
        expires_at: existing.expires_at,
        user_full_name: user.full_name,
        student_id: user.student_id,
      };
    } catch {
      // Signature no longer verifies (e.g. secret rotated). Fall through to mint a new token.
    }
  }

  const payload: QrPayload = {
    uid: user.id,
    sid: user.student_id,
    pid: payment.id,
    pm: period_label,
    iss: QR_ISSUER,
    aud: QR_AUDIENCE,
  };
  const token = jwt.sign(payload, env.qr.secret, {
    expiresIn: Math.floor((expires_at.getTime() - Date.now()) / 1000),
    notBefore: 0,
  });

  await qrRepo.upsert({
    user_id: user.id,
    payment_id: payment.id,
    token,
    period_year: p.year,
    period_month: p.month,
    expires_at,
  });

  return { token, payload, expires_at, user_full_name: user.full_name, student_id: user.student_id };
}

export interface VerificationResult {
  valid: boolean;
  user_id?: string;
  student_id?: string | null;
  full_name?: string;
  period?: string;
  reason?: string;
}

export async function verifyToken(token: string): Promise<VerificationResult> {
  let payload: QrPayload;
  try {
    payload = jwt.verify(token, env.qr.secret, {
      issuer: QR_ISSUER,
      audience: QR_AUDIENCE,
    }) as QrPayload;
  } catch {
    return { valid: false, reason: "Invalid or expired QR" };
  }

  const stored = await qrRepo.findByToken(token);
  if (!stored) return { valid: false, reason: "QR not recognised by server" };
  if (stored.revoked_at) return { valid: false, reason: "QR revoked" };

  const user = await usersRepo.findById(payload.uid);
  if (!user || !user.is_active || user.status === "disabled") {
    return { valid: false, reason: "User account inactive" };
  }

  // Confirm payment still valid
  const [yy, mm] = payload.pm.split("-");
  const yearNum = Number(yy ?? 0);
  const monthNum = Number(mm ?? 0);
  if (!yearNum || !monthNum) return { valid: false, reason: "QR period malformed" };
  const period = { year: yearNum, month: monthNum };
  const pay = await paymentsRepo.findActive(user.id, period);
  if (!pay) return { valid: false, reason: "Payment no longer active" };

  return {
    valid: true,
    user_id: user.id,
    student_id: user.student_id,
    full_name: user.full_name,
    period: payload.pm,
  };
}
