#!/usr/bin/env node
/**
 * Imports AFM YouTube discovery CSV into Turso (photo_gallery_items).
 * Deletes only rows with a non-empty youtube_video_id, then inserts merged videos.
 * Transcripts + discovery JSON are stored for server-side search only (not shown in UI).
 *
 *   AFM_YOUTUBE_DISCOVERY_CSV=/path/to/file.csv node scripts/import-afm-youtube-discovery.mjs
 *
 * Default CSV path: ~/Desktop/afm_discovery/afm_youtube_discovery_results.csv
 */
import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { closeDb } from "../lib/sqlite.mjs";
import { mergeYouTubeDiscoveryGalleryItems } from "../lib/photo-gallery.mjs";

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const DEFAULT_CSV = path.join(HOME, "Desktop/afm_discovery/afm_youtube_discovery_results.csv");
const CSV_PATH = process.env.AFM_YOUTUBE_DISCOVERY_CSV || DEFAULT_CSV;

const YT_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/;

function textToDescriptionHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paras = escaped.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return "";
  return paras.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
}

function pickLonger(a, b) {
  const sa = String(a || "").trim();
  const sb = String(b || "").trim();
  return sb.length > sa.length ? sb : sa;
}

function emptyBucket(videoId) {
  return {
    video_id: videoId,
    title: "",
    description: "",
    watchUrl: "",
    sources: [],
    transcriptChunks: [],
    transcriptFingerprints: new Set(),
  };
}

function processRow(row, byVideo) {
  const videoId = String(row.video_id ?? row.videoId ?? "").trim();
  if (!YT_ID_RE.test(videoId)) return;

  const b = byVideo.get(videoId) || emptyBucket(videoId);
  byVideo.set(videoId, b);

  b.title = pickLonger(b.title, row.title);
  b.description = pickLonger(b.description, row.description);
  const url = String(row.url || "").trim();
  if (url) b.watchUrl = url;

  b.sources.push({
    member_id: String(row.member_id || "").trim(),
    first_name: String(row.first_name || "").trim(),
    last_name: String(row.last_name || "").trim(),
    first_primary_instrument: String(row.first_primary_instrument || "").trim(),
    member_search_query: String(row.member_search_query || "").trim(),
    transcript_available: String(row.transcript_available || "").trim(),
    transcript_error: String(row.transcript_error || "").trim(),
    url,
  });

  const t = String(row.transcript || "").trim();
  const avail = String(row.transcript_available || "").toLowerCase() === "true";
  if (t && avail) {
    const fp = t.slice(0, 400) + "::" + t.length;
    if (!b.transcriptFingerprints.has(fp)) {
      b.transcriptFingerprints.add(fp);
      b.transcriptChunks.push(t);
    }
  }
}

async function loadCsvIntoBuckets(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const byVideo = new Map();
  const stream = fs.createReadStream(csvPath, { encoding: "utf8" }).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    })
  );

  let rowCount = 0;
  for await (const row of stream) {
    rowCount += 1;
    processRow(row, byVideo);
    if (rowCount % 25_000 === 0) {
      console.error(`…parsed ${rowCount} CSV rows, ${byVideo.size} unique video IDs so far`);
    }
  }

  console.error(`Parsed ${rowCount} CSV rows → ${byVideo.size} unique YouTube videos.`);
  return byVideo;
}

function bucketsToGalleryItems(byVideo) {
  const sorted = [...byVideo.values()].sort((a, b) =>
    (a.title || a.video_id).localeCompare(b.title || b.video_id, undefined, { sensitivity: "base" })
  );

  return sorted.map((b, order) => {
    const title = String(b.title || "").trim().slice(0, 240) || `YouTube video ${b.video_id}`;
    const transcript = b.transcriptChunks.join("\n\n---\n\n").slice(0, 500_000);
    const discoveryJson = JSON.stringify({ sources: b.sources }).slice(0, 200_000);
    return {
      slug: `yt-${b.video_id}`,
      title,
      descriptionHtml: textToDescriptionHtml(b.description),
      mediaType: "video",
      imageUrl: `https://img.youtube.com/vi/${b.video_id}/hqdefault.jpg`,
      imageAlt: title.slice(0, 240),
      videoUrl: `https://www.youtube.com/embed/${b.video_id}`,
      sourceUrl: b.watchUrl || `https://www.youtube.com/watch?v=${b.video_id}`,
      sourceImageUrl: "",
      displayOrder: order,
      isPublished: true,
      youtubeVideoId: b.video_id,
      transcript,
      discoveryJson,
    };
  });
}

async function main() {
  console.error(`Reading: ${CSV_PATH}`);
  const byVideo = await loadCsvIntoBuckets(CSV_PATH);
  const items = bucketsToGalleryItems(byVideo);
  console.error(`Merging ${items.length} videos into Turso (photo_gallery_items)…`);
  await mergeYouTubeDiscoveryGalleryItems(items);
  console.error("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
