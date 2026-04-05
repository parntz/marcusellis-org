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

function toCalloutRecord(row) {
  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    body: String(row.body || ""),
    ctaLabel: String(row.ctaLabel || ""),
    ctaHref: String(row.ctaHref || ""),
    location: String(row.location || "header"),
    isActive: Number(row.isActive || 0) === 1,
    displayOrder: Number(row.displayOrder || 0),
  };
}

function slugifyCallout(input = "") {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listCalloutsForAdmin(location = "header") {
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
          location,
          is_active AS isActive,
          display_order AS displayOrder
        FROM site_callouts
        WHERE location = ?
        ORDER BY display_order ASC, id ASC
      `,
      args: [location],
    });

    return rs.rows.map(toCalloutRecord);
  } catch {
    return [];
  }
}

function ensureUniqueCalloutSlug(baseSlug, usedSlugs, index) {
  const fallback = baseSlug || `member-notice-${index + 1}`;
  let slug = fallback;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function normalizeCalloutDraft(item, fallbackLocation, index, usedSlugs) {
  const title = String(item?.title || "").trim();
  const baseSlug = slugifyCallout(item?.slug || title);
  const slug = ensureUniqueCalloutSlug(baseSlug, usedSlugs, index);

  return {
    slug,
    title,
    body: String(item?.body || "").trim(),
    ctaLabel: String(item?.ctaLabel || "").trim(),
    ctaHref: String(item?.ctaHref || "").trim(),
    location: String(item?.location || fallbackLocation || "header").trim() || "header",
    isActive: item?.isActive === false ? 0 : 1,
    displayOrder: index + 1,
  };
}

export async function replaceCalloutsForLocation(location = "header", items = []) {
  const usedSlugs = new Set();
  const normalized = (Array.isArray(items) ? items : []).map((item, index) =>
    normalizeCalloutDraft(item, location, index, usedSlugs)
  );

  for (const item of normalized) {
    if (!item.slug || !item.title || !item.body || !item.ctaLabel || !item.ctaHref || !item.location) {
      throw new Error("Each member notice requires title, body, CTA label, CTA href, and location.");
    }
  }

  const client = getClient();
  const batch = normalized.map((item) => ({
    sql: `
      INSERT INTO site_callouts (
        slug,
        title,
        body,
        cta_label,
        cta_href,
        location,
        is_active,
        display_order,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        cta_label = excluded.cta_label,
        cta_href = excluded.cta_href,
        location = excluded.location,
        is_active = excluded.is_active,
        display_order = excluded.display_order,
        updated_at = datetime('now')
    `,
    args: [
      item.slug,
      item.title,
      item.body,
      item.ctaLabel,
      item.ctaHref,
      item.location,
      item.isActive,
      item.displayOrder,
    ],
  }));

  if (batch.length) {
    await client.batch(batch, "write");
    await client.execute({
      sql: `
        DELETE FROM site_callouts
        WHERE location = ?
          AND slug NOT IN (${normalized.map(() => "?").join(", ")})
      `,
      args: [location, ...normalized.map((item) => item.slug)],
    });
  } else {
    await client.execute({
      sql: `DELETE FROM site_callouts WHERE location = ?`,
      args: [location],
    });
  }

  return listCalloutsForAdmin(location);
}
