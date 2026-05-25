import { Errors } from "../utils/errors";
import * as paymentsRepo from "../repositories/payments.repo";
import * as notificationsRepo from "../repositories/notifications.repo";
import { currentPeriod, type Period } from "../utils/period";

export async function ensurePending(userId: string, period: Period = currentPeriod()) {
  return paymentsRepo.ensurePending(userId, period);
}

export async function validate(paymentId: string, adminId: string) {
  const payment = await paymentsRepo.findById(paymentId);
  if (!payment) throw Errors.notFound("Payment not found");
  if (payment.status === "validated") return payment;
  await paymentsRepo.validatePayment(paymentId, adminId);

  await notificationsRepo.create({
    user_id: payment.user_id,
    title: "Payment validated",
    body: `Your payment for ${payment.period_year}-${String(payment.period_month).padStart(2, "0")} has been validated by admin.`,
    kind: "payment",
    data: { payment_id: paymentId },
  });

  const updated = await paymentsRepo.findById(paymentId);
  if (!updated) throw Errors.notFound("Payment not found after update");
  return updated;
}

export async function summary(period: Period = currentPeriod()) {
  return paymentsRepo.periodSummary(period);
}
