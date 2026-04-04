import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const mirrorDir = path.join(rootDir, "HTML-version");
const publicDir = path.join(rootDir, "public");
const downloadedAssetDir = path.join(publicDir, "_downloaded");
const outputDir = path.join(rootDir, "content", "generated");
const outputFile = path.join(outputDir, "site-data.generated.js");
const designAnalysisFile = path.join(mirrorDir, "_design-analysis.json");
const assetManifestFile = path.join(mirrorDir, "_asset-manifest.json");
const DOWNLOADED_ASSET_PREFIX = "/_downloaded";
const PAGE_SPECIFIC_ASSET_GROUPS = new Set([
  "images",
  "documents",
  "media",
  "archives",
  "other",
]);

function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return normalizeWhitespace(
    (value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&rsquo;/gi, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"')
  );
}

function summarize(text, maxLength = 180) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return "";
  }
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDir(entryPath));
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeRoute(route) {
  if (!route || route === "/") {
    return "/";
  }

  const cleaned = route
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/\/index\.html?$/i, "")
    .replace(/\.html?$/i, "")
    .replace(/\/+$/, "");

  return cleaned ? (cleaned.startsWith("/") ? cleaned : `/${cleaned}`) : "/";
}

function routeFromHtmlFile(filePath) {
  const relativePath = path.relative(mirrorDir, filePath).replace(/\\/g, "/");

  if (relativePath === "index.html") {
    return "/";
  }

  if (relativePath.endsWith("/index.html")) {
    return normalizeRoute(relativePath.slice(0, -"/index.html".length));
  }

  return normalizeRoute(relativePath.replace(/\.html$/i, ""));
}

function routeToSegments(route) {
  return route === "/" ? [] : route.replace(/^\/+|\/+$/g, "").split("/");
}

function toSourcePath(route) {
  return route === "/" ? "/" : `${route}/`;
}

function escapeClosingTags(html) {
  return html.replace(/<\/script/gi, "<\\/script");
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? normalizeWhitespace(match[1]) : "";
}

function extractH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : "";
}

function extractMetaDescription(html) {
  const match = html.match(/<meta name="description" content="([\s\S]*?)">/i);
  return match ? normalizeWhitespace(match[1]) : "";
}

function extractTagBlock(html, startIndex, tagName) {
  let depth = 0;
  const pattern = new RegExp(`<\\/?${tagName}\\b`, "gi");
  pattern.lastIndex = startIndex;
  let match;

  while ((match = pattern.exec(html))) {
    const isClosing = html[match.index + 1] === "/";
    depth += isClosing ? -1 : 1;

    if (depth === 0) {
      const endIndex = html.indexOf(">", match.index);
      if (endIndex === -1) {
        return html.slice(startIndex);
      }
      return html.slice(startIndex, endIndex + 1);
    }
  }

  return "";
}

function extractMainContentHtml(html) {
  const selectors = [
    { pattern: /<main\b/i, tag: "main" },
    { pattern: /<article\b/i, tag: "article" },
    { pattern: /<div[^>]+id="content"[^>]*>/i, tag: "div" },
    { pattern: /<div[^>]+role="main"[^>]*>/i, tag: "div" },
    { pattern: /<section[^>]+id="content"[^>]*>/i, tag: "section" },
    { pattern: /<body\b/i, tag: "body" },
  ];

  for (const selector of selectors) {
    const match = selector.pattern.exec(html);
    if (!match) {
      continue;
    }

    const block = extractTagBlock(html, match.index, selector.tag);
    if (block) {
      return block
        .replace(/^<[^>]+>/, "")
        .replace(/<\/[^>]+>\s*$/, "")
        .trim();
    }
  }

  return html;
}

