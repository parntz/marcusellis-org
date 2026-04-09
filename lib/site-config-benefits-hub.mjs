import { getClient } from "./sqlite.mjs";
import { extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";

const KEY = "benefits_hub";

export const DEFAULT_BENEFITS_HUB = Object.freeze({
  hero: {
    eyebrow: "Member Benefits",
    title: "Benefits that actually help a working musician",
    body:
      "Local 257 offers members meaningful services, insurance access, pension resources, discounts, and practical support for working musicians.",
    logoSrc: "/images/afm-epf-logo.png",
    logoAlt: "AFM-EP Fund logo",
  },
  pillars: [
    {
      kicker: "Retirement",
      title: "Pension and long-term security",
      body:
        "The AFM-EP Fund is one of the largest pension funds in the entertainment industry and gives qualifying musicians a real path toward retirement benefits built from covered work.",
      chips: [],
    },
    {
      kicker: "Protection",
      title: "Insurance built around real gear and real risk",
      body:
        "Local 257 members can access instrument coverage, liability protection, and additional health and life-related plans designed to match the realities of music work.",
      chips: [
        "Instrument and equipment coverage",
        "Musician liability insurance",
        "Accidental death and dismemberment",
        "Cancer care protection",
        "Catastrophic major medical",
        "Disability income plan",
        "Group term life",
        "Hospital indemnity",
        "Major medical plans",
        "Short-term medical",
      ],
    },
    {
      kicker: "Savings",
      title: "Discounts and practical day-to-day support",
      body:
        "Union Plus, credit union access, healthcare resources, and member tools give the union relationship value well beyond the bandstand.",
      chips: [],
    },
  ],
  resourcesSection: {
    eyebrow: "Quick Access",
    title: "Open the programs and documents people actually use",
    description: "",
  },
  resources: [
    {
      kicker: "Benefit Link",
      title: "Sound Healthcare & Financial",
      href: "http://soundhealthcare.org",
      external: true,
      summary: "Health and financial resources tailored to working musicians.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "The Tennessee Credit Union",
      href: "/_downloaded/sites/default/files/Media%20Root/300210%20TTCU%20Look%20Services_MAIN.pdf",
      external: true,
      summary: "Member-facing credit union information and services.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "AFM Pension Info",
      href: "http://afm-epf.org",
      external: true,
      summary: "Plan details, applications, and pension fund resources.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "HUB Instrument Insurance",
      href: "/_downloaded/sites/default/files/Media%20Root/HUBInstrumentInsurance2024.pdf",
      external: true,
      summary: "Coverage details for instruments and music-related equipment.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "Union Plus Program",
      href: "/union-plus-program",
      external: false,
      summary: "Discounts, legal services, travel savings, and everyday member perks.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "Free Rehearsal Hall",
      href: "/free-rehearsal-hall",
      external: false,
      summary: "Book the Cooper Rehearsal Hall as a current Local 257 member.",
      linkLabel: "Open resource",
    },
    {
      kicker: "Benefit Link",
      title: "Member Site Links",
      href: "/member-site-links",
      external: false,
      summary: "Jump to member tools, profiles, and practical online resources.",
      linkLabel: "Open resource",
    },
  ],
});

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanLongText(value, max = 1200) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function cleanUrl(value, max = 1200) {
  return String(value || "").trim().slice(0, max);
}

function normalizeHero(input, fallback = DEFAULT_BENEFITS_HUB.hero) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    eyebrow: cleanText(parsed.eyebrow ?? fallback.eyebrow, 120),
    title: cleanText(parsed.title ?? fallback.title, 220),
    body: cleanLongText(parsed.body ?? fallback.body, 1200),
    logoSrc: cleanUrl(parsed.logoSrc ?? fallback.logoSrc, 1200),
    logoAlt: cleanText(parsed.logoAlt ?? fallback.logoAlt, 220),
  };
}

function normalizePillar(input, fallback = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  const chips = Array.isArray(parsed.chips)
    ? parsed.chips
    : typeof parsed.chipsText === "string"
      ? parsed.chipsText.split(/\n+/)
      : fallback.chips || [];
  return {
    kicker: cleanText(parsed.kicker ?? fallback.kicker ?? "", 100),
    title: cleanText(parsed.title ?? fallback.title ?? "", 180),
    body: cleanLongText(parsed.body ?? fallback.body ?? "", 700),
    chips: chips.map((item) => cleanText(item, 90)).filter(Boolean),
  };
}

function normalizeResourcesSection(input, fallback = DEFAULT_BENEFITS_HUB.resourcesSection) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    eyebrow: cleanText(parsed.eyebrow ?? fallback.eyebrow, 120),
    title: cleanText(parsed.title ?? fallback.title, 220),
    description: cleanLongText(parsed.description ?? fallback.description, 400),
  };
}

function normalizeResource(input, fallback = {}) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    kicker: cleanText(parsed.kicker ?? fallback.kicker ?? "Benefit Link", 100),
    title: cleanText(parsed.title ?? fallback.title ?? "", 180),
    href: cleanUrl(parsed.href ?? fallback.href ?? ""),
    external:
      parsed.external === undefined && fallback.external === undefined
        ? false
        : Boolean(parsed.external ?? fallback.external),
    summary: cleanLongText(parsed.summary ?? fallback.summary ?? "", 500),
    linkLabel: cleanText(parsed.linkLabel ?? fallback.linkLabel ?? "Open resource", 100),
  };
}

function extractBenefitsFallbackLead(bodyHtml) {
  const contentHtml = extractDrupalContentEncodedHtml(bodyHtml || "");
  const match = contentHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return (
    cleanLongText(
      String(match?.[1] || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
    ) || DEFAULT_BENEFITS_HUB.hero.body
  );
}

function buildFallback(bodyHtml = "") {
  return {
    ...DEFAULT_BENEFITS_HUB,
    hero: {
      ...DEFAULT_BENEFITS_HUB.hero,
      body: extractBenefitsFallbackLead(bodyHtml),
    },
  };
}

function normalizeConfig(input, fallback = DEFAULT_BENEFITS_HUB) {
  const parsed = input && typeof input === "object" ? input : {};
  return {
    hero: normalizeHero(parsed.hero, fallback.hero),
    pillars: fallback.pillars.map((item, index) => normalizePillar(parsed.pillars?.[index], item)),
    resourcesSection: normalizeResourcesSection(parsed.resourcesSection, fallback.resourcesSection),
    resources: fallback.resources.map((item, index) => normalizeResource(parsed.resources?.[index], item)),
  };
}

export async function getBenefitsHubConfig({ bodyHtmlFallback = "" } = {}) {
  const client = getClient();
  const fallback = buildFallback(bodyHtmlFallback);
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalizeConfig(fallback, fallback);
  try {
    return normalizeConfig(JSON.parse(raw), fallback);
  } catch {
    return normalizeConfig(fallback, fallback);
  }
}

export async function setBenefitsHubConfig(input, { bodyHtmlFallback = "" } = {}) {
  const client = getClient();
  const fallback = buildFallback(bodyHtmlFallback);
  const normalized = normalizeConfig(input, fallback);
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
