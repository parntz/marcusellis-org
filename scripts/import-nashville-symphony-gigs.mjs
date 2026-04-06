import "./load-env.mjs";
import fs from "fs";
import path from "path";
import { closeDb, getClient } from "../lib/sqlite.mjs";

const EVENTS_URL = "https://tickets.nashvillesymphony.org/events";
const PRODUCTIONS_API_URL = "https://tickets.nashvillesymphony.org/api/products/productionseasons";
const DEFAULT_VENUE = "Schermerhorn Symphony Center";
const DEFAULT_ADDRESS = "One Symphony Place, Nashville, TN 37201-2031";
const IMPORT_TAG = "Imported from Nashville Symphony";
const uploadsDir = path.join(process.cwd(), "public", "uploads", "gigs");

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(input = "") {
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
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&trade;/gi, "TM")
    .replace(/&reg;/gi, "(R)")
    .replace(/&copy;/gi, "(C)")
    .replace(/&eacute;/gi, "e")
    .replace(/&uuml;/gi, "u")
    .replace(/&ouml;/gi, "o")
    .replace(/&aacute;/gi, "a")
    .replace(/&nbsp/gi, " ");
}

function stripHtml(input = "") {
  return cleanText(
    decodeHtmlEntities(
      String(input)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function parseEventsPage(html) {
  const token = html.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/)?.[1] || "";
  const listingStartDate = html.match(/var listingStartDate = "([^"]+)"/)?.[1] || "";
  const listingEndDate = html.match(/var listingEndDate = "([^"]+)"/)?.[1] || "";

  if (!token || !listingStartDate || !listingEndDate) {
    throw new Error("Could not parse Nashville Symphony events page bootstrap values.");
  }

  return { token, listingStartDate, listingEndDate };
}

function toApiIso(dateTimeString) {
  const base = String(dateTimeString || "").slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(base)) {
    throw new Error(`Invalid Nashville Symphony date: ${dateTimeString}`);
  }
  return `${base}-05:00`;
}

function toDateTimeLocal(dateTimeString) {
  const base = String(dateTimeString || "").slice(0, 16);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(base) ? base : "";
}

function getParagraphs(html = "") {
  return Array.from(String(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) => match[1]);
}

function extractArtists(descriptionHtml = "", productionTitle = "") {
  const paragraphs = getParagraphs(descriptionHtml);
  const lineup = paragraphs.find((paragraph) => {
    const plain = stripHtml(paragraph);
    return (
      /<strong/i.test(paragraph) &&
      !/learn more/i.test(plain) &&
      !/not applicable/i.test(plain) &&
      !/purchase season tickets/i.test(plain) &&
      !/^program$/i.test(plain)
    );
  });

  if (!lineup) {
    return productionTitle ? [cleanText(productionTitle)] : [];
  }

  return stripHtml(lineup)
    .split("|")
    .map((part) => cleanText(part.replace(/\s+,/g, ",")))
    .filter(Boolean)
    .slice(0, 24);
}

function extractNotes(descriptionHtml = "", sourceUrl = "") {
  const paragraphs = getParagraphs(descriptionHtml)
    .map((paragraph) => stripHtml(paragraph))
    .filter((paragraph) => paragraph && !/learn more/i.test(paragraph));

  const summary = cleanText(paragraphs.join("\n\n"));
  const pieces = [IMPORT_TAG];
  if (summary) {
    pieces.push(summary);
  }
  if (sourceUrl) {
    pieces.push(`Source: ${sourceUrl}`);
  }
  return pieces.join("\n\n");
}

function parseVenueDetails(html = "") {
  const directVenue =
    html.match(/<p>\s*\d{1,2}:\d{2}\s*[AP]M\s*<span>\s*\|\s*<\/span>\s*([^<]+)<\/p>/i)?.[1] ||
    html.match(/<div[^>]*>\s*Venue\s*<\/div>\s*<div[^>]*>\s*([^<]+)\s*<\/div>/i)?.[1] ||
    "";

  const venue = cleanText(directVenue) || DEFAULT_VENUE;
  const address = /one symphony place/i.test(html) || /schermerhorn symphony center/i.test(venue)
    ? DEFAULT_ADDRESS
    : "";

  return { venue, address };
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }
  return response.json();
}

