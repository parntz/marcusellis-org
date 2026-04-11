"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";

const PAGE_SIZE = 20;

function sortMembersWithImagesFirst(members = []) {
  return [...(Array.isArray(members) ? members : [])].sort((left, right) => {
    const leftHasImage = Boolean(String(left?.pictureUrl || "").trim());
    const rightHasImage = Boolean(String(right?.pictureUrl || "").trim());
    if (leftHasImage !== rightHasImage) {
      return leftHasImage ? -1 : 1;
    }
    return String(left?.title || "").localeCompare(String(right?.title || ""), undefined, {
      sensitivity: "base",
    });
  });
}

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
    <Link href={`/users/${member.slug}`} className={`member-card member-card--${view} member-card--link`}>
      <MemberPortrait member={member} view={view} />

      <div className="member-card__content">
        <div className="member-card__identity">
          <h3 className="member-card__headline">
            <span className="member-card__name">{member.title}</span>
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function MemberPagesDirectory({ members }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasSearch = normalizedQuery.length > 0;
  const totalMembers = Array.isArray(members) ? members.length : 0;

  useEffect(() => {
    const stored = window.localStorage.getItem("member-pages-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  const orderedMembers = useMemo(() => sortMembersWithImagesFirst(members), [members]);

  const filteredMembers = useMemo(() => {
    if (!hasSearch) return orderedMembers;
    return orderedMembers.filter((member) => member.searchText.includes(normalizedQuery));
  }, [hasSearch, orderedMembers, normalizedQuery]);

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
          </div>
        </div>
        <p className="member-count">
          {hasSearch
            ? `${total} matching ${total === 1 ? "member" : "members"}`
            : `${totalMembers} ${totalMembers === 1 ? "member" : "members"}`}
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
            Page {page} of {totalPages} (showing {rangeStart}-{rangeEnd} of {total}{" "}
            {hasSearch ? "matches" : total === 1 ? "member" : "members"})
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
