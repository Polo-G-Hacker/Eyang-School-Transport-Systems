import { query } from "../db/pool";

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: string;
  data: unknown;
  read_at: Date | null;
  created_at: Date;
}

export async function create(input: {
  user_id: string;
  title: string;
  body: string;
  kind: string;
  data?: unknown;
}): Promise<void> {
  await query(
    `INSERT INTO notifications(user_id, title, body, kind, data) VALUES ($1, $2, $3, $4, $5)`,
    [input.user_id, input.title, input.body, input.kind, input.data ?? null],
  );
}

export async function broadcastToBus(
  busId: string,
  input: { title: string; body: string; kind: string; data?: unknown },
): Promise<void> {
  await query(
    `INSERT INTO notifications(user_id, title, body, kind, data)
     SELECT DISTINCT r.user_id, $2, $3, $4, $5
     FROM reservations r
     WHERE r.bus_id = $1 AND r.status = 'confirmed'
       AND r.period_year = EXTRACT(YEAR FROM NOW())
       AND r.period_month = EXTRACT(MONTH FROM NOW())`,
    [busId, input.title, input.body, input.kind, input.data ?? null],
  );
}

export async function listForUser(userId: string, limit = 50): Promise<NotificationRow[]> {
  const { rows } = await query<NotificationRow>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  );
  return rows;
}

export async function markRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL`,
    [userId, ids],
  );
}
