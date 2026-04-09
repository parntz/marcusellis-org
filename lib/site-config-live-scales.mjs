import { getClient } from "./sqlite.mjs";
import { cleanDrupalHtml } from "./drupal-html-clean.js";
import { stripImgTagsFromHtml } from "./strip-img-tags-from-html.js";

const KEY = "live_scales_config";
const ROUTE = "/live-scales-contracts-pension";

function stripHtml(input = "") {
  return String(input)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value, max = 240) {
  return stripHtml(String(value || "")).slice(0, max);
}

function cleanHtml(value, max = 12000) {
  return stripImgTagsFromHtml(String(value || "").trim()).slice(0, max);
}

function cleanHref(value, max = 1200) {
  return String(value || "").trim().slice(0, max);
}

function normalizeTitleKey(value) {
  return cleanText(value, 200).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function describeLiveScalesResource(title) {
  const key = normalizeTitleKey(title);
  if (key.includes("touring pension agreement")) {
    return "AFM-EP pension paperwork for touring live engagements.";
  }
  if (key.includes("road scale")) {
    return "Touring wage minimums, travel terms, and per diem guidance.";
  }
  if (key.includes("afm t2")) {
    return "Use this contract when traveling outside the Nashville area.";
  }
  if (key.includes("afm l1")) {
    return "Standard contract for local concerts, weddings, parties, and special events.";
  }
  if (key.includes("ls 1") || key.includes("ls1")) {
    return "Single-engagement pension contribution packet with instructions.";
  }
  if (key.includes("wage scales")) {
    return "Current Local 257 live performance wage minimums.";
  }
  return "Download the current PDF resource.";
}

function extractLegacyLiveScalesContent(bodyHtml) {
  const cleaned = cleanDrupalHtml(bodyHtml || "");
  const leadHtml = cleaned.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)?.[0] || "";

  const overviewItems = Array.from(
    cleaned.matchAll(/<div>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>([\s\S]*?)<\/div>/gi),
    (match) => ({
      title: cleanText(stripHtml(match[1])).replace(/:$/, ""),
      description: cleanText(stripHtml(match[2]), 600),
    })
  ).filter((item) => item.title && item.description && !/^note\b/i.test(item.title));

  const resources = [];
  const seenHrefs = new Set();
  for (const match of cleaned.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = cleanHref(match[1]);
    if (!/\/sites\/default\/files\//i.test(href) || seenHrefs.has(href)) {
      continue;
    }
    seenHrefs.add(href);
    const title = cleanText(stripHtml(match[2]), 200);
    if (!title) continue;
    resources.push({
      kicker: "PDF Download",
      title,
      summary: describeLiveScalesResource(title),
      href,
      linkLabel: "Open file",
    });
  }

  return {
    leadHtml,
    downloads: {
      eyebrow: "Downloads",
      title: "Forms and scale sheets",
      description: "",
      items: resources,
    },
    guide: {
      eyebrow: "Live Department Guide",
      title: "Which document do you need?",
      description: "",
      items: overviewItems,
    },
  };
}

async function loadFallbackConfig(client) {
  const rs = await client.execute({
    sql: `SELECT body_html AS bodyHtml FROM site_pages WHERE route = ? LIMIT 1`,
    args: [ROUTE],
  });
  return extractLegacyLiveScalesContent(String(rs.rows?.[0]?.bodyHtml || ""));
}

function normalizeDownloadItem(input, fallback = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    kicker: cleanText(parsed.kicker ?? fallback.kicker ?? "PDF Download", 80) || "PDF Download",
    title: cleanText(parsed.title ?? fallback.title ?? "", 180),
    summary: cleanText(parsed.summary ?? fallback.summary ?? "", 500),
    href: cleanHref(parsed.href ?? fallback.href ?? ""),
    linkLabel: cleanText(parsed.linkLabel ?? fallback.linkLabel ?? "Open file", 80) || "Open file",
  };
}

function normalizeGuideItem(input, fallback = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    title: cleanText(parsed.title ?? fallback.title ?? "", 180),
    description: cleanText(parsed.description ?? fallback.description ?? "", 600),
  };
}

function normalizeSection(input, fallback, itemNormalizer) {
  const parsed = input && typeof input === "object" ? input : {};
  const rawItems = Array.isArray(parsed.items) ? parsed.items : fallback.items;
  return {
    eyebrow: cleanText(parsed.eyebrow ?? fallback.eyebrow ?? "", 120),
    title: cleanText(parsed.title ?? fallback.title ?? "", 200),
    description: cleanText(parsed.description ?? fallback.description ?? "", 500),
    items: Array.isArray(rawItems) ? rawItems.map((item, index) => itemNormalizer(item, fallback.items?.[index])) : [],
  };
}

function normalizeConfig(input, fallback) {
  const parsed = input && typeof input === "object" ? input : {};
  let downloads = normalizeSection(parsed.downloads, fallback.downloads, normalizeDownloadItem);
  /* Saved config often has downloads: { items: [] }; that wipes the PDF list from mirror HTML. */
  if (!Array.isArray(downloads.items) || downloads.items.length === 0) {
    downloads = normalizeSection(fallback.downloads, fallback.downloads, normalizeDownloadItem);
  }
  return {
    leadHtml: cleanHtml(parsed.leadHtml ?? fallback.leadHtml ?? ""),
    downloads,
    guide: normalizeSection(parsed.guide, fallback.guide, normalizeGuideItem),
  };
}

function mergeConfig(current, patch) {
  const parsed = patch && typeof patch === "object" ? patch : {};
  return {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(parsed, "leadHtml") ? { leadHtml: parsed.leadHtml } : {}),
    downloads:
      parsed.downloads && typeof parsed.downloads === "object"
        ? {
            ...current.downloads,
            ...parsed.downloads,
            ...(Array.isArray(parsed.downloads.items) ? { items: parsed.downloads.items } : {}),
          }
        : current.downloads,
    guide:
      parsed.guide && typeof parsed.guide === "object"
        ? {
            ...current.guide,
            ...parsed.guide,
            ...(Array.isArray(parsed.guide.items) ? { items: parsed.guide.items } : {}),
          }
        : current.guide,
  };
}

export async function getLiveScalesConfig() {
  const client = getClient();
  const fallback = await loadFallbackConfig(client);
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) {
    return normalizeConfig(fallback, fallback);
  }
  try {
    return normalizeConfig(JSON.parse(raw), fallback);
  } catch {
    return normalizeConfig(fallback, fallback);
  }
}

export async function updateLiveScalesConfig(patch) {
  const client = getClient();
  const current = await getLiveScalesConfig();
  const next = normalizeConfig(mergeConfig(current, patch), current);
  await client.execute({
    sql: `
      INSERT INTO site_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    args: [KEY, JSON.stringify(next)],
  });
  return next;
}
