import { getClient } from "./sqlite.mjs";
import { buildMagazineArchiveConfig } from "./magazine-archive.mjs";

const KEY = "magazine_archive_content";

export async function getMagazineArchiveConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return buildMagazineArchiveConfig();

  try {
    return buildMagazineArchiveConfig(JSON.parse(raw));
  } catch {
    return buildMagazineArchiveConfig();
  }
}

export async function setMagazineArchiveConfig(input) {
  const client = getClient();
  const normalized = buildMagazineArchiveConfig(input);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [KEY, JSON.stringify(normalized)],
  });
  return normalized;
}
