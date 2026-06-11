import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { query } from '../db.js';
import { createPasswordResetToken, createVerification, hashToken, sendPasswordResetEmail, sendVerificationEmail } from '../services/mail.service.js';

export const authRouter = express.Router();

authRouter.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    const tokenHash = hashToken(token);
    const found = await query(
      `UPDATE email_verification_tokens
       SET used_at=NOW()
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );
    if (!found.rowCount) return res.status(400).json({ message: 'Invalid or expired verification token.' });
    await query('UPDATE users SET is_email_verified=TRUE WHERE id=$1', [found.rows[0].user_id]);
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
});


authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await query('SELECT id, email FROM users WHERE email=LOWER($1)', [email]);

    if (user.rowCount) {
      const token = await createPasswordResetToken(user.rows[0].id);
      await sendPasswordResetEmail(user.rows[0].email, token);
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8)
    }).parse(req.body);

    const tokenHash = hashToken(token);
    const found = await query(
      `UPDATE password_reset_tokens
       SET used_at=NOW()
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );

    if (!found.rowCount) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, found.rows[0].user_id]);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
});


authRouter.post('/register', async (req, res, next) => {
  try {
    const body = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(['student', 'driver']).default('student'),
      matricule: z.string().optional(),
      levelLabel: z.string().optional(),
      department: z.string().optional()
    }).parse(req.body);
    const role = await query('SELECT id FROM roles WHERE name=$1', [body.role]);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await query(
      `INSERT INTO users (role_id, full_name, email, password_hash, matricule, level_label, department)
       VALUES ($1,$2,LOWER($3),$4,$5,$6,$7)
       RETURNING id, email`,
      [role.rows[0].id, body.fullName, body.email, passwordHash, body.matricule, body.levelLabel, body.department]
    );
    const token = await createVerification(user.rows[0].id);
    await sendVerificationEmail(user.rows[0].email, token);
    res.status(201).json({ message: 'Account created. Please check your email to verify your account.', userId: user.rows[0].id });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.photo_data_url, u.is_disabled, u.is_approved,
              u.is_email_verified, r.name role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=LOWER($1)`,
      [body.email]
    );
    if (!result.rowCount) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    if (user.is_disabled || !user.is_approved) return res.status(403).json({ message: 'Account disabled or not approved' });
    if (!(await bcrypt.compare(body.password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, emailVerified: user.is_email_verified, photoDataUrl: user.photo_data_url }
    });
  } catch (error) {
    next(error);
  }
});
