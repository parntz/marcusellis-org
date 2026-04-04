import { DEFAULT_HERO_HOME } from "./hero-home-defaults.mjs";
import { getClient } from "./sqlite.mjs";

const KEY = "hero_home";

export { DEFAULT_HERO_HOME };

function normalizeHeroPayload(parsed) {
  const images = Array.isArray(parsed?.images)
    ? parsed.images.filter((u) => typeof u === "string" && u.length > 0).slice(0, 6)
    : [];
  const delaySeconds =
    typeof parsed?.delaySeconds === "number" &&
    parsed.delaySeconds >= 3 &&
    parsed.delaySeconds <= 15
      ? Math.round(parsed.delaySeconds)
      : DEFAULT_HERO_HOME.delaySeconds;

  return {
    images: images.length ? images : [...DEFAULT_HERO_HOME.images],
    delaySeconds,
  };
}

export async function getHeroHomeConfig() {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: "SELECT value FROM site_config WHERE key = ?",
      args: [KEY],
    });
    const row = rs.rows[0];
    if (!row?.value) {
      return { ...DEFAULT_HERO_HOME, images: [...DEFAULT_HERO_HOME.images] };
    }
    const parsed = JSON.parse(String(row.value));
    return normalizeHeroPayload(parsed);
  } catch {
    return { ...DEFAULT_HERO_HOME, images: [...DEFAULT_HERO_HOME.images] };
  }
}

export async function setHeroHomeConfig(config) {
  const normalized = normalizeHeroPayload(config);
  const payload = JSON.stringify({
    images: normalized.images,
    delaySeconds: normalized.delaySeconds,
  });
  const client = getClient();
  await client.execute({
    sql: `
    INSERT INTO site_config (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `,
    args: [KEY, payload],
  });
  return normalized;
}
