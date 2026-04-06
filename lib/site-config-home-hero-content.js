import { getClient } from "./sqlite.mjs";
import { DEFAULT_HOME_HERO_CONTENT } from "./home-hero-content-defaults";

const KEY = "home_hero_content";

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHref(value) {
  return String(value || "").trim().slice(0, 500);
}

function normalizeCta(input, defaults) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    label: cleanText(parsed.label, 120) || defaults.label,
    href: cleanHref(parsed.href) || defaults.href,
  };
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    eyebrow: cleanText(parsed.eyebrow, 120) || DEFAULT_HOME_HERO_CONTENT.eyebrow,
    titleLine1: cleanText(parsed.titleLine1, 180) || DEFAULT_HOME_HERO_CONTENT.titleLine1,
    titleLine2: cleanText(parsed.titleLine2, 180) || DEFAULT_HOME_HERO_CONTENT.titleLine2,
    body: cleanText(parsed.body, 360) || DEFAULT_HOME_HERO_CONTENT.body,
    primaryCta: normalizeCta(parsed.primaryCta, DEFAULT_HOME_HERO_CONTENT.primaryCta),
    secondaryCta: normalizeCta(parsed.secondaryCta, DEFAULT_HOME_HERO_CONTENT.secondaryCta),
  };
}

export async function getHomeHeroContentConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_HOME_HERO_CONTENT);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_HOME_HERO_CONTENT);
  }
}

export async function setHomeHeroContentConfig(input) {
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
