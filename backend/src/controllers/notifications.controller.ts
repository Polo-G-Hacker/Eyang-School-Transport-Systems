import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as notificationsRepo from "../repositories/notifications.repo";
import { Errors } from "../utils/errors";

export async function list(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const notifications = await notificationsRepo.listForUser(req.user.sub);
  res.json({ notifications });
}

export async function markRead(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const body = parseOrThrow(z.object({ ids: z.array(z.string().uuid()).min(1) }), req.body);
  await notificationsRepo.markRead(req.user.sub, body.ids);
  res.json({ ok: true });
}
