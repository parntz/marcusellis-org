"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

export function RehearsalHallSectionAdmin({
  initialConfig,
  children,
  mode = "section",
  featureIndex = -1,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [draft, setDraft] = useState(() => ({
    sectionEyebrow: String(initialConfig?.sectionEyebrow || ""),
    sectionTitle: String(initialConfig?.sectionTitle || ""),
    featureTitle: String(initialConfig?.features?.[featureIndex]?.title || ""),
    featureBody: String(initialConfig?.features?.[featureIndex]?.body || ""),
  }));

  useEffect(() => {
    setDraft({
      sectionEyebrow: String(initialConfig?.sectionEyebrow || ""),
      sectionTitle: String(initialConfig?.sectionTitle || ""),
      featureTitle: String(initialConfig?.features?.[featureIndex]?.title || ""),
      featureBody: String(initialConfig?.features?.[featureIndex]?.body || ""),
    });
  }, [featureIndex, initialConfig]);

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

  async function handleOpen() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/rehearsal-hall", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load rehearsal hall content.");
      }
      setDraft({
        sectionEyebrow: String(data.sectionEyebrow || ""),
        sectionTitle: String(data.sectionTitle || ""),
        featureTitle: String(data.features?.[featureIndex]?.title || ""),
        featureBody: String(data.features?.[featureIndex]?.body || ""),
      });
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load rehearsal hall content.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload =
        mode === "section"
          ? {
              sectionEyebrow: draft.sectionEyebrow,
              sectionTitle: draft.sectionTitle,
            }
          : {
              features: (initialConfig?.features || []).map((feature, index) =>
                index === featureIndex
                  ? { title: draft.featureTitle, body: draft.featureBody }
                  : feature
              ),
            };

      const res = await fetch("/api/site-config/rehearsal-hall", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Save failed.");
      }
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  const dialogTitle =
    mode === "section" ? "Edit Rehearsal Hall Section" : `Edit Rehearsal Hall Card ${featureIndex + 1}`;
  const overlayLabel =
    mode === "section" ? "Edit rehearsal hall feature section" : `Edit rehearsal hall feature card ${featureIndex + 1}`;

  return (
    <>
      <div
        className={`recording-page-editable ${mode === "section" ? "recording-page-editable--content-fit" : "recording-page-editable--main"}`}
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
          onClick={handleOpen}
          aria-label={overlayLabel}
          data-active={overlayActive ? "true" : "false"}
          disabled={busy}
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

      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close rehearsal hall editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>{dialogTitle}</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                {mode === "section" ? (
                  <>
                    <label>
                      Eyebrow
                      <input
                        type="text"
                        value={draft.sectionEyebrow}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sectionEyebrow: event.target.value }))
                        }
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Title
                      <input
                        type="text"
                        value={draft.sectionTitle}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sectionTitle: event.target.value }))
                        }
                        maxLength={180}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Card title
                      <input
                        type="text"
                        value={draft.featureTitle}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, featureTitle: event.target.value }))
                        }
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Card body
                      <textarea
                        value={draft.featureBody}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, featureBody: event.target.value }))
                        }
                        rows={4}
                      />
                    </label>
                  </>
                )}
              </div>
            </section>

            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
