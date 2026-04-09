import fs from "fs";
import path from "path";
import { DEFAULT_SCALES_FORMS_LINKS } from "../lib/scales-forms-links-defaults.mjs";

const ROOT = process.cwd();
const PUBLIC_DOWNLOADED = path.join(ROOT, "public", "_downloaded");
const BACKUP_ROOT = "/Users/paularntz/Desktop/afm2_bkup/HTML-version";
const EXTRA_ASSET_URLS = [
  "https://nashvillemusicians.org/sites/default/files/Media%20Root/300210%20TTCU%20Look%20Services_MAIN.pdf",
  "https://nashvillemusicians.org/sites/default/files/Media%20Root/HUBInstrumentInsurance2024.pdf",
  "https://nashvillemusicians.org/sites/default/files/Media%20Root/257Bylaws2024_0.pdf",
];

function decodedRelativePath(sourceUrl) {
  const url = new URL(sourceUrl);
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

function encodedRelativePath(sourceUrl) {
  const url = new URL(sourceUrl);
  return url.pathname.replace(/^\/+/, "");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function fetchToFile(sourceUrl, destination) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Download failed for ${sourceUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  ensureDir(destination);
  fs.writeFileSync(destination, buffer);
}

let copied = 0;
let downloaded = 0;
let skipped = 0;

for (const sourceUrl of [
  ...DEFAULT_SCALES_FORMS_LINKS.map((item) =>
    `https://nashvillemusicians.org/${String(item.href || "").replace(/^\/_downloaded\//, "")}`
  ).filter(Boolean),
  ...EXTRA_ASSET_URLS,
]) {
  if (!sourceUrl) continue;

  const decodedRel = decodedRelativePath(sourceUrl);
  const encodedRel = encodedRelativePath(sourceUrl);
  const destination = path.join(PUBLIC_DOWNLOADED, decodedRel);
  const backupCandidates = [
    path.join(BACKUP_ROOT, decodedRel),
    path.join(BACKUP_ROOT, encodedRel),
  ];

  if (fs.existsSync(destination)) {
    skipped += 1;
    console.log(`skip ${decodedRel}`);
    continue;
  }

  const backupPath = backupCandidates.find((candidate) => fs.existsSync(candidate));
  if (backupPath) {
    ensureDir(destination);
    fs.copyFileSync(backupPath, destination);
    copied += 1;
    console.log(`copy ${decodedRel}`);
    continue;
  }

  await fetchToFile(sourceUrl, destination);
  downloaded += 1;
  console.log(`get  ${decodedRel}`);
}

console.log(`scales-forms assets ready: ${skipped} existing, ${copied} copied from backup, ${downloaded} downloaded.`);
