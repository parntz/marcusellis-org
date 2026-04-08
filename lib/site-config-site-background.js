import { getClient } from "./sqlite.mjs";

const KEY = "site_background";

const DEFAULT_SITE_BACKGROUND_CONFIG = {
  opacity: 1,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  const raw = Number(parsed.opacity);
  return {
    opacity: Number.isFinite(raw) ? clamp(Math.round(raw * 1000) / 1000, 0, 1) : DEFAULT_SITE_BACKGROUND_CONFIG.opacity,
  };
}

export async function getSiteBackgroundConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_SITE_BACKGROUND_CONFIG);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_SITE_BACKGROUND_CONFIG);
  }
}

export async function setSiteBackgroundConfig(input) {
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
    args: [KEY, JSON.stringify(normalized)],
  });
  return normalized;
}
