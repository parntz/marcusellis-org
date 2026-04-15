import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const serverDir = path.join(rootDir, ".next", "server");
const projectDb = path.join(rootDir, "data", "site.db");
const serverDbDest = path.join(serverDir, "data", "site.db");

// Copy SQLite DB into .next/server so it travels with the deployed build
if (fs.existsSync(projectDb)) {
  const destDir = path.dirname(serverDbDest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(projectDb, serverDbDest);
  console.log(`prune-next-build: copied DB to .next/server/data/site.db`);
} else {
  console.log(`prune-next-build: ${projectDb} not found, skipping DB copy.`);
}

function walk(dirPath, visitor) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath, visitor);
      continue;
    }
    if (entry.isFile()) {
      visitor(entryPath);
    }
  }
}

if (!fs.existsSync(serverDir)) {
  console.log(`prune-next-build: ${serverDir} not found, skipping.`);
  process.exit(0);
}

let removedCount = 0;
let removedBytes = 0;

walk(serverDir, (filePath) => {
  if (!filePath.endsWith(".map")) {
    return;
  }

  const stat = fs.statSync(filePath);
  fs.unlinkSync(filePath);
  removedCount += 1;
  removedBytes += stat.size;
});

const removedMb = (removedBytes / (1024 * 1024)).toFixed(1);
console.log(`prune-next-build: removed ${removedCount} server source map(s), freed ${removedMb} MB.`);
