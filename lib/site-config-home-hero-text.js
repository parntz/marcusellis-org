import { getClient } from "./sqlite.mjs";

const KEY = "home_hero_text";

export const DEFAULT_HOME_HERO_TEXT = Object.freeze({
  titleLine1: "Nashville Musicians",
  titleLine2: "Association",
  subheading: "AFM Local 257 — Since 1902",
  linkHref: "",
});

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHref(value) {
  return String(value || "").trim().slice(0, 500);
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    titleLine1: cleanText(parsed.titleLine1, 160) || DEFAULT_HOME_HERO_TEXT.titleLine1,
    titleLine2: cleanText(parsed.titleLine2, 160) || DEFAULT_HOME_HERO_TEXT.titleLine2,
    subheading: cleanText(parsed.subheading, 220) || DEFAULT_HOME_HERO_TEXT.subheading,
    linkHref: cleanHref(parsed.linkHref),
  };
}

export async function getHomeHeroTextConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return { ...DEFAULT_HOME_HERO_TEXT };

  try {
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return { ...DEFAULT_HOME_HERO_TEXT };
  }
}

export async function setHomeHeroTextConfig(input) {
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
