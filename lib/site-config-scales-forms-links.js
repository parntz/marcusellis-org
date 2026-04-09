import { getClient } from "./sqlite.mjs";
import { resolveLegacyAssetHref } from "./legacy-asset-href.mjs";
import { DEFAULT_SCALES_FORMS_LINKS } from "./scales-forms-links-defaults.mjs";

const KEY = "scales_forms_links";

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHref(value) {
  return resolveLegacyAssetHref(String(value || "").trim().slice(0, 500));
}

function normalizeItems(input, { fallbackToDefaults = false } = {}) {
  const source = Array.isArray(input?.items) ? input.items : Array.isArray(input) ? input : [];

  const items = source
    .map((item) => {
      const parsed = item && typeof item === "object" ? item : {};
      const title = cleanText(parsed.title);
      const href = cleanHref(parsed.href);
      if (!title || !href) return null;
      return { title, href };
    })
    .filter(Boolean)
    .map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));

  if (items.length || !fallbackToDefaults) {
    return items;
  }

  return DEFAULT_SCALES_FORMS_LINKS.map((item, index) => ({
    title: cleanText(item.title),
    href: cleanHref(item.href),
    displayOrder: index + 1,
  }));
}

async function writeConfig(client, items) {
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [KEY, JSON.stringify(items)],
  });
}

export async function getScalesFormsLinksConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");

  if (!raw) {
    const defaults = normalizeItems(DEFAULT_SCALES_FORMS_LINKS);
    await writeConfig(client, defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeItems(parsed, { fallbackToDefaults: true });
    const parsedItems = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    const needsRewrite =
      !parsedItems.length ||
      JSON.stringify(parsedItems.map((item) => ({
        title: cleanText(item?.title),
        href: String(item?.href || "").trim(),
      }))) !==
        JSON.stringify(
          normalized.map((item) => ({
            title: item.title,
            href: item.href,
          }))
        );
    if (needsRewrite) {
      await writeConfig(client, normalized);
    }
    return normalized;
  } catch {
    const defaults = normalizeItems(DEFAULT_SCALES_FORMS_LINKS);
    await writeConfig(client, defaults);
    return defaults;
  }
}

export async function setScalesFormsLinksConfig(input) {
  const client = getClient();
  const normalized = normalizeItems(input);
  await writeConfig(client, normalized);
  return normalized;
}
