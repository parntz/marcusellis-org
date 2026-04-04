/**
 * Shared parsing for News & Events listing HTML (Drupal mirror).
 */

export function stripTags(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHref(rawHref = "") {
  const trimmed = rawHref.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed
    .replace(/^https?:\/\/(?:www\.)?nashvillemusicians\.org/i, "")
    .replace(/\/+$/, "");
}

export function inferItemType(href = "") {
  if (href.startsWith("/event/")) {
    return "event";
  }
  if (href.startsWith("/news/")) {
    return "news";
  }
  return "other";
}

export function formatArchiveLabel(slug = "") {
  const match = slug.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return slug;
  }

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function extractNewsItems(bodyHtml, pagesByRoute, sourceRoute) {
  const anchorPattern = /<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const rows = [];
  let match;

  while ((match = anchorPattern.exec(bodyHtml))) {
    const href = normalizeHref(match[1]);
    if (!href) {
      continue;
    }

    const title = stripTags(match[2]);
    if (!title) {
      continue;
    }

    if (/^view\s*>{1,2}\s*$/i.test(title)) {
      continue;
    }

    if (!href.startsWith("/event/") && !href.startsWith("/news/")) {
      continue;
    }

    const linkedPage = pagesByRoute.get(href);
    rows.push({
      href,
      title: linkedPage?.title || title,
      item_type: inferItemType(href),
      summary: linkedPage?.summary || "",
      source_route: sourceRoute,
    });
  }

  return rows;
}

export function extractNewsItemsFromArchiveHtml(html, pagesByRoute, source) {
  const rows = [];
  const seenByHref = new Set();
  const itemPattern = /<div id="news-item">([\s\S]*?)<\/div>\s*<\/span>/gi;
  let itemMatch;

  while ((itemMatch = itemPattern.exec(html))) {
    const block = itemMatch[1];
    const titleAnchor = block.match(
      /<div class="news-title">\s*<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );

    if (!titleAnchor) {
      continue;
    }

    const href = normalizeHref(titleAnchor[1]);
    const fallbackTitle = stripTags(titleAnchor[2]);
    if (!href || !fallbackTitle) {
      continue;
    }

    if (!href.startsWith("/event/") && !href.startsWith("/news/")) {
      continue;
    }

    if (seenByHref.has(href)) {
      continue;
    }
    seenByHref.add(href);

    const summaryMatch = block.match(/<div class="news-body">([\s\S]*?)<\/div>/i);
    const summaryFromHtml = stripTags(summaryMatch?.[1] || "");
    const badgeMonth = stripTags(block.match(/<div class="post-date[^"]*">\s*<div class="month">([\s\S]*?)<\/div>/i)?.[1] || "")
      .slice(0, 3)
      .toUpperCase();
    const badgeDay = stripTags(block.match(/<div class="post-date[^"]*">[\s\S]*?<div class="day">([\s\S]*?)<\/div>/i)?.[1] || "");
    const eventDateText = stripTags(block.match(/<div class="event-startend">([\s\S]*?)<\/div>/i)?.[1] || "");
    const linkedPage = pagesByRoute.get(href);

    rows.push({
      href,
      title: linkedPage?.title || fallbackTitle,
      item_type: inferItemType(href),
      summary: summaryFromHtml || linkedPage?.summary || "",
      badge_month: badgeMonth,
      badge_day: badgeDay,
      event_date_text: eventDateText,
      source_route: source,
    });
  }

  return rows;
}

export function scoreItemQuality(item) {
  let score = 0;
  if (item.badge_month) score += 2;
  if (item.badge_day) score += 2;
  if (item.event_date_text) score += 2;
  if (item.summary) score += 1;
  if (item.source_route !== "/news-and-events" && item.source_route !== "/news-events") score += 1;
  return score;
}

export function dedupeNewsItemsByHref(allItems) {
  const dedupedByHref = new Map();
  for (const item of allItems) {
    const existing = dedupedByHref.get(item.href);
    if (!existing) {
      dedupedByHref.set(item.href, item);
      continue;
    }

    if (scoreItemQuality(item) > scoreItemQuality(existing)) {
      dedupedByHref.set(item.href, item);
    }
  }

  return Array.from(dedupedByHref.values());
}
