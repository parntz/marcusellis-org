"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";

const PAGE_SIZE = 24;

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="6" height="6" rx="1.4" />
      <rect x="14" y="4" width="6" height="6" rx="1.4" />
      <rect x="4" y="14" width="6" height="6" rx="1.4" />
      <rect x="14" y="14" width="6" height="6" rx="1.4" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="5" width="4" height="4" rx="1.2" />
      <rect x="4" y="10" width="16" height="2" rx="1" />
      <rect x="4" y="15" width="4" height="4" rx="1.2" />
      <rect x="4" y="20" width="16" height="0" rx="0" />
      <rect x="10" y="16" width="10" height="2" rx="1" />
      <rect x="10" y="6" width="10" height="2" rx="1" />
    </svg>
  );
}

function getInitials(title = "") {
  return String(title || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function MemberPortrait({ member, view = "list" }) {
  if (member.pictureUrl) {
    return (
      <div className={`member-card__media member-card__media--${view}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={member.pictureUrl} alt={member.title} loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`member-card__media member-card__media--${view} member-card__media--placeholder`} aria-hidden="true">
      <span>{getInitials(member.title) || "M"}</span>
    </div>
  );
}

function MemberCard({ member, view = "list" }) {
  return (
    <article className={`member-card member-card--${view}`}>
      <MemberPortrait member={member} view={view} />

      <div className="member-card__content">
        <div className="member-card__identity">
          <h3 className="member-card__headline">
            <Link href={`/users/${member.slug}`} className="member-card__name">
              {member.title}
            </Link>
            {member.summary ? <span className="member-card__summary"> - {member.summary}</span> : null}
          </h3>
        </div>

        {member.instruments.length ? (
          <p className="member-card__meta" aria-label="Personnel / instrumentation">
            {member.instruments.join(", ")}
          </p>
        ) : null}

        <div className="member-card__links">
          <Link href={`/users/${member.slug}`} className="member-card__link-button">
            View profile
          </Link>
          <Link href={`/user/${member.slug}/contact`} className="member-card__link-button">
            Contact
          </Link>
          {member.website ? (
            member.website.isInternal ? (
              <Link href={member.website.href} className="member-card__link-button">
                Website
              </Link>
            ) : (
              <a href={member.website.href} className="member-card__link-button" target="_blank" rel="noreferrer">
                Website
              </a>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function MemberPagesDirectory({ members }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    const stored = window.localStorage.getItem("member-pages-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  const filteredMembers = useMemo(() => {
    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) => member.searchText.includes(normalizedQuery));
  }, [members, normalizedQuery]);

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page <= totalPages) return;
    setPage(totalPages);
  }, [page, totalPages]);

  const paginatedMembers = useMemo(() => {
    const offset = (page - 1) * PAGE_SIZE;
    return filteredMembers.slice(offset, offset + PAGE_SIZE);
  }, [filteredMembers, page]);

  function handleQueryChange(event) {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    startTransition(() => setPage(1));
  }

  function clearQuery() {
    setQuery("");
    startTransition(() => setPage(1));
  }

  function changePage(nextPage) {
    startTransition(() => setPage(nextPage));
  }

  function changeView(nextView) {
    setView(nextView);
    window.localStorage.setItem("member-pages-view", nextView);
  }

  return (
    <>
      <section className="member-controls">
        <div className="news-events-search member-pages-search">
          <label htmlFor="member-pages-search-input">Search Members</label>
          <div className="news-events-search-row member-pages-search-row">
            <input
              id="member-pages-search-input"
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by member name, instruments, skills, bio, or keywords..."
            />
            <div className="member-view-toggle" role="group" aria-label="Directory view">
              <button
                type="button"
                className="member-view-toggle__button"
                data-active={view === "grid" ? "true" : "false"}
                onClick={() => changeView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Show members as a grid"
                title="Grid view"
              >
                <GridIcon />
              </button>
              <button
                type="button"
                className="member-view-toggle__button"
                data-active={view === "list" ? "true" : "false"}
                onClick={() => changeView("list")}
                aria-pressed={view === "list"}
                aria-label="Show members as a list"
                title="List view"
              >
                <ListIcon />
              </button>
            </div>
            {query ? (
              <button type="button" className="news-events-search-clear" onClick={clearQuery}>
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <p className="member-count">
          {total} {total === 1 ? "member" : "members"}
        </p>
      </section>

      {paginatedMembers.length ? (
        <section className={`member-grid member-grid--${view}`} aria-label="Member profiles">
          {paginatedMembers.map((member) => (
            <MemberCard key={member.slug} member={member} view={view} />
          ))}
        </section>
      ) : (
        <p className="member-pages-empty">No members match that search.</p>
      )}

      {totalPages > 1 ? (
        <footer className="member-pagination" aria-label="Pagination">
          <span>
            Page {page} of {totalPages} ({total} {total === 1 ? "member" : "members"})
          </span>
          <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}>
            ← Prev
          </button>
          <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages}>
            Next →
          </button>
        </footer>
      ) : null}
    </>
  );
}
