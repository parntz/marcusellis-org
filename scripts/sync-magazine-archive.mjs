import "./load-env.mjs";
import { closeDb, dbPath } from "../lib/sqlite.mjs";
import {
  buildMagazineArchiveConfig,
  extractIssuesFromHtml,
  mergeMagazineIssues,
} from "../lib/magazine-archive.mjs";
import { setMagazineArchiveConfig } from "../lib/site-config-magazine-archive.mjs";

const BASE_URL = "https://nashvillemusicians.org/nashville-musician-magazine";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const PAGE_COUNT = 4;

async function fetchHtml(pageIndex) {
  const url = pageIndex === 0 ? BASE_URL : `${BASE_URL}?page=${pageIndex}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function extractIntroHtml(html) {
  const match = String(html || "").match(
    /<div class="field-item even" property="content:encoded">([\s\S]*?)<\/div><\/div><\/div>/i
  );
  return String(match?.[1] || "")
    .replace(/<h3>\s*Click any magazine below to read it online!\s*<\/h3>/i, "")
    .trim();
}

async function main() {
  const pages = await Promise.all(Array.from({ length: PAGE_COUNT }, (_, index) => fetchHtml(index)));
  const introHtml = extractIntroHtml(pages[0]);
  const issues = mergeMagazineIssues(pages.map((html) => extractIssuesFromHtml(html)));
  const config = buildMagazineArchiveConfig({ introHtml, issues });
  await setMagazineArchiveConfig(config);
  console.log(`Synced ${config.issues.length} magazine issues into Turso (${dbPath})`);
  await closeDb();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  await closeDb().catch(() => {});
  process.exit(1);
});
