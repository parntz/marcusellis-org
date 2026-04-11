import "./load-env.mjs";
import { execFileSync } from "child_process";
import { closeDb } from "../lib/sqlite.mjs";
import { replaceArtistBandProfiles } from "../lib/find-artist-directory.mjs";

const BASE_URL = "https://www.nashvillemusicians.org";
const LIST_URL = `${BASE_URL}/find-an-artist-or-band`;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function fetchText(url) {
  return execFileSync("curl", ["-L", "-A", USER_AGENT, url], {
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024,
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
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function cleanHtml(value = "") {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .trim();
}

function slugFromHref(href = "") {
  return String(href || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .at(-1) || "";
}

function toAbsoluteUrl(href = "") {
  if (!href) return "";
  try {
    return new URL(href, BASE_URL).toString();
  } catch {
    return "";
  }
}

function extractMaxPageIndex(html) {
  const matches = Array.from(html.matchAll(/[?&]page=(\d+)/g), (match) => Number(match[1]));
  return matches.length ? Math.max(...matches) : 0;
}

function extractDirectoryEntries(html, pageIndex = 0) {
  const rows = [];
  const rowMatches = html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi);

  for (const match of rowMatches) {
    const rowHtml = String(match[0] || "");
    const titleHref = rowHtml.match(/views-field-title[\s\S]*?<a href="([^"]+)">([\s\S]*?)<\/a>/i);
    if (!titleHref) continue;

    rows.push({
      slug: slugFromHref(titleHref[1]),
      title: cleanText(titleHref[2]),
      profileHref: titleHref[1],
      listingPersonnelHtml:
        cleanHtml(rowHtml.match(/views-field-field-personnel-instrumentation">\s*([\s\S]*?)\s*<\/td>/i)?.[1] || ""),
      sourcePageIndex: pageIndex,
    });
  }

  return rows;
}

function extractFieldHtml(html, fieldClassFragment) {
  const regex = new RegExp(
    `<div class="field[^"]*${fieldClassFragment}[^"]*"[^>]*>[\\s\\S]*?<div class="field-items">[\\s\\S]*?<div class="field-item[^"]*">([\\s\\S]*?)<\\/div>[\\s\\S]*?<\\/div><\\/div>`,
    "i"
  );
  return cleanHtml(html.match(regex)?.[1] || "");
}

function extractPictureUrl(html) {
  return toAbsoluteUrl(
    html.match(/field-name-field-picture[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1] || ""
  );
}

function extractWebLinks(html) {
  const block =
    html.match(/field-name-field-web-links[\s\S]*?<div class="field-items">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1] || "";
  return Array.from(block.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi), (match) => ({
    href: toAbsoluteUrl(match[1]),
    label: cleanText(match[2]) || toAbsoluteUrl(match[1]),
  })).filter((item) => item.href);
}

function extractMusicalStyles(html) {
  const block =
    html.match(/field-name-field-musical-style-s-[^"]*"[\s\S]*?<div class="field-items">([\s\S]*?)<\/div>\s*<\/div>/i)
      ?. [1] || "";
  return Array.from(block.matchAll(/<a [^>]*>([\s\S]*?)<\/a>/gi), (match) => cleanText(match[1])).filter(Boolean);
}

function extractFeaturedVideo(html) {
  return {
    featuredVideoUrl: html.match(/<iframe[^>]+src="([^"]*youtube\.com\/embed\/[^"]+)"/i)?.[1] || "",
    featuredVideoTitle:
      cleanText(html.match(/file-video-youtube[\s\S]*?<h2[^>]*><a [^>]*>([\s\S]*?)<\/a><\/h2>/i)?.[1] || "") || "",
  };
}

function mergeEntryWithDetail(entry, html) {
  const { featuredVideoUrl, featuredVideoTitle } = extractFeaturedVideo(html);
  return {
    ...entry,
    title: cleanText(html.match(/<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || entry.title),
    pictureUrl: extractPictureUrl(html),
    contactHtml: extractFieldHtml(html, "field-name-field-contact-information"),
    descriptionHtml: extractFieldHtml(html, "field-name-field-describe-what-you-do-in-10"),
    personnelHtml: extractFieldHtml(html, "field-name-field-personnel-instrumentation"),
    webLinks: extractWebLinks(html),
    musicalStyles: extractMusicalStyles(html),
    featuredVideoUrl,
    featuredVideoTitle,
    sourcePath: slugFromHref(entry.profileHref),
  };
}

async function main() {
  const firstPageHtml = fetchText(LIST_URL);
  const maxPageIndex = extractMaxPageIndex(firstPageHtml);
  const entries = [];

  for (let pageIndex = 0; pageIndex <= maxPageIndex; pageIndex += 1) {
    const pageHtml = pageIndex === 0 ? firstPageHtml : fetchText(`${LIST_URL}?page=${pageIndex}`);
    entries.push(...extractDirectoryEntries(pageHtml, pageIndex));
  }

  const items = [];
  for (const [index, entry] of entries.entries()) {
    const detailUrl = toAbsoluteUrl(entry.profileHref);
    try {
      items.push({
        ...mergeEntryWithDetail(entry, fetchText(detailUrl)),
        displayOrder: index,
      });
    } catch (error) {
      console.warn(`Failed to import ${detailUrl}: ${error instanceof Error ? error.message : error}`);
      items.push({
        ...entry,
        displayOrder: index,
        pictureUrl: "",
        contactHtml: "",
        descriptionHtml: "",
        personnelHtml: "",
        webLinks: [],
        musicalStyles: [],
        featuredVideoUrl: "",
        featuredVideoTitle: "",
        sourcePath: slugFromHref(entry.profileHref),
      });
    }
  }

  const saved = await replaceArtistBandProfiles(items);
  console.log(`Imported ${saved.length} artist and band profiles into Turso.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
