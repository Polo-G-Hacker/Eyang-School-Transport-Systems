import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { query } from '../db.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createVerification(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [userId, hashToken(token)]
  );
  return token;
}

export async function sendVerificationEmail(email, token) {
  if (!config.mail.host) {
    console.log(`Email verification for ${email}: ${config.appUrl}/verify-email?token=${token}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined
  });
  await transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Verify your Eyang transport account',
    text: `Open this link to verify your account: ${config.appUrl}/verify-email?token=${token}`
  });
}
