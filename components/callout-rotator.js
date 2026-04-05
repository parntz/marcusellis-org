"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";

const SLIDE_DURATION_MS = 320;
const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function createDraft(item = {}, index = 0) {
  return {
    localId:
      item.localId ||
      item.slug ||
      `callout-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    slug: String(item.slug || ""),
    title: String(item.title || ""),
    body: String(item.body || ""),
    ctaLabel: String(item.ctaLabel || ""),
    ctaHref: String(item.ctaHref || ""),
    location: String(item.location || "header"),
    displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : index + 1,
    isActive: item.isActive !== false,
  };
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isDraftEmpty(item) {
  return !String(item.slug || "").trim() &&
    !String(item.title || "").trim() &&
    !String(item.body || "").trim() &&
    !String(item.ctaLabel || "").trim() &&
    !String(item.ctaHref || "").trim();
}

function toPayload(item, index, location = "header") {
  const title = String(item.title || "").trim();
  return {
    slug: String(item.slug || "").trim() || slugify(title),
    title,
    body: String(item.body || "").trim(),
    ctaLabel: String(item.ctaLabel || "").trim(),
    ctaHref: String(item.ctaHref || "").trim(),
    location,
    displayOrder: index + 1,
    isActive: Boolean(item.isActive),
  };
}

function normalizeDelaySeconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 8;
  }
  return Math.max(2, Math.min(20, Math.round(number)));
}

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function MemberNoticeEditor({
  open,
  onClose,
  initialItems = [],
  initialConfig = { delaySeconds: 8 },
  location = "header",
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(() => initialItems.map(createDraft));
  const [delaySeconds, setDelaySeconds] = useState(() => normalizeDelaySeconds(initialConfig?.delaySeconds));
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingFocusId, setPendingFocusId] = useState("");

  useEffect(() => {
    if (!open) {
      setDrafts(initialItems.map(createDraft));
      setDelaySeconds(normalizeDelaySeconds(initialConfig?.delaySeconds));
      setError("");
      setPendingFocusId("");
    }
  }, [initialConfig?.delaySeconds, initialItems, open]);

  function updateDraft(localId, field, value) {
    setDrafts((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, [field]: value };
        if (field === "title" && !String(item.slug || "").trim()) {
          next.slug = slugify(value);
        }
        return next;
      })
    );
  }

  function addDraft() {
    setDrafts((current) => {
      const nextDraft = createDraft(
        {
          location,
          displayOrder: current.length
            ? Math.max(...current.map((item) => Number(item.displayOrder) || 0)) + 1
            : 1,
          isActive: true,
        },
        current.length
      );
      setPendingFocusId(nextDraft.localId);
      return [...current, nextDraft];
    });
  }

  function removeDraft(localId) {
    setDrafts((current) => current.filter((item) => item.localId !== localId));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");

    const payload = drafts
      .filter((item) => !isDraftEmpty(item))
      .map((item, index) => toPayload(item, index, location));

    try {
      const res = await fetch("/api/site-config/callouts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          items: payload,
          config: {
            delaySeconds,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed.");
        return;
      }

      router.refresh();
      onClose?.();
    } catch {
      setError("Save failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  useEffect(() => {
    if (!open || !pendingFocusId) return undefined;

    const selector = `[data-callout-local-id="${pendingFocusId}"]`;
    const id = window.requestAnimationFrame(() => {
      const section = document.querySelector(selector);
      if (!(section instanceof HTMLElement)) return;
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const titleInput = section.querySelector('input[type="text"]');
      if (titleInput instanceof HTMLInputElement) {
        titleInput.focus();
      }
      setPendingFocusId("");
    });

    return () => window.cancelAnimationFrame(id);
  }, [drafts, open, pendingFocusId]);

  return (
    <ModalLightbox open={open} onClose={onClose} closeLabel="Close member notice editor">
      <div className="callout-admin-modal">
        <div className="callout-admin-modal__header">
          <div>
            <p className="callout-admin-modal__eyebrow">Admin</p>
            <h3>Edit Member Notices</h3>
          </div>
          <div className="callout-admin-modal__controls">
            <label className="callout-admin-delay">
              <span>Seconds Between Notices</span>
              <div className="callout-admin-delay__controls">
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  aria-label="Seconds between member notices"
                  value={delaySeconds}
                  onChange={(event) => setDelaySeconds(normalizeDelaySeconds(event.target.value))}
                  disabled={saveBusy}
                />
                <strong>{delaySeconds} sec</strong>
              </div>
            </label>
            <button type="button" className="btn btn-primary" onClick={addDraft} disabled={saveBusy}>
              Add Notice
            </button>
          </div>
        </div>

        <form className="callout-admin-form" onSubmit={handleSave}>
          <div className="callout-admin-list">
            {drafts.length ? (
              drafts.map((item, index) => (
                <section key={item.localId} className="callout-admin-item" data-callout-local-id={item.localId}>
                  <div className="callout-admin-item__header">
                    <div>
                      <p className="callout-admin-item__eyebrow">Notice {index + 1}</p>
                      <h4>{item.title || "Untitled member notice"}</h4>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeDraft(item.localId)}
                      disabled={saveBusy}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="callout-admin-grid">
                    <label className="callout-admin-toggle">
                      <span>Active</span>
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(event) => updateDraft(item.localId, "isActive", event.target.checked)}
                      />
                    </label>

                    <label className="callout-admin-grid__wide">
                      Title
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) => updateDraft(item.localId, "title", event.target.value)}
                      />
                    </label>

                    <label className="callout-admin-grid__wide">
                      Body
                      <textarea
                        rows="4"
                        value={item.body}
                        onChange={(event) => updateDraft(item.localId, "body", event.target.value)}
                      />
                    </label>

                    <label>
                      CTA Label
                      <input
                        type="text"
                        value={item.ctaLabel}
                        onChange={(event) => updateDraft(item.localId, "ctaLabel", event.target.value)}
                      />
                    </label>

                    <label className="callout-admin-grid__wide">
                      CTA Href
                      <input
                        type="text"
                        value={item.ctaHref}
                        onChange={(event) => updateDraft(item.localId, "ctaHref", event.target.value)}
                      />
                    </label>
                  </div>
                </section>
              ))
            ) : (
              <div className="callout-admin-empty">
                <p>No member notices yet.</p>
                <p>Add the first one from here.</p>
              </div>
            )}
          </div>

          {error ? (
            <p className="callout-admin-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="callout-admin-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saveBusy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saveBusy}>
              {saveBusy ? "Saving..." : "Save Notices"}
            </button>
          </div>
        </form>
      </div>
    </ModalLightbox>
  );
}

function CalloutSlide({ item, isAdmin = false, state = "active", direction = 1 }) {
  return (
    <div
      className={`callout-slide callout-slide--${state}`}
      data-direction={direction > 0 ? "forward" : "backward"}
      aria-hidden={state === "leaving" ? "true" : undefined}
    >
      <div className="callout-card-main">
        <p className="callout-kicker">Member Notice</p>
        <h3>{item.title}</h3>
        <p className="callout-body">{item.body}</p>
      </div>
      {isAdmin ? (
        <div className="callout-link-rail" aria-hidden="true">
          <span className="callout-link-rail__icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 20h9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="callout-link-rail__label">Edit Notices</span>
        </div>
      ) : (
        <a href={item.ctaHref} className="callout-link-rail" target="_blank" rel="noreferrer">
          <span className="callout-link-rail__icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="callout-link-rail__label">{item.ctaLabel}</span>
        </a>
      )}
    </div>
  );
}

export function CalloutRotator({
  items = [],
  intervalMs = 8000,
  isAdmin = false,
  adminItems = [],
  initialConfig = { delaySeconds: 8 },
}) {
  const [active, setActive] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [transition, setTransition] = useState(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const displayItems = items.length ? items : isAdmin ? adminItems : items;

  const fallbackItem = useMemo(
    () => ({
      title: "No member notices yet",
      body: "Click here in admin mode to add the first member notice.",
      ctaLabel: "Edit Notices",
      ctaHref: "#",
    }),
    []
  );

  useEffect(() => {
    if (active >= displayItems.length) {
      setActive(0);
    }
  }, [active, displayItems.length]);

  useEffect(() => {
    if (!transition) return undefined;
    const id = window.setTimeout(() => setTransition(null), SLIDE_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [transition]);

  const goToIndex = useCallback(
    (nextIndex, direction = 1) => {
      if (transition || displayItems.length < 2 || nextIndex === active) {
        return;
      }

      setTransition({
        from: active,
        direction: direction > 0 ? 1 : -1,
        key: `${active}-${nextIndex}-${Date.now()}`,
      });
      setActive(nextIndex);
    },
    [active, displayItems.length, transition]
  );

  useEffect(() => {
    if (displayItems.length < 2 || transition) return undefined;
    const id = window.setInterval(() => {
      goToIndex((active + 1) % displayItems.length, 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, displayItems.length, goToIndex, intervalMs, transition]);

  const triggerGlassEffect = useCallback(() => {
    setGlassVariant((current) => pickRandomGlassVariant(current));
    setGlassCycle((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !overlayActive) return undefined;
    triggerGlassEffect();
    const id = window.setInterval(triggerGlassEffect, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, overlayActive, triggerGlassEffect]);

  if (!displayItems.length && !isAdmin) return null;
  const item = displayItems[active] || fallbackItem;
  const leavingItem =
    transition && displayItems[transition.from] ? displayItems[transition.from] : null;
  const indicatorItems = displayItems.length ? displayItems : isAdmin ? [fallbackItem] : [];

  return (
    <>
      <aside className={`callout-rotator${isAdmin ? " callout-rotator--admin" : ""}`} aria-live="polite">
        <div
          className="callout-card"
          onMouseEnter={isAdmin ? () => setOverlayActive(true) : undefined}
          onMouseLeave={isAdmin ? () => setOverlayActive(false) : undefined}
          onFocusCapture={isAdmin ? () => setOverlayActive(true) : undefined}
          onBlurCapture={
            isAdmin
              ? (event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOverlayActive(false);
                  }
                }
              : undefined
          }
        >
          {indicatorItems.length > 1 ? (
            <div className="callout-indicators" aria-label="Member notice slides">
              {indicatorItems.map((notice, index) => (
                <button
                  key={notice.slug || notice.title || index}
                  type="button"
                  className={`callout-indicator${index === active ? " is-active" : ""}`}
                  onClick={() => goToIndex(index, index > active ? 1 : -1)}
                  aria-label={`Show member notice ${index + 1}`}
                  aria-pressed={index === active}
                />
              ))}
            </div>
          ) : (
            <div className="callout-indicators callout-indicators--single" aria-hidden="true">
              <span className="callout-indicator is-active" />
            </div>
          )}

          <div className="callout-slide-viewport">
            {leavingItem ? (
              <CalloutSlide
                key={`leaving-${transition.key}`}
                item={leavingItem}
                isAdmin={isAdmin}
                state="leaving"
                direction={transition.direction}
              />
            ) : null}

            <CalloutSlide
              key={`active-${item.slug || item.title || active}-${transition?.key || "steady"}`}
              item={item}
              isAdmin={isAdmin}
              state={transition ? "entering" : "active"}
              direction={transition?.direction || 1}
            />
          </div>

          {isAdmin ? (
            <button
              type="button"
              className="callout-admin-overlay"
              onClick={() => setEditorOpen(true)}
              aria-label="Edit member notices"
              data-active={overlayActive ? "true" : "false"}
            >
              <span className="callout-admin-overlay__wash" aria-hidden="true">
                {overlayActive ? (
                  <span
                    key={`${glassVariant}-${glassCycle}`}
                    className={`callout-admin-overlay__glass callout-admin-overlay__glass--${glassVariant}`}
                  />
                ) : null}
              </span>
            </button>
          ) : null}
        </div>
      </aside>

      {isAdmin ? (
        <MemberNoticeEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialItems={adminItems}
          initialConfig={initialConfig}
          location="header"
        />
      ) : null}
    </>
  );
}
