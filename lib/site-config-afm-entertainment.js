import { getClient } from "./sqlite.mjs";

const KEY = "afm_entertainment_page_config";

export const DEFAULT_AFM_ENTERTAINMENT_PAGE_CONFIG = Object.freeze({
  screenshotSrc: "/images/afm-entertainment-home-raw.png",
});

function cleanHref(value, fallback = "") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  if (text.startsWith("/") || /^https?:\/\//i.test(text)) return text.slice(0, 2000);
  return fallback;
}

function normalize(input, defaults = DEFAULT_AFM_ENTERTAINMENT_PAGE_CONFIG) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    screenshotSrc: cleanHref(parsed.screenshotSrc, defaults.screenshotSrc),
  };
}

export async function getAfmEntertainmentPageConfig(defaults = DEFAULT_AFM_ENTERTAINMENT_PAGE_CONFIG) {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize({}, defaults);

  try {
    return normalize(JSON.parse(raw), defaults);
  } catch {
    return normalize({}, defaults);
  }
}

export async function setAfmEntertainmentPageConfig(input, defaults = DEFAULT_AFM_ENTERTAINMENT_PAGE_CONFIG) {
  const client = getClient();
  const normalized = normalize(input, defaults);
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
