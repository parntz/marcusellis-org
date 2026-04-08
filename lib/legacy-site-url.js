const LEGACY_HOSTS = new Set(["nashvillemusicians.org", "www.nashvillemusicians.org"]);
const LOCAL_MEMBER_UPLOAD_PREFIXES = ["/uploads/member-profiles/", "/api/member-profiles/asset/"];
const LOCAL_MIRROR_PREFIX = "/_downloaded";

function isLegacyHost(hostname) {
  return LEGACY_HOSTS.has(String(hostname || "").toLowerCase());
}

function isYouTubeHost(hostname) {
  return /(^|\.)youtube\.com$/i.test(String(hostname || "")) || /(^|\.)youtu\.be$/i.test(String(hostname || ""));
}

function localMirrorAssetPath(pathname = "", suffix = "") {
  const path = String(pathname || "").trim();
  if (!path) return "";
  if (path.startsWith(LOCAL_MIRROR_PREFIX)) return `${path}${suffix}`;
  if (path.startsWith("/sites/default/files/")) return `${LOCAL_MIRROR_PREFIX}${path}${suffix}`;
  return `${path}${suffix}`;
}

export function resolveMemberMediaHref(input, { allowYouTube = false } = {}) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith(LOCAL_MIRROR_PREFIX) ||
    LOCAL_MEMBER_UPLOAD_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
  ) {
    return trimmed;
  }

  try {
    const u = new URL(trimmed, "https://nashvillemusicians.org");
    if (allowYouTube && isYouTubeHost(u.hostname)) {
      return u.href;
    }
    if (isLegacyHost(u.hostname)) {
      return localMirrorAssetPath(u.pathname, `${u.search}${u.hash}`);
    }
    if (trimmed.startsWith("/")) {
      return localMirrorAssetPath(u.pathname, `${u.search}${u.hash}`);
    }
    return u.href;
  } catch {
    if (allowYouTube && /(youtube\.com|youtu\.be)/i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith("/")) {
      return localMirrorAssetPath(trimmed);
    }
    return trimmed;
  }
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
  return html
    .replace(
      /(\b(?:href|src)=["'])(?:https?:)?\/\/(?:www\.)?nashvillemusicians\.org/gi,
      "$1",
    )
    .replace(/(\bsrc=["'])\/sites\/default\/files\//gi, `$1${LOCAL_MIRROR_PREFIX}/sites/default/files/`)
    .replace(/(\bhref=["'])\/sites\/default\/files\//gi, `$1${LOCAL_MIRROR_PREFIX}/sites/default/files/`)
    .replace(/href=(["'])\/user\/login\/?\1/gi, 'href="/sign-in"');
}
