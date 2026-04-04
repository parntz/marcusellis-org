import {
  pageMap,
  pages,
  primaryNav,
  siteMeta,
  siteStats,
  siteTheme,
  utilityNav,
} from "../content/generated/site-data.generated.js";

export { pageMap, pages, primaryNav, siteMeta, siteStats, siteTheme, utilityNav };

export function normalizeRouteFromSegments(segments = []) {
  if (!segments?.length) {
    return "/";
  }

  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

export function findPageByRoute(route = "/") {
  return pageMap[route] || null;
}
