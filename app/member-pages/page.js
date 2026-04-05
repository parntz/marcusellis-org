import Link from "next/link";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { decodeHtmlEntities, dedupeMembersByTitle } from "../../lib/decode-html-entities.js";
import { resolveMemberWebsiteHref, rewriteLegacyNashvilleSiteInHtml } from "../../lib/legacy-site-url.js";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";
import { getClient } from "../../lib/sqlite.mjs";

const PAGE_SIZE = 24;

function formatInstruments(text) {
  if (!text) return [];
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeTokens(html) {
  const stripped = (html || "").replace(/<[^>]+>/g, " ");
  return stripped
    .split(/[,;/]|&amp;|&/i)
    .flatMap((part) => part.split(/\s{2,}|\band\b/gi))
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && t.length <= 32)
    .filter((t) => !/^[-–—]+$/.test(t));
}

async function fetchTopInstruments(limit = 40) {
  const client = getClient();
  const { rows } = await client.execute(`SELECT personnel_html FROM member_pages`);
  const counts = new Map();
  for (const row of rows) {
    const tokens = normalizeTokens(row.personnel_html);
    for (const token of tokens) {
      const key = token.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([k]) => !k.startsWith("http"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k.replace(/\b\w/g, (m) => m.toUpperCase()));
}

async function fetchMembers({ page = 1, q = "", instrument = "" }) {
  const client = getClient();
  const offset = (page - 1) * PAGE_SIZE;

  const filters = [];
  const args = [];

  if (q) {
    const like = `%${q}%`;
    filters.push("(title LIKE ? OR description_html LIKE ?)");
    args.push(like, like);
  }

  if (instrument) {
    const likeInst = `%${instrument}%`;
    filters.push("(LOWER(personnel_html) LIKE LOWER(?) OR LOWER(description_html) LIKE LOWER(?))");
    args.push(likeInst, likeInst);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const list = (
    await client.execute({
      sql: `SELECT slug, title, description_html, contact_html, personnel_html, canonical_url
            FROM member_pages
            ${where}
            ORDER BY title ASC`,
      args,
    })
  ).rows;

  const deduped = dedupeMembersByTitle(list);
  const total = deduped.length;
  const members = deduped.slice(offset, offset + PAGE_SIZE);
  return { members, total };
}

function MemberCard({ member }) {
  const instruments = formatInstruments(member.personnel_html || member.description_html || "");
  const website = resolveMemberWebsiteHref(member.canonical_url);
  return (
    <article className="member-card">
      <div className="member-card__top">
        <div>
          <p className="member-card__eyebrow">Member</p>
          <h3 className="member-card__name">{decodeHtmlEntities(member.title)}</h3>
        </div>
        <Link href={`/users/${member.slug}`} className="member-card__cta">
          View Profile →
        </Link>
      </div>

      {instruments.length ? (
        <div className="member-card__chips" aria-label="Primary instruments">
          {instruments.map((label) => (
            <span key={label} className="chip">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {member.description_html ? (
        <div
          className="member-card__body"
          dangerouslySetInnerHTML={{
            __html: rewriteLegacyNashvilleSiteInHtml(member.description_html),
          }}
        />
      ) : null}

      <div className="member-card__links">
        <Link href={`/user/${member.slug}/contact`} className="text-link">
          Contact
        </Link>
        {website ? (
          website.isInternal ? (
            <Link href={website.href} className="text-link">
              Website
            </Link>
          ) : (
            <a href={website.href} className="text-link" target="_blank" rel="noreferrer">
              Website
            </a>
          )
        ) : null}
      </div>
    </article>
  );
}

export default async function MemberPages({ searchParams }) {
  const page = Math.max(1, Number(searchParams?.page || 1));
  const q = (searchParams?.q || "").trim();
  const instrument = (searchParams?.instrument || "").trim();
  const [topInstruments, { members, total }] = await Promise.all([
    fetchTopInstruments(40),
    fetchMembers({ page, q, instrument }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildParams = (nextPage) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (instrument) params.set("instrument", instrument);
    params.set("page", String(nextPage));
    return params.toString();
  };

  return (
    <article className="page-frame member-pages-shell">
      <PageHeaderWithCallout
        route="/member-pages"
        title="Member Profile Pages"
        description={INTERNAL_PAGE_DESCRIPTION.MEMBER_PAGES}
      />

      <section className="member-controls">
        <form className="member-filters" action="/member-pages" method="get">
          <div className="filter-group">
            <label htmlFor="q">Search</label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={q}
              placeholder="e.g. fiddle, guitar, engineer"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="instrument">Primary instrument</label>
            <select id="instrument" name="instrument" defaultValue={instrument}>
              <option value="">Any</option>
              {topInstruments.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group filter-group--action">
            <button type="submit">Filter</button>
          </div>
        </form>
        <p className="member-count">{total} members</p>
      </section>

      <section className="member-grid" aria-label="Member profiles">
        {members.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </section>

      <footer className="member-pagination" aria-label="Pagination">
        <span>
          Page {page} of {totalPages} ({total} members)
        </span>
        {page > 1 ? (
          <Link href={`/member-pages?${buildParams(page - 1)}`} className="text-link">
            ← Prev
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={`/member-pages?${buildParams(page + 1)}`} className="text-link">
            Next →
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
