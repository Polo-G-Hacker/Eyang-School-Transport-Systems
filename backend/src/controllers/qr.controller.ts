import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as qrService from "../services/qr.service";
import { Errors } from "../utils/errors";

export async function mine(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const r = await qrService.issueForUser(req.user.sub);
  res.json({
    token: r.token,
    expires_at: r.expires_at,
    period: r.payload.pm,
    user: { full_name: r.user_full_name, student_id: r.student_id },
  });
}

export async function verify(req: Request, res: Response) {
  const body = parseOrThrow(z.object({ token: z.string().min(8) }), req.body);
  const v = await qrService.verifyToken(body.token);
  res.json(v);
}
