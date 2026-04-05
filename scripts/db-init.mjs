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

  CREATE TABLE IF NOT EXISTS news_event_pages (
    route TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

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

  CREATE TABLE IF NOT EXISTS site_callouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    cta_label TEXT NOT NULL,
    cta_href TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'header',
    is_active INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sidebar_box_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_key TEXT NOT NULL,
    page_route TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sidebar_box_sets_family
    ON sidebar_box_sets(family_key);

  CREATE TABLE IF NOT EXISTS sidebar_boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (set_id) REFERENCES sidebar_box_sets(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sidebar_boxes_set_order
    ON sidebar_boxes(set_id, sort_order ASC);

  CREATE TABLE IF NOT EXISTS mirror_page_content (
    route TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL DEFAULT '',
    band_name TEXT NOT NULL DEFAULT '',
    location_name TEXT NOT NULL,
    location_address TEXT NOT NULL DEFAULT '',
    google_place_id TEXT NOT NULL DEFAULT '',
    artists_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_gigs_start_at
    ON gigs(start_at ASC);

  CREATE TABLE IF NOT EXISTS member_site_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    href TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_member_site_links_display_order
    ON member_site_links(display_order ASC, id ASC);
`;

await client.executeMultiple(ddl);

const gigColumns = await client.execute("PRAGMA table_info(gigs)");
const gigColumnNames = new Set(gigColumns.rows.map((row) => String(row.name || "").toLowerCase()));
if (!gigColumnNames.has("band_name")) {
  await client.execute("ALTER TABLE gigs ADD COLUMN band_name TEXT NOT NULL DEFAULT ''");
}

const defaultHeroPayload = JSON.stringify({
  images: DEFAULT_HERO_IMAGES,
  delaySeconds: 6,
  transitionSeconds: 0.8,
  growSlider: 50,
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["hero_home", defaultHeroPayload],
});

console.log(`Database initialized at ${dbPath}`);
await closeDb();
