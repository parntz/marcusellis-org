import { getClient } from "./sqlite.mjs";
import { normalizeSidebarRoute } from "./normalize-sidebar-route.mjs";

const KEY_PREFIX = "route_sidebar::";

const DEFAULT_ENABLED_ROUTES = new Set([
  "/recording",
  "/news-and-events",
  "/signatory-information",
  "/live-scales-contracts-pension",
  "/free-rehearsal-hall",
  "/benefits-union-members",
  "/member-site-links",
  "/live-music",
  "/find-an-artist-or-band",
]);

export { normalizeSidebarRoute };

function getKey(route) {
  return `${KEY_PREFIX}${route}`;
}

function defaultEnabledForRoute(route) {
  return DEFAULT_ENABLED_ROUTES.has(route);
}

function normalizeConfig(route, input = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    route,
    enabled:
      Object.prototype.hasOwnProperty.call(parsed, "enabled")
        ? parsed.enabled !== false
        : defaultEnabledForRoute(route),
  };
}

export async function getRouteSidebarConfig(routeInput) {
  const route = normalizeSidebarRoute(routeInput);
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [getKey(route)],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) {
    return normalizeConfig(route);
  }

  try {
    return normalizeConfig(route, JSON.parse(raw));
  } catch {
    return normalizeConfig(route);
  }
}

export async function setRouteSidebarConfig(routeInput, input = {}) {
  const route = normalizeSidebarRoute(routeInput);
  const client = getClient();
  const normalized = normalizeConfig(route, input);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [getKey(route), JSON.stringify({ enabled: normalized.enabled })],
  });
  return normalized;
}
