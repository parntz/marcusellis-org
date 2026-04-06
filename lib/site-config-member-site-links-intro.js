import { getClient } from "./sqlite.mjs";

const KEY = "member_site_links_intro";

function cleanHtml(value, fallback = "") {
  const html = String(value || "").trim();
  return html || String(fallback || "").trim();
}

function normalize(input, defaults = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    html: cleanHtml(parsed.html, defaults.html),
  };
}

export async function getMemberSiteLinksIntroConfig(defaults = { html: "" }) {
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

export async function setMemberSiteLinksIntroConfig(input, defaults = { html: "" }) {
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
