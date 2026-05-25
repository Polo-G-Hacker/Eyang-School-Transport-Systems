import { Errors } from "../utils/errors";
import { query } from "../db/pool";
import * as busesRepo from "../repositories/buses.repo";

export async function list() {
  return busesRepo.listBuses();
}

export async function get(id: string) {
  const bus = await busesRepo.findBus(id);
  if (!bus) throw Errors.notFound("Bus not found");
  return bus;
}

export async function create(input: busesRepo.BusInput) {
  if (input.capacity <= 0) throw Errors.badRequest("Capacity must be > 0");
  const id = await busesRepo.createBus(input);
  return get(id);
}

export async function update(id: string, patch: Partial<busesRepo.BusInput>) {
  await busesRepo.updateBus(id, patch);
  return get(id);
}

export async function getForDriver(driverId: string) {
  return busesRepo.findBusByDriver(driverId);
}

export interface BusStat {
  on_route: number;
  idle: number;
  total_seats: number;
}

export async function fleetStats(): Promise<BusStat> {
  const { rows } = await query<{ status: string; count: string; seats: string }>(
    `SELECT status, COUNT(*)::text AS count, COALESCE(SUM(capacity),0)::text AS seats
     FROM buses GROUP BY status`,
  );
  let onRoute = 0;
  let idle = 0;
  let totalSeats = 0;
  for (const r of rows) {
    if (r.status === "on_route") onRoute += Number(r.count);
    else if (r.status === "idle") idle += Number(r.count);
    totalSeats += Number(r.seats);
  }
  return { on_route: onRoute, idle, total_seats: totalSeats };
}
