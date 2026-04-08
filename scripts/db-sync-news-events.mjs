import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient } from "../lib/sqlite.mjs";
import {
  dedupeNewsItemsByHref,
  extractNewsItems,
  extractNewsItemsFromArchiveHtml,
  formatArchiveLabel,
} from "../lib/news-events-parse.mjs";
import {
  archivePathToSourceRoute,
  collectMonthlyArchivePaths,
  readFirstListingHtml,
  resolveHtmlVersionRoot,
} from "../lib/news-events-html-sources.mjs";

const generatedDataFile = path.join(process.cwd(), "content", "generated", "site-data.generated.js");
const sourceRouteMain = "/news-and-events";
const sourceRouteAlt = "/news-events";
const newsAssetsDir = path.join(process.cwd(), "public", "_downloaded", "news-and-events");

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
const pagesByRoute = new Map(pages.map((page) => [page.route, page]));

const htmlResolved = resolveHtmlVersionRoot();
const htmlRoot = htmlResolved?.root ?? null;

if (htmlResolved) {
  console.log(`News/events sync: using local HTML mirror at ${htmlResolved.root} (${htmlResolved.via}).`);
} else {
  console.log(
    "News/events sync: no local HTML-version folder found (set HTML_VERSION_ROOT or add HTML-version / Desktop/afm2_bkup/HTML-version); using generated site data + public/_downloaded only."
  );
}

function listingHtmlForRoute(route) {
  const segment = route.replace(/^\//, "");
  if (htmlRoot) {
    const fromDisk = readFirstListingHtml(htmlRoot, segment);
    if (fromDisk) {
      return fromDisk;
    }
  }
  const page = pagesByRoute.get(route);
  return page?.bodyHtml || "";
}

const mainListingHtml = listingHtmlForRoute(sourceRouteMain);
const altListingHtml = listingHtmlForRoute(sourceRouteAlt);

const archivePaths = collectMonthlyArchivePaths(htmlRoot, newsAssetsDir);

const allItems = [
  ...extractNewsItems(mainListingHtml, pagesByRoute, sourceRouteMain),
  ...extractNewsItems(altListingHtml, pagesByRoute, sourceRouteAlt),
  ...archivePaths.map((filePath) => {
    const archiveRoute = archivePathToSourceRoute(filePath);
    const archiveSlug = archiveRoute.replace(`${sourceRouteMain}/`, "");
    const linkedPage = pagesByRoute.get(archiveRoute);

    return {
      href: archiveRoute,
      title: `Latest News & Events - ${formatArchiveLabel(archiveSlug)}`,
      item_type: "archive",
      summary: linkedPage?.summary || "Monthly archive for News & Events.",
      source_route: archiveRoute,
    };
  }),
  ...archivePaths.flatMap((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    return extractNewsItemsFromArchiveHtml(html, pagesByRoute, archivePathToSourceRoute(filePath));
  }),
];

const items = dedupeNewsItemsByHref(allItems);
const client = getClient();

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS news_events_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    href TEXT NOT NULL,
    title TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'other',
    summary TEXT NOT NULL DEFAULT '',
    source_route TEXT NOT NULL DEFAULT '/news-and-events',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(href, title, source_route)
  );
`);

async function ensureNewsEventsColumns() {
  const rs = await client.execute("PRAGMA table_info(news_events_items);");
  const existingColumns = new Set(rs.rows.map((column) => column.name));
  const expectedColumns = [
    ["badge_month", "TEXT NOT NULL DEFAULT ''"],
    ["badge_day", "TEXT NOT NULL DEFAULT ''"],
    ["event_date_text", "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [name, typeDef] of expectedColumns) {
    if (!existingColumns.has(name)) {
      await client.execute(`ALTER TABLE news_events_items ADD COLUMN ${name} ${typeDef};`);
    }
  }
}

await ensureNewsEventsColumns();

const insertSql = `
  INSERT INTO news_events_items (
    href, title, item_type, summary, badge_month, badge_day, event_date_text, source_route, display_order
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const batchStmts = [
  {
    sql: `
      DELETE FROM news_events_items
      WHERE source_route = ?
         OR source_route LIKE ?
         OR source_route = ?;
    `,
    args: [sourceRouteMain, `${sourceRouteMain}/%`, sourceRouteAlt],
  },
  ...items.map((item, index) => ({
    sql: insertSql,
    args: [
      item.href,
      item.title,
      item.item_type,
      item.summary,
      item.badge_month || "",
      item.badge_day || "",
      item.event_date_text || "",
      item.source_route,
      index + 1,
    ],
  })),
];

await client.batch(batchStmts, "write");
console.log(`Synced ${items.length} news/events items into Turso (libSQL).`);
await closeDb();
