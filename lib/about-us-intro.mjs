import { getClient } from "./sqlite.mjs";

const DEFAULT_INTRO =
  "Northstar Atelier is a fictional creative studio used as a placeholder for layout, editorial, and admin tooling. The team blends strategy, production, research, and guest collaboration across imagined client work, internal experiments, and prototype launches. This page exists to demonstrate how a long-form organization profile can read when the content is completely fabricated, lightweight, and easy to replace later.";

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS about_us_intro (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      body TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export async function getAboutUsIntro() {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `SELECT body FROM about_us_intro WHERE id = 1 LIMIT 1`,
    });
    const body = String(rs.rows?.[0]?.body ?? "").trim();
    return body || DEFAULT_INTRO;
  } catch {
    return DEFAULT_INTRO;
  }
}

export async function updateAboutUsIntro(body) {
  const text = String(body ?? "").trim();
  const client = getClient();
  try {
    await client.execute({
      sql: `INSERT INTO about_us_intro (id, body, updated_at)
            VALUES (1, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              body = excluded.body,
              updated_at = datetime('now')`,
      args: [text],
    });
  } catch {
    await ensureTable(client);
    await client.execute({
      sql: `INSERT OR REPLACE INTO about_us_intro (id, body, updated_at) VALUES (1, ?, datetime('now'))`,
      args: [text],
    });
  }
  return getAboutUsIntro();
}
