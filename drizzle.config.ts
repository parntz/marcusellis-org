import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.LOCAL_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_API_TOKEN;

if (databaseUrl && databaseUrl.startsWith("file:")) {
  throw new Error("Local file SQLite is not supported for this project. Use Turso/libSQL.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl ?? "libsql://placeholder.invalid",
    authToken
  }
});
