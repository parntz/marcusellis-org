import "./load-env.mjs";
import { closeDb, getClient } from "../lib/sqlite.mjs";
import {
  DEFAULT_RECORDING_SIDEBAR_BOXES,
  RECORDING_SIDEBAR_FAMILY,
  replaceSidebarBoxesForPage,
} from "../lib/site-config-sidebar.mjs";

const client = getClient();

await client.executeMultiple(`
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
`);

await replaceSidebarBoxesForPage("/recording", RECORDING_SIDEBAR_FAMILY, DEFAULT_RECORDING_SIDEBAR_BOXES);

console.log("Seeded /recording sidebar box set in Turso.");
await closeDb();
