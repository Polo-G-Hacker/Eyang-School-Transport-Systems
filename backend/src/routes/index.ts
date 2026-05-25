import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";

import * as authCtrl from "../controllers/auth.controller";
import * as usersCtrl from "../controllers/users.controller";
import * as busesCtrl from "../controllers/buses.controller";
import * as paymentsCtrl from "../controllers/payments.controller";
import * as qrCtrl from "../controllers/qr.controller";
import * as reservationsCtrl from "../controllers/reservations.controller";
import * as boardingCtrl from "../controllers/boarding.controller";
import * as gpsCtrl from "../controllers/gps.controller";
import * as swipeCtrl from "../controllers/swipe.controller";
import * as notificationsCtrl from "../controllers/notifications.controller";
import * as pickupCtrl from "../controllers/pickup-points.controller";

export const apiRouter = Router();

// ---------- Auth ----------
apiRouter.post("/auth/register", authLimiter, asyncHandler(authCtrl.register));
apiRouter.post("/auth/login", authLimiter, asyncHandler(authCtrl.login));
apiRouter.post("/auth/verify-email", asyncHandler(authCtrl.verifyEmail));
apiRouter.get("/auth/verify-email", asyncHandler(authCtrl.verifyEmail));
apiRouter.post("/auth/resend-verification", authLimiter, asyncHandler(authCtrl.resendVerification));
apiRouter.get("/auth/me", requireAuth, asyncHandler(authCtrl.me));

// ---------- Users (admin) ----------
apiRouter.get("/users", requireAuth, requireRole("admin"), asyncHandler(usersCtrl.list));
apiRouter.patch("/users/:id/status", requireAuth, requireRole("admin"), asyncHandler(usersCtrl.setStatus));

// ---------- Pickup points (public to authenticated users) ----------
apiRouter.get("/pickup-points", requireAuth, asyncHandler(pickupCtrl.list));

// ---------- Buses ----------
apiRouter.get("/buses", requireAuth, asyncHandler(busesCtrl.list));
apiRouter.get("/buses/mine", requireAuth, requireRole("driver"), asyncHandler(busesCtrl.mine));
apiRouter.get("/buses/:id", requireAuth, asyncHandler(busesCtrl.get));
apiRouter.post("/buses", requireAuth, requireRole("admin"), asyncHandler(busesCtrl.create));
apiRouter.patch("/buses/:id", requireAuth, requireRole("admin", "driver"), asyncHandler(busesCtrl.update));
apiRouter.get("/buses/:id/reservations", requireAuth, requireRole("admin", "driver"), asyncHandler(reservationsCtrl.listForBus));

// ---------- Payments ----------
apiRouter.get("/payments", requireAuth, requireRole("admin"), asyncHandler(paymentsCtrl.list));
apiRouter.post("/payments", requireAuth, requireRole("admin"), asyncHandler(paymentsCtrl.ensurePending));
apiRouter.post("/payments/:id/validate", requireAuth, requireRole("admin"), asyncHandler(paymentsCtrl.validatePayment));

// ---------- QR codes ----------
apiRouter.get("/qr/mine", requireAuth, requireRole("student"), asyncHandler(qrCtrl.mine));
apiRouter.post("/qr/verify", requireAuth, requireRole("driver", "admin"), asyncHandler(qrCtrl.verify));

// ---------- Reservations ----------
apiRouter.post("/reservations", requireAuth, requireRole("student"), asyncHandler(reservationsCtrl.reserve));
apiRouter.get("/reservations/mine", requireAuth, requireRole("student"), asyncHandler(reservationsCtrl.mine));
apiRouter.delete("/reservations/mine", requireAuth, requireRole("student"), asyncHandler(reservationsCtrl.cancel));

// ---------- Boarding (driver) ----------
apiRouter.post("/boarding/scan", requireAuth, requireRole("driver"), asyncHandler(boardingCtrl.scanOne));
apiRouter.post("/boarding/sync", requireAuth, requireRole("driver"), asyncHandler(boardingCtrl.scanBatch));

// ---------- GPS ----------
apiRouter.post("/gps/ping", requireAuth, requireRole("driver"), asyncHandler(gpsCtrl.record));
apiRouter.get("/gps/buses/:id/latest", requireAuth, asyncHandler(gpsCtrl.latest));

// ---------- Pickup rounds (swipe) ----------
apiRouter.post("/pickup-rounds/start", requireAuth, requireRole("driver"), asyncHandler(swipeCtrl.start));
apiRouter.post("/pickup-rounds/:id/end", requireAuth, requireRole("driver"), asyncHandler(swipeCtrl.end));
apiRouter.get("/pickup-rounds/:id/expected", requireAuth, requireRole("driver", "admin"), asyncHandler(swipeCtrl.expected));
apiRouter.post("/swipes", requireAuth, requireRole("student"), asyncHandler(swipeCtrl.respond));

// ---------- Notifications ----------
apiRouter.get("/notifications", requireAuth, asyncHandler(notificationsCtrl.list));
apiRouter.post("/notifications/read", requireAuth, asyncHandler(notificationsCtrl.markRead));
