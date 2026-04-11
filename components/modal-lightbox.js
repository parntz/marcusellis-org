"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const VIDEO_LIGHTBOX_MARGIN_MIN = 10;
const VIDEO_LIGHTBOX_MARGIN_MAX = 24;
const VIDEO_LIGHTBOX_ASPECT_RATIO = 16 / 9;

function getVideoLightboxSize() {
  if (typeof window === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportMin = Math.min(viewportWidth, viewportHeight);
  const margin = Math.min(
    VIDEO_LIGHTBOX_MARGIN_MAX,
    Math.max(VIDEO_LIGHTBOX_MARGIN_MIN, viewportMin * 0.02),
  );
  const maxWidth = Math.max(0, viewportWidth - margin * 2);
  const maxHeight = Math.max(0, viewportHeight - margin * 2);

  let width = maxWidth;
  let height = width / VIDEO_LIGHTBOX_ASPECT_RATIO;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * VIDEO_LIGHTBOX_ASPECT_RATIO;
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

/**
 * Full-viewport dim + centered content stage.
 * Pass `aspectRatio="16/9"` for embedded video, or `aspectRatio="pdf"` for a large document iframe.
 */
export function ModalLightbox({
  open,
  onClose,
  children,
  closeLabel = "Close",
  aspectRatio = null,
  showCloseButton = true,
}) {
  const close = useCallback(() => onClose?.(), [onClose]);
  const [videoLightboxSize, setVideoLightboxSize] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || aspectRatio !== "16/9") return undefined;

    const updateVideoLightboxSize = () => {
      setVideoLightboxSize(getVideoLightboxSize());
    };

    updateVideoLightboxSize();
    window.addEventListener("resize", updateVideoLightboxSize);

    return () => {
      window.removeEventListener("resize", updateVideoLightboxSize);
    };
  }, [open, aspectRatio]);

  if (!open) return null;

  const innerClass =
    aspectRatio === "16/9"
      ? "modal-lightbox-inner modal-lightbox-inner--ratio-16x9"
      : aspectRatio === "pdf"
        ? "modal-lightbox-inner modal-lightbox-inner--ratio-pdf"
        : "modal-lightbox-inner";
  const innerStyle =
    aspectRatio === "16/9" && videoLightboxSize
      ? {
          width: `${videoLightboxSize.width}px`,
          height: `${videoLightboxSize.height}px`,
        }
      : undefined;

  const modal = (
    <div className="modal-lightbox">
      <div className="modal-lightbox-stage">
        <div className={innerClass} style={innerStyle} role="dialog" aria-modal="true">
          {showCloseButton ? (
            <button
              type="button"
              className="modal-lightbox-close"
              onClick={close}
              aria-label={closeLabel}
            >
              &times;
            </button>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
}
