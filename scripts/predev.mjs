import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const rootDir = process.cwd();
const generatedFile = path.join(rootDir, "content", "generated", "site-data.generated.js");
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
        AND name IN ('news_events_items', 'news_event_pages', 'mirror_page_content')
    `);
    return new Set(rs.rows.map((row) => row.name)).size === 2;
  } catch {
    return false;
  } finally {
    await closeDb();
  }
}

if (runFullPrep || !fs.existsSync(generatedFile)) {
  console.log("predev: generating site content...");
  runNpmScript("generate:content");
} else {
  console.log("predev: site content already generated (skipping).");
}

if (runFullPrep || !(await hasRequiredDbTables())) {
  console.log(`predev: preparing database at ${dbPath}...`);
  runNpmScript("db:prepare");
} else {
  console.log(`predev: database at ${dbPath} already has required tables (skipping).`);
}
