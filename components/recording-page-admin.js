"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function getInitialDraft(initialConfig) {
  return {
    mainHtml: String(initialConfig?.mainHtml || ""),
    videoEmbedSrc: String(initialConfig?.videoEmbedSrc || ""),
    thumbnailSrc: String(initialConfig?.thumbnailSrc || ""),
    youtubeKicker: String(initialConfig?.youtubeKicker || ""),
    videoHeadline: String(initialConfig?.videoHeadline || ""),
  };
}

export function RecordingPageAdmin({ initialConfig, target = "main", children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [draft, setDraft] = useState(() => getInitialDraft(initialConfig));

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

  function openEditor() {
    setDraft(getInitialDraft(initialConfig));
    setError("");
    setOpen(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/recording-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error || "Save failed.";
        setError(message);
        showDbToastError("Database update failed.");
        return;
      }

      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch {
      setError("Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleThumbnailUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setUploadBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/site-config/recording-page/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error || "Upload failed.";
        setError(message);
        showDbToastError("Database update failed.");
        return;
      }
      if (data?.url) {
        setDraft((current) => ({ ...current, thumbnailSrc: String(data.url) }));
        showDbToastSuccess();
      }
    } catch {
      setError("Upload failed.");
      showDbToastError("Database update failed.");
    } finally {
      setUploadBusy(false);
    }
  }

  const showMainFields = target !== "video";
  const showVideoFields = target !== "main";
  const dialogTitle = target === "video" ? "Edit Recording Video" : target === "main" ? "Edit Recording Content" : "Edit Recording Page";
  const overlayLabel = target === "video" ? "Edit recording video" : "Edit recording content";

  return (
    <>
      <div
        className={`recording-page-editable recording-page-editable--${target}`}
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
          onClick={openEditor}
          aria-label={overlayLabel}
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

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close recording editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>{dialogTitle}</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            {showMainFields ? (
              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head">
                  <h4 id="recording-page-editor-main-label">Main content</h4>
                </div>
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor
                    value={draft.mainHtml}
                    onChange={(value) => setDraft((current) => ({ ...current, mainHtml: value }))}
                    labelledBy="recording-page-editor-main-label"
                  />
                </div>
              </section>
            ) : null}

            {showVideoFields ? (
              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head">
                  <h4>Video</h4>
                  <p className="recording-sidebar-modal__help">
                    Edit the address, thumbnail, kicker text, and video headline separately.
                  </p>
                </div>
                <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                  <label className="recording-sidebar-form-grid__wide">
                    YouTube address
                    <input
                      type="text"
                      value={draft.videoEmbedSrc}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, videoEmbedSrc: event.target.value }))
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                  <label className="recording-sidebar-form-grid__wide">
                    Thumbnail upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadBusy}
                    />
                  </label>
                  <label className="recording-sidebar-form-grid__wide">
                    Thumbnail URL
                    <input
                      type="text"
                      value={draft.thumbnailSrc}
                      onChange={(event) => setDraft((current) => ({ ...current, thumbnailSrc: event.target.value }))}
                      placeholder="/images/recording-thumb.jpg"
                    />
                  </label>
                  <label>
                    Kicker text
                    <input
                      type="text"
                      value={draft.youtubeKicker}
                      onChange={(event) => setDraft((current) => ({ ...current, youtubeKicker: event.target.value }))}
                      placeholder="YouTube video"
                    />
                  </label>
                  <label>
                    Video headline
                    <input
                      type="text"
                      value={draft.videoHeadline}
                      onChange={(event) => setDraft((current) => ({ ...current, videoHeadline: event.target.value }))}
                      placeholder="Single song overdub scale"
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {error ? (
              <p className="recording-sidebar-modal__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy || uploadBusy}>
                {saveBusy ? "Saving..." : uploadBusy ? "Uploading..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
