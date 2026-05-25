import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as reservationsService from "../services/reservations.service";
import { Errors } from "../utils/errors";

const ReserveSchema = z.object({
  bus_id: z.string().uuid(),
  pickup_point_id: z.number().int().positive(),
});

export async function reserve(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(ReserveSchema, req.body);
  const r = await reservationsService.reserve(req.user.sub, body.bus_id, body.pickup_point_id);
  res.status(201).json({ reservation: r });
}

export async function mine(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const r = await reservationsService.mine(req.user.sub);
  res.json({ reservation: r });
}

export async function cancel(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  await reservationsService.cancelMine(req.user.sub);
  res.json({ ok: true });
}

export async function listForBus(req: Request, res: Response) {
  const busId = req.params.id;
  if (!busId) throw Errors.badRequest("Missing bus id");
  const list = await reservationsService.listForBus(busId);
  res.json({ reservations: list });
}
