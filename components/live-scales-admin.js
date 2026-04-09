"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function LiveScalesEditableShell({ children, onOpen, disabled = false, label, contentFit = false }) {
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);

  useEffect(() => {
    if (!overlayActive) return undefined;
    const trigger = () => {
      setGlassVariant((current) => pickRandomGlassVariant(current));
      setGlassCycle((current) => current + 1);
    };
    trigger();
    const id = window.setInterval(trigger, 5000);
    return () => window.clearInterval(id);
  }, [overlayActive]);

  return (
    <div
      className={`recording-page-editable ${contentFit ? "recording-page-editable--content-fit" : "recording-page-editable--main"}`}
      onMouseEnter={() => setOverlayActive(true)}
      onMouseLeave={() => setOverlayActive(false)}
      onFocusCapture={() => setOverlayActive(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOverlayActive(false);
        }
      }}
    >
      {children}
      <button
        type="button"
        className="recording-page-edit-overlay"
        onClick={onOpen}
        disabled={disabled}
        aria-label={label}
        data-active={overlayActive ? "true" : "false"}
      >
        <span className="recording-page-edit-overlay__wash" aria-hidden="true">
          {overlayActive ? (
            <span
              key={`${glassVariant}-${glassCycle}`}
              className={`recording-page-edit-overlay__glass recording-page-edit-overlay__glass--${glassVariant}`}
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}

async function fetchLiveScalesConfig() {
  const res = await fetch("/api/site-config/live-scales", { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Unable to load live scales content.");
  }
  return data;
}

async function saveLiveScalesPatch(patch) {
  const res = await fetch("/api/site-config/live-scales", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Save failed.");
  }
  return data;
}

export function LiveScalesLeadAdmin({ initialHtml = "", children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(initialHtml);

  useEffect(() => {
    setDraft(initialHtml);
  }, [initialHtml]);

  const handleOpen = useCallback(async () => {
    setLoadBusy(true);
    setError("");
    try {
      const data = await fetchLiveScalesConfig();
      setDraft(String(data?.leadHtml || ""));
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load intro copy.";
      setError(message);
      showDbToastError(message);
    } finally {
      setLoadBusy(false);
    }
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      await saveLiveScalesPatch({ leadHtml: draft });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <>
      <LiveScalesEditableShell onOpen={() => void handleOpen()} disabled={loadBusy} label="Edit live scales intro">
        {children}
      </LiveScalesEditableShell>

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close intro editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit live scales intro</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-page-editor__richtext">
                <NewsEventsBodyEditor value={draft} onChange={setDraft} labelledBy="live-scales-intro-editor-label" />
              </div>
            </section>

            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                {saveBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

export function LiveScalesSectionAdmin({ section, initialSection, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    eyebrow: String(initialSection?.eyebrow || ""),
    title: String(initialSection?.title || ""),
    description: String(initialSection?.description || ""),
  });

  useEffect(() => {
    setDraft({
      eyebrow: String(initialSection?.eyebrow || ""),
      title: String(initialSection?.title || ""),
      description: String(initialSection?.description || ""),
    });
  }, [initialSection]);

  const handleOpen = useCallback(async () => {
    setLoadBusy(true);
    setError("");
    try {
      const data = await fetchLiveScalesConfig();
      const next = data?.[section] || {};
      setDraft({
        eyebrow: String(next.eyebrow || ""),
        title: String(next.title || ""),
        description: String(next.description || ""),
      });
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load section.";
      setError(message);
      showDbToastError(message);
    } finally {
      setLoadBusy(false);
    }
  }, [section]);

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      await saveLiveScalesPatch({
        [section]: {
          eyebrow: draft.eyebrow,
          title: draft.title,
          description: draft.description,
        },
      });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setSaveBusy(false);
    }
  }

  const title = section === "downloads" ? "Edit downloads section" : "Edit live department guide section";

  return (
    <>
      <LiveScalesEditableShell
        onOpen={() => void handleOpen()}
        disabled={loadBusy}
        label={title}
        contentFit
      >
        {children}
      </LiveScalesEditableShell>

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close section editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>{title}</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                <label>
                  Eyebrow
                  <input
                    type="text"
                    value={draft.eyebrow}
                    onChange={(event) => setDraft((current) => ({ ...current, eyebrow: event.target.value }))}
                    maxLength={120}
                  />
                </label>
                <label>
                  Title
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    maxLength={200}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                  />
                </label>
              </div>
            </section>

            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                {saveBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

export function LiveScalesItemAdmin({ section, index, initialItem, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(() => ({
    kicker: String(initialItem?.kicker || ""),
    title: String(initialItem?.title || ""),
    summary: String(initialItem?.summary || ""),
    href: String(initialItem?.href || ""),
    linkLabel: String(initialItem?.linkLabel || ""),
    description: String(initialItem?.description || ""),
  }));

  useEffect(() => {
    setDraft({
      kicker: String(initialItem?.kicker || ""),
      title: String(initialItem?.title || ""),
      summary: String(initialItem?.summary || ""),
      href: String(initialItem?.href || ""),
      linkLabel: String(initialItem?.linkLabel || ""),
      description: String(initialItem?.description || ""),
    });
  }, [initialItem]);

  const handleOpen = useCallback(async () => {
    setLoadBusy(true);
    setError("");
    try {
      const data = await fetchLiveScalesConfig();
      const currentItems = Array.isArray(data?.[section]?.items) ? data[section].items : [];
      const item = currentItems[index] || {};
      setItems(currentItems);
      setDraft({
        kicker: String(item.kicker || ""),
        title: String(item.title || ""),
        summary: String(item.summary || ""),
        href: String(item.href || ""),
        linkLabel: String(item.linkLabel || ""),
        description: String(item.description || ""),
      });
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load callout.";
      setError(message);
      showDbToastError(message);
    } finally {
      setLoadBusy(false);
    }
  }, [index, section]);

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      const nextItems = [...items];
      nextItems[index] =
        section === "downloads"
          ? {
              kicker: draft.kicker,
              title: draft.title,
              summary: draft.summary,
              href: draft.href,
              linkLabel: draft.linkLabel,
            }
          : {
              title: draft.title,
              description: draft.description,
            };
      await saveLiveScalesPatch({
        [section]: {
          items: nextItems,
        },
      });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setSaveBusy(false);
    }
  }

  const title =
    section === "downloads" ? `Edit download card ${index + 1}` : `Edit guide card ${index + 1}`;

  return (
    <>
      <LiveScalesEditableShell onOpen={() => void handleOpen()} disabled={loadBusy} label={title}>
        {children}
      </LiveScalesEditableShell>

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close card editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>{title}</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                {section === "downloads" ? (
                  <>
                    <label>
                      Eyebrow
                      <input
                        type="text"
                        value={draft.kicker}
                        onChange={(event) => setDraft((current) => ({ ...current, kicker: event.target.value }))}
                        maxLength={80}
                      />
                    </label>
                    <label>
                      Title
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        maxLength={180}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={draft.summary}
                        onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                        rows={4}
                      />
                    </label>
                    <label>
                      PDF link
                      <input
                        type="url"
                        value={draft.href}
                        onChange={(event) => setDraft((current) => ({ ...current, href: event.target.value }))}
                      />
                    </label>
                    <label>
                      Link label
                      <input
                        type="text"
                        value={draft.linkLabel}
                        onChange={(event) => setDraft((current) => ({ ...current, linkLabel: event.target.value }))}
                        maxLength={80}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Title
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        maxLength={180}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, description: event.target.value }))
                        }
                        rows={5}
                      />
                    </label>
                  </>
                )}
              </div>
            </section>

            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                {saveBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
