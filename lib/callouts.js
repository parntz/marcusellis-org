import { getClient } from "./sqlite.mjs";

export async function listCallouts(location = "header") {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `
      SELECT
        slug,
        title,
        body,
        cta_label AS ctaLabel,
        cta_href AS ctaHref,
        display_order AS displayOrder
      FROM site_callouts
      WHERE is_active = 1 AND location = ?
      ORDER BY display_order ASC, id ASC
    `,
      args: [location],
    });

    return rs.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      body: row.body,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      displayOrder: row.displayOrder,
    }));
  } catch {
    return [];
  }
}
