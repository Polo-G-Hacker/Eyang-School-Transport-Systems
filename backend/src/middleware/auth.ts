import type { Request, RequestHandler } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Errors } from "../utils/errors";

export type Role = "student" | "driver" | "admin";

export interface AuthClaims {
  sub: string;        // user id
  role: Role;
  email: string;
  full_name: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthClaims;
  }
}

export function signSessionToken(claims: AuthClaims): string {
  const opts: jwt.SignOptions = { expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(claims, env.jwt.secret, opts);
}

export function verifySessionToken(token: string): AuthClaims {
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as jwt.JwtPayload & AuthClaims;
    if (!decoded.sub || !decoded.role) throw new Error("invalid claims");
    return {
      sub: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      full_name: decoded.full_name,
    };
  } catch {
    throw Errors.unauthorized("Invalid or expired token");
  }
}

function extractBearer(req: Request): string | undefined {
  const h = req.header("authorization") ?? req.header("Authorization");
  if (!h) return undefined;
  const [scheme, token] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token.trim();
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) return next(Errors.unauthorized("Missing bearer token"));
  try {
    req.user = verifySessionToken(token);
    next();
  } catch (e) {
    next(e);
  }
};

export const requireRole = (...allowed: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!allowed.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
};
