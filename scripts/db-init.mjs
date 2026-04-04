import "./load-env.mjs";
import { DEFAULT_HERO_IMAGES } from "../lib/hero-home-defaults.mjs";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";

const client = getClient();

const ddl = `
  CREATE TABLE IF NOT EXISTS member_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_member_inquiries_created_at
    ON member_inquiries(created_at DESC);

  CREATE TABLE IF NOT EXISTS news_events_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    href TEXT NOT NULL,
    title TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'other',
    summary TEXT NOT NULL DEFAULT '',
    badge_month TEXT NOT NULL DEFAULT '',
    badge_day TEXT NOT NULL DEFAULT '',
    event_date_text TEXT NOT NULL DEFAULT '',
    source_route TEXT NOT NULL DEFAULT '/news-and-events',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(href, title, source_route)
  );

  CREATE INDEX IF NOT EXISTS idx_news_events_items_source_order
    ON news_events_items(source_route, display_order ASC);

  CREATE TABLE IF NOT EXISTS auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_auth_users_username
    ON auth_users(username);

  CREATE INDEX IF NOT EXISTS idx_auth_users_email
    ON auth_users(email);

  CREATE TABLE IF NOT EXISTS member_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    canonical_url TEXT NOT NULL DEFAULT '',
    published_time TEXT NOT NULL DEFAULT '',
    updated_time TEXT NOT NULL DEFAULT '',
    contact_html TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    personnel_html TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    source_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

await client.executeMultiple(ddl);

const defaultHeroPayload = JSON.stringify({
  images: DEFAULT_HERO_IMAGES,
  delaySeconds: 6,
  transitionSeconds: 0.8,
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["hero_home", defaultHeroPayload],
});

console.log(`Database initialized at ${dbPath}`);
await closeDb();
