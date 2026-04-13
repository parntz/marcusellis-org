import { getClient } from "./sqlite.mjs";

const DEFAULT_STAFF = [
  { role: "Studio Director", names: "Maren Vale" },
  { role: "Operations Lead", names: "Silas Mercer" },
  {
    role: "Creative Council",
    names: "Iris Calder\nNoel Wick\nTamsin Rowe\nBram Huxley\nPia Solano\nJules Fenwick",
  },
  { role: "Client Services", names: "Lena Hartwell" },
  { role: "Office Manager", names: "Theo March" },
  { role: "Front Desk", names: "Cleo Winters" },
  {
    role: "Review Panel",
    names: "Daphne Quill\nOren Pike\nMila Serrin\nEzra Bloom\nNadia Sloane\nReed Holloway",
  },
  { role: "Advisors", names: "Ronan Vale\nMae Ellison" },
  {
    role: "Production Team",
    names: "Juniper Pike\nCal Ward\nSera Monroe\nKeaton Vale\nNico Arden",
  },
  { role: "Field Team", names: "Avery Hale" },
  { role: "Community Desk", names: "Elm Street Annex - Rowan Beck" },
];

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS about_us_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT '',
      names TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function mapRow(row) {
  return {
    id: Number(row.id),
    sortOrder: Number(row.sort_order ?? 0),
    role: String(row.role ?? ""),
    names: String(row.names ?? ""),
  };
}

function normalizeItem(raw, index) {
  const item = raw && typeof raw === "object" ? raw : {};
  return {
    sortOrder: index,
    role: String(item.role ?? "").trim(),
    names: String(item.names ?? "").trim(),
  };
}

export function getDefaultAboutUsStaff() {
  return DEFAULT_STAFF.map((item, i) => ({ id: -(i + 1), sortOrder: i, ...item }));
}

export async function listAboutUsStaff() {
  try {
    const client = getClient();
    const rs = await client.execute({
      sql: `SELECT id, sort_order, role, names FROM about_us_staff ORDER BY sort_order ASC, id ASC`,
    });
    if (!rs.rows?.length) return getDefaultAboutUsStaff();
    return rs.rows.map(mapRow);
  } catch {
    return getDefaultAboutUsStaff();
  }
}

export async function replaceAboutUsStaff(itemsInput) {
  const list = Array.isArray(itemsInput) ? itemsInput : [];
  const normalized = list.map((item, i) => normalizeItem(item, i)).filter((item) => item.role);

  const client = getClient();
  try {
    await client.execute({ sql: `DELETE FROM about_us_staff` });
  } catch {
    await ensureTable(client);
    await client.execute({ sql: `DELETE FROM about_us_staff` });
  }

  if (!normalized.length) return [];

  await client.batch(
    normalized.map((item, i) => ({
      sql: `INSERT INTO about_us_staff (sort_order, role, names, updated_at) VALUES (?, ?, ?, datetime('now'))`,
      args: [i, item.role, item.names],
    })),
    "write"
  );

  return listAboutUsStaff();
}
