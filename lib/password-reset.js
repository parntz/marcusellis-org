import { createHash, randomBytes } from "node:crypto";
import { getClient } from "./sqlite.mjs";
import {
  findAuthUserByIdentifier,
  updateAuthUserPasswordById,
  validatePassword,
} from "./auth-users";

const PASSWORD_RESET_TTL_MINUTES = 60;

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function expiresAtIso() {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function createPasswordResetToken(email = "") {
  const user = await findAuthUserByIdentifier(String(email || "").trim().toLowerCase());
  if (!user?.id || !user?.email) {
    return null;
  }

  const client = getClient();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await client.execute({
    sql: `
      DELETE FROM auth_password_reset_tokens
      WHERE auth_user_id = ?
         OR (used_at IS NOT NULL AND TRIM(used_at) != '')
         OR expires_at <= datetime('now')
    `,
    args: [Number(user.id)],
  });

  await client.execute({
    sql: `
      INSERT INTO auth_password_reset_tokens (auth_user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `,
    args: [Number(user.id), tokenHash, expiresAtIso()],
  });

  return {
    token,
    email: user.email,
    username: user.username,
  };
}

export async function consumePasswordResetToken(token = "", password = "") {
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return { ok: false, error: passwordCheck.message };
  }

  const client = getClient();
  const tokenHash = hashToken(token);
  const rs = await client.execute({
    sql: `
      SELECT id, auth_user_id AS authUserId
      FROM auth_password_reset_tokens
      WHERE token_hash = ?
        AND (used_at IS NULL OR TRIM(used_at) = '')
        AND expires_at > datetime('now')
      LIMIT 1
    `,
    args: [tokenHash],
  });

  const row = rs.rows?.[0];
  if (!row?.id || !row?.authUserId) {
    return { ok: false, error: "That reset link is invalid or has expired." };
  }

  await updateAuthUserPasswordById(row.authUserId, password);
  await client.execute({
    sql: `
      UPDATE auth_password_reset_tokens
      SET used_at = datetime('now')
      WHERE id = ?
    `,
    args: [Number(row.id)],
  });

  return { ok: true };
}
