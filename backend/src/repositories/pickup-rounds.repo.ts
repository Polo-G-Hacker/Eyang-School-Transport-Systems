import { query } from "../db/pool";

export interface PickupRound {
  id: string;
  bus_id: string;
  driver_id: string;
  started_at: Date;
  ended_at: Date | null;
  period_date: string;
}

export async function startRound(busId: string, driverId: string): Promise<PickupRound> {
  const { rows } = await query<PickupRound>(
    `INSERT INTO pickup_rounds(bus_id, driver_id) VALUES ($1, $2) RETURNING *`,
    [busId, driverId],
  );
  if (!rows[0]) throw new Error("pickup_round_insert_failed");
  return rows[0];
}

export async function endRound(id: string): Promise<void> {
  await query(`UPDATE pickup_rounds SET ended_at = NOW() WHERE id = $1 AND ended_at IS NULL`, [id]);
}

export async function findActiveForBus(busId: string): Promise<PickupRound | null> {
  const { rows } = await query<PickupRound>(
    `SELECT * FROM pickup_rounds WHERE bus_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`,
    [busId],
  );
  return rows[0] ?? null;
}

export async function recordSwipe(roundId: string, userId: string, response: "yes" | "no"): Promise<void> {
  await query(
    `INSERT INTO swipe_responses(pickup_round_id, user_id, response)
     VALUES ($1, $2, $3)
     ON CONFLICT (pickup_round_id, user_id) DO UPDATE SET response = EXCLUDED.response, responded_at = NOW()`,
    [roundId, userId, response],
  );
}

export interface ExpectedStudent {
  user_id: string;
  full_name: string;
  student_id: string | null;
  pickup_point_id: number | null;
  pickup_name: string | null;
  response: "yes" | "no" | null;
}

export async function listExpected(roundId: string, busId: string): Promise<ExpectedStudent[]> {
  const { rows } = await query<ExpectedStudent>(
    `SELECT u.id AS user_id, u.full_name, u.student_id,
            u.pickup_point_id, pp.name AS pickup_name,
            sr.response
     FROM reservations r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN pickup_points pp ON pp.id = u.pickup_point_id
     LEFT JOIN swipe_responses sr ON sr.pickup_round_id = $1 AND sr.user_id = u.id
     WHERE r.bus_id = $2
       AND r.status = 'confirmed'
       AND r.period_year = EXTRACT(YEAR FROM NOW())
       AND r.period_month = EXTRACT(MONTH FROM NOW())
     ORDER BY pp.sort_order, u.full_name`,
    [roundId, busId],
  );
  return rows;
}
