import { extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";

export const MISSION_STATEMENT_DEFAULTS = {
  eyebrow: "eyebrow",
  header: "A union mission built around dignity, solidarity, and power.",
  description:
    "We are the American Federation of Musicians of the United States and Canada, professional musicians united through our Locals so that:",
  whyHeader: "What this union exists to protect.",
  whyLabel: "Why we organize",
  whyItems: [
    "Musicians deserve fair wages, safe working conditions, and the ability to make a living from their craft.",
    "Our local exists to defend musicians in studios, on stages, and in every contract we negotiate.",
  ],
  membershipHeader: "To achieve these objectives, we must commit to:",
  membershipLabel: "What membership requires",
  membershipItems: [
    "Standing together when members need support.",
    "Following through on the obligations that keep the union strong.",
  ],
  actionHeader:
    "With that unity and resolve, we must engage in direct action that demonstrates our power and determination to:",
  actionLabel: "How that mission becomes action",
  actionItems: [
    "Organize, protect, and represent musicians with clarity and discipline.",
    "Build leverage that improves the daily life of members.",
  ],
};

function defaultListHtml(items = []) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(input = "") {
  return cleanText(
    String(input)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function decodeHtmlEntities(input = "") {
  return String(input)
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-");
}

function escapeHtml(input = "") {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseListItems(listHtml = "") {
  return Array.from(listHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi), (match) =>
    cleanText(stripHtml(match[1]))
  ).filter(Boolean);
}

function firstMatch(contentHtml, pattern) {
  const match = contentHtml.match(pattern);
  return cleanText(decodeHtmlEntities(stripHtml(match?.[1] || "")));
}

function extractSection(contentHtml, titlePattern) {
  const sectionMatch = contentHtml.match(titlePattern);
  const sectionHtml = sectionMatch?.[1] || "";
  const title = firstMatch(sectionHtml, /<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  const bodyHtml = sectionHtml
    .replace(/^\s*<p\b[^>]*class="[^"]*mission-page__label[^"]*"[^>]*>[\s\S]*?<\/p>/i, "")
    .replace(/^\s*<h3\b[^>]*>[\s\S]*?<\/h3>/i, "")
    .trim();
  const itemsMatch = bodyHtml.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  return {
    title,
    bodyHtml,
    items: parseListItems(itemsMatch?.[1] || ""),
  };
}

function normalizeSectionHtml(value = "", fallbackItems = []) {
  const html = String(value || "").trim();
  if (html) return html;
  return defaultListHtml(fallbackItems);
}

export function parseMissionStatementBody(bodyHtml = "") {
  const contentHtml = extractDrupalContentEncodedHtml(bodyHtml || "");

  const hero = {
    eyebrow:
      firstMatch(contentHtml, /<p\b[^>]*data-mission-field="hero-eyebrow"[^>]*>([\s\S]*?)<\/p>/i) ||
      MISSION_STATEMENT_DEFAULTS.eyebrow,
    header:
      firstMatch(contentHtml, /<h2\b[^>]*data-mission-field="hero-header"[^>]*>([\s\S]*?)<\/h2>/i) ||
      MISSION_STATEMENT_DEFAULTS.header,
    description:
      firstMatch(contentHtml, /<p\b[^>]*data-mission-field="hero-description"[^>]*>([\s\S]*?)<\/p>/i) ||
      firstMatch(contentHtml, /<div\b[^>]*class="[^"]*mission-page__hero[^"]*"[^>]*>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i) ||
      MISSION_STATEMENT_DEFAULTS.description,
  };

  const heroFallbackIntro = Array.from(contentHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) =>
    cleanText(decodeHtmlEntities(stripHtml(match[1])))
  ).filter((value) => value && value !== "\u00a0");

  const why = extractSection(
    contentHtml,
    /<section\b[^>]*data-mission-field="why-section"[^>]*>([\s\S]*?)<\/section>/i
  );
  const membership = extractSection(
    contentHtml,
    /<section\b[^>]*data-mission-field="membership-section"[^>]*>([\s\S]*?)<\/section>/i
  );
  const action = extractSection(
    contentHtml,
    /<section\b[^>]*data-mission-field="action-section"[^>]*>([\s\S]*?)<\/section>/i
  );

  const lists = Array.from(contentHtml.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi), (match) =>
    parseListItems(match[1])
  ).filter((items) => items.length);

  return {
    ...hero,
    whyLabel: MISSION_STATEMENT_DEFAULTS.whyLabel,
    whyHeader: why.title || MISSION_STATEMENT_DEFAULTS.whyHeader,
    whyHtml: normalizeSectionHtml(why.bodyHtml, why.items.length ? why.items : lists[0] || MISSION_STATEMENT_DEFAULTS.whyItems),
    whyItems: why.items.length ? why.items : lists[0] || MISSION_STATEMENT_DEFAULTS.whyItems,
    membershipLabel: MISSION_STATEMENT_DEFAULTS.membershipLabel,
    membershipHeader: membership.title || heroFallbackIntro[1] || MISSION_STATEMENT_DEFAULTS.membershipHeader,
    membershipHtml: normalizeSectionHtml(
      membership.bodyHtml,
      membership.items.length ? membership.items : lists[1] || MISSION_STATEMENT_DEFAULTS.membershipItems
    ),
    membershipItems:
      membership.items.length ? membership.items : lists[1] || MISSION_STATEMENT_DEFAULTS.membershipItems,
    actionLabel: MISSION_STATEMENT_DEFAULTS.actionLabel,
    actionHeader: action.title || heroFallbackIntro[2] || MISSION_STATEMENT_DEFAULTS.actionHeader,
    actionHtml: normalizeSectionHtml(
      action.bodyHtml,
      action.items.length ? action.items : lists[2] || MISSION_STATEMENT_DEFAULTS.actionItems
    ),
    actionItems: action.items.length ? action.items : lists[2] || MISSION_STATEMENT_DEFAULTS.actionItems,
  };
}

export function serializeMissionStatementBody(content) {
  const data = {
    eyebrow: cleanText(content?.eyebrow) || MISSION_STATEMENT_DEFAULTS.eyebrow,
    header: cleanText(content?.header) || MISSION_STATEMENT_DEFAULTS.header,
    description: cleanText(content?.description) || MISSION_STATEMENT_DEFAULTS.description,
    whyLabel: cleanText(content?.whyLabel) || MISSION_STATEMENT_DEFAULTS.whyLabel,
    whyHeader: cleanText(content?.whyHeader) || MISSION_STATEMENT_DEFAULTS.whyHeader,
    whyHtml: normalizeSectionHtml(content?.whyHtml, content?.whyItems || MISSION_STATEMENT_DEFAULTS.whyItems),
    membershipLabel: cleanText(content?.membershipLabel) || MISSION_STATEMENT_DEFAULTS.membershipLabel,
    membershipHeader:
      cleanText(content?.membershipHeader) || MISSION_STATEMENT_DEFAULTS.membershipHeader,
    membershipHtml: normalizeSectionHtml(
      content?.membershipHtml,
      content?.membershipItems || MISSION_STATEMENT_DEFAULTS.membershipItems
    ),
    actionLabel: cleanText(content?.actionLabel) || MISSION_STATEMENT_DEFAULTS.actionLabel,
    actionHeader: cleanText(content?.actionHeader) || MISSION_STATEMENT_DEFAULTS.actionHeader,
    actionHtml: normalizeSectionHtml(content?.actionHtml, content?.actionItems || MISSION_STATEMENT_DEFAULTS.actionItems),
  };

  return [
    '<div class="mission-statement-body">',
    '<section class="mission-page__hero" data-mission-field="hero-section">',
    `<p class="mission-page__eyebrow" data-mission-field="hero-eyebrow">${escapeHtml(data.eyebrow)}</p>`,
    `<h2 data-mission-field="hero-header">${escapeHtml(data.header)}</h2>`,
    `<p class="mission-page__lead" data-mission-field="hero-description">${escapeHtml(data.description)}</p>`,
    "</section>",
    '<div class="mission-page__grid">',
    `<section class="mission-page__column" data-mission-field="why-section">`,
    `<p class="mission-page__label">${escapeHtml(data.whyLabel)}</p>`,
    `<h3 data-mission-field="why-header">${escapeHtml(data.whyHeader)}</h3>`,
    data.whyHtml,
    "</section>",
    `<section class="mission-page__column" data-mission-field="membership-section">`,
    `<p class="mission-page__label">${escapeHtml(data.membershipLabel)}</p>`,
    `<h3 data-mission-field="membership-header">${escapeHtml(data.membershipHeader)}</h3>`,
    data.membershipHtml,
    "</section>",
    "</div>",
    `<section class="mission-page__footer" data-mission-field="action-section">`,
    `<p class="mission-page__label">${escapeHtml(data.actionLabel)}</p>`,
    `<h3 data-mission-field="action-header">${escapeHtml(data.actionHeader)}</h3>`,
    data.actionHtml,
    "</section>",
    "</div>",
  ].join("");
}