function extractParagraphs(html, minLength = 50) {
  const matches = html.match(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
  const items = [];

  for (const match of matches) {
    const text = stripTags(match);
    if (text.length >= minLength && !items.includes(text)) {
      items.push(text);
    }
  }

  return items;
}

function normalizeAssetPath(assetPath) {
  if (!assetPath) {
    return "";
  }

  const decoded = decodeURIComponent(assetPath.replace(/^https?:\/\/[^/]+/i, ""));
  return decoded.startsWith("/") ? decoded : `/${decoded}`;
}

function getPublicAssetUrl(assetPath) {
  return `${DOWNLOADED_ASSET_PREFIX}${normalizeAssetPath(assetPath)}`;
}

function normalizeLocalReference(rawValue, route) {
  const value = (rawValue || "").trim();

  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("javascript:") ||
    value.startsWith("data:")
  ) {
    return null;
  }

  try {
    const baseUrl =
      route === "/"
        ? "https://mirror.local/"
        : `https://mirror.local${route.replace(/\/+$/, "")}/`;
    const resolved = new URL(value, baseUrl);
    if (resolved.host !== "mirror.local") {
      return null;
    }
    return {
      pathname: normalizeAssetPath(resolved.pathname),
      hash: resolved.hash,
      search: resolved.search,
    };
  } catch {
    return null;
  }
}

function isHtmlLikePath(pathname) {
  const extension = path.extname(pathname).toLowerCase();
  return (
    pathname.endsWith("/") ||
    !extension ||
    [".html", ".htm", ".php", ".asp", ".aspx", ".jsp"].includes(extension)
  );
}

function toRouteFromPathname(pathname) {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return "/";
  }

  if (pathname.endsWith("/")) {
    return normalizeRoute(pathname);
  }

  if (isHtmlLikePath(pathname)) {
    return normalizeRoute(pathname);
  }

  return "";
}

function normalizeNavigationHref(rawHref, label, knownRoutes) {
  if (!rawHref) {
    return "/";
  }

  const localRef = normalizeLocalReference(rawHref, "/");
  if (!localRef) {
    return rawHref;
  }

  if (isHtmlLikePath(localRef.pathname)) {
    const route = toRouteFromPathname(localRef.pathname);
    if (knownRoutes.has(route)) {
      return route;
    }
  }

  const lowered = (label || "").trim().toLowerCase();
  if (lowered === "home") {
    return "/";
  }

  return rawHref;
}

