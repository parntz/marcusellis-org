const LEGACY_HOSTS = new Set(["nashvillemusicians.org", "www.nashvillemusicians.org"]);
const LOCAL_MIRROR_PREFIX = "/_downloaded";

function isLegacyHost(hostname) {
  return LEGACY_HOSTS.has(String(hostname || "").toLowerCase());
}

function localMirrorAssetPath(pathname = "", suffix = "") {
  const path = String(pathname || "").trim();
  if (!path) return "";
  if (path.startsWith(LOCAL_MIRROR_PREFIX)) return `${path}${suffix}`;
  if (path.startsWith("/file/")) return `${LOCAL_MIRROR_PREFIX}${path}--asset${suffix}`;
  if (path.startsWith("/sites/default/files/")) return `${LOCAL_MIRROR_PREFIX}${path}${suffix}`;
  if (path.startsWith("/sites/default/themes/")) return `${LOCAL_MIRROR_PREFIX}${path}${suffix}`;
  return `${path}${suffix}`;
}

export function resolveLegacyAssetHref(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(LOCAL_MIRROR_PREFIX)) {
    return trimmed;
  }

  try {
    const u = new URL(trimmed, "https://nashvillemusicians.org");
    if (isLegacyHost(u.hostname) || trimmed.startsWith("/sites/default/")) {
      return localMirrorAssetPath(u.pathname, `${u.search}${u.hash}`);
    }
    return trimmed.startsWith("/") ? localMirrorAssetPath(u.pathname, `${u.search}${u.hash}`) : u.href;
  } catch {
    return trimmed.startsWith("/sites/default/") ? localMirrorAssetPath(trimmed) : trimmed;
  }
}
