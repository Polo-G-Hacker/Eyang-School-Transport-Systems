import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import { scan, type ScanInput } from "../services/boarding.service";
import { Errors } from "../utils/errors";

const ScanSchema = z.object({
  qr_token: z.string().min(8),
  bus_id: z.string().uuid(),
  pickup_round_id: z.string().uuid().optional().nullable(),
  pickup_point_id: z.number().int().positive().optional().nullable(),
  client_event_id: z.string().min(8).max(80).optional().nullable(),
  scanned_at: z.string().datetime().optional(),
});

export async function scanOne(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(ScanSchema, req.body);
  const input: ScanInput = {
    qrToken: body.qr_token,
    busId: body.bus_id,
    driverId: req.user.sub,
    pickupRoundId: body.pickup_round_id ?? null,
    pickupPointId: body.pickup_point_id ?? null,
    clientEventId: body.client_event_id ?? null,
    scannedAt: body.scanned_at ? new Date(body.scanned_at) : undefined,
  };
  const outcome = await scan(input);
  res.json(outcome);
}

const BatchSchema = z.object({
  events: z.array(ScanSchema).min(1).max(200),
});

export async function scanBatch(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(BatchSchema, req.body);
  const results = [];
  for (const ev of body.events) {
    try {
      const outcome = await scan({
        qrToken: ev.qr_token,
        busId: ev.bus_id,
        driverId: req.user.sub,
        pickupRoundId: ev.pickup_round_id ?? null,
        pickupPointId: ev.pickup_point_id ?? null,
        clientEventId: ev.client_event_id ?? null,
        scannedAt: ev.scanned_at ? new Date(ev.scanned_at) : undefined,
      });
      results.push({ client_event_id: ev.client_event_id, outcome });
    } catch (e) {
      results.push({ client_event_id: ev.client_event_id, error: (e as Error).message });
    }
  }
  res.json({ results });
}
