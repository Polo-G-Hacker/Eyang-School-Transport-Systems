import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateMonthlyQr, validateQrForBoarding } from '../services/qr.service.js';

export const apiRouter = express.Router();

apiRouter.get('/bootstrap', requireAuth(), async (req, res, next) => {
  try {
    const [profile, pickupPoints, buses, reservations, payments, qrs] = await Promise.all([
      query(`SELECT id, full_name, email, matricule, level_label, department, photo_data_url
             FROM users WHERE id=$1`, [req.user.id]),
      query('SELECT * FROM pickup_points ORDER BY sort_order'),
      query(`SELECT b.*, pp.name AS pickup_point, driver.full_name AS driver_name
             FROM buses b
             LEFT JOIN pickup_points pp ON pp.id=b.pickup_point_id
             LEFT JOIN users driver ON driver.id=b.driver_id
             ORDER BY b.plate_number`),
      query('SELECT * FROM reservations WHERE student_id=$1', [req.user.id]),
      query('SELECT * FROM payments WHERE student_id=$1', [req.user.id]),
      query('SELECT month_key, jwt, expires_at FROM qr_codes WHERE student_id=$1 AND revoked_at IS NULL', [req.user.id])
    ]);
    res.json({ profile: profile.rows[0], pickupPoints: pickupPoints.rows, buses: buses.rows, reservations: reservations.rows, payments: payments.rows, qrCodes: qrs.rows });
  } catch (error) {
    next(error);
  }
});

