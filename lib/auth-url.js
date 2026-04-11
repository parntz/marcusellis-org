export function getBaseUrlFromRequest(request) {
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.headers.get("x-forwarded-protocol") ||
    "https";
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.SITE_URL || "";
  return configured.replace(/\/+$/, "");
}
