function parseTimeToSeconds(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function extractYouTubeId(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, "https://placeholder.local");
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return parts[0] || "";
    }

    if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] || "";
      }
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || "";
      }
    }
  } catch {
    const embedMatch = raw.match(/\/embed\/([^?&/]+)/i);
    if (embedMatch) return embedMatch[1];
  }

  return "";
}

export function normalizeYouTubeEmbedUrl(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, "https://placeholder.local");
    const id = extractYouTubeId(raw);
    if (!id) return raw;

    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const isYouTubeHost =
      host === "youtu.be" ||
      host.endsWith("youtube.com") ||
      host === "youtube-nocookie.com" ||
      host === "placeholder.local";

    if (!isYouTubeHost) return raw;

    const start =
      parseTimeToSeconds(parsed.searchParams.get("start")) ||
      parseTimeToSeconds(parsed.searchParams.get("t"));

    const embed = new URL(`https://www.youtube.com/embed/${id}`);
    if (start > 0) {
      embed.searchParams.set("start", String(start));
    }
    return embed.toString();
  } catch {
    return raw;
  }
}
