export function normalizeSidebarRoute(input) {
  const raw = String(input || "").trim();
  if (!raw) return "/";
  const [pathOnly] = raw.split(/[?#]/, 1);
  let route = pathOnly || "/";
  if (!route.startsWith("/")) {
    route = `/${route}`;
  }
  route = route.replace(/\/{2,}/g, "/");
  if (route.length > 1) {
    route = route.replace(/\/+$/, "");
  }
  return route || "/";
}
