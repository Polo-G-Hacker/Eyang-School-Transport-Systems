import type { PoolClient } from "pg";
import { pool, query } from "../db/pool";
import type { PublicUser, Role, UserStatus } from "../domain/types";

interface UserJoinedRow {
  id: string;
  role_code: Role;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  avatar_url: string | null;
  student_id: string | null;
  program_id: number | null;
  program_code: string | null;
  program_level: string | null;
  program_field: string | null;
  pickup_point_id: number | null;
  pickup_point_code: string | null;
  pickup_point_name: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

const SELECT_USER = `
  SELECT u.id, r.code AS role_code, u.full_name, u.email, u.password_hash, u.phone,
         u.avatar_url, u.student_id,
         u.program_id, ap.code AS program_code, ap.level AS program_level, ap.field AS program_field,
         u.pickup_point_id, pp.code AS pickup_point_code, pp.name AS pickup_point_name,
         u.is_email_verified, u.is_active, u.status, u.created_at, u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN academic_programs ap ON ap.id = u.program_id
  LEFT JOIN pickup_points pp ON pp.id = u.pickup_point_id
`;

function toPublic(row: UserJoinedRow): PublicUser {
  return {
    id: row.id,
    role: row.role_code,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    avatar_url: row.avatar_url,
    student_id: row.student_id,
    program:
      row.program_id !== null && row.program_code && row.program_level && row.program_field
        ? { id: row.program_id, code: row.program_code, level: row.program_level, field: row.program_field }
        : null,
    pickup_point:
      row.pickup_point_id !== null && row.pickup_point_code && row.pickup_point_name
        ? { id: row.pickup_point_id, code: row.pickup_point_code, name: row.pickup_point_name }
        : null,
    is_email_verified: row.is_email_verified,
    is_active: row.is_active,
    status: row.status,
  };
}

export async function findByEmail(email: string): Promise<UserJoinedRow | null> {
  const { rows } = await query<UserJoinedRow>(`${SELECT_USER} WHERE LOWER(u.email) = LOWER($1) LIMIT 1`, [email]);
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<UserJoinedRow | null> {
  const { rows } = await query<UserJoinedRow>(`${SELECT_USER} WHERE u.id = $1 LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export interface CreateUserInput {
  role: Role;
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  student_id?: string | null;
  program_id?: number | null;
  pickup_point_id?: number | null;
  status?: UserStatus;
}

export async function createUser(input: CreateUserInput, client: PoolClient | null = null): Promise<UserJoinedRow> {
  const q = client ?? pool;
  const insert = await q.query<{ id: string }>(
    `INSERT INTO users (role_id, full_name, email, password_hash, phone, student_id, program_id, pickup_point_id, status)
     SELECT r.id, $2, LOWER($3), $4, $5, $6, $7, $8, COALESCE($9, 'pending')
     FROM roles r WHERE r.code = $1
     RETURNING id`,
    [
      input.role,
      input.full_name,
      input.email,
      input.password_hash,
      input.phone ?? null,
      input.student_id ?? null,
      input.program_id ?? null,
      input.pickup_point_id ?? null,
      input.status ?? null,
    ],
  );
  const id = insert.rows[0]?.id;
  if (!id) throw new Error("user_insert_failed");
  const { rows } = await q.query<UserJoinedRow>(`${SELECT_USER} WHERE u.id = $1`, [id]);
  if (!rows[0]) throw new Error("user_not_found_after_insert");
  return rows[0];
}

export async function markEmailVerified(userId: string): Promise<void> {
  await query(
    `UPDATE users SET is_email_verified = TRUE,
       status = CASE WHEN status = 'pending' THEN 'approved' ELSE status END
     WHERE id = $1`,
    [userId],
  );
}

export async function setStatus(userId: string, status: UserStatus): Promise<void> {
  await query(`UPDATE users SET status = $2, is_active = ($2 <> 'disabled') WHERE id = $1`, [userId, status]);
}

export async function listUsers(filter: { role?: Role; status?: UserStatus; q?: string }): Promise<PublicUser[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.role) {
    params.push(filter.role);
    where.push(`r.code = $${params.length}`);
  }
  if (filter.status) {
    params.push(filter.status);
    where.push(`u.status = $${params.length}`);
  }
  if (filter.q) {
    params.push(`%${filter.q.toLowerCase()}%`);
    where.push(`(LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.student_id,'')) LIKE $${params.length})`);
  }
  const sql = `${SELECT_USER} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY u.created_at DESC LIMIT 500`;
  const { rows } = await query<UserJoinedRow>(sql, params);
  return rows.map(toPublic);
}

export { toPublic };
