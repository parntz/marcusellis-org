import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const rootDir = process.cwd();
const mirrorDir = path.join(rootDir, "HTML-version");
const runFullPrep = process.env.PREBUILD_FULL === "true";

function isMirrorDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

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

if (runFullPrep) {
  if (!isMirrorDirectory(mirrorDir)) {
    console.error(`prebuild: PREBUILD_FULL=true requires a real HTML-version directory at ${mirrorDir}.`);
    process.exit(1);
  }
  console.log("prebuild: generating site content from HTML-version...");
  runNpmScript("generate:content");
}

console.log("prebuild: ensuring database schema...");
runNpmScript(runFullPrep ? "db:prepare" : "db:init");
