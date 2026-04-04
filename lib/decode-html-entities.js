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
  return String(str).replace(/&(#(?:x[\da-fA-F]+|\d+)|[a-zA-Z][a-zA-Z0-9]*);/g, (full, ent) => {
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
    const key = decodeHtmlEntities(m.title || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const dedupeKey = key || `__slug_${m.slug}`;
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
