function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&hellip;/gi, "...");
}

function stripTags(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIssueLabel(title) {
  return stripTags(title)
    .replace(/^The Nashville Musician\s*[-—–:]?\s*/i, "")
    .trim();
}

function extractYear(label) {
  const match = String(label || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function parseIssueCell(cellHtml) {
  const imageMatch = cellHtml.match(/<img\b[^>]*src="([^"]+)"[^>]*>/i);
  const titleMatch = cellHtml.match(/<div[^>]*views-field-title[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const coverLinkMatch = cellHtml.match(/<div[^>]*views-field-field-cover[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>/i);
  const href = titleMatch?.[1] || coverLinkMatch?.[1] || "";
  const title = stripTags(titleMatch?.[2] || "");

  if (!href || !title) return null;

  const label = normalizeIssueLabel(title);
  return {
    href,
    title,
    label,
    imageSrc: imageMatch?.[1] || "",
    year: extractYear(label),
  };
}

export function extractIssuesFromHtml(html) {
  const issues = [];
  const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  let tdMatch;

  while ((tdMatch = tdRegex.exec(String(html || "")))) {
    const issue = parseIssueCell(tdMatch[1]);
    if (issue) issues.push(issue);
  }

  return issues;
}

export function getMagazineArchiveContent(bodyHtml) {
  const html = String(bodyHtml || "");
  const tableMatch = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i);
  const issues = extractIssuesFromHtml(tableMatch?.[0] || html);
  const introHtml = html
    .replace(tableMatch?.[0] || "", "")
    .replace(/<h3>\s*Click any magazine below to read it online!\s*<\/h3>/i, "")
    .trim();

  return {
    introHtml,
    issues,
    latestIssue: issues[0] || null,
  };
}

export function mergeMagazineIssues(issueGroups = []) {
  const merged = [];
  const seen = new Set();

  for (const issue of issueGroups.flat()) {
    const href = String(issue?.href || "").trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    merged.push({
      href,
      title: String(issue.title || "").trim(),
      label: String(issue.label || "").trim(),
      imageSrc: String(issue.imageSrc || "").trim(),
      year: String(issue.year || "").trim(),
    });
  }

  return merged;
}

export function buildMagazineArchiveConfig({ introHtml = "", issues = [] } = {}) {
  const normalizedIssues = mergeMagazineIssues([issues]);
  return {
    introHtml: String(introHtml || "").trim(),
    issues: normalizedIssues,
    latestIssue: normalizedIssues[0] || null,
  };
}