async function downloadImage(imageUrl, productionSeasonId) {
  if (!imageUrl) return "";

  fs.mkdirSync(uploadsDir, { recursive: true });
  const url = new URL(imageUrl);
  const ext = path.extname(url.pathname).toLowerCase() || ".jpg";
  const safeExt = /^[.][a-z0-9]+$/i.test(ext) ? ext : ".jpg";
  const filename = `nso-${productionSeasonId}${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Image download failed for ${imageUrl}: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  }

  return `/api/gigs/asset/${encodeURIComponent(filename)}`;
}

async function ensureGigsSchema(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS gigs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL DEFAULT '',
      band_name TEXT NOT NULL DEFAULT '',
      location_name TEXT NOT NULL,
      location_address TEXT NOT NULL DEFAULT '',
      google_place_id TEXT NOT NULL DEFAULT '',
      artists_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const tableInfo = await client.execute("PRAGMA table_info(gigs)");
  const columns = new Set(tableInfo.rows.map((row) => cleanText(row.name).toLowerCase()));
  if (!columns.has("band_name")) {
    await client.execute("ALTER TABLE gigs ADD COLUMN band_name TEXT NOT NULL DEFAULT ''");
  }
}

async function upsertGig(client, gig) {
  const existing = await client.execute({
    sql: `
      SELECT id
      FROM gigs
      WHERE start_at = ?
        AND band_name = ?
        AND location_name = ?
      LIMIT 1
    `,
    args: [gig.startAt, gig.bandName, gig.locationName],
  });

  const args = [
    gig.startAt,
    gig.endAt,
    gig.bandName,
    gig.locationName,
    gig.locationAddress,
    gig.googlePlaceId,
    JSON.stringify(gig.artists),
    gig.notes,
    gig.imageUrl,
  ];

  if (existing.rows[0]?.id) {
    await client.execute({
      sql: `
        UPDATE gigs
        SET
          start_at = ?,
          end_at = ?,
          band_name = ?,
          location_name = ?,
          location_address = ?,
          google_place_id = ?,
          artists_json = ?,
          notes = ?,
          image_url = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [...args, existing.rows[0].id],
    });
    return "updated";
  }

  await client.execute({
    sql: `
      INSERT INTO gigs (
        start_at,
        end_at,
        band_name,
        location_name,
        location_address,
        google_place_id,
        artists_json,
        notes,
        image_url,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args,
  });
  return "created";
}

async function main() {
  const pageHtml = await fetchText(EVENTS_URL);
  const { token, listingStartDate, listingEndDate } = parseEventsPage(pageHtml);

  const productions = await fetchJson(PRODUCTIONS_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: EVENTS_URL,
      origin: "https://tickets.nashvillesymphony.org",
      RequestVerificationToken: token,
    },
    body: JSON.stringify({
      startDate: toApiIso(listingStartDate),
      endDate: toApiIso(listingEndDate),
      keywords: [],
      productionSeasonIdFilter: [],
      keywordIds: null,
    }),
  });

  const client = getClient();
  await ensureGigsSchema(client);

  const venueCache = new Map();
  let imagesDownloaded = 0;
  let created = 0;
  let updated = 0;

  for (const production of productions) {
    let venueInfo = venueCache.get(production.productionSeasonActionUrl);
    if (!venueInfo) {
      try {
        const detailHtml = production.productionSeasonActionUrl
          ? await fetchText(production.productionSeasonActionUrl)
          : "";
        venueInfo = parseVenueDetails(detailHtml);
      } catch {
        venueInfo = { venue: DEFAULT_VENUE, address: DEFAULT_ADDRESS };
      }
      venueCache.set(production.productionSeasonActionUrl, venueInfo);
    }

    let imageUrl = "";
    if (production.listingImageUrl) {
      imageUrl = await downloadImage(production.listingImageUrl, production.productionSeasonId);
      imagesDownloaded += 1;
    }

    const artists = extractArtists(production.description, production.productionTitle);
    const sourceUrl = production.productionSeasonActionUrl || "";
    const notes = extractNotes(production.description, sourceUrl);

    for (const performance of production.performances || []) {
      const gig = {
        startAt: toDateTimeLocal(performance.iso8601DateString || performance.performanceDate),
        endAt: "",
        bandName: cleanText(production.productionTitle),
        locationName: cleanText(venueInfo.venue) || DEFAULT_VENUE,
        locationAddress: cleanText(venueInfo.address),
        googlePlaceId: "",
        artists,
        notes,
        imageUrl,
      };

      const result = await upsertGig(client, gig);
      if (result === "created") {
        created += 1;
      } else {
        updated += 1;
      }
    }
  }

  await closeDb();
  console.log(
    JSON.stringify(
      {
        productions: productions.length,
        performances: productions.reduce((sum, production) => sum + (production.performances?.length || 0), 0),
        created,
        updated,
        imagesProcessed: imagesDownloaded,
      },
      null,
      2
    )
  );
}

main().catch(async (error) => {
  console.error(error?.stack || error?.message || String(error));
  try {
    await closeDb();
  } catch {}
  process.exit(1);
});
