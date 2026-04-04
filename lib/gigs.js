import { getClient } from "./sqlite.mjs";

const GIGS_TIME_ZONE = "America/Chicago";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeDateTimeLocal(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  const normalized = raw.slice(0, 16);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeArtists(input) {
  if (Array.isArray(input)) {
    return input.map((item) => cleanText(item)).filter(Boolean).slice(0, 24);
  }

  return String(input || "")
    .split(/\r?\n|,/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 24);
}

function parseLocalDateTime(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function weekdayIndex(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatTime(hour, minute) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatDateParts(parts) {
  return `${WEEKDAYS[weekdayIndex(parts.year, parts.month, parts.day)]}, ${MONTHS[parts.month - 1]} ${parts.day}`;
}

export function formatGigDateRange(startAt, endAt = "") {
  const start = parseLocalDateTime(startAt);
  if (!start) return "";

  const end = parseLocalDateTime(endAt);
  if (!end) {
    return `${formatDateParts(start)} at ${formatTime(start.hour, start.minute)}`;
  }

  const sameDay =
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day;

  if (sameDay) {
    return `${formatDateParts(start)} · ${formatTime(start.hour, start.minute)} - ${formatTime(
      end.hour,
      end.minute
    )}`;
  }

  return `${formatDateParts(start)} at ${formatTime(start.hour, start.minute)} - ${formatDateParts(
    end
  )} at ${formatTime(end.hour, end.minute)}`;
}

function currentLocalDateTimeValue(timeZone = GIGS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function buildGigMapHref({ locationName = "", locationAddress = "", googlePlaceId = "" }) {
  const query = [cleanText(locationName), cleanText(locationAddress)].filter(Boolean).join(" ");
  if (!query && !googlePlaceId) return "";

  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query || googlePlaceId);
  if (googlePlaceId) {
    url.searchParams.set("query_place_id", cleanText(googlePlaceId));
  }
  return url.toString();
}

export function normalizeGigPayload(input = {}) {
  const artists = normalizeArtists(input.artists ?? input.artistsText);
  const startAt = normalizeDateTimeLocal(input.startAt);
  const endAt = normalizeDateTimeLocal(input.endAt);

  return {
    startAt,
    endAt,
    locationName: cleanText(input.locationName),
    locationAddress: cleanText(input.locationAddress),
    googlePlaceId: cleanText(input.googlePlaceId),
    artists,
    notes: cleanText(input.notes),
    imageUrl: cleanText(input.imageUrl),
  };
}

export function validateGigPayload(input = {}) {
  const payload = normalizeGigPayload(input);

  if (!payload.startAt) {
    throw new Error("Start date and time are required.");
  }
  if (!payload.locationName) {
    throw new Error("Gig location is required.");
  }
  if (!payload.artists.length) {
    throw new Error("At least one gig artist is required.");
  }
  if (payload.endAt && payload.endAt < payload.startAt) {
    throw new Error("End date must be after the start date.");
  }

  return payload;
}

function parseArtistsJson(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return normalizeArtists(parsed);
  } catch {
    return [];
  }
}

function mapGigRow(row) {
  const gig = {
    id: Number(row.id),
    startAt: cleanText(row.start_at),
    endAt: cleanText(row.end_at),
    locationName: cleanText(row.location_name),
    locationAddress: cleanText(row.location_address),
    googlePlaceId: cleanText(row.google_place_id),
    artists: parseArtistsJson(row.artists_json),
    notes: cleanText(row.notes),
    imageUrl: cleanText(row.image_url),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };

  return {
    ...gig,
    mapHref: buildGigMapHref(gig),
    dateLabel: formatGigDateRange(gig.startAt, gig.endAt),
    artistsText: gig.artists.join("\n"),
  };
}

async function listGigsBySql(sql, args = []) {
  const client = getClient();
  const rs = await client.execute({ sql, args });
  return rs.rows.map(mapGigRow);
}

export async function listUpcomingGigs(limit = 100) {
  const nowLocal = currentLocalDateTimeValue();
  return listGigsBySql(
    `
      SELECT
        id,
        start_at,
        end_at,
        location_name,
        location_address,
        google_place_id,
        artists_json,
        notes,
        image_url,
        created_at,
        updated_at
      FROM gigs
      WHERE COALESCE(NULLIF(end_at, ''), start_at) >= ?
      ORDER BY start_at ASC, id ASC
      LIMIT ?
    `,
    [nowLocal, limit]
  );
}

export async function listAllGigs(limit = 250) {
  return listGigsBySql(
    `
      SELECT
        id,
        start_at,
        end_at,
        location_name,
        location_address,
        google_place_id,
        artists_json,
        notes,
        image_url,
        created_at,
        updated_at
      FROM gigs
      ORDER BY start_at ASC, id ASC
      LIMIT ?
    `,
    [limit]
  );
}

export async function getGigById(id) {
  const gigs = await listGigsBySql(
    `
      SELECT
        id,
        start_at,
        end_at,
        location_name,
        location_address,
        google_place_id,
        artists_json,
        notes,
        image_url,
        created_at,
        updated_at
      FROM gigs
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
  return gigs[0] || null;
}

export async function createGig(input) {
  const payload = validateGigPayload(input);
  const client = getClient();
  const rs = await client.execute({
    sql: `
      INSERT INTO gigs (
        start_at,
        end_at,
        location_name,
        location_address,
        google_place_id,
        artists_json,
        notes,
        image_url,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      payload.startAt,
      payload.endAt,
      payload.locationName,
      payload.locationAddress,
      payload.googlePlaceId,
      JSON.stringify(payload.artists),
      payload.notes,
      payload.imageUrl,
    ],
  });

  return getGigById(Number(rs.lastInsertRowid));
}

export async function updateGig(id, input) {
  const payload = validateGigPayload(input);
  const client = getClient();
  await client.execute({
    sql: `
      UPDATE gigs
      SET
        start_at = ?,
        end_at = ?,
        location_name = ?,
        location_address = ?,
        google_place_id = ?,
        artists_json = ?,
        notes = ?,
        image_url = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      payload.startAt,
      payload.endAt,
      payload.locationName,
      payload.locationAddress,
      payload.googlePlaceId,
      JSON.stringify(payload.artists),
      payload.notes,
      payload.imageUrl,
      id,
    ],
  });

  return getGigById(id);
}

export async function deleteGig(id) {
  const client = getClient();
  await client.execute({
    sql: `DELETE FROM gigs WHERE id = ?`,
    args: [id],
  });
}

export { GIGS_TIME_ZONE };
