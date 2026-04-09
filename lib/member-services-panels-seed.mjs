/**
 * Turso seed helpers for member_services_panels (ESM-only deps so Node db scripts can run).
 */
import { MEMBER_SERVICES_MEGA_SECTIONS } from "./member-services-hub-data.mjs";

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Same shape as `getDefaultMemberServicesPanels()` in member-services-panels.mjs (id null until persisted). */
export function getDefaultMemberServicesPanelRows() {
  return MEMBER_SERVICES_MEGA_SECTIONS.map((section, i) => ({
    id: null,
    sortOrder: i,
    kicker: section.kicker,
    title: section.title,
    bodyHtml: section.body.map((para) => `<p>${escapeHtml(para)}</p>`).join(""),
    primaryLabel: section.primary.label,
    primaryHref: section.primary.href,
    primaryExternal: Boolean(section.primary.external),
    secondaryLabel: section.secondary?.label ?? "",
    secondaryHref: section.secondary?.href ?? "",
    secondaryExternal: Boolean(section.secondary?.external),
  }));
}

async function replacePanels(client, panels) {
  await client.execute({ sql: `DELETE FROM member_services_panels` });
  if (!panels.length) return;
  const insertBatch = panels.map((p, i) => ({
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
}

/** @returns {Promise<number>} number of rows inserted (0 if table already had rows). */
export async function seedMemberServicesPanelsIfEmpty(client) {
  const pc = await client.execute({ sql: `SELECT COUNT(*) AS c FROM member_services_panels` });
  const n = Number(pc.rows?.[0]?.c ?? 0);
  if (n > 0) return 0;
  const panels = getDefaultMemberServicesPanelRows();
  await replacePanels(client, panels);
  return panels.length;
}

/** Replace all rows with bundled defaults (same as hub data file). */
export async function replaceMemberServicesPanelsWithDefaults(client) {
  const panels = getDefaultMemberServicesPanelRows();
  await replacePanels(client, panels);
  return panels.length;
}
