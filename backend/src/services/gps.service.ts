import { Errors } from "../utils/errors";
import { query } from "../db/pool";
import * as busesRepo from "../repositories/buses.repo";

export interface GpsInput {
  busId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed_kph?: number | null;
  heading_deg?: number | null;
  recorded_at?: Date;
}

export async function record(input: GpsInput) {
  const bus = await busesRepo.findBus(input.busId);
  if (!bus) throw Errors.notFound("Bus not found");
  if (bus.driver_id !== input.driverId) throw Errors.forbidden();

  await query(
    `INSERT INTO gps_pings(bus_id, latitude, longitude, speed_kph, heading_deg, recorded_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))`,
    [
      input.busId,
      input.latitude,
      input.longitude,
      input.speed_kph ?? null,
      input.heading_deg ?? null,
      input.recorded_at ?? null,
    ],
  );
  await busesRepo.updateBusGps(input.busId, input.latitude, input.longitude);
}

export async function latest(busId: string) {
  const { rows } = await query<{
    bus_id: string;
    latitude: string;
    longitude: string;
    recorded_at: Date;
  }>(
    `SELECT bus_id, latitude, longitude, recorded_at FROM gps_pings WHERE bus_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
    [busId],
  );
  return rows[0] ?? null;
}
