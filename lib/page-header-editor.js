import { getClient } from "./sqlite.mjs";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanDescription(value) {
  const text = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
  return stripImgTagsFromHtml(text);
}

export function normalizeHeaderRoute(input) {
  const raw = String(input || "").trim();
  if (!raw) return "/";

  const [pathOnly] = raw.split(/[?#]/, 1);
  let route = pathOnly || "/";
  if (!route.startsWith("/")) {
    route = `/${route}`;
  }
  route = route.replace(/\/{2,}/g, "/");
  if (route.length > 1) {
    route = route.replace(/\/+$/, "");
  }
  return route || "/";
}

async function ensureOverridesTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS page_header_overrides (
      route TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

async function findOverrideHeader(client, route) {
  await ensureOverridesTable(client);
  const rs = await client.execute({
    sql: `
      SELECT route, title, description
      FROM page_header_overrides
      WHERE route = ?
      LIMIT 1
    `,
    args: [route],
  });
  const row = rs.rows?.[0];
  if (!row) return null;
  return {
    source: "page_header_overrides",
    route,
    title: String(row.title || ""),
    description: String(row.description || ""),
  };
}

async function upsertOverrideHeader(client, { route, title, description }) {
  await ensureOverridesTable(client);
  await client.execute({
    sql: `
      INSERT INTO page_header_overrides (route, title, description, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(route) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        updated_at = datetime('now')
    `,
    args: [route, title, description],
  });
}

async function findMirrorHeader(client, route) {
  const rs = await client.execute({
    sql: `
      SELECT route, title, summary
      FROM mirror_page_content
      WHERE route = ?
      LIMIT 1
    `,
    args: [route],
  });
  const row = rs.rows?.[0];
  if (!row) return null;
  return {
    source: "mirror_page_content",
    route,
    title: String(row.title || ""),
    description: String(row.summary || ""),
  };
}

async function findNewsHeader(client, route) {
  const rs = await client.execute({
    sql: `
      SELECT route, title, summary
      FROM news_event_pages
      WHERE route = ?
      LIMIT 1
    `,
    args: [route],
  });
  const row = rs.rows?.[0];
  if (!row) return null;
  return {
    source: "news_event_pages",
    route,
    title: String(row.title || ""),
    description: String(row.summary || ""),
  };
}

export async function getEditablePageHeader(
  routeInput,
  { seedTitle = "", seedDescription = "", autoCreateOverride = false } = {}
) {
  const route = normalizeHeaderRoute(routeInput);
  const client = getClient();

  const overrideHeader = await findOverrideHeader(client, route);
  if (overrideHeader) return overrideHeader;

  const mirrorHeader = await findMirrorHeader(client, route);
  if (mirrorHeader) return mirrorHeader;

  const newsHeader = await findNewsHeader(client, route);
  if (newsHeader) return newsHeader;

  if (autoCreateOverride) {
    const initialTitle = cleanText(seedTitle || route.replace(/^\//, "").replace(/[-/]+/g, " ")) || route;
    const initialDescription = cleanDescription(seedDescription);
    await upsertOverrideHeader(client, {
      route,
      title: initialTitle,
      description: initialDescription,
    });
    return {
      source: "page_header_overrides",
      route,
      title: initialTitle,
      description: initialDescription,
    };
  }

  return null;
}

export async function getPageHeaderOverride(routeInput) {
  const route = normalizeHeaderRoute(routeInput);
  const client = getClient();
  return findOverrideHeader(client, route);
}

export async function updateEditablePageHeader({ route: routeInput, title, description }) {
  const route = normalizeHeaderRoute(routeInput);
  const nextTitle = cleanText(title);
  const nextDescription = cleanDescription(description);

  if (!nextTitle) {
    throw new Error("Title is required.");
  }

  const client = getClient();
  const editable = await getEditablePageHeader(route, {
    seedTitle: nextTitle,
    seedDescription: nextDescription,
    autoCreateOverride: true,
  });
  if (!editable) {
    throw new Error("Unable to resolve editable page header.");
  }

  if (editable.source === "mirror_page_content") {
    await client.execute({
      sql: `
        UPDATE mirror_page_content
        SET title = ?, summary = ?, meta_description = ?, updated_at = datetime('now')
        WHERE route = ?
      `,
      args: [nextTitle, nextDescription, nextDescription, route],
    });
  } else if (editable.source === "news_event_pages") {
    await client.execute({
      sql: `
        UPDATE news_event_pages
        SET title = ?, summary = ?, meta_description = ?, updated_at = datetime('now')
        WHERE route = ?
      `,
      args: [nextTitle, nextDescription, nextDescription, route],
    });
  }

  // Always mirror admin title/description into page_header_overrides. News & Events hub rows
  // are re-imported from bundled site-data on db:sync:news-pages (prebuild/predev), which
  // would otherwise wipe in-place edits to news_event_pages / mirror_page_content.
  await upsertOverrideHeader(client, {
    route,
    title: nextTitle,
    description: nextDescription,
  });

  return {
    source: "page_header_overrides",
    route,
    title: nextTitle,
    description: nextDescription,
  };
}
