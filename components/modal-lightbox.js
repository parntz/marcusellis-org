"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

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

  if (!open) return null;

  const innerClass =
    aspectRatio === "16/9"
      ? "modal-lightbox-inner modal-lightbox-inner--ratio-16x9"
      : aspectRatio === "pdf"
        ? "modal-lightbox-inner modal-lightbox-inner--ratio-pdf"
        : "modal-lightbox-inner";

  const modal = (
    <div className="modal-lightbox">
      <div className="modal-lightbox-stage">
        <div className={innerClass} role="dialog" aria-modal="true">
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
