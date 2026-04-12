import { getClient } from "./sqlite.mjs";
import { normalizeHeaderRoute } from "./page-header-editor.js";
import {
  getAfmEntertainmentSourceFromPageBody,
  AFM_ENTERTAINMENT_ROUTE,
} from "./afm-entertainment-html.mjs";
import {
  getLiveMusicSourceFromPageBody,
  LIVE_MUSIC_ROUTE,
} from "./live-music-html.mjs";
import { extractDirectorySourceHtml } from "./directory-page.mjs";
import {
  getSignatorySourceFromPageBody,
  SIGNATORY_INFORMATION_ROUTE,
} from "./signatory-html.mjs";

const MEMBERS_ONLY_DIRECTORY_ROUTE = "/members-only-directory";
const DIRECTORY_ROUTE = "/directory";
const ABOUT_ROUTE = "/about-us";
const UNION_PLUS_ROUTE = "/union-plus-program";
const MISSION_ROUTE = "/mission-statement";

const EDITABLE_BODY_ROUTES = new Set([
  SIGNATORY_INFORMATION_ROUTE,
  LIVE_MUSIC_ROUTE,
  MEMBERS_ONLY_DIRECTORY_ROUTE,
  DIRECTORY_ROUTE,
  AFM_ENTERTAINMENT_ROUTE,
  ABOUT_ROUTE,
  UNION_PLUS_ROUTE,
  MISSION_ROUTE,
]);

function getSourceHtmlForRoute(route, bodyHtml) {
  if (route === DIRECTORY_ROUTE) {
    return extractDirectorySourceHtml(bodyHtml);
  }
  if (route === AFM_ENTERTAINMENT_ROUTE) {
    return getAfmEntertainmentSourceFromPageBody(bodyHtml);
  }
  if (route === SIGNATORY_INFORMATION_ROUTE) {
    return getSignatorySourceFromPageBody(bodyHtml);
  }
  if (route === LIVE_MUSIC_ROUTE) {
    return getLiveMusicSourceFromPageBody(bodyHtml);
  }
  return String(bodyHtml ?? "");
}

export function assertEditableSitePageBodyRoute(routeInput) {
  const route = normalizeHeaderRoute(routeInput);
  if (!EDITABLE_BODY_ROUTES.has(route)) {
    throw new Error("This route does not support direct body editing.");
  }
  return route;
}

/** Source HTML shown in the admin textarea (Drupal wrapper stripped when present). */
export async function getEditableSitePageBodyForAdmin(routeInput) {
  const route = assertEditableSitePageBodyRoute(routeInput);
  const client = getClient();
  const rs = await client.execute({
    sql: `SELECT body_html AS bodyHtml FROM site_pages WHERE route = ? LIMIT 1`,
    args: [route],
  });
  const raw = String(rs.rows?.[0]?.bodyHtml ?? "");
  return {
    route,
    bodyHtml: getSourceHtmlForRoute(route, raw),
  };
}

/** Persists the same fragment the editor loads (not the full Drupal export). */
export async function updateEditableSitePageBody(routeInput, bodyHtml) {
  const route = assertEditableSitePageBodyRoute(routeInput);
  const html = String(bodyHtml ?? "");
  const client = getClient();
  const rs = await client.execute({
    sql: `SELECT route FROM site_pages WHERE route = ? LIMIT 1`,
    args: [route],
  });
  if (!rs.rows?.length) {
    throw new Error("Site page row not found for this route.");
  }
  await client.execute({
    sql: `UPDATE site_pages SET body_html = ?, updated_at = datetime('now') WHERE route = ?`,
    args: [html, route],
  });
  return {
    route,
    bodyHtml: getSourceHtmlForRoute(route, html),
  };
}
