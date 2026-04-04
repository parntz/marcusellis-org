import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const rootDir = process.cwd();
const mirrorDir = path.join(rootDir, "HTML-version");
const generatedFile = path.join(rootDir, "content", "generated", "site-data.generated.js");

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

if (isMirrorDirectory(mirrorDir)) {
  console.log("prebuild: generating site content from HTML-version...");
  runNpmScript("generate:content");
} else {
  if (fs.existsSync(mirrorDir)) {
    console.warn(
      `prebuild: ${mirrorDir} exists but is not a directory (file or bad symlink). Remove or replace it with the real mirror folder. Using committed site data if present.`
    );
  } else {
    console.log(
      "prebuild: HTML-version not in checkout; using committed content/generated/site-data.generated.js (e.g. Netlify CI)."
    );
  }
  if (!fs.existsSync(generatedFile)) {
    console.error(
      `prebuild: No usable mirror and ${generatedFile} is missing. Add a real HTML-version directory or commit generated site data.`
    );
    process.exit(1);
  }
}

console.log("prebuild: preparing database...");
runNpmScript("db:prepare");
