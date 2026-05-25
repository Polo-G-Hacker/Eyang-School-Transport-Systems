import * as dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Env var ${name} must be an integer, got "${raw}"`);
  return n;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: int("PORT", 4000),
  databaseUrl: required("DATABASE_URL", "postgresql://ests:ests_password@localhost:5432/ests"),
  jwt: {
    secret: required("JWT_SECRET", "dev-only-jwt-secret-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  },
  qr: {
    secret: required("QR_SECRET", "dev-only-qr-secret-change-me"),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: int("SMTP_PORT", 1025),
    secure: bool("SMTP_SECURE", false),
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from: process.env.MAIL_FROM ?? "ESTS Transport <no-reply@ests.local>",
  },
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:8100",
  rateLimit: {
    windowMs: int("RATE_LIMIT_WINDOW_MS", 60_000),
    max: int("RATE_LIMIT_MAX", 120),
  },
} as const;

export type Env = typeof env;
