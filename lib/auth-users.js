import bcrypt from "bcryptjs";
import { getClient } from "./sqlite.mjs";

function slugifyUsername(input = "") {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

async function nextAvailableUsername(base) {
  const client = getClient();
  let candidate = base || "member";
  let suffix = 1;

  while (true) {
    const rs = await client.execute({
      sql: "SELECT id FROM auth_users WHERE username = ? LIMIT 1",
      args: [candidate],
    });
    if (rs.rows.length === 0) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base || "member"}-${suffix}`;
  }
}

export async function findAuthUserByIdentifier(identifier = "") {
  const client = getClient();
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const rs = await client.execute({
    sql: `
    SELECT id, username, email, password_hash AS passwordHash, google_sub AS googleSub
    FROM auth_users
    WHERE lower(email) = ? OR lower(username) = ?
    LIMIT 1
  `,
    args: [normalized, normalized],
  });

  const row = rs.rows[0];
  return row
    ? {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.passwordHash,
        googleSub: row.googleSub,
      }
    : null;
}

export async function createAuthUser({ username, email, password }) {
  const client = getClient();
  const normalizedEmail = email.trim().toLowerCase();
  const requestedUsername = slugifyUsername(username || normalizedEmail.split("@")[0] || "member");
  const safeUsername = await nextAvailableUsername(requestedUsername);
  const passwordHash = bcrypt.hashSync(password, 12);

  const rs = await client.execute({
    sql: `
    INSERT INTO auth_users (username, email, password_hash)
    VALUES (?, ?, ?)
  `,
    args: [safeUsername, normalizedEmail, passwordHash],
  });

  const lastId = rs.lastInsertRowid;
  return {
    id: String(lastId != null ? lastId : ""),
    username: safeUsername,
    email: normalizedEmail,
  };
}

export function validatePassword(password, minLength = 12) {
  if (typeof password !== "string" || password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters.` };
  }

  if (/\s/.test(password)) {
    return { valid: false, message: "Password cannot contain spaces." };
  }

  const checks = [
    [/[a-z]/, "Include at least one lowercase letter."],
    [/[A-Z]/, "Include at least one uppercase letter."],
    [/[0-9]/, "Include at least one number."],
    [/[^A-Za-z0-9]/, "Include at least one symbol."],
  ];

  for (const [pattern, message] of checks) {
    if (!pattern.test(password)) {
      return { valid: false, message };
    }
  }

  return { valid: true, message: "" };
}

export function verifyUserPassword(user, password) {
  if (!user?.passwordHash) {
    return false;
  }

  return bcrypt.compareSync(password, user.passwordHash);
}

export async function upsertGoogleAuthUser({ email, name, googleSub }) {
  const client = getClient();
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !googleSub) {
    return null;
  }

  const existingRs = await client.execute({
    sql: `
    SELECT id, username, email
    FROM auth_users
    WHERE lower(email) = ?
    LIMIT 1
  `,
    args: [normalizedEmail],
  });

  const existing = existingRs.rows[0];

  if (existing) {
    await client.execute({
      sql: `
      UPDATE auth_users
      SET google_sub = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      args: [googleSub, existing.id],
    });

    return {
      id: String(existing.id),
      username: existing.username,
      email: existing.email,
    };
  }

  const baseUsername = slugifyUsername(name || normalizedEmail.split("@")[0] || "member");
  const safeUsername = await nextAvailableUsername(baseUsername);

  const insertRs = await client.execute({
    sql: `
    INSERT INTO auth_users (username, email, google_sub)
    VALUES (?, ?, ?)
  `,
    args: [safeUsername, normalizedEmail, googleSub],
  });

  const lastId = insertRs.lastInsertRowid;
  return {
    id: String(lastId != null ? lastId : ""),
    username: safeUsername,
    email: normalizedEmail,
  };
}
