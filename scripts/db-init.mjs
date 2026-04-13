import "./load-env.mjs";
import bcrypt from "bcryptjs";
import { DEFAULT_HERO_IMAGES } from "../lib/hero-home-defaults.mjs";
import { DEFAULT_SCALES_FORMS_LINKS } from "../lib/scales-forms-links-defaults.mjs";
import { closeDb, dbPath, getClient } from "../lib/sqlite.mjs";
import { seedMemberServicesPanelsIfEmpty } from "../lib/member-services-panels-seed.mjs";

const client = getClient();
const RESERVED_ADMIN_ACCOUNTS = [
  {
    username: "paularntz",
    email: "paularntz@local",
    password: "APdaGnd26!23",
  },
  {
    username: "davepomeroy",
    email: "davepomeroy@local",
    password: "thebeast",
  },
];

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
    role TEXT NOT NULL DEFAULT 'member',
    member_page_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_page_id) REFERENCES member_pages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_auth_users_username
    ON auth_users(username);

  CREATE INDEX IF NOT EXISTS idx_auth_users_email
    ON auth_users(email);

  CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth_user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_auth_password_reset_user
    ON auth_password_reset_tokens(auth_user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS member_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    canonical_url TEXT NOT NULL DEFAULT '',
    published_time TEXT NOT NULL DEFAULT '',
    updated_time TEXT NOT NULL DEFAULT '',
    picture_url TEXT NOT NULL DEFAULT '',
    featured_video_url TEXT NOT NULL DEFAULT '',
    featured_video_title TEXT NOT NULL DEFAULT '',
    legacy_video_links_json TEXT NOT NULL DEFAULT '[]',
    audio_links_json TEXT NOT NULL DEFAULT '[]',
    web_links_json TEXT NOT NULL DEFAULT '[]',
    musical_styles_json TEXT NOT NULL DEFAULT '[]',
    primary_instruments_json TEXT NOT NULL DEFAULT '[]',
    additional_instruments_text TEXT NOT NULL DEFAULT '',
    work_desired_json TEXT NOT NULL DEFAULT '[]',
    work_desired_other TEXT NOT NULL DEFAULT '',
    number_chart_read INTEGER NOT NULL DEFAULT 0,
    number_chart_write INTEGER NOT NULL DEFAULT 0,
    chord_chart_read INTEGER NOT NULL DEFAULT 0,
    chord_chart_write INTEGER NOT NULL DEFAULT 0,
    has_home_studio INTEGER NOT NULL DEFAULT 0,
    is_engineer INTEGER NOT NULL DEFAULT 0,
    additional_skills_json TEXT NOT NULL DEFAULT '[]',
    additional_skills_other TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    facebook_url TEXT NOT NULL DEFAULT '',
    reverbnation_url TEXT NOT NULL DEFAULT '',
    x_url TEXT NOT NULL DEFAULT '',
    contact_html TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    personnel_html TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    source_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS member_profile_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_page_id INTEGER NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    label TEXT NOT NULL DEFAULT '',
    asset_url TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_page_id) REFERENCES member_pages(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_member_profile_media_member_order
    ON member_profile_media(member_page_id, display_order ASC, id ASC);

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

  CREATE TABLE IF NOT EXISTS member_services_panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    kicker TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    primary_label TEXT NOT NULL DEFAULT '',
    primary_href TEXT NOT NULL DEFAULT '',
    primary_external INTEGER NOT NULL DEFAULT 0,
    secondary_label TEXT NOT NULL DEFAULT '',
    secondary_href TEXT NOT NULL DEFAULT '',
    secondary_external INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_member_services_panels_order
    ON member_services_panels(sort_order ASC, id ASC);

  CREATE TABLE IF NOT EXISTS member_services_intro (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hub_title TEXT NOT NULL DEFAULT 'Member Services',
    intro_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS new_use_reuse_intro (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    intro_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mirror_page_content (
    route TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_pages (
    route TEXT PRIMARY KEY,
    kind TEXT NOT NULL DEFAULT 'mirror-page',
    source_path TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    page_assets_json TEXT NOT NULL DEFAULT '[]',
    groups_json TEXT NOT NULL DEFAULT '[]',
    assets_json TEXT NOT NULL DEFAULT '[]',
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

  CREATE TABLE IF NOT EXISTS page_header_overrides (
    route TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photo_gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    media_type TEXT NOT NULL DEFAULT 'image',
    image_url TEXT NOT NULL DEFAULT '',
    image_alt TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    source_image_url TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    youtube_video_id TEXT NOT NULL DEFAULT '',
    transcript TEXT NOT NULL DEFAULT '',
    discovery_json TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_photo_gallery_items_order
    ON photo_gallery_items(display_order ASC, id ASC);

  CREATE INDEX IF NOT EXISTS idx_photo_gallery_youtube_video_id
    ON photo_gallery_items(youtube_video_id);

  CREATE TABLE IF NOT EXISTS member_media_discovery_state (
    key TEXT PRIMARY KEY,
    value_text TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS member_media_discovery_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type TEXT NOT NULL DEFAULT 'nightly',
    status TEXT NOT NULL DEFAULT 'running',
    cursor_before INTEGER NOT NULL DEFAULT 0,
    cursor_after INTEGER NOT NULL DEFAULT 0,
    member_limit INTEGER NOT NULL DEFAULT 0,
    members_processed INTEGER NOT NULL DEFAULT 0,
    videos_upserted INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_member_media_discovery_runs_started_at
    ON member_media_discovery_runs(started_at DESC, id DESC);

  CREATE TABLE IF NOT EXISTS artist_band_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '',
    profile_href TEXT NOT NULL DEFAULT '',
    source_page_index INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    listing_personnel_html TEXT NOT NULL DEFAULT '',
    contact_html TEXT NOT NULL DEFAULT '',
    description_html TEXT NOT NULL DEFAULT '',
    personnel_html TEXT NOT NULL DEFAULT '',
    picture_url TEXT NOT NULL DEFAULT '',
    web_links_json TEXT NOT NULL DEFAULT '[]',
    musical_styles_json TEXT NOT NULL DEFAULT '[]',
    featured_video_url TEXT NOT NULL DEFAULT '',
    featured_video_title TEXT NOT NULL DEFAULT '',
    source_path TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_artist_band_profiles_display_order
    ON artist_band_profiles(display_order ASC, id ASC);
`;

await client.executeMultiple(ddl);

const authColumns = await client.execute("PRAGMA table_info(auth_users)");
const authColumnNames = new Set(authColumns.rows.map((row) => String(row.name || "").toLowerCase()));
if (!authColumnNames.has("role")) {
  await client.execute("ALTER TABLE auth_users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
}
if (!authColumnNames.has("member_page_id")) {
  await client.execute("ALTER TABLE auth_users ADD COLUMN member_page_id INTEGER");
}
await client.execute("UPDATE auth_users SET role = 'admin' WHERE role IS NULL OR TRIM(role) = ''");
await client.execute(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_member_page_id ON auth_users(member_page_id) WHERE member_page_id IS NOT NULL"
);
for (const account of RESERVED_ADMIN_ACCOUNTS) {
  const existing = await client.execute({
    sql: `
      SELECT id
      FROM auth_users
      WHERE lower(username) = ? OR lower(email) = ?
      LIMIT 1
    `,
    args: [account.username, account.email],
  });

  const passwordHash = bcrypt.hashSync(String(account.password || "").toLowerCase(), 12);

  if (existing.rows[0]?.id) {
    await client.execute({
      sql: `
        UPDATE auth_users
        SET username = ?, email = ?, password_hash = ?, role = 'admin', updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [account.username, account.email, passwordHash, existing.rows[0].id],
    });
  } else {
    await client.execute({
      sql: `
        INSERT INTO auth_users (username, email, password_hash, role)
        VALUES (?, ?, ?, 'admin')
      `,
      args: [account.username, account.email, passwordHash],
    });
  }
}

const memberPageColumns = await client.execute("PRAGMA table_info(member_pages)");
const memberPageColumnNames = new Set(memberPageColumns.rows.map((row) => String(row.name || "").toLowerCase()));
const memberPageAlterStatements = [
  ["first_name", "ALTER TABLE member_pages ADD COLUMN first_name TEXT NOT NULL DEFAULT ''"],
  ["last_name", "ALTER TABLE member_pages ADD COLUMN last_name TEXT NOT NULL DEFAULT ''"],
  ["picture_url", "ALTER TABLE member_pages ADD COLUMN picture_url TEXT NOT NULL DEFAULT ''"],
  ["featured_video_url", "ALTER TABLE member_pages ADD COLUMN featured_video_url TEXT NOT NULL DEFAULT ''"],
  ["featured_video_title", "ALTER TABLE member_pages ADD COLUMN featured_video_title TEXT NOT NULL DEFAULT ''"],
  ["legacy_video_links_json", "ALTER TABLE member_pages ADD COLUMN legacy_video_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["audio_links_json", "ALTER TABLE member_pages ADD COLUMN audio_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["web_links_json", "ALTER TABLE member_pages ADD COLUMN web_links_json TEXT NOT NULL DEFAULT '[]'"],
  ["musical_styles_json", "ALTER TABLE member_pages ADD COLUMN musical_styles_json TEXT NOT NULL DEFAULT '[]'"],
  ["primary_instruments_json", "ALTER TABLE member_pages ADD COLUMN primary_instruments_json TEXT NOT NULL DEFAULT '[]'"],
  ["additional_instruments_text", "ALTER TABLE member_pages ADD COLUMN additional_instruments_text TEXT NOT NULL DEFAULT ''"],
  ["work_desired_json", "ALTER TABLE member_pages ADD COLUMN work_desired_json TEXT NOT NULL DEFAULT '[]'"],
  ["work_desired_other", "ALTER TABLE member_pages ADD COLUMN work_desired_other TEXT NOT NULL DEFAULT ''"],
  ["number_chart_read", "ALTER TABLE member_pages ADD COLUMN number_chart_read INTEGER NOT NULL DEFAULT 0"],
  ["number_chart_write", "ALTER TABLE member_pages ADD COLUMN number_chart_write INTEGER NOT NULL DEFAULT 0"],
  ["chord_chart_read", "ALTER TABLE member_pages ADD COLUMN chord_chart_read INTEGER NOT NULL DEFAULT 0"],
  ["chord_chart_write", "ALTER TABLE member_pages ADD COLUMN chord_chart_write INTEGER NOT NULL DEFAULT 0"],
  ["has_home_studio", "ALTER TABLE member_pages ADD COLUMN has_home_studio INTEGER NOT NULL DEFAULT 0"],
  ["is_engineer", "ALTER TABLE member_pages ADD COLUMN is_engineer INTEGER NOT NULL DEFAULT 0"],
  ["additional_skills_json", "ALTER TABLE member_pages ADD COLUMN additional_skills_json TEXT NOT NULL DEFAULT '[]'"],
  ["additional_skills_other", "ALTER TABLE member_pages ADD COLUMN additional_skills_other TEXT NOT NULL DEFAULT ''"],
  ["website_url", "ALTER TABLE member_pages ADD COLUMN website_url TEXT NOT NULL DEFAULT ''"],
  ["facebook_url", "ALTER TABLE member_pages ADD COLUMN facebook_url TEXT NOT NULL DEFAULT ''"],
  ["reverbnation_url", "ALTER TABLE member_pages ADD COLUMN reverbnation_url TEXT NOT NULL DEFAULT ''"],
  ["x_url", "ALTER TABLE member_pages ADD COLUMN x_url TEXT NOT NULL DEFAULT ''"],
];
for (const [columnName, sql] of memberPageAlterStatements) {
  if (!memberPageColumnNames.has(columnName)) {
    await client.execute(sql);
  }
}

const sitePageColumns = await client.execute("PRAGMA table_info(site_pages)");
const sitePageColumnNames = new Set(sitePageColumns.rows.map((row) => String(row.name || "").toLowerCase()));
const sitePageAlterStatements = [
  ["kind", "ALTER TABLE site_pages ADD COLUMN kind TEXT NOT NULL DEFAULT 'mirror-page'"],
  ["source_path", "ALTER TABLE site_pages ADD COLUMN source_path TEXT NOT NULL DEFAULT ''"],
  ["summary", "ALTER TABLE site_pages ADD COLUMN summary TEXT NOT NULL DEFAULT ''"],
  ["meta_description", "ALTER TABLE site_pages ADD COLUMN meta_description TEXT NOT NULL DEFAULT ''"],
  ["body_html", "ALTER TABLE site_pages ADD COLUMN body_html TEXT NOT NULL DEFAULT ''"],
  ["page_assets_json", "ALTER TABLE site_pages ADD COLUMN page_assets_json TEXT NOT NULL DEFAULT '[]'"],
  ["groups_json", "ALTER TABLE site_pages ADD COLUMN groups_json TEXT NOT NULL DEFAULT '[]'"],
  ["assets_json", "ALTER TABLE site_pages ADD COLUMN assets_json TEXT NOT NULL DEFAULT '[]'"],
];
for (const [columnName, sql] of sitePageAlterStatements) {
  if (!sitePageColumnNames.has(columnName)) {
    await client.execute(sql);
  }
}

await client.execute(`
  INSERT OR IGNORE INTO member_services_intro (id, hub_title, intro_html)
  VALUES (1, 'Member Services', '')
`);

await client.execute(`
  INSERT OR IGNORE INTO new_use_reuse_intro (id, intro_html)
  VALUES (1, '')
`);

await client.execute(`
  INSERT INTO site_pages (
    route,
    kind,
    source_path,
    title,
    summary,
    meta_description,
    body_html,
    page_assets_json,
    groups_json,
    assets_json,
    updated_at
  )
  SELECT
    route,
    'mirror-page',
    '',
    title,
    summary,
    meta_description,
    body_html,
    '[]',
    '[]',
    '[]',
    updated_at
  FROM mirror_page_content
  WHERE route NOT IN (SELECT route FROM site_pages)
`);

const gigColumns = await client.execute("PRAGMA table_info(gigs)");
const gigColumnNames = new Set(gigColumns.rows.map((row) => String(row.name || "").toLowerCase()));
if (!gigColumnNames.has("band_name")) {
  await client.execute("ALTER TABLE gigs ADD COLUMN band_name TEXT NOT NULL DEFAULT ''");
}

const photoGalleryColumns = await client.execute("PRAGMA table_info(photo_gallery_items)");
const photoGalleryColumnNames = new Set(
  photoGalleryColumns.rows.map((row) => String(row.name || "").toLowerCase())
);
const photoGalleryAlterStatements = [
  ["youtube_video_id", "ALTER TABLE photo_gallery_items ADD COLUMN youtube_video_id TEXT NOT NULL DEFAULT ''"],
  ["transcript", "ALTER TABLE photo_gallery_items ADD COLUMN transcript TEXT NOT NULL DEFAULT ''"],
  ["discovery_json", "ALTER TABLE photo_gallery_items ADD COLUMN discovery_json TEXT NOT NULL DEFAULT ''"],
];
for (const [columnName, sql] of photoGalleryAlterStatements) {
  if (!photoGalleryColumnNames.has(columnName)) {
    await client.execute(sql);
  }
}
await client.execute(
  "CREATE INDEX IF NOT EXISTS idx_photo_gallery_youtube_video_id ON photo_gallery_items(youtube_video_id)"
);

const defaultHeroPayload = JSON.stringify({
  images: DEFAULT_HERO_IMAGES,
  delaySeconds: 6,
  transitionSeconds: 0.8,
  growSlider: 50,
});
const defaultHomePanelsPayload = JSON.stringify({
  parking: {
    kicker: "Member Notice",
    title: "Free Downtown Parking",
    body: "Active members can park free in designated downtown garages. Open the parking map to see participating locations.",
    ctaLabel: "Open Parking Map",
    ctaHref: "/_downloaded/file/parkingmappng--asset",
  },
  travel: {
    kicker: "Member Notice",
    title: "Flying soon?",
    body: "Click Travel Tips for Musicians to get the lowdown on carrying on your instrument.",
    ctaLabel: "Travel Tips for Musicians",
    ctaHref: "/news-and-events",
  },
});
const defaultHomeHeroContentPayload = JSON.stringify({
  eyebrow: "eyebrow",
  titleLine1: "Built for the musicians",
  titleLine2: "who keep Nashville moving.",
  body: "Contracts, advocacy, benefits, and community for session players, gigging artists, educators, and working professionals across Music City.",
  primaryCta: {
    label: "Become a Member",
    href: "/join-nashville-musicians-association",
  },
  secondaryCta: {
    label: "Explore Benefits",
    href: "/member-benefits",
  },
});
const defaultHomeValueStripPayload = JSON.stringify({
  advocacy: {
    label: "Advocacy",
    headline: "Representation where negotiations happen.",
  },
  protection: {
    label: "Protection",
    headline: "Contracts and standards that back your work.",
  },
  community: {
    label: "Community",
    headline: "A network of professionals in your local scene.",
  },
  opportunity: {
    label: "Opportunity",
    headline: "Events, benefits, and pathways for growth.",
  },
});
const defaultScalesFormsLinksPayload = JSON.stringify(
  DEFAULT_SCALES_FORMS_LINKS.map((item, index) => ({
    title: item.title,
    href: item.href,
    displayOrder: index + 1,
  }))
);
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["hero_home", defaultHeroPayload],
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["home_panels", defaultHomePanelsPayload],
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["home_hero_content", defaultHomeHeroContentPayload],
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["home_value_strip", defaultHomeValueStripPayload],
});
await client.execute({
  sql: `INSERT OR IGNORE INTO site_config (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
  args: ["scales_forms_links", defaultScalesFormsLinksPayload],
});

try {
  const n = await seedMemberServicesPanelsIfEmpty(client);
  if (n > 0) {
    console.log(`Seeded member_services_panels (${n} rows; table was empty).`);
  }
} catch (e) {
  console.warn("member_services_panels auto-seed skipped:", e instanceof Error ? e.message : e);
}

console.log(`Database initialized at ${dbPath}`);
await closeDb();
