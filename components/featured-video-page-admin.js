"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { UploadFieldStatus } from "./upload-field-status";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

function getInitialDraft(initialConfig) {
  return {
    pageTitle: String(initialConfig?.pageTitle || ""),
    pageDescription: String(initialConfig?.pageDescription || ""),
    videoEmbedSrc: String(initialConfig?.videoEmbedSrc || ""),
    thumbnailSrc: String(initialConfig?.thumbnailSrc || ""),
  };
}

export function FeaturedVideoPageAdmin({ initialConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => getInitialDraft(initialConfig));

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
      const res = await fetch("/api/site-config/featured-video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Save failed.");
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
      const res = await fetch("/api/site-config/featured-video/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Upload failed.");
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

  return (
    <>
      <button type="button" className="btn btn-primary page-header-action-button" onClick={openEditor}>
        Edit Featured Video
      </button>

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close featured video editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Featured Video</p>
              <h3>Page Content</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Header</h4>
              </div>
              <div className="recording-sidebar-form-grid">
                <label>
                  Page title
                  <input
                    type="text"
                    value={draft.pageTitle}
                    onChange={(event) => setDraft((current) => ({ ...current, pageTitle: event.target.value }))}
                    placeholder="Featured Video"
                  />
                </label>
                <label>
                  Page description
                  <textarea
                    rows={4}
                    value={draft.pageDescription}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, pageDescription: event.target.value }))
                    }
                    placeholder="Watch the latest featured video."
                  />
                </label>
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Video</h4>
              </div>
              <div className="recording-sidebar-form-grid">
                <label>
                  Video URL
                  <input
                    type="text"
                    value={draft.videoEmbedSrc}
                    onChange={(event) => setDraft((current) => ({ ...current, videoEmbedSrc: event.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </label>
                <label>
                  Optional thumbnail
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploadBusy} />
                  <UploadFieldStatus
                    url={draft.thumbnailSrc}
                    kind="image"
                    imageAlt="Featured video thumbnail preview"
                    emptyLabel="No thumbnail uploaded."
                  />
                </label>
              </div>
            </section>

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