apiRouter.put('/profile', requireAuth(), async (req, res, next) => {
  try {
    const body = z.object({
      fullName: z.string().min(2),
      password: z.string().min(8).optional().or(z.literal('')),
      photoDataUrl: z.string().max(700000).optional().or(z.literal(''))
    }).parse(req.body);
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : null;
    const result = await query(
      `UPDATE users
       SET full_name=$2,
           password_hash=COALESCE($3, password_hash),
           photo_data_url=COALESCE(NULLIF($4, ''), photo_data_url)
       WHERE id=$1
       RETURNING id, full_name, email, matricule, level_label, department, photo_data_url`,
      [req.user.id, body.fullName, passwordHash, body.photoDataUrl || '']
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/notifications', requireAuth(), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, body, round_id, created_at, read_at
       FROM notifications
       WHERE (user_id=$1 OR role_name=$2)
         AND NOT (round_id IS NOT NULL AND read_at IS NOT NULL)
         AND NOT EXISTS (
           SELECT 1 FROM notification_dismissals nd
           WHERE nd.notification_id=notifications.id AND nd.user_id=$1
         )
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id, req.user.role]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/notifications/:notificationId', requireAuth(), async (req, res, next) => {
  try {
    const notificationId = z.string().uuid().parse(req.params.notificationId);
    const exists = await query(
      `SELECT id FROM notifications
       WHERE id=$1 AND (user_id=$2 OR role_name=$3)`,
      [notificationId, req.user.id, req.user.role]
    );
    if (!exists.rowCount) return res.status(404).json({ message: 'Notification not found.' });
    await query(
      `INSERT INTO notification_dismissals (notification_id, user_id)
       VALUES ($1,$2)
       ON CONFLICT (notification_id, user_id) DO NOTHING`,
      [notificationId, req.user.id]
    );
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/payments/:paymentId/validate', requireAuth(['admin']), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE payments SET status='validated', validated_by=$1, validated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.paymentId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/admin/payments', requireAuth(['admin']), async (req, res, next) => {
  try {
    const monthKey = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.monthKey || new Date().toISOString().slice(0, 7));
    const result = await query(
      `SELECT
         u.id AS student_id,
         u.full_name,
         u.email,
         u.matricule,
         u.level_label,
         u.department,
         COALESCE(p.amount_fcfa, 15000) AS amount_fcfa,
         COALESCE(p.status, 'unpaid') AS payment_status,
         p.id AS payment_id,
         p.created_at AS payment_created_at,
         p.validated_at,
         CASE WHEN r.id IS NULL THEN FALSE ELSE TRUE END AS has_reservation,
         r.status AS reservation_status,
         b.plate_number,
         pp.name AS pickup_point
       FROM users u
       JOIN roles role ON role.id=u.role_id AND role.name='student'
       LEFT JOIN payments p ON p.student_id=u.id AND p.month_key=$1
       LEFT JOIN reservations r ON r.student_id=u.id AND r.month_key=$1 AND r.status='confirmed'
       LEFT JOIN buses b ON b.id=r.bus_id
       LEFT JOIN pickup_points pp ON pp.id=r.pickup_point_id
       WHERE u.is_disabled=FALSE
       ORDER BY u.full_name`,
      [monthKey]
    );
    const summary = result.rows.reduce((acc, row) => {
      acc.total += 1;
      acc[row.payment_status] = (acc[row.payment_status] || 0) + 1;
      if (row.has_reservation) acc.reserved += 1;
      if (row.payment_status === 'validated') acc.collected += Number(row.amount_fcfa);
      return acc;
    }, { total: 0, unpaid: 0, pending: 0, validated: 0, reserved: 0, collected: 0 });
    res.json({ monthKey, summary, students: result.rows });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/admin/payments/mark', requireAuth(['admin']), async (req, res, next) => {
  try {
    const body = z.object({
      studentId: z.string().uuid(),
      monthKey: z.string().regex(/^\d{4}-\d{2}$/),
      status: z.enum(['pending', 'validated']),
      amountFcfa: z.coerce.number().int().positive().default(15000)
    }).parse(req.body);
    const result = await query(
      `INSERT INTO payments (student_id, month_key, amount_fcfa, status, validated_by, validated_at)
       VALUES ($1,$2,$3,$4::varchar,$5,CASE WHEN $4::varchar='validated' THEN NOW() ELSE NULL END)
       ON CONFLICT (student_id, month_key)
       DO UPDATE SET
         amount_fcfa=EXCLUDED.amount_fcfa,
         status=EXCLUDED.status,
         validated_by=CASE WHEN EXCLUDED.status='validated' THEN EXCLUDED.validated_by ELSE payments.validated_by END,
         validated_at=CASE WHEN EXCLUDED.status='validated' THEN NOW() ELSE payments.validated_at END
       RETURNING *`,
      [body.studentId, body.monthKey, body.amountFcfa, body.status, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/reservations', requireAuth(['student']), async (req, res, next) => {
  try {
    const body = z.object({ busId: z.string().uuid(), pickupPointId: z.string().uuid(), monthKey: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
    const payment = await query(
      `SELECT id FROM payments
       WHERE student_id=$1 AND month_key=$2 AND status='validated'`,
      [req.user.id, body.monthKey]
    );
    if (!payment.rowCount) {
      return res.status(409).json({ message: 'You must pay for this month before reserving a bus.' });
    }
    const capacity = await query(
      `SELECT b.capacity, b.pickup_point_id, COUNT(r.id)::int reserved
       FROM buses b LEFT JOIN reservations r ON r.bus_id=b.id AND r.month_key=$2 AND r.status='confirmed'
       WHERE b.id=$1 GROUP BY b.id`,
      [body.busId, body.monthKey]
    );
    if (!capacity.rowCount || capacity.rows[0].reserved >= capacity.rows[0].capacity) {
      return res.status(409).json({ message: 'Bus capacity reached' });
    }
    if (capacity.rows[0].pickup_point_id !== body.pickupPointId) {
      return res.status(409).json({ message: 'This bus is assigned to another pickup point' });
    }
    const result = await query(
      `INSERT INTO reservations (student_id, bus_id, pickup_point_id, month_key)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (student_id, month_key)
       DO UPDATE SET bus_id=EXCLUDED.bus_id, pickup_point_id=EXCLUDED.pickup_point_id, status='confirmed'
       RETURNING *`,
      [req.user.id, body.busId, body.pickupPointId, body.monthKey]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/qr/monthly', requireAuth(['student', 'admin']), async (req, res, next) => {
  try {
    const body = z.object({ studentId: z.string().uuid().optional(), monthKey: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
    const studentId = req.user.role === 'admin' ? body.studentId : req.user.id;
    res.json(await generateMonthlyQr(studentId, body.monthKey));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/rounds/start', requireAuth(['driver']), async (req, res, next) => {
  try {
    const body = z.object({ busId: z.string().uuid() }).parse(req.body);
    const bus = await query(
      `SELECT b.id, b.plate_number, pp.name AS pickup_point
       FROM buses b
       LEFT JOIN pickup_points pp ON pp.id=b.pickup_point_id
       WHERE b.id=$1 AND b.driver_id=$2`,
      [body.busId, req.user.id]
    );
    if (!bus.rowCount) {
      return res.status(403).json({ message: 'You can only start a pickup round for your assigned bus.' });
    }
    const round = await query(
      `INSERT INTO pickup_rounds (bus_id, driver_id) VALUES ($1,$2) RETURNING *`,
      [body.busId, req.user.id]
    );
    const notified = await query(
      `INSERT INTO notifications (user_id, round_id, title, body)
       SELECT r.student_id,
              $1,
              'Pickup round started',
              'Bus ' || $2 || ' has started from ' || COALESCE($3, 'your pickup point') || '. Please confirm if you will be present today.'
       FROM reservations r
       JOIN users u ON u.id=r.student_id AND u.is_disabled=FALSE
       WHERE r.bus_id=$4
         AND r.month_key=TO_CHAR(NOW(), 'YYYY-MM')
         AND r.status='confirmed'
       ON CONFLICT DO NOTHING
       RETURNING user_id`,
      [round.rows[0].id, bus.rows[0].plate_number, bus.rows[0].pickup_point, body.busId]
    );
    req.app.get('io').to(`bus:${body.busId}`).emit('pickup:started', {
      ...round.rows[0],
      notifiedStudents: notified.rowCount
    });
    res.status(201).json({ ...round.rows[0], notifiedStudents: notified.rowCount });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/boarding/validate', requireAuth(['driver']), async (req, res, next) => {
  try {
    const body = z.object({ token: z.string(), roundId: z.string().uuid(), busId: z.string().uuid(), offline: z.boolean().default(false) }).parse(req.body);
    res.json(await validateQrForBoarding(body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/sync/attendance', requireAuth(['driver']), async (req, res, next) => {
  try {
    const body = z.object({
      scans: z.array(z.object({ token: z.string(), roundId: z.string().uuid(), busId: z.string().uuid() }))
    }).parse(req.body);
    const results = [];
    for (const scan of body.scans) results.push(await validateQrForBoarding({ ...scan, offline: true }));
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/gps', requireAuth(['driver']), async (req, res, next) => {
  try {
    const body = z.object({ busId: z.string().uuid(), lat: z.number(), lng: z.number(), status: z.string().default('on_route') }).parse(req.body);
    const bus = await query(
      `UPDATE buses SET last_lat=$2, last_lng=$3, status=$4, last_seen_at=NOW()
       WHERE id=$1 RETURNING id, plate_number, color, capacity, status, last_lat, last_lng, last_seen_at`,
      [body.busId, body.lat, body.lng, body.status]
    );
    req.app.get('io').emit('bus:gps', bus.rows[0]);
    res.json(bus.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/swipes', requireAuth(['student']), async (req, res, next) => {
  try {
    const body = z.object({ roundId: z.string().uuid(), response: z.enum(['yes', 'no']) }).parse(req.body);
    const allowed = await query(
      `SELECT pr.id
       FROM pickup_rounds pr
       JOIN reservations r ON r.bus_id=pr.bus_id
        AND r.student_id=$2
        AND r.month_key=TO_CHAR(NOW(), 'YYYY-MM')
        AND r.status='confirmed'
       WHERE pr.id=$1`,
      [body.roundId, req.user.id]
    );
    if (!allowed.rowCount) {
      return res.status(403).json({ message: 'This pickup round is not assigned to your bus reservation.' });
    }
    const result = await query(
      `INSERT INTO swipe_responses (round_id, student_id, response)
       VALUES ($1,$2,$3)
       ON CONFLICT (round_id, student_id) DO UPDATE SET response=EXCLUDED.response, created_at=NOW()
       RETURNING *`,
      [body.roundId, req.user.id, body.response]
    );
    await query(
      `UPDATE notifications
       SET read_at=NOW()
       WHERE user_id=$1 AND round_id=$2 AND read_at IS NULL`,
      [req.user.id, body.roundId]
    );
    req.app.get('io').emit('swipe:response', result.rows[0]);
    res.status(201).json({
      ...result.rows[0],
      message: body.response === 'yes' ? 'Presence confirmed.' : 'Absence confirmed.'
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/admin/dashboard', requireAuth(['admin']), async (_req, res, next) => {
  try {
    const [profile, students, studentRows, drivers, active, pending, buses, payments, points] = await Promise.all([
      query(`SELECT id, full_name, email, photo_data_url FROM users WHERE id=$1`, [_req.user.id]),
      query(`SELECT COUNT(*)::int count FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='student' AND u.is_disabled=FALSE`),
      query(`SELECT u.id, u.full_name, u.email, u.matricule, u.level_label, u.department, u.is_disabled
             FROM users u JOIN roles r ON r.id=u.role_id
             WHERE r.name='student' AND u.is_disabled=FALSE
             ORDER BY u.created_at DESC
             LIMIT 50`),
      query(`SELECT u.id, u.full_name, u.email, u.is_disabled, b.plate_number
             FROM users u JOIN roles r ON r.id=u.role_id
             LEFT JOIN buses b ON b.driver_id=u.id
             WHERE r.name='driver' AND u.is_disabled=FALSE
             ORDER BY u.created_at DESC`),
      query(`SELECT COUNT(*)::int count FROM payments WHERE status='validated' AND month_key=TO_CHAR(NOW(), 'YYYY-MM')`),
      query(`SELECT COUNT(*)::int count FROM payments WHERE status='pending' AND month_key=TO_CHAR(NOW(), 'YYYY-MM')`),
      query(`SELECT b.*, pp.name AS pickup_point, driver.full_name AS driver_name
             FROM buses b
             LEFT JOIN pickup_points pp ON pp.id=b.pickup_point_id
             LEFT JOIN users driver ON driver.id=b.driver_id
             ORDER BY b.plate_number`),
      query(`SELECT p.*, u.full_name, u.level_label, u.department FROM payments p JOIN users u ON u.id=p.student_id ORDER BY p.created_at DESC LIMIT 25`),
      query(`SELECT * FROM pickup_points ORDER BY sort_order`)
    ]);
    res.json({
      profile: profile.rows[0],
      students: students.rows[0].count,
      studentList: studentRows.rows,
      drivers: drivers.rows,
      active: active.rows[0].count,
      pending: pending.rows[0].count,
      buses: buses.rows,
      payments: payments.rows,
      pickupPoints: points.rows
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.put('/admin/profile', requireAuth(['admin']), async (req, res, next) => {
  try {
    const body = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8).optional().or(z.literal('')),
      photoDataUrl: z.string().max(700000).optional().or(z.literal(''))
    }).parse(req.body);
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : null;
    const result = await query(
      `UPDATE users
       SET full_name=$2,
           email=LOWER($3),
           password_hash=COALESCE($4, password_hash),
           photo_data_url=COALESCE(NULLIF($5, ''), photo_data_url)
       WHERE id=$1
       RETURNING id, full_name, email, photo_data_url`,
      [req.user.id, body.fullName, body.email, passwordHash, body.photoDataUrl || '']
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/admin/students', requireAuth(['admin']), async (req, res, next) => {
  try {
    const body = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      matricule: z.string().min(2),
      levelLabel: z.string().min(1),
      department: z.string().min(1)
    }).parse(req.body);
    const role = await query(`SELECT id FROM roles WHERE name='student'`);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const student = await query(
      `INSERT INTO users (role_id, full_name, email, password_hash, matricule, level_label, department, is_email_verified, is_approved)
       VALUES ($1,$2,LOWER($3),$4,$5,$6,$7,TRUE,TRUE)
       RETURNING id, full_name, email, matricule, level_label, department`,
      [role.rows[0].id, body.fullName, body.email, passwordHash, body.matricule, body.levelLabel, body.department]
    );
    res.status(201).json(student.rows[0]);
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/admin/students/:studentId', requireAuth(['admin']), async (req, res, next) => {
  try {
    const studentId = z.string().uuid().parse(req.params.studentId);
    const result = await query(
      `UPDATE users u
       SET is_disabled=TRUE
       FROM roles r
       WHERE u.id=$1 AND u.role_id=r.id AND r.name='student'
       RETURNING u.id`,
      [studentId]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student deleted.' });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/admin/drivers', requireAuth(['admin']), async (req, res, next) => {
  try {
    const body = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      pickupPointId: z.string().uuid(),
      plateNumber: z.string().min(3),
      color: z.string().min(2),
      capacity: z.coerce.number().int().positive()
    }).parse(req.body);
    const role = await query(`SELECT id FROM roles WHERE name='driver'`);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await query(
      `INSERT INTO users (role_id, full_name, email, password_hash, is_email_verified, is_approved)
       VALUES ($1,$2,LOWER($3),$4,TRUE,TRUE)
       RETURNING id, full_name, email`,
      [role.rows[0].id, body.fullName, body.email, passwordHash]
    );
    const bus = await query(
      `INSERT INTO buses (driver_id, pickup_point_id, plate_number, color, capacity)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, pickup_point_id, plate_number, color, capacity`,
      [user.rows[0].id, body.pickupPointId, body.plateNumber, body.color, body.capacity]
    );
    res.status(201).json({ driver: user.rows[0], bus: bus.rows[0] });
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/admin/drivers/:driverId', requireAuth(['admin']), async (req, res, next) => {
  try {
    const driverId = z.string().uuid().parse(req.params.driverId);
    const driverBuses = await query(`SELECT id FROM buses WHERE driver_id=$1`, [driverId]);
    const result = await query(
      `UPDATE users u
       SET is_disabled=TRUE
       FROM roles r
       WHERE u.id=$1 AND u.role_id=r.id AND r.name='driver'
       RETURNING u.id`,
      [driverId]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Driver not found.' });
    let deletedBuses = 0;
    let unassignedBuses = 0;
    for (const bus of driverBuses.rows) {
      const deleted = await query(
        `DELETE FROM buses b
         WHERE b.id=$1
           AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.bus_id=b.id)
           AND NOT EXISTS (SELECT 1 FROM pickup_rounds pr WHERE pr.bus_id=b.id)
           AND NOT EXISTS (SELECT 1 FROM attendance_logs al WHERE al.bus_id=b.id)
         RETURNING id`,
        [bus.id]
      );
      if (deleted.rowCount) deletedBuses += 1;
    }
    const remaining = await query(`UPDATE buses SET driver_id=NULL, status='idle' WHERE driver_id=$1 RETURNING id`, [driverId]);
    unassignedBuses = remaining.rowCount;
    res.json({ message: 'Driver deleted.', deletedBuses, unassignedBuses });
  } catch (error) {
    next(error);
  }
});
