import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export function cleanDrupalHtml(html) {
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

/** Body inside Drupal field `property="content:encoded"`, or full HTML cleaned the same way. */
export function extractDrupalContentEncodedHtml(bodyHtml) {
  const raw = String(bodyHtml || "");
  const match = raw.match(
    /<div><div><div\s+property="content:encoded">([\s\S]*?)<\/div><\/div><\/div>/i
  );
  return cleanDrupalHtml(match?.[1] || raw);
}
