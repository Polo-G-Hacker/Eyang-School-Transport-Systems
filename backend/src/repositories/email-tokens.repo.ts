import { createHash, randomBytes } from "crypto";
import { query } from "../db/pool";

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface NewToken {
  token: string;        // plain (sent in email)
  token_hash: string;
  expires_at: Date;
}

export function generateToken(ttlMinutes = 60): NewToken {
  const token = randomBytes(24).toString("hex");
  return {
    token,
    token_hash: hash(token),
    expires_at: new Date(Date.now() + ttlMinutes * 60_000),
  };
}

export async function insertToken(userId: string, t: NewToken, purpose: "verify" | "reset" = "verify"): Promise<void> {
  await query(
    `INSERT INTO email_verification_tokens(user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, t.token_hash, purpose, t.expires_at],
  );
}

export async function consumeToken(token: string): Promise<{ user_id: string; purpose: string } | null> {
  const h = hash(token);
  const { rows } = await query<{ id: string; user_id: string; purpose: string }>(
    `UPDATE email_verification_tokens
       SET used_at = NOW()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING id, user_id, purpose`,
    [h],
  );
  return rows[0] ? { user_id: rows[0].user_id, purpose: rows[0].purpose } : null;
}
