import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const ROOT = process.cwd();
const SOURCE_CANDIDATES = [
  path.join(ROOT, "out", "_downloaded"),
  path.join(ROOT, "public", "_downloaded"),
  "/Users/paularntz/Desktop/afm2_bkup/HTML-version",
];

function resolveMemberPagesSourceRoot() {
  if (process.env.MEMBER_PAGES_SOURCE_DIR?.trim()) {
    return process.env.MEMBER_PAGES_SOURCE_DIR.trim();
  }
  for (const dir of SOURCE_CANDIDATES) {
    try {
      const userDir = path.join(dir, "user");
      if (fs.existsSync(userDir) && fs.readdirSync(userDir).length) return dir;
    } catch {
      /* */
    }
  }
  for (const dir of SOURCE_CANDIDATES) {
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length) return dir;
    } catch {
      /* */
    }
  }
  return path.join(process.cwd(), "public", "_downloaded");
}

const SOURCE_ROOT = resolveMemberPagesSourceRoot();
const USER_PROFILE_DIR = path.join(SOURCE_ROOT, "user");

const client = getClient();

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS member_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    canonical_url TEXT NOT NULL DEFAULT '',
    published_time TEXT NOT NULL DEFAULT '',
    updated_time TEXT NOT NULL DEFAULT '',
    picture_url TEXT NOT NULL DEFAULT '',
    featured_video_url TEXT NOT NULL DEFAULT '',
    featured_video_title TEXT NOT NULL DEFAULT '',
    legacy_video_links_json TEXT NOT NULL DEFAULT '[]',
    audio_links_json TEXT NOT NULL DEFAULT '[]',
    web_links_json TEXT NOT NULL DEFAULT '[]',
    musical_styles_json TEXT NOT NULL DEFAULT '[]',
    primary_instruments_json TEXT NOT NULL DEFAULT '[]',
    additional_instruments_text TEXT NOT NULL DEFAULT '',
    work_desired_json TEXT NOT NULL DEFAULT '[]',
    work_desired_other TEXT NOT NULL DEFAULT '',
    number_chart_read INTEGER NOT NULL DEFAULT 0,
    number_chart_write INTEGER NOT NULL DEFAULT 0,
    chord_chart_read INTEGER NOT NULL DEFAULT 0,
    chord_chart_write INTEGER NOT NULL DEFAULT 0,
    has_home_studio INTEGER NOT NULL DEFAULT 0,
    is_engineer INTEGER NOT NULL DEFAULT 0,
    additional_skills_json TEXT NOT NULL DEFAULT '[]',
    additional_skills_other TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    facebook_url TEXT NOT NULL DEFAULT '',
    reverbnation_url TEXT NOT NULL DEFAULT '',
    contact_html TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    personnel_html TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    source_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const memberPageColumns = await client.execute("PRAGMA table_info(member_pages)");
