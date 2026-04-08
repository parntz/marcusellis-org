import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const serverDir = path.join(rootDir, ".next", "server");

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
