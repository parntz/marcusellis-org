import { getClient } from "./sqlite.mjs";
import { DEFAULT_HOME_PANELS } from "./home-panels-defaults";
import { resolveLegacyAssetHref } from "./legacy-site-url.js";

const KEY = "home_panels";

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHref(value) {
  return resolveLegacyAssetHref(String(value || "").trim()).slice(0, 500);
}

function normalizePanel(input, defaults) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    kicker: cleanText(parsed.kicker, 80) || defaults.kicker,
    title: cleanText(parsed.title, 160) || defaults.title,
    body: cleanText(parsed.body, 320) || defaults.body,
    ctaLabel: cleanText(parsed.ctaLabel, 120) || defaults.ctaLabel,
    ctaHref: cleanHref(parsed.ctaHref) || defaults.ctaHref,
    backgroundImageSrc: cleanHref(parsed.backgroundImageSrc) || defaults.backgroundImageSrc,
  };
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    parking: normalizePanel(parsed.parking, DEFAULT_HOME_PANELS.parking),
    travel: normalizePanel(parsed.travel, DEFAULT_HOME_PANELS.travel),
  };
}

export async function getHomePanelsConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_HOME_PANELS);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_HOME_PANELS);
  }
}

export async function setHomePanelsConfig(input) {
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
