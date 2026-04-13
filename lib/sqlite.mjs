import { createClient } from "@libsql/client";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

let clientInstance = null;

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function resolveSqliteFilePath() {
  const configured =
    String(process.env.SQLITE_DATABASE_PATH || process.env.LOCAL_SQLITE_PATH || "").trim() || "data/site.db";
  return path.resolve(process.cwd(), configured);
}

function fileUrlFromAbsolutePath(filePath) {
  return pathToFileURL(filePath).href;
}

function getConfiguredUrl() {
  const explicitUrl = String(process.env.DATABASE_URL || "").trim();
  if (explicitUrl) {
    return explicitUrl;
  }
  return fileUrlFromAbsolutePath(resolveSqliteFilePath());
}

function isFileUrl(url) {
  return String(url).trim().startsWith("file:");
}

function getAuthTokenForUrl(url) {
  if (isFileUrl(url)) {
    return undefined;
  }
  const token = String(process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "").trim();
  return token || undefined;
}

function describeDb(url) {
  if (isFileUrl(url)) {
    try {
      return fileURLToPath(url);
    } catch {
      return resolveSqliteFilePath();
    }
  }
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname || ""}`;
  } catch {
    return url;
  }
}

function getClientConfig() {
  const url = getConfiguredUrl();
  if (isFileUrl(url)) {
    const filePath = resolveSqliteFilePath();
    ensureParentDir(filePath);
    return { url: fileUrlFromAbsolutePath(filePath) };
  }
  return {
    url,
    authToken: getAuthTokenForUrl(url),
  };
}

export function getDbPathLabel() {
  return describeDb(getConfiguredUrl());
}

export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient(getClientConfig());
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
export const defaultSqliteFilePath = resolveSqliteFilePath();
