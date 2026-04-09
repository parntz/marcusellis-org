"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

/** Same hover glass + full-area click target as SitePageBodyAdmin / scales master list. */
function MemberServicePanelAdminShell({ children, onOpenEdit, overlayDisabled }) {
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
      {children}
      <button
        type="button"
        className="recording-page-edit-overlay"
        onClick={onOpenEdit}
        disabled={Boolean(overlayDisabled)}
        aria-label="Edit member service panel"
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
  );
}

function MegaCta({ action, variant = "solid" }) {
  const className =
    variant === "ghost"
      ? "member-services-mega__cta member-services-mega__cta--ghost"
      : "member-services-mega__cta";
  if (action.external) {
    return (
      <a className={className} href={action.href} target="_blank" rel="noopener noreferrer">
        {action.label}
      </a>
    );
  }
  return (
    <Link className={className} href={action.href}>
      {action.label}
    </Link>
  );
}

function emptyPanel() {
  return {
    kicker: "",
    title: "New member service",
    bodyHtml: "<p></p>",
    primaryLabel: "Learn more",
    primaryHref: "/",
    primaryExternal: false,
    secondaryLabel: "",
    secondaryHref: "",
    secondaryExternal: false,
  };
}

function panelToActions(panel) {
  const primary =
    panel.primaryLabel && panel.primaryHref
      ? {
          label: panel.primaryLabel,
          href: panel.primaryHref,
          external: panel.primaryExternal,
        }
      : null;
  const secondary =
    panel.secondaryLabel && panel.secondaryHref
      ? {
          label: panel.secondaryLabel,
          href: panel.secondaryHref,
          external: panel.secondaryExternal,
        }
      : null;
  return { primary, secondary };
}

function panelsForApi(panels) {
  return panels.map((p) => ({
    kicker: p.kicker ?? "",
    title: p.title ?? "",
    bodyHtml: p.bodyHtml ?? "",
    primaryLabel: p.primaryLabel ?? "",
    primaryHref: p.primaryHref ?? "",
    primaryExternal: Boolean(p.primaryExternal),
    secondaryLabel: p.secondaryLabel ?? "",
    secondaryHref: p.secondaryHref ?? "",
    secondaryExternal: Boolean(p.secondaryExternal),
  }));
}

