import { Errors } from "../utils/errors";
import * as attendanceRepo from "../repositories/attendance.repo";
import * as qrRepo from "../repositories/qr.repo";
import * as reservationsRepo from "../repositories/reservations.repo";
import * as roundsRepo from "../repositories/pickup-rounds.repo";
import * as busesRepo from "../repositories/buses.repo";
import { verifyToken } from "./qr.service";
import { currentPeriod } from "../utils/period";

export interface ScanInput {
  qrToken: string;
  busId: string;
  driverId: string;
  pickupRoundId?: string | null;
  pickupPointId?: number | null;
  clientEventId?: string | null;
  scannedAt?: Date;
  fromOfflineBatch?: boolean;
}

export interface ScanOutcome {
  result: "boarded" | "denied";
  reason?: string;
  attendance_id?: string;
  user?: { id: string; full_name: string; student_id: string | null };
}

const UNKNOWN_USER = "00000000-0000-0000-0000-000000000000";

export async function scan(input: ScanInput): Promise<ScanOutcome> {
  const bus = await busesRepo.findBus(input.busId);
  if (!bus) throw Errors.notFound("Bus not found");
  if (bus.driver_id !== input.driverId) throw Errors.forbidden("Driver is not assigned to this bus");

  let roundId = input.pickupRoundId ?? null;
  if (!roundId) {
    const active = await roundsRepo.findActiveForBus(input.busId);
    if (active) roundId = active.id;
  }

  const verification = await verifyToken(input.qrToken);
  if (!verification.valid || !verification.user_id) {
    // We try to log denial — but if user_id is unknown we still log with placeholder. Skip if FK fails.
    if (verification.user_id) {
      const denial = await attendanceRepo.record({
        user_id: verification.user_id,
        bus_id: input.busId,
        pickup_round_id: roundId,
        pickup_point_id: input.pickupPointId ?? null,
        result: "denied",
        reason: verification.reason ?? "invalid_qr",
        scanned_at: input.scannedAt,
        client_event_id: input.clientEventId ?? null,
        synced_from_offline: !!input.fromOfflineBatch,
      });
      if ("duplicate" in denial) return { result: "denied", reason: "duplicate_event" };
    }
    return { result: "denied", reason: verification.reason ?? "invalid_qr" };
  }

  // Confirm reservation exists for current period on this bus.
  const period = currentPeriod();
  const reservation = await reservationsRepo.findForPeriod(verification.user_id, period);
  if (!reservation || reservation.bus_id !== input.busId || reservation.status !== "confirmed") {
    const r = await attendanceRepo.record({
      user_id: verification.user_id,
      bus_id: input.busId,
      pickup_round_id: roundId,
      pickup_point_id: input.pickupPointId ?? null,
      result: "denied",
      reason: "no_reservation_on_this_bus",
      scanned_at: input.scannedAt,
      client_event_id: input.clientEventId ?? null,
      synced_from_offline: !!input.fromOfflineBatch,
    });
    if ("duplicate" in r) return { result: "denied", reason: "duplicate_event" };
    return { result: "denied", reason: "no_reservation_on_this_bus" };
  }

  if (roundId) {
    const already = await attendanceRepo.alreadyBoarded(roundId, verification.user_id);
    if (already) {
      return { result: "denied", reason: "already_boarded_this_trip" };
    }
  }

  const qr = await qrRepo.findByToken(input.qrToken);
  const inserted = await attendanceRepo.record({
    user_id: verification.user_id,
    bus_id: input.busId,
    pickup_round_id: roundId,
    qr_code_id: qr?.id ?? null,
    pickup_point_id: input.pickupPointId ?? null,
    result: "boarded",
    scanned_at: input.scannedAt,
    client_event_id: input.clientEventId ?? null,
    synced_from_offline: !!input.fromOfflineBatch,
  });
  if ("duplicate" in inserted) return { result: "denied", reason: "duplicate_event" };

  return {
    result: "boarded",
    attendance_id: inserted.id,
    user: {
      id: verification.user_id,
      full_name: verification.full_name ?? "",
      student_id: verification.student_id ?? null,
    },
  };
}

// keep UNKNOWN_USER referenced to avoid unused warning in some lint configs
void UNKNOWN_USER;
