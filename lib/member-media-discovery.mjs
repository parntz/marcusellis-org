import { google } from "googleapis";
import { getClient } from "./sqlite.mjs";

const STATE_CURSOR_KEY = "member_media_discovery_cursor";
const DEFAULT_MEMBER_LIMIT = 100;
const DEFAULT_MAX_RESULTS_PER_MEMBER = 5;
const DEFAULT_SCHEDULE = "nightly";

function ts() {
  return new Date().toISOString();
}

function logInfo(message) {
  console.log(`[member-media-discovery ${ts()}] ${message}`);
}

function logWarn(message) {
  console.warn(`[member-media-discovery ${ts()}] ${message}`);
}

function envNumber(name, fallback, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const parsed = Number.parseInt(String(process.env[name] || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampPositiveInteger(value, fallback, { min = 1, max = Number.POSITIVE_INFINITY } = {}) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getRequiredYoutubeApiKey() {
  const key = String(process.env.YOUTUBE_API_KEY || "").trim();
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is required for member media discovery.");
  }
  return key;
}

function getDiscoveryConfig(overrides = {}) {
  return {
    memberLimit: clampPositiveInteger(
      overrides.memberLimit,
      envNumber("MEMBER_MEDIA_DISCOVERY_MEMBER_LIMIT", DEFAULT_MEMBER_LIMIT, { min: 1, max: 200 }),
      { min: 1, max: 200 }
    ),
    maxResultsPerMember: clampPositiveInteger(
      overrides.maxResultsPerMember,
      envNumber("MEMBER_MEDIA_DISCOVERY_MAX_RESULTS_PER_MEMBER", DEFAULT_MAX_RESULTS_PER_MEMBER, {
        min: 1,
        max: 25,
      }),
      { min: 1, max: 25 }
    ),
    querySuffix: String(
      overrides.querySuffix ?? process.env.MEMBER_MEDIA_DISCOVERY_QUERY_SUFFIX ?? process.env.YOUTUBE_QUERY_SUFFIX ?? ""
    )
      .replace(/\s+/g, " ")
      .trim(),
    scheduleLabel: String(overrides.scheduleLabel || DEFAULT_SCHEDULE).trim() || DEFAULT_SCHEDULE,
  };
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map((item) => String(item || "").trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function memberDisplayName(member) {
  const full = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  return full || member.title || `member ${member.id}`;
}

function firstPrimaryInstrument(member) {
  return parseJsonArray(member.primaryInstrumentsJson)[0] || "";
}

function buildSearchQuery(member, querySuffix = "") {
  const base = [member.firstName, member.lastName, firstPrimaryInstrument(member)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = base || String(member.title || "").trim();
  return [fallback, querySuffix].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToDescriptionHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const paras = raw
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!paras.length) return "";
  return paras.map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br/>")}</p>`).join("");
}

function makeDiscoverySource(member, query, url) {
  return {
    member_id: String(member.id),
    first_name: String(member.firstName || ""),
    last_name: String(member.lastName || ""),
    first_primary_instrument: firstPrimaryInstrument(member),
    member_search_query: query,
    transcript_available: "false",
    transcript_error: "discover_only",
    url,
  };
}

function buildGalleryItem(member, query, videoId, snippet) {
  const title = String(snippet?.title || "").trim() || `YouTube video ${videoId}`;
  const description = String(snippet?.description || "").trim();
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return {
    youtubeVideoId: videoId,
    slug: `yt-${videoId}`,
    title,
    descriptionHtml: textToDescriptionHtml(description),
    mediaType: "video",
    imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    imageAlt: title.slice(0, 240),
    videoUrl: `https://www.youtube.com/embed/${videoId}`,
    sourceUrl: watchUrl,
    sourceImageUrl: "",
    isPublished: true,
    transcript: "",
    discoveryJson: JSON.stringify({
      sources: [makeDiscoverySource(member, query, watchUrl)],
    }).slice(0, 200_000),
  };
}

function parseDiscoverySources(raw) {
  const str = String(raw || "").trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed?.sources) ? parsed.sources.filter((item) => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

function mergeDiscoverySources(existingRaw, nextRaw) {
  const merged = new Map();
  for (const source of [...parseDiscoverySources(existingRaw), ...parseDiscoverySources(nextRaw)]) {
    const memberId = String(source?.member_id || source?.memberId || "").trim();
    const name = [String(source?.first_name || "").trim(), String(source?.last_name || "").trim()]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();
    const query = String(source?.member_search_query || "").trim().toLowerCase();
    const key = memberId || `${name}|${query}`;
    if (!key) continue;
    merged.set(key, source);
  }
  return JSON.stringify({ sources: [...merged.values()] }).slice(0, 200_000);
}

async function ensureMemberMediaDiscoveryTables(client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS member_media_discovery_state (
      key TEXT PRIMARY KEY,
      value_text TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS member_media_discovery_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_type TEXT NOT NULL DEFAULT 'nightly',
      status TEXT NOT NULL DEFAULT 'running',
      cursor_before INTEGER NOT NULL DEFAULT 0,
      cursor_after INTEGER NOT NULL DEFAULT 0,
      member_limit INTEGER NOT NULL DEFAULT 0,
      members_processed INTEGER NOT NULL DEFAULT 0,
      videos_upserted INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_member_media_discovery_runs_started_at
      ON member_media_discovery_runs(started_at DESC, id DESC);
  `);
}

async function ensurePhotoGalleryDiscoveryTables(client) {
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
      youtube_video_id TEXT NOT NULL DEFAULT '',
      transcript TEXT NOT NULL DEFAULT '',
      discovery_json TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_photo_gallery_items_order
      ON photo_gallery_items(display_order ASC, id ASC);

    CREATE INDEX IF NOT EXISTS idx_photo_gallery_youtube_video_id
      ON photo_gallery_items(youtube_video_id);
  `);

  const info = await client.execute("PRAGMA table_info(photo_gallery_items)");
  const names = new Set((info.rows || []).map((row) => String(row.name || "")));
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
}

async function getCursor(client) {
  const rs = await client.execute({
    sql: `SELECT value_text FROM member_media_discovery_state WHERE key = ? LIMIT 1`,
    args: [STATE_CURSOR_KEY],
  });
  return Number.parseInt(String(rs.rows?.[0]?.value_text || "0"), 10) || 0;
}

async function setCursor(client, value) {
  await client.execute({
    sql: `
      INSERT INTO member_media_discovery_state (key, value_text, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value_text = excluded.value_text,
        updated_at = datetime('now')
    `,
    args: [STATE_CURSOR_KEY, String(value)],
  });
}

async function createRun(client, { runType, cursorBefore, memberLimit }) {
  const rs = await client.execute({
    sql: `
      INSERT INTO member_media_discovery_runs (run_type, status, cursor_before, member_limit, started_at)
      VALUES (?, 'running', ?, ?, datetime('now'))
    `,
    args: [runType, cursorBefore, memberLimit],
  });
  return Number(rs.lastInsertRowid || 0);
}

async function finishRun(client, runId, { status, cursorAfter, membersProcessed, videosUpserted, notes = "" }) {
  if (!runId) return;
  await client.execute({
    sql: `
      UPDATE member_media_discovery_runs
      SET
        status = ?,
        cursor_after = ?,
        members_processed = ?,
        videos_upserted = ?,
        notes = ?,
        finished_at = datetime('now')
      WHERE id = ?
    `,
    args: [status, cursorAfter, membersProcessed, videosUpserted, String(notes || "").slice(0, 2000), runId],
  });
}

function mapMemberRow(row) {
  return {
    id: Number(row.id),
    slug: String(row.slug || "").trim(),
    title: String(row.title || "").trim(),
    firstName: String(row.firstName || "").trim(),
    lastName: String(row.lastName || "").trim(),
    primaryInstrumentsJson: String(row.primaryInstrumentsJson || "[]"),
  };
}

async function listMembersAfterId(client, afterId, limit) {
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        first_name AS firstName,
        last_name AS lastName,
        primary_instruments_json AS primaryInstrumentsJson
      FROM member_pages
      WHERE id > ?
        AND slug IS NOT NULL
        AND TRIM(slug) != ''
        AND (
          TRIM(first_name) != ''
          OR TRIM(last_name) != ''
          OR TRIM(title) != ''
        )
      ORDER BY id ASC
      LIMIT ?
    `,
    args: [afterId, limit],
  });
  return (rs.rows || []).map(mapMemberRow);
}

async function listMemberBatch(client, { afterId, limit }) {
  const firstPass = await listMembersAfterId(client, afterId, limit);
  if (firstPass.length >= limit) {
    return firstPass;
  }
  const secondPass = await listMembersAfterId(client, 0, limit - firstPass.length);
  const seen = new Set(firstPass.map((member) => member.id));
  return [...firstPass, ...secondPass.filter((member) => !seen.has(member.id))];
}

async function searchVideoIds(youtube, query, maxResults) {
  const ids = [];
  const seen = new Set();
  let pageToken;
  while (ids.length < maxResults) {
    const needed = Math.min(50, maxResults - ids.length);
    const res = await youtube.search.list({
      part: ["id"],
      q: query,
      type: ["video"],
      maxResults: needed,
      pageToken: pageToken || undefined,
    });
    const items = res.data.items || [];
    for (const item of items) {
      const videoId = item.id?.videoId;
      if (videoId && !seen.has(videoId)) {
        seen.add(videoId);
        ids.push(videoId);
      }
    }
    if (ids.length >= maxResults) break;
    pageToken = res.data.nextPageToken;
    if (!pageToken || !items.length) break;
  }
  return ids;
}

async function fetchSnippets(youtube, videoIds) {
  const map = new Map();
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    if (!chunk.length) continue;
    const res = await youtube.videos.list({
      part: ["snippet"],
      id: chunk,
    });
    for (const item of res.data.items || []) {
      const snippet = item.snippet || {};
      map.set(String(item.id || "").trim(), {
        title: String(snippet.title || ""),
        description: String(snippet.description || ""),
      });
    }
  }
  return map;
}

async function lookupExistingItems(client, videoIds) {
  const ids = [...new Set((Array.isArray(videoIds) ? videoIds : []).map((id) => String(id || "").trim()).filter(Boolean))];
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    if (!chunk.length) continue;
    const placeholders = chunk.map(() => "?").join(", ");
    const rs = await client.execute({
      sql: `
        SELECT
          id,
          youtube_video_id AS youtubeVideoId,
          display_order AS displayOrder,
          discovery_json AS discoveryJson
        FROM photo_gallery_items
        WHERE youtube_video_id IN (${placeholders})
      `,
      args: chunk,
    });
    for (const row of rs.rows || []) {
      out.set(String(row.youtubeVideoId || ""), {
        id: Number(row.id),
        displayOrder: Number(row.displayOrder || 0),
        discoveryJson: String(row.discoveryJson || ""),
      });
    }
  }
  return out;
}

async function getNextDisplayOrder(client) {
  const rs = await client.execute({
    sql: `SELECT COALESCE(MAX(display_order), -1) + 1 AS nextDisplayOrder FROM photo_gallery_items`,
  });
  return Number(rs.rows?.[0]?.nextDisplayOrder ?? 0);
}

async function upsertDiscoveredVideos(client, itemsInput) {
  const items = Array.isArray(itemsInput) ? itemsInput : [];
  if (!items.length) {
    return { inserted: 0, updated: 0 };
  }

  const existingByVideoId = await lookupExistingItems(
    client,
    items.map((item) => item.youtubeVideoId)
  );
  let nextDisplayOrder = await getNextDisplayOrder(client);
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const existing = existingByVideoId.get(item.youtubeVideoId);
    if (existing) {
      await client.execute({
        sql: `
          UPDATE photo_gallery_items
          SET
            slug = ?,
            title = ?,
            description_html = ?,
            media_type = 'video',
            image_url = ?,
            image_alt = ?,
            video_url = ?,
            source_url = ?,
            source_image_url = ?,
            is_published = 1,
            youtube_video_id = ?,
            transcript = '',
            discovery_json = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [
          item.slug,
          item.title,
          item.descriptionHtml,
          item.imageUrl,
          item.imageAlt,
          item.videoUrl,
          item.sourceUrl,
          item.sourceImageUrl,
          item.youtubeVideoId,
          mergeDiscoverySources(existing.discoveryJson, item.discoveryJson),
          existing.id,
        ],
      });
      updated += 1;
      continue;
    }

    await client.execute({
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
        VALUES (?, ?, ?, 'video', ?, ?, ?, ?, ?, ?, 1, ?, '', ?, datetime('now'), datetime('now'))
      `,
      args: [
        item.slug,
        item.title,
        item.descriptionHtml,
        item.imageUrl,
        item.imageAlt,
        item.videoUrl,
        item.sourceUrl,
        item.sourceImageUrl,
        nextDisplayOrder,
        item.youtubeVideoId,
        item.discoveryJson,
      ],
    });
    nextDisplayOrder += 1;
    inserted += 1;
  }

  return { inserted, updated };
}

export async function runMemberMediaDiscovery(overrides = {}) {
  const client = overrides.client || getClient();
  const config = getDiscoveryConfig(overrides);
  const youtube = google.youtube({
    version: "v3",
    auth: getRequiredYoutubeApiKey(),
  });

  await ensurePhotoGalleryDiscoveryTables(client);
  await ensureMemberMediaDiscoveryTables(client);

  const cursorBefore = await getCursor(client);
  const runId = await createRun(client, {
    runType: config.scheduleLabel,
    cursorBefore,
    memberLimit: config.memberLimit,
  });

  let membersProcessed = 0;
  let videosUpserted = 0;
  let cursorAfter = cursorBefore;

  try {
    const members = await listMemberBatch(client, {
      afterId: cursorBefore,
      limit: config.memberLimit,
    });

    if (!members.length) {
      await finishRun(client, runId, {
        status: "skipped",
        cursorAfter: cursorBefore,
        membersProcessed: 0,
        videosUpserted: 0,
        notes: "No member_pages rows available for discovery.",
      });
      return {
        ok: true,
        skipped: true,
        membersProcessed: 0,
        videosUpserted: 0,
        inserted: 0,
        updated: 0,
        cursorBefore,
        cursorAfter: cursorBefore,
      };
    }

    const itemsByVideoId = new Map();

    for (const member of members) {
      const query = buildSearchQuery(member, config.querySuffix);
      if (!query) continue;
      membersProcessed += 1;
      logInfo(`Searching "${query}" for ${memberDisplayName(member)} (#${member.id})`);

      let videoIds = [];
      try {
        videoIds = await searchVideoIds(youtube, query, config.maxResultsPerMember);
      } catch (error) {
        logWarn(`Search failed for member #${member.id}: ${error instanceof Error ? error.message : error}`);
        cursorAfter = member.id;
        continue;
      }

      if (!videoIds.length) {
        cursorAfter = member.id;
        continue;
      }

      let snippets = new Map();
      try {
        snippets = await fetchSnippets(youtube, videoIds);
      } catch (error) {
        logWarn(`Snippet fetch failed for member #${member.id}: ${error instanceof Error ? error.message : error}`);
        cursorAfter = member.id;
        continue;
      }

      for (const videoId of videoIds) {
        const nextItem = buildGalleryItem(member, query, videoId, snippets.get(videoId) || {});
        const existing = itemsByVideoId.get(videoId);
        if (!existing) {
          itemsByVideoId.set(videoId, nextItem);
          continue;
        }
        itemsByVideoId.set(videoId, {
          ...existing,
          title: nextItem.title.length > existing.title.length ? nextItem.title : existing.title,
          descriptionHtml:
            nextItem.descriptionHtml.length > existing.descriptionHtml.length
              ? nextItem.descriptionHtml
              : existing.descriptionHtml,
          discoveryJson: mergeDiscoverySources(existing.discoveryJson, nextItem.discoveryJson),
        });
      }

      cursorAfter = member.id;
    }

    const upsertResult = await upsertDiscoveredVideos(client, [...itemsByVideoId.values()]);
    videosUpserted = upsertResult.inserted + upsertResult.updated;
    await setCursor(client, cursorAfter);
    await finishRun(client, runId, {
      status: "success",
      cursorAfter,
      membersProcessed,
      videosUpserted,
      notes: `inserted=${upsertResult.inserted}, updated=${upsertResult.updated}`,
    });

    return {
      ok: true,
      skipped: false,
      membersProcessed,
      videosUpserted,
      inserted: upsertResult.inserted,
      updated: upsertResult.updated,
      cursorBefore,
      cursorAfter,
      memberLimit: config.memberLimit,
      maxResultsPerMember: config.maxResultsPerMember,
    };
  } catch (error) {
    await finishRun(client, runId, {
      status: "failed",
      cursorAfter,
      membersProcessed,
      videosUpserted,
      notes: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
