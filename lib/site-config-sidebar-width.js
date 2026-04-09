import { getClient } from "./sqlite.mjs";
import {
  SIDEBAR_WIDTH_STEP_DEFAULT,
  clampSidebarWidthStep,
  sidebarWidthPxFromStep,
} from "./sidebar-width-shared.js";

const KEY = "sidebar_width";

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  const widthStep = Object.prototype.hasOwnProperty.call(parsed, "widthStep")
    ? clampSidebarWidthStep(parsed.widthStep)
    : SIDEBAR_WIDTH_STEP_DEFAULT;
  return {
    widthStep,
    widthPx: sidebarWidthPxFromStep(widthStep),
  };
}

export async function getSidebarWidthConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize({});

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize({});
  }
}

export async function setSidebarWidthConfig(input) {
  const client = getClient();
  const normalized = normalize(input);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [KEY, JSON.stringify({ widthStep: normalized.widthStep })],
  });
  return normalized;
}
