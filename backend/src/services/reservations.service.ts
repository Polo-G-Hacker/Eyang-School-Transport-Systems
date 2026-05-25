import { Errors } from "../utils/errors";
import * as reservationsRepo from "../repositories/reservations.repo";
import * as paymentsRepo from "../repositories/payments.repo";
import { currentPeriod } from "../utils/period";

export async function reserve(userId: string, busId: string, pickupPointId: number) {
  const period = currentPeriod();
  const payment = await paymentsRepo.findActive(userId, period);
  if (!payment) {
    throw Errors.forbidden("Reservation requires a validated payment for the current month");
  }
  return reservationsRepo.reserveSpot({ userId, busId, pickupPointId, period });
}

export async function cancelMine(userId: string) {
  await reservationsRepo.cancel(userId, currentPeriod());
}

export async function mine(userId: string) {
  return reservationsRepo.findForPeriod(userId, currentPeriod());
}

export async function listForBus(busId: string) {
  return reservationsRepo.listForBus(busId, currentPeriod());
}
