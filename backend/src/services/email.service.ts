import * as nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
});

export async function sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
  const link = `${env.appBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#2563EB;">Welcome to ESTS Transport</h2>
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Please confirm your email address by clicking the button below. The link expires in 60 minutes.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${link}" style="background:#2563EB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
          Verify my email
        </a>
      </p>
      <p>Or copy this link: <br><a href="${link}">${link}</a></p>
      <hr>
      <p style="color:#64748B;font-size:12px;">Saint Jean Ingénieur • Eyang School Transport System</p>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Verify your ESTS Transport account",
      text: `Hi ${fullName}, verify your email: ${link}`,
      html,
    });
    logger.info("email:sent", { to, kind: "verify" });
  } catch (err) {
    logger.error("email:failed", { to, err: (err as Error).message });
    // We don't throw — auth/registration should succeed even if SMTP is down.
    // In dev, MailHog catches it; in prod, swap for a retry queue.
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}
