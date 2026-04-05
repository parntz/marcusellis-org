import fs from "node:fs";
import path from "node:path";
import { getClient } from "../lib/sqlite.mjs";

const SOURCE_FILE = path.join(process.cwd(), "content/generated/site-data.generated.js");

const MEMBER_SITE_LINK_URL_OVERRIDES = new Map([
  ["http://www.billwencepromotions.com/", "https://billwencepromos.com/"],
  ["http://www.brentrowan.com/", "https://brentrowan.com/"],
  ["http://www.buddygreene.com/", "https://www.buddygreene.com/"],
  ["http://www.charliemccoy.com/", "https://charliemccoy.com/"],
  ["http://www.nashvillenumbersystem.com/", "https://nashvillenumbersystem.com/download/"],
  ["http://www.aliasmusic.org/", "https://www.aliasmusic.org/"],
  ["http://www.colinlinden.com/", "https://colinlinden.bandzoogle.com/"],
  ["http://www.davepomeroy.com/", "https://davepomeroy.com/"],
  ["http://www.deanslocum.com/", "https://www.deanslocum.com/"],
  ["http://www.gcmusic1.com/", "https://www.gcmusic1.com/"],
  ["http://www.jackpearson.com/", "https://jackpearson.com/"],
  ["http://www.jaypatten.com/", "https://jaypatten.com/"],
  ["http://www.jeffsteinberg.com/", "https://www.jeffsteinberg.com/"],
  ["http://www.jerrydouglas.com/", "https://jerrydouglas.com/"],
  ["http://www.jellyrolljohnson.com/", "https://www.jellyrolljohnson.com/"],
  ["http://www.beairdmusicgroup.com/", "https://www.beairdmusicgroup.com/"],
  ["http://www.larry-franklin.com/", "https://www.larry-franklin.com/"],
  ["http://www.markoconnor.com/", "https://www.markoconnor.com/"],
  ["http://www.digitalaudiopost.com/", "https://www.digitalaudiopost.com/"],
  ["http://www.digitalmusicworkshop.com/", "https://www.digitalmusicworkshop.com/"],
  ["http://www.paulfranklinmethod.com", "https://www.paulfranklinmethod.com/"],
  ["http://www.stevewariner.com/", "https://www.stevewariner.com/"],
  ["http://www.terrytownson.com/", "https://terrytownson.com/"],
  ["https://www.tigerfitzhugh.com/", "https://www.tigerfitzhugh.com/"],
  ["http://www.vincegill.com/", "https://www.vincegill.com/"],
]);

const MEMBER_SITE_LINK_REMOVALS = new Set([
  "http://www.curtisjay.com/",
  "http://www.leeplaysbass.com/",
  "http://www.ronoates.com/",
]);

const NON_MEMBER_SITE_LINK_TITLES = new Set([
  "Sound Healthcare & Financial",
  "The Tennessee Credit Union",
  "AFM Pension Info",
  "HUB Insurance",
]);

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
    .replace(/&mdash;/gi, "-")
    .replace(/&trade;/gi, "TM")
    .replace(/&reg;/gi, "(R)")
    .replace(/&copy;/gi, "(C)")
    .replace(/&eacute;/gi, "e")
    .replace(/&uuml;/gi, "u")
    .replace(/&ouml;/gi, "o")
    .replace(/&aacute;/gi, "a")
    .replace(/&nbsp/gi, " ");
}

function stripHtml(input = "") {
  return cleanText(
    decodeHtmlEntities(
      String(input)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function splitMemberSiteLabel(label) {
  const clean = cleanText(label);
  if (!clean) return { title: "", subtitle: "" };
  const pieces = clean.split(/\s+-\s+/);
  if (pieces.length > 1) {
    return { title: pieces[0], subtitle: pieces.slice(1).join(" - ") };
  }
  return { title: clean, subtitle: "" };
}

function extractMemberSiteLinksHtml() {
  const source = fs.readFileSync(SOURCE_FILE, "utf8");
  const match = source.match(
    /"route": "\/member-site-links"[\s\S]*?"bodyHtml": "((?:\\.|[^"])*)"/
  );
  if (!match?.[1]) {
    throw new Error("Could not locate /member-site-links bodyHtml in generated site data.");
  }
  return JSON.parse(`"${match[1]}"`);
}

function extractImportedLinks(bodyHtml) {
  const decodedHtml = bodyHtml || "";
  const memberLinksStart = decodedHtml.search(/<p>\s*Local 257 Member Website Links\s*<\/p>/i);
  const memberLinksHtml = memberLinksStart >= 0 ? decodedHtml.slice(memberLinksStart) : decodedHtml;

  return Array.from(
    memberLinksHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    (match) => {
      const href = cleanText(match[1]);
      const label = cleanText(stripHtml(match[2]));
      const canonicalHref = MEMBER_SITE_LINK_URL_OVERRIDES.get(href) || href;
      const { title, subtitle } = splitMemberSiteLabel(label);
      return {
        title,
        subtitle,
        href: canonicalHref,
        originalHref: href,
      };
    }
  )
    .filter((item) => /^https?:\/\//i.test(item.href))
    .filter((item) => !MEMBER_SITE_LINK_REMOVALS.has(item.originalHref))
    .filter((item) => item.title)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.title === item.title) === index);
}

function dedupeByIdentity(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = `${cleanText(item.title).toLowerCase()}::${cleanText(item.href).toLowerCase()}`;
    if (!item.title || !item.href || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      title: cleanText(item.title),
      subtitle: cleanText(item.subtitle),
      href: cleanText(item.href),
    });
  }
  return deduped;
}

async function listExistingLinks(client) {
  const rs = await client.execute(`
    SELECT id, title, subtitle, href, display_order
    FROM member_site_links
    ORDER BY display_order ASC, id ASC
  `);
  return rs.rows.map((row) => ({
    id: Number(row.id),
    title: cleanText(row.title),
    subtitle: cleanText(row.subtitle),
    href: cleanText(row.href),
    displayOrder: Number(row.display_order || 0),
  }));
}

async function main() {
  const client = getClient();
  const importedLinks = extractImportedLinks(extractMemberSiteLinksHtml());
  const existingLinks = await listExistingLinks(client);

  const finalLinks = dedupeByIdentity([
    ...importedLinks,
    ...existingLinks.filter((item) => !NON_MEMBER_SITE_LINK_TITLES.has(item.title)),
  ]);

  await client.execute("DELETE FROM member_site_links");
  if (finalLinks.length) {
    await client.batch(
      finalLinks.map((item, index) => ({
        sql: `
          INSERT INTO member_site_links (
            title,
            subtitle,
            href,
            display_order,
            updated_at
          )
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        args: [item.title, item.subtitle, item.href, index + 1],
      })),
      "write"
    );
  }

  const restored = await listExistingLinks(client);
  console.log(
    JSON.stringify(
      {
        restoredCount: restored.length,
        importedCount: importedLinks.length,
        existingPreservedCount: existingLinks.length,
        links: restored,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
