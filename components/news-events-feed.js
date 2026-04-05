"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ModalLightbox } from "./modal-lightbox";

const ITEMS_PER_PAGE = 10;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SUMMARY_LIMIT = 240;
const NEWS_CAL_FIXED_MIN_WIDTH = 861;
const newsCalMqString = `(min-width: ${NEWS_CAL_FIXED_MIN_WIDTH}px)`;
const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

const LISTING_MONTH_OPTIONS = [
  { abbr: "JAN", label: "January" },
  { abbr: "FEB", label: "February" },
  { abbr: "MAR", label: "March" },
  { abbr: "APR", label: "April" },
  { abbr: "MAY", label: "May" },
  { abbr: "JUN", label: "June" },
  { abbr: "JUL", label: "July" },
  { abbr: "AUG", label: "August" },
  { abbr: "SEP", label: "September" },
  { abbr: "OCT", label: "October" },
  { abbr: "NOV", label: "November" },
  { abbr: "DEC", label: "December" },
];

function listingMonthIndex(abbr) {
  const u = String(abbr || "")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const idx = LISTING_MONTH_OPTIONS.findIndex((m) => m.abbr === u);
  return idx >= 0 ? idx : -1;
}

function yearFromIso(iso) {
  if (!iso || typeof iso !== "string") return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) && y >= 1970 && y <= 2100 ? y : null;
}

/** Build YYYY-MM-DD for the listing tile; year from event date when possible, else current year. */
function listingIsoFromBadge(badgeMonth, badgeDay, preferredYear) {
  const idx = listingMonthIndex(badgeMonth);
  if (idx < 0) return "";
  const dayRaw = parseInt(String(badgeDay || "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(dayRaw) || dayRaw < 1) return "";
  const y =
    preferredYear != null && preferredYear >= 1970 && preferredYear <= 2100
      ? preferredYear
      : new Date().getFullYear();
  const max = new Date(y, idx + 1, 0).getDate();
  const day = Math.min(dayRaw, max);
  return `${y}-${String(idx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function badgeFromListingIso(iso) {
  if (!iso) return { badgeMonth: "", badgeDay: "" };
  const parts = iso.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return { badgeMonth: "", badgeDay: "" };
  const idx = m - 1;
  if (idx < 0 || idx > 11) return { badgeMonth: "", badgeDay: "" };
  const abbr = LISTING_MONTH_OPTIONS[idx]?.abbr || "";
  return { badgeMonth: abbr, badgeDay: String(d) };
}

function clampListingDay(monthAbbr, dayStr) {
  const idx = listingMonthIndex(monthAbbr);
  if (idx < 0) return String(dayStr || "").replace(/\D/g, "").slice(0, 4) || "";
  const y = new Date().getFullYear();
  const max = new Date(y, idx + 1, 0).getDate();
  let n = parseInt(String(dayStr || "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n < 1) return "1";
  return String(Math.min(n, max));
}

function parseIsoFromEventDateText(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  if (y < 1970 || y > 2100) return "";
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
}

function formatEventDateLineFromIso(iso) {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const da = parts[2];
  if (!y || !m || !da) return "";
  const d = new Date(y, m - 1, da);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const orderDiff = Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function slugifyNewsHref(title) {
  const base = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/["'`\u2018\u2019\u201c\u201d]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "untitled";
}

function emptyForm() {
  return {
    title: "",
    itemType: "news",
    eventDateText: "",
    eventDateIso: "",
    listingDateIso: "",
    badgeMonth: "",
    badgeDay: "",
    summary: "",
    href: "",
    metaDescription: "",
    bodyHtml: "",
  };
}

function formFromItem(item) {
  const eventDateText = String(item.eventDateText || "");
  const eventDateIso = parseIsoFromEventDateText(eventDateText);
  let badgeMonth = String(item.badgeMonth || "");
  let badgeDay = String(item.badgeDay || "");
  const listingDateIso = listingIsoFromBadge(badgeMonth, badgeDay, yearFromIso(eventDateIso));
  if (listingDateIso) {
    const b = badgeFromListingIso(listingDateIso);
    badgeMonth = b.badgeMonth;
    badgeDay = b.badgeDay;
  } else {
    badgeDay = clampListingDay(badgeMonth, badgeDay);
  }
  return {
    title: String(item.title || ""),
    itemType: String(item.itemType || "news"),
    eventDateText,
    eventDateIso,
    listingDateIso,
    badgeMonth,
    badgeDay,
    summary: String(item.summary || ""),
    href: String(item.href || ""),
    metaDescription: String(item.metaDescription || ""),
    bodyHtml: String(item.bodyHtml || ""),
  };
}

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

  const archiveMatch = String(item.href || "").match(/\/news-and-events\/(\d{4})-(\d{2})$/);
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
    item.metaDescription,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

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
  return `${summary.slice(0, cut > 0 ? cut : SUMMARY_LIMIT)}…`;
}

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

