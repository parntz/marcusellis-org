import { getClient } from "./sqlite.mjs";
import { decodeHtmlEntities } from "./decode-html-entities.js";

function stripImgTagsFromHtml(html) {
  if (html == null || typeof html !== "string") return "";
  let out = html.replace(/<img\b[^>]*>/gi, "");
  out = out.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "");
  return out;
}

const PAGE_CONFIG_KEY = "photo_gallery_page";

/** Cards per page on /photo-and-video-gallery (random order uses same page size for page 1). */
export const PHOTO_GALLERY_PAGE_SIZE = 20;

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

function normalizeAssociatedMemberName(value, instrument = "") {
  let name = String(value || "")
    .replace(/\bsite:[^\s]+/gi, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return "";

  const normalizedInstrument = String(instrument || "").trim();
  if (normalizedInstrument) {
    const suffixPattern = new RegExp(`(?:\\s*[-,:/]\\s*|\\s+)${normalizedInstrument.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    name = name.replace(suffixPattern, "").trim();
  }

  return name.replace(/^["'“”]+|["'“”]+$/g, "").trim();
}

function extractAssociatedMemberFromSource(source) {
  const instrument =
    String(
      source?.first_primary_instrument ||
        source?.primary_instrument ||
        source?.instrument ||
        source?.member_instrument ||
        ""
    ).trim() || null;

  const explicitName = [
    String(source?.first_name || "").trim(),
    String(source?.last_name || "").trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fallbackName =
    normalizeAssociatedMemberName(source?.full_name, instrument || "") ||
    normalizeAssociatedMemberName(source?.member_name, instrument || "") ||
    normalizeAssociatedMemberName(source?.name, instrument || "") ||
    normalizeAssociatedMemberName(source?.member_search_query, instrument || "");

  const name = explicitName || fallbackName;
  if (!name) return null;

  return {
    name,
    memberId: String(source?.member_id || source?.memberId || "").trim() || null,
    instrument,
  };
}

function normalizeMemberLookupKey(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Public union-member tags derived from discovery_json.sources (import pipeline).
 * Raw discovery JSON is never sent to the client.
 */
function extractTaggedMembersFromDiscoveryJson(raw) {
  const str = String(raw || "").trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    const sources = [
      ...(Array.isArray(parsed.sources) ? parsed.sources : []),
      ...(Array.isArray(parsed.members) ? parsed.members : []),
      ...(Array.isArray(parsed.taggedMembers) ? parsed.taggedMembers : []),
    ];
    const seen = new Set();
    const list = [];
    for (const s of sources) {
      const member = extractAssociatedMemberFromSource(s);
      if (!member?.name) continue;
      const mid = String(member.memberId || "").trim();
      const name = String(member.name || "").trim();
      const key = mid ? `id:${mid}` : `name:${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        name,
        memberId: mid || null,
        instrument: member.instrument || null,
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return list;
  } catch {
    return [];
  }
}

async function attachTaggedMemberProfileLinks(client, items) {
  const list = Array.isArray(items) ? items : [];
  const memberIds = new Set();
  const memberNames = new Set();

  for (const item of list) {
    for (const member of Array.isArray(item?.taggedMembers) ? item.taggedMembers : []) {
      const raw = String(member?.memberId || "").trim();
      if (/^\d+$/.test(raw)) {
        memberIds.add(Number.parseInt(raw, 10));
      }
      const nameKey = normalizeMemberLookupKey(member?.name);
      if (nameKey) {
        memberNames.add(nameKey);
      }
    }
  }

  if (!memberIds.size && !memberNames.size) {
    return list;
  }

  const slugById = new Map();
  if (memberIds.size) {
    const placeholders = [...memberIds].map(() => "?").join(", ");
    const rs = await client.execute({
      sql: `SELECT id, slug FROM member_pages WHERE id IN (${placeholders})`,
      args: [...memberIds],
    });
    for (const row of rs.rows || []) {
      const slug = String(row.slug || "").trim();
      if (slug) {
        slugById.set(String(row.id), slug);
      }
    }
  }

  const slugByName = new Map();
  if (memberNames.size) {
    const rs = await client.execute({
      sql: `
        SELECT
          id,
          slug,
          title,
          first_name AS firstName,
          last_name AS lastName
        FROM member_pages
        WHERE slug IS NOT NULL AND TRIM(slug) != ''
      `,
    });
    for (const row of rs.rows || []) {
      const slug = String(row.slug || "").trim();
      if (!slug) continue;
      const keys = [
        normalizeMemberLookupKey(row.title),
        normalizeMemberLookupKey([row.firstName, row.lastName].filter(Boolean).join(" ")),
      ].filter(Boolean);
      for (const key of keys) {
        if (!slugByName.has(key)) {
          slugByName.set(key, slug);
        }
      }
    }
  }

  return list.map((item) => ({
    ...item,
    taggedMembers: (Array.isArray(item?.taggedMembers) ? item.taggedMembers : []).map((member) => {
      const memberId = String(member?.memberId || "").trim();
      const slug = slugById.get(memberId) || slugByName.get(normalizeMemberLookupKey(member?.name));
      return {
        ...member,
        profileHref: slug ? `/users/${slug}` : null,
      };
    }),
  }));
}

/** Never expose transcript or raw discovery JSON to clients (search-only in DB). */
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
    taggedMembers: extractTaggedMembersFromDiscoveryJson(row.discovery_json),
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
    youtubeVideoId: cleanText(item.youtubeVideoId ?? item.youtube_video_id ?? "", 32),
    transcript: String(item.transcript ?? item.transcript_text ?? "").slice(0, 500_000),
    discoveryJson: String(item.discoveryJson ?? item.discovery_json ?? "").slice(0, 200_000),
  };
}

function publishedWhereClause(includeUnpublished) {
  return includeUnpublished ? "1 = 1" : "is_published = 1";
}

/** Escape LIKE wildcards; pattern is lowercased for case-insensitive match. */
function searchLikePattern(searchQuery) {
  const needle = String(searchQuery || "").trim().slice(0, 200);
  if (!needle) return null;
  const lower = needle.toLowerCase();
  const escaped = lower.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return `%${escaped}%`;
}

function searchAndArgs(searchQuery) {
  const pat = searchLikePattern(searchQuery);
  if (!pat) {
    return { sql: "", args: [] };
  }
  return {
    sql: ` AND (
      lower(title) LIKE ? ESCAPE '\\'
      OR lower(description_html) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(transcript, '')) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(discovery_json, '')) LIKE ? ESCAPE '\\'
    )`,
    args: [pat, pat, pat, pat],
  };
}

const GALLERY_LIST_SELECT = `
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
    is_published,
    discovery_json
  FROM photo_gallery_items
`;

async function ensurePhotoGalleryExtraColumns(client) {
  const info = await client.execute("PRAGMA table_info(photo_gallery_items)");
  const names = new Set((info.rows || []).map((r) => String(r.name || "")));
  const alters = [];
  if (!names.has("youtube_video_id")) {
    alters.push("ALTER TABLE photo_gallery_items ADD COLUMN youtube_video_id TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("transcript")) {
    alters.push("ALTER TABLE photo_gallery_items ADD COLUMN transcript TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("discovery_json")) {
    alters.push("ALTER TABLE photo_gallery_items ADD COLUMN discovery_json TEXT NOT NULL DEFAULT ''");
  }
  for (const sql of alters) {
    await client.execute(sql);
  }
  await client.execute(
    "CREATE INDEX IF NOT EXISTS idx_photo_gallery_youtube_video_id ON photo_gallery_items(youtube_video_id)"
  );
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
  await ensurePhotoGalleryExtraColumns(client);
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

export async function getPhotoGalleryStats({ includeUnpublished = false } = {}) {
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const pub = publishedWhereClause(includeUnpublished);
  const rs = await client.execute({
    sql: `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN lower(media_type) = 'video' THEN 1 ELSE 0 END), 0) AS videos,
        COALESCE(SUM(CASE WHEN lower(media_type) != 'video' THEN 1 ELSE 0 END), 0) AS photos
      FROM photo_gallery_items
      WHERE ${pub}
    `,
  });
  const row = rs.rows?.[0] || {};
  return {
    total: Number(row.total || 0),
    videos: Number(row.videos || 0),
    photos: Number(row.photos || 0),
  };
}

/**
 * @param {{ includeUnpublished?: boolean, searchQuery?: string, limit?: number | null, offset?: number }} opts
 * limit null omits LIMIT (full list).
 */
export async function listPhotoGalleryItems({
  includeUnpublished = false,
  searchQuery = "",
  limit = null,
  offset = 0,
} = {}) {
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const pub = publishedWhereClause(includeUnpublished);
  const { sql: searchSql, args: searchArgs } = searchAndArgs(searchQuery);
  let sql = `${GALLERY_LIST_SELECT} WHERE ${pub}${searchSql} ORDER BY display_order ASC, id ASC`;
  const args = [...searchArgs];
  if (limit != null && Number.isFinite(Number(limit))) {
    sql += " LIMIT ? OFFSET ?";
    args.push(Number(limit), Math.max(0, Number(offset) || 0));
  }
  const rs = await client.execute({ sql, args });
  return attachTaggedMemberProfileLinks(client, (rs.rows || []).map(mapItemRow));
}

function normalizeShuffleSeed(raw) {
  const parsed = Number.parseInt(String(raw || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function buildGalleryOrderClause(shuffleSeed) {
  const normalizedSeed = normalizeShuffleSeed(shuffleSeed);
  if (!normalizedSeed) {
    return {
      sql: "ORDER BY display_order ASC, id ASC",
      args: [],
    };
  }
  const primary = (normalizedSeed % 2147483629) + 1;
  const secondary = ((normalizedSeed * 48271) % 2147483587) + 1;
  return {
    sql: `
      ORDER BY
        ((id * ?) % 2147483647) ASC,
        ((id * ?) % 2147483629) ASC,
        id ASC
    `,
    args: [primary, secondary],
  };
}

/**
 * Paginated list + total matching search (transcript / discovery_json included in search, never returned).
 */
export async function listPhotoGalleryItemsPaged({
  includeUnpublished = false,
  searchQuery = "",
  limit = PHOTO_GALLERY_PAGE_SIZE,
  offset = 0,
  shuffleSeed = null,
} = {}) {
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const pub = publishedWhereClause(includeUnpublished);
  const { sql: searchSql, args: searchArgs } = searchAndArgs(searchQuery);
  const { sql: orderSql, args: orderArgs } = buildGalleryOrderClause(shuffleSeed);
  const countRs = await client.execute({
    sql: `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN lower(media_type) = 'video' THEN 1 ELSE 0 END), 0) AS videos,
        COALESCE(SUM(CASE WHEN lower(media_type) != 'video' THEN 1 ELSE 0 END), 0) AS photos
      FROM photo_gallery_items
      WHERE ${pub}${searchSql}
    `,
    args: searchArgs,
  });
  const totalMatching = Number(countRs.rows?.[0]?.total || 0);
  const matchingStats = {
    total: totalMatching,
    videos: Number(countRs.rows?.[0]?.videos || 0),
    photos: Number(countRs.rows?.[0]?.photos || 0),
  };
  const lim = Math.min(500, Math.max(1, Number(limit) || PHOTO_GALLERY_PAGE_SIZE));
  const off = Math.max(0, Number(offset) || 0);
  const listRs = await client.execute({
    sql: `${GALLERY_LIST_SELECT} WHERE ${pub}${searchSql} ${orderSql} LIMIT ? OFFSET ?`,
    args: [...searchArgs, ...orderArgs, lim, off],
  });
  const items = await attachTaggedMemberProfileLinks(client, (listRs.rows || []).map(mapItemRow));
  return {
    items,
    totalMatching,
    matchingStats,
    limit: lim,
    offset: off,
  };
}

export async function getPhotoGalleryItemById(id) {
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("Invalid gallery item id.");
  }
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  const rs = await client.execute({
    sql: `${GALLERY_LIST_SELECT} WHERE id = ? LIMIT 1`,
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
  const extraRs = await client.execute({
    sql: "SELECT youtube_video_id, transcript, discovery_json FROM photo_gallery_items WHERE id = ? LIMIT 1",
    args: [Number(id)],
  });
  const extra = extraRs.rows?.[0] || {};
  const youtubeVideoId =
    patch?.youtubeVideoId !== undefined || patch?.youtube_video_id !== undefined
      ? merged.youtubeVideoId
      : String(extra.youtube_video_id || "");
  const transcript =
    patch?.transcript !== undefined ? merged.transcript : String(extra.transcript || "");
  const discoveryJson =
    patch?.discoveryJson !== undefined || patch?.discovery_json !== undefined
      ? merged.discoveryJson
      : String(extra.discovery_json || "");

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
        youtube_video_id = ?,
        transcript = ?,
        discovery_json = ?,
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
      youtubeVideoId,
      transcript,
      discoveryJson,
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
        youtube_video_id,
        transcript,
        discovery_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
      item.youtubeVideoId,
      item.transcript,
      item.discoveryJson,
    ],
  }));

  await client.batch(batch, "write");
  return listPhotoGalleryItems({ includeUnpublished: true });
}

/**
 * Remove prior YouTube discovery imports (rows with youtube_video_id set), then insert new items.
 * Rows without youtube_video_id (e.g. legacy photos) are kept.
 */
export async function mergeYouTubeDiscoveryGalleryItems(itemsInput) {
  const items = Array.isArray(itemsInput) ? itemsInput : [];
  const normalized = items.map((item, index) => normalizeItemInput(item, index));
  const client = getClient();
  await ensurePhotoGalleryTables(client);
  await client.execute(
    "DELETE FROM photo_gallery_items WHERE youtube_video_id IS NOT NULL AND TRIM(youtube_video_id) != ''"
  );
  if (!normalized.length) {
    return listPhotoGalleryItems({ includeUnpublished: true });
  }

  const maxRs = await client.execute({
    sql: `
      SELECT COALESCE(MAX(display_order), -1) AS m
      FROM photo_gallery_items
      WHERE TRIM(COALESCE(youtube_video_id, '')) = ''
    `,
  });
  const orderBase = Number(maxRs.rows?.[0]?.m ?? -1) + 1;

  const chunkSize = 80;
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const slice = normalized.slice(i, i + chunkSize);
    const batch = slice.map((item, j) => {
      const index = i + j;
      const displayOrder = orderBase + index;
      return {
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
        youtube_video_id,
        transcript,
        discovery_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
          displayOrder,
          item.isPublished ? 1 : 0,
          item.youtubeVideoId,
          item.transcript,
          item.discoveryJson,
        ],
      };
    });
    await client.batch(batch, "write");
  }
  return listPhotoGalleryItems({ includeUnpublished: true });
}
