import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as paymentsService from "../services/payments.service";
import * as paymentsRepo from "../repositories/payments.repo";
import { Errors } from "../utils/errors";

const ListSchema = z.object({
  year: z.coerce.number().int().min(2000).max(3000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(["pending", "validated", "expired", "unpaid", "all"]).optional(),
  q: z.string().max(200).optional(),
});

export async function list(req: Request, res: Response) {
  const q = parseOrThrow(ListSchema, req.query);
  const period = q.year && q.month ? { year: q.year, month: q.month } : undefined;
  const [payments, summary] = await Promise.all([
    paymentsRepo.listPayments({ period, status: q.status, q: q.q }),
    paymentsService.summary(period),
  ]);
  res.json({ payments, summary });
}

export async function validatePayment(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) throw Errors.badRequest("Missing payment id");
  if (!req.user) throw Errors.unauthorized();
  const payment = await paymentsService.validate(id, req.user.sub);
  res.json({ payment });
}

const EnsureSchema = z.object({
  user_id: z.string().uuid(),
  year: z.number().int().min(2000),
  month: z.number().int().min(1).max(12),
  amount: z.number().int().min(0).optional(),
});

export async function ensurePending(req: Request, res: Response) {
  const body = parseOrThrow(EnsureSchema, req.body);
  const payment = await paymentsService.ensurePending(body.user_id, { year: body.year, month: body.month });
  res.status(201).json({ payment });
}