export function MemberServicesPanelsColumn({ initialPanels = [], isAdmin }) {
  const router = useRouter();
  const [currentPanels, setCurrentPanels] = useState(initialPanels);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initialPanelsKey = useMemo(
    () => JSON.stringify(panelsForApi(Array.isArray(initialPanels) ? initialPanels : [])),
    [initialPanels]
  );

  useEffect(() => {
    setCurrentPanels((prev) => {
      const prevKey = JSON.stringify(panelsForApi(Array.isArray(prev) ? prev : []));
      return prevKey === initialPanelsKey ? prev : initialPanels;
    });
  }, [initialPanels, initialPanelsKey]);

  const closeModal = useCallback(() => {
    setEditingIndex(-1);
    setDraft(null);
    setIsCreating(false);
    setConfirmDelete(false);
    setError("");
  }, []);

  const openCreate = useCallback(() => {
    setIsCreating(true);
    setDraft(emptyPanel());
    setEditingIndex(currentPanels.length);
    setConfirmDelete(false);
    setError("");
  }, [currentPanels.length]);

  const openEdit = useCallback(
    (index) => {
      const row = currentPanels[index];
      if (!row) return;
      setIsCreating(false);
      setEditingIndex(index);
      setDraft({
        kicker: row.kicker ?? "",
        title: row.title ?? "",
        bodyHtml: row.bodyHtml ?? "<p></p>",
        primaryLabel: row.primaryLabel ?? "",
        primaryHref: row.primaryHref ?? "",
        primaryExternal: Boolean(row.primaryExternal),
        secondaryLabel: row.secondaryLabel ?? "",
        secondaryHref: row.secondaryHref ?? "",
        secondaryExternal: Boolean(row.secondaryExternal),
      });
      setConfirmDelete(false);
      setError("");
    },
    [currentPanels]
  );

  const persistPanels = useCallback(
    async (nextPanels) => {
      setSaveBusy(true);
      setError("");
      try {
        const res = await fetch("/api/site-config/member-services-panels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ panels: panelsForApi(nextPanels) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Save failed.");
        }
        setCurrentPanels(data.panels || nextPanels);
        showDbToastSuccess();
        router.refresh();
        closeModal();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed.";
        setError(msg);
        showDbToastError("Database update failed.");
      } finally {
        setSaveBusy(false);
      }
    },
    [closeModal, router]
  );

  const handleSaveForm = useCallback(
    async (event) => {
      event.preventDefault();
      if (!draft) return;

      let next = [...currentPanels];
      if (isCreating) {
        next.push({ ...draft });
      } else if (editingIndex >= 0 && editingIndex < next.length) {
        next[editingIndex] = { ...draft };
      } else {
        return;
      }
      await persistPanels(next);
    },
    [currentPanels, draft, editingIndex, isCreating, persistPanels]
  );

  const handleDelete = useCallback(async () => {
    if (isCreating || editingIndex < 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setError("");
      return;
    }
    const next = currentPanels.filter((_, i) => i !== editingIndex);
    await persistPanels(next);
  }, [confirmDelete, currentPanels, editingIndex, isCreating, persistPanels]);

  const modalOpen = Boolean(draft);

  return (
    <div className="member-services-hub-panels member-services-panels-column" role="list">
      {isAdmin ? (
        <div className="member-services-panels-admin__toolbar">
          <button type="button" className="recording-sidebar-add-panel__button eyebrow" onClick={openCreate}>
            ADD +
          </button>
        </div>
      ) : null}

      {currentPanels.length === 0 ? (
        <p className="member-services-panels-column__empty">No member service panels yet. Use ADD + to create one.</p>
      ) : null}

      {currentPanels.map((panel, i) => {
        const slug = `member-services-mega-${panel.id ?? i}`;
        const { primary, secondary } = panelToActions(panel);
        const rowKey = panel.id != null ? `id-${panel.id}` : `idx-${i}-${panel.title}`;
        const article = (
          <article
            className={`member-services-mega${i % 2 ? " member-services-mega--alt" : ""}`}
            role="listitem"
            aria-labelledby={`${slug}-title`}
          >
            <div className="member-services-mega__index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="member-services-mega__body">
              {panel.kicker ? <p className="member-services-mega__kicker">{panel.kicker}</p> : null}
              <h3 id={`${slug}-title`} className="member-services-mega__title">
                {panel.title || "Untitled"}
              </h3>
              <div
                className="member-services-mega__copy member-services-mega__copy--rich"
                dangerouslySetInnerHTML={{
                  __html: panel.bodyHtml || "",
                }}
              />
              <div className="member-services-mega__actions">
                {primary ? <MegaCta action={primary} /> : null}
                {secondary ? <MegaCta action={secondary} variant="ghost" /> : null}
              </div>
            </div>
          </article>
        );

        return (
          <Fragment key={rowKey}>
            {isAdmin ? (
              <MemberServicePanelAdminShell
                onOpenEdit={() => openEdit(i)}
                overlayDisabled={saveBusy && modalOpen}
              >
                {article}
              </MemberServicePanelAdminShell>
            ) : (
              article
            )}
          </Fragment>
        );
      })}

      {modalOpen && draft ? (
        <ModalLightbox
          open
          onClose={() => {
            if (!saveBusy) closeModal();
          }}
          closeLabel="Close member service editor"
        >
          <div className="recording-sidebar-modal">
            <div className="recording-sidebar-modal__header">
              <div>
                <p className="recording-sidebar-modal__eyebrow">Admin</p>
                <h3>{isCreating ? "Add member service" : "Edit member service"}</h3>
                <p className="recording-sidebar-modal__help">
                  Kicker, title, body, and one or two link buttons. Leave secondary labels blank for a single
                  button.
                </p>
              </div>
            </div>

            <form className="recording-sidebar-modal__form" onSubmit={handleSaveForm}>
              <section className="recording-sidebar-modal__section">
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Kicker</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.kicker}
                    onChange={(e) => setDraft((d) => ({ ...d, kicker: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Title</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    required
                    autoComplete="off"
                  />
                </label>
              </section>

              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head">
                  <h4 id="member-services-body-label">Body</h4>
                </div>
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor
                    value={draft.bodyHtml}
                    onChange={(html) => setDraft((d) => ({ ...d, bodyHtml: html }))}
                    labelledBy="member-services-body-label"
                  />
                </div>
              </section>

              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head">
                  <h4>Primary button</h4>
                </div>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Label</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.primaryLabel}
                    onChange={(e) => setDraft((d) => ({ ...d, primaryLabel: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">URL</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.primaryHref}
                    onChange={(e) => setDraft((d) => ({ ...d, primaryHref: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="recording-sidebar-modal__checkbox">
                  <input
                    type="checkbox"
                    checked={draft.primaryExternal}
                    onChange={(e) => setDraft((d) => ({ ...d, primaryExternal: e.target.checked }))}
                  />
                  <span>Open in new tab (external)</span>
                </label>
              </section>

              <section className="recording-sidebar-modal__section">
                <div className="recording-sidebar-modal__section-head">
                  <h4>Secondary button (optional)</h4>
                </div>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Label</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.secondaryLabel}
                    onChange={(e) => setDraft((d) => ({ ...d, secondaryLabel: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">URL</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.secondaryHref}
                    onChange={(e) => setDraft((d) => ({ ...d, secondaryHref: e.target.value }))}
                    autoComplete="off"
                  />
                </label>
                <label className="recording-sidebar-modal__checkbox">
                  <input
                    type="checkbox"
                    checked={draft.secondaryExternal}
                    onChange={(e) => setDraft((d) => ({ ...d, secondaryExternal: e.target.checked }))}
                  />
                  <span>Open in new tab (external)</span>
                </label>
              </section>

              {error ? (
                <p className="recording-sidebar-modal__error" role="alert">
                  {error}
                </p>
              ) : null}
              {!isCreating && confirmDelete ? (
                <p className="recording-sidebar-modal__danger-hint" role="alert">
                  Click delete again to remove this panel.
                </p>
              ) : null}

              <div className="recording-sidebar-modal__actions">
                {!isCreating ? (
                  <button
                    type="button"
                    className="recording-sidebar-modal__delete"
                    onClick={() => void handleDelete()}
                    disabled={saveBusy}
                  >
                    {confirmDelete ? "Confirm delete" : "Delete panel"}
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saveBusy}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                  {saveBusy ? "Saving…" : isCreating ? "Add panel" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </div>
  );
}
