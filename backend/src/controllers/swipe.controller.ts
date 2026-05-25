import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as swipeService from "../services/swipe.service";
import { Errors } from "../utils/errors";

const StartSchema = z.object({ bus_id: z.string().uuid() });

export async function start(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(StartSchema, req.body);
  const round = await swipeService.startRound(req.user.sub, body.bus_id);
  res.status(201).json({ round });
}

export async function end(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const id = req.params.id;
  if (!id) throw Errors.badRequest("Missing round id");
  await swipeService.endRound(id, req.user.sub);
  res.json({ ok: true });
}

const RespondSchema = z.object({
  round_id: z.string().uuid(),
  response: z.enum(["yes", "no"]),
});

export async function respond(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(RespondSchema, req.body);
  await swipeService.respond(req.user.sub, body.round_id, body.response);
  res.json({ ok: true });
}

export async function expected(req: Request, res: Response) {
  const roundId = req.params.id;
  const busId = (req.query.bus_id as string | undefined) ?? "";
  if (!roundId || !busId) throw Errors.badRequest("round id and bus_id required");
  const list = await swipeService.expectedFor(roundId, busId);
  res.json({ expected: list });
}
