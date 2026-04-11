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

export function getCardImage(item = {}) {
  return item.pictureUrl || getYouTubeThumbnail(item.featuredVideoUrl) || "";
}

export function getSummary(item = {}) {
  return stripHtml(item.descriptionHtml) || "Profile details available";
}
