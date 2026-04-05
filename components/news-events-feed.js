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

function emptyForm() {
  return {
    title: "",
    itemType: "news",
    eventDateText: "",
    badgeMonth: "",
    badgeDay: "",
    summary: "",
    href: "/news-and-events/",
    metaDescription: "",
    bodyHtml: "",
  };
}

function formFromItem(item) {
  return {
    title: String(item.title || ""),
    itemType: String(item.itemType || "news"),
    eventDateText: String(item.eventDateText || ""),
    badgeMonth: String(item.badgeMonth || ""),
    badgeDay: String(item.badgeDay || ""),
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
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
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
                        <span
                          key={`${item.id}-${glassVariant}-${glassCycle}`}
                          className={`news-events-item__admin-overlay__glass news-events-item__admin-overlay__glass--${glassVariant}`}
                        />
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
                <label htmlFor="news-item-type">Type</label>
                <input
                  id="news-item-type"
                  type="text"
                  value={form.itemType}
                  onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value }))}
                  placeholder="news, event, archive, notice"
                />
              </div>

              <div className="news-events-editor__group">
                <label htmlFor="news-item-date">Event Date Text</label>
                <input
                  id="news-item-date"
                  type="text"
                  value={form.eventDateText}
                  onChange={(event) => setForm((current) => ({ ...current, eventDateText: event.target.value }))}
                  placeholder="Friday, April 10, 7 PM"
                />
              </div>

              <div className="news-events-editor__group news-events-editor__group--badge">
                <label htmlFor="news-item-badge-month">Badge</label>
                <div className="news-events-editor__badge-row">
                  <input
                    id="news-item-badge-month"
                    type="text"
                    value={form.badgeMonth}
                    onChange={(event) => setForm((current) => ({ ...current, badgeMonth: event.target.value }))}
                    placeholder="APR"
                  />
                  <input
                    id="news-item-badge-day"
                    type="text"
                    value={form.badgeDay}
                    onChange={(event) => setForm((current) => ({ ...current, badgeDay: event.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="news-events-editor__group news-events-editor__group--wide">
                <label htmlFor="news-item-href">Link / Route</label>
                <input
                  id="news-item-href"
                  type="text"
                  value={form.href}
                  onChange={(event) => setForm((current) => ({ ...current, href: event.target.value }))}
                  placeholder="/news-and-events/my-story or https://example.com"
                  required
                />
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

              <div className="news-events-editor__group news-events-editor__group--wide">
                <label htmlFor="news-item-meta">Meta Description</label>
                <input
                  id="news-item-meta"
                  type="text"
                  value={form.metaDescription}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, metaDescription: event.target.value }))
                  }
                  placeholder="Optional SEO description for internal detail pages"
                />
              </div>

              <div className="news-events-editor__group news-events-editor__group--wide">
                <label htmlFor="news-item-body">Detail Body HTML</label>
                <textarea
                  id="news-item-body"
                  rows="10"
                  value={form.bodyHtml}
                  onChange={(event) => setForm((current) => ({ ...current, bodyHtml: event.target.value }))}
                  placeholder="Used when the route is an internal /news-and-events/... or /event/... page."
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
