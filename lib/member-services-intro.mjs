import { getClient } from "./sqlite.mjs";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";
import {
  getMemberServicesIntroDisplayHtml,
  getMemberServicesSourceFromPageBody,
  MEMBER_SERVICES_DEFAULT_HUB_TITLE,
  MEMBER_SERVICES_DEFAULT_INTRO_HTML,
  MEMBER_SERVICES_DEFAULT_TAGLINE_HTML,
  MEMBER_SERVICES_ROUTE,
} from "./member-services-html.mjs";

function isMissingTableError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /no such table:\s*member_services_intro/i.test(message);
}

async function ensureMemberServicesIntroTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS member_services_intro (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hub_title TEXT NOT NULL DEFAULT 'Member Services',
      intro_html TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    INSERT OR IGNORE INTO member_services_intro (id, hub_title, intro_html)
    VALUES (1, 'Member Services', '')
  `);
}

function sanitizeHubTitle(raw) {
  const s = String(raw ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
  return s || MEMBER_SERVICES_DEFAULT_HUB_TITLE;
}

async function readIntroRow(client) {
  let rs;
  try {
    rs = await client.execute({
      sql: `SELECT hub_title AS hubTitle, intro_html AS introHtml FROM member_services_intro WHERE id = 1 LIMIT 1`,
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
    return null;
  }
  const row = rs.rows?.[0];
  if (!row) return null;
  return {
    hubTitle: String(row.hubTitle ?? "").trim() || MEMBER_SERVICES_DEFAULT_HUB_TITLE,
    introHtml: String(row.introHtml ?? ""),
  };
}

async function loadLegacySitePageBodyHtml(client) {
  const rs = await client.execute({
    sql: `SELECT body_html AS bodyHtml FROM site_pages WHERE route = ? LIMIT 1`,
    args: [MEMBER_SERVICES_ROUTE],
  });
  return String(rs.rows?.[0]?.bodyHtml ?? "").trim();
}

/**
 * Effective intro HTML: stored row, else legacy site_pages fragment prefixed with tagline, else full default.
 */
async function resolveIntroHtmlSource(client, storedIntroHtml) {
  if (String(storedIntroHtml || "").trim()) {
    return getMemberServicesSourceFromPageBody(storedIntroHtml);
  }
  const legacy = await loadLegacySitePageBodyHtml(client);
  if (!legacy) {
    return MEMBER_SERVICES_DEFAULT_INTRO_HTML;
  }
  const legacyDisplay = getMemberServicesIntroDisplayHtml(legacy);
  if (!legacyDisplay.trim()) {
    return MEMBER_SERVICES_DEFAULT_INTRO_HTML;
  }
  return `${MEMBER_SERVICES_DEFAULT_TAGLINE_HTML}\n${legacyDisplay}`.trim();
}

function displayIntroHtml(sourceHtml) {
  const cleaned = getMemberServicesIntroDisplayHtml(sourceHtml);
  return cleaned.trim() ? cleaned : getMemberServicesIntroDisplayHtml(MEMBER_SERVICES_DEFAULT_INTRO_HTML);
}

/** Public + server render. */
export async function getMemberServicesIntroForPage() {
  const client = getClient();
  const row = await readIntroRow(client);
  const hubTitle = row?.hubTitle || MEMBER_SERVICES_DEFAULT_HUB_TITLE;
  const source = await resolveIntroHtmlSource(client, row?.introHtml ?? "");
  return {
    hubTitle,
    introHtml: displayIntroHtml(source),
  };
}

/** Admin editor payloads (GET / save response). */
export async function getMemberServicesIntroForAdmin() {
  const client = getClient();
  const row = await readIntroRow(client);
  const hubTitle = row?.hubTitle || MEMBER_SERVICES_DEFAULT_HUB_TITLE;
  const introHtml = await resolveIntroHtmlSource(client, row?.introHtml ?? "");
  return { hubTitle, introHtml };
}

/**
 * @param {{ hubTitle?: string, introHtml?: string }} patch
 */
export async function updateMemberServicesIntro(patch) {
  if (patch.hubTitle === undefined && patch.introHtml === undefined) {
    throw new Error("Nothing to update.");
  }
  const client = getClient();
  let row = await readIntroRow(client);
  if (!row) {
    await ensureMemberServicesIntroTable(client);
    row = await readIntroRow(client);
  }
  let nextTitle = row?.hubTitle || MEMBER_SERVICES_DEFAULT_HUB_TITLE;
  let nextHtml = String(row?.introHtml ?? "");

  if (patch.hubTitle !== undefined) {
    nextTitle = sanitizeHubTitle(patch.hubTitle);
  }
  if (patch.introHtml !== undefined) {
    nextHtml = stripImgTagsFromHtml(patch.introHtml);
  }

  await client.execute({
    sql: `INSERT INTO member_services_intro (id, hub_title, intro_html, updated_at)
          VALUES (1, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            hub_title = excluded.hub_title,
            intro_html = excluded.intro_html,
            updated_at = datetime('now')`,
    args: [nextTitle, nextHtml],
  });

  return getMemberServicesIntroForAdmin();
}
