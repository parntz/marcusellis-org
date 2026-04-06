"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

function getInitialDraft(initialConfig) {
  return {
    showMemberNotices: initialConfig?.showMemberNotices !== false,
    showSidebarCtas: initialConfig?.showSidebarCtas !== false,
  };
}

export function RecordingPageOptionsButton({ initialConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => getInitialDraft(initialConfig));

  function openEditor() {
    setDraft(getInitialDraft(initialConfig));
    setError("");
    setOpen(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-config/recording-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initialConfig,
          showMemberNotices: draft.showMemberNotices,
          showSidebarCtas: draft.showSidebarCtas,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Save failed.");
        showDbToastError("Database update failed.");
        return;
      }

      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch {
      setError("Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary page-header-action-button" onClick={openEditor}>
        Page Options
      </button>

      <ModalLightbox open={open} onClose={() => !saveBusy && setOpen(false)} closeLabel="Close page options">
        <div className="recording-sidebar-modal recording-page-options-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Recording Page</p>
              <h3>Page Options</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Visibility</h4>
                <p className="recording-sidebar-modal__help">
                  Control which optional sections appear only on the recording page.
                </p>
              </div>

              <label className="recording-sidebar-form-check">
                <input
                  type="checkbox"
                  checked={draft.showMemberNotices}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, showMemberNotices: event.target.checked }))
                  }
                />
                <span>Member notices</span>
              </label>

              <label className="recording-sidebar-form-check">
                <input
                  type="checkbox"
                  checked={draft.showSidebarCtas}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, showSidebarCtas: event.target.checked }))
                  }
                />
                <span>Sidebar CTA&apos;s</span>
              </label>
            </section>

            {error ? (
              <p className="recording-sidebar-modal__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy}>
                {saveBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
