import "./load-env.mjs";
import { spawnSync } from "child_process";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const rootDir = process.cwd();
const runFullPrep = process.env.PREDEV_FULL === "true";

function runNpmScript(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    stdio: "inherit",
    cwd: rootDir,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

async function hasRequiredDbTables() {
  const client = getClient();

  try {
    const rs = await client.execute(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('news_events_items', 'news_event_pages', 'site_pages')
    `);
    return new Set(rs.rows.map((row) => row.name)).size === 3;
  } catch {
    return false;
  } finally {
    await closeDb();
  }
}

if (runFullPrep) {
  console.log("predev: generating site content...");
  runNpmScript("generate:content");
} else {
  console.log("predev: using Turso-backed site content (skipping generated export).");
}

if (runFullPrep || !(await hasRequiredDbTables())) {
  console.log(`predev: ensuring Turso schema at ${dbPath}...`);
  runNpmScript(runFullPrep ? "db:prepare" : "db:init");
} else {
  console.log(`predev: Turso at ${dbPath} already has required tables (skipping).`);
}
