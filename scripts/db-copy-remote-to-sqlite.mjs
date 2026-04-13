import "./load-env.mjs";
import { createClient } from "@libsql/client";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

const remoteUrl = String(process.env.TURSO_DATABASE_URL || process.env.DATABASE_SOURCE_URL || "").trim();
const remoteAuthToken = String(process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "").trim();
const localFilePath = path.resolve(
  process.cwd(),
  String(process.env.SQLITE_DATABASE_PATH || process.env.LOCAL_SQLITE_PATH || "data/site.db").trim()
);

const overwrite = process.argv.includes("--overwrite");

if (!remoteUrl) {
  throw new Error("Missing remote database URL. Set TURSO_DATABASE_URL or DATABASE_SOURCE_URL.");
}

if (!remoteAuthToken) {
  throw new Error("Missing remote database auth token. Set TURSO_AUTH_TOKEN or LIBSQL_AUTH_TOKEN.");
}

mkdirSync(path.dirname(localFilePath), { recursive: true });

const remote = createClient({
  url: remoteUrl,
  authToken: remoteAuthToken,
});

const local = createClient({
  url: pathToFileURL(localFilePath).href,
});

function quoteIdentifier(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

async function listLocalTables() {
  const result = await local.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `);
  return result.rows.map((row) => String(row.name));
}

async function listRemoteSchemaObjects() {
  const result = await remote.execute(`
    SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
      AND sql IS NOT NULL
    ORDER BY
      CASE type
        WHEN 'table' THEN 0
        WHEN 'index' THEN 1
        WHEN 'trigger' THEN 2
        WHEN 'view' THEN 3
        ELSE 4
      END,
      name ASC
  `);
  return result.rows;
}

async function listRemoteTableNames() {
  const result = await remote.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `);
  return result.rows.map((row) => String(row.name));
}

async function listTableColumns(client, tableName) {
  const result = await client.execute(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
  return result.rows.map((row) => String(row.name));
}

async function ensureEmptyLocalDb() {
  const localTables = await listLocalTables();
  if (!localTables.length) {
    return;
  }
  if (!overwrite) {
    throw new Error(
      `Local SQLite database already has ${localTables.length} table(s) at ${localFilePath}. Re-run with --overwrite to replace it.`
    );
  }
  await local.execute("PRAGMA foreign_keys = OFF");
  for (const tableName of localTables) {
    await local.execute(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`);
  }
  const indexes = await local.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%'
      AND sql IS NOT NULL
  `);
  for (const row of indexes.rows) {
    await local.execute(`DROP INDEX IF EXISTS ${quoteIdentifier(String(row.name))}`);
  }
  const triggers = await local.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'trigger'
      AND name NOT LIKE 'sqlite_%'
  `);
  for (const row of triggers.rows) {
    await local.execute(`DROP TRIGGER IF EXISTS ${quoteIdentifier(String(row.name))}`);
  }
  const views = await local.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'view'
      AND name NOT LIKE 'sqlite_%'
  `);
  for (const row of views.rows) {
    await local.execute(`DROP VIEW IF EXISTS ${quoteIdentifier(String(row.name))}`);
  }
}

async function copyRows(tableName) {
  const columns = await listTableColumns(remote, tableName);
  if (!columns.length) {
    return 0;
  }
  const select = await remote.execute(`SELECT * FROM ${quoteIdentifier(tableName)}`);
  if (!select.rows.length) {
    return 0;
  }
  const placeholders = columns.map(() => "?").join(", ");
  const columnList = columns.map((column) => quoteIdentifier(column)).join(", ");
  const sql = `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) VALUES (${placeholders})`;
  let count = 0;
  for (const row of select.rows) {
    const args = columns.map((column) => row[column]);
    await local.execute({ sql, args });
    count += 1;
  }
  return count;
}

async function main() {
  console.log(`Copying remote database into ${localFilePath}`);
  await ensureEmptyLocalDb();
  await local.execute("PRAGMA foreign_keys = OFF");

  const schemaObjects = await listRemoteSchemaObjects();
  for (const object of schemaObjects) {
    if (!object.sql) {
      continue;
    }
    await local.execute(String(object.sql));
  }

  const tableNames = await listRemoteTableNames();
  for (const tableName of tableNames) {
    const count = await copyRows(tableName);
    console.log(`Copied ${count} row(s) from ${tableName}`);
  }

  const remoteSequenceExists = await remote.execute(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'sqlite_sequence'
  `);
  if (Number(remoteSequenceExists.rows[0]?.count || 0) > 0) {
    const sequences = await remote.execute(`SELECT name, seq FROM sqlite_sequence`);
    for (const row of sequences.rows) {
      await local.execute({
        sql: `INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES (?, ?)`,
        args: [row.name, row.seq],
      });
    }
  }

  await local.execute("PRAGMA foreign_keys = ON");
  console.log(`Remote database copy complete: ${localFilePath}`);
}

try {
  await main();
} finally {
  await Promise.allSettled([remote.close(), local.close()]);
}
