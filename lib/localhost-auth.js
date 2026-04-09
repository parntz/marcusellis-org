function normalizeHostLike(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return new URL(raw).hostname;
    } catch {
      return "";
    }
  }
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    return end > 0 ? raw.slice(1, end).toLowerCase() : raw.toLowerCase();
  }
  const host = raw.split(",")[0].trim();
  const colonCount = (host.match(/:/g) || []).length;
  if (colonCount <= 1) {
    return host.split(":")[0].trim().toLowerCase();
  }
  return host.toLowerCase();
}

export function isLoopbackHostname(value) {
  const hostname = normalizeHostLike(value);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isLocalhostRequestLike(source) {
  if (!source) return false;

  const direct =
    source.headers?.get?.("x-forwarded-host") ||
    source.headers?.get?.("host") ||
    source.headers?.["x-forwarded-host"] ||
    source.headers?.host ||
    source.host ||
    source.hostname ||
    source.origin ||
    source.url;

  if (isLoopbackHostname(direct)) {
    return true;
  }

  const referer =
    source.headers?.get?.("referer") ||
    source.headers?.get?.("origin") ||
    source.headers?.referer ||
    source.headers?.origin;

  return isLoopbackHostname(referer);
}

export function isLocalhostAuthEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
  return isLoopbackHostname(configuredUrl);
}
