import type { Request, Response } from "express";
import { z } from "zod";
import { parseOrThrow } from "../utils/validate";
import * as authService from "../services/auth.service";

const RegisterSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["student", "driver"]).optional(),
  phone: z.string().min(6).max(20).optional(),
  student_id: z.string().min(3).max(40).optional(),
  program_id: z.number().int().positive().optional(),
  pickup_point_id: z.number().int().positive().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const VerifySchema = z.object({ token: z.string().min(8) });

export async function register(req: Request, res: Response) {
  const body = parseOrThrow(RegisterSchema, req.body);
  const result = await authService.register(body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const body = parseOrThrow(LoginSchema, req.body);
  const result = await authService.login(body);
  res.json(result);
}

export async function verifyEmail(req: Request, res: Response) {
  const body = parseOrThrow(VerifySchema, { token: req.body?.token ?? req.query.token });
  const result = await authService.verifyEmail(body.token);
  res.json(result);
}

export async function resendVerification(req: Request, res: Response) {
  const body = parseOrThrow(z.object({ email: z.string().email() }), req.body);
  await authService.resendVerification(body.email);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
