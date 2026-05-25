export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  badRequest: (msg = "Bad request", details?: unknown) =>
    new HttpError(400, "bad_request", msg, details),
  unauthorized: (msg = "Unauthorized") => new HttpError(401, "unauthorized", msg),
  forbidden: (msg = "Forbidden") => new HttpError(403, "forbidden", msg),
  notFound: (msg = "Not found") => new HttpError(404, "not_found", msg),
  conflict: (msg = "Conflict", details?: unknown) =>
    new HttpError(409, "conflict", msg, details),
  unprocessable: (msg = "Unprocessable", details?: unknown) =>
    new HttpError(422, "unprocessable", msg, details),
  tooMany: (msg = "Too many requests") => new HttpError(429, "rate_limited", msg),
  internal: (msg = "Internal server error") => new HttpError(500, "internal", msg),
};
