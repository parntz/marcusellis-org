# Phase 1: SQLite Migration

## Objective

Decouple this repo from the live remote database by creating a local SQLite copy and switching the app runtime to use that local database by default.

## What Changed

- `lib/sqlite.mjs` now defaults to a repo-local SQLite file at `data/site.db`.
- The runtime still uses `@libsql/client`, which preserves the existing `client.execute(...)` calling pattern.
- A new snapshot command, `npm run db:copy:remote -- --overwrite`, copies the current remote source database into local SQLite.
- `db:init` and `predev` now work against the local SQLite database.

## Current Runtime Defaults

- default DB file: `data/site.db`
- override file path: `SQLITE_DATABASE_PATH`
- optional explicit URL override: `DATABASE_URL`

## Remote Snapshot Inputs

The snapshot script currently reads:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

These are migration-time inputs only. They are no longer required for normal local runtime.

## Verification Completed

- local DB adapter opens and executes SQL successfully
- `npm run db:init` succeeds against local SQLite
- remote database snapshot completed into `data/site.db`
- `npm run predev` succeeds against the copied local database

## Data Snapshot Notes

The copied local database includes, at minimum, these validated tables with live data:

- `auth_users`
- `member_pages`
- `site_pages`
- `photo_gallery_items`
- `gigs`

The snapshot also copied the wider site content/config tables used by the current site implementation.

## Known Follow-Up Work

- remove remaining Turso-specific wording from scripts, docs, and comments
- verify the full app runtime against local SQLite under `npm run dev`
- audit SQL compatibility assumptions between remote LibSQL and local SQLite
- decide whether to keep `DATABASE_URL` remote support after migration is complete or make local SQLite the only supported runtime path
- document backup/refresh procedure for replacing `data/site.db` from the remote source
