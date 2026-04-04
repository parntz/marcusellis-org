import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient } from "../lib/sqlite.mjs";

const generatedDataFile = path.join(process.cwd(), "content", "generated", "site-data.generated.js");
const sourceRoute = "/news-and-events";
const newsAssetsDir = path.join(process.cwd(), "public", "_downloaded", "news-and-events");

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

function stripTags(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHref(rawHref = "") {
  const trimmed = rawHref.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed
    .replace(/^https?:\/\/(?:www\.)?nashvillemusicians\.org/i, "")
    .replace(/\/+$/, "");
}

function inferItemType(href = "") {
  if (href.startsWith("/event/")) {
    return "event";
  }
  if (href.startsWith("/news/")) {
    return "news";
  }
  return "other";
}

function toSourceRouteFromAssetFile(filePath) {
  const base = path.basename(filePath);
  const monthSlug = base.replace(/--asset$/, "");
  return `${sourceRoute}/${monthSlug}`;
}

function formatArchiveLabel(slug = "") {
  const match = slug.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return slug;
  }

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function extractNewsItems(bodyHtml, pagesByRoute, source = sourceRoute) {
  const anchorPattern = /<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const rows = [];
  let match;

  while ((match = anchorPattern.exec(bodyHtml))) {
    const href = normalizeHref(match[1]);
    if (!href) {
      continue;
    }

    const title = stripTags(match[2]);
    if (!title) {
      continue;
    }

    if (/^view\s*>{1,2}\s*$/i.test(title)) {
      continue;
    }

    // Keep links that look like actual news/event entries.
    if (!href.startsWith("/event/") && !href.startsWith("/news/")) {
      continue;
    }

    const linkedPage = pagesByRoute.get(href);
    rows.push({
      href,
      title: linkedPage?.title || title,
      item_type: inferItemType(href),
      summary: linkedPage?.summary || "",
      source_route: source,
    });
  }

  return rows;
}

function extractNewsItemsFromArchiveHtml(html, pagesByRoute, source) {
  const rows = [];
  const seenByHref = new Set();
  const itemPattern = /<div id="news-item">([\s\S]*?)<\/div>\s*<\/span>/gi;
  let itemMatch;

  while ((itemMatch = itemPattern.exec(html))) {
    const block = itemMatch[1];
    const titleAnchor = block.match(
      /<div class="news-title">\s*<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );

    if (!titleAnchor) {
      continue;
    }

    const href = normalizeHref(titleAnchor[1]);
    const fallbackTitle = stripTags(titleAnchor[2]);
    if (!href || !fallbackTitle) {
      continue;
    }

    if (!href.startsWith("/event/") && !href.startsWith("/news/")) {
      continue;
    }

    if (seenByHref.has(href)) {
      continue;
    }
    seenByHref.add(href);

    const summaryMatch = block.match(/<div class="news-body">([\s\S]*?)<\/div>/i);
    const summaryFromHtml = stripTags(summaryMatch?.[1] || "");
    const badgeMonth = stripTags(block.match(/<div class="post-date[^"]*">\s*<div class="month">([\s\S]*?)<\/div>/i)?.[1] || "")
      .slice(0, 3)
      .toUpperCase();
    const badgeDay = stripTags(block.match(/<div class="post-date[^"]*">[\s\S]*?<div class="day">([\s\S]*?)<\/div>/i)?.[1] || "");
    const eventDateText = stripTags(block.match(/<div class="event-startend">([\s\S]*?)<\/div>/i)?.[1] || "");
    const linkedPage = pagesByRoute.get(href);

    rows.push({
      href,
      title: linkedPage?.title || fallbackTitle,
      item_type: inferItemType(href),
      summary: summaryFromHtml || linkedPage?.summary || "",
      badge_month: badgeMonth,
      badge_day: badgeDay,
      event_date_text: eventDateText,
      source_route: source,
    });
  }

  return rows;
}

if (!fs.existsSync(generatedDataFile)) {
  throw new Error(`Generated site data not found at ${generatedDataFile}`);
}

const generatedSource = fs.readFileSync(generatedDataFile, "utf8");
const pages = JSON.parse(extractPagesJson(generatedSource));
const pagesByRoute = new Map(pages.map((page) => [page.route, page]));
const newsPage = pagesByRoute.get(sourceRoute);

if (!newsPage) {
  throw new Error(`Route "${sourceRoute}" not found in generated site data.`);
}

const archiveFiles = fs.existsSync(newsAssetsDir)
  ? fs
      .readdirSync(newsAssetsDir)
      .map((name) => path.join(newsAssetsDir, name))
      .filter((filePath) => filePath.endsWith("--asset"))
      .sort((left, right) => path.basename(right).localeCompare(path.basename(left)))
  : [];

const allItems = [
  ...extractNewsItems(newsPage.bodyHtml || "", pagesByRoute, sourceRoute),
  ...archiveFiles.map((filePath) => {
    const archiveRoute = toSourceRouteFromAssetFile(filePath);
    const archiveSlug = archiveRoute.replace(`${sourceRoute}/`, "");
    const linkedPage = pagesByRoute.get(archiveRoute);

    return {
      href: archiveRoute,
      title: `Latest News & Events - ${formatArchiveLabel(archiveSlug)}`,
      item_type: "archive",
      summary: linkedPage?.summary || "Monthly archive for News & Events.",
      source_route: archiveRoute,
    };
  }),
  ...archiveFiles.flatMap((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    return extractNewsItemsFromArchiveHtml(html, pagesByRoute, toSourceRouteFromAssetFile(filePath));
  }),
];

function scoreItemQuality(item) {
  let score = 0;
  if (item.badge_month) score += 2;
  if (item.badge_day) score += 2;
  if (item.event_date_text) score += 2;
  if (item.summary) score += 1;
  if (item.source_route !== sourceRoute) score += 1;
  return score;
}

const dedupedByHref = new Map();
for (const item of allItems) {
  const existing = dedupedByHref.get(item.href);
  if (!existing) {
    dedupedByHref.set(item.href, item);
    continue;
  }

  if (scoreItemQuality(item) > scoreItemQuality(existing)) {
    dedupedByHref.set(item.href, item);
  }
}

const items = Array.from(dedupedByHref.values());
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
         OR source_route LIKE ?;
    `,
    args: [sourceRoute, `${sourceRoute}/%`],
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
console.log(`Synced ${items.length} news/events items from ${sourceRoute} into libSQL.`);
await closeDb();
