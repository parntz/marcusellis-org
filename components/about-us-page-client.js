"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickGlassVariant(current) {
  const options = GLASS_VARIANTS.filter((v) => v !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function AdminOverlay({ children, onOpenEdit, label = "Edit", disabled }) {
  const [active, setActive] = useState(false);
  const [glass, setGlass] = useState(GLASS_VARIANTS[0]);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const trigger = () => {
      setGlass((g) => pickGlassVariant(g));
      setCycle((c) => c + 1);
    };
    trigger();
    const id = window.setInterval(trigger, 5000);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div
      className="recording-page-editable recording-page-editable--main"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
      }}
    >
      {children}
      <button
        type="button"
        className="recording-page-edit-overlay"
        onClick={onOpenEdit}
        disabled={Boolean(disabled)}
        aria-label={label}
        data-active={active ? "true" : "false"}
      >
        <span className="recording-page-edit-overlay__wash" aria-hidden="true">
          {active ? (
            <span
              key={`${glass}-${cycle}`}
              className={`recording-page-edit-overlay__glass recording-page-edit-overlay__glass--${glass}`}
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}

function renderNames(namesStr) {
  return (namesStr || "")
    .split(/\n/)
    .map((n) => n.trim())
    .filter(Boolean)
    .join(", ");
}

export function AboutUsPageClient({ initialIntro, initialStaff, isAdmin }) {
  const router = useRouter();

  const [intro, setIntro] = useState(initialIntro);
  const [staff, setStaff] = useState(initialStaff);

  /* ── Intro editing ──────────────────────────────────────────── */
  const [introModalOpen, setIntroModalOpen] = useState(false);
  const [introDraft, setIntroDraft] = useState("");
  const [introSaving, setIntroSaving] = useState(false);
  const [introError, setIntroError] = useState("");

  const openIntroEdit = useCallback(() => {
    setIntroDraft(intro);
    setIntroError("");
    setIntroModalOpen(true);
  }, [intro]);

  const closeIntroModal = useCallback(() => {
    setIntroModalOpen(false);
    setIntroDraft("");
    setIntroError("");
  }, []);

  const saveIntro = useCallback(
    async (e) => {
      e.preventDefault();
      setIntroSaving(true);
      setIntroError("");
      try {
        const res = await fetch("/api/site-config/about-us-intro", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: introDraft }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Save failed.");
        setIntro(data.body || introDraft);
        showDbToastSuccess();
        router.refresh();
        closeIntroModal();
      } catch (err) {
        setIntroError(err instanceof Error ? err.message : "Save failed.");
        showDbToastError("Database update failed.");
      } finally {
        setIntroSaving(false);
      }
    },
    [introDraft, closeIntroModal, router]
  );

  /* ── Staff editing ──────────────────────────────────────────── */
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const staffModalOpen = Boolean(draft);

  const closeStaffModal = useCallback(() => {
    setEditingIndex(-1);
    setDraft(null);
    setIsCreating(false);
    setConfirmDelete(false);
    setStaffError("");
  }, []);

  const openCreate = useCallback(() => {
    setIsCreating(true);
    setDraft({ role: "", names: "" });
    setEditingIndex(staff.length);
    setConfirmDelete(false);
    setStaffError("");
  }, [staff.length]);

  const openEdit = useCallback(
    (index) => {
      const row = staff[index];
      if (!row) return;
      setIsCreating(false);
      setEditingIndex(index);
      setDraft({ role: row.role ?? "", names: row.names ?? "" });
      setConfirmDelete(false);
      setStaffError("");
    },
    [staff]
  );

  const persistStaff = useCallback(
    async (nextStaff) => {
      setStaffSaving(true);
      setStaffError("");
      try {
        const res = await fetch("/api/site-config/about-us-staff", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staff: nextStaff.map((item) => ({ role: item.role, names: item.names })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Save failed.");
        setStaff(data.staff || nextStaff);
        showDbToastSuccess();
        router.refresh();
        closeStaffModal();
      } catch (err) {
        setStaffError(err instanceof Error ? err.message : "Save failed.");
        showDbToastError("Database update failed.");
      } finally {
        setStaffSaving(false);
      }
    },
    [closeStaffModal, router]
  );

  const handleSaveStaff = useCallback(
    async (e) => {
      e.preventDefault();
      if (!draft) return;
      const next = [...staff];
      if (isCreating) {
        next.push({ ...draft });
      } else if (editingIndex >= 0 && editingIndex < next.length) {
        next[editingIndex] = { ...next[editingIndex], ...draft };
      } else {
        return;
      }
      await persistStaff(next);
    },
    [draft, staff, isCreating, editingIndex, persistStaff]
  );

  const handleDelete = useCallback(async () => {
    if (isCreating || editingIndex < 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await persistStaff(staff.filter((_, i) => i !== editingIndex));
  }, [isCreating, editingIndex, confirmDelete, staff, persistStaff]);

  /* ── Render ─────────────────────────────────────────────────── */
  const introBlock = (
    <div className="about-us-page__intro">
      <p className="about-us-page__eyebrow">Northstar Atelier · Fictional Studio Profile</p>
      <p className="about-us-page__lead">{intro}</p>
    </div>
  );

  return (
    <section className="about-us-page">
      <div className="about-us-page__body">
        {isAdmin ? (
          <AdminOverlay onOpenEdit={openIntroEdit} label="Edit intro text" disabled={introSaving}>
            {introBlock}
          </AdminOverlay>
        ) : (
          introBlock
        )}

        <aside className="about-us-page__staff">
          <div className="about-us-page__staff-header">
            <h2 className="about-us-page__staff-heading">Studio Directory</h2>
            {isAdmin ? (
              <button type="button" className="about-us-staff-add-btn eyebrow" onClick={openCreate}>
                ADD +
              </button>
            ) : null}
          </div>

          <dl className="about-us-staff-list">
            {staff.map((entry, i) => {
              const key = entry.id != null ? `id-${entry.id}` : `idx-${i}-${entry.role}`;
              const item = (
                <div className="about-us-staff-list__item">
                  <dt className="about-us-staff-list__role">{entry.role}</dt>
                  <dd className="about-us-staff-list__names">{renderNames(entry.names)}</dd>
                </div>
              );
              return (
                <Fragment key={key}>
                  {isAdmin ? (
                    <AdminOverlay
                      onOpenEdit={() => openEdit(i)}
                      label={`Edit ${entry.role}`}
                      disabled={staffSaving && staffModalOpen}
                    >
                      {item}
                    </AdminOverlay>
                  ) : (
                    item
                  )}
                </Fragment>
              );
            })}
          </dl>
        </aside>
      </div>

      {/* ── Intro modal ── */}
      {introModalOpen ? (
        <ModalLightbox
          open
          onClose={() => {
            if (!introSaving) closeIntroModal();
          }}
          closeLabel="Close intro editor"
        >
          <div className="recording-sidebar-modal">
            <div className="recording-sidebar-modal__header">
              <div>
                <p className="recording-sidebar-modal__eyebrow">Admin</p>
                <h3>Edit intro text</h3>
                <p className="recording-sidebar-modal__help">
                  Plain text paragraph shown at the top of the About Us page.
                </p>
              </div>
            </div>
            <form className="recording-sidebar-modal__form" onSubmit={saveIntro}>
              <section className="recording-sidebar-modal__section">
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Intro paragraph</span>
                  <textarea
                    className="recording-sidebar-modal__input recording-sidebar-modal__input--textarea"
                    value={introDraft}
                    rows={7}
                    required
                    onChange={(e) => setIntroDraft(e.target.value)}
                  />
                </label>
              </section>
              {introError ? (
                <p className="recording-sidebar-modal__error" role="alert">
                  {introError}
                </p>
              ) : null}
              <div className="recording-sidebar-modal__actions">
                <span />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeIntroModal}
                  disabled={introSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={introSaving}>
                  {introSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}

      {/* ── Staff edit modal ── */}
      {staffModalOpen && draft ? (
        <ModalLightbox
          open
          onClose={() => {
            if (!staffSaving) closeStaffModal();
          }}
          closeLabel="Close staff editor"
        >
          <div className="recording-sidebar-modal">
            <div className="recording-sidebar-modal__header">
              <div>
                <p className="recording-sidebar-modal__eyebrow">Admin</p>
                <h3>{isCreating ? "Add staff entry" : "Edit staff entry"}</h3>
                <p className="recording-sidebar-modal__help">
                  One role or title and the person(s) holding it. Enter one name per line.
                </p>
              </div>
            </div>
            <form className="recording-sidebar-modal__form" onSubmit={handleSaveStaff}>
              <section className="recording-sidebar-modal__section">
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Role / Title</span>
                  <input
                    type="text"
                    className="recording-sidebar-modal__input"
                    value={draft.role}
                    required
                    autoComplete="off"
                    onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  />
                </label>
                <label className="recording-sidebar-modal__field">
                  <span className="eyebrow">Person(s) — one per line</span>
                  <textarea
                    className="recording-sidebar-modal__input recording-sidebar-modal__input--textarea"
                    value={draft.names}
                    rows={5}
                    onChange={(e) => setDraft((d) => ({ ...d, names: e.target.value }))}
                  />
                </label>
              </section>
              {staffError ? (
                <p className="recording-sidebar-modal__error" role="alert">
                  {staffError}
                </p>
              ) : null}
              {!isCreating && confirmDelete ? (
                <p className="recording-sidebar-modal__danger-hint" role="alert">
                  Click delete again to confirm removal.
                </p>
              ) : null}
              <div className="recording-sidebar-modal__actions">
                {!isCreating ? (
                  <button
                    type="button"
                    className="recording-sidebar-modal__delete"
                    onClick={() => void handleDelete()}
                    disabled={staffSaving}
                  >
                    {confirmDelete ? "Confirm delete" : "Delete entry"}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeStaffModal}
                  disabled={staffSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={staffSaving}>
                  {staffSaving ? "Saving…" : isCreating ? "Add entry" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </section>
  );
}
