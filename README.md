# AFM 257 Site

This site is a Next.js app for Nashville Musicians Association / AFM 257.

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
  Creates required Turso tables (including gigs, mirror pages, news/event tables, sidebar tables, etc.).

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
  Imports Nashville Symphony events as gigs, downloads listing images into `public/uploads/gigs`, and upserts gigs in Turso.

  The importer:
  - fetches current listings from `tickets.nashvillesymphony.org`
  - downloads production images
  - inserts/updates future performances
  - avoids duplicates by matching date/time + band + venue

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
- Database scripts target Turso via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
