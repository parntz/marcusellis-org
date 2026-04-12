import { extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";

function stripHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text = "", fallback = "section") {
  const slug = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function parseTopLevelBlocks(html = "") {
  const blocks = [];
  const pattern = /<(h3|p|ul)\b[^>]*>[\s\S]*?<\/\1>/gi;
  for (const match of String(html).matchAll(pattern)) {
    blocks.push({
      tag: String(match[1] || "").toLowerCase(),
      html: match[0],
    });
  }
  return blocks;
}

export function getUnionPlusProgramContent(bodyHtml = "") {
  const contentHtml = extractDrupalContentEncodedHtml(bodyHtml || "");
  const blocks = parseTopLevelBlocks(contentHtml);

  const introParts = [];
  const sections = [];
  let currentSection = null;

  for (const block of blocks) {
    if (block.tag === "h3") {
      if (currentSection) {
        sections.push(currentSection);
      }
      const titleHtml = block.html.replace(/^<h3\b[^>]*>/i, "").replace(/<\/h3>$/i, "");
      const title = stripHtml(titleHtml);
      currentSection = {
        id: slugify(title, `section-${sections.length + 1}`),
        title,
        bodyHtml: "",
      };
      continue;
    }

    if (currentSection) {
      currentSection.bodyHtml = `${currentSection.bodyHtml}${currentSection.bodyHtml ? "\n" : ""}${block.html}`;
    } else if (block.tag === "p") {
      if (stripHtml(block.html)) {
        introParts.push(block.html);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    contentHtml,
    introHtml: introParts.join("\n"),
    sections,
  };
}
