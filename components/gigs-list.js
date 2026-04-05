/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NEWS_CAL_FIXED_MIN_WIDTH = 861;
const newsCalMqString = `(min-width: ${NEWS_CAL_FIXED_MIN_WIDTH}px)`;
const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
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

function buildCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const days = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push({ key: `empty-${index}`, dateKey: "", label: "", isCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = new Date();
    days.push({
      key: `${year}-${month + 1}-${day}`,
      dateKey,
      label: String(day),
      isCurrentMonth: true,
      isToday:
        dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getDate() === today.getDate(),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      key: `trailing-${days.length}`,
      dateKey: "",
      label: "",
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return days;
}

function getGigHeadline(gig) {
  return gig.bandName || gig.artists?.join(", ") || gig.locationName || "Gig";
}

function getGigSupportLine(gig) {
  if (!gig.bandName || !gig.artists?.length) {
    return "";
  }

  const artistsLine = gig.artists.join(", ");
  return artistsLine.toLowerCase() === gig.bandName.toLowerCase() ? "" : artistsLine;
}

function normalizeDateRange(startKey = "", endKey = "") {
  if (!startKey && !endKey) {
    return { startKey: "", endKey: "" };
  }

  const safeStart = startKey || endKey;
  const safeEnd = endKey || startKey;
  if (!safeStart || !safeEnd) {
    return { startKey: "", endKey: "" };
  }

  return safeStart <= safeEnd
    ? { startKey: safeStart, endKey: safeEnd }
    : { startKey: safeEnd, endKey: safeStart };
}

function isDateKeyInRange(dateKey = "", range) {
  if (!dateKey || !range?.startKey || !range?.endKey) return false;
  return dateKey >= range.startKey && dateKey <= range.endKey;
}

function buildGigSearchText(gig) {
  return [
    gig.id,
    gig.startAt,
    gig.endAt,
    gig.dateLabel,
    gig.locationName,
    gig.locationAddress,
    gig.bandName,
    gig.googlePlaceId,
    gig.notes,
    gig.imageUrl,
    gig.mapHref,
    ...(Array.isArray(gig.artists) ? gig.artists : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function GigsList({ gigs = [], isAdmin = false, onEditGig = null }) {
  const [query, setQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState({ startKey: "", endKey: "" });
  const [dragRange, setDragRange] = useState({ startKey: "", endKey: "" });
  const [dragStartKey, setDragStartKey] = useState("");
  const [hoveredDateKey, setHoveredDateKey] = useState("");
  const [mounted, setMounted] = useState(false);
  const [calendarDate, setCalendarDate] = useState(null);
  const [calendarPositionReady, setCalendarPositionReady] = useState(false);
  const [overlayActiveId, setOverlayActiveId] = useState(null);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const calendarAsideRef = useRef(null);
  const calLayoutObserverRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const isDraggingDateRange = Boolean(dragStartKey);

  const calendarPortaledToBody = useSyncExternalStore(
    subscribeNewsCalWideMq,
    getNewsCalWideSnapshot,
    getNewsCalWideServerSnapshot
  );

  useEffect(() => {
    setMounted(true);
    setCalendarDate(new Date());
  }, []);

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
      const gigsMain = document.querySelector(".gigs-calendar-layout .gigs-main");
      const alignTop = gigsMain ? Math.ceil(gigsMain.getBoundingClientRect().top) : headerBottom;
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

    const main = document.querySelector(".gigs-calendar-layout .gigs-main");
    if (typeof ResizeObserver !== "undefined" && main) {
      const ro = new ResizeObserver(() => schedule());
      ro.observe(main);
      calLayoutObserverRef.current = ro;
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

  const gigDateKeys = useMemo(() => {
    const keys = new Set();
    for (const gig of gigs) {
      const dateKey = String(gig.startAt || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        keys.add(dateKey);
      }
    }
    return keys;
  }, [gigs]);

  const filteredGigs = useMemo(() => {
    if (!normalizedQuery) return gigs;
    return gigs.filter((gig) => buildGigSearchText(gig).includes(normalizedQuery));
  }, [gigs, normalizedQuery]);

  const visibleGigs = useMemo(() => {
    if (!selectedDateRange.startKey || !selectedDateRange.endKey) return filteredGigs;
    return filteredGigs.filter((gig) => {
      const dateKey = String(gig.startAt || "").slice(0, 10);
      return isDateKeyInRange(dateKey, selectedDateRange);
    });
  }, [filteredGigs, selectedDateRange]);

  const commitDateRange = useCallback((startKey, endKey) => {
    const nextRange = normalizeDateRange(startKey, endKey);
    if (!nextRange.startKey) return;
    setSelectedDateRange(nextRange);
    setDragRange({ startKey: "", endKey: "" });
    setDragStartKey("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!isDraggingDateRange) return undefined;

    const finishDrag = () => {
      setDragStartKey((currentStartKey) => {
        if (!currentStartKey) return "";

        setDragRange((currentRange) => {
          const nextRange = normalizeDateRange(
            currentStartKey,
            currentRange.endKey || currentRange.startKey || currentStartKey
          );
          if (nextRange.startKey) {
            setSelectedDateRange(nextRange);
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }
          return { startKey: "", endKey: "" };
        });

        return "";
      });
    };

    window.addEventListener("pointerup", finishDrag);
    return () => window.removeEventListener("pointerup", finishDrag);
  }, [isDraggingDateRange]);

  if (!gigs.length) {
    return (
      <section className="page-content gigs-empty-state">
        <h2>Upcoming Gigs</h2>
        <p>No upcoming gigs have been posted yet.</p>
      </section>
    );
  }

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
      aria-label="Gig calendar filter"
    >
      <div className="news-events-calendar">
        <p className="news-events-calendar-kicker">Calendar</p>
        <div className="news-events-calendar-head">
          <div className="gigs-calendar-head-row">
            <h3>{monthLabel}</h3>
            <button
              type="button"
              className="gigs-calendar-clear-date"
              onClick={() => {
                setSelectedDateRange({ startKey: "", endKey: "" });
                setDragRange({ startKey: "", endKey: "" });
                setDragStartKey("");
              }}
              disabled={!selectedDateRange.startKey}
            >
              Clear Date
            </button>
          </div>
          {todayLabel ? <p>{todayLabel}</p> : null}
        </div>
        <div className="news-events-calendar-weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="news-events-calendar-grid">
          {calendarDays.map((day) => {
            const hasGigs = day.dateKey ? gigDateKeys.has(day.dateKey) : false;
            const activeRange =
              dragRange.startKey && dragRange.endKey ? dragRange : selectedDateRange;
            const isInRange = day.dateKey ? isDateKeyInRange(day.dateKey, activeRange) : false;
            const isRangeStart = Boolean(day.dateKey && activeRange.startKey === day.dateKey);
            const isRangeEnd = Boolean(day.dateKey && activeRange.endKey === day.dateKey);
            const isSingleSelected = isRangeStart && isRangeEnd;
            const isHovered = Boolean(day.dateKey && hoveredDateKey === day.dateKey);
            return (
              <button
                key={day.key}
                type="button"
                className={[
                  "news-events-calendar-day",
                  day.isCurrentMonth ? "is-current-month" : "is-outside-month",
                  hasGigs ? "is-has-gigs" : "",
                  isInRange ? "is-selected" : "",
                  isRangeStart ? "is-range-start" : "",
                  isRangeEnd ? "is-range-end" : "",
                  isSingleSelected ? "is-single-selected" : "",
                  isHovered ? "is-hovered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPointerDown={(event) => {
                  if (!day.isCurrentMonth || !day.dateKey) return;
                  event.preventDefault();
                  setDragStartKey(day.dateKey);
                  setDragRange({ startKey: day.dateKey, endKey: day.dateKey });
                  setHoveredDateKey(day.dateKey);
                }}
                onPointerEnter={() => {
                  if (!day.isCurrentMonth || !day.dateKey) return;
                  setHoveredDateKey(day.dateKey);
                  if (!dragStartKey) return;
                  setDragRange(normalizeDateRange(dragStartKey, day.dateKey));
                }}
                onPointerUp={() => {
                  if (!day.isCurrentMonth || !day.dateKey) return;
                  if (dragStartKey) {
                    commitDateRange(dragStartKey, day.dateKey);
                    return;
                  }
                  commitDateRange(day.dateKey, day.dateKey);
                }}
                onMouseLeave={() => {
                  if (hoveredDateKey === day.dateKey) {
                    setHoveredDateKey("");
                  }
                }}
                onFocus={() => {
                  if (day.dateKey) {
                    setHoveredDateKey(day.dateKey);
                  }
                }}
                onBlur={() => {
                  if (hoveredDateKey === day.dateKey) {
                    setHoveredDateKey("");
                  }
                }}
                aria-label={
                  day.dateKey
                    ? `Filter gigs for ${day.dateKey}${hasGigs ? " (has gigs)" : ""}`
                    : "No date"
                }
                aria-pressed={isInRange}
                disabled={!day.isCurrentMonth || !day.dateKey}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="news-events-feed gigs-calendar-layout">
      {portaledToBody ? createPortal(calendarAside, document.body) : calendarAside}
      <div className="news-events-main gigs-main">
        <div className="news-events-search">
          <label htmlFor="gigs-search-input">Search Gigs</label>
          <div className="news-events-search-row">
            <input
              id="gigs-search-input"
              type="search"
              value={query}
              onChange={(event) => {
                setSelectedDateRange({ startKey: "", endKey: "" });
                setDragRange({ startKey: "", endKey: "" });
                setDragStartKey("");
                setQuery(event.target.value);
              }}
              placeholder="Search venue, address, artists, notes, date, or place ID..."
            />
            {query ? (
              <button type="button" className="news-events-search-clear" onClick={() => setQuery("")}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <section className="gigs-grid" aria-label="Upcoming gigs">
          {visibleGigs.map((gig) => {
            const headline = getGigHeadline(gig);
            const supportLine = getGigSupportLine(gig);

            const cardContent = (
              <>
                <div className="gig-card__media">
                  {gig.imageUrl ? (
                    <img
                      src={gig.imageUrl}
                      alt={`${gig.locationName || "Gig"} poster`}
                      className="gig-card__image"
                    />
                  ) : (
                    <div className="gig-card__image gig-card__image--placeholder" aria-hidden="true" />
                  )}
                </div>

                <div className="gig-card__body">
                  <h2 className="gig-card__title">{headline}</h2>
                  {supportLine ? <p className="gig-card__support">{supportLine}</p> : null}
                  <p className="gig-card__date">{gig.dateLabel}</p>
                  <p className="gig-card__venue">{gig.locationName}</p>
                  {!isAdmin ? <p className="gig-card__hint">Open details</p> : null}
                </div>
              </>
            );

            if (isAdmin) {
              const overlayActive = overlayActiveId === gig.id;
              return (
                <button
                  key={gig.id}
                  type="button"
                  className="gig-card gig-card--admin"
                  onClick={() => onEditGig?.(gig)}
                  onMouseEnter={() => setOverlayActiveId(gig.id)}
                  onMouseLeave={() => setOverlayActiveId((current) => (current === gig.id ? null : current))}
                  onFocusCapture={() => setOverlayActiveId(gig.id)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setOverlayActiveId((current) => (current === gig.id ? null : current));
                    }
                  }}
                  aria-label={`Edit ${headline || "gig"}`}
                >
                  {cardContent}
                  <span
                    className="gig-card__admin-overlay"
                    aria-hidden="true"
                    data-active={overlayActive ? "true" : "false"}
                  >
                    <span className="gig-card__admin-overlay__wash">
                      <span
                        key={`${gig.id}-${glassVariant}-${glassCycle}`}
                        className={`gig-card__admin-overlay__glass gig-card__admin-overlay__glass--${glassVariant}`}
                      />
                    </span>
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={gig.id}
                href={`/gigs/${gig.id}`}
                className="gig-card gig-card--link"
                aria-label={`Open details for ${headline || "gig"}`}
              >
                {cardContent}
              </Link>
            );
          })}
        </section>

        {visibleGigs.length === 0 ? (
          <p className="news-events-empty">No gigs match this filter yet. Try a different keyword or date.</p>
        ) : null}
      </div>
    </div>
  );
}
