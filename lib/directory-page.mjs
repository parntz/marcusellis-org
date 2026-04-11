function rewriteLegacyNashvilleSiteInHtml(html = "") {
  return String(html || "")
    .replace(
      /(\b(?:href|src)=["'])(?:https?:)?\/\/(?:www\.)?nashvillemusicians\.org/gi,
      "$1",
    )
    .replace(/(\bsrc=["'])\/file\/([^"'?#]+)([^"']*)/gi, '$1/_downloaded/file/$2--asset$3')
    .replace(/(\bhref=["'])\/file\/([^"'?#]+)([^"']*)/gi, '$1/_downloaded/file/$2--asset$3')
    .replace(/(\bsrc=["'])\/sites\/default\/files\//gi, '$1/_downloaded/sites/default/files/')
    .replace(/(\bhref=["'])\/sites\/default\/files\//gi, '$1/_downloaded/sites/default/files/')
    .replace(/(\bsrc=["'])\/sites\/default\/themes\//gi, '$1/_downloaded/sites/default/themes/')
    .replace(/(\bhref=["'])\/sites\/default\/themes\//gi, '$1/_downloaded/sites/default/themes/')
    .replace(/href=(["'])\/user\/login\/?\1/gi, 'href="/sign-in"');
}

function cleanDrupalHtml(html = "") {
  let cleaned = rewriteLegacyNashvilleSiteInHtml(html);
  cleaned = cleaned.replace(/href=(["'])\/user\/login\/?\1/gi, 'href="/sign-in"');
  cleaned = cleaned.replace(/<ul[^>]*>[\s\S]*?<\/ul>\s*/i, (match) => {
    const navPatterns =
      /href="\/(?:recording|scales-forms|new-use|signatory|live-music|gigs|find-an-artist|live-scales|afm-entertainment|form-ls1|member-services|member-benefits|free-rehearsal|benefits-union|member-site|media|what-sound|photo-and-video|nashville-musician-magazine|directory|members-only)/i;
    if (navPatterns.test(match)) return "";
    return match;
  });
  cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, "");
  cleaned = cleaned.replace(/<source[^>]*>/gi, "");
  cleaned = cleaned.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "");
  cleaned = cleaned.replace(/<div>\s*(?:&nbsp;|\s)*<\/div>/gi, "");
  cleaned = cleaned.replace(/<h3>\s*(?:&nbsp;|\s)*<\/h3>/gi, "");
  cleaned = cleaned.replace(/<h2>\s*(?:&nbsp;|\s)*<\/h2>/gi, "");
  cleaned = cleaned.replace(/<a><\/a>/g, "");
  cleaned = cleaned.replace(
    /<(p|div|li)[^>]*>\s*Source:\s*(?:<a[^>]*>)?https?:\/\/[^\s<]+(?:<\/a>)?\s*<\/\1>/gi,
    ""
  );
  cleaned = cleaned.replace(/(?:^|[\r\n])\s*Source:\s*https?:\/\/\S+\s*(?=[\r\n]|$)/gi, "");
  cleaned = cleaned.replace(/<div[^>]*>Media Folder:[\s\S]*?<\/div>\s*<\/div>/gi, "");
  cleaned = cleaned.replace(
    /<label[^>]*for="edit-url"[^>]*>[\s\S]*?<input[^>]*name="url"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
  cleaned = cleaned.replace(/(\s*\n){3,}/g, "\n");
  return cleaned;
}

function decodeHtmlEntities(input = "") {
  return String(input)
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-");
}

function stripHtml(input = "") {
  return decodeHtmlEntities(
    String(input || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeParagraphs(html = "") {
  return Array.from(String(html || "").matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) => match[1].trim())
    .map((content) => ({
      html: `<p>${content}</p>`,
      text: stripHtml(content),
    }))
    .filter((item) => item.text);
}

function joinParagraphs(items = []) {
  return items.map((item) => item.html).join("\n").trim();
}

function firstLink(html = "") {
  const match = String(html || "").match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!match) return null;
  const href = String(match[1] || "").trim();
  const label = stripHtml(match[2]) || href;
  if (!href) return null;
  return { href, label };
}

function removePureLinkParagraphs(items = []) {
  return items.filter((item) => {
    const link = firstLink(item.html);
    if (!link) return true;
    return stripHtml(item.html) !== link.label;
  });
}

function extractFirstTitle(items = [], fallback = "") {
  return items[0]?.text || fallback;
}

export function extractDirectorySourceHtml(pageHtml = "") {
  const raw = String(pageHtml || "");
  const match = raw.match(
    /<div class="field-item even" property="content:encoded">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i
  );
  return cleanDrupalHtml(rewriteLegacyNashvilleSiteInHtml(match?.[1] || raw)).trim();
}

export function extractDirectoryPageRecord(pageHtml = "") {
  const html = String(pageHtml || "");
  const title =
    stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "") ||
    stripHtml(html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || "") ||
    "Directory";
  const metaDescription =
    decodeHtmlEntities(html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || "").trim() ||
    decodeHtmlEntities(html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || "").trim();
  const canonicalUrl = String(html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "").trim();
  const bodyHtml = extractDirectorySourceHtml(html);
  return {
    route: "/directory",
    title: title || "Directory",
    summary: metaDescription,
    metaDescription,
    sourcePath: canonicalUrl || "https://nashvillemusicians.org/directory",
    bodyHtml,
  };
}

export function getDirectoryPageContent(bodyHtml = "") {
  const cleaned = cleanDrupalHtml(String(bodyHtml || "")).trim();
  const paragraphs = normalizeParagraphs(cleaned);
  const separatorIndex = paragraphs.findIndex((item) => /^_+$/.test(item.text.replace(/\s+/g, "")));
  const beforeSeparator = separatorIndex >= 0 ? paragraphs.slice(0, separatorIndex) : paragraphs;
  const afterSeparator = separatorIndex >= 0 ? paragraphs.slice(separatorIndex + 1) : [];

  const privateTitle = extractFirstTitle(beforeSeparator, "AFM 257 Membership Directory - Private");
  const privateLink = firstLink(joinParagraphs(beforeSeparator)) || {
    href: "/members-only-directory",
    label: "Open members-only directory resources",
  };
  const privateCopy = joinParagraphs(removePureLinkParagraphs(beforeSeparator.slice(1)));

  const publicTitle = extractFirstTitle(afterSeparator, "AFM 257 Member Profile Pages - Public");
  const publicLink =
    afterSeparator.map((item) => firstLink(item.html)).find(Boolean) || {
      href: "/member-pages",
      label: "Member Profiles",
    };
  const publicCopy = joinParagraphs(removePureLinkParagraphs(afterSeparator.slice(1)));

  const noteParagraph =
    paragraphs.find((item) => /password-protected/i.test(item.text) && /directory/i.test(item.text))?.text || "";
  const supportParagraph =
    paragraphs.find((item) => /call the union/i.test(item.text) || /printed copy/i.test(item.text))?.text || "";

  return {
    bodyHtml: cleaned,
    privateTitle,
    privateCopy,
    privateLink,
    publicTitle,
    publicCopy,
    publicLink,
    note: noteParagraph,
    supportText: supportParagraph,
  };
}
