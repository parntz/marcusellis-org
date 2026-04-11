import "./load-env.mjs";
import { execFileSync } from "child_process";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";
import { extractDirectoryPageRecord } from "../lib/directory-page.mjs";

const SOURCE_URL = "https://nashvillemusicians.org/directory";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function fetchDirectoryPageHtml() {
  return execFileSync("curl", ["-L", "-A", USER_AGENT, SOURCE_URL], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

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

const record = extractDirectoryPageRecord(fetchDirectoryPageHtml());

await client.execute({
  sql: `
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
    VALUES (?, 'mirror-page', ?, ?, ?, ?, ?, '[]', '[]', '[]', datetime('now'))
    ON CONFLICT(route) DO UPDATE SET
      kind='mirror-page',
      source_path=excluded.source_path,
      title=excluded.title,
      summary=excluded.summary,
      meta_description=excluded.meta_description,
      body_html=excluded.body_html,
      updated_at=datetime('now')
  `,
  args: [
    record.route,
    record.sourcePath,
    record.title,
    record.summary,
    record.metaDescription,
    record.bodyHtml,
  ],
});

console.log(`Synced ${record.route} into Turso (${dbPath}) from ${record.sourcePath}`);
await closeDb();
