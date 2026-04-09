import { getClient } from "./sqlite.mjs";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";
import { getDefaultMemberServicesPanelRows } from "./member-services-panels-seed.mjs";

/** Fallback when `member_services_panels` has no rows (not persisted until an admin saves). */
export function getDefaultMemberServicesPanels() {
  return getDefaultMemberServicesPanelRows();
}

function mapRow(row) {
  return {
    id: row.id,
    sortOrder: Number(row.sort_order ?? 0),
    kicker: String(row.kicker ?? ""),
    title: String(row.title ?? ""),
    bodyHtml: String(row.body_html ?? ""),
    primaryLabel: String(row.primary_label ?? ""),
    primaryHref: String(row.primary_href ?? ""),
    primaryExternal: Boolean(row.primary_external),
    secondaryLabel: String(row.secondary_label ?? ""),
    secondaryHref: String(row.secondary_href ?? ""),
    secondaryExternal: Boolean(row.secondary_external),
  };
}

function normalizePanelInput(raw, index) {
  const p = raw && typeof raw === "object" ? raw : {};
  return {
    sortOrder: index,
    kicker: String(p.kicker ?? "").trim(),
    title: String(p.title ?? "").trim(),
    bodyHtml: stripImgTagsFromHtml(String(p.bodyHtml ?? "").trim()),
    primaryLabel: String(p.primaryLabel ?? "").trim(),
    primaryHref: String(p.primaryHref ?? "").trim(),
    primaryExternal: Boolean(p.primaryExternal),
    secondaryLabel: String(p.secondaryLabel ?? "").trim(),
    secondaryHref: String(p.secondaryHref ?? "").trim(),
    secondaryExternal: Boolean(p.secondaryExternal),
  };
}

export async function listMemberServicesPanels() {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `
        SELECT
          id,
          sort_order,
          kicker,
          title,
          body_html,
          primary_label,
          primary_href,
          primary_external,
          secondary_label,
          secondary_href,
          secondary_external
        FROM member_services_panels
        ORDER BY sort_order ASC, id ASC
      `,
    });
    if (!rs.rows?.length) {
      return [];
    }
    return rs.rows.map(mapRow);
  } catch {
    /* Table missing (before migration): show bundled defaults until db:init. */
    return getDefaultMemberServicesPanels();
  }
}

/** Replace all rows (may be empty). */
export async function replaceMemberServicesPanels(panelsInput) {
  const list = Array.isArray(panelsInput) ? panelsInput : [];
  const normalized = list.map((p, i) => normalizePanelInput(p, i));

  const client = getClient();
  await client.execute({ sql: `DELETE FROM member_services_panels` });

  if (!normalized.length) {
    return [];
  }

  const insertBatch = normalized.map((p, i) => ({
    sql: `
      INSERT INTO member_services_panels (
        sort_order,
        kicker,
        title,
        body_html,
        primary_label,
        primary_href,
        primary_external,
        secondary_label,
        secondary_href,
        secondary_external,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    args: [
      i,
      p.kicker,
      p.title,
      p.bodyHtml,
      p.primaryLabel,
      p.primaryHref,
      p.primaryExternal ? 1 : 0,
      p.secondaryLabel,
      p.secondaryHref,
      p.secondaryExternal ? 1 : 0,
    ],
  }));

  await client.batch(insertBatch, "write");
  return listMemberServicesPanels();
}
