import { DEFAULT_HERO_HOME } from "./hero-home-defaults.mjs";
import { getClient } from "./sqlite.mjs";

/** @param {unknown} parsed */
function migrateLegacyGrowSeconds(parsed) {
  if (typeof parsed?.growSeconds !== "number" || Number.isNaN(parsed.growSeconds)) {
    return null;
  }
  const gs = parsed.growSeconds;
  if (gs < 60) {
    return 0;
  }
  const mapped = 100 - Math.round(((gs - 60) / (600 - 60)) * 99);
  return Math.max(0, Math.min(100, mapped));
}

function normalizeGrowSlider(parsed) {
  if (typeof parsed?.growSlider === "number" && !Number.isNaN(parsed.growSlider)) {
    const n = Math.round(parsed.growSlider);
    if (n >= 0 && n <= 100) {
      return n;
    }
  }
  const legacy = migrateLegacyGrowSeconds(parsed);
  if (legacy !== null) {
    return legacy;
  }
  return DEFAULT_HERO_HOME.growSlider;
}

const KEY = "hero_home";

export { DEFAULT_HERO_HOME };

function normalizeTransitionSeconds(raw) {
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return DEFAULT_HERO_HOME.transitionSeconds;
  }
  const t = Math.round(raw * 10) / 10;
  if (t <= 0) {
    return 0;
  }
  if (t < 0.2) {
    return 0.2;
  }
  if (t > 5) {
    return 5;
  }
  return t;
}

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

  const transitionSeconds = normalizeTransitionSeconds(parsed?.transitionSeconds);
  const growSlider = normalizeGrowSlider(parsed);

  return {
    images: images.length ? images : [...DEFAULT_HERO_HOME.images],
    delaySeconds,
    transitionSeconds,
    growSlider,
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
    transitionSeconds: normalized.transitionSeconds,
    growSlider: normalized.growSlider,
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
