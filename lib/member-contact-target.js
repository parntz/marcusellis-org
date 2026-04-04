import { decodeHtmlEntities } from "./decode-html-entities.js";
import { pageMap } from "./site-data";
import { getClient } from "./sqlite.mjs";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function extractProfileSlugFromLegacyContactPage(bodyHtml = "") {
  return bodyHtml.match(/<a href="\/users\/([^"/?#]+)"/i)?.[1] || "";
}

export function extractFirstEmail(html = "") {
  const text = decodeHtmlEntities(String(html).replace(/<[^>]+>/g, " "));
  return text.match(EMAIL_RE)?.[0] || "";
}

export function resolveRequestedMemberSlug(slugOrId = "") {
  const requested = String(slugOrId || "").trim();
  if (!requested) return "";

  if (!/^\d+$/.test(requested)) {
    return requested;
  }

  const page = pageMap[`/user/${requested}/contact`];
  if (!page?.bodyHtml) {
    return "";
  }

  return extractProfileSlugFromLegacyContactPage(page.bodyHtml);
}

export async function resolveMemberContactTarget(slugOrId = "") {
  const requested = String(slugOrId || "").trim();
  const memberSlug = resolveRequestedMemberSlug(requested);

  if (!memberSlug) {
    return null;
  }

  const client = getClient();
  const { rows } = await client.execute({
    sql: `SELECT slug, title, contact_html
          FROM member_pages
          WHERE slug = ?
          LIMIT 1`,
    args: [memberSlug],
  });

  const member = rows?.[0] || null;
  if (!member) {
    return null;
  }

  return {
    requestedSlug: requested,
    memberSlug: member.slug,
    title: member.title,
    contactHtml: member.contact_html || "",
    email: extractFirstEmail(member.contact_html || ""),
  };
}
