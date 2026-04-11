/** Common named entities for server-side display text (titles, labels). */
const NAMED = {
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  quot: '"',
  nbsp: "\u00A0",
};

/**
 * Decode HTML entities in plain text (e.g. titles stored with &quot;, &#039;, &amp;).
 * Safe for display only — not a full HTML parser.
 */
export function decodeHtmlEntities(str) {
  if (str == null || str === "") return "";
  let current = String(str);
  for (let i = 0; i < 3; i += 1) {
    const next = current.replace(/&(#(?:x[\da-fA-F]+|\d+)|[a-zA-Z][a-zA-Z0-9]*);/g, (full, ent) => {
      if (ent[0] === "#") {
        if (ent[1] === "x" || ent[1] === "X") {
          return String.fromCharCode(parseInt(ent.slice(2), 16));
        }
        return String.fromCharCode(parseInt(ent.slice(1), 10));
      }
      const lower = ent.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(NAMED, lower)) {
        return NAMED[lower];
      }
      return full;
    });
    if (next === current) break;
    current = next;
  }
  return current;
}

function normalizeMemberDirectoryText(value) {
  return decodeHtmlEntities(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeMemberCanonicalSlug(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, "https://example.com");
    const pathname = String(url.pathname || "");
    const match = pathname.match(/\/users\/([^/?#]+)/i);
    const slug = (match?.[1] || pathname.split("/").filter(Boolean).pop() || "").toLowerCase();
    return slug.replace(/-\d+$/, "");
  } catch {
    return "";
  }
}

function isPlaceholderMemberTitle(title) {
  return title === "[user:field-first-name] [user:field-last-name]" || title === "user account";
}

export function getMemberDirectoryDedupeKey(member) {
  const title = normalizeMemberDirectoryText(member?.title);
  const firstName = normalizeMemberDirectoryText(member?.first_name ?? member?.firstName);
  const lastName = normalizeMemberDirectoryText(member?.last_name ?? member?.lastName);
  const canonicalSlug = normalizeMemberCanonicalSlug(member?.canonical_url ?? member?.canonicalUrl);
  const slug = String(member?.slug || "")
    .trim()
    .toLowerCase();

  if (canonicalSlug) {
    return `canonical:${canonicalSlug}`;
  }

  if (!isPlaceholderMemberTitle(title)) {
    const nameKey = [firstName, lastName].filter(Boolean).join(" ");
    if (nameKey) {
      return `name:${nameKey}`;
    }
    if (title) {
      return `title:${title}`;
    }
  }

  return slug ? `slug:${slug}` : title;
}

/** Prefer a human-readable slug over a numeric-only duplicate filename slug. */
export function preferMemberRow(a, b) {
  const score = (m) => {
    const s = String(m?.slug ?? "");
    if (/^\d+$/.test(s)) return s.length;
    return 10000 + s.length;
  };
  const sa = score(a);
  const sb = score(b);
  if (sb !== sa) return sa >= sb ? a : b;
  return String(a.slug).localeCompare(String(b.slug)) <= 0 ? a : b;
}

/**
 * Collapse rows that share the same display title (different asset files / numeric slugs).
 */
export function dedupeMembersByTitle(members) {
  const map = new Map();
  for (const m of members) {
    const dedupeKey = getMemberDirectoryDedupeKey(m) || `__slug_${m.slug}`;
    const existing = map.get(dedupeKey);
    if (!existing) {
      map.set(dedupeKey, m);
    } else {
      map.set(dedupeKey, preferMemberRow(existing, m));
    }
  }
  return [...map.values()].sort((a, b) =>
    decodeHtmlEntities(a.title || "")
      .toLowerCase()
      .localeCompare(decodeHtmlEntities(b.title || "").toLowerCase()),
  );
}
