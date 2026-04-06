"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) {
    el.textContent = String(value || "");
  }
}

export function MemberSiteLinksHeroAdmin({ initialConfig, children }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [eyebrow, setEyebrow] = useState(String(initialConfig?.eyebrow || ""));
  const [title, setTitle] = useState(String(initialConfig?.title || ""));
  const [body, setBody] = useState(String(initialConfig?.body || ""));
  const [statLabel, setStatLabel] = useState(String(initialConfig?.statLabel || ""));
  const [statBody, setStatBody] = useState(String(initialConfig?.statBody || ""));

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

  async function handleOpen() {
    setBusy(true);
    try {
      const res = await fetch("/api/site-config/member-site-links-hero", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load member directory intro.");
      }
      setEyebrow(String(data.eyebrow || ""));
      setTitle(String(data.title || ""));
      setBody(String(data.body || ""));
      setStatLabel(String(data.statLabel || ""));
      setStatBody(String(data.statBody || ""));
      setOpen(true);
    } catch {
      showDbToastError("Unable to load member directory intro.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/site-config/member-site-links-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eyebrow,
          title,
          body,
          statLabel,
          statBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showDbToastError(data?.error || "Database update failed.");
        return;
      }

      setText("[data-member-links-hero-eyebrow]", data.eyebrow);
      setText("[data-member-links-hero-title]", data.title);
      setText("[data-member-links-hero-body]", data.body);
      setText("[data-member-links-stat-label]", data.statLabel);
      setText("[data-member-links-stat-body]", data.statBody);
      setOpen(false);
      showDbToastSuccess();
    } catch {
      showDbToastError("Database update failed.");
    } finally {
      setBusy(false);
    }
  }

  const modal = open ? (
    <div className="page-header-editor-backdrop" role="presentation" onClick={() => !busy && setOpen(false)}>
      <div
        className="page-header-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit member directory intro"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="page-header-editor-modal__header">
          <p className="gigs-admin__eyebrow">Admin</p>
          <h3>Edit Member Directory Intro</h3>
        </div>
        <form className="page-header-editor-form" onSubmit={handleSave}>
          <label>
            Eyebrow
            <input type="text" value={eyebrow} onChange={(event) => setEyebrow(event.target.value)} maxLength={120} />
          </label>
          <label>
            Title
            <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} />
          </label>
          <label>
            Body
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} />
          </label>
          <label>
            Stat Label
            <input
              type="text"
              value={statLabel}
              onChange={(event) => setStatLabel(event.target.value)}
              maxLength={120}
            />
          </label>
          <label>
            Stat Body
            <textarea value={statBody} onChange={(event) => setStatBody(event.target.value)} rows={3} />
          </label>
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
      <div
        className="recording-page-editable recording-page-editable--member-links-hero"
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
          aria-label="Edit member directory intro"
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
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
