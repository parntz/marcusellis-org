/**
 * Single source of truth for whether the header member-notice strip renders.
 * Must stay in sync with PageHeaderWithCallout (hideCallout only on /users/[slug]).
 */
export function computeHeaderNoticeStripVisible({
  route = "",
  hideCallout = false,
  routeCalloutEnabled = true,
  globalCalloutEnabled = true,
  headerCalloutCount = 0,
  isAdmin = false,
}) {
  const suppressCalloutByRoute =
    typeof route === "string" && (route.startsWith("/users/") || route.startsWith("/user/"));
  const routeOk = routeCalloutEnabled !== false;
  const globalOk = globalCalloutEnabled !== false;
  return (
    !hideCallout &&
    !suppressCalloutByRoute &&
    routeOk &&
    globalOk &&
    (headerCalloutCount > 0 || Boolean(isAdmin))
  );
}
