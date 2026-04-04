import { getClient } from "./sqlite.mjs";

export async function listNewsEventsItems(limit = 100, sourceRoute = "/news-and-events") {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `
      SELECT
        id,
        href,
        title,
        item_type AS itemType,
        summary,
        badge_month AS badgeMonth,
        badge_day AS badgeDay,
        event_date_text AS eventDateText,
        source_route AS sourceRoute,
        display_order AS displayOrder,
        created_at AS createdAt
      FROM news_events_items
      WHERE source_route = ?
         OR source_route LIKE ?
         OR source_route = '/news-events'
      ORDER BY display_order ASC
      LIMIT ?
    `,
      args: [sourceRoute, `${sourceRoute}/%`, limit],
    });

    return rs.rows.map((row) => ({
      id: row.id,
      href: row.href,
      title: row.title,
      itemType: row.itemType,
      summary: row.summary,
      badgeMonth: row.badgeMonth,
      badgeDay: row.badgeDay,
      eventDateText: row.eventDateText,
      sourceRoute: row.sourceRoute,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}
