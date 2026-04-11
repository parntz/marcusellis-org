"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { UploadFieldStatus } from "./upload-field-status";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

export function PhotoGalleryItemAdmin({ item, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [draft, setDraft] = useState(() => ({
    title: String(item?.title || ""),
    descriptionHtml: String(item?.descriptionHtml || ""),
    mediaType: String(item?.mediaType || "image"),
    imageUrl: String(item?.imageUrl || ""),
    imageAlt: String(item?.imageAlt || ""),
    videoUrl: String(item?.videoUrl || ""),
    isPublished: item?.isPublished !== false,
  }));

  useEffect(() => {
    setDraft({
      title: String(item?.title || ""),
      descriptionHtml: String(item?.descriptionHtml || ""),
      mediaType: String(item?.mediaType || "image"),
      imageUrl: String(item?.imageUrl || ""),
      imageAlt: String(item?.imageAlt || ""),
      videoUrl: String(item?.videoUrl || ""),
      isPublished: item?.isPublished !== false,
    });
  }, [item]);

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
      const res = await fetch(`/api/site-config/photo-gallery/items/${item.id}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load gallery item.");
      }
      setDraft({
        title: String(data.title || ""),
        descriptionHtml: String(data.descriptionHtml || ""),
        mediaType: String(data.mediaType || "image"),
        imageUrl: String(data.imageUrl || ""),
        imageAlt: String(data.imageAlt || ""),
        videoUrl: String(data.videoUrl || ""),
        isPublished: data.isPublished !== false,
      });
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load gallery item.";
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
      const res = await fetch("/api/site-config/photo-gallery/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed.");
      }
      setDraft((current) => ({ ...current, imageUrl: String(data.url || "") }));
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
      const res = await fetch(`/api/site-config/photo-gallery/items/${item.id}`, {
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
          aria-label={`Edit gallery item ${item?.title || ""}`}
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

      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close gallery item editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit Gallery Item</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Title
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    maxLength={240}
                  />
                </label>
                <label>
                  Media type
                  <select
                    value={draft.mediaType}
                    onChange={(event) => setDraft((current) => ({ ...current, mediaType: event.target.value }))}
                  >
                    <option value="image">Photo</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  <span id="photo-gallery-description-label">Description HTML</span>
                  <div className="recording-page-editor__richtext">
                    <NewsEventsBodyEditor
                      value={draft.descriptionHtml}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, descriptionHtml: value }))
                      }
                      labelledBy="photo-gallery-description-label"
                    />
                  </div>
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Image upload
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadBusy} />
                  <UploadFieldStatus
                    url={draft.imageUrl}
                    kind="image"
                    imageAlt="Gallery image preview"
                    emptyLabel="No image uploaded yet."
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Image alt text
                  <input
                    type="text"
                    value={draft.imageAlt}
                    onChange={(event) => setDraft((current) => ({ ...current, imageAlt: event.target.value }))}
                    maxLength={240}
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Video embed URL
                  <input
                    type="text"
                    value={draft.videoUrl}
                    onChange={(event) => setDraft((current) => ({ ...current, videoUrl: event.target.value }))}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide recording-sidebar-form-check">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))}
                  />
                  Published
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
