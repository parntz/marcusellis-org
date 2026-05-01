import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? process.env.LOCAL_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const hasDatabaseEnv = Boolean(url && !url.startsWith("file:") && authToken);

export function getDb() {
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required.");
  }

  if (url.startsWith("file:")) {
    throw new Error("Local file SQLite is not supported. Configure Turso/libSQL.");
  }

  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required.");
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