const memberPageColumnNames = new Set(memberPageColumns.rows.map((row) => String(row.name || "").toLowerCase()));
const memberPageAlterStatements = [
  ["first_name", "ALTER TABLE member_pages ADD COLUMN first_name TEXT NOT NULL DEFAULT ''"],
  ["last_name", "ALTER TABLE member_pages ADD COLUMN last_name TEXT NOT NULL DEFAULT ''"],
  ["picture_url", "ALTER TABLE member_pages ADD COLUMN picture_url TEXT NOT NULL DEFAULT ''"],
  ["featured_video_url", "ALTER TABLE member_pages ADD COLUMN featured_video_url TEXT NOT NULL DEFAULT ''"],
  ["featured_video_title", "ALTER TABLE member_pages ADD COLUMN featured_video_title TEXT NOT NULL DEFAULT ''"],
  ["legacy_video_links_json", "ALTER TABLE member_pages ADD COLUMN legacy_video_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["audio_links_json", "ALTER TABLE member_pages ADD COLUMN audio_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["web_links_json", "ALTER TABLE member_pages ADD COLUMN web_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["musical_styles_json", "ALTER TABLE member_pages ADD COLUMN musical_styles_json TEXT NOT NULL DEFAULT '[]'"],
  ["primary_instruments_json", "ALTER TABLE member_pages ADD COLUMN primary_instruments_json TEXT NOT NULL DEFAULT '[]'"],
  ["additional_instruments_text", "ALTER TABLE member_pages ADD COLUMN additional_instruments_text TEXT NOT NULL DEFAULT ''"],
  ["work_desired_json", "ALTER TABLE member_pages ADD COLUMN work_desired_json TEXT NOT NULL DEFAULT '[]'"],
  ["work_desired_other", "ALTER TABLE member_pages ADD COLUMN work_desired_other TEXT NOT NULL DEFAULT ''"],
  ["number_chart_read", "ALTER TABLE member_pages ADD COLUMN number_chart_read INTEGER NOT NULL DEFAULT 0"],
  ["number_chart_write", "ALTER TABLE member_pages ADD COLUMN number_chart_write INTEGER NOT NULL DEFAULT 0"],
  ["chord_chart_read", "ALTER TABLE member_pages ADD COLUMN chord_chart_read INTEGER NOT NULL DEFAULT 0"],
  ["chord_chart_write", "ALTER TABLE member_pages ADD COLUMN chord_chart_write INTEGER NOT NULL DEFAULT 0"],
  ["has_home_studio", "ALTER TABLE member_pages ADD COLUMN has_home_studio INTEGER NOT NULL DEFAULT 0"],
  ["is_engineer", "ALTER TABLE member_pages ADD COLUMN is_engineer INTEGER NOT NULL DEFAULT 0"],
  ["additional_skills_json", "ALTER TABLE member_pages ADD COLUMN additional_skills_json TEXT NOT NULL DEFAULT '[]'"],
  ["additional_skills_other", "ALTER TABLE member_pages ADD COLUMN additional_skills_other TEXT NOT NULL DEFAULT ''"],
  ["website_url", "ALTER TABLE member_pages ADD COLUMN website_url TEXT NOT NULL DEFAULT ''"],
  ["facebook_url", "ALTER TABLE member_pages ADD COLUMN facebook_url TEXT NOT NULL DEFAULT ''"],
  ["reverbnation_url", "ALTER TABLE member_pages ADD COLUMN reverbnation_url TEXT NOT NULL DEFAULT ''"],
];
for (const [columnName, sql] of memberPageAlterStatements) {
  if (!memberPageColumnNames.has(columnName)) {
    await client.execute(sql);
  }
}

const upsertSql = `
  INSERT INTO member_pages (
    slug,
    title,
    first_name,
    last_name,
    canonical_url,
    published_time,
    updated_time,
    picture_url,
    featured_video_url,
    featured_video_title,
    legacy_video_links_json,
    audio_links_json,
    web_links_json,
    musical_styles_json,
    primary_instruments_json,
    additional_instruments_text,
    work_desired_json,
    work_desired_other,
    number_chart_read,
    number_chart_write,
    chord_chart_read,
    chord_chart_write,
    has_home_studio,
    is_engineer,
    additional_skills_json,
    additional_skills_other,
    website_url,
    facebook_url,
    reverbnation_url,
    contact_html,
    description_html,
    personnel_html,
    body_html,
    source_path,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    title=excluded.title,
    first_name=excluded.first_name,
    last_name=excluded.last_name,
    canonical_url=excluded.canonical_url,
    published_time=excluded.published_time,
    updated_time=excluded.updated_time,
    picture_url=excluded.picture_url,
    featured_video_url=excluded.featured_video_url,
    featured_video_title=excluded.featured_video_title,
    legacy_video_links_json=excluded.legacy_video_links_json,
    audio_links_json=excluded.audio_links_json,
    web_links_json=excluded.web_links_json,
    musical_styles_json=excluded.musical_styles_json,
    primary_instruments_json=excluded.primary_instruments_json,
    additional_instruments_text=excluded.additional_instruments_text,
    work_desired_json=excluded.work_desired_json,
    work_desired_other=excluded.work_desired_other,
    number_chart_read=excluded.number_chart_read,
    number_chart_write=excluded.number_chart_write,
    chord_chart_read=excluded.chord_chart_read,
    chord_chart_write=excluded.chord_chart_write,
    has_home_studio=excluded.has_home_studio,
    is_engineer=excluded.is_engineer,
    additional_skills_json=excluded.additional_skills_json,
    additional_skills_other=excluded.additional_skills_other,
    website_url=excluded.website_url,
    facebook_url=excluded.facebook_url,
    reverbnation_url=excluded.reverbnation_url,
    contact_html=excluded.contact_html,
    description_html=excluded.description_html,
    personnel_html=excluded.personnel_html,
    body_html=excluded.body_html,
    source_path=excluded.source_path,
    updated_at=datetime('now');
`;

function walkAssets(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAssets(full, files);
    } else if (entry.isFile() && entry.name.endsWith("--asset")) {
      files.push(full);
    }
  }
  return files;
}

