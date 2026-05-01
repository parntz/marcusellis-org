import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.LOCAL_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is required for Drizzle commands.");
}

if (databaseUrl.startsWith("file:")) {
  throw new Error("Local file SQLite is not supported for this project. Use Turso/libSQL.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN
  }
});
