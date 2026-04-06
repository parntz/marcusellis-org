"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

export function MemberSiteLinksIntroAdmin({ defaultHtml = "" }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [html, setHtml] = useState(String(defaultHtml || ""));

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleOpen = useCallback(async () => {
    setBusy(true);
    try {
      const query = new URLSearchParams({ defaultHtml });
      const res = await fetch(`/api/site-config/member-site-links-intro?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load member site links intro.");
      }
      setHtml(String(data.html || ""));
      setOpen(true);
    } catch {
      showDbToastError("Unable to load member site links intro.");
    } finally {
      setBusy(false);
    }
  }, [defaultHtml]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/site-config/member-site-links-intro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          defaultHtml,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showDbToastError(data?.error || "Database update failed.");
        return;
      }

      const el = document.querySelector("[data-member-links-intro]");
      if (el) {
        el.innerHTML = String(data.html || "");
      }
      setOpen(false);
      showDbToastSuccess();
    } catch {
      showDbToastError("Database update failed.");
    } finally {
      setBusy(false);
    }
  }

  const modal = open ? (
    <div className="page-header-editor-backdrop" role="presentation">
      <div
        className="page-header-editor-modal page-header-editor-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Edit member site links intro"
      >
        <div className="page-header-editor-modal__header">
          <p className="gigs-admin__eyebrow">Admin</p>
          <h3>Edit Member Site Links Intro</h3>
        </div>
        <form className="page-header-editor-form" onSubmit={handleSave}>
          <div className="recording-page-editor__richtext">
            <NewsEventsBodyEditor
              value={html}
              onChange={setHtml}
              labelledBy=""
            />
          </div>
          <div className="page-header-editor-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save Intro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="recording-page-edit-overlay member-links-intro__admin-overlay"
        onClick={() => void handleOpen()}
        onMouseEnter={() => setOverlayActive(true)}
        onMouseLeave={() => setOverlayActive(false)}
        onFocus={() => setOverlayActive(true)}
        onBlur={() => setOverlayActive(false)}
        aria-label="Edit member site links intro"
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
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
