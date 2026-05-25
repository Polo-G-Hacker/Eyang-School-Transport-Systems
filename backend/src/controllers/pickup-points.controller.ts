import type { Request, Response } from "express";
import * as repo from "../repositories/pickup-points.repo";

export async function list(_req: Request, res: Response) {
  const pickup_points = await repo.listAll();
  res.json({ pickup_points });
}
