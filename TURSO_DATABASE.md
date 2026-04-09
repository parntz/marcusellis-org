# Database: Turso only

This app uses **Turso** (LibSQL) for **development and production**. There is no local SQLite database, no `file:` database URL, no `better-sqlite3`, and no other database driver.

## Environment

- **`TURSO_DATABASE_URL`** — required. Must be a **`libsql://…`** URL from the Turso dashboard (not `file:`).
- **`TURSO_AUTH_TOKEN`** — required for remote access (or **`LIBSQL_AUTH_TOKEN`** as an alias for the same Turso token).

`lib/sqlite.mjs` rejects non-`libsql:` URLs so only Turso is used.

## Commands

- `npm run db:init` — create/ensure schema on Turso.
- `npm run db:seed` — sample data (e.g. member inquiries).
- `npm run db:sync:news-events` — ingest news/event links into `news_events_items`.
- `npm run db:sync:news-pages` — sync news/event page bodies into `news_event_pages`.
- `npm run db:sync:mirror-pages` — sync catch-all mirror pages into `mirror_page_content`.
- `npm run db:upsert:mirror-page -- /path` — upsert one route from `site-data.generated.js` (e.g. recover `/general-jackson-show`).
- `npm run db:prepare` — init + news syncs + mirror sync (used by `predev` when tables are missing).

## Code

All DB access goes through **`getClient()`** in **`lib/sqlite.mjs`** (`@libsql/client`).
