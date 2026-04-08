import { getClient } from "./sqlite.mjs";

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapSitePageRow(row) {
  if (!row) return null;

  return {
    kind: String(row.kind || "mirror-page"),
    route: String(row.route || "/"),
    sourcePath: String(row.sourcePath || row.source_path || ""),
    title: String(row.title || ""),
    summary: String(row.summary || ""),
    metaDescription: String(row.metaDescription || row.meta_description || ""),
    bodyHtml: String(row.bodyHtml || row.body_html || ""),
    pageAssets: parseJsonArray(row.pageAssetsJson || row.page_assets_json),
    groups: parseJsonArray(row.groupsJson || row.groups_json),
    assets: parseJsonArray(row.assetsJson || row.assets_json),
  };
}

export async function getSitePageByRoute(route = "/") {
  const normalizedRoute = String(route || "").trim() || "/";
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        route,
        kind,
        source_path AS sourcePath,
        title,
        summary,
        meta_description AS metaDescription,
        body_html AS bodyHtml,
        page_assets_json AS pageAssetsJson,
        groups_json AS groupsJson,
        assets_json AS assetsJson
      FROM site_pages
      WHERE route = ?
      LIMIT 1
    `,
    args: [normalizedRoute],
  });

  return mapSitePageRow(rs.rows?.[0] || null);
}
