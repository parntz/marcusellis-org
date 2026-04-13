# Database: Local SQLite

This app now defaults to **local SQLite** for repo-backed development and migration work. The current runtime database file is `data/site.db` unless `SQLITE_DATABASE_PATH` overrides it.

## Environment

- **`SQLITE_DATABASE_PATH`** — optional. Relative path to the local SQLite file. Defaults to `data/site.db`.
- **`DATABASE_URL`** — optional. Override URL for advanced cases. If omitted, the app uses the local SQLite file URL derived from `SQLITE_DATABASE_PATH`.
- **`TURSO_DATABASE_URL`** — migration-only remote source URL used by `npm run db:copy:remote`.
- **`TURSO_AUTH_TOKEN`** — migration-only remote source token used by `npm run db:copy:remote`.

`lib/sqlite.mjs` now prefers local SQLite and only uses a remote URL if `DATABASE_URL` explicitly points to one.

## Commands

- `npm run db:init` — create/ensure schema in local SQLite.
- `npm run db:copy:remote -- --overwrite` — copy the current remote source database into local SQLite.
- `npm run db:seed` — sample data (e.g. member inquiries).
- `npm run db:sync:news-events` — ingest news/event links into `news_events_items`.
- `npm run db:sync:news-pages` — sync news/event page bodies into `news_event_pages`.
- `npm run db:sync:mirror-pages` — sync catch-all mirror pages into `mirror_page_content`.
- `npm run db:upsert:mirror-page -- /path` — upsert one route from `site-data.generated.js` (e.g. recover `/general-jackson-show`).
- `npm run db:prepare` — init + news syncs + mirror sync (used by `predev` when tables are missing).

## Code

All DB access goes through **`getClient()`** in **`lib/sqlite.mjs`** (`@libsql/client`).
