import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as usersRepo from "../repositories/users.repo";
import { Errors } from "../utils/errors";

const ListSchema = z.object({
  role: z.enum(["student", "driver", "admin"]).optional(),
  status: z.enum(["pending", "approved", "disabled"]).optional(),
  q: z.string().max(200).optional(),
});

export async function list(req: Request, res: Response) {
  const q = parseOrThrow(ListSchema, req.query);
  const users = await usersRepo.listUsers(q);
  res.json({ users });
}

const StatusSchema = z.object({ status: z.enum(["pending", "approved", "disabled"]) });

export async function setStatus(req: Request, res: Response) {
  const userId = req.params.id;
  if (!userId) throw Errors.badRequest("Missing user id");
  const { status } = parseOrThrow(StatusSchema, req.body);
  await usersRepo.setStatus(userId, status);
  const updated = await usersRepo.findById(userId);
  if (!updated) throw Errors.notFound("User not found");
  res.json({ user: usersRepo.toPublic(updated) });
}
