import { getClient } from "./sqlite.mjs";
import { normalizeSidebarRoute } from "./normalize-sidebar-route.mjs";

const KEY_PREFIX = "route_callouts::";

function getKey(route, location = "header") {
  return `${KEY_PREFIX}${String(location || "header").trim() || "header"}::${route}`;
}

function normalizeLocation(value) {
  return String(value || "header").trim() || "header";
}

function normalizeConfig(route, location, input = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    route,
    location,
    enabled: Object.prototype.hasOwnProperty.call(parsed, "enabled") ? parsed.enabled !== false : true,
  };
}

export async function getRouteCalloutConfig(routeInput, locationInput = "header") {
  const route = normalizeSidebarRoute(routeInput);
  const location = normalizeLocation(locationInput);
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [getKey(route, location)],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) {
    return normalizeConfig(route, location);
  }

  try {
    return normalizeConfig(route, location, JSON.parse(raw));
  } catch {
    return normalizeConfig(route, location);
  }
}

export async function setRouteCalloutConfig(routeInput, locationInput = "header", input = {}) {
  const route = normalizeSidebarRoute(routeInput);
  const location = normalizeLocation(locationInput);
  const client = getClient();
  const normalized = normalizeConfig(route, location, input);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [getKey(route, location), JSON.stringify({ enabled: normalized.enabled })],
  });
  return normalized;
}
