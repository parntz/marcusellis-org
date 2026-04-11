import { cleanDrupalHtml, extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export const AFM_ENTERTAINMENT_ROUTE = "/afm-entertainment";

export const AFM_ENTERTAINMENT_CANONICAL_SOURCE_HTML = `
<h2>Hire AFM-affiliated artists across the U.S. and Canada.</h2>
<p>
  AFM Entertainment is the federation's national booking showcase. Browse acts, review artist
  listings, and connect with headquarters staff for help placing live entertainment.
</p>
<p><a href="http://afmentertainment.org/" target="_blank" rel="noreferrer">Visit AFMEntertainment.org</a></p>
`.trim();

function normalizeAfmEntertainmentSourceHtml(sourceHtml) {
  return rewriteLegacyNashvilleSiteInHtml(
    cleanDrupalHtml(String(sourceHtml || "").trim() || AFM_ENTERTAINMENT_CANONICAL_SOURCE_HTML)
  ).trim();
}

function looksLikeLegacyPromoHtml(html) {
  const normalized = String(html || "").trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes("afmentertainment.org") &&
    !/<h[1-6]\b/i.test(normalized) &&
    !/<p\b[^>]*>[\s\S]*?<\/p>\s*<p\b/i.test(normalized)
  );
}

export function getAfmEntertainmentSourceFromPageBody(bodyHtml) {
  const raw = String(bodyHtml || "").trim();
  if (!raw) return AFM_ENTERTAINMENT_CANONICAL_SOURCE_HTML;

  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  const normalized = normalizeAfmEntertainmentSourceHtml(extracted || raw);
  return looksLikeLegacyPromoHtml(normalized) ? AFM_ENTERTAINMENT_CANONICAL_SOURCE_HTML : normalized;
}

export function getAfmEntertainmentDisplayHtmlFromSource(sourceHtml) {
  return normalizeAfmEntertainmentSourceHtml(sourceHtml);
}
