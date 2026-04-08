import { getClient } from "./sqlite.mjs";

/** True if HTML has visible text (ignore empty `<p></p>` / whitespace-only DB rows). */
export function isSubstantiveBodyHtml(html) {
  const text = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

function sanitizeMirrorPageCopy(page) {
  if (!page) return page;
  if (page.route !== "/signatory-information") return page;
  return {
    ...page,
    summary: "Signatory and employer information.",
    metaDescription: "Signatory and employer information.",
  };
}

/**
 * Canonical HTML + metadata for mirror pages rendered from `[...slug]`.
 * Populated by `npm run db:sync:mirror-pages` from generated site data; editable in Turso.
 */
export async function fetchMirrorPageContentRow(route) {
  const client = getClient();
  const rs = await client.execute({
    sql: `SELECT title, summary, meta_description, body_html
          FROM mirror_page_content WHERE route = ? LIMIT 1`,
    args: [route],
  });
  return rs.rows?.[0] || null;
}

/** Prefer DB body/metadata when the row has real content; otherwise keep bundled site-data. */
export function mergeMirrorPageFromDb(staticPage, row) {
  if (!staticPage || !row) return staticPage;
  const body = String(row.body_html ?? "").trim();
  if (!body || !isSubstantiveBodyHtml(body)) return sanitizeMirrorPageCopy(staticPage);
  return sanitizeMirrorPageCopy({
    ...staticPage,
    title: row.title || staticPage.title,
    summary: row.summary ?? staticPage.summary,
    metaDescription: row.meta_description ?? staticPage.metaDescription,
    bodyHtml: row.body_html,
  });
}
