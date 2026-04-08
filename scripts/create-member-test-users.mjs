import "./load-env.mjs";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { closeDb, getClient } from "../lib/sqlite.mjs";

const countArg = Number(process.argv[2] || 3);
const count = Number.isFinite(countArg) && countArg > 0 ? Math.min(12, Math.floor(countArg)) : 3;

function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function randomSuffix(size = 3) {
  return randomBytes(size).toString("hex");
}

function randomPassword() {
  return `Afm!${randomSuffix(3)}${randomSuffix(2).toUpperCase()}9`;
}

function normalizePasswordForAuth(input = "") {
  return String(input).toLowerCase();
}

const client = getClient();
const rs = await client.execute({
  sql: `
    SELECT mp.id, mp.slug, mp.title
    FROM member_pages mp
    LEFT JOIN auth_users au ON au.member_page_id = mp.id
    WHERE au.id IS NULL
    ORDER BY mp.title ASC
    LIMIT ?
  `,
  args: [count],
});

if (!rs.rows.length) {
  console.log("No unassigned member profiles were found.");
  await closeDb();
  process.exit(0);
}

const created = [];

for (const row of rs.rows) {
  const base = slugify(row.slug || row.title || "member");
  const suffix = randomSuffix(2);
  const username = `${base}-${suffix}`.slice(0, 32);
  const email = `${base}-${suffix}@member.test`;
  const password = randomPassword();
  const passwordHash = bcrypt.hashSync(normalizePasswordForAuth(password), 12);
  const inserted = await client.execute({
    sql: `
      INSERT INTO auth_users (username, email, password_hash, role, member_page_id)
      VALUES (?, ?, ?, 'member', ?)
    `,
    args: [username, email, passwordHash, Number(row.id)],
  });
  const userId = String(inserted.lastInsertRowid ?? "");

  created.push({
    userId,
    title: String(row.title || ""),
    slug: String(row.slug || ""),
    username,
    email,
    password,
  });
}

for (const item of created) {
  console.log(`${item.title} | /users/${item.slug} | ${item.username} | ${item.email} | ${item.password}`);
}

await closeDb();
