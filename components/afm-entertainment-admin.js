"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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

function AdminOverlay({ ariaLabel, onOpen, disabled = false, className = "" }) {
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
    <button
      type="button"
      className={`recording-page-edit-overlay ${className}`.trim()}
      onClick={() => void onOpen()}
      onMouseEnter={() => setOverlayActive(true)}
      onMouseLeave={() => setOverlayActive(false)}
      onFocus={() => setOverlayActive(true)}
      onBlur={() => setOverlayActive(false)}
      aria-label={ariaLabel}
      data-active={overlayActive ? "true" : "false"}
      disabled={disabled}
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
  );
}

export function AfmEntertainmentAdmin({
  initialSourceHtml = "",
  initialScreenshotSrc = "/images/afm-entertainment-home-raw.png",
  displayHtml = "",
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftHtml, setDraftHtml] = useState(initialSourceHtml);
  const [draftScreenshotSrc, setDraftScreenshotSrc] = useState(initialScreenshotSrc);

  useEffect(() => {
    setDraftHtml(initialSourceHtml);
  }, [initialSourceHtml]);

  useEffect(() => {
    setDraftScreenshotSrc(initialScreenshotSrc);
  }, [initialScreenshotSrc]);

  const openEditor = useCallback(async () => {
    setLoadBusy(true);
    setError("");
    try {
      const [bodyRes, configRes] = await Promise.all([
        fetch("/api/site-page-body?route=%2Fafm-entertainment", { method: "GET", cache: "no-store" }),
        fetch("/api/site-config/afm-entertainment", { method: "GET", cache: "no-store" }),
      ]);
      const bodyData = await bodyRes.json().catch(() => ({}));
      const configData = await configRes.json().catch(() => ({}));
      if (!bodyRes.ok) {
        throw new Error(bodyData?.error || "Unable to load AFM Entertainment content.");
      }
      if (!configRes.ok) {
        throw new Error(configData?.error || "Unable to load AFM Entertainment image.");
      }
      setDraftHtml(String(bodyData.bodyHtml || ""));
      setDraftScreenshotSrc(String(configData.screenshotSrc || initialScreenshotSrc));
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load AFM Entertainment content.");
    } finally {
      setLoadBusy(false);
    }
  }, [initialScreenshotSrc]);

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      const [bodyRes, configRes] = await Promise.all([
        fetch("/api/site-page-body", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route: "/afm-entertainment", bodyHtml: draftHtml }),
        }),
        fetch("/api/site-config/afm-entertainment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshotSrc: draftScreenshotSrc }),
        }),
      ]);
      const bodyData = await bodyRes.json().catch(() => ({}));
      const configData = await configRes.json().catch(() => ({}));
      if (!bodyRes.ok) {
        throw new Error(bodyData?.error || "Save failed.");
      }
      if (!configRes.ok) {
        throw new Error(configData?.error || "Save failed.");
      }
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      showDbToastError("Database update failed.");
    } finally {
      setSaveBusy(false);
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
      const res = await fetch("/api/site-config/afm-entertainment/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed.");
      }
      setDraftScreenshotSrc(String(data.url || ""));
      showDbToastSuccess("Screenshot uploaded.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setError(message);
      showDbToastError("Database update failed.");
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <>
      <section className="afm-entertainment-promo-shell">
        <div className="afm-entertainment-promo">
          <div className="afm-entertainment-promo__copy afm-entertainment-promo__copy--admin">
            <div className="recording-page-editable recording-page-editable--content-fit afm-entertainment-promo__copy-editable">
              <div>
                <p className="afm-entertainment-promo__eyebrow">External booking resource</p>
                <div
                  className="afm-entertainment-promo__prose"
                  dangerouslySetInnerHTML={{ __html: displayHtml }}
                />
              </div>
              <AdminOverlay ariaLabel="Edit AFM Entertainment content" onOpen={openEditor} disabled={loadBusy} />
            </div>
          </div>

          <div className="afm-entertainment-promo__visual afm-entertainment-promo__visual--admin">
            <div className="recording-page-editable afm-entertainment-promo__image-editable">
              <div className="afm-entertainment-promo__frame">
                <Image
                  src={draftScreenshotSrc || initialScreenshotSrc}
                  alt="Preview of the AFM Entertainment website"
                  width={1600}
                  height={1600}
                  unoptimized
                />
              </div>
              <AdminOverlay
                ariaLabel="Edit AFM Entertainment screenshot"
                onOpen={openEditor}
                disabled={loadBusy}
                className="afm-entertainment-promo__image-overlay"
              />
            </div>
          </div>
        </div>
      </section>

      <ModalLightbox open={open} onClose={() => !saveBusy && !uploadBusy && setOpen(false)} closeLabel="Close AFM Entertainment editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">AFM Entertainment</p>
              <h3>Edit Promo Content</h3>
              <p className="recording-sidebar-modal__help">
                Update the promo copy and replace the screenshot used on this page.
              </p>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4 id="afm-entertainment-copy-label">Promo copy</h4>
              </div>
              <div className="recording-page-editor__richtext">
                <NewsEventsBodyEditor
                  value={draftHtml}
                  onChange={(value) => setDraftHtml(value)}
                  labelledBy="afm-entertainment-copy-label"
                />
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Screenshot image</h4>
              </div>
              <div className="recording-sidebar-form-grid">
                <label>
                  Screenshot image URL
                  <input
                    type="text"
                    value={draftScreenshotSrc}
                    onChange={(event) => setDraftScreenshotSrc(event.target.value)}
                    placeholder="/uploads/afm-entertainment/..."
                  />
                </label>
                <label>
                  Replace screenshot
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadBusy} />
                  <UploadFieldStatus
                    url={draftScreenshotSrc}
                    kind="image"
                    imageAlt="AFM Entertainment screenshot preview"
                    emptyLabel="No screenshot selected."
                  />
                </label>
              </div>
            </section>

            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy || uploadBusy}>
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
