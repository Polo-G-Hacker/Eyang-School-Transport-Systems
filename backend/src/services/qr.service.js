import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { query } from '../db.js';

export async function generateMonthlyQr(studentId, monthKey) {
  const payment = await query(
    `SELECT id, status FROM payments WHERE student_id=$1 AND month_key=$2`,
    [studentId, monthKey]
  );
  if (!payment.rowCount || payment.rows[0].status !== 'validated') {
    throw Object.assign(new Error('Payment is not active'), { status: 409 });
  }
  const user = await query('SELECT full_name, matricule FROM users WHERE id=$1', [studentId]);
  const jti = uuid();
  const payload = {
    sub: studentId,
    typ: 'monthly_bus_pass',
    month: monthKey,
    payment: 'validated',
    jti
  };
  const expiresAt = new Date(`${monthKey}-01T00:00:00.000Z`);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
  const token = jwt.sign(payload, config.qrSecret, { expiresIn: Math.ceil((expiresAt - Date.now()) / 1000) });
  await query(
    `INSERT INTO qr_codes (student_id, payment_id, month_key, jwt, jti, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (student_id, month_key)
     DO UPDATE SET jwt=EXCLUDED.jwt, jti=EXCLUDED.jti, expires_at=EXCLUDED.expires_at, revoked_at=NULL
     RETURNING id`,
    [studentId, payment.rows[0].id, monthKey, token, jti, expiresAt]
  );
  return {
    token,
    imageDataUrl: await QRCode.toDataURL(token, { errorCorrectionLevel: 'M', margin: 2 }),
    student: user.rows[0],
    monthKey,
    expiresAt
  };
}

export async function validateQrForBoarding({ token, roundId, busId, offline = false }) {
  let payload;
  try {
    payload = jwt.verify(token, config.qrSecret);
  } catch {
    return { valid: false, reason: 'QR is invalid or expired' };
  }
  const qr = await query(
    `SELECT q.id, q.revoked_at, p.status payment_status
     FROM qr_codes q JOIN payments p ON p.id=q.payment_id
     WHERE q.jti=$1 AND q.student_id=$2 AND q.month_key=$3`,
    [payload.jti, payload.sub, payload.month]
  );
  const reservation = await query(
    `SELECT r.id, u.full_name, b.plate_number
     FROM reservations r
     JOIN users u ON u.id=r.student_id
     JOIN buses b ON b.id=r.bus_id
     WHERE r.student_id=$1 AND r.month_key=$2 AND r.bus_id=$3 AND r.status='confirmed'`,
    [payload.sub, payload.month, busId]
  );
  if (!qr.rowCount || qr.rows[0].revoked_at) return { valid: false, reason: 'QR pass not recognized' };
  if (qr.rows[0].payment_status !== 'validated') return { valid: false, reason: 'Payment is not active' };
  if (!reservation.rowCount) return { valid: false, reason: 'Student has no reservation on this bus' };
  try {
    await query(
      `INSERT INTO attendance_logs (round_id, student_id, qr_code_id, bus_id, status, synced_from_device)
       VALUES ($1,$2,$3,$4,'boarded',$5)`,
      [roundId, payload.sub, qr.rows[0].id, busId, offline]
    );
  } catch {
    return { valid: false, reason: 'Student already boarded this trip' };
  }
  return {
    valid: true,
    studentId: payload.sub,
    studentName: reservation.rows[0].full_name,
    busPlate: reservation.rows[0].plate_number,
    monthKey: payload.month
  };
}
