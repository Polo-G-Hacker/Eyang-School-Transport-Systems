import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as busesService from "../services/buses.service";
import { Errors } from "../utils/errors";

export async function list(_req: Request, res: Response) {
  const [buses, stats] = await Promise.all([busesService.list(), busesService.fleetStats()]);
  res.json({ buses, stats });
}

const CreateSchema = z.object({
  plate_number: z.string().min(2).max(40),
  color: z.string().min(2).max(40),
  capacity: z.number().int().positive().max(120),
  driver_id: z.string().uuid().optional().nullable(),
});

export async function create(req: Request, res: Response) {
  const body = parseOrThrow(CreateSchema, req.body);
  const bus = await busesService.create(body);
  res.status(201).json({ bus });
}

const UpdateSchema = CreateSchema.partial().extend({
  status: z.enum(["idle", "on_route", "maintenance"]).optional(),
});

export async function update(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) throw Errors.badRequest("Missing bus id");
  const patch = parseOrThrow(UpdateSchema, req.body);
  const bus = await busesService.update(id, patch);
  res.json({ bus });
}

export async function get(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) throw Errors.badRequest("Missing bus id");
  const bus = await busesService.get(id);
  res.json({ bus });
}

export async function mine(req: Request, res: Response) {
  const driverId = req.user?.sub;
  if (!driverId) throw Errors.unauthorized();
  const bus = await busesService.getForDriver(driverId);
  res.json({ bus });
}
