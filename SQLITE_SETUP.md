# SQLite Setup

This project now includes SQLite via `better-sqlite3`.

## Commands

- `npm run db:init` - creates the local database and schema.
- `npm run db:seed` - inserts a small sample dataset into `member_inquiries`.
- `npm run db:sync:news-events` - stores all linked items from `/news-and-events` into SQLite.

## Database file

- Default path: `data/app.db`
- Override with env var: `SQLITE_DB_PATH=/absolute/or/relative/path.db`

## Included helper modules

- `lib/sqlite.mjs`
  - `getDb()` - opens a singleton SQLite connection.
  - `closeDb()` - closes connection (used by scripts).
  - `dbPath` - resolved database path.
- `lib/member-inquiries.js`
  - `createMemberInquiry({ name, email, topic, message })`
  - `listMemberInquiries(limit)`
- `lib/news-events-items.js`
  - `listNewsEventsItems(limit, sourceRoute?)`

## News & Events ingestion

`db:sync:news-events` reads `content/generated/site-data.generated.js`, finds `/news-and-events`,
extracts event/news links from page HTML, and upserts them into:

- table: `news_events_items`
- columns:
  - `href`
  - `title`
  - `item_type` (`event`, `news`, `other`)
  - `summary`
  - `source_route`
  - `display_order`

## Note for static export

This site is configured with `output: "export"`, so SQLite is intended for local scripts/build-time/server-only usage (not client-side direct access).
