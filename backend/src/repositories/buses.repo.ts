import { query } from "../db/pool";
import type { BusStatus } from "../domain/types";

export interface BusRow {
  id: string;
  plate_number: string;
  color: string;
  capacity: number;
  driver_id: string | null;
  driver_name: string | null;
  driver_email: string | null;
  status: BusStatus;
  last_seen_at: Date | null;
  last_latitude: string | null;
  last_longitude: string | null;
  reserved_count: number;
  boarded_today: number;
}

const SELECT_BUS = `
  SELECT b.id, b.plate_number, b.color, b.capacity, b.driver_id,
         d.full_name AS driver_name, d.email AS driver_email,
         b.status, b.last_seen_at, b.last_latitude, b.last_longitude,
         COALESCE(r.reserved_count, 0) AS reserved_count,
         COALESCE(a.boarded_today, 0) AS boarded_today
  FROM buses b
  LEFT JOIN users d ON d.id = b.driver_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS reserved_count
    FROM reservations r
    WHERE r.bus_id = b.id
      AND r.status = 'confirmed'
      AND r.period_year = EXTRACT(YEAR FROM NOW())
      AND r.period_month = EXTRACT(MONTH FROM NOW())
  ) r ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS boarded_today
    FROM attendance_logs al
    WHERE al.bus_id = b.id
      AND al.result = 'boarded'
      AND al.scanned_at::date = (NOW() AT TIME ZONE 'UTC')::date
  ) a ON TRUE
`;

export async function listBuses(): Promise<BusRow[]> {
  const { rows } = await query<BusRow>(`${SELECT_BUS} ORDER BY b.plate_number`);
  return rows;
}

export async function findBus(id: string): Promise<BusRow | null> {
  const { rows } = await query<BusRow>(`${SELECT_BUS} WHERE b.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findBusByDriver(driverId: string): Promise<BusRow | null> {
  const { rows } = await query<BusRow>(`${SELECT_BUS} WHERE b.driver_id = $1`, [driverId]);
  return rows[0] ?? null;
}

export interface BusInput {
  plate_number: string;
  color: string;
  capacity: number;
  driver_id?: string | null;
}

export async function createBus(input: BusInput): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO buses(plate_number, color, capacity, driver_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [input.plate_number, input.color, input.capacity, input.driver_id ?? null],
  );
  if (!rows[0]) throw new Error("bus_insert_failed");
  return rows[0].id;
}

export async function updateBus(id: string, patch: Partial<BusInput> & { status?: BusStatus }): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    params.push(v);
    fields.push(`${k} = $${params.length}`);
  }
  if (fields.length === 0) return;
  params.push(id);
  await query(`UPDATE buses SET ${fields.join(", ")} WHERE id = $${params.length}`, params);
}

export async function updateBusGps(busId: string, lat: number, lon: number, status?: BusStatus): Promise<void> {
  const params: unknown[] = [busId, lat, lon];
  let extra = "";
  if (status) {
    params.push(status);
    extra = `, status = $${params.length}`;
  }
  await query(
    `UPDATE buses SET last_latitude = $2, last_longitude = $3, last_seen_at = NOW() ${extra} WHERE id = $1`,
    params,
  );
}
