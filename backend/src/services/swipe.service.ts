import { Errors } from "../utils/errors";
import * as roundsRepo from "../repositories/pickup-rounds.repo";
import * as busesRepo from "../repositories/buses.repo";
import * as notificationsRepo from "../repositories/notifications.repo";

export async function startRound(driverId: string, busId: string) {
  const bus = await busesRepo.findBus(busId);
  if (!bus) throw Errors.notFound("Bus not found");
  if (bus.driver_id !== driverId) throw Errors.forbidden("Driver not assigned to this bus");

  const round = await roundsRepo.startRound(busId, driverId);
  await busesRepo.updateBus(busId, { status: "on_route" } as never);
  await notificationsRepo.broadcastToBus(busId, {
    title: "Pickup Round Started!",
    body: `${bus.driver_name ?? "Driver"} has started the route. Will you be at your pickup point today?`,
    kind: "pickup_round",
    data: { round_id: round.id, bus_id: busId },
  });
  return round;
}

export async function endRound(roundId: string, _driverId: string) {
  await roundsRepo.endRound(roundId);
}

export async function respond(userId: string, roundId: string, response: "yes" | "no") {
  await roundsRepo.recordSwipe(roundId, userId, response);
}

export async function expectedFor(roundId: string, busId: string) {
  return roundsRepo.listExpected(roundId, busId);
}
