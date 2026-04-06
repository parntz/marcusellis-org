import { getClient } from "./sqlite.mjs";
import { decodeHtmlEntities } from "./decode-html-entities.js";
import { normalizeYouTubeEmbedUrl } from "./youtube.js";

const KEY = "recording_page_content";

export const DEFAULT_RECORDING_PAGE_CONTENT = Object.freeze({
  mainHtml: "",
  videoEmbedSrc: "",
  thumbnailSrc: "",
  youtubeKicker: "YouTube video",
  videoHeadline: "Single song overdub scale",
});

function cleanText(value, max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHtml(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMainHtmlToParagraphs(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const withParagraphBreaks = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|aside|header|footer|blockquote|pre|li|ul|ol|h1|h2|h3|h4|h5|h6|table|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n?/g, "\n");

  const decoded = decodeHtmlEntities(withParagraphBreaks)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");

  const paragraphs = decoded
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n");
}

function valueOrFallback(parsed, key, fallback) {
  return Object.prototype.hasOwnProperty.call(parsed, key) ? parsed[key] : fallback;
}

function normalize(input, defaults = DEFAULT_RECORDING_PAGE_CONTENT) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    mainHtml: normalizeMainHtmlToParagraphs(valueOrFallback(parsed, "mainHtml", defaults.mainHtml)),
    videoEmbedSrc: normalizeYouTubeEmbedUrl(
      cleanText(valueOrFallback(parsed, "videoEmbedSrc", defaults.videoEmbedSrc), 1000)
    ),
    thumbnailSrc: cleanText(valueOrFallback(parsed, "thumbnailSrc", defaults.thumbnailSrc), 1000),
    youtubeKicker: cleanText(valueOrFallback(parsed, "youtubeKicker", defaults.youtubeKicker), 120),
    videoHeadline: cleanText(valueOrFallback(parsed, "videoHeadline", defaults.videoHeadline), 180),
  };
}

export async function getRecordingPageConfig(defaults = DEFAULT_RECORDING_PAGE_CONTENT) {
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

export async function setRecordingPageConfig(input, defaults = DEFAULT_RECORDING_PAGE_CONTENT) {
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
