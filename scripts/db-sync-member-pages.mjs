import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const ROOT = process.cwd();
const DOWNLOAD_ROOT = path.join(ROOT, "public", "_downloaded");
const MEMBER_FIELD_MARKER = "field-name-field-contact-information";

const client = getClient();

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS member_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    canonical_url TEXT NOT NULL DEFAULT '',
    published_time TEXT NOT NULL DEFAULT '',
    updated_time TEXT NOT NULL DEFAULT '',
    contact_html TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    personnel_html TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    source_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const upsertSql = `
  INSERT INTO member_pages (
    slug,
    title,
    canonical_url,
    published_time,
    updated_time,
    contact_html,
    description_html,
    personnel_html,
    body_html,
    source_path,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    title=excluded.title,
    canonical_url=excluded.canonical_url,
    published_time=excluded.published_time,
    updated_time=excluded.updated_time,
    contact_html=excluded.contact_html,
    description_html=excluded.description_html,
    personnel_html=excluded.personnel_html,
    body_html=excluded.body_html,
    source_path=excluded.source_path,
    updated_at=datetime('now');
`;

function walkAssets(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAssets(full, files);
    } else if (entry.isFile() && entry.name.endsWith("--asset")) {
      files.push(full);
    }
  }
  return files;
}

function extractMeta(html, property) {
  const re = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function extractLink(html, rel) {
  const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i");
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function extractField(html, fieldClass) {
  const re = new RegExp(
    `<div class="field\\s+${fieldClass}[^>]*>([\\s\\S]*?)</div>\\s*</div>\\s*</div>`,
    "i",
  );
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function extractTitle(html) {
  const match = html.match(/<h1[^>]*id=["']page-title["'][^>]*>([^<]+)<\/h1>/i);
  return match ? match[1].trim() : "";
}

function extractBody(html) {
  const match = html.match(/<div id=["']content["'][^>]*role=["']main["'][^>]*>([\\s\\S]*?)<div id=["']navigation["']/i);
  return match ? match[1].trim() : "";
}

function normalizeSlug(filePath) {
  return path.basename(filePath).replace(/--asset$/, "");
}

const files = walkAssets(DOWNLOAD_ROOT);

let processed = 0;
let kept = 0;

for (const file of files) {
  processed += 1;
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes(MEMBER_FIELD_MARKER)) {
    continue;
  }

  const slug = normalizeSlug(file);
  const title = extractTitle(html) || slug;
  const canonical_url = extractMeta(html, "og:url") || extractLink(html, "canonical");
  const published_time =
    extractMeta(html, "article:published_time") || extractMeta(html, "og:published_time");
  const updated_time =
    extractMeta(html, "article:modified_time") || extractMeta(html, "og:updated_time");

  const contact_html = extractField(html, "field-name-field-contact-information");
  const description_html = extractField(html, "field-name-field-describe-what-you-do-in-10");
  const personnel_html = extractField(html, "field-name-field-personnel-instrumentation");
  const body_html = extractBody(html);

  await client.execute({
    sql: upsertSql,
    args: [
      slug,
      title,
      canonical_url || "",
      published_time || "",
      updated_time || "",
      contact_html || "",
      description_html || "",
      personnel_html || "",
      body_html || "",
      path.relative(ROOT, file),
    ],
  });

  kept += 1;
}

console.log(`Scanned ${processed} downloaded assets; upserted ${kept} member pages into ${dbPath}`);
await closeDb();
