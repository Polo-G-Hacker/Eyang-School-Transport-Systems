import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as gpsService from "../services/gps.service";
import { Errors } from "../utils/errors";

const PingSchema = z.object({
  bus_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed_kph: z.number().min(0).max(300).optional().nullable(),
  heading_deg: z.number().min(0).max(360).optional().nullable(),
  recorded_at: z.string().datetime().optional(),
});

export async function record(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(PingSchema, req.body);
  await gpsService.record({
    busId: body.bus_id,
    driverId: req.user.sub,
    latitude: body.latitude,
    longitude: body.longitude,
    speed_kph: body.speed_kph ?? null,
    heading_deg: body.heading_deg ?? null,
    recorded_at: body.recorded_at ? new Date(body.recorded_at) : undefined,
  });
  res.json({ ok: true });
}

export async function latest(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) throw Errors.badRequest("Missing bus id");
  const ping = await gpsService.latest(id);
  res.json({ ping });
}
