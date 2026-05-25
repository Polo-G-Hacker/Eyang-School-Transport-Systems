import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/errors";
import { logger } from "../config/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
    return;
  }
  logger.error("unhandled_error", {
    path: req.path,
    method: req.method,
    err: (err as Error).message,
    stack: (err as Error).stack,
  });
  res.status(500).json({
    error: { code: "internal", message: "Internal server error" },
  });
};
