"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { UploadFieldStatus } from "./upload-field-status";

function createLocalId() {
  return `artist-link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function linesFromArray(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("\n");
}

function toDraftWebLinks(items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    localId: `existing-link-${index}`,
    label: String(item?.label || ""),
    href: String(item?.href || item?.url || ""),
  }));
}

function getInitialDraft(profile) {
  return {
    title: String(profile?.title || ""),
    pictureUrl: String(profile?.pictureUrl || ""),
    websiteUrl: String(profile?.websiteUrl || ""),
    facebookUrl: String(profile?.facebookUrl || ""),
    reverbnationUrl: String(profile?.reverbnationUrl || ""),
    xUrl: String(profile?.xUrl || ""),
    musicalStyles: linesFromArray(profile?.musicalStyles),
    featuredVideoTitle: String(profile?.featuredVideoTitle || ""),
    featuredVideoUrl: String(profile?.featuredVideoUrl || ""),
    descriptionHtml: String(profile?.descriptionHtml || ""),
    contactHtml: String(profile?.contactHtml || ""),
    personnelHtml: String(profile?.personnelHtml || ""),
    webLinks: toDraftWebLinks(profile?.webLinks),
  };
}

function LinkRow({ item, index, onChange, onRemove }) {
  return (
    <div className="recording-sidebar-repeater__item recording-sidebar-repeater__item--link">
      <div className="recording-sidebar-repeater__header">
        <strong>Web Link {index + 1}</strong>
        <div className="recording-sidebar-repeater__actions">
          <button type="button" className="btn btn-ghost" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
        <label>
          Label
          <input type="text" value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} />
        </label>
        <label>
          URL
          <input type="text" value={item.href} onChange={(event) => onChange({ ...item, href: event.target.value })} />
        </label>
      </div>
    </div>
  );
}

export function ArtistBandProfileEditor({
  profile,
  saveHref = `/api/artist-band-profiles/${encodeURIComponent(profile?.slug || "")}`,
  uploadHref = "",
  entityLabel = "Artist Profile",
  supportsPrimaryLinks = false,
  deleteHref = "",
  canDelete = false,
  deleteRedirectHref = "/member-pages",
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => getInitialDraft(profile));

  function openEditor() {
    setDraft(getInitialDraft(profile));
    setError("");
    setConfirmDelete(false);
    setOpen(true);
  }

  function updateField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateLink(localId, nextItem) {
    setDraft((current) => ({
      ...current,
      webLinks: current.webLinks.map((item) => (item.localId === localId ? nextItem : item)),
    }));
  }

  function removeLink(localId) {
    setDraft((current) => ({
      ...current,
      webLinks: current.webLinks.filter((item) => item.localId !== localId),
    }));
  }

  function addLink() {
    setDraft((current) => ({
      ...current,
      webLinks: [...current.webLinks, { localId: createLocalId(), label: "", href: "" }],
    }));
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadHref) return;

    setUploadBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch(uploadHref, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.error || "Upload failed.";
        setError(message);
        showDbToastError(message);
        return;
      }

      if (data?.url) {
        setDraft((current) => ({ ...current, pictureUrl: String(data.url) }));
      }
      showDbToastSuccess("Image uploaded.");
    } catch {
      setError("Upload failed.");
      showDbToastError("Upload failed.");
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setConfirmDelete(false);
    setBusy(true);
    setError("");

    try {
      const res = await fetch(saveHref, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          pictureUrl: draft.pictureUrl,
          websiteUrl: draft.websiteUrl,
          facebookUrl: draft.facebookUrl,
          reverbnationUrl: draft.reverbnationUrl,
          xUrl: draft.xUrl,
          musicalStyles: draft.musicalStyles,
          featuredVideoTitle: draft.featuredVideoTitle,
          featuredVideoUrl: draft.featuredVideoUrl,
          descriptionHtml: draft.descriptionHtml,
          contactHtml: draft.contactHtml,
          personnelHtml: draft.personnelHtml,
          webLinks: draft.webLinks.map((item) => ({
            label: item.label,
            url: item.href,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error || "Save failed.";
        setError(message);
        showDbToastError(message);
        return;
      }

      setOpen(false);
      showDbToastSuccess();
      router.refresh();
    } catch {
      setError("Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!canDelete || !deleteHref || busy || uploadBusy || deleteBusy) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      setError("");
      return;
    }

    setDeleteBusy(true);
    setError("");

    try {
      const res = await fetch(deleteHref, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error || "Delete failed.";
        setError(message);
        showDbToastError(message);
        setDeleteBusy(false);
        return;
      }

      setOpen(false);
      showDbToastSuccess();
      window.location.replace(deleteRedirectHref);
    } catch {
      setError("Delete failed.");
      showDbToastError("Delete failed.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={openEditor}>
        Update Profile
      </button>

      <ModalLightbox
        open={open}
        onClose={() => !busy && !uploadBusy && !deleteBusy && setOpen(false)}
        closeLabel="Close artist profile editor"
      >
        <div className="recording-sidebar-modal artist-band-profile-editor">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">{entityLabel}</p>
              <h3>Update Profile</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Basics</h4>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Artist / band name
                  <input type="text" value={draft.title} onChange={(event) => updateField("title", event.target.value)} required />
                </label>
                <label>
                  Upload profile image
                  <input type="file" accept="image/*" onChange={handleUpload} disabled={!uploadHref || uploadBusy || busy} />
                  <UploadFieldStatus
                    url={draft.pictureUrl}
                    kind="image"
                    imageAlt="Profile image preview"
                    emptyLabel="No profile image uploaded yet."
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Musical styles
                  <textarea
                    rows={4}
                    value={draft.musicalStyles}
                    onChange={(event) => updateField("musicalStyles", event.target.value)}
                    placeholder="One style per line"
                  />
                </label>
                <label>
                  Featured video title
                  <input
                    type="text"
                    value={draft.featuredVideoTitle}
                    onChange={(event) => updateField("featuredVideoTitle", event.target.value)}
                  />
                </label>
                <label>
                  Featured video URL
                  <input
                    type="text"
                    value={draft.featuredVideoUrl}
                    onChange={(event) => updateField("featuredVideoUrl", event.target.value)}
                  />
                </label>
                {supportsPrimaryLinks ? (
                  <>
                    <label>
                      Website URL
                      <input
                        type="text"
                        value={draft.websiteUrl}
                        onChange={(event) => updateField("websiteUrl", event.target.value)}
                      />
                    </label>
                    <label>
                      Facebook URL
                      <input
                        type="text"
                        value={draft.facebookUrl}
                        onChange={(event) => updateField("facebookUrl", event.target.value)}
                      />
                    </label>
                    <label className="recording-sidebar-form-grid__wide">
                      Instagram URL
                      <input
                        type="text"
                        value={draft.reverbnationUrl}
                        onChange={(event) => updateField("reverbnationUrl", event.target.value)}
                        placeholder="https://www.instagram.com/..."
                      />
                    </label>
                    <label className="recording-sidebar-form-grid__wide">
                      X URL
                      <input
                        type="text"
                        value={draft.xUrl}
                        onChange={(event) => updateField("xUrl", event.target.value)}
                        placeholder="https://x.com/..."
                      />
                    </label>
                  </>
                ) : null}
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Description</h4>
              </div>
              <NewsEventsBodyEditor
                value={draft.descriptionHtml}
                onChange={(value) => updateField("descriptionHtml", value)}
                labelledBy=""
              />
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Contact Information</h4>
              </div>
              <NewsEventsBodyEditor
                value={draft.contactHtml}
                onChange={(value) => updateField("contactHtml", value)}
                labelledBy=""
              />
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Personnel / Instrumentation</h4>
              </div>
              <NewsEventsBodyEditor
                value={draft.personnelHtml}
                onChange={(value) => updateField("personnelHtml", value)}
                labelledBy=""
              />
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                <div>
                  <h4>Web Links</h4>
                  <p className="recording-sidebar-modal__help">Add only the links you want displayed on the profile page.</p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={addLink}>
                  Add link
                </button>
              </div>

              <div className="member-profile-editor__media-list">
                {draft.webLinks.length ? (
                  draft.webLinks.map((item, index) => (
                    <LinkRow
                      key={item.localId}
                      item={item}
                      index={index}
                      onChange={(nextItem) => updateLink(item.localId, nextItem)}
                      onRemove={() => removeLink(item.localId)}
                    />
                  ))
                ) : (
                  <p className="recording-sidebar-modal__help">No web links added yet.</p>
                )}
              </div>
            </section>

            {error ? (
              <p className="recording-sidebar-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            {confirmDelete && canDelete ? (
              <p className="recording-sidebar-modal__danger-hint" role="alert">
                This deletes this member permanently and is unrecoverable. They will no longer appear on any aspect of the AFM 257 site. Click Delete Profile again to confirm.
              </p>
            ) : null}

            <div className="recording-sidebar-modal__actions">
              {canDelete ? (
                <button
                  type="button"
                  className="recording-sidebar-modal__delete"
                  onClick={handleDelete}
                  disabled={busy || uploadBusy || deleteBusy}
                >
                  {deleteBusy ? "Deleting..." : confirmDelete ? "Confirm Delete Profile" : "Delete Profile"}
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy || uploadBusy || deleteBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy || uploadBusy || deleteBusy}>
                {busy ? "Saving..." : uploadBusy ? "Uploading..." : deleteBusy ? "Deleting..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
