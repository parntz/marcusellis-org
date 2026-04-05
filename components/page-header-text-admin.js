"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function normalizeRoute(pathname) {
  const p = String(pathname || "/").trim() || "/";
  if (p === "/") return p;
  return p.replace(/\/+$/, "") || "/";
}

export function PageHeaderTextAdmin({ route: routeProp = "" }) {
  const pathname = usePathname();
  const route = normalizeRoute(routeProp || pathname);

  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  const handleOpenEditor = useCallback(async () => {
    setToast(null);
    setBusy(true);
    try {
      const titleEl = document.querySelector("[data-page-header-title]");
      const descriptionEl = document.querySelector("[data-page-header-description]");
      const currentTitle = String(titleEl?.textContent || "").trim();
      const currentDescription = String(descriptionEl?.textContent || "").trim();
      const query = new URLSearchParams({
        route,
        title: currentTitle,
        description: currentDescription,
      });
      const res = await fetch(`/api/page-header?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load page header.");
      }
      setTitle(String(data.title || ""));
      setDescription(String(data.description || ""));
      setOpen(true);
    } catch (err) {
      setToast({
        variant: "error",
        message: err instanceof Error ? err.message : "Unable to load page header.",
      });
    } finally {
      setBusy(false);
    }
  }, [route]);

  useEffect(() => {
    const titleEl = document.querySelector("[data-page-header-title]");
    const descriptionEl = document.querySelector("[data-page-header-description]");
    const root = document.querySelector(".page-header-main__inner--admin-editable");
    if (!titleEl || !descriptionEl || !root) return undefined;

    titleEl.classList.add("page-header-admin-click-target");
    descriptionEl.classList.add("page-header-admin-click-target");

    const handleEnter = () => setOverlayActive(true);
    const handleLeave = () => setOverlayActive(false);
    const handleClick = () => {
      void handleOpenEditor();
    };

    root.addEventListener("mouseenter", handleEnter);
    root.addEventListener("mouseleave", handleLeave);
    titleEl.addEventListener("click", handleClick);
    descriptionEl.addEventListener("click", handleClick);

    return () => {
      root.removeEventListener("mouseenter", handleEnter);
      root.removeEventListener("mouseleave", handleLeave);
      titleEl.removeEventListener("click", handleClick);
      descriptionEl.removeEventListener("click", handleClick);
    };
  }, [handleOpenEditor]);

  async function handleSave(event) {
    event.preventDefault();
    setToast(null);
    setBusy(true);
    try {
      const res = await fetch("/api/page-header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          title,
          description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to save page header.");
      }

      const titleEl = document.querySelector("[data-page-header-title]");
      if (titleEl) {
        titleEl.textContent = String(data.title || "");
      }
      const descEl = document.querySelector("[data-page-header-description]");
      if (descEl) {
        descEl.textContent = String(data.description || "");
      }

      setOpen(false);
      setToast({ variant: "success", message: "Header updated in database." });
    } catch (err) {
      setToast({
        variant: "error",
        message: err instanceof Error ? err.message : "Unable to save page header.",
      });
    } finally {
      setBusy(false);
    }
  }

  const editorModal =
    open ? (
      <div className="page-header-editor-backdrop" role="presentation" onClick={() => !busy && setOpen(false)}>
        <div
          className="page-header-editor-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Edit page header"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="page-header-editor-modal__header">
            <p className="gigs-admin__eyebrow">Admin</p>
            <h3>Edit Page Header</h3>
          </div>
          <form className="page-header-editor-form" onSubmit={handleSave}>
            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={180}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>
            <div className="page-header-editor-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save Header"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        className="page-header-text-admin-overlay"
        data-active={overlayActive ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="page-header-text-admin-overlay__wash" aria-hidden="true">
          {overlayActive ? (
            <span
              key={`${glassVariant}-${glassCycle}`}
              className={`page-header-text-admin-overlay__glass page-header-text-admin-overlay__glass--${glassVariant}`}
            />
          ) : null}
        </span>
      </div>

      {mounted && toast
        ? createPortal(
            <div
              className="page-header-editor-toast-host"
              role={toast.variant === "error" ? "alert" : "status"}
              aria-live={toast.variant === "error" ? "assertive" : "polite"}
            >
              <div className={`page-header-editor-toast page-header-editor-toast--${toast.variant}`}>
                {toast.message}
              </div>
            </div>,
            document.body
          )
        : null}

      {mounted && editorModal ? createPortal(editorModal, document.body) : null}
    </>
  );
}
