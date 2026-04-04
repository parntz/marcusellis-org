import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient, dbPath } from "../lib/sqlite.mjs";

const routeArg = process.argv[2];
if (!routeArg || !routeArg.startsWith("/")) {
  console.error("Usage: npm run db:upsert:mirror-page -- /general-jackson-show");
  process.exit(1);
}
const route = routeArg.replace(/\/+$/, "") || "/";

const ROOT = process.cwd();
const generatedDataFile = path.join(ROOT, "content", "generated", "site-data.generated.js");

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

if (!fs.existsSync(generatedDataFile)) {
  throw new Error(`Generated site data not found at ${generatedDataFile}`);
}

const pages = JSON.parse(extractPagesJson(fs.readFileSync(generatedDataFile, "utf8")));
const page = pages.find((p) => p.route === route && p.kind === "mirror-page");

if (!page) {
  console.error(`No mirror-page in site-data for route: ${route}`);
  process.exit(1);
}

const client = getClient();

await client.execute({
  sql: `
    INSERT INTO mirror_page_content (route, title, summary, meta_description, body_html, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(route) DO UPDATE SET
      title=excluded.title,
      summary=excluded.summary,
      meta_description=excluded.meta_description,
      body_html=excluded.body_html,
      updated_at=datetime('now')
  `,
  args: [
    page.route,
    page.title || "",
    page.summary || "",
    page.metaDescription || "",
    page.bodyHtml || "",
  ],
});

console.log(`Upserted mirror_page_content row for ${route} (${dbPath})`);
await closeDb();