export function NewsEventsFeed({ items, isAdmin = false }) {
  const router = useRouter();
  const [managedItems, setManagedItems] = useState(() => sortItems(items || []));
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(null);
  const [calendarPositionReady, setCalendarPositionReady] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(0);
  const [form, setForm] = useState(() => emptyForm());
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActiveId, setOverlayActiveId] = useState(null);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const calendarAsideRef = useRef(null);
  const calLayoutObserverRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const calendarPortaledToBody = useSyncExternalStore(
    subscribeNewsCalWideMq,
    getNewsCalWideSnapshot,
    getNewsCalWideServerSnapshot
  );

  useEffect(() => {
    setManagedItems(sortItems(items || []));
  }, [items]);

  useEffect(() => {
    setMounted(true);
    setCalendarDate(new Date());
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    function handleCreate() {
      setEditingId(0);
      setForm(emptyForm());
      setError("");
      setEditorOpen(true);
    }

    window.addEventListener("news-events:create", handleCreate);
    return () => window.removeEventListener("news-events:create", handleCreate);
  }, [isAdmin]);

  useLayoutEffect(() => {
    if (!calendarPortaledToBody) {
      setCalendarPositionReady(true);
    } else if (mounted) {
      setCalendarPositionReady(false);
    }
  }, [mounted, calendarPortaledToBody]);

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
      calendarAsideRef.current?.style.removeProperty("--news-calendar-fixed-top"); // eslint-disable-line react-hooks/exhaustive-deps
    };
  }, [calendarPortaledToBody, mounted]);

  const triggerGlassEffect = useCallback(() => {
    setGlassVariant((current) => pickRandomGlassVariant(current));
    setGlassCycle((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !overlayActiveId) return undefined;
    triggerGlassEffect();
    const id = window.setInterval(triggerGlassEffect, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, overlayActiveId, triggerGlassEffect]);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return managedItems;
    }

    return managedItems.filter((item) => buildSearchText(item).includes(normalizedQuery));
  }, [managedItems, normalizedQuery]);

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

  const portaledToBody = mounted && calendarPortaledToBody;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");

    try {
      const url = editingId ? `/api/news-events/${editingId}` : "/api/news-events";
      const method = editingId ? "PUT" : "POST";
      const payload =
        editingId > 0
          ? form
          : { ...form, href: `/news-and-events/${slugifyNewsHref(form.title)}` };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.item) {
        setError(data.error || "Save failed.");
        return;
      }

      setManagedItems((current) => {
        const next = editingId
          ? current.map((item) => (item.id === data.item.id ? data.item : item))
          : [...current, data.item];
        return sortItems(next);
      });
      setEditorOpen(false);
      setEditingId(0);
      setForm(emptyForm());
      setError("");
      router.refresh();
    } catch {
      setError("Save failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    const confirmed = window.confirm("Delete this news/event item?");
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/news-events/${editingId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed.");
        return;
      }

      setManagedItems((current) => current.filter((item) => item.id !== editingId));
      setEditorOpen(false);
      setEditingId(0);
      setForm(emptyForm());
      router.refresh();
    } catch {
      setError("Delete failed.");
    }
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setForm(formFromItem(item));
    setError("");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(0);
    setForm(emptyForm());
    setError("");
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
    <>
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
                placeholder="Search by title, summary, date, or keywords…"
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
              const needsLink = Boolean(item.href) && isSummaryTruncated(summary);
              const displayText = truncateSummary(summary);
              const badge = getBadgeForItem(item);

              const content = (
                <>
                  <div className="news-events-badge" aria-hidden>
                    <span>{badge.month}</span>
                    <strong>{badge.day}</strong>
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
                </>
              );

              if (isAdmin) {
                const overlayActive = overlayActiveId === item.id;
                return (
                  <button
                    key={`${item.href}-${item.id}`}
                    type="button"
                    className="news-events-item news-events-item--admin"
                    onClick={() => beginEdit(item)}
                    onMouseEnter={() => setOverlayActiveId(item.id)}
                    onMouseLeave={() => setOverlayActiveId((current) => (current === item.id ? null : current))}
                    onFocusCapture={() => setOverlayActiveId(item.id)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setOverlayActiveId((current) => (current === item.id ? null : current));
                      }
                    }}
                    aria-label={`Edit ${item.title}`}
                  >
                    {content}
                    <span
                      className="news-events-item__admin-overlay"
                      aria-hidden="true"
                      data-active={overlayActive ? "true" : "false"}
                    >
                      <span className="news-events-item__admin-overlay__wash">
                        {overlayActive ? (
                          <span
                            key={`${item.id}-${glassVariant}-${glassCycle}`}
                            className={`news-events-item__admin-overlay__glass news-events-item__admin-overlay__glass--${glassVariant}`}
                          />
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              }

              if (needsLink) {
                return (
                  <Link key={`${item.href}-${item.id}`} href={item.href} className="news-events-item">
                    {content}
                  </Link>
                );
              }

              return (
                <div key={`${item.href}-${item.id}`} className="news-events-item">
                  {content}
                </div>
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
            <p className="news-events-empty">
              {managedItems.length === 0 && !normalizedQuery
                ? "No news or events are available yet."
                : "No results found. Try a different keyword."}
            </p>
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <ModalLightbox open={editorOpen} onClose={closeEditor} closeLabel="Close news and events editor">
          <div className="news-events-editor-modal">
            <div className="news-events-editor-modal__header">
              <p className="gigs-admin__eyebrow">News &amp; Events</p>
              <h3>{editingId ? "Edit Item" : "Add Item"}</h3>
            </div>

            <form className="news-events-editor" onSubmit={handleSubmit}>
              <div className="news-events-editor__group">
                <label htmlFor="news-item-title">Title</label>
                <input
                  id="news-item-title"
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </div>

              <div className="news-events-editor__group">
                <label htmlFor="news-item-event-date">Event date</label>
                <div className="news-events-editor__date-input-wrap">
                  <input
                    id="news-item-event-date"
                    type="date"
                    value={form.eventDateIso}
                    onChange={(event) => {
                      const iso = event.target.value;
                      setForm((current) => ({
                        ...current,
                        eventDateIso: iso,
                        eventDateText: iso ? formatEventDateLineFromIso(iso) : "",
                      }));
                    }}
                  />
                  <span className="news-events-editor__date-icon" aria-hidden="true" />
                </div>
              </div>

              <div className="news-events-editor__group">
                <label htmlFor="news-item-listing-date">Listing date</label>
                <div className="news-events-editor__date-input-wrap">
                  <input
                    id="news-item-listing-date"
                    type="date"
                    value={form.listingDateIso}
                    onChange={(event) => {
                      const iso = event.target.value;
                      if (!iso) {
                        setForm((current) => ({
                          ...current,
                          listingDateIso: "",
                          badgeMonth: "",
                          badgeDay: "",
                        }));
                        return;
                      }
                      const { badgeMonth, badgeDay } = badgeFromListingIso(iso);
                      setForm((current) => ({
                        ...current,
                        listingDateIso: iso,
                        badgeMonth,
                        badgeDay,
                      }));
                    }}
                  />
                  <span className="news-events-editor__date-icon" aria-hidden="true" />
                </div>
              </div>

              <div className="news-events-editor__group news-events-editor__group--wide">
                <label htmlFor="news-item-summary">Summary</label>
                <textarea
                  id="news-item-summary"
                  rows="4"
                  value={form.summary}
                  onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                />
              </div>

              {error ? (
                <p className="news-events-editor__error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="news-events-editor__actions">
                {editingId ? (
                  <button
                    type="button"
                    className="btn btn-ghost news-events-editor__delete"
                    onClick={handleDelete}
                    disabled={saveBusy}
                  >
                    Delete Item
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost" onClick={closeEditor} disabled={saveBusy}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                  {saveBusy ? "Saving…" : editingId ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </>
  );
}
