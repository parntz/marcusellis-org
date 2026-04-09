/**
 * One-time / maintenance: strip legacy full-page scrapes and bogus searchable blobs
 * from member_pages while keeping table shape and rows. Run against Turso, then
 * `npm run db:sync:member-pages` to repopulate from HTML using fixed extractors.
 *
 * DRY_RUN=1 — log only, no writes.
 */
import "./load-env.mjs";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const dry = process.env.DRY_RUN === "1";
const client = getClient();

function titleFromUsersPath(url) {
  const m = String(url || "").match(/\/users\/([^/?#]+)\/?$/i);
  if (!m) return "";
  return decodeURIComponent(m[1])
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function titleFromSlug(slug) {
  const s = String(slug || "").trim();
  if (!s || /^\d+$/.test(s)) return "";
  return decodeURIComponent(s)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isGarbageTitle(t) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (/^member profile$/i.test(s)) return true;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s)) return true;
  return false;
}

function deriveTitle(row) {
  return titleFromUsersPath(row.canonical_url) || titleFromSlug(row.slug) || "";
}

const garbageFragment = (col) =>
  `${col} LIKE '%select.gif%' OR ${col} LIKE '%deselect.gif%' OR ${col} LIKE '%member-profile-%' OR ${col} LIKE '%view-user-content%' OR ${col} LIKE '%panels-flexible%' OR ${col} LIKE '%form_build_id%' OR ${col} LIKE '%Drupal.settings%'`;

async function countWhere(sql, args = []) {
  const { rows } = await client.execute({ sql, args });
  return Number(rows?.[0]?.c ?? 0);
}

console.log(`db-clean-member-pages → Turso ${dbPath}${dry ? " (DRY_RUN)" : ""}`);

/** Legacy sync walked all *--asset files; drop rows not sourced from a user/ profile HTML path. */
const nNonUserSource = await countWhere(
  `SELECT COUNT(*) AS c FROM member_pages WHERE source_path NOT LIKE '%/user/%'`,
);

const nBody = await countWhere(
  `SELECT COUNT(*) AS c FROM member_pages WHERE LENGTH(TRIM(body_html)) > 0`,
);
const nDescGarbage = await countWhere(
  `SELECT COUNT(*) AS c FROM member_pages WHERE (${garbageFragment("description_html")})`,
);
const nPersonnelGarbage = await countWhere(
  `SELECT COUNT(*) AS c FROM member_pages WHERE (${garbageFragment("personnel_html")})`,
);

const { rows: titleRows } = await client.execute(
  `SELECT slug, title, canonical_url FROM member_pages`,
);
const titleFixes = titleRows.filter((r) => isGarbageTitle(r.title) && deriveTitle(r));

console.log(
  JSON.stringify(
    {
      rowsNotFromUserHtmlPath: nNonUserSource,
      rowsWithBodyHtml: nBody,
      rowsWithGarbageDescription: nDescGarbage,
      rowsWithGarbagePersonnel: nPersonnelGarbage,
      titleRowsToFix: titleFixes.length,
    },
    null,
    2,
  ),
);

if (dry) {
  await closeDb();
  process.exit(0);
}

await client.execute(`DELETE FROM member_pages WHERE source_path NOT LIKE '%/user/%'`);

await client.execute(
  `UPDATE member_pages SET body_html = '' WHERE LENGTH(TRIM(body_html)) > 0`,
);
await client.execute(
  `UPDATE member_pages SET description_html = '' WHERE ${garbageFragment("description_html")}`,
);
await client.execute(
  `UPDATE member_pages SET personnel_html = '' WHERE ${garbageFragment("personnel_html")}`,
);

for (const row of titleFixes) {
  const next = deriveTitle(row);
  if (!next) continue;
  await client.execute({
    sql: `UPDATE member_pages SET title = ? WHERE slug = ?`,
    args: [next, row.slug],
  });
}

console.log(
  "Done: removed rows whose source_path is not under user/, cleared body_html, scrubbed garbage description/personnel, fixed generic/email titles where a /users/ slug or path slug was available.",
);
console.log("Next: npm run db:sync:member-pages");
await closeDb();
