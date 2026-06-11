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

export async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [userId, hashToken(token)]
  );
  return token;
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${config.appUrl}/reset-password?token=${token}`;
  if (!config.mail.host) {
    console.log(`Password reset for ${email}: ${resetUrl}`);
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
    subject: 'Reset your Eyang transport password',
    text: `You requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`
  });
}

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${config.appUrl}/verify-email?token=${token}`;
  if (!config.mail.host) {
    console.log(`Email verification for ${email}: ${verifyUrl}`);
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
    text: `Welcome! Please click the link below to verify your email address and activate your account:\n\n${verifyUrl}\n\nIf you did not create an account, please ignore this email.`
  });
}
