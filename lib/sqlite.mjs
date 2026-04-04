import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createClient } from "@libsql/client";

let clientInstance = null;

function fileUrlForPath(absolutePath) {
  return pathToFileURL(absolutePath).href;
}

/** Resolved path for logging (file DB) or label for remote Turso. */
export function getDbPathLabel() {
  if (process.env.TURSO_DATABASE_URL) {
    try {
      const u = new URL(process.env.TURSO_DATABASE_URL);
      return `${u.protocol}//${u.host}${u.pathname || ""}`;
    } catch {
      return "turso";
    }
  }
  if (process.env.SQLITE_DB_PATH) {
    return path.resolve(process.env.SQLITE_DB_PATH);
  }
  return path.join(process.cwd(), "data", "app.db");
}

function getDbUrl() {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  if (process.env.SQLITE_DB_PATH) {
    const resolved = path.resolve(process.env.SQLITE_DB_PATH);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    return fileUrlForPath(resolved);
  }
  const defaultPath = path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(defaultPath), { recursive: true });
  return fileUrlForPath(defaultPath);
}

export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient({
      url: getDbUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
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
