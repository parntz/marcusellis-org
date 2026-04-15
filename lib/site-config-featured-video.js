import { getClient } from "./sqlite.mjs";
import { normalizeYouTubeEmbedUrl } from "./youtube.js";

const KEY = "featured_video_page_content";

export const DEFAULT_FEATURED_VIDEO_PAGE_CONTENT = Object.freeze({
  pageTitle: "Featured Video",
  pageDescription: "Watch the latest featured video from Natural Health Advocate.",
  videoEmbedSrc: "",
  thumbnailSrc: "",
});

function cleanText(value, max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function valueOrFallback(parsed, key, fallback) {
  return Object.prototype.hasOwnProperty.call(parsed, key) ? parsed[key] : fallback;
}

function normalize(input, defaults = DEFAULT_FEATURED_VIDEO_PAGE_CONTENT) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    pageTitle: cleanText(valueOrFallback(parsed, "pageTitle", defaults.pageTitle), 180),
    pageDescription: cleanText(valueOrFallback(parsed, "pageDescription", defaults.pageDescription), 320),
    videoEmbedSrc: normalizeYouTubeEmbedUrl(
      cleanText(valueOrFallback(parsed, "videoEmbedSrc", defaults.videoEmbedSrc), 1000)
    ),
    thumbnailSrc: cleanText(valueOrFallback(parsed, "thumbnailSrc", defaults.thumbnailSrc), 1000),
  };
}

export async function getFeaturedVideoPageConfig(defaults = DEFAULT_FEATURED_VIDEO_PAGE_CONTENT) {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize({}, defaults);

  try {
    const parsed = JSON.parse(raw);
    return normalize(parsed, defaults);
  } catch {
    return normalize({}, defaults);
  }
}

export async function setFeaturedVideoPageConfig(input, defaults = DEFAULT_FEATURED_VIDEO_PAGE_CONTENT) {
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
