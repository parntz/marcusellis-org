import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient, dbPath } from "../lib/sqlite.mjs";

const ROOT = process.cwd();
const generatedDataFile = path.join(ROOT, "content", "generated", "site-data.generated.js");

function extractPagesJson(source) {
  const startToken = "export const pages = ";
  const endToken = "\n\nexport const siteMeta =";
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate pages export in generated site data.");
  }
  return source.slice(start + startToken.length, end).trim().replace(/;$/, "");
}

function shouldSyncSitePage(page) {
  if (!page?.route || !page?.kind) return false;
  if (!["mirror-page", "asset-index", "asset-group"].includes(page.kind)) return false;
  if (page.route === "/member-pages" || page.route.startsWith("/member-pages/")) return false;
  if (page.route.startsWith("/users/") || page.route.startsWith("/user/")) return false;
  if (page.route === "/news-and-events" || page.route.startsWith("/news-and-events/")) return false;
  if (page.route.startsWith("/event/")) return false;
  return true;
}

if (!fs.existsSync(generatedDataFile)) {
  throw new Error(`Generated site data not found at ${generatedDataFile}`);
}

const pages = JSON.parse(extractPagesJson(fs.readFileSync(generatedDataFile, "utf8")));
const sitePages = pages.filter(shouldSyncSitePage);
const client = getClient();

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS site_pages (
    route TEXT PRIMARY KEY,
    kind TEXT NOT NULL DEFAULT 'mirror-page',
    source_path TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    page_assets_json TEXT NOT NULL DEFAULT '[]',
    groups_json TEXT NOT NULL DEFAULT '[]',
    assets_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const upsertSql = `
  INSERT INTO site_pages (
    route,
    kind,
    source_path,
    title,
    summary,
    meta_description,
    body_html,
    page_assets_json,
    groups_json,
    assets_json,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(route) DO UPDATE SET
    kind=excluded.kind,
    source_path=excluded.source_path,
    title=excluded.title,
    summary=excluded.summary,
    meta_description=excluded.meta_description,
    body_html=excluded.body_html,
    page_assets_json=excluded.page_assets_json,
    groups_json=excluded.groups_json,
    assets_json=excluded.assets_json,
    updated_at=datetime('now')
`;

let synced = 0;
for (const page of sitePages) {
  await client.execute({
    sql: upsertSql,
    args: [
      page.route,
      page.kind || "mirror-page",
      page.sourcePath || "",
      page.title || "",
      page.summary || "",
      page.metaDescription || "",
      page.bodyHtml || "",
      JSON.stringify(page.pageAssets || []),
      JSON.stringify(page.groups || []),
      JSON.stringify(page.assets || []),
    ],
  });
  synced += 1;
}

console.log(`Synced ${synced} site pages into Turso (${dbPath})`);
await closeDb();