function extractMeta(html, property) {
  const re = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function extractLink(html, rel) {
  const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i");
  const match = html.match(re);
  return match ? match[1].trim() : "";
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(value) {
  return decodeHtmlEntities(String(value ?? "").replace(/<[^>]+>/g, " "));
}

function cleanLegacyText(value) {
  return stripTags(value).replace(/\s+/g, " ").trim();
}

function normalizeTitleKey(value) {
  return cleanLegacyText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeLinks(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const url = decodeHtmlEntities(String(item?.url || "").trim());
    const label = cleanLegacyText(item?.label || url);
    if (!url) continue;
    const key = `${url}::${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ label: label || url, url });
  }
  return result;
}

function dedupeMediaLinks(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const url = decodeHtmlEntities(String(item?.url || "").trim());
    const label = cleanLegacyText(item?.label || url);
    const mimeType = cleanLegacyText(item?.mimeType || "");
    if (!url) continue;
    const key = `${url}::${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ label: label || url, url, mimeType });
  }
  return result;
}

function dedupeStrings(items = []) {
  const seen = new Set();
  const result = [];
  for (const value of items) {
    const cleaned = cleanLegacyText(value);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

function cleanLegacyBlockText(value) {
  return decodeHtmlEntities(
    String(value ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Inner HTML of the first .field-item inside a Drupal 7 field wrapper (handles nested divs).
 */
function extractDrupalFieldInnerHtml(html, fieldClassToken) {
  const re = new RegExp(
    `<div\\s+[^>]*class="[^"]*\\b${fieldClassToken}\\b[^"]*"[^>]*>\\s*` +
      `<div\\s+[^>]*class="[^"]*field-items[^"]*"[^>]*>\\s*` +
      `<div\\s+[^>]*class="[^"]*field-item[^"]*"[^>]*>`,
    "i",
  );
  const m = html.match(re);
  if (!m || m.index === undefined) return "";
  let i = m.index + m[0].length;
  let depth = 1;
  const s = html;
  while (i < s.length && depth > 0) {
    const chunk = s.slice(i);
    const openAt = chunk.search(/<div[\s>]/i);
    const closeAt = chunk.toLowerCase().indexOf("</div>");
    if (closeAt === -1) return "";
    const absOpen = openAt >= 0 ? i + openAt : Number.POSITIVE_INFINITY;
    const absClose = i + closeAt;
    if (absOpen < absClose) {
      depth += 1;
      i = absOpen + 4;
    } else {
      depth -= 1;
      i = absClose + 6;
    }
  }
  return s.slice(m.index + m[0].length, i - 6).trim();
}

function extractDrupalFieldHtml(html, fieldClassToken) {
  const re = new RegExp(`<div\\s+[^>]*class="[^"]*\\b${fieldClassToken}\\b[^"]*"[^>]*>`, "i");
  const m = html.match(re);
  if (!m || m.index === undefined) return "";
  let i = m.index + m[0].length;
  let depth = 1;
  const s = html;
  while (i < s.length && depth > 0) {
    const chunk = s.slice(i);
    const openAt = chunk.search(/<div[\s>]/i);
    const closeAt = chunk.toLowerCase().indexOf("</div>");
    if (closeAt === -1) return "";
    const absOpen = openAt >= 0 ? i + openAt : Number.POSITIVE_INFINITY;
    const absClose = i + closeAt;
    if (absOpen < absClose) {
      depth += 1;
      i = absOpen + 4;
    } else {
      depth -= 1;
      i = absClose + 6;
    }
  }
  return s.slice(m.index + m[0].length, i - 6).trim();
}

function extractDivInnerHtmlById(html, id) {
  const re = new RegExp(`<div\\s+[^>]*id=['"]${id}['"][^>]*>`, "i");
  const m = html.match(re);
  if (!m || m.index === undefined) return "";
  let i = m.index + m[0].length;
  let depth = 1;
  const s = html;
  while (i < s.length && depth > 0) {
    const chunk = s.slice(i);
    const openAt = chunk.search(/<div[\s>]/i);
    const closeAt = chunk.toLowerCase().indexOf("</div>");
    if (closeAt === -1) return "";
    const absOpen = openAt >= 0 ? i + openAt : Number.POSITIVE_INFINITY;
    const absClose = i + closeAt;
    if (absOpen < absClose) {
      depth += 1;
      i = absOpen + 4;
    } else {
      depth -= 1;
      i = absClose + 6;
    }
  }
  return s.slice(m.index + m[0].length, i - 6).trim();
}

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractPersonnelFromLegacyProfile(html) {
  const m = html.match(
    /id=['"]member-profile-prime-instruments['"][^>]*>([\s\S]*?)<\/div>\s*<div\s+id=['"]member-profile-additional-instruments/im,
  );
  const labels = [];
  if (m) {
    const chunk = m[1].replace(/<h2>[\s\S]*?<\/h2>/gi, " ");
    for (const part of chunk.split(/<br\s*\/?>/i)) {
      const t = part.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!t) continue;
      const u = t.replace(/^PRIMARY\s+INSTRUMENT\(S\):\s*/i, "").trim();
      if (u && u.length < 96 && !/^TYPE OF WORK/i.test(u)) labels.push(u);
    }
  }
  const add = html.match(/class=['"]additional-instruments-text['"][^>]*>([\s\S]*?)<\/p>/i);
  if (add) {
    const t = add[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (t) labels.push(t);
  }
  if (!labels.length) return "";
  const uniq = [...new Set(labels)];
  return `<p>${uniq.map(escapeHtmlText).join(", ")}</p>`;
}

function extractDrupalFieldImageSrc(html, fieldClassToken) {
  const inner = extractDrupalFieldInnerHtml(html, fieldClassToken);
  if (!inner) return "";
  const match = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? decodeHtmlEntities(match[1].trim()) : "";
}

function extractFeaturedVideo(html) {
  const inner = extractDrupalFieldInnerHtml(html, "field-name-field-youtube");
  if (!inner) {
    return { url: "", title: "" };
  }
  const iframe = inner.match(/<iframe[^>]+title=["']([^"']*)["'][^>]+src=["']([^"']+)["']/i);
  if (iframe) {
    return {
      title: cleanLegacyText(iframe[1]),
      url: decodeHtmlEntities(iframe[2].trim()),
    };
  }
  const fallback = inner.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  return {
    title: fallback ? cleanLegacyText(fallback[2]) : "",
    url: fallback ? decodeHtmlEntities(fallback[1].trim()) : "",
  };
}

function extractAnchorListFromDrupalField(html, fieldClassToken) {
  const inner = extractDrupalFieldHtml(html, fieldClassToken);
  if (!inner) return [];

  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of inner.matchAll(regex)) {
    const url = decodeHtmlEntities(match[1].trim());
    const label = cleanLegacyText(match[2]) || url;
    if (!url) continue;
    links.push({ label, url });
  }
  return links;
}

function extractAudioLinksFromDrupalField(html, fieldClassToken) {
  const inner = extractDrupalFieldHtml(html, fieldClassToken);
  if (!inner) return [];

  const links = [];
  const itemRegex = /<div[^>]+class=["'][^"']*field-item[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]+class=["'][^"']*field-item|$)/gi;
  for (const match of inner.matchAll(itemRegex)) {
    const chunk = match[1];
    const source = chunk.match(/<source[^>]+src=["']([^"']+)["'][^>]*type=["']([^"']*)["']/i);
    const fallback = chunk.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const url = decodeHtmlEntities((source?.[1] || fallback?.[1] || "").trim());
    if (!url) continue;
    const mimeType = cleanLegacyText(source?.[2] || "");
    const label = cleanLegacyText(fallback?.[2] || url);
    if (/\/media-folders\//i.test(url) || /^media root$/i.test(label)) continue;
    links.push({
      label: label || url,
      url,
      mimeType,
    });
  }
  return dedupeMediaLinks(links);
}

function extractAnchorTextListFromDrupalField(html, fieldClassToken) {
  const inner = extractDrupalFieldHtml(html, fieldClassToken);
  if (!inner) return [];

  const values = [];
  const anchorRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of inner.matchAll(anchorRegex)) {
    const label = cleanLegacyText(match[1]);
    if (label) values.push(label);
  }
  return dedupeStrings(values);
}

function deriveNamedWebLinks(links = []) {
  const named = {
    websiteUrl: "",
    facebookUrl: "",
    reverbnationUrl: "",
  };

  for (const item of links) {
    const url = String(item?.url || "");
    const label = String(item?.label || "").toLowerCase();
    const lowerUrl = url.toLowerCase();
    if (!named.facebookUrl && (lowerUrl.includes("facebook.com") || label.includes("facebook"))) {
      named.facebookUrl = url;
      continue;
    }
    if (!named.reverbnationUrl && (lowerUrl.includes("reverbnation.com") || label.includes("reverbnation"))) {
      named.reverbnationUrl = url;
      continue;
    }
    if (!named.websiteUrl) {
      named.websiteUrl = url;
    }
  }

  return named;
}

function parseLegacySelectedLabels(blockHtml) {
  const normalized = String(blockHtml ?? "")
    .replace(/<img[^>]+deselect\.gif[^>]*>/gi, "[DESELECTED]")
    .replace(/<img[^>]+select\.gif[^>]*>/gi, "[SELECTED]")
    .replace(/<br\s*\/?>/gi, "\n");

  const values = [];
  for (const line of normalized.split("\n")) {
    const isSelected = line.includes("[SELECTED]");
    const isDeselected = line.includes("[DESELECTED]");
    if (!isSelected || isDeselected) continue;

    let label = cleanLegacyText(line.replace(/\[(?:DESELECTED|SELECTED)\]/g, ""));
    label = label
      .replace(
        /^(PRIMARY INSTRUMENT\(S\)|ADDITIONAL INSTRUMENT\(S\)|TYPE OF WORK DESIRED|CHART READING\/WRITING SKILLS|HOME STUDIO|ENGINEER|ADDITIONAL SKILLS|ADDITIONAL SKIILLS|NUMBER CHARTS|CHORD CHART)\s*:?\s*/i,
        "",
      )
      .replace(/^(Home Studio|Engineer)\s*:\s*/i, "")
      .trim();
    if (/^other\b/i.test(label)) {
      label = "Other";
    }

    if (!label) continue;
    values.push(label);
  }

  return [...new Set(values)];
}

function extractTextByClass(blockHtml, classToken) {
  const match = String(blockHtml ?? "").match(
    new RegExp(`<[^>]+class=["'][^"']*${classToken}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"),
  );
  return match ? cleanLegacyBlockText(match[1]) : "";
}

function parseLegacyBooleanBlock(blockHtml) {
  const selected = parseLegacySelectedLabels(blockHtml);
  if (selected.some((value) => /^yes$/i.test(value))) return 1;
  return 0;
}

function parseWebLink(html, label) {
  const match = html.match(
    new RegExp(
      `<div\\s+[^>]*class=["'][^"']*web-links-field[^"']*["'][^>]*>\\s*${label}\\s*:\\s*<a[^>]+href=["']([^"']+)["']`,
      "i",
    ),
  );
  return match ? decodeHtmlEntities(match[1].trim()) : "";
}

function extractDocumentTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return "";
  return m[1].replace(/\s*\|\s*Nashville.*$/i, "").replace(/\s+/g, " ").trim();
}

function extractPageTitleH1(html) {
  const m = html.match(/<h1[^>]*id=["']page-title["'][^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").trim();
}

function titleFromUsersPath(url) {
  const match = String(url || "").match(/\/users\/([^/?#]+)\/?$/i);
  if (!match) return "";
  return decodeURIComponent(match[1])
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function walkIndexFiles(dir, files = [], depth = 0) {
  if (!fs.existsSync(dir) || depth > 4) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkIndexFiles(full, files, depth + 1);
    } else if (entry.isFile() && entry.name === "index.html") {
      files.push(full);
    }
  }
  return files;
}

function shouldSkipSupplementalPath(filePath) {
  const rel = path.relative(SOURCE_ROOT, filePath).replace(/\\/g, "/");
  const first = rel.split("/")[0] || "";
  return (
    !rel ||
    rel === "index.html" ||
    first === "user" ||
    first === "node" ||
    first === "taxonomy" ||
    first === "news-and-events" ||
    first === "event" ||
    first === "media-folders" ||
    first === "sites" ||
    first === "misc"
  );
}

function extractSupplementalProfile(html) {
  const title = extractPageTitleH1(html) || extractDocumentTitle(html);
  const titleKey = normalizeTitleKey(title);
  if (!titleKey) return null;

  const webLinks = dedupeLinks(extractAnchorListFromDrupalField(html, "field-name-field-web-links"));
  const videoLinks = dedupeLinks(extractAnchorListFromDrupalField(html, "field-name-field-video-links"));
  const soundLinks = dedupeLinks(extractAnchorListFromDrupalField(html, "field-name-field-sound-clip"));
  const musicalStyles = dedupeStrings(
    extractAnchorTextListFromDrupalField(html, "field-name-field-musical-style-s-")
  );

  if (!webLinks.length && !videoLinks.length && !soundLinks.length && !musicalStyles.length) {
    return null;
  }

  return {
    titleKey,
    webLinks,
    videoLinks,
    soundLinks,
    musicalStyles,
  };
}

function normalizeSlug(filePath) {
  return path.basename(filePath).replace(/--asset$/, "");
}

function isContactAssetFile(filePath) {
  const rel = path.relative(USER_PROFILE_DIR, filePath).replace(/\\/g, "/");
  return rel.includes("/contact--asset") || rel.endsWith("contact--asset");
}

if (!fs.existsSync(USER_PROFILE_DIR)) {
  console.error(
    `db-sync-member-pages: expected member profile HTML in ${USER_PROFILE_DIR} (under ${SOURCE_ROOT}). Set MEMBER_PAGES_SOURCE_DIR to a _downloaded root that contains user/).`,
  );
  await closeDb();
  process.exit(1);
}

const supplementalProfiles = new Map();
for (const file of walkIndexFiles(SOURCE_ROOT)) {
  if (shouldSkipSupplementalPath(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const supplemental = extractSupplementalProfile(html);
  if (!supplemental) continue;

  const existing = supplementalProfiles.get(supplemental.titleKey);
  if (!existing) {
    supplementalProfiles.set(supplemental.titleKey, supplemental);
    continue;
  }

  existing.webLinks = dedupeLinks([...existing.webLinks, ...supplemental.webLinks]);
  existing.videoLinks = dedupeLinks([...existing.videoLinks, ...supplemental.videoLinks]);
  existing.soundLinks = dedupeLinks([...existing.soundLinks, ...supplemental.soundLinks]);
  existing.musicalStyles = dedupeStrings([...existing.musicalStyles, ...supplemental.musicalStyles]);
}

const files = walkAssets(USER_PROFILE_DIR);

let processed = 0;
let kept = 0;
let skippedContact = 0;
let supplemented = 0;
let audioAugmented = 0;

for (const file of files) {
  processed += 1;
  if (isContactAssetFile(file)) {
    skippedContact += 1;
    continue;
  }

  const html = fs.readFileSync(file, "utf8");

  const slug = normalizeSlug(file);
  const canonical_url = extractMeta(html, "og:url") || extractLink(html, "canonical");
  const published_time =
    extractMeta(html, "article:published_time") || extractMeta(html, "og:published_time");
  const updated_time =
    extractMeta(html, "article:modified_time") || extractMeta(html, "og:updated_time");
  const first_name = cleanLegacyText(extractDrupalFieldInnerHtml(html, "field-name-field-first-name"));
  const last_name = cleanLegacyText(extractDrupalFieldInnerHtml(html, "field-name-field-last-name"));
  const picture_url = extractDrupalFieldImageSrc(html, "field-name-field-picture");
  const featuredVideo = extractFeaturedVideo(html);
  const userVideoLinks = extractAnchorListFromDrupalField(html, "field-name-field-artist-video-links");
  const audioLinks = extractAudioLinksFromDrupalField(html, "field-name-field-clip-1");

  const h1 = extractPageTitleH1(html);
  const docTitle = extractDocumentTitle(html);
  let title = h1;
  if (!h1 || /^member profile$/i.test(h1)) {
    title = docTitle || h1 || slug;
  }
  if (!title) title = slug;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(title)) {
    const fromCanon = titleFromUsersPath(canonical_url);
    if (fromCanon) title = fromCanon;
  }
  const supplemental = supplementalProfiles.get(normalizeTitleKey(title));

  const contact_html = extractDrupalFieldInnerHtml(html, "field-name-field-contact-information");
  const description_html =
    extractDrupalFieldInnerHtml(html, "field-name-field-describe-what-you-do") ||
    extractDrupalFieldInnerHtml(html, "field-name-field-describe-what-you-do-in-10");
  let personnel_html =
    extractDrupalFieldInnerHtml(html, "field-name-field-personnel-instrumentation") ||
    extractPersonnelFromLegacyProfile(html);
  const body_html = extractDrupalFieldInnerHtml(html, "field-name-field-bio-description");

  if (personnel_html && /select\.gif|member-profile-|TYPE OF WORK DESIRED/i.test(personnel_html)) {
    personnel_html = extractPersonnelFromLegacyProfile(html);
  }

  const primaryInstrumentsBlock = extractDivInnerHtmlById(html, "member-profile-prime-instruments");
  const additionalInstrumentsBlock = extractDivInnerHtmlById(html, "member-profile-additional-instruments");
  const desiredWorkBlock = extractDivInnerHtmlById(html, "member-profile-desired-work");
  const numberChartBlock = extractDivInnerHtmlById(html, "member-profile-num-chart");
  const chordChartBlock = extractDivInnerHtmlById(html, "member-profile-chord-chart");
  const homeStudioBlock = extractDivInnerHtmlById(html, "member-profile-home-studio");
  const engineerBlock = extractDivInnerHtmlById(html, "member-profile-engineer");
  const additionalSkillsBlock = extractDivInnerHtmlById(html, "member-profile-addskills");

  const primary_instruments_json = JSON.stringify(parseLegacySelectedLabels(primaryInstrumentsBlock));
  const additional_instruments_text = extractTextByClass(
    additionalInstrumentsBlock,
    "additional-instruments-text",
  );
  const work_desired_json = JSON.stringify(parseLegacySelectedLabels(desiredWorkBlock));
  const work_desired_other = extractTextByClass(desiredWorkBlock, "work-desired-other-text");
  const numberChartSelections = parseLegacySelectedLabels(numberChartBlock);
  const chordChartSelections = parseLegacySelectedLabels(chordChartBlock);
  const number_chart_read = numberChartSelections.some((value) => /^read$/i.test(value)) ? 1 : 0;
  const number_chart_write = numberChartSelections.some((value) => /^write$/i.test(value)) ? 1 : 0;
  const chord_chart_read = chordChartSelections.some((value) => /^read$/i.test(value)) ? 1 : 0;
  const chord_chart_write = chordChartSelections.some((value) => /^write$/i.test(value)) ? 1 : 0;
  const has_home_studio = parseLegacyBooleanBlock(homeStudioBlock);
  const is_engineer = parseLegacyBooleanBlock(engineerBlock);
  const additional_skills_json = JSON.stringify(parseLegacySelectedLabels(additionalSkillsBlock));
  const additional_skills_other = extractTextByClass(additionalSkillsBlock, "additional-skill-other-text");
  const structuredWebsiteUrl = parseWebLink(html, "Website Link");
  const structuredFacebookUrl = parseWebLink(html, "Facebook Link");
  const structuredReverbnationUrl = parseWebLink(html, "ReverbNation Link");
  const supplementalNamedLinks = deriveNamedWebLinks(supplemental?.webLinks || []);
  const website_url = structuredWebsiteUrl || supplementalNamedLinks.websiteUrl || "";
  const facebook_url = structuredFacebookUrl || supplementalNamedLinks.facebookUrl || "";
  const reverbnation_url = structuredReverbnationUrl || supplementalNamedLinks.reverbnationUrl || "";
  const legacyVideoLinks = dedupeLinks([...(supplemental?.videoLinks || []), ...userVideoLinks]);
  const webLinks = dedupeLinks(supplemental?.webLinks || []);
  const musicalStyles = dedupeStrings(supplemental?.musicalStyles || []);
  const mergedAudioLinks = dedupeMediaLinks([...(supplemental?.soundLinks || []), ...audioLinks]);

  if (supplemental) supplemented += 1;
  if (mergedAudioLinks.length) audioAugmented += 1;

  await client.execute({
    sql: upsertSql,
    args: [
      slug,
      title,
      first_name,
      last_name,
      canonical_url || "",
      published_time || "",
      updated_time || "",
      picture_url || "",
      featuredVideo.url || "",
      featuredVideo.title || "",
      JSON.stringify(legacyVideoLinks),
      JSON.stringify(mergedAudioLinks),
      JSON.stringify(webLinks),
      JSON.stringify(musicalStyles),
      primary_instruments_json,
      additional_instruments_text || "",
      work_desired_json,
      work_desired_other || "",
      number_chart_read,
      number_chart_write,
      chord_chart_read,
      chord_chart_write,
      has_home_studio,
      is_engineer,
      additional_skills_json,
      additional_skills_other || "",
      website_url || "",
      facebook_url || "",
      reverbnation_url || "",
      contact_html || "",
      description_html || "",
      personnel_html || "",
      body_html || "",
      path.relative(ROOT, file),
    ],
  });

  kept += 1;
}

console.log(
  `Scanned ${processed} assets; skipped ${skippedContact} contact pages; upserted ${kept} member rows into Turso (${dbPath}) (${supplemented} supplemented from pretty profile pages, ${audioAugmented} with audio links).`,
);
await closeDb();
