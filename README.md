# Marcus Ellis

Personal website for Marcus Ellis - businessman, medical researcher, national cancer coach, nutritional coach, and health resources advocate.

## Command-Line Reference

### Day-to-day app commands

- `npm run dev`  
  Starts the local dev server.

- `npm run dev:turbo`  
  Starts the local dev server with Turbopack.

- `npm run build`  
  Builds a production bundle.

- `npm run start`  
  Runs the built app in production mode.

- `npm run lint`  
  Runs ESLint across the project.

### Content generation and build prep

- `npm run generate:content`  
  Regenerates `content/generated/site-data.generated.js` from the `HTML-version` mirror content.

- `npm run predev`  
  Pre-dev bootstrap used before `dev`.  
  It conditionally runs content generation and DB prep if required.

  - Force a full refresh:
    - `PREDEV_FULL=true npm run predev`

- `npm run prebuild`  
  Pre-build bootstrap used before `build`.  
  Generates content from `HTML-version` when present, then runs DB prep.

### Database setup and sync scripts

- `npm run db:init`  
  Creates required local SQLite tables (including gigs, mirror pages, news/event tables, sidebar tables, etc.).

- `npm run db:copy:remote -- --overwrite`  
  Copies the current remote source database into the local SQLite file used by this repo.

- `npm run db:prepare`  
  Runs the standard bootstrap chain:
  1. `db:init`
  2. `db:sync:news-events`
  3. `db:sync:news-pages`
  4. `db:sync:mirror-pages`

- `npm run db:sync:news-events`  
  Syncs News & Events listing cards/items into `news_events_items`.

- `npm run db:sync:news-pages`  
  Syncs News/Event detail pages into `news_event_pages`.

- `npm run db:sync:mirror-pages`  
  Syncs catch-all mirror pages (except routes with dedicated tables) into `mirror_page_content`.

- `npm run db:sync:member-pages`  
  Scans downloaded asset data and syncs member profile pages into `member_pages`.

- `npm run db:upsert:mirror-page -- /route-name`  
  Upserts one mirror page route from generated site data into `mirror_page_content`.

  Example:
  - `npm run db:upsert:mirror-page -- /general-jackson-show`

- `npm run db:seed`  
  Seeds sample records for member inquiries and header callouts.

- `npm run db:seed:sidebar`  
  Seeds default recording/news sidebar box sets.

### Gig import command

- `npm run gigs:import:nso`  
  Imports Nashville Symphony events as gigs, downloads listing images into `public/uploads/gigs`, and upserts gigs in the local database.

  The importer:
  - fetches current listings from `tickets.nashvillesymphony.org`
  - downloads production images
  - inserts/updates future performances
  - avoids duplicates by matching date/time + band + venue

### Member media discovery

- `npm run media:discover`  
  Runs the YouTube member-media discovery job against `member_pages` and upserts discovered videos into `photo_gallery_items`.

  Optional flags:
  - `npm run media:discover -- --limit 10`
  - `npm run media:discover -- --max-results-per-member 5`

### Additional direct script (not in `package.json` scripts)

- `node scripts/upsert-auth-user.mjs <username> <email> <password> [previousUsername] [previousEmail]`  
  Creates or updates an auth user in `auth_users`.

  Examples:
  - Create:
    - `node scripts/upsert-auth-user.mjs admin admin@example.com supersecret`
  - Rename/update existing user:
    - `node scripts/upsert-auth-user.mjs newadmin admin@example.com supersecret oldadmin old@example.com`

## Notes

- Scripts rely on environment variables from `.env` / `.env.local` (loaded by `scripts/load-env.mjs`).
- The default app database is local SQLite at `data/site.db`.
- Set `SQLITE_DATABASE_PATH` to change the local DB file location.
- `npm run db:copy:remote -- --overwrite` snapshots the current remote source DB into local SQLite.
- Remote snapshotting still reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from `.env.local` today; those are migration-time inputs, not the default runtime DB.

## Netlify member media discovery

This repo now includes Netlify functions for nightly YouTube discovery:

- scheduled: `netlify/functions/nightly-member-media-discovery.mjs`
- manual: `netlify/functions/manual-member-media-discovery.mjs`

Required env:

- `YOUTUBE_API_KEY`
- local SQLite access via the repo DB file
- `MEMBER_MEDIA_DISCOVERY_MANUAL_TOKEN` for the manual HTTP trigger

Optional env:

- `MEMBER_MEDIA_DISCOVERY_MEMBER_LIMIT` default `25`
- `MEMBER_MEDIA_DISCOVERY_MAX_RESULTS_PER_MEMBER` default `10`
- `MEMBER_MEDIA_DISCOVERY_QUERY_SUFFIX`

Nightly behavior:

- runs as a Netlify scheduled function
- reads members from `member_pages`
- writes discovered videos into `photo_gallery_items`
- stores cursor/run state in `member_media_discovery_state` and `member_media_discovery_runs`
- rotates through members using the stored cursor so the nightly cap advances over time
