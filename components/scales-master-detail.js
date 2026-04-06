"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanHref(value) {
  return String(value || "").trim();
}

function sortLinks(items) {
  return [...(items || [])].sort((a, b) => {
    const orderDiff = Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return cleanText(a.title).localeCompare(cleanText(b.title));
  });
}

function createDraft(item = {}, index = 0) {
  return {
    localId: String(item.localId || item.id || `${index}-${item.href || item.title || "link"}`),
    title: cleanText(item.title),
    href: cleanHref(item.href),
  };
}

function isDraftEmpty(item) {
  return !cleanText(item.title) && !cleanHref(item.href);
}

export function ScalesMasterDetail({ links = [], isAdmin = false }) {
  const router = useRouter();
  const items = sortLinks(links);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => sortLinks(links).map(createDraft));
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);
  const [draftCounter, setDraftCounter] = useState(() => links.length);
  const normalizedQuery = cleanText(query).toLowerCase();
  const filteredItems = hydrated && normalizedQuery
    ? items.filter((item) => cleanText(item.title).toLowerCase().includes(normalizedQuery))
    : items;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const nextItems = sortLinks(links);
    setDrafts(nextItems.map(createDraft));
    setDraftCounter(nextItems.length);
  }, [links]);

  useEffect(() => {
    if (!isAdmin || !overlayActive) return undefined;
    const trigger = () => {
      setGlassVariant((current) => pickRandomGlassVariant(current));
      setGlassCycle((current) => current + 1);
    };
    trigger();
    const id = window.setInterval(trigger, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, overlayActive]);

  function openEditor() {
    setDrafts(items.map(createDraft));
    setError("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saveBusy) return;
    setEditorOpen(false);
    setError("");
  }

  function updateDraft(localId, field, value) {
    setDrafts((current) =>
      current.map((item) => (item.localId === localId ? { ...item, [field]: value } : item))
    );
  }

  function addDraft() {
    setDraftCounter((current) => {
      const nextCounter = current + 1;
      setDrafts((existing) => [
        ...existing,
        {
          localId: `new-link-${nextCounter}`,
          title: "",
          href: "",
        },
      ]);
      return nextCounter;
    });
  }

  function removeDraft(localId) {
    setDrafts((current) => current.filter((item) => item.localId !== localId));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");

    const incomplete = drafts.find((item) => {
      if (isDraftEmpty(item)) return false;
      return !cleanText(item.title) || !cleanHref(item.href);
    });

    if (incomplete) {
      setError("Each link needs both a title and a destination URL.");
      setSaveBusy(false);
      return;
    }

    const payload = drafts
      .filter((item) => !isDraftEmpty(item))
      .map((item) => ({
        title: cleanText(item.title),
        href: cleanHref(item.href),
      }));

    try {
      const res = await fetch("/api/site-config/scales-forms-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Save failed.");
        showDbToastError("Database update failed.");
        return;
      }

      const nextItems = sortLinks(data?.items || payload);
      setDrafts(nextItems.map(createDraft));
      setEditorOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch {
      setError("Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  const content = (
    <div className="recording-scales-master">
      {hydrated ? (
        <div className="recording-scales-search">
          <label className="recording-scales-search__label" htmlFor="recording-scales-search-input">
            Search documents
          </label>
          <input
            id="recording-scales-search-input"
            type="search"
            className="recording-scales-search__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search scales, forms, agreements..."
          />
        </div>
      ) : null}

      <ul className="recording-scales-master-list">
        {filteredItems.map((item, idx) => (
          <li key={`${item.href}-${idx}`}>
            <a
              className="recording-scales-master-tab"
              href={item.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="recording-scales-master-tab-label">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
      {!items.length ? <p className="recording-scales-master-empty">No links have been added yet.</p> : null}
      {items.length && !filteredItems.length ? (
        <p className="recording-scales-master-empty">No documents match that search.</p>
      ) : null}
    </div>
  );

  return (
    <>
      {isAdmin ? (
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
          {content}
          <button
            type="button"
            className="recording-page-edit-overlay"
            onClick={openEditor}
            aria-label="Edit scales and forms links"
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
      ) : (
        content
      )}

      {isAdmin ? (
        <ModalLightbox open={editorOpen} onClose={closeEditor} closeLabel="Close scales and forms editor">
          <div className="recording-sidebar-modal recording-page-editor-modal">
            <div className="recording-sidebar-modal__header">
              <div>
                <p className="recording-sidebar-modal__eyebrow">Admin</p>
                <h3>Edit Scales and Forms Links</h3>
              </div>
            </div>

            <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                  <div>
                    <h4>Links</h4>
                    <p className="recording-sidebar-modal__help">
                      Add, remove, or rename the document links shown on this page. The list order matches the page.
                    </p>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={addDraft} disabled={saveBusy}>
                    Add Link
                  </button>
                </div>

                <div className="recording-sidebar-repeater">
                  {drafts.map((item, index) => (
                    <article key={item.localId} className="recording-sidebar-repeater__item">
                      <div className="recording-sidebar-repeater__header">
                        <strong>Link {index + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeDraft(item.localId)}
                          disabled={saveBusy}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="recording-sidebar-form-grid">
                        <label className="recording-sidebar-form-grid__wide">
                          Link Title
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) => updateDraft(item.localId, "title", event.target.value)}
                            placeholder="Master: Master Recording Scale - Effective Feb. 3, 2025"
                          />
                        </label>

                        <label className="recording-sidebar-form-grid__wide">
                          Destination URL
                          <input
                            type="text"
                            value={item.href}
                            onChange={(event) => updateDraft(item.localId, "href", event.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                      </div>
                    </article>
                  ))}

                  {!drafts.length ? (
                    <p className="recording-sidebar-modal__help">No links yet. Use Add Link to create the list.</p>
                  ) : null}
                </div>
              </section>

              {error ? (
                <p className="recording-sidebar-modal__error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="recording-sidebar-modal__actions">
                <button type="button" className="btn btn-ghost" onClick={closeEditor} disabled={saveBusy}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                  {saveBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </>
  );
}
