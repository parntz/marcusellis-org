"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function cleanText(value) {
  return String(value || "").trim();
}

function emptyForm() {
  return {
    title: "",
    subtitle: "",
    href: "",
  };
}

function formFromLink(link) {
  return {
    title: cleanText(link.title),
    subtitle: cleanText(link.subtitle),
    href: cleanText(link.href),
  };
}

function sortLinks(items) {
  return [...items].sort((a, b) => {
    const orderDiff = Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

export function MemberSiteLinksDirectory({ initialLinks = [], isAdmin = false }) {
  const router = useRouter();
  const [links, setLinks] = useState(() => sortLinks(initialLinks));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(0);
  const [form, setForm] = useState(() => emptyForm());
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [overlayActiveId, setOverlayActiveId] = useState(null);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);

  useEffect(() => {
    setLinks(sortLinks(initialLinks));
  }, [initialLinks]);

  const triggerGlassEffect = useCallback(() => {
    setGlassVariant((current) => pickRandomGlassVariant(current));
    setGlassCycle((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !overlayActiveId) return undefined;
    triggerGlassEffect();
    const id = window.setInterval(triggerGlassEffect, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, overlayActiveId, triggerGlassEffect]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    function handleCreate() {
      setEditingId(0);
      setForm(emptyForm());
      setError("");
      setEditorOpen(true);
    }

    window.addEventListener("member-site-links:create", handleCreate);
    return () => window.removeEventListener("member-site-links:create", handleCreate);
  }, [isAdmin]);

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(0);
    setForm(emptyForm());
    setError("");
  }

  function beginEdit(link) {
    setEditingId(link.id);
    setForm(formFromLink(link));
    setError("");
    setEditorOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");

    try {
      const url = editingId ? `/api/member-site-links/${editingId}` : "/api/member-site-links";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) {
        setError(data.error || "Save failed.");
        return;
      }

      setLinks((current) => {
        const next = editingId
          ? current.map((item) => (item.id === data.link.id ? data.link : item))
          : [...current, data.link];
        return sortLinks(next);
      });
      closeEditor();
      router.refresh();
    } catch {
      setError("Save failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    const confirmed = window.confirm("Delete this site link?");
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/member-site-links/${editingId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed.");
        return;
      }

      setLinks((current) => current.filter((item) => item.id !== editingId));
      closeEditor();
      router.refresh();
    } catch {
      setError("Delete failed.");
    }
  }

  return (
    <>
      <div className="member-links-grid">
        {links.map((item) => {
          const cardContent = (
            <>
              <span className="member-links-card-domain">{item.domain || "member site"}</span>
              <h3>{item.title}</h3>
              {item.subtitle ? <p>{item.subtitle}</p> : <p>Open member website</p>}
              <span className="member-links-card-link">{isAdmin ? "Edit link" : "Visit site"}</span>
            </>
          );

          if (isAdmin) {
            const overlayActive = overlayActiveId === item.id;
            return (
              <button
                key={`${item.id}-${item.href}`}
                type="button"
                className="member-links-card member-links-card--admin"
                onClick={() => beginEdit(item)}
                onMouseEnter={() => setOverlayActiveId(item.id)}
                onMouseLeave={() => setOverlayActiveId((current) => (current === item.id ? null : current))}
                onFocusCapture={() => setOverlayActiveId(item.id)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOverlayActiveId((current) => (current === item.id ? null : current));
                  }
                }}
                aria-label={`Edit ${item.title}`}
              >
                {cardContent}
                <span
                  className="member-links-card__admin-overlay"
                  aria-hidden="true"
                  data-active={overlayActive ? "true" : "false"}
                >
                  <span className="member-links-card__admin-overlay__wash">
                    {overlayActive ? (
                      <span
                        key={`${item.id}-${glassVariant}-${glassCycle}`}
                        className={`member-links-card__admin-overlay__glass member-links-card__admin-overlay__glass--${glassVariant}`}
                      />
                    ) : null}
                  </span>
                </span>
              </button>
            );
          }

          return (
            <a
              key={`${item.id || item.title}-${item.href}`}
              href={item.href}
              className="member-links-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              {cardContent}
            </a>
          );
        })}
      </div>

      {isAdmin && !links.length ? (
        <p className="member-links-empty">No site links yet. Use the add button in the page header to create one.</p>
      ) : null}

      {isAdmin ? (
        <ModalLightbox open={editorOpen} onClose={closeEditor} closeLabel="Close member site link editor">
          <div className="member-links-editor-modal">
            <div className="member-links-editor-modal__header">
              <p className="gigs-admin__eyebrow">Member Site Links</p>
              <h3>{editingId ? "Edit Site Link" : "Add Site Link"}</h3>
            </div>

            <form className="member-links-editor" onSubmit={handleSubmit}>
              <div className="member-links-editor__group">
                <label htmlFor="member-link-title">Member Name / Title</label>
                <input
                  id="member-link-title"
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Brett Mason"
                  required
                />
              </div>

              <div className="member-links-editor__group">
                <label htmlFor="member-link-subtitle">Subtitle</label>
                <input
                  id="member-link-subtitle"
                  type="text"
                  value={form.subtitle}
                  onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
                  placeholder="Open member website"
                />
              </div>

              <div className="member-links-editor__group member-links-editor__group--wide">
                <label htmlFor="member-link-href">Website URL</label>
                <input
                  id="member-link-href"
                  type="url"
                  value={form.href}
                  onChange={(event) => setForm((current) => ({ ...current, href: event.target.value }))}
                  placeholder="https://example.com/"
                  required
                />
              </div>

              {error ? (
                <p className="member-links-editor__error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="member-links-editor__actions">
                {editingId ? (
                  <button
                    type="button"
                    className="btn btn-ghost member-links-editor__delete"
                    onClick={handleDelete}
                    disabled={saveBusy}
                  >
                    Delete Link
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost" onClick={closeEditor} disabled={saveBusy}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                  {saveBusy ? "Saving…" : editingId ? "Update Link" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </>
  );
}
