import { query } from "../db/pool";

export interface QrRow {
  id: string;
  user_id: string;
  payment_id: string;
  token: string;
  period_year: number;
  period_month: number;
  issued_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
}

export async function findCurrent(userId: string, year: number, month: number): Promise<QrRow | null> {
  const { rows } = await query<QrRow>(
    `SELECT * FROM qr_codes WHERE user_id = $1 AND period_year = $2 AND period_month = $3 LIMIT 1`,
    [userId, year, month],
  );
  return rows[0] ?? null;
}

export async function upsert(qr: Omit<QrRow, "id" | "issued_at" | "revoked_at">): Promise<QrRow> {
  const { rows } = await query<QrRow>(
    `INSERT INTO qr_codes(user_id, payment_id, token, period_year, period_month, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, period_year, period_month)
       DO UPDATE SET token = EXCLUDED.token, payment_id = EXCLUDED.payment_id, expires_at = EXCLUDED.expires_at, revoked_at = NULL
     RETURNING *`,
    [qr.user_id, qr.payment_id, qr.token, qr.period_year, qr.period_month, qr.expires_at],
  );
  if (!rows[0]) throw new Error("qr_upsert_failed");
  return rows[0];
}

export async function findByToken(token: string): Promise<QrRow | null> {
  const { rows } = await query<QrRow>(`SELECT * FROM qr_codes WHERE token = $1 LIMIT 1`, [token]);
  return rows[0] ?? null;
}
