import { getClient } from "./sqlite.mjs";

function stripImgTagsFromHtml(html) {
  if (html == null || typeof html !== "string") return "";
  let out = html.replace(/<img\b[^>]*>/gi, "");
  out = out.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "");
  return out;
}

const PAGE_CONFIG_KEY = "photo_gallery_page";

export const DEFAULT_PHOTO_GALLERY_PAGE = Object.freeze({
  eyebrow: "Media Archive",
  title: "Photo and Video Gallery",
  body:
    "A curated Local 257 archive of performance photos, studio moments, and video from the association's media history.",
});

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultilineText(value, max = 1200) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function cleanUrl(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function normalizeMediaType(value) {
  return String(value || "").trim().toLowerCase() === "video" ? "video" : "image";
}

function normalizePageConfig(input) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    eyebrow: cleanText(parsed.eyebrow ?? DEFAULT_PHOTO_GALLERY_PAGE.eyebrow, 120),
    title: cleanText(parsed.title ?? DEFAULT_PHOTO_GALLERY_PAGE.title, 180),
    body: cleanMultilineText(parsed.body ?? DEFAULT_PHOTO_GALLERY_PAGE.body, 800),
  };
}

function mapItemRow(row) {
  return {
    id: Number(row.id),
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    descriptionHtml: String(row.description_html || ""),
    mediaType: normalizeMediaType(row.media_type),
    imageUrl: String(row.image_url || ""),
    imageAlt: String(row.image_alt || ""),
    videoUrl: String(row.video_url || ""),
    sourceUrl: String(row.source_url || ""),
    sourceImageUrl: String(row.source_image_url || ""),
    displayOrder: Number(row.display_order || 0),
    isPublished: Boolean(row.is_published ?? 1),
  };
}

function normalizeItemInput(raw, index = 0) {
  const item = raw && typeof raw === "object" ? raw : {};
  const mediaType = normalizeMediaType(item.mediaType ?? item.media_type);
  return {
    slug: cleanText(item.slug || "", 180).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    title: cleanText(item.title || "", 240),
    descriptionHtml: stripImgTagsFromHtml(String(item.descriptionHtml ?? item.description_html ?? "")),
    mediaType,
    imageUrl: cleanUrl(item.imageUrl ?? item.image_url),
    imageAlt: cleanText(item.imageAlt ?? item.image_alt, 240),
    videoUrl: cleanUrl(item.videoUrl ?? item.video_url),
    sourceUrl: cleanUrl(item.sourceUrl ?? item.source_url),
    sourceImageUrl: cleanUrl(item.sourceImageUrl ?? item.source_image_url),
    displayOrder: Number.isFinite(Number(item.displayOrder ?? item.display_order))
      ? Number(item.displayOrder ?? item.display_order)
      : index,
    isPublished:
      item.isPublished === undefined && item.is_published === undefined
        ? true
        : Boolean(item.isPublished ?? item.is_published),
  };
}

export async function ensurePhotoGalleryTables(client = getClient()) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS photo_gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      description_html TEXT NOT NULL DEFAULT '',
      media_type TEXT NOT NULL DEFAULT 'image',
      image_url TEXT NOT NULL DEFAULT '',
      image_alt TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      source_image_url TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_photo_gallery_items_order
      ON photo_gallery_items(display_order ASC, id ASC);
  `);
}

export async function getPhotoGalleryPageConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [PAGE_CONFIG_KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalizePageConfig(DEFAULT_PHOTO_GALLERY_PAGE);
  try {
    return normalizePageConfig(JSON.parse(raw));
  } catch {
    return normalizePageConfig(DEFAULT_PHOTO_GALLERY_PAGE);
  }
}

export async function setPhotoGalleryPageConfig(input) {
  const client = getClient();
  const normalized = normalizePageConfig(input);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [PAGE_CONFIG_KEY, JSON.stringify(normalized)],
  });
  return normalized;
}

export async function listPhotoGalleryItems({ includeUnpublished = false } = {}) {
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        description_html,
        media_type,
        image_url,
        image_alt,
        video_url,
        source_url,
        source_image_url,
        display_order,
        is_published
      FROM photo_gallery_items
      ${includeUnpublished ? "" : "WHERE is_published = 1"}
      ORDER BY display_order ASC, id ASC
    `,
  });
  return (rs.rows || []).map(mapItemRow);
}

export async function getPhotoGalleryItemById(id) {
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("Invalid gallery item id.");
  }
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        description_html,
        media_type,
        image_url,
        image_alt,
        video_url,
        source_url,
        source_image_url,
        display_order,
        is_published
      FROM photo_gallery_items
      WHERE id = ?
      LIMIT 1
    `,
    args: [itemId],
  });
  const row = rs.rows?.[0];
  if (!row) {
    throw new Error("Gallery item not found.");
  }
  return mapItemRow(row);
}

export async function updatePhotoGalleryItemById(id, patch) {
  const current = await getPhotoGalleryItemById(id);
  const merged = normalizeItemInput(
    {
      ...current,
      ...patch,
      slug: patch?.slug ?? current.slug,
      displayOrder: patch?.displayOrder ?? current.displayOrder,
      isPublished: patch?.isPublished ?? current.isPublished,
    },
    current.displayOrder
  );
  if (!merged.slug) {
    merged.slug = `gallery-item-${current.id}`;
  }
  if (!merged.title) {
    throw new Error("Title is required.");
  }
  if (!merged.imageUrl) {
    throw new Error("Image URL is required.");
  }
  if (merged.mediaType === "video" && !merged.videoUrl) {
    throw new Error("Video URL is required for video items.");
  }

  const client = getClient();
  await ensurePhotoGalleryTables(client);
  await client.execute({
    sql: `
      UPDATE photo_gallery_items
      SET
        slug = ?,
        title = ?,
        description_html = ?,
        media_type = ?,
        image_url = ?,
        image_alt = ?,
        video_url = ?,
        source_url = ?,
        source_image_url = ?,
        display_order = ?,
        is_published = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      merged.slug,
      merged.title,
      merged.descriptionHtml,
      merged.mediaType,
      merged.imageUrl,
      merged.imageAlt,
      merged.videoUrl,
      merged.sourceUrl,
      merged.sourceImageUrl,
      merged.displayOrder,
      merged.isPublished ? 1 : 0,
      Number(id),
    ],
  });
  return getPhotoGalleryItemById(id);
}

export async function replacePhotoGalleryItems(itemsInput) {
  const items = Array.isArray(itemsInput) ? itemsInput : [];
  const normalized = items.map((item, index) => normalizeItemInput(item, index));
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  await client.execute("DELETE FROM photo_gallery_items");
  if (!normalized.length) {
    return [];
  }

  const batch = normalized.map((item, index) => ({
    sql: `
      INSERT INTO photo_gallery_items (
        slug,
        title,
        description_html,
        media_type,
        image_url,
        image_alt,
        video_url,
        source_url,
        source_image_url,
        display_order,
        is_published,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      item.slug || `gallery-item-${index + 1}`,
      item.title || `Gallery Item ${index + 1}`,
      item.descriptionHtml,
      item.mediaType,
      item.imageUrl,
      item.imageAlt || item.title || `Gallery item ${index + 1}`,
      item.videoUrl,
      item.sourceUrl,
      item.sourceImageUrl,
      item.displayOrder,
      item.isPublished ? 1 : 0,
    ],
  }));

  await client.batch(batch, "write");
  return listPhotoGalleryItems({ includeUnpublished: true });
}
