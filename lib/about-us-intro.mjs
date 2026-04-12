import { getClient } from "./sqlite.mjs";

const DEFAULT_INTRO =
  "The Nashville Musicians Association, AFM Local 257, was founded in 1902. Our mission is to promote respect for musicians, the work they do, and the intellectual property they create, in a constantly evolving business environment. We represent studio musicians, touring bands, symphonic musicians, vocalists, arrangers, composers, contractors, and more. We negotiate and administer contracts, track additional uses of songs recorded under AFM union contracts, and represent musicians in all genres of music from jazz to rock, pop, bluegrass, gospel, and yes, country music. Our members range from music icons such as Vince Gill and Taylor Swift, to young bands working their way up the ladder of success, and everything in between. Let us show you what we can do for you! Call us M-F 9 a.m. to 4 p.m. at 615-244-9514.";

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
