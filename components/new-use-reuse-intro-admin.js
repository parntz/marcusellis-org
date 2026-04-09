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

/** Left-column copy on /new-use-reuse (TipTap HTML, paragraphs + inline emphasis). */
export function NewUseReuseIntroAdmin({ initialIntroHtml }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(initialIntroHtml);
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);

  useEffect(() => {
    setDraft(initialIntroHtml);
  }, [initialIntroHtml]);

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

  const openEditor = useCallback(async () => {
    setLoadBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/new-use-reuse-intro", { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load intro copy.");
      }
      setDraft(String(data.introHtml || ""));
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load intro copy.");
    } finally {
      setLoadBusy(false);
    }
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/new-use-reuse-intro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ introHtml: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Save failed.");
      }
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <>
      <div
        className="recording-page-editable recording-page-editable--main"
        onMouseEnter={() => setOverlayActive(true)}
        onMouseLeave={() => setOverlayActive(false)}
        onFocusCapture={() => setOverlayActive(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOverlayActive(false);
          }
        }}
      >
        <div className="new-use-intro-copy" dangerouslySetInnerHTML={{ __html: initialIntroHtml }} />
        <button
          type="button"
          className="recording-page-edit-overlay"
          onClick={() => void openEditor()}
          disabled={loadBusy}
          aria-label="Edit New Use / Reuse intro copy"
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

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close intro editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit New Use / Reuse intro</h3>
              <p className="recording-sidebar-modal__help">
                Rich HTML for the column left of the form. The form fields are not edited here.
              </p>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4 id="new-use-reuse-intro-editor-label">Intro copy</h4>
              </div>
              <div className="recording-page-editor__richtext">
                <NewsEventsBodyEditor
                  value={draft}
                  onChange={(value) => setDraft(value)}
                  labelledBy="new-use-reuse-intro-editor-label"
                />
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
