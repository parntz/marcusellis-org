const LEGACY_HOSTS = new Set(["nashvillemusicians.org", "www.nashvillemusicians.org"]);

function isLegacyHost(hostname) {
  return LEGACY_HOSTS.has(String(hostname || "").toLowerCase());
}

/**
 * If `canonical_url` points at the legacy Drupal site, return a path for this app (`/foo?bar`).
 * Otherwise return the absolute URL for true external links.
 * @returns {{ href: string, isInternal: boolean } | null}
 */
export function resolveMemberWebsiteHref(canonicalUrl) {
  if (canonicalUrl == null || String(canonicalUrl).trim() === "") return null;
  const trimmed = String(canonicalUrl).trim();
  try {
    const u = new URL(trimmed, "https://nashvillemusicians.org");
    if (isLegacyHost(u.hostname)) {
      const path = u.pathname + u.search + u.hash;
      return { href: path || "/", isInternal: true };
    }
    return { href: u.href, isInternal: false };
  } catch {
    if (trimmed.startsWith("/")) return { href: trimmed, isInternal: true };
    return { href: trimmed, isInternal: false };
  }
}

/**
 * Rewrites legacy site links in member HTML so they stay on the current origin (relative paths).
 * Only adjusts `href` on anchors — does not change `src` or other attributes.
 */
export function rewriteLegacyNashvilleSiteInHtml(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(
    /(\bhref=["'])(?:https?:)?\/\/(?:www\.)?nashvillemusicians\.org/gi,
    "$1",
  );
}
