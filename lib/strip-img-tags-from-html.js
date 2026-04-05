/**
 * Removes embedded images from HTML strings (admin-edited content).
 * Void <img> tags and <picture>…</picture> blocks only.
 */
export function stripImgTagsFromHtml(html) {
  if (html == null || typeof html !== "string") return "";
  let out = html.replace(/<img\b[^>]*>/gi, "");
  out = out.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "");
  return out;
}
