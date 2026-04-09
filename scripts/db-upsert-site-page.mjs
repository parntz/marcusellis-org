import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient, dbPath } from "../lib/sqlite.mjs";

const routeArg = process.argv[2];
if (!routeArg || !routeArg.startsWith("/")) {
  console.error("Usage: npm run db:upsert:site-page -- /general-jackson-show");
  process.exit(1);
}
const route = routeArg.replace(/\/+$/, "") || "/";
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

const pages = JSON.parse(extractPagesJson(fs.readFileSync(generatedDataFile, "utf8")));
const page = pages.find((entry) => entry.route === route);

if (!page) {
  console.error(`No site page in generated data for route: ${route}`);
  process.exit(1);
}

const client = getClient();

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
  `,
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

console.log(`Upserted site_pages row for ${route} in Turso (${dbPath})`);
await closeDb();