function parseNavigationItems(listHtml, knownRoutes) {
  const items = [];
  const itemPattern = /<li\b[\s\S]*?<\/li>/gi;
  const matches = listHtml.match(itemPattern) || [];

  for (const match of matches) {
    const nestedListMatch = match.match(/<(ul|ol)\b[\s\S]*?<\/\1>/i);
    const nestedList = nestedListMatch?.[0] || "";
    const ownContent = nestedList ? match.replace(nestedList, "") : match;
    const anchorMatch = ownContent.match(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const label = stripTags(anchorMatch?.[2] || "");

    if (!anchorMatch?.[1] || !label) {
      continue;
    }

    const children = nestedList ? parseNavigationItems(nestedList, knownRoutes) : [];

    items.push({
      label,
      href: normalizeNavigationHref(anchorMatch[1], label, knownRoutes),
      ...(children.length ? { children } : {}),
    });
  }

  return items;
}

function extractMenuCandidates(html) {
  const matches = html.match(/<(ul|ol)\b[\s\S]*?<\/\1>/gi) || [];

  return matches.filter((candidate) => {
    const linkCount = (candidate.match(/<a /gi) || []).length;
    const lowered = candidate.toLowerCase();
    return (
      linkCount >= 3 &&
      !lowered.includes("social") &&
      !lowered.includes("copyright")
    );
  });
}

function normalizeAnalyzedNavItems(items, knownRoutes) {
  return (items || [])
    .map((item) => {
      if (!item?.label || !item?.href) {
        return null;
      }

      const children = normalizeAnalyzedNavItems(item.children, knownRoutes);

      return {
        label: item.label.trim(),
        href: normalizeNavigationHref(item.href, item.label, knownRoutes),
        ...(children.length ? { children } : {}),
      };
    })
    .filter(Boolean);
}

function buildNavigation(homepageHtml, analysis, knownRoutes) {
  const analyzedPrimary = normalizeAnalyzedNavItems(
    analysis?.navigation?.primary,
    knownRoutes
  );
  if (analyzedPrimary.length) {
    return analyzedPrimary;
  }

  const extracted = extractMenuCandidates(homepageHtml)
    .map((candidate) => parseNavigationItems(candidate, knownRoutes))
    .filter((items) => items.length >= 3)
    .sort((left, right) => right.length - left.length)[0];

  if (extracted?.length) {
    return extracted.some((item) => item.href === "/") || !knownRoutes.has("/")
      ? extracted
      : [{ label: "Home", href: "/" }, ...extracted];
  }

  const navBlock = homepageHtml.match(/<nav[\s\S]*?<\/nav>/i)?.[0] || homepageHtml;
  const flatItems = [];
  const seen = new Set();

  for (const match of navBlock.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = stripTags(match[2]);
    if (!label) {
      continue;
    }

    const href = normalizeNavigationHref(match[1], label, knownRoutes);
    const key = `${label}::${href}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    flatItems.push({ label, href });
  }

  if (flatItems.length) {
    return flatItems.some((item) => item.href === "/") || !knownRoutes.has("/")
      ? flatItems
      : [{ label: "Home", href: "/" }, ...flatItems];
  }

  return Array.from(knownRoutes)
    .filter((route) => route !== "/")
    .slice(0, 12)
    .map((route) => ({
      href: route,
      label:
        routeToSegments(route)
          .slice(-1)[0]
          ?.replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Page",
    }));
}

function buildUtilityNav(analysis, knownRoutes) {
  return normalizeAnalyzedNavItems(analysis?.navigation?.utility, knownRoutes);
}

function rewriteSrcSet(value, route, knownRoutes, assetRecordsByPath) {
  return value
    .split(",")
    .map((entry) => {
      const [rawUrl, descriptor] = entry.trim().split(/\s+/, 2);
      const localRef = normalizeLocalReference(rawUrl, route);

      if (!localRef) {
        return entry.trim();
      }

      const asset = assetRecordsByPath.get(localRef.pathname);
      if (asset) {
        return descriptor ? `${asset.publicUrl} ${descriptor}` : asset.publicUrl;
      }

      if (isHtmlLikePath(localRef.pathname)) {
        const targetRoute = toRouteFromPathname(localRef.pathname);
        if (knownRoutes.has(targetRoute)) {
          return descriptor ? `${targetRoute} ${descriptor}` : targetRoute;
        }
      }

      return entry.trim();
    })
    .join(", ");
}

function rewriteContentHtml(html, route, knownRoutes, assetRecordsByPath) {
  let rewritten = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s(?:class|id|style|onclick|onload|onerror)="[^"]*"/gi, "")
    .replace(/\s(?:class|id|style|onclick|onload|onerror)='[^']*'/gi, "");

  rewritten = rewritten.replace(/\ssrcset="([^"]+)"/gi, (match, value) => {
    return ` srcset="${rewriteSrcSet(value, route, knownRoutes, assetRecordsByPath)}"`;
  });

  rewritten = rewritten.replace(
    /\s(href|src|poster)="([^"]+)"/gi,
    (match, attribute, value) => {
      const localRef = normalizeLocalReference(value, route);

      if (!localRef) {
        return match;
      }

      const asset = assetRecordsByPath.get(localRef.pathname);
      if (asset) {
        return ` ${attribute}="${asset.publicUrl}"`;
      }

      if (isHtmlLikePath(localRef.pathname)) {
        const targetRoute = toRouteFromPathname(localRef.pathname);
        if (knownRoutes.has(targetRoute)) {
          const suffix = `${localRef.search}${localRef.hash}`;
          return ` ${attribute}="${targetRoute}${suffix}"`;
        }
      }

      return match;
    }
  );

  return rewritten.trim();
}

function readAssetManifest() {
  const manifest = readJson(assetManifestFile, {});
  return Object.fromEntries(
    Object.entries(manifest).map(([assetPath, contentType]) => [
      normalizeAssetPath(assetPath),
      contentType,
    ])
  );
}

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }

  return `${Math.round(size / 104857.6) / 10} MB`;
}

function classifyAsset(assetPath, contentType) {
  const extension = path.extname(assetPath).toLowerCase();
  const loweredType = (contentType || "").toLowerCase();

  if (
    loweredType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"].includes(extension)
  ) {
    return "images";
  }

  if (
    loweredType.includes("pdf") ||
    [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf"].includes(
      extension
    )
  ) {
    return "documents";
  }

  if (
    loweredType.startsWith("video/") ||
    loweredType.startsWith("audio/") ||
    [".mp4", ".mov", ".m4v", ".mp3", ".wav", ".ogg", ".webm"].includes(extension)
  ) {
    return "media";
  }

  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(extension)) {
    return "archives";
  }

  if (loweredType.includes("css") || extension === ".css") {
    return "stylesheets";
  }

  if (
    loweredType.includes("javascript") ||
    [".js", ".mjs", ".cjs", ".json"].includes(extension)
  ) {
    return "scripts";
  }

  return "other";
}

function buildAssetRecords(assetManifest) {
  ensureDir(downloadedAssetDir);
  const records = [];

  for (const [assetPath, contentType] of Object.entries(assetManifest)) {
    const sourcePath = path.join(mirrorDir, assetPath.replace(/^\/+/, ""));
    if (!fs.existsSync(sourcePath) || fs.statSync(sourcePath).isDirectory()) {
      continue;
    }

    const targetPath = path.join(downloadedAssetDir, assetPath.replace(/^\/+/, ""));
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);

    const group = classifyAsset(assetPath, contentType);
    const extension = path.extname(assetPath).toLowerCase().replace(/^\./, "");
    const size = fs.statSync(sourcePath).size;

    records.push({
      path: assetPath,
      publicUrl: getPublicAssetUrl(assetPath),
      name: path.basename(assetPath),
      extension: extension || "file",
      contentType: contentType || "application/octet-stream",
      group,
      size,
      sizeLabel: formatBytes(size),
    });
  }

  return records.sort((left, right) => left.path.localeCompare(right.path));
}

function extractAssetPathsFromHtml(html, route, assetRecordsByPath) {
  const assetPaths = new Set();
  const attributeMatches = [...html.matchAll(/(?:href|src|poster|data-dm-image-path)=["']([^"']+)["']/gi)];

  for (const match of attributeMatches) {
    const localRef = normalizeLocalReference(match[1], route);
    if (!localRef) {
      continue;
    }

    if (assetRecordsByPath.has(localRef.pathname)) {
      assetPaths.add(localRef.pathname);
    }
  }

  const srcSetMatches = [...html.matchAll(/srcset="([^"]+)"/gi)];
  for (const match of srcSetMatches) {
    const parts = match[1].split(",");
    for (const part of parts) {
      const rawUrl = part.trim().split(/\s+/, 1)[0];
      const localRef = normalizeLocalReference(rawUrl, route);
      if (localRef && assetRecordsByPath.has(localRef.pathname)) {
        assetPaths.add(localRef.pathname);
      }
    }
  }

  return Array.from(assetPaths).sort();
}

function buildMirrorPages(htmlFiles, knownRoutes, assetRecordsByPath) {
  return htmlFiles.map((filePath) => {
    const route = routeFromHtmlFile(filePath);
    const html = fs.readFileSync(filePath, "utf8");
    const contentHtml = extractMainContentHtml(html);
    const bodyHtml = rewriteContentHtml(contentHtml, route, knownRoutes, assetRecordsByPath);
    const paragraphs = extractParagraphs(bodyHtml, 32);
    const title = extractH1(html) || extractTitle(html) || (route === "/" ? "Home" : route);
    const metaDescription = extractMetaDescription(html);

    return {
      kind: "mirror-page",
      route,
      sourcePath: toSourcePath(route),
      title,
      summary: summarize(paragraphs[0] || metaDescription || "", 220),
      metaDescription,
      bodyHtml,
      pageAssetPaths: extractAssetPathsFromHtml(html, route, assetRecordsByPath),
    };
  });
}

function buildDownloadedAssetPages(assetRecords, mirroredPageCount) {
  const groups = [
    ["images", "Images"],
    ["documents", "Documents"],
    ["media", "Media"],
    ["archives", "Archives"],
    ["stylesheets", "Stylesheets"],
    ["scripts", "Scripts"],
    ["other", "Other Files"],
  ]
    .map(([slug, title]) => ({
      slug,
      title,
      href: `/downloaded-assets/${slug}`,
      assets: assetRecords.filter((asset) => asset.group === slug),
    }))
    .filter((group) => group.assets.length);

  const indexPage = {
    kind: "asset-index",
    route: "/downloaded-assets",
    title: "Downloaded Assets",
    summary: `${assetRecords.length} downloaded files collected across ${mirroredPageCount} mirrored pages.`,
    metaDescription: "Downloaded asset catalog",
    groups: groups.map((group) => ({
      slug: group.slug,
      title: group.title,
      href: group.href,
      count: group.assets.length,
      sampleAssets: group.assets.slice(0, 6),
    })),
  };

  const groupPages = groups.map((group) => ({
    kind: "asset-group",
    route: group.href,
    title: group.title,
    summary: `${group.assets.length} files in ${group.title.toLowerCase()}.`,
    metaDescription: `${group.title} downloaded from the source site.`,
    assets: group.assets,
  }));

  return [indexPage, ...groupPages];
}

function buildSiteTheme(analysis, homepageHtml) {
  const criticalCss =
    homepageHtml.match(/<style id="criticalCss">([\s\S]*?)<\/style>/i)?.[1] || "";
  const palette = analysis?.visual?.palette || {};
  const color1 = criticalCss.match(/--color_1:([^;}]+)[;}]/i)?.[1]?.trim() || "#f4f1ea";
  const color2 = criticalCss.match(/--color_2:([^;}]+)[;}]/i)?.[1]?.trim() || "#3a3f46";
  const color3 = criticalCss.match(/--color_3:([^;}]+)[;}]/i)?.[1]?.trim() || "#c2b7a0";

  return {
    bg: palette.background || color1,
    surface: palette.surface || "rgba(255, 255, 255, 0.88)",
    surfaceStrong: "rgba(255, 255, 255, 0.95)",
    ink: palette.text || "#1f2328",
    muted: palette.mutedText || "rgba(31, 35, 40, 0.72)",
    line: "rgba(31, 35, 40, 0.16)",
    accent: palette.accent || color2,
    accentDark: palette.accentDark || color2,
    accentSoft: palette.accentSoft || color3,
    shadow: "0 20px 48px rgba(22, 26, 29, 0.12)",
    display: analysis?.visual?.fonts?.display || 'Georgia, "Times New Roman", serif',
    body: analysis?.visual?.fonts?.body || 'Arial, Helvetica, sans-serif',
    pageBackground: `linear-gradient(180deg, ${palette.background || color1} 0%, ${
      palette.accentSoft || color3
    } 100%)`,
    brandBackground: `linear-gradient(135deg, ${palette.background || color1} 0%, ${
      palette.accentSoft || color3
    } 100%)`,
  };
}

function buildSiteMeta(analysis, homepageHtml, assetRecordsByPath) {
  const title =
    analysis?.siteMeta?.title ||
    extractH1(homepageHtml) ||
    extractTitle(homepageHtml) ||
    "Mirrored Site";
  const logoMatch =
    homepageHtml.match(/<img[^>]+src="([^"]*logo[^"]*)"[^>]*>/i) ||
    homepageHtml.match(/<img[^>]+data-dm-image-path="([^"]*logo[^"]*)"[^>]*>/i);
  const logoPath = normalizeLocalReference(logoMatch?.[1] || "", "/")?.pathname;

  return {
    title,
    kicker: analysis?.siteMeta?.kicker || "Mirrored content rendered in React",
    logoImage: logoPath && assetRecordsByPath.has(logoPath)
      ? assetRecordsByPath.get(logoPath).publicUrl
      : "",
  };
}

function addDownloadedAssetsNav(primaryNav) {
  const alreadyPresent = primaryNav.some((item) => item.href === "/downloaded-assets");
  if (alreadyPresent) {
    return primaryNav;
  }

  return [...primaryNav, { label: "Downloaded Assets", href: "/downloaded-assets" }];
}

function generateModuleSource(data) {
  return `export const primaryNav = ${JSON.stringify(data.primaryNav, null, 2)};

export const utilityNav = ${JSON.stringify(data.utilityNav, null, 2)};

export const pages = ${JSON.stringify(data.pages, null, 2)};

export const pageMap = ${JSON.stringify(data.pageMap, null, 2)};

export const siteMeta = ${JSON.stringify(data.siteMeta, null, 2)};

export const siteTheme = ${JSON.stringify(data.siteTheme, null, 2)};

export const siteStats = ${JSON.stringify(data.siteStats, null, 2)};
`;
}

if (!fs.existsSync(mirrorDir)) {
  throw new Error(`Missing mirrored content at ${mirrorDir}`);
}

const assetManifest = readAssetManifest();
const assetRecords = buildAssetRecords(assetManifest);
const assetRecordsByPath = new Map(assetRecords.map((asset) => [asset.path, asset]));
const analysis = readJson(designAnalysisFile, null);
const htmlFiles = walkDir(mirrorDir)
  .filter((filePath) => filePath.endsWith(".html"))
  .filter((filePath) => !path.basename(filePath).startsWith("_"))
  .sort((left, right) => left.localeCompare(right));

const knownRoutes = new Set(htmlFiles.map(routeFromHtmlFile));
const homepageHtml = fs.readFileSync(path.join(mirrorDir, "index.html"), "utf8");
const primaryNav = addDownloadedAssetsNav(buildNavigation(homepageHtml, analysis, knownRoutes));
const utilityNav = buildUtilityNav(analysis, knownRoutes);
const mirroredPages = buildMirrorPages(htmlFiles, knownRoutes, assetRecordsByPath);
const siteMeta = buildSiteMeta(analysis, homepageHtml, assetRecordsByPath);
const assetUsageCounts = new Map();

for (const page of mirroredPages) {
  for (const assetPath of new Set(page.pageAssetPaths)) {
    assetUsageCounts.set(assetPath, (assetUsageCounts.get(assetPath) || 0) + 1);
  }
}

const enrichedMirrorPages = mirroredPages.map((page) => ({
  ...page,
  pageAssets: page.pageAssetPaths
    .map((assetPath) => assetRecordsByPath.get(assetPath))
    .filter(Boolean)
    .filter((asset) => PAGE_SPECIFIC_ASSET_GROUPS.has(asset.group))
    .filter((asset) => assetUsageCounts.get(asset.path) === 1)
    .filter((asset) => asset.publicUrl !== siteMeta.logoImage)
    .map((asset) => ({
      ...asset,
      label: asset.name,
    })),
}));

const downloadedAssetPages = buildDownloadedAssetPages(
  assetRecords.map((asset) => ({
    ...asset,
    pageCount: assetUsageCounts.get(asset.path) || 0,
  })),
  enrichedMirrorPages.length
);

const pages = [...enrichedMirrorPages, ...downloadedAssetPages].sort((left, right) =>
  left.route.localeCompare(right.route)
);
const pageMap = Object.fromEntries(pages.map((page) => [page.route, page]));
const data = {
  primaryNav,
  utilityNav,
  pages,
  pageMap,
  siteMeta,
  siteTheme: buildSiteTheme(analysis, homepageHtml),
  siteStats: {
    mirroredPageCount: enrichedMirrorPages.length,
    pageCount: pages.length,
    assetCount: assetRecords.length,
  },
};

ensureDir(outputDir);
fs.writeFileSync(outputFile, `${escapeClosingTags(generateModuleSource(data))}\n`);
console.log(`Generated ${path.relative(process.cwd(), outputFile)}`);
