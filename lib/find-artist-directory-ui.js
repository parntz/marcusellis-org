export function stripHtml(value = "") {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function getInitials(value = "") {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function getYouTubeThumbnail(url = "") {
  const id = String(url || "").match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/i)?.[1] || "";
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

export function normalizeArtistBandImageUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";

  const uploadPrefix = "/uploads/artist-band-profiles/";
  if (value.startsWith(uploadPrefix)) {
    const id = value.slice(uploadPrefix.length).split("/").filter(Boolean).pop() || "";
    return id ? `/api/artist-band-profiles/asset/${encodeURIComponent(id)}` : "";
  }

  return value;
}

export function getArtistBandImageCandidates(item = {}) {
  const candidates = [];
  const seen = new Set();
  const push = (value) => {
    const normalized = normalizeArtistBandImageUrl(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  push(item.pictureUrl);

  const sourcePath = String(item.sourcePath || "").trim().replace(/^\/+|\/+$/g, "");
  if (sourcePath) {
    push(`/_downloaded/${sourcePath}--asset`);
    push(`/_downloaded/users/${sourcePath}--asset`);
  }

  push(getYouTubeThumbnail(item.featuredVideoUrl));
  return candidates;
}

export function getCardImage(item = {}) {
  return getArtistBandImageCandidates(item)[0] || "";
}

export function getSummary(item = {}) {
  return stripHtml(item.descriptionHtml) || "Profile details available";
}
