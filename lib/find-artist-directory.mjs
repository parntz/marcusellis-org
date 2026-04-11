import { getClient } from "./sqlite.mjs";

function decodeHtmlEntities(value = "") {
  return String(value || "")
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

function cleanText(value = "", max = 400) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanHtml(value = "") {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .trim();
}

function cleanUrl(value = "", max = 1500) {
  return String(value || "").trim().slice(0, max);
}

function cleanJsonArray(value, maxItems = 50) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => {
      if (item && typeof item === "object") {
        return Object.fromEntries(
          Object.entries(item).map(([key, entryValue]) => [key, cleanText(String(entryValue || ""), 600)])
        );
      }
      return cleanText(String(item || ""), 600);
    })
    .filter(Boolean)
    .slice(0, maxItems);
}

function linesToArray(value = "", maxItems = 50) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => cleanText(item, 240))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeArtistWebLinks(value, fallback = [], maxItems = 50) {
  const list = Array.isArray(value) ? value : fallback;
  return list
    .map((item) => ({
      label: cleanText(item?.label || "", 240),
      href: cleanUrl(item?.href || item?.url || "", 1500),
    }))
    .filter((item) => item.href)
    .slice(0, maxItems);
}

function mapArtistBandRow(row) {
  let webLinks = [];
  let musicalStyles = [];

  try {
    const parsed = JSON.parse(String(row.web_links_json || "[]"));
    webLinks = Array.isArray(parsed) ? parsed : [];
  } catch {
    webLinks = [];
  }

  try {
    const parsed = JSON.parse(String(row.musical_styles_json || "[]"));
    musicalStyles = Array.isArray(parsed) ? parsed : [];
  } catch {
    musicalStyles = [];
  }

  return {
    id: Number(row.id || 0),
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    profileHref: String(row.profile_href || ""),
    sourcePageIndex: Number(row.source_page_index || 0),
    displayOrder: Number(row.display_order || 0),
    listingPersonnelHtml: String(row.listing_personnel_html || ""),
    contactHtml: String(row.contact_html || ""),
    descriptionHtml: String(row.description_html || ""),
    personnelHtml: String(row.personnel_html || ""),
    pictureUrl: String(row.picture_url || ""),
    webLinks,
    musicalStyles,
    featuredVideoUrl: String(row.featured_video_url || ""),
    featuredVideoTitle: String(row.featured_video_title || ""),
    sourcePath: String(row.source_path || ""),
  };
}

function normalizeArtistBandInput(raw = {}, index = 0) {
  return {
    slug: cleanText(raw.slug || "", 220).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
    title: cleanText(raw.title || "", 240),
    profileHref: cleanUrl(raw.profileHref || raw.profile_href),
    sourcePageIndex: Number.parseInt(String(raw.sourcePageIndex ?? raw.source_page_index ?? 0), 10) || 0,
    displayOrder: Number.parseInt(String(raw.displayOrder ?? raw.display_order ?? index), 10) || 0,
    listingPersonnelHtml: cleanHtml(raw.listingPersonnelHtml ?? raw.listing_personnel_html ?? ""),
    contactHtml: cleanHtml(raw.contactHtml ?? raw.contact_html ?? ""),
    descriptionHtml: cleanHtml(raw.descriptionHtml ?? raw.description_html ?? ""),
    personnelHtml: cleanHtml(raw.personnelHtml ?? raw.personnel_html ?? ""),
    pictureUrl: cleanUrl(raw.pictureUrl ?? raw.picture_url),
    webLinksJson: JSON.stringify(cleanJsonArray(raw.webLinks ?? raw.web_links_json ?? [])),
    musicalStylesJson: JSON.stringify(cleanJsonArray(raw.musicalStyles ?? raw.musical_styles_json ?? [])),
    featuredVideoUrl: cleanUrl(raw.featuredVideoUrl ?? raw.featured_video_url),
    featuredVideoTitle: cleanText(raw.featuredVideoTitle ?? raw.featured_video_title ?? "", 240),
    sourcePath: cleanText(raw.sourcePath ?? raw.source_path ?? "", 240),
  };
}

export async function ensureArtistBandProfilesTable() {
  const client = getClient();
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS artist_band_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      profile_href TEXT NOT NULL DEFAULT '',
      source_page_index INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      listing_personnel_html TEXT NOT NULL DEFAULT '',
      contact_html TEXT NOT NULL DEFAULT '',
      description_html TEXT NOT NULL DEFAULT '',
      personnel_html TEXT NOT NULL DEFAULT '',
      picture_url TEXT NOT NULL DEFAULT '',
      web_links_json TEXT NOT NULL DEFAULT '[]',
      musical_styles_json TEXT NOT NULL DEFAULT '[]',
      featured_video_url TEXT NOT NULL DEFAULT '',
      featured_video_title TEXT NOT NULL DEFAULT '',
      source_path TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_artist_band_profiles_display_order
      ON artist_band_profiles(display_order ASC, id ASC);
  `);
}

export async function listArtistBandProfiles() {
  await ensureArtistBandProfilesTable();
  const client = getClient();
  const rs = await client.execute(`
    SELECT
      id,
      slug,
      title,
      profile_href,
      source_page_index,
      display_order,
      listing_personnel_html,
      contact_html,
      description_html,
      personnel_html,
      picture_url,
      web_links_json,
      musical_styles_json,
      featured_video_url,
      featured_video_title,
      source_path
    FROM artist_band_profiles
    ORDER BY display_order ASC, id ASC
  `);
  return (rs.rows || []).map(mapArtistBandRow);
}

export async function getArtistBandProfileBySlug(slug = "") {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return null;

  await ensureArtistBandProfilesTable();
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        slug,
        title,
        profile_href,
        source_page_index,
        display_order,
        listing_personnel_html,
        contact_html,
        description_html,
        personnel_html,
        picture_url,
        web_links_json,
        musical_styles_json,
        featured_video_url,
        featured_video_title,
        source_path
      FROM artist_band_profiles
      WHERE slug = ?
      LIMIT 1
    `,
    args: [normalizedSlug],
  });

  const row = rs.rows?.[0];
  return row ? mapArtistBandRow(row) : null;
}

