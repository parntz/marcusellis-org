import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const rootDir = process.cwd();
const generatedFile = path.join(rootDir, "content", "generated", "site-data.generated.js");
const databaseFile = path.join(rootDir, "data", "app.db");
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

if (runFullPrep || !fs.existsSync(generatedFile)) {
  console.log("predev: generating site content...");
  runNpmScript("generate:content");
} else {
  console.log("predev: site content already generated (skipping).");
}

if (runFullPrep || !fs.existsSync(databaseFile)) {
  console.log("predev: preparing SQLite database...");
  runNpmScript("db:prepare");
} else {
  console.log("predev: SQLite database already exists (skipping).");
}
