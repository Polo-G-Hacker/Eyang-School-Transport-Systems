import { query } from "../db/pool";
import type { PaymentStatus } from "../domain/types";
import type { Period } from "../utils/period";

export interface PaymentRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  program_level: string | null;
  program_field: string | null;
  period_year: number;
  period_month: number;
  amount_fcfa: number;
  status: PaymentStatus;
  paid_at: Date | null;
  validated_at: Date | null;
  created_at: Date;
}

const SELECT_PAYMENT = `
  SELECT p.id, p.user_id, u.full_name, u.email, u.student_id,
         ap.level AS program_level, ap.field AS program_field,
         p.period_year, p.period_month, p.amount_fcfa, p.status,
         p.paid_at, p.validated_at, p.created_at
  FROM payments p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN academic_programs ap ON ap.id = u.program_id
`;

export async function ensurePending(userId: string, period: Period, amount = 15000): Promise<PaymentRow> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO payments(user_id, period_year, period_month, amount_fcfa, status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (user_id, period_year, period_month) DO UPDATE SET amount_fcfa = EXCLUDED.amount_fcfa
     RETURNING id`,
    [userId, period.year, period.month, amount],
  );
  if (!rows[0]) throw new Error("payment_upsert_failed");
  const { rows: full } = await query<PaymentRow>(`${SELECT_PAYMENT} WHERE p.id = $1`, [rows[0].id]);
  if (!full[0]) throw new Error("payment_not_found");
  return full[0];
}

export async function findActive(userId: string, period: Period): Promise<PaymentRow | null> {
  const { rows } = await query<PaymentRow>(
    `${SELECT_PAYMENT} WHERE p.user_id = $1 AND p.period_year = $2 AND p.period_month = $3 AND p.status = 'validated' LIMIT 1`,
    [userId, period.year, period.month],
  );
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<PaymentRow | null> {
  const { rows } = await query<PaymentRow>(`${SELECT_PAYMENT} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listPayments(filter: {
  period?: Period;
  status?: PaymentStatus | "all";
  q?: string;
}): Promise<PaymentRow[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.period) {
    params.push(filter.period.year);
    where.push(`p.period_year = $${params.length}`);
    params.push(filter.period.month);
    where.push(`p.period_month = $${params.length}`);
  }
  if (filter.status && filter.status !== "all") {
    params.push(filter.status);
    where.push(`p.status = $${params.length}`);
  }
  if (filter.q) {
    params.push(`%${filter.q.toLowerCase()}%`);
    where.push(`(LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
  }
  const sql = `${SELECT_PAYMENT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY p.created_at DESC LIMIT 500`;
  const { rows } = await query<PaymentRow>(sql, params);
  return rows;
}

export async function validatePayment(paymentId: string, adminId: string): Promise<void> {
  await query(
    `UPDATE payments
       SET status = 'validated', paid_at = COALESCE(paid_at, NOW()), validated_at = NOW(), validated_by = $2
     WHERE id = $1`,
    [paymentId, adminId],
  );
}

export interface PeriodSummary {
  validated: number;
  pending: number;
  unpaid: number;
  expired: number;
  total_collected: number;
  expected: number;
  collection_rate: number;
}

export async function periodSummary(period: Period, expectedPerStudent = 15000): Promise<PeriodSummary> {
  const { rows: agg } = await query<{
    validated: string;
    pending: string;
    unpaid: string;
    expired: string;
    total_collected: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'validated') AS validated,
       COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
       COUNT(*) FILTER (WHERE status = 'unpaid')    AS unpaid,
       COUNT(*) FILTER (WHERE status = 'expired')   AS expired,
       COALESCE(SUM(amount_fcfa) FILTER (WHERE status = 'validated'), 0) AS total_collected
     FROM payments WHERE period_year = $1 AND period_month = $2`,
    [period.year, period.month],
  );
  const { rows: students } = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code = 'student' AND u.status = 'approved'`,
  );

  const studentCount = Number(students[0]?.count ?? 0);
  const expected = studentCount * expectedPerStudent;
  const totalCollected = Number(agg[0]?.total_collected ?? 0);
  return {
    validated: Number(agg[0]?.validated ?? 0),
    pending: Number(agg[0]?.pending ?? 0),
    unpaid: Number(agg[0]?.unpaid ?? 0),
    expired: Number(agg[0]?.expired ?? 0),
    total_collected: totalCollected,
    expected,
    collection_rate: expected > 0 ? Math.round((totalCollected / expected) * 100) : 0,
  };
}
