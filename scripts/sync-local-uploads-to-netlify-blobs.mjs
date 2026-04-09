#!/usr/bin/env node
/**
 * Push files from public/uploads/{category} into the matching Netlify Blob store so
 * production can serve them via /api/.../asset/:id (local dev uses /uploads/... directly).
 *
 * Requires (same as gigs:migrate-images:blobs):
 *   NETLIFY_SITE_ID or SITE_ID
 *   BLOB_READ_WRITE_TOKEN, or NETLIFY_AUTH_TOKEN, or NETLIFY_PERSONAL_ACCESS_TOKEN
 *
 * Usage:
 *   node scripts/sync-local-uploads-to-netlify-blobs.mjs
 *   node scripts/sync-local-uploads-to-netlify-blobs.mjs --force
 *   node scripts/sync-local-uploads-to-netlify-blobs.mjs --verbose
 */
import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/** Blob store names must match getStore(...) in API upload routes and lib/gig-image-storage.mjs */
const STORE_DIRS = [
  { store: "gig-uploads", dir: "gigs" },
  { store: "hero-uploads", dir: "hero" },
  { store: "home-panels-uploads", dir: "home-panels" },
  { store: "media-hub-uploads", dir: "media-hub" },
  { store: "rehearsal-hall-uploads", dir: "rehearsal-hall" },
  { store: "recording-page-uploads", dir: "recording-page" },
  { store: "photo-gallery-uploads", dir: "photo-gallery" },
  { store: "member-profile-media", dir: "member-profiles" },
];

function getToken() {
  return String(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.NETLIFY_AUTH_TOKEN ||
      process.env.NETLIFY_PERSONAL_ACCESS_TOKEN ||
      ""
  ).trim();
}

function getSiteId() {
  return String(process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
}

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return map[ext] || "application/octet-stream";
}

function listFlatFiles(absDir) {
  if (!fs.existsSync(absDir)) {
    return [];
  }
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name)
    .filter((name) => !name.startsWith(".") && name !== ".DS_Store");
}

async function main() {
  const force = process.argv.includes("--force");
  const verbose = process.argv.includes("--verbose");
  const siteID = getSiteId();
  const token = getToken();
  if (!siteID || !token) {
    console.error(
      "Missing NETLIFY_SITE_ID (or SITE_ID) and a blob token (BLOB_READ_WRITE_TOKEN, NETLIFY_AUTH_TOKEN, or NETLIFY_PERSONAL_ACCESS_TOKEN)."
    );
    process.exit(1);
  }

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const { store: storeName, dir: subdir } of STORE_DIRS) {
    const dir = path.join(UPLOADS_ROOT, subdir);
    const files = listFlatFiles(dir);
    if (files.length === 0) {
      continue;
    }

    const store = getStore(storeName, { siteID, token });
    let storeSkipped = 0;
    let storeUploaded = 0;
    console.log(`\n${storeName} (${files.length} local file(s))`);

    for (const name of files) {
      const filePath = path.join(dir, name);
      const buf = fs.readFileSync(filePath);
      const mime = guessContentType(name);

      try {
        if (!force) {
          const meta = await store.getMetadata(name, { consistency: "strong" });
          if (meta) {
            skipped += 1;
            storeSkipped += 1;
            if (verbose) {
              console.log(`  skip (exists) ${name}`);
            }
            continue;
          }
        }
        await store.set(name, buf, { metadata: { contentType: mime } });
        uploaded += 1;
        storeUploaded += 1;
        console.log(`  uploaded ${name}`);
      } catch (e) {
        errors += 1;
        console.error(`  error ${name}:`, e?.message || e);
      }
    }
    if (storeSkipped && !verbose) {
      console.log(`  (${storeSkipped} already in blob, skipped)`);
    }
  }

  console.log(
    `\nDone. ${uploaded} uploaded, ${skipped} skipped (already in blob)${force ? ", --force was set" : ""}, ${errors} error(s).`
  );
  process.exit(errors > 0 ? 1 : 0);
}

await main();
