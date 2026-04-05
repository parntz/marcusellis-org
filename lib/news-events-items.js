import { getClient } from "./sqlite.mjs";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeHref(value) {
  const raw = cleanText(value);
  if (!raw) {
    throw new Error("Link or route is required.");
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/i.test(url.protocol)) {
      throw new Error("Only http and https links are supported.");
    }
    return url.toString();
  } catch {
    throw new Error("Enter a valid route or website URL.");
  }
}

function normalizeBadgeMonth(value) {
  return cleanText(value).slice(0, 3).toUpperCase();
}

function normalizeBadgeDay(value) {
  return cleanText(value).slice(0, 4);
}

function normalizeItemType(value) {
  return cleanText(value).toLowerCase() || "news";
}

function isInternalNewsRoute(href) {
  return href.startsWith("/news-and-events/") || href.startsWith("/event/");
}

function mapNewsEventsItemRow(row) {
  return {
    id: Number(row.id),
    href: cleanText(row.href),
    title: cleanText(row.title),
    itemType: cleanText(row.itemType || row.item_type),
    summary: cleanText(row.summary),
    badgeMonth: cleanText(row.badgeMonth || row.badge_month),
    badgeDay: cleanText(row.badgeDay || row.badge_day),
    eventDateText: cleanText(row.eventDateText || row.event_date_text),
    sourceRoute: cleanText(row.sourceRoute || row.source_route),
    displayOrder: Number(row.displayOrder || row.display_order || 0),
    createdAt: cleanText(row.createdAt || row.created_at),
    metaDescription: cleanText(row.metaDescription || row.meta_description),
    bodyHtml: String(row.bodyHtml || row.body_html || ""),
  };
}

export function normalizeNewsEventPayload(input = {}) {
  return {
    href: normalizeHref(input.href),
    title: cleanText(input.title),
    itemType: normalizeItemType(input.itemType),
    summary: cleanText(input.summary),
    badgeMonth: normalizeBadgeMonth(input.badgeMonth),
    badgeDay: normalizeBadgeDay(input.badgeDay),
    eventDateText: cleanText(input.eventDateText),
    sourceRoute: cleanText(input.sourceRoute) || "/news-and-events",
    metaDescription: cleanText(input.metaDescription),
    bodyHtml: stripImgTagsFromHtml(String(input.bodyHtml || "").trim()),
  };
}

export function validateNewsEventPayload(input = {}) {
  const payload = normalizeNewsEventPayload(input);

  if (!payload.title) {
    throw new Error("Title is required.");
  }

  return payload;
}

async function upsertNewsEventPage(client, href, payload, previousHref = "") {
  const previousInternal = previousHref && isInternalNewsRoute(previousHref);
  const nextInternal = isInternalNewsRoute(href);

  if (previousInternal && !nextInternal) {
    await client.execute({
      sql: `DELETE FROM news_event_pages WHERE route = ?`,
      args: [previousHref],
    });
    return;
  }

  if (!nextInternal) {
    return;
  }

  const route = href;
  const existing = (
    await client.execute({
      sql: `SELECT route FROM news_event_pages WHERE route = ? LIMIT 1`,
      args: [previousInternal ? previousHref : route],
    })
  ).rows?.[0];

  if (existing?.route && existing.route !== route) {
    await client.execute({
      sql: `UPDATE news_event_pages SET route = ? WHERE route = ?`,
      args: [route, existing.route],
    });
  }

  await client.execute({
    sql: `
      INSERT INTO news_event_pages (
        route,
        title,
        summary,
        meta_description,
        body_html,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(route) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        meta_description = excluded.meta_description,
        body_html = excluded.body_html,
        updated_at = datetime('now')
    `,
    args: [route, payload.title, payload.summary, payload.metaDescription, payload.bodyHtml],
  });
}

async function getNewsEventPageByRoute(client, route) {
  if (!route || !isInternalNewsRoute(route)) {
    return null;
  }

  const rs = await client.execute({
    sql: `
      SELECT
        route,
        title,
        summary,
        meta_description,
        body_html
      FROM news_event_pages
      WHERE route = ?
      LIMIT 1
    `,
    args: [route],
  });

  return rs.rows?.[0] || null;
}

