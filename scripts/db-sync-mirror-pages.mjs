import "./load-env.mjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { closeDb, getClient, dbPath } from "../lib/sqlite.mjs";

const ROOT = process.cwd();
const generatedDataFile = path.join(ROOT, "content", "generated", "site-data.generated.js");
const BATCH_SIZE = Math.max(1, Number.parseInt(process.env.MIRROR_SYNC_BATCH_SIZE || "50", 10) || 50);
const CONTENT_HASH_KEY = "mirror_pages_content_hash";

function extractPagesJson(source) {
  const startToken = "export const pages = ";
  const endToken = "\n\nexport const pageMap =";
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate pages export in generated site data.");
  }
  return source.slice(start + startToken.length, end).trim().replace(/;$/, "");
}

/** Mirror pages rendered via `app/[...slug]` (not news/events/member-pages). */
function shouldSyncMirrorPageContent(p) {
  if (p.kind !== "mirror-page") return false;
  if (p.route === "/") return false;
  if (p.route.startsWith("/news-and-events")) return false;
  if (p.route.startsWith("/event/")) return false;
  if (p.route === "/member-pages" || p.route.startsWith("/member-pages/")) return false;
  return true;
}

function hashMirrorPages(pages) {
  const normalized = pages.map((page) => ({
    route: page.route || "",
    title: page.title || "",
    summary: page.summary || "",
    metaDescription: page.metaDescription || "",
    bodyHtml: page.bodyHtml || "",
  }));

  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function chunkItems(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

if (!fs.existsSync(generatedDataFile)) {
  throw new Error(`Generated site data not found at ${generatedDataFile}`);
}

const generatedSource = fs.readFileSync(generatedDataFile, "utf8");
const pages = JSON.parse(extractPagesJson(generatedSource));
const mirrorPages = pages.filter(shouldSyncMirrorPageContent);
const contentHash = hashMirrorPages(mirrorPages);

const client = getClient();

const upsertSql = `
  INSERT INTO mirror_page_content (route, title, summary, meta_description, body_html, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(route) DO UPDATE SET
    title=excluded.title,
    summary=excluded.summary,
    meta_description=excluded.meta_description,
    body_html=excluded.body_html,
    updated_at=datetime('now')
`;

const startedAt = Date.now();
const existingHashResult = await client.execute({
  sql: `SELECT value FROM site_config WHERE key = ? LIMIT 1`,
  args: [CONTENT_HASH_KEY],
});
const existingHash = String(existingHashResult.rows?.[0]?.value || "");

if (existingHash && existingHash === contentHash) {
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `Mirror pages unchanged (${mirrorPages.length} routes, hash match). Skipping sync at ${dbPath} in ${elapsedSeconds}s.`
  );
  await closeDb();
  process.exit(0);
}

console.log(
  `Syncing ${mirrorPages.length} mirror pages into mirror_page_content at ${dbPath} in batches of ${BATCH_SIZE}...`
);

const batches = chunkItems(mirrorPages, BATCH_SIZE);
let synced = 0;

for (const [index, batch] of batches.entries()) {
  await client.batch(
    batch.map((page) => ({
      sql: upsertSql,
      args: [
        page.route,
        page.title || "",
        page.summary || "",
        page.metaDescription || "",
        page.bodyHtml || "",
      ],
    })),
    "write"
  );

  synced += batch.length;
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Mirror pages: ${synced}/${mirrorPages.length} synced (${index + 1}/${batches.length} batches, ${elapsedSeconds}s elapsed)`);
}

await client.execute({
  sql: `
    INSERT INTO site_config (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value=excluded.value,
      updated_at=datetime('now')
  `,
  args: [CONTENT_HASH_KEY, contentHash],
});

const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`Synced ${synced} mirror pages (catch-all) into mirror_page_content at ${dbPath} in ${elapsedSeconds}s`);
await closeDb();
