import { getClient } from "./sqlite.mjs";
import { DEFAULT_MEDIA_HUB, MEDIA_HUB_PANEL_ORDER } from "./media-hub-defaults.mjs";
import { resolveLegacyAssetHref } from "./legacy-site-url.js";

const KEY = "media_hub";

function cleanText(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanHtml(value, max) {
  return String(value || "").trim().slice(0, max);
}

function cleanHref(value) {
  return resolveLegacyAssetHref(String(value || "").trim()).slice(0, 500);
}

function normalizePanel(input, defaults) {
  const parsed = input && typeof input === "object" ? input : {};
  const bg = cleanHref(parsed.backgroundImageSrc) || defaults.backgroundImageSrc;
  const pos = cleanText(parsed.backgroundPosition, 40) || defaults.backgroundPosition || "center";
  return {
    kicker: cleanText(parsed.kicker, 80) || defaults.kicker,
    title: cleanText(parsed.title, 160) || defaults.title,
    body: cleanText(parsed.body, 400) || defaults.body,
    ctaLabel: cleanText(parsed.ctaLabel, 120) || defaults.ctaLabel,
    ctaHref: cleanHref(parsed.ctaHref) || defaults.ctaHref,
    backgroundImageSrc: bg,
    backgroundPosition: pos,
  };
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  const panelsIn = parsed.panels && typeof parsed.panels === "object" ? parsed.panels : {};
  const panels = {};
  for (const id of MEDIA_HUB_PANEL_ORDER) {
    panels[id] = normalizePanel(panelsIn[id], DEFAULT_MEDIA_HUB.panels[id]);
  }
  return {
    introTitle: cleanText(parsed.introTitle, 200) || DEFAULT_MEDIA_HUB.introTitle,
    introHtml: cleanHtml(parsed.introHtml, 8000) || DEFAULT_MEDIA_HUB.introHtml,
    panels,
  };
}

export async function getMediaHubConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_MEDIA_HUB);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_MEDIA_HUB);
  }
}

export async function setMediaHubConfig(input) {
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