export async function listNewsEventsItems(limit = 100, sourceRoute = "/news-and-events") {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `
        SELECT
          i.id,
          i.href,
          i.title,
          i.item_type AS itemType,
          i.summary,
          i.badge_month AS badgeMonth,
          i.badge_day AS badgeDay,
          i.event_date_text AS eventDateText,
          i.source_route AS sourceRoute,
          i.display_order AS displayOrder,
          i.created_at AS createdAt,
          p.meta_description AS metaDescription,
          p.body_html AS bodyHtml
        FROM news_events_items i
        LEFT JOIN news_event_pages p ON p.route = i.href
        WHERE i.source_route = ?
           OR i.source_route LIKE ?
           OR i.source_route = '/news-events'
        ORDER BY i.display_order ASC, i.id ASC
        LIMIT ?
      `,
      args: [sourceRoute, `${sourceRoute}/%`, limit],
    });

    return rs.rows.map(mapNewsEventsItemRow);
  } catch {
    return [];
  }
}

export async function getNewsEventsItemById(id) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        i.id,
        i.href,
        i.title,
        i.item_type AS itemType,
        i.summary,
        i.badge_month AS badgeMonth,
        i.badge_day AS badgeDay,
        i.event_date_text AS eventDateText,
        i.source_route AS sourceRoute,
        i.display_order AS displayOrder,
        i.created_at AS createdAt,
        p.meta_description AS metaDescription,
        p.body_html AS bodyHtml
      FROM news_events_items i
      LEFT JOIN news_event_pages p ON p.route = i.href
      WHERE i.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  return rs.rows?.[0] ? mapNewsEventsItemRow(rs.rows[0]) : null;
}

export async function createNewsEventsItem(input = {}) {
  const payload = validateNewsEventPayload(input);
  const client = getClient();
  const maxRs = await client.execute({
    sql: `SELECT COALESCE(MAX(display_order), 0) AS maxOrder FROM news_events_items`,
  });
  const nextOrder = Number(maxRs.rows?.[0]?.maxOrder || 0) + 1;

  const rs = await client.execute({
    sql: `
      INSERT INTO news_events_items (
        href,
        title,
        item_type,
        summary,
        badge_month,
        badge_day,
        event_date_text,
        source_route,
        display_order,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    args: [
      payload.href,
      payload.title,
      payload.itemType,
      payload.summary,
      payload.badgeMonth,
      payload.badgeDay,
      payload.eventDateText,
      payload.sourceRoute,
      nextOrder,
    ],
  });

  await upsertNewsEventPage(client, payload.href, payload);
  return getNewsEventsItemById(Number(rs.lastInsertRowid));
}

export async function updateNewsEventsItem(id, input = {}) {
  const existing = await getNewsEventsItemById(id);
  if (!existing) {
    throw new Error("News/event item not found.");
  }

  const payload = validateNewsEventPayload(input);
  const client = getClient();

  await client.execute({
    sql: `
      UPDATE news_events_items
      SET
        href = ?,
        title = ?,
        item_type = ?,
        summary = ?,
        badge_month = ?,
        badge_day = ?,
        event_date_text = ?,
        source_route = ?
      WHERE id = ?
    `,
    args: [
      payload.href,
      payload.title,
      payload.itemType,
      payload.summary,
      payload.badgeMonth,
      payload.badgeDay,
      payload.eventDateText,
      payload.sourceRoute,
      id,
    ],
  });

  await upsertNewsEventPage(client, payload.href, payload, existing.href);
  return getNewsEventsItemById(id);
}

export async function deleteNewsEventsItem(id) {
  const existing = await getNewsEventsItemById(id);
  if (!existing) {
    return;
  }

  const client = getClient();
  await client.execute({
    sql: `DELETE FROM news_events_items WHERE id = ?`,
    args: [id],
  });

  if (isInternalNewsRoute(existing.href)) {
    await client.execute({
      sql: `DELETE FROM news_event_pages WHERE route = ?`,
      args: [existing.href],
    });
  }
}

export async function getNewsEventPage(route) {
  const client = getClient();
  const row = await getNewsEventPageByRoute(client, route);
  return row
    ? {
        route: cleanText(row.route),
        title: cleanText(row.title),
        summary: cleanText(row.summary),
        metaDescription: cleanText(row.meta_description),
        bodyHtml: String(row.body_html || ""),
      }
    : null;
}
