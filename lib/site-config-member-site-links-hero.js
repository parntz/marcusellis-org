import { getClient } from "./sqlite.mjs";

const KEY = "member_site_links_hero";

const DEFAULT_MEMBER_SITE_LINKS_HERO = {
  eyebrow: "Member Directory",
  title: "Member sites that still point somewhere useful",
  body:
    "Old local-site link pages tend to decay. This version keeps the public member-site list in a cleaner directory, points moved domains at their current homes when possible, and leaves out the clearly dead entries.",
  statLabel: "Published Links",
  statBody: "This directory is now maintained on-site by admins.",
};

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function valueOrFallback(parsed, key, fallback) {
  return Object.prototype.hasOwnProperty.call(parsed, key) ? parsed[key] : fallback;
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    eyebrow: cleanText(valueOrFallback(parsed, "eyebrow", DEFAULT_MEMBER_SITE_LINKS_HERO.eyebrow), 120),
    title: cleanText(valueOrFallback(parsed, "title", DEFAULT_MEMBER_SITE_LINKS_HERO.title), 180),
    body: cleanText(valueOrFallback(parsed, "body", DEFAULT_MEMBER_SITE_LINKS_HERO.body), 420),
    statLabel: cleanText(valueOrFallback(parsed, "statLabel", DEFAULT_MEMBER_SITE_LINKS_HERO.statLabel), 120),
    statBody: cleanText(valueOrFallback(parsed, "statBody", DEFAULT_MEMBER_SITE_LINKS_HERO.statBody), 240),
  };
}

export async function getMemberSiteLinksHeroConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_MEMBER_SITE_LINKS_HERO);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_MEMBER_SITE_LINKS_HERO);
  }
}

export async function setMemberSiteLinksHeroConfig(input) {
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
