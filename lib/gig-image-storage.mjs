import { randomUUID } from "crypto";
import path from "path";

const GIG_ASSET_ROUTE_PREFIX = "/api/gigs/asset/";

function isNetlifyRuntime() {
  return Boolean(
    String(process.env.NETLIFY || "").trim() ||
    String(process.env.SITE_ID || "").trim() ||
    String(process.env.URL || "").trim()
  );
}

export function guessGigImageContentType(filename = "") {
  const ext = path.extname(String(filename || "")).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  return map[ext] || "application/octet-stream";
}

export function safeGigImageExtension(name = "") {
  const ext = String(name || "").split(".").pop() || "jpg";
  return /^[a-z0-9]+$/i.test(ext) ? ext.toLowerCase() : "jpg";
}

export function buildGigAssetUrl(id = "") {
  return `${GIG_ASSET_ROUTE_PREFIX}${encodeURIComponent(String(id || "").trim())}`;
}

export function extractGigAssetId(url = "") {
  const raw = String(url || "").trim();
  if (!raw.startsWith(GIG_ASSET_ROUTE_PREFIX)) {
    return "";
  }
  const encoded = raw.slice(GIG_ASSET_ROUTE_PREFIX.length).split(/[?#]/, 1)[0] || "";
  try {
    return decodeURIComponent(encoded);
  } catch {
    return "";
  }
}

export function isManagedGigAssetUrl(url = "") {
  return Boolean(extractGigAssetId(url));
}

function getExplicitBlobToken() {
  return String(
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_PERSONAL_ACCESS_TOKEN ||
    ""
  ).trim();
}

export function canWriteLocalGigUploads() {
  return !isNetlifyRuntime();
}

export async function getGigUploadsStore() {
  const { getStore } = await import("@netlify/blobs");

  if (isNetlifyRuntime()) {
    return getStore("gig-uploads");
  }

  const siteID = String(process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = getExplicitBlobToken();
  if (!siteID || !token) {
    return null;
  }

  return getStore("gig-uploads", { siteID, token });
}

export async function storeGigImageBuffer(buffer, {
  mimeType = "image/jpeg",
  filename = "",
  preferredId = "",
} = {}) {
  const ext = safeGigImageExtension(filename);
  const id = String(preferredId || "").trim() || `${randomUUID()}.${ext}`;

  const blobStore = await getGigUploadsStore();
  if (blobStore) {
    const store = blobStore;
    await store.set(id, buffer, { metadata: { contentType: mimeType } });
    return buildGigAssetUrl(id);
  }

  throw new Error(
    "Gig uploads require Netlify Blobs. Use deployed Netlify Functions, or configure NETLIFY_SITE_ID plus a personal access token locally."
  );
}

export async function deleteGigImageAsset(id = "") {
  const assetId = String(id || "").trim();
  if (!assetId) {
    return;
  }

  const blobStore = await getGigUploadsStore();
  if (blobStore) {
    const store = blobStore;
    await store.delete(assetId);
  }
}
