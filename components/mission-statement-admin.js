"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";
import { parseMissionStatementBody, serializeMissionStatementBody } from "../lib/mission-statement-body.mjs";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function EditableShell({ children, onOpen, label, disabled = false }) {
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
        onClick={onOpen}
        aria-label={label}
        disabled={disabled}
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

function MissionFormField({ label, children, helpText }) {
  return (
    <label className="mission-statement-editor__field">
      <span className="mission-statement-editor__label">{label}</span>
      {children}
      {helpText ? <span className="mission-statement-editor__help">{helpText}</span> : null}
    </label>
  );
}

function MissionSectionModal({
  open,
  title,
  helpText,
  fields,
  onClose,
  onSave,
  saving,
  error,
}) {
  return (
    <ModalLightbox open={open} onClose={() => !saving && onClose()} closeLabel="Close mission editor">
      <div className="recording-sidebar-modal recording-page-editor-modal">
        <div className="recording-sidebar-modal__header">
          <div>
            <p className="recording-sidebar-modal__eyebrow">Admin</p>
            <h3>{title}</h3>
            <p className="recording-sidebar-modal__help">{helpText}</p>
          </div>
        </div>

        <form className="recording-sidebar-modal__form" onSubmit={onSave}>
          {fields}
          {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}
          <div className="recording-sidebar-modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </ModalLightbox>
  );
}

function MissionTextArea({ value, onChange, rows = 6, placeholder = "" }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
    />
  );
}

