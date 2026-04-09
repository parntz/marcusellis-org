import { createClient } from "@libsql/client/web";

let clientInstance = null;

/**
 * Single database path: Turso (remote LibSQL) only.
 * Never local `file:` SQLite, embedded DBs, or other vendors — enforced below.
 */
function assertTursoOnlyUrl(url) {
  const trimmed = String(url).trim();
  let u;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error("TURSO_DATABASE_URL must be a valid URL (e.g. libsql://your-db-org.turso.io).");
  }
  if (u.protocol === "file:") {
    throw new Error(
      "Local file databases (file:) are not supported. Use Turso for both dev and production (libsql://…)."
    );
  }
  if (u.protocol !== "libsql:") {
    throw new Error(
      `Unsupported TURSO_DATABASE_URL protocol "${u.protocol}". This site uses Turso only — use a libsql:// URL from the Turso dashboard.`
    );
  }
}

function getRequiredTursoUrl() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("TURSO_DATABASE_URL is required (Turso). No other database is configured.");
  }
  assertTursoOnlyUrl(url);
  return url.trim();
}

export function getDbPathLabel() {
  const url = getRequiredTursoUrl();
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname || ""}`;
  } catch {
    return "turso";
  }
}

function getDbUrl() {
  return getRequiredTursoUrl();
}

function getRequiredTursoAuthToken() {
  const token = String(process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "").trim();
  if (!token) {
    throw new Error(
      "TURSO_AUTH_TOKEN is required (Turso remote LibSQL). Local SQLite and tokenless file DBs are not supported."
    );
  }
  return token;
}

export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient({
      url: getDbUrl(),
      authToken: getRequiredTursoAuthToken(),
    });
  }
  return clientInstance;
}

export async function closeDb() {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }
}

export const dbPath = getDbPathLabel();
