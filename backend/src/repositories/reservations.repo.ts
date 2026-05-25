import { withTx } from "../db/pool";
import { query } from "../db/pool";
import { Errors } from "../utils/errors";
import type { Period } from "../utils/period";

export interface ReservationRow {
  id: string;
  user_id: string;
  bus_id: string;
  pickup_point_id: number;
  period_year: number;
  period_month: number;
  status: "confirmed" | "cancelled";
  bus_plate?: string;
  bus_color?: string;
  pickup_name?: string;
}

const SELECT_RES = `
  SELECT r.id, r.user_id, r.bus_id, r.pickup_point_id, r.period_year, r.period_month, r.status,
         b.plate_number AS bus_plate, b.color AS bus_color, pp.name AS pickup_name
  FROM reservations r
  JOIN buses b ON b.id = r.bus_id
  JOIN pickup_points pp ON pp.id = r.pickup_point_id
`;

export async function findForPeriod(userId: string, p: Period): Promise<ReservationRow | null> {
  const { rows } = await query<ReservationRow>(
    `${SELECT_RES} WHERE r.user_id = $1 AND r.period_year = $2 AND r.period_month = $3 LIMIT 1`,
    [userId, p.year, p.month],
  );
  return rows[0] ?? null;
}

export async function reserveSpot(input: {
  userId: string;
  busId: string;
  pickupPointId: number;
  period: Period;
}): Promise<ReservationRow> {
  return withTx(async (client) => {
    // Lock the bus row to safely count + insert.
    const bus = await client.query<{ id: string; capacity: number }>(
      `SELECT id, capacity FROM buses WHERE id = $1 FOR UPDATE`,
      [input.busId],
    );
    if (bus.rows.length === 0) throw Errors.notFound("Bus not found");
    const capacity = bus.rows[0]?.capacity ?? 0;

    const used = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM reservations
       WHERE bus_id = $1 AND period_year = $2 AND period_month = $3 AND status = 'confirmed'`,
      [input.busId, input.period.year, input.period.month],
    );
    const reserved = Number(used.rows[0]?.count ?? 0);
    if (reserved >= capacity) {
      throw Errors.conflict("Bus is fully booked for this period");
    }

    const insert = await client.query<{ id: string }>(
      `INSERT INTO reservations(user_id, bus_id, pickup_point_id, period_year, period_month, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')
       ON CONFLICT (user_id, period_year, period_month)
         DO UPDATE SET bus_id = EXCLUDED.bus_id, pickup_point_id = EXCLUDED.pickup_point_id, status = 'confirmed'
       RETURNING id`,
      [input.userId, input.busId, input.pickupPointId, input.period.year, input.period.month],
    );
    const id = insert.rows[0]?.id;
    if (!id) throw Errors.internal("reservation_insert_failed");

    const { rows } = await client.query<ReservationRow>(`${SELECT_RES} WHERE r.id = $1`, [id]);
    if (!rows[0]) throw Errors.internal("reservation_lookup_failed");
    return rows[0];
  });
}

export async function cancel(userId: string, p: Period): Promise<void> {
  await query(
    `UPDATE reservations SET status = 'cancelled'
       WHERE user_id = $1 AND period_year = $2 AND period_month = $3`,
    [userId, p.year, p.month],
  );
}

export async function listForBus(busId: string, p: Period): Promise<ReservationRow[]> {
  const { rows } = await query<ReservationRow>(
    `${SELECT_RES} WHERE r.bus_id = $1 AND r.period_year = $2 AND r.period_month = $3 AND r.status = 'confirmed' ORDER BY pp.sort_order`,
    [busId, p.year, p.month],
  );
  return rows;
}
