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

if (!fs.existsSync(generatedDataFile)) {
  throw new Error(`Generated site data not found at ${generatedDataFile}`);
}

const generatedSource = fs.readFileSync(generatedDataFile, "utf8");
const pages = JSON.parse(extractPagesJson(generatedSource));

const newsPages = pages.filter((p) => {
  if (p.kind !== "mirror-page") return false;
  return (
    p.route === "/news-and-events" ||
    p.route.startsWith("/news-and-events/") ||
    p.route.startsWith("/event/")
  );
});

const client = getClient();

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS news_event_pages (
    route TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const upsertSql = `
  INSERT INTO news_event_pages (route, title, summary, meta_description, body_html, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(route) DO UPDATE SET
    title=excluded.title,
    summary=excluded.summary,
    meta_description=excluded.meta_description,
    body_html=excluded.body_html,
    updated_at=datetime('now')
`;

let inserted = 0;
for (const page of newsPages) {
  await client.execute({
    sql: upsertSql,
    args: [
      page.route,
      page.title || "",
      page.summary || "",
      page.metaDescription || "",
      page.bodyHtml || "",
    ],
  });
  inserted += 1;
}

console.log(`Synced ${inserted} news event pages into ${dbPath}`);
await closeDb();
