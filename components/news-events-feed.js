"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const ITEMS_PER_PAGE = 10;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const days = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push({ key: `empty-${index}`, label: "", isCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      key: `${year}-${month + 1}-${day}`,
      label: String(day),
      isCurrentMonth: true,
      isToday: day === date.getDate(),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      key: `trailing-${days.length}`,
      label: "",
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return days;
}

function getBadgeForItem(item) {
  if (item.badgeMonth && item.badgeDay) {
    return { month: item.badgeMonth.toUpperCase(), day: item.badgeDay };
  }

  const archiveMatch = item.href.match(/\/news-and-events\/(\d{4})-(\d{2})$/);
  if (archiveMatch) {
    const [, year, month] = archiveMatch;
    const date = new Date(Number(year), Number(month) - 1, 1);
    return {
      month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: year.slice(-2),
    };
  }

  return { month: "NEW", day: "--" };
}

function buildSearchText(item) {
  return [
    item.title,
    item.summary,
    item.itemType,
    item.eventDateText,
    item.sourceRoute,
    item.href,
    item.badgeMonth,
    item.badgeDay,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const SUMMARY_LIMIT = 240;

function getDisplaySummary(item) {
  const rawSummary = (item.summary || "").trim();
  if (!rawSummary) {
    return "";
  }

  let summary = rawSummary.replace(/^\s*(event|news)\s*:\s*/i, "").trim();
  const title = (item.title || "").trim();
  if (title) {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    summary = summary.replace(new RegExp(`^${escapedTitle}[\\s:.-]*`, "i"), "").trim();
  }

  return summary || rawSummary;
}

function isSummaryTruncated(summary) {
  return summary.length > SUMMARY_LIMIT;
}

function truncateSummary(summary) {
  if (summary.length <= SUMMARY_LIMIT) return summary;
  const cut = summary.lastIndexOf(" ", SUMMARY_LIMIT);
  return summary.slice(0, cut > 0 ? cut : SUMMARY_LIMIT) + "…";
}

const NEWS_CAL_FIXED_MIN_WIDTH = 861;

const newsCalMqString = `(min-width: ${NEWS_CAL_FIXED_MIN_WIDTH}px)`;

function subscribeNewsCalWideMq(onChange) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(newsCalMqString);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getNewsCalWideSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(newsCalMqString).matches;
}

function getNewsCalWideServerSnapshot() {
  return false;
}

export function NewsEventsFeed({ items }) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(null);
  const [calendarPositionReady, setCalendarPositionReady] = useState(false);
  const calendarAsideRef = useRef(null);
  const calLayoutObserverRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const calendarPortaledToBody = useSyncExternalStore(
    subscribeNewsCalWideMq,
    getNewsCalWideSnapshot,
    getNewsCalWideServerSnapshot
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCalendarDate(new Date());
  }, []);

  /*
   * Only treat as "portaled layout" when actually under document.body.
   * Applying .news-events-sidebar-portal while the node still lives inside .page-frame
   * makes position:fixed resolve against the frame (backdrop-filter → containing block),
   * so the calendar can sit over the logo until the portal mounts.
   */
  const portaledToBody = mounted && calendarPortaledToBody;

  /* Reset before measure so we never flash the portaled calendar at the wrong top. */
  useLayoutEffect(() => {
    if (!calendarPortaledToBody) {
      setCalendarPositionReady(true);
    } else if (mounted) {
      setCalendarPositionReady(false);
    }
  }, [mounted, calendarPortaledToBody]);

  /*
   * Wide: calendar is position:fixed relative to the viewport. It must render under
   * document.body — .page-frame uses backdrop-filter, which creates a containing block
   * so fixed descendants scroll with the page instead of the viewport.
   *
   * Align vertically with the Recording Department box (.recording-contact-box) when present;
   * otherwise the sidebar column. Double rAF + ResizeObserver avoids a wrong first paint after
   * client navigations (grid/header not laid out yet). Hide with --pending until measured.
   */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(newsCalMqString);
    let raf = 0;

    const measure = () => {
      const el = calendarAsideRef.current;
      if (!el) return;
      if (!mq.matches) {
        el.style.removeProperty("--news-calendar-fixed-top");
        setCalendarPositionReady(true);
        return;
      }
      const header = document.querySelector(".site-header");
      const headerBottom = header ? Math.ceil(header.getBoundingClientRect().bottom) + 8 : 200;
      const contact = document.querySelector(".recording-body-grid--news .recording-contact-box");
      const sidebar = document.querySelector(".recording-body-grid--news .recording-sidebar");
      const alignTarget = contact || sidebar;
      const alignTop = alignTarget ? Math.ceil(alignTarget.getBoundingClientRect().top) : headerBottom;
      /* Never above the site header; match Recording Department (or sidebar) top. */
      const top = Math.max(headerBottom, alignTop);
      el.style.setProperty("--news-calendar-fixed-top", `${top}px`);
      setCalendarPositionReady(true);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(measure);
      });
    };

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("load", schedule, true);
    mq.addEventListener("change", schedule);

    const grid = document.querySelector(".recording-body-grid--news");
    const sidebar = document.querySelector(".recording-body-grid--news .recording-sidebar");
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => schedule());
      if (grid) ro.observe(grid);
      if (sidebar) ro.observe(sidebar);
      if (grid || sidebar) {
        calLayoutObserverRef.current = ro;
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("load", schedule, true);
      mq.removeEventListener("change", schedule);
      calLayoutObserverRef.current?.disconnect();
      calLayoutObserverRef.current = null;
      calendarAsideRef.current?.style.removeProperty("--news-calendar-fixed-top"); // eslint-disable-line react-hooks/exhaustive-deps -- calendar aside at unmount
    };
  }, [calendarPortaledToBody, mounted]);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => buildSearchText(item).includes(normalizedQuery));
  }, [items, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const boundedPage = Math.min(currentPage, totalPages);
  const startIndex = (boundedPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const monthLabel = calendarDate
    ? calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })
    : "This Month";
  const todayLabel = calendarDate
    ? calendarDate.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";
  const calendarDays = calendarDate ? buildCalendarDays(calendarDate) : [];

  if (!items?.length) {
    return null;
  }

  const calendarAside = (
    <aside
      ref={calendarAsideRef}
      className={[
        "news-events-sidebar",
        portaledToBody ? "news-events-sidebar-portal" : "",
        portaledToBody && !calendarPositionReady ? "news-events-sidebar-portal--pending" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <div className="news-events-calendar">
        <p className="news-events-calendar-kicker">Calendar</p>
        <div className="news-events-calendar-head">
          <h3>{monthLabel}</h3>
          {todayLabel ? <p>{todayLabel}</p> : null}
        </div>
        <div className="news-events-calendar-weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="news-events-calendar-grid">
          {calendarDays.map((day) => (
            <span
              key={day.key}
              className={[
                "news-events-calendar-day",
                day.isCurrentMonth ? "is-current-month" : "is-outside-month",
                day.isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="news-events-feed">
      {portaledToBody ? createPortal(calendarAside, document.body) : calendarAside}

      <div className="news-events-main">
        <div className="news-events-search">
          <label htmlFor="news-events-search-input">Search News &amp; Events</label>
          <div className="news-events-search-row">
            <input
              id="news-events-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, event info, date, type, or route..."
            />
            {query ? (
              <button type="button" className="news-events-search-clear" onClick={() => setQuery("")}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="news-events-list">
          {paginatedItems.map((item) => {
            const summary = getDisplaySummary(item);
            const needsLink = isSummaryTruncated(summary);
            const displayText = truncateSummary(summary);
            const Wrapper = needsLink ? Link : "div";
            const wrapperProps = needsLink
              ? { href: item.href, className: "news-events-item" }
              : { className: "news-events-item" };

            return (
              <Wrapper key={`${item.href}-${item.id}`} {...wrapperProps}>
                <div className="news-events-badge" aria-hidden>
                  <span>{getBadgeForItem(item).month}</span>
                  <strong>{getBadgeForItem(item).day}</strong>
                </div>
                <div className="news-events-content">
                  {item.itemType !== "event" ? (
                    <p className="news-events-type">{item.itemType}</p>
                  ) : null}
                  <h3>{item.title}</h3>
                  {item.eventDateText ? <p className="news-events-date-line">{item.eventDateText}</p> : null}
                  {displayText ? (
                    <p className="news-events-summary">
                      {displayText}
                      {needsLink ? <span className="news-read-more">Read more</span> : null}
                    </p>
                  ) : null}
                </div>
              </Wrapper>
            );
          })}
        </div>

        {filteredItems.length > 0 ? (
          <div className="news-events-pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={boundedPage === 1}
            >
              Previous
            </button>
            <p>
              Page {boundedPage} of {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={boundedPage === totalPages}
            >
              Next
            </button>
          </div>
        ) : null}

        {filteredItems.length === 0 ? (
          <p className="news-events-empty">No results found. Try a different keyword.</p>
        ) : null}
      </div>
    </div>
  );
}