export function MissionStatementAdmin({ route, initialSourceHtml = "" }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => parseMissionStatementBody(initialSourceHtml));
  const [openSection, setOpenSection] = useState("");
  const [loadBusy, setLoadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(parseMissionStatementBody(initialSourceHtml));
  }, [initialSourceHtml]);

  const loadCurrentDraft = useCallback(async () => {
    const query = new URLSearchParams({ route });
    const res = await fetch(`/api/site-page-body?${query.toString()}`, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Unable to load mission statement.");
    }
    return parseMissionStatementBody(String(data.bodyHtml || ""));
  }, [route]);

  const openEditor = useCallback(
    async (section) => {
      setLoadBusy(true);
      setError("");
      try {
        const next = await loadCurrentDraft();
        setDraft(next);
        setOpenSection(section);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to load mission statement.";
        setError(message);
        showDbToastError(message);
      } finally {
        setLoadBusy(false);
      }
    },
    [loadCurrentDraft]
  );

  const closeEditor = useCallback(() => {
    if (saveBusy) return;
    setOpenSection("");
    setError("");
  }, [saveBusy]);

  const updateDraft = useCallback((updater) => {
    setDraft((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  const saveDraft = useCallback(
    async (event) => {
      event.preventDefault();
      setSaveBusy(true);
      setError("");
      try {
        const bodyHtml = serializeMissionStatementBody(draft);
        const res = await fetch("/api/site-page-body", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route, bodyHtml }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Save failed.");
        }
        setDraft(parseMissionStatementBody(String(data.bodyHtml || bodyHtml)));
        setOpenSection("");
        router.refresh();
        showDbToastSuccess();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed.";
        setError(message);
        showDbToastError("Database update failed.");
      } finally {
        setSaveBusy(false);
      }
    },
    [draft, route, router]
  );

  const hero = useMemo(
    () => (
      <EditableShell
        onOpen={() => void openEditor("hero")}
        label="Edit mission statement hero"
        disabled={loadBusy}
      >
        <div className="mission-page__hero">
          <p className="mission-page__eyebrow" data-mission-field="hero-eyebrow">
            {draft.eyebrow}
          </p>
          <h2 data-mission-field="hero-header">{draft.header}</h2>
          <p className="mission-page__lead" data-mission-field="hero-description">
            {draft.description}
          </p>
        </div>
      </EditableShell>
    ),
    [draft.description, draft.eyebrow, draft.header, openEditor, loadBusy]
  );

  const whySection = useMemo(
    () => (
      <EditableShell
        onOpen={() => void openEditor("why")}
        label="Edit mission statement first section"
        disabled={loadBusy}
      >
        <section className="mission-page__column" data-mission-field="why-section">
          <p className="mission-page__label">{draft.whyLabel}</p>
          <h3 data-mission-field="why-header">{draft.whyHeader}</h3>
          <div className="mission-page__list" dangerouslySetInnerHTML={{ __html: draft.whyHtml }} />
        </section>
      </EditableShell>
    ),
    [draft.whyHeader, draft.whyHtml, draft.whyLabel, openEditor, loadBusy]
  );

  const membershipSection = useMemo(
    () => (
      <EditableShell
        onOpen={() => void openEditor("membership")}
        label="Edit mission statement second section"
        disabled={loadBusy}
      >
        <section className="mission-page__column" data-mission-field="membership-section">
          <p className="mission-page__label">{draft.membershipLabel}</p>
          <h3 data-mission-field="membership-header">{draft.membershipHeader}</h3>
          <div className="mission-page__list" dangerouslySetInnerHTML={{ __html: draft.membershipHtml }} />
        </section>
      </EditableShell>
    ),
    [draft.membershipHeader, draft.membershipHtml, draft.membershipLabel, openEditor, loadBusy]
  );

  const actionSection = useMemo(
    () => (
      <EditableShell
        onOpen={() => void openEditor("action")}
        label="Edit mission statement action section"
        disabled={loadBusy}
      >
        <section className="mission-page__footer" data-mission-field="action-section">
          <p className="mission-page__label">{draft.actionLabel}</p>
          <h3 data-mission-field="action-header">{draft.actionHeader}</h3>
          <div
            className="mission-page__list mission-page__list--wide"
            dangerouslySetInnerHTML={{ __html: draft.actionHtml }}
          />
        </section>
      </EditableShell>
    ),
    [draft.actionHeader, draft.actionHtml, draft.actionLabel, openEditor, loadBusy]
  );

  const editor = (
    <>
      {openSection === "hero" ? (
        <MissionSectionModal
          open
          title="Edit mission statement hero"
          helpText="Plain text only. The hero should not use HTML."
          onClose={closeEditor}
          onSave={saveDraft}
          saving={saveBusy}
          error={error}
          fields={
            <>
              <MissionFormField label="Eyebrow" helpText="Short line above the headline.">
                <input
                  type="text"
                  value={draft.eyebrow}
                  onChange={(event) => updateDraft((current) => ({ ...current, eyebrow: event.target.value }))}
                  maxLength={120}
                />
              </MissionFormField>
              <MissionFormField label="Header" helpText="Main headline text.">
                <input
                  type="text"
                  value={draft.header}
                  onChange={(event) => updateDraft((current) => ({ ...current, header: event.target.value }))}
                  maxLength={220}
                />
              </MissionFormField>
              <MissionFormField label="Description" helpText="One or two sentences of plain text.">
                <MissionTextArea
                  value={draft.description}
                  onChange={(value) => updateDraft((current) => ({ ...current, description: value }))}
                  rows={5}
                />
              </MissionFormField>
            </>
          }
        />
      ) : null}

      {openSection === "why" ? (
        <MissionSectionModal
          open
          title="Edit mission statement first section"
          helpText="Use plain text for the header and HTML for the content."
          onClose={closeEditor}
          onSave={saveDraft}
          saving={saveBusy}
          error={error}
          fields={
            <>
              <MissionFormField label="Eyebrow" helpText="Short uppercase label above the section header.">
                <input
                  type="text"
                  value={draft.whyLabel}
                  onChange={(event) => updateDraft((current) => ({ ...current, whyLabel: event.target.value }))}
                  maxLength={120}
                />
              </MissionFormField>
              <MissionFormField label="Header" helpText="Section heading.">
                <input
                  type="text"
                  value={draft.whyHeader}
                  onChange={(event) => updateDraft((current) => ({ ...current, whyHeader: event.target.value }))}
                  maxLength={220}
                />
              </MissionFormField>
              <MissionFormField label="Content" helpText="HTML is allowed here for lists, paragraphs, and links.">
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor
                    value={draft.whyHtml}
                    onChange={(value) => updateDraft((current) => ({ ...current, whyHtml: value }))}
                    labelledBy=""
                  />
                </div>
              </MissionFormField>
            </>
          }
        />
      ) : null}

      {openSection === "membership" ? (
        <MissionSectionModal
          open
          title="Edit mission statement second section"
          helpText="Use plain text for the header and HTML for the content."
          onClose={closeEditor}
          onSave={saveDraft}
          saving={saveBusy}
          error={error}
          fields={
            <>
              <MissionFormField label="Eyebrow" helpText="Short uppercase label above the section header.">
                <input
                  type="text"
                  value={draft.membershipLabel}
                  onChange={(event) =>
                    updateDraft((current) => ({ ...current, membershipLabel: event.target.value }))
                  }
                  maxLength={120}
                />
              </MissionFormField>
              <MissionFormField label="Header" helpText="Section heading.">
                <input
                  type="text"
                  value={draft.membershipHeader}
                  onChange={(event) =>
                    updateDraft((current) => ({ ...current, membershipHeader: event.target.value }))
                  }
                  maxLength={220}
                />
              </MissionFormField>
              <MissionFormField label="Content" helpText="HTML is allowed here for lists, paragraphs, and links.">
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor
                    value={draft.membershipHtml}
                    onChange={(value) => updateDraft((current) => ({ ...current, membershipHtml: value }))}
                    labelledBy=""
                  />
                </div>
              </MissionFormField>
            </>
          }
        />
      ) : null}

      {openSection === "action" ? (
        <MissionSectionModal
          open
          title="Edit mission statement action section"
          helpText="Use plain text for the header and HTML for the content."
          onClose={closeEditor}
          onSave={saveDraft}
          saving={saveBusy}
          error={error}
          fields={
            <>
              <MissionFormField label="Eyebrow" helpText="Short uppercase label above the section header.">
                <input
                  type="text"
                  value={draft.actionLabel}
                  onChange={(event) => updateDraft((current) => ({ ...current, actionLabel: event.target.value }))}
                  maxLength={120}
                />
              </MissionFormField>
              <MissionFormField label="Header" helpText="Section heading.">
                <input
                  type="text"
                  value={draft.actionHeader}
                  onChange={(event) =>
                    updateDraft((current) => ({ ...current, actionHeader: event.target.value }))
                  }
                  maxLength={220}
                />
              </MissionFormField>
              <MissionFormField label="Content" helpText="HTML is allowed here for lists, paragraphs, and links.">
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor
                    value={draft.actionHtml}
                    onChange={(value) => updateDraft((current) => ({ ...current, actionHtml: value }))}
                    labelledBy=""
                  />
                </div>
              </MissionFormField>
            </>
          }
        />
      ) : null}
    </>
  );

  return (
    <>
      <section className="mission-page">
        {hero}
        <div className="mission-page__grid">
          {whySection}
          {membershipSection}
        </div>
        {actionSection}
      </section>
      {editor}
    </>
  );
}
