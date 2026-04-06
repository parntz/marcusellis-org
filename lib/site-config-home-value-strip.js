import { getClient } from "./sqlite.mjs";
import { DEFAULT_HOME_VALUE_STRIP } from "./home-value-strip-defaults";

const KEY = "home_value_strip";

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeItem(input, defaults) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    label: cleanText(parsed.label, 80) || defaults.label,
    headline: cleanText(parsed.headline, 180) || defaults.headline,
  };
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    advocacy: normalizeItem(parsed.advocacy, DEFAULT_HOME_VALUE_STRIP.advocacy),
    protection: normalizeItem(parsed.protection, DEFAULT_HOME_VALUE_STRIP.protection),
    community: normalizeItem(parsed.community, DEFAULT_HOME_VALUE_STRIP.community),
    opportunity: normalizeItem(parsed.opportunity, DEFAULT_HOME_VALUE_STRIP.opportunity),
  };
}

export async function getHomeValueStripConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_HOME_VALUE_STRIP);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_HOME_VALUE_STRIP);
  }
}

export async function setHomeValueStripConfig(input) {
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
