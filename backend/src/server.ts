import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { apiLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

export function buildApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "ests-transport-api", env: env.nodeEnv }));

  app.use("/api", apiLimiter, apiRouter);

  app.use((req, res) => {
    res.status(404).json({ error: { code: "not_found", message: `Cannot ${req.method} ${req.path}` } });
  });

  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const app = buildApp();
  app.listen(env.port, () => {
    logger.info("server:listening", { port: env.port, env: env.nodeEnv });
  });
}
