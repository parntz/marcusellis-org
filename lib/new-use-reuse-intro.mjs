import { getClient } from "./sqlite.mjs";
import { cleanDrupalHtml, extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";

const NEW_USE_REUSE_ROUTE = "/new-use-reuse";

async function loadSitePageBody(client) {
  const rs = await client.execute({
    sql: `SELECT body_html AS bodyHtml FROM site_pages WHERE route = ? LIMIT 1`,
    args: [NEW_USE_REUSE_ROUTE],
  });
  return String(rs.rows?.[0]?.bodyHtml ?? "");
}

/** Inner HTML only (wrapped in `.new-use-intro-copy` at render). */
export const NEW_USE_REUSE_DEFAULT_INTRO_INNER_HTML = `
<p>
  Use this page to report <strong>new use</strong> and <strong>reuse</strong>—any use, anywhere—of
  your recorded work. Local 257 often learns about unpaid use of union recordings because members
  speak up; your report helps the union follow up.
</p>
<p>
  <strong>New use</strong> is when music recorded for one medium shows up in another medium, for a
  different purpose. If your name is on the union contract, that can mean an additional wage
  payment. For example, a track cut for CD that later appears in a film soundtrack is a new use.
</p>
<p>
  <strong>Reuse</strong> refers to continued use of your recorded music under many electronic-media
  agreements—extra payments when the same recording keeps airing or circulating. Examples include
  TV programs and commercial jingles.
</p>
`.trim();

function extractCopyInnerFromPageBody(bodyHtml) {
  const raw = String(bodyHtml || "");
  const copyMatch = raw.match(
    /<div><div><div\s+property="content:encoded">([\s\S]*?)<\/div><\/div><\/div>/i
  );
  if (copyMatch?.[1]) {
    const cleaned = cleanDrupalHtml(copyMatch[1]).trim();
    if (cleaned) {
      return stripOuterIntroWrapper(cleaned);
    }
  }
  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  if (extracted) {
    const beforeForm = extracted.split(/<form\b/i)[0]?.trim();
    if (beforeForm) {
      return stripOuterIntroWrapper(cleanDrupalHtml(beforeForm).trim());
    }
  }
  return "";
}

/** Remove a single outer .new-use-intro-copy wrapper if present (legacy / pasted markup). */
function stripOuterIntroWrapper(html) {
  const t = String(html || "").trim();
  const m = t.match(/^<div\b[^>]*\bnew-use-intro-copy\b[^>]*>([\s\S]*)<\/div>\s*$/i);
  return m ? m[1].trim() : t;
}

async function readStoredIntroHtml(client) {
  const rs = await client.execute({
    sql: `SELECT intro_html AS introHtml FROM new_use_reuse_intro WHERE id = 1 LIMIT 1`,
  });
  if (!rs.rows?.[0]) return null;
  return String(rs.rows[0].introHtml ?? "");
}

function effectiveStoredIntro(stored) {
  if (stored == null) return "";
  return String(stored).trim();
}

function sanitizeDisplayInner(html) {
  const cleaned = cleanDrupalHtml(String(html || "").trim()).trim();
  return cleaned;
}

/**
 * @param {string} [bodyHtmlFallback] — legacy `site_pages.body_html` when DB intro is empty.
 */
export async function getNewUseReuseIntroInnerForPage(bodyHtmlFallback = "") {
  const client = getClient();
  const stored = await readStoredIntroHtml(client);
  let inner = effectiveStoredIntro(stored);
  if (!inner) {
    const body = String(bodyHtmlFallback || "").trim() || (await loadSitePageBody(client));
    inner = extractCopyInnerFromPageBody(body) || NEW_USE_REUSE_DEFAULT_INTRO_INNER_HTML;
  }
  return sanitizeDisplayInner(inner) || sanitizeDisplayInner(NEW_USE_REUSE_DEFAULT_INTRO_INNER_HTML);
}

export async function getNewUseReuseIntroInnerForAdmin(bodyHtmlFallback = "") {
  const client = getClient();
  const stored = await readStoredIntroHtml(client);
  let inner = effectiveStoredIntro(stored);
  if (!inner) {
    const body = String(bodyHtmlFallback || "").trim() || (await loadSitePageBody(client));
    inner = extractCopyInnerFromPageBody(body) || NEW_USE_REUSE_DEFAULT_INTRO_INNER_HTML;
  }
  return { introHtml: inner };
}

export async function updateNewUseReuseIntro(introHtml) {
  const client = getClient();
  const next = stripImgTagsFromHtml(String(introHtml ?? ""));
  await client.execute({
    sql: `INSERT INTO new_use_reuse_intro (id, intro_html, updated_at)
          VALUES (1, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            intro_html = excluded.intro_html,
            updated_at = datetime('now')`,
    args: [next],
  });
  return getNewUseReuseIntroInnerForAdmin("");
}