export async function updateArtistBandProfileBySlug(slug = "", input = {}) {
  const existing = await getArtistBandProfileBySlug(slug);
  if (!existing) {
    throw new Error("Artist or band profile not found.");
  }

  const normalized = normalizeArtistBandInput(
    {
      slug: existing.slug,
      title: Object.prototype.hasOwnProperty.call(input, "title") ? input.title : existing.title,
      profileHref: Object.prototype.hasOwnProperty.call(input, "profileHref")
        ? input.profileHref
        : existing.profileHref,
      sourcePageIndex: existing.sourcePageIndex,
      displayOrder: existing.displayOrder,
      listingPersonnelHtml: existing.listingPersonnelHtml,
      contactHtml: Object.prototype.hasOwnProperty.call(input, "contactHtml") ? input.contactHtml : existing.contactHtml,
      descriptionHtml: Object.prototype.hasOwnProperty.call(input, "descriptionHtml")
        ? input.descriptionHtml
        : existing.descriptionHtml,
      personnelHtml: Object.prototype.hasOwnProperty.call(input, "personnelHtml")
        ? input.personnelHtml
        : existing.personnelHtml,
      pictureUrl: Object.prototype.hasOwnProperty.call(input, "pictureUrl") ? input.pictureUrl : existing.pictureUrl,
      webLinks: Object.prototype.hasOwnProperty.call(input, "webLinks")
        ? normalizeArtistWebLinks(input.webLinks)
        : existing.webLinks,
      musicalStyles: Object.prototype.hasOwnProperty.call(input, "musicalStyles")
        ? Array.isArray(input.musicalStyles)
          ? cleanJsonArray(input.musicalStyles)
          : linesToArray(input.musicalStyles)
        : existing.musicalStyles,
      featuredVideoUrl: Object.prototype.hasOwnProperty.call(input, "featuredVideoUrl")
        ? input.featuredVideoUrl
        : existing.featuredVideoUrl,
      featuredVideoTitle: Object.prototype.hasOwnProperty.call(input, "featuredVideoTitle")
        ? input.featuredVideoTitle
        : existing.featuredVideoTitle,
      sourcePath: existing.sourcePath,
    },
    existing.displayOrder
  );

  const client = getClient();
  await client.execute({
    sql: `
      UPDATE artist_band_profiles
      SET
        title = ?,
        profile_href = ?,
        source_page_index = ?,
        display_order = ?,
        listing_personnel_html = ?,
        contact_html = ?,
        description_html = ?,
        personnel_html = ?,
        picture_url = ?,
        web_links_json = ?,
        musical_styles_json = ?,
        featured_video_url = ?,
        featured_video_title = ?,
        source_path = ?,
        updated_at = datetime('now')
      WHERE slug = ?
    `,
    args: [
      normalized.title,
      normalized.profileHref,
      normalized.sourcePageIndex,
      normalized.displayOrder,
      normalized.listingPersonnelHtml,
      normalized.contactHtml,
      normalized.descriptionHtml,
      normalized.personnelHtml,
      normalized.pictureUrl,
      normalized.webLinksJson,
      normalized.musicalStylesJson,
      normalized.featuredVideoUrl,
      normalized.featuredVideoTitle,
      normalized.sourcePath,
      existing.slug,
    ],
  });

  return getArtistBandProfileBySlug(existing.slug);
}

export async function replaceArtistBandProfiles(items = []) {
  await ensureArtistBandProfilesTable();
  const client = getClient();
  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => normalizeArtistBandInput(item, index))
    .filter((item) => item.slug && item.title && item.profileHref);

  await client.execute("DELETE FROM artist_band_profiles");

  for (const item of normalized) {
    await client.execute({
      sql: `
        INSERT INTO artist_band_profiles (
          slug,
          title,
          profile_href,
          source_page_index,
          display_order,
          listing_personnel_html,
          contact_html,
          description_html,
          personnel_html,
          picture_url,
          web_links_json,
          musical_styles_json,
          featured_video_url,
          featured_video_title,
          source_path,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      args: [
        item.slug,
        item.title,
        item.profileHref,
        item.sourcePageIndex,
        item.displayOrder,
        item.listingPersonnelHtml,
        item.contactHtml,
        item.descriptionHtml,
        item.personnelHtml,
        item.pictureUrl,
        item.webLinksJson,
        item.musicalStylesJson,
        item.featuredVideoUrl,
        item.featuredVideoTitle,
        item.sourcePath,
      ],
    });
  }

  return listArtistBandProfiles();
}
