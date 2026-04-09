import { getClient } from "./sqlite.mjs";

const KEY = "rehearsal_hall_hero";

export const DEFAULT_REHEARSAL_HALL_HERO = Object.freeze({
  eyebrow: "Member Rehearsal Space",
  title: "Cooper Rehearsal Hall",
  body: "Use of the Cooper Rehearsal Hall at Local 257 is free to all current members.",
  imageSrc: "/_downloaded/sites/default/files/Media Root/IMG_6820.jpeg",
  imageAlt: "Dissonation rehearsing in Cooper Rehearsal Hall",
  sectionEyebrow: "What You Get",
  sectionTitle: "Room features built for real rehearsals",
  features: [
    {
      title: "Member access",
      body: "Free to all current Local 257 members.",
    },
    {
      title: "Long booking window",
      body: "Available from 9 a.m. until 11 p.m. for working bands and projects.",
    },
    {
      title: "Stage and lighting",
      body: "A real stage setup with lighting helps groups rehearse like the show matters.",
    },
    {
      title: "P.A. and treatment",
      body: "Includes a P.A. with monitors and acoustical treatment in the room.",
    },
  ],
});

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultilineText(value, max = 1000) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function cleanUrl(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function normalizeFeature(value, fallback) {
  const parsed = value && typeof value === "object" ? value : {};
  return {
    title: cleanText(valueOrFallback(parsed, "title", fallback.title), 120),
    body: cleanMultilineText(valueOrFallback(parsed, "body", fallback.body), 320),
  };
}

function valueOrFallback(parsed, key, fallback) {
  return Object.prototype.hasOwnProperty.call(parsed, key) ? parsed[key] : fallback;
}

function normalize(input) {
  const parsed = input && typeof input === "object" ? input : {};
  const rawFeatures = Array.isArray(parsed.features) ? parsed.features : [];
  return {
    eyebrow: cleanText(valueOrFallback(parsed, "eyebrow", DEFAULT_REHEARSAL_HALL_HERO.eyebrow), 120),
    title: cleanText(valueOrFallback(parsed, "title", DEFAULT_REHEARSAL_HALL_HERO.title), 180),
    body: cleanMultilineText(valueOrFallback(parsed, "body", DEFAULT_REHEARSAL_HALL_HERO.body), 800),
    imageSrc: cleanUrl(valueOrFallback(parsed, "imageSrc", DEFAULT_REHEARSAL_HALL_HERO.imageSrc), 1000),
    imageAlt: cleanText(valueOrFallback(parsed, "imageAlt", DEFAULT_REHEARSAL_HALL_HERO.imageAlt), 180),
    sectionEyebrow: cleanText(
      valueOrFallback(parsed, "sectionEyebrow", DEFAULT_REHEARSAL_HALL_HERO.sectionEyebrow),
      120
    ),
    sectionTitle: cleanText(
      valueOrFallback(parsed, "sectionTitle", DEFAULT_REHEARSAL_HALL_HERO.sectionTitle),
      180
    ),
    features: DEFAULT_REHEARSAL_HALL_HERO.features.map((fallback, index) =>
      normalizeFeature(rawFeatures[index], fallback)
    ),
  };
}

export async function getRehearsalHallHeroConfig() {
  const client = getClient();
  const rs = await client.execute({
    sql: "SELECT value FROM site_config WHERE key = ?",
    args: [KEY],
  });
  const raw = String(rs.rows?.[0]?.value || "");
  if (!raw) return normalize(DEFAULT_REHEARSAL_HALL_HERO);

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(DEFAULT_REHEARSAL_HALL_HERO);
  }
}

export async function setRehearsalHallHeroConfig(input) {
  const client = getClient();
  const normalized = normalize(input);
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
