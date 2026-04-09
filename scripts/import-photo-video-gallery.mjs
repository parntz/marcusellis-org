import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { closeDb } from "../lib/sqlite.mjs";
import {
  ensurePhotoGalleryTables,
  getPhotoGalleryPageConfig,
  replacePhotoGalleryItems,
  setPhotoGalleryPageConfig,
} from "../lib/photo-gallery.mjs";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "uploads", "photo-gallery");
const BASE_URL = "https://nashvillemusicians.org";
const LIST_URL = `${BASE_URL}/photo-and-video-gallery`;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function fetchText(url) {
  return execFileSync("curl", ["-L", "-A", USER_AGENT, url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function downloadFile(url, destination) {
  execFileSync("curl", ["-L", "-A", USER_AGENT, "-o", destination, url], {
    stdio: "inherit",
  });
}

function decodeEntities(input = "") {
  return String(input)
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"');
}

function cleanText(value = "") {
  return decodeEntities(String(value).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function slugify(input = "") {
  return cleanText(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMaxPageIndex(html) {
  const matches = Array.from(html.matchAll(/[?&]page=(\d+)/g), (match) => Number(match[1]));
  return matches.length ? Math.max(...matches) : 0;
}

function extractDetailLinks(html) {
  const seen = new Set();
  const links = [];
  for (const match of html.matchAll(/<a href="(\/media\/photo-gallery\/[^"]+)"/g)) {
    const href = String(match[1] || "");
    if (!href || seen.has(href)) continue;
    seen.add(href);
    links.push(new URL(href, BASE_URL).toString());
  }
  return links;
}

function extractContentHtml(html) {
  const match = html.match(/property="content:encoded">([\s\S]*?)<\/div>\s*<\/div>/i);
  return match?.[1]?.trim() || "";
}

function extractTitle(html, fallbackUrl) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = cleanText(h1 || "");
  return title || slugify(fallbackUrl).replace(/-/g, " ");
}

function extractYouTubeEmbedUrl(html) {
  return html.match(/https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/i)?.[0] || "";
}

function extractStyledImageUrl(html) {
  return (
    html.match(/https:\/\/nashvillemusicians\.org\/sites\/default\/files\/styles\/large\/public\/[^"]+/i)?.[0] ||
    html.match(/https:\/\/nashvillemusicians\.org\/sites\/default\/files\/styles\/large_squarethumb\/public\/[^"]+/i)?.[0] ||
    ""
  );
}

function toOriginalImageUrl(imageUrl) {
  if (!imageUrl) return "";
  const noQuery = imageUrl.split("?")[0];
  return noQuery.replace("/sites/default/files/styles/large/public/", "/sites/default/files/").replace(
    "/sites/default/files/styles/large_squarethumb/public/",
    "/sites/default/files/"
  );
}

function extractAlt(html, fallbackTitle) {
  const alt = html.match(/<img[^>]+alt="([^"]*)"/i)?.[1] || "";
  return cleanText(alt) || fallbackTitle;
}

function normalizeDescriptionHtml(html) {
  return String(html || "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "")
    .trim();
}

function localFilenameFromUrl(slug, url) {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase() || ".jpg";
  return `${slug}${ext}`;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await ensurePhotoGalleryTables();

  const firstPageHtml = fetchText(LIST_URL);
  const maxPageIndex = extractMaxPageIndex(firstPageHtml);
  const detailUrls = extractDetailLinks(firstPageHtml);

  for (let pageIndex = 1; pageIndex <= maxPageIndex; pageIndex += 1) {
    const html = fetchText(`${LIST_URL}?page=${pageIndex}`);
    for (const url of extractDetailLinks(html)) {
      if (!detailUrls.includes(url)) {
        detailUrls.push(url);
      }
    }
  }

  const items = [];
  for (const [index, detailUrl] of detailUrls.entries()) {
    const detailHtml = fetchText(detailUrl);
    const title = extractTitle(detailHtml, detailUrl);
    const slug = slugify(new URL(detailUrl).pathname.split("/").filter(Boolean).at(-1) || title);
    const descriptionHtml = normalizeDescriptionHtml(extractContentHtml(detailHtml));
    const videoUrl = extractYouTubeEmbedUrl(detailHtml);
    const styledImageUrl = extractStyledImageUrl(detailHtml);
    const originalImageUrl = toOriginalImageUrl(styledImageUrl) || styledImageUrl;
    const imageSource = originalImageUrl || styledImageUrl;

    if (!imageSource) {
      throw new Error(`No image found for ${detailUrl}`);
    }

    const filename = localFilenameFromUrl(slug, imageSource);
    const destination = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(destination)) {
      downloadFile(imageSource, destination);
    }

    items.push({
      slug,
      title,
      descriptionHtml,
      mediaType: videoUrl ? "video" : "image",
      imageUrl: `/uploads/photo-gallery/${filename}`,
      imageAlt: extractAlt(detailHtml, title),
      videoUrl,
      sourceUrl: detailUrl,
      sourceImageUrl: imageSource,
      displayOrder: index,
      isPublished: true,
    });
  }

  const currentConfig = await getPhotoGalleryPageConfig();
  await setPhotoGalleryPageConfig(currentConfig);
  const saved = await replacePhotoGalleryItems(items);

  console.log(`Imported ${saved.length} photo gallery items into the database.`);
  console.log(`Images saved to ${OUTPUT_DIR}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
