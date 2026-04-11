import bcrypt from "bcryptjs";
import { getClient } from "./sqlite.mjs";
import { RESERVED_ADMIN_ACCOUNTS, getReservedAdminAccount } from "./reserved-admins";

function slugifyUsername(input = "") {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function normalizePasswordForAuth(input = "") {
  return String(input).toLowerCase();
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

function normalizeRole(input = "") {
  return String(input || "").trim().toLowerCase() === "admin" ? "admin" : "member";
}

function hashPassword(password = "") {
  return bcrypt.hashSync(normalizePasswordForAuth(password), 12);
}

function mapAuthUserRow(row) {
  return row
    ? {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.passwordHash,
        googleSub: row.googleSub,
        role: normalizeRole(row.role),
        memberPageId: row.memberPageId == null ? null : String(row.memberPageId),
        memberPageSlug: row.memberPageSlug ? String(row.memberPageSlug) : "",
      }
    : null;
}

export async function findAuthUserByIdentifier(identifier = "") {
  const client = getClient();
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const rs = await client.execute({
    sql: `
    SELECT
      u.id,
      u.username,
      u.email,
      u.password_hash AS passwordHash,
      u.google_sub AS googleSub,
      u.role,
      u.member_page_id AS memberPageId,
      mp.slug AS memberPageSlug
    FROM auth_users u
    LEFT JOIN member_pages mp ON mp.id = u.member_page_id
    WHERE lower(email) = ? OR lower(username) = ?
    LIMIT 1
  `,
    args: [normalized, normalized],
  });

  return mapAuthUserRow(rs.rows[0]);
}

export async function createAuthUser({ username, email, password, role = "member", memberPageId = null }) {
  const client = getClient();
  const normalizedEmail = email.trim().toLowerCase();
  const requestedUsername = slugifyUsername(username || normalizedEmail.split("@")[0] || "member");
  const safeUsername = await nextAvailableUsername(requestedUsername);
  const passwordHash = hashPassword(password);
  const normalizedRole = normalizeRole(role);

  const rs = await client.execute({
    sql: `
    INSERT INTO auth_users (username, email, password_hash, role, member_page_id)
    VALUES (?, ?, ?, ?, ?)
  `,
    args: [safeUsername, normalizedEmail, passwordHash, normalizedRole, memberPageId],
  });

  const lastId = rs.lastInsertRowid;
  return {
    id: String(lastId != null ? lastId : ""),
    username: safeUsername,
    email: normalizedEmail,
    role: normalizedRole,
    memberPageId: memberPageId == null ? null : String(memberPageId),
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
    [/[A-Za-z]/, "Include at least one letter."],
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
  const reserved = getReservedAdminAccount(user?.username || user?.email || "");
  if (reserved && String(password || "") === reserved.password) {
    return true;
  }

  if (!user?.passwordHash) {
    return false;
  }

  const normalizedPassword = normalizePasswordForAuth(password);
  return (
    bcrypt.compareSync(normalizedPassword, user.passwordHash) ||
    bcrypt.compareSync(String(password || ""), user.passwordHash)
  );
}

export async function upsertGoogleAuthUser({ email, name, googleSub }) {
  const client = getClient();
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !googleSub) {
    return null;
  }

  const existingRs = await client.execute({
    sql: `
    SELECT
      u.id,
      u.username,
      u.email,
      u.role,
      u.member_page_id AS memberPageId,
      mp.slug AS memberPageSlug
    FROM auth_users u
    LEFT JOIN member_pages mp ON mp.id = u.member_page_id
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
      role: normalizeRole(existing.role),
      memberPageId: existing.memberPageId == null ? null : String(existing.memberPageId),
      memberPageSlug: existing.memberPageSlug ? String(existing.memberPageSlug) : "",
    };
  }

  const baseUsername = slugifyUsername(name || normalizedEmail.split("@")[0] || "member");
  const safeUsername = await nextAvailableUsername(baseUsername);

  const insertRs = await client.execute({
    sql: `
    INSERT INTO auth_users (username, email, google_sub, role)
    VALUES (?, ?, ?, 'member')
  `,
    args: [safeUsername, normalizedEmail, googleSub],
  });

  const lastId = insertRs.lastInsertRowid;
  return {
    id: String(lastId != null ? lastId : ""),
    username: safeUsername,
    email: normalizedEmail,
    role: "member",
    memberPageId: null,
    memberPageSlug: "",
  };
}

export async function findAuthUserById(id) {
  const client = getClient();
  const normalizedId = Number(id);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  const rs = await client.execute({
    sql: `
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash AS passwordHash,
        u.google_sub AS googleSub,
        u.role,
        u.member_page_id AS memberPageId,
        mp.slug AS memberPageSlug
      FROM auth_users u
      LEFT JOIN member_pages mp ON mp.id = u.member_page_id
      WHERE u.id = ?
      LIMIT 1
    `,
    args: [normalizedId],
  });

  return mapAuthUserRow(rs.rows[0]);
}

export async function ensureReservedAdminUsers() {
  const client = getClient();

  for (const account of RESERVED_ADMIN_ACCOUNTS) {
    const existing = await client.execute({
      sql: `
        SELECT id
        FROM auth_users
        WHERE lower(username) = ? OR lower(email) = ?
        LIMIT 1
      `,
      args: [account.username, account.email],
    });

    const passwordHash = hashPassword(account.password);

    if (existing.rows[0]?.id) {
      await client.execute({
        sql: `
          UPDATE auth_users
          SET username = ?, email = ?, password_hash = ?, role = 'admin', updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [account.username, account.email, passwordHash, existing.rows[0].id],
      });
      continue;
    }

    await client.execute({
      sql: `
        INSERT INTO auth_users (username, email, password_hash, role)
        VALUES (?, ?, ?, 'admin')
      `,
      args: [account.username, account.email, passwordHash],
    });
  }
}
