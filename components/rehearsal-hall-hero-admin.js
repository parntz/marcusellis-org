"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { UploadFieldStatus } from "./upload-field-status";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

export function RehearsalHallHeroAdmin({ initialConfig, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [draft, setDraft] = useState(() => ({
    eyebrow: String(initialConfig?.eyebrow || ""),
    title: String(initialConfig?.title || ""),
    body: String(initialConfig?.body || ""),
    imageSrc: String(initialConfig?.imageSrc || ""),
    imageAlt: String(initialConfig?.imageAlt || ""),
  }));

  useEffect(() => {
    setDraft({
      eyebrow: String(initialConfig?.eyebrow || ""),
      title: String(initialConfig?.title || ""),
      body: String(initialConfig?.body || ""),
      imageSrc: String(initialConfig?.imageSrc || ""),
      imageAlt: String(initialConfig?.imageAlt || ""),
    });
  }, [initialConfig]);

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
        eyebrow: String(data.eyebrow || ""),
        title: String(data.title || ""),
        body: String(data.body || ""),
        imageSrc: String(data.imageSrc || ""),
        imageAlt: String(data.imageAlt || ""),
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

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setUploadBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/site-config/rehearsal-hall/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed.");
      }
      setDraft((current) => ({ ...current, imageSrc: String(data.url || "") }));
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/rehearsal-hall", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
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
        {children}
        <button
          type="button"
          className="recording-page-edit-overlay"
          onClick={handleOpen}
          aria-label="Edit rehearsal hall hero content"
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
              <h3>Edit Rehearsal Hall Hero</h3>
              <p className="recording-sidebar-modal__help">
                Plain text fields for the eyebrow, headline, and body copy. The image on the right is managed here
                too.
              </p>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
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
                    maxLength={180}
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Body
                  <textarea
                    value={draft.body}
                    onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                    rows={5}
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Image upload
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadBusy} />
                  <UploadFieldStatus
                    url={draft.imageSrc}
                    kind="image"
                    imageAlt="Rehearsal hall image preview"
                    emptyLabel="No image uploaded yet."
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Image alt text
                  <input
                    type="text"
                    value={draft.imageAlt}
                    onChange={(event) => setDraft((current) => ({ ...current, imageAlt: event.target.value }))}
                    maxLength={180}
                  />
                </label>
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
