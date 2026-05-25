import { query } from "../db/pool";

export interface AttendanceInput {
  user_id: string;
  bus_id: string;
  pickup_round_id?: string | null;
  qr_code_id?: string | null;
  pickup_point_id?: number | null;
  result: "boarded" | "denied";
  reason?: string | null;
  scanned_at?: Date;
  client_event_id?: string | null;
  synced_from_offline?: boolean;
}

export interface AttendanceRow extends Required<Omit<AttendanceInput, "scanned_at" | "synced_from_offline">> {
  id: string;
  scanned_at: Date;
  synced_from_offline: boolean;
}

export async function record(input: AttendanceInput): Promise<AttendanceRow | { duplicate: true }> {
  const { rows } = await query<AttendanceRow>(
    `INSERT INTO attendance_logs(user_id, bus_id, pickup_round_id, qr_code_id, pickup_point_id,
                                  result, reason, scanned_at, synced_from_offline, client_event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()), COALESCE($9, FALSE), $10)
     ON CONFLICT (client_event_id) DO NOTHING
     RETURNING *`,
    [
      input.user_id,
      input.bus_id,
      input.pickup_round_id ?? null,
      input.qr_code_id ?? null,
      input.pickup_point_id ?? null,
      input.result,
      input.reason ?? null,
      input.scanned_at ?? null,
      input.synced_from_offline ?? null,
      input.client_event_id ?? null,
    ],
  );
  if (rows.length === 0) return { duplicate: true };
  if (!rows[0]) return { duplicate: true };
  return rows[0];
}

export async function alreadyBoarded(roundId: string, userId: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM attendance_logs
       WHERE pickup_round_id = $1 AND user_id = $2 AND result = 'boarded'
     ) AS exists`,
    [roundId, userId],
  );
  return rows[0]?.exists ?? false;
}
