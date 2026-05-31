import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { query } from '../db.js';
import { createVerification, hashToken, sendVerificationEmail } from '../services/mail.service.js';

export const authRouter = express.Router();

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
    res.status(201).json({ message: 'Account created. Check email for verification.', userId: user.rows[0].id });
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

authRouter.post('/verify-email', async (req, res, next) => {
  try {
    const tokenHash = hashToken(String(req.body.token || ''));
    const found = await query(
      `UPDATE email_verification_tokens
       SET used_at=NOW()
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );
    if (!found.rowCount) return res.status(400).json({ message: 'Invalid or expired token' });
    await query('UPDATE users SET is_email_verified=TRUE WHERE id=$1', [found.rows[0].user_id]);
    res.json({ message: 'Email verified' });
  } catch (error) {
    next(error);
  }
});
