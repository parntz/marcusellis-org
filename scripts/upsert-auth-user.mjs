import "./load-env.mjs";
import bcrypt from "bcryptjs";
import { closeDb, getClient } from "../lib/sqlite.mjs";

function usage() {
  console.error("Usage: node scripts/upsert-auth-user.mjs <username> <email> <password> [previousUsername] [previousEmail]");
  process.exit(1);
}

const [usernameArg, emailArg, passwordArg, previousUsernameArg = "", previousEmailArg = ""] = process.argv.slice(2);

if (!usernameArg || !emailArg || !passwordArg) {
  usage();
}

const username = String(usernameArg).trim().toLowerCase();
const email = String(emailArg).trim().toLowerCase();
const previousUsername = String(previousUsernameArg).trim().toLowerCase();
const previousEmail = String(previousEmailArg).trim().toLowerCase();
const normalizedPassword = String(passwordArg).toLowerCase();
const passwordHash = bcrypt.hashSync(normalizedPassword, 12);

const client = getClient();

const current = await client.execute({
  sql: "SELECT id FROM auth_users WHERE lower(username) = ? OR lower(email) = ? LIMIT 1",
  args: [username, email],
});

let targetId = current.rows[0]?.id ?? null;

if (!targetId && (previousUsername || previousEmail)) {
  const previous = await client.execute({
    sql: "SELECT id FROM auth_users WHERE lower(username) = ? OR lower(email) = ? LIMIT 1",
    args: [previousUsername || "__missing__", previousEmail || "__missing__"],
  });
  targetId = previous.rows[0]?.id ?? null;
}

if (targetId) {
  await client.execute({
    sql: `
      UPDATE auth_users
      SET username = ?, email = ?, password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [username, email, passwordHash, targetId],
  });
  console.log(`Updated auth user ${targetId} -> ${username}`);
} else {
  const inserted = await client.execute({
    sql: "INSERT INTO auth_users (username, email, password_hash) VALUES (?, ?, ?)",
    args: [username, email, passwordHash],
  });
  console.log(`Created auth user ${String(inserted.lastInsertRowid ?? "")} -> ${username}`);
}

await closeDb();
