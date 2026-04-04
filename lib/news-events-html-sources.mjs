import fs from "fs";
import os from "os";
import path from "path";

const MONTH_SLUG_RE = /^\d{4}-\d{2}$/;

/**
 * Prefer env, then project HTML-version/, then ~/Desktop/afm2_bkup/HTML-version.
 * No network — use local mirror before any live fetch.
 */
export function resolveHtmlVersionRoot() {
  const env = process.env.HTML_VERSION_ROOT || process.env.AFM_HTML_VERSION;
  if (env && fs.existsSync(env)) {
    return { root: path.resolve(env), via: "HTML_VERSION_ROOT or AFM_HTML_VERSION" };
  }

  const cwd = path.join(process.cwd(), "HTML-version");
  if (fs.existsSync(cwd)) {
    return { root: path.resolve(cwd), via: "<project>/HTML-version" };
  }

  const desktop = path.join(os.homedir(), "Desktop", "afm2_bkup", "HTML-version");
  if (fs.existsSync(desktop)) {
    return { root: path.resolve(desktop), via: "~/Desktop/afm2_bkup/HTML-version" };
  }

  return null;
}

function readFileUtf8(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

/**
 * @param {string} htmlRoot
 * @param {"news-and-events" | "news-events"} segment
 */
export function readFirstListingHtml(htmlRoot, segment) {
  const candidates = [path.join(htmlRoot, segment, "index.html"), path.join(htmlRoot, `${segment}--asset`)];

  for (const candidate of candidates) {
    const html = readFileUtf8(candidate);
    if (html) {
      return html;
    }
  }

  return null;
}

/**
 * Monthly archives live under news-and-events/ as YYYY-MM--asset or YYYY-MM/index.html.
 * Prefer files from htmlRoot over public/_downloaded when both exist.
 */
export function collectMonthlyArchivePaths(htmlRoot, downloadedDir) {
  /** @type {Map<string, string>} */
  const byMonth = new Map();

  function addAssetPath(monthSlug, filePath) {
    if (!MONTH_SLUG_RE.test(monthSlug)) {
      return;
    }
    byMonth.set(monthSlug, filePath);
  }

  function scanDir(dir) {
    if (!dir || !fs.existsSync(dir)) {
      return;
    }

    const names = fs.readdirSync(dir);
    const assetNames = names.filter((name) => name.endsWith("--asset"));
    const dirNames = names.filter((name) => {
      if (name.endsWith("--asset")) {
        return false;
      }
      const full = path.join(dir, name);
      try {
        return fs.statSync(full).isDirectory() && MONTH_SLUG_RE.test(name);
      } catch {
        return false;
      }
    });

    for (const name of assetNames) {
      const full = path.join(dir, name);
      const monthSlug = name.replace(/--asset$/, "");
      if (MONTH_SLUG_RE.test(monthSlug)) {
        addAssetPath(monthSlug, full);
      }
    }

    for (const name of dirNames) {
      if (byMonth.has(name)) {
        continue;
      }
      const full = path.join(dir, name);
      const idx = path.join(full, "index.html");
      if (fs.existsSync(idx)) {
        addAssetPath(name, idx);
      }
    }
  }

  if (htmlRoot) {
    scanDir(path.join(htmlRoot, "news-and-events"));
  }

  if (downloadedDir && fs.existsSync(downloadedDir)) {
    for (const name of fs.readdirSync(downloadedDir)) {
      if (!name.endsWith("--asset")) {
        continue;
      }
      const monthSlug = name.replace(/--asset$/, "");
      if (!MONTH_SLUG_RE.test(monthSlug) || byMonth.has(monthSlug)) {
        continue;
      }
      byMonth.set(monthSlug, path.join(downloadedDir, name));
    }
  }

  return [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([, filePath]) => filePath);
}

export function archivePathToSourceRoute(filePath) {
  const base = path.basename(filePath);
  if (base === "index.html") {
    const monthSlug = path.basename(path.dirname(filePath));
    return `/news-and-events/${monthSlug}`;
  }

  const monthSlug = base.replace(/--asset$/, "");
  return `/news-and-events/${monthSlug}`;
}
