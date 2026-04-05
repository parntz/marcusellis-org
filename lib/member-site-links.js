import { getClient } from "./sqlite.mjs";

let memberSiteLinksSchemaReadyPromise = null;

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeUrl(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    return "";
  }

  if (!/^https?:$/i.test(url.protocol)) {
    return "";
  }

  return url.toString();
}

function domainFromUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  try {
    return new URL(normalized).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

async function ensureMemberSiteLinksSchema() {
  if (!memberSiteLinksSchemaReadyPromise) {
    memberSiteLinksSchemaReadyPromise = (async () => {
      const client = getClient();
      await client.executeMultiple(`
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
      `);
    })().catch((error) => {
      memberSiteLinksSchemaReadyPromise = null;
      throw error;
    });
  }

  return memberSiteLinksSchemaReadyPromise;
}

function mapMemberSiteLinkRow(row) {
  const href = cleanText(row.href);
  return {
    id: Number(row.id),
    title: cleanText(row.title),
    subtitle: cleanText(row.subtitle),
    href,
    domain: domainFromUrl(href),
    displayOrder: Number(row.display_order || 0),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };
}

export function normalizeMemberSiteLinkPayload(input = {}) {
  const href = normalizeUrl(input.href);
  return {
    title: cleanText(input.title),
    subtitle: cleanText(input.subtitle),
    href,
  };
}

export function validateMemberSiteLinkPayload(input = {}) {
  const payload = normalizeMemberSiteLinkPayload(input);

  if (!payload.title) {
    throw new Error("Link title is required.");
  }
  if (!payload.href) {
    throw new Error("A valid website URL is required.");
  }

  return payload;
}

export async function listMemberSiteLinks() {
  await ensureMemberSiteLinksSchema();
  const client = getClient();
  const rs = await client.execute(`
    SELECT
      id,
      title,
      subtitle,
      href,
      display_order,
      created_at,
      updated_at
    FROM member_site_links
    ORDER BY display_order ASC, id ASC
  `);

  return rs.rows.map(mapMemberSiteLinkRow);
}

export async function getMemberSiteLinkById(id) {
  await ensureMemberSiteLinksSchema();
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        id,
        title,
        subtitle,
        href,
        display_order,
        created_at,
        updated_at
      FROM member_site_links
      WHERE id = ?
      LIMIT 1
    `,
    args: [id],
  });

  return rs.rows[0] ? mapMemberSiteLinkRow(rs.rows[0]) : null;
}

export async function seedMemberSiteLinksIfEmpty(items = []) {
  await ensureMemberSiteLinksSchema();
  const client = getClient();
  const countRs = await client.execute(`SELECT COUNT(*) AS count FROM member_site_links`);
  const count = Number(countRs.rows?.[0]?.count || 0);
  if (count > 0) {
    return listMemberSiteLinks();
  }

  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const payload = normalizeMemberSiteLinkPayload(item);
      if (!payload.title || !payload.href) return null;
      return {
        ...payload,
        displayOrder: index + 1,
      };
    })
    .filter(Boolean);

  if (!normalized.length) {
    return [];
  }

  await client.batch(
    normalized.map((item) => ({
      sql: `
        INSERT INTO member_site_links (
          title,
          subtitle,
          href,
          display_order,
          updated_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `,
      args: [item.title, item.subtitle, item.href, item.displayOrder],
    })),
    "write"
  );

  return listMemberSiteLinks();
}

export async function createMemberSiteLink(input = {}) {
  await ensureMemberSiteLinksSchema();
  const payload = validateMemberSiteLinkPayload(input);
  const client = getClient();
  const maxRs = await client.execute(`SELECT COALESCE(MAX(display_order), 0) AS maxOrder FROM member_site_links`);
  const nextOrder = Number(maxRs.rows?.[0]?.maxOrder || 0) + 1;

  const result = await client.execute({
    sql: `
      INSERT INTO member_site_links (
        title,
        subtitle,
        href,
        display_order,
        updated_at
      )
      VALUES (?, ?, ?, ?, datetime('now'))
    `,
    args: [payload.title, payload.subtitle, payload.href, nextOrder],
  });

  return getMemberSiteLinkById(Number(result.lastInsertRowid));
}

export async function updateMemberSiteLink(id, input = {}) {
  await ensureMemberSiteLinksSchema();
  const payload = validateMemberSiteLinkPayload(input);
  const client = getClient();
  await client.execute({
    sql: `
      UPDATE member_site_links
      SET
        title = ?,
        subtitle = ?,
        href = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [payload.title, payload.subtitle, payload.href, id],
  });

  return getMemberSiteLinkById(id);
}

export async function deleteMemberSiteLink(id) {
  await ensureMemberSiteLinksSchema();
  const client = getClient();
  await client.execute({
    sql: `DELETE FROM member_site_links WHERE id = ?`,
    args: [id],
  });
}
