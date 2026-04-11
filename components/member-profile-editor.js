"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { UploadFieldStatus } from "./upload-field-status";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

function htmlToPlainText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|aside|header|footer|blockquote|pre|li|ul|ol|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function linesFromArray(items) {
  return (Array.isArray(items) ? items : []).map((item) => String(item || "").trim()).filter(Boolean).join("\n");
}

function createLocalId(prefix = "item") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLinkItem() {
  return { localId: createLocalId("link"), label: "", url: "" };
}

function createAudioItem() {
  return { localId: createLocalId("audio"), label: "", url: "", mimeType: "" };
}

function createMediaItem(mediaType = "image") {
  return {
    localId: createLocalId("media"),
    mediaType,
    label: "",
    assetUrl: "",
    mimeType: "",
  };
}

function toDraftLinks(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        localId: item.id || `existing-link-${index}`,
        label: String(item?.label || ""),
        url: String(item?.url || ""),
      }))
    : [];
}

function toDraftAudioLinks(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        localId: item.id || `existing-audio-${index}`,
        label: String(item?.label || ""),
        url: String(item?.url || ""),
        mimeType: String(item?.mimeType || ""),
      }))
    : [];
}

function toDraftMedia(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        localId: item.id || `existing-media-${index}`,
        mediaType: item.mediaType === "video" ? "video" : "image",
        label: String(item?.label || ""),
        assetUrl: String(item?.assetUrl || ""),
        mimeType: String(item?.mimeType || ""),
      }))
    : [];
}

function getInitialDraft(profile) {
  return {
    firstName: String(profile?.firstName || ""),
    lastName: String(profile?.lastName || ""),
    title: String(profile?.title || ""),
    canonicalUrl: String(profile?.canonicalUrl || ""),
    pictureUrl: String(profile?.pictureUrl || ""),
    websiteUrl: String(profile?.websiteUrl || ""),
    facebookUrl: String(profile?.facebookUrl || ""),
    reverbnationUrl: String(profile?.reverbnationUrl || ""),
    xUrl: String(profile?.xUrl || ""),
    featuredVideoTitle: String(profile?.featuredVideoTitle || ""),
    featuredVideoUrl: String(profile?.featuredVideoUrl || ""),
    primaryInstruments: linesFromArray(profile?.primaryInstruments),
    additionalInstrumentsText: String(profile?.additionalInstrumentsText || ""),
    musicalStyles: linesFromArray(profile?.musicalStyles),
    workDesired: linesFromArray(profile?.workDesired),
    workDesiredOther: String(profile?.workDesiredOther || ""),
    additionalSkills: linesFromArray(profile?.additionalSkills),
    additionalSkillsOther: String(profile?.additionalSkillsOther || ""),
    numberChartRead: Boolean(profile?.numberChartRead),
    numberChartWrite: Boolean(profile?.numberChartWrite),
    chordChartRead: Boolean(profile?.chordChartRead),
    chordChartWrite: Boolean(profile?.chordChartWrite),
    hasHomeStudio: Boolean(profile?.hasHomeStudio),
    isEngineer: Boolean(profile?.isEngineer),
    contactHtml: htmlToPlainText(profile?.contactHtml || ""),
    descriptionHtml: htmlToPlainText(profile?.descriptionHtml || ""),
    personnelHtml: htmlToPlainText(profile?.personnelHtml || ""),
    bodyHtml: htmlToPlainText(profile?.bodyHtml || ""),
    webLinks: toDraftLinks(profile?.webLinks),
    audioLinks: toDraftAudioLinks(profile?.audioLinks),
    legacyVideoLinks: toDraftLinks(profile?.legacyVideoLinks),
    media: toDraftMedia(profile?.media),
  };
}

function BooleanField({ label, checked, onChange }) {
  return (
    <label className="member-profile-editor__checkbox">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function MemberProfileEditor({ profile, canDelete = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
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

  function updateDraftField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateRepeaterItem(key, localId, patch) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
    }));
  }

  function removeRepeaterItem(key, localId) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.localId !== localId),
    }));
  }

  function addRepeaterItem(key, item) {
    setDraft((current) => ({
      ...current,
      [key]: [...current[key], item],
    }));
  }

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setUploadBusy(true);
    setError("");

    try {
      const uploadedItems = [];
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch(`/api/member-profiles/${encodeURIComponent(profile.slug)}/upload`, {
          method: "POST",
          body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Upload failed.");
        }
        uploadedItems.push({
          ...createMediaItem(data?.mediaType || (file.type.startsWith("video/") ? "video" : "image")),
          label: file.name.replace(/\.[^.]+$/, ""),
          assetUrl: String(data?.url || ""),
          mimeType: String(data?.mimeType || file.type || ""),
        });
      }

      setDraft((current) => ({
        ...current,
        media: [...current.media, ...uploadedItems],
      }));
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setConfirmDelete(false);
    setSaveBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/member-profiles/${encodeURIComponent(profile.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: draft.firstName,
          lastName: draft.lastName,
          title: draft.title,
          canonicalUrl: draft.canonicalUrl,
          pictureUrl: draft.pictureUrl,
          websiteUrl: draft.websiteUrl,
          facebookUrl: draft.facebookUrl,
          reverbnationUrl: draft.reverbnationUrl,
          xUrl: draft.xUrl,
          featuredVideoTitle: draft.featuredVideoTitle,
          featuredVideoUrl: draft.featuredVideoUrl,
          primaryInstruments: draft.primaryInstruments,
          additionalInstrumentsText: draft.additionalInstrumentsText,
          musicalStyles: draft.musicalStyles,
          workDesired: draft.workDesired,
          workDesiredOther: draft.workDesiredOther,
          additionalSkills: draft.additionalSkills,
          additionalSkillsOther: draft.additionalSkillsOther,
          numberChartRead: draft.numberChartRead,
          numberChartWrite: draft.numberChartWrite,
          chordChartRead: draft.chordChartRead,
          chordChartWrite: draft.chordChartWrite,
          hasHomeStudio: draft.hasHomeStudio,
          isEngineer: draft.isEngineer,
          contactHtml: draft.contactHtml,
          descriptionHtml: draft.descriptionHtml,
          personnelHtml: draft.personnelHtml,
          bodyHtml: draft.bodyHtml,
          webLinks: draft.webLinks,
          audioLinks: draft.audioLinks,
          legacyVideoLinks: draft.legacyVideoLinks,
          media: draft.media,
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
      setSaveBusy(false);
    }
  }

  async function handleDelete() {
    if (!canDelete || saveBusy || uploadBusy || deleteBusy) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      setError("");
      return;
    }

    setDeleteBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/member-profiles/${encodeURIComponent(profile.slug)}`, {
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
      router.push("/member-pages");
      router.refresh();
    } catch {
      setError("Delete failed.");
      showDbToastError("Database delete failed.");
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={openEditor}>
        Edit Profile
      </button>

      <ModalLightbox open={open} onClose={() => !saveBusy && !uploadBusy && !deleteBusy && setOpen(false)} closeLabel="Close member profile editor">
        <div className="recording-sidebar-modal member-profile-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Member Profile</p>
              <h3>Edit Your Profile</h3>
            </div>
          </div>

          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Basics</h4>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  First name
                  <input type="text" value={draft.firstName} onChange={(event) => updateDraftField("firstName", event.target.value)} />
                </label>
                <label>
                  Last name
                  <input type="text" value={draft.lastName} onChange={(event) => updateDraftField("lastName", event.target.value)} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Profile title
                  <input type="text" value={draft.title} onChange={(event) => updateDraftField("title", event.target.value)} required />
                </label>
                <label>
                  Legacy / canonical URL
                  <input
                    type="text"
                    value={draft.canonicalUrl}
                    onChange={(event) => updateDraftField("canonicalUrl", event.target.value)}
                    placeholder="https://example.com/profile"
                  />
                </label>
                <label>
                  Profile image URL
                  <input
                    type="text"
                    value={draft.pictureUrl}
                    onChange={(event) => updateDraftField("pictureUrl", event.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </label>
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Profile Details</h4>
                <p className="recording-sidebar-modal__help">Use one item per line for lists like instruments, styles, work types, and skills.</p>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Primary instruments
                  <textarea rows={5} value={draft.primaryInstruments} onChange={(event) => updateDraftField("primaryInstruments", event.target.value)} />
                </label>
                <label>
                  Musical styles
                  <textarea rows={5} value={draft.musicalStyles} onChange={(event) => updateDraftField("musicalStyles", event.target.value)} />
                </label>
                <label>
                  Additional instruments
                  <textarea
                    rows={4}
                    value={draft.additionalInstrumentsText}
                    onChange={(event) => updateDraftField("additionalInstrumentsText", event.target.value)}
                  />
                </label>
                <label>
                  Work desired
                  <textarea rows={4} value={draft.workDesired} onChange={(event) => updateDraftField("workDesired", event.target.value)} />
                </label>
                <label>
                  Work desired other
                  <textarea rows={3} value={draft.workDesiredOther} onChange={(event) => updateDraftField("workDesiredOther", event.target.value)} />
                </label>
                <label>
                  Additional skills
                  <textarea rows={4} value={draft.additionalSkills} onChange={(event) => updateDraftField("additionalSkills", event.target.value)} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Additional skills other
                  <textarea rows={3} value={draft.additionalSkillsOther} onChange={(event) => updateDraftField("additionalSkillsOther", event.target.value)} />
                </label>
              </div>

              <div className="member-profile-editor__checkbox-grid">
                <BooleanField label="Reads number charts" checked={draft.numberChartRead} onChange={(value) => updateDraftField("numberChartRead", value)} />
                <BooleanField label="Writes number charts" checked={draft.numberChartWrite} onChange={(value) => updateDraftField("numberChartWrite", value)} />
                <BooleanField label="Reads chord charts" checked={draft.chordChartRead} onChange={(value) => updateDraftField("chordChartRead", value)} />
                <BooleanField label="Writes chord charts" checked={draft.chordChartWrite} onChange={(value) => updateDraftField("chordChartWrite", value)} />
                <BooleanField label="Has home studio" checked={draft.hasHomeStudio} onChange={(value) => updateDraftField("hasHomeStudio", value)} />
                <BooleanField label="Engineer" checked={draft.isEngineer} onChange={(value) => updateDraftField("isEngineer", value)} />
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Public Links</h4>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Website URL
                  <input type="text" value={draft.websiteUrl} onChange={(event) => updateDraftField("websiteUrl", event.target.value)} placeholder="https://example.com" />
                </label>
                <label>
                  Facebook URL
                  <input type="text" value={draft.facebookUrl} onChange={(event) => updateDraftField("facebookUrl", event.target.value)} placeholder="https://facebook.com/..." />
                </label>
                <label>
                  Instagram URL
                  <input type="text" value={draft.reverbnationUrl} onChange={(event) => updateDraftField("reverbnationUrl", event.target.value)} placeholder="https://www.instagram.com/..." />
                </label>
                <label>
                  X URL
                  <input type="text" value={draft.xUrl} onChange={(event) => updateDraftField("xUrl", event.target.value)} placeholder="https://x.com/..." />
                </label>
              </div>

              <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                <div>
                  <h4>Additional Web Links</h4>
                  <p className="recording-sidebar-modal__help">Add extra public links that should appear on the profile.</p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => addRepeaterItem("webLinks", createLinkItem())}>
                  Add link
                </button>
              </div>

              <div className="member-profile-editor__media-list">
                {draft.webLinks.length ? (
                  draft.webLinks.map((item, index) => (
                    <div key={item.localId} className="recording-sidebar-repeater__item recording-sidebar-repeater__item--link">
                      <div className="recording-sidebar-repeater__header">
                        <strong>Web Link {index + 1}</strong>
                        <div className="recording-sidebar-repeater__actions">
                          <button type="button" className="btn btn-ghost" onClick={() => removeRepeaterItem("webLinks", item.localId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                        <label>
                          Label
                          <input type="text" value={item.label} onChange={(event) => updateRepeaterItem("webLinks", item.localId, { label: event.target.value })} />
                        </label>
                        <label>
                          URL
                          <input type="text" value={item.url} onChange={(event) => updateRepeaterItem("webLinks", item.localId, { url: event.target.value })} />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="recording-sidebar-modal__help">No extra web links added yet.</p>
                )}
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Profile Copy</h4>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label className="recording-sidebar-form-grid__wide">
                  Overview
                  <textarea rows={6} value={draft.descriptionHtml} onChange={(event) => updateDraftField("descriptionHtml", event.target.value)} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Personnel / instrumentation
                  <textarea rows={5} value={draft.personnelHtml} onChange={(event) => updateDraftField("personnelHtml", event.target.value)} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Details
                  <textarea rows={8} value={draft.bodyHtml} onChange={(event) => updateDraftField("bodyHtml", event.target.value)} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Contact information
                  <textarea rows={5} value={draft.contactHtml} onChange={(event) => updateDraftField("contactHtml", event.target.value)} />
                </label>
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head">
                <h4>Featured Video</h4>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Video title
                  <input type="text" value={draft.featuredVideoTitle} onChange={(event) => updateDraftField("featuredVideoTitle", event.target.value)} />
                </label>
                <label>
                  Video URL
                  <input type="text" value={draft.featuredVideoUrl} onChange={(event) => updateDraftField("featuredVideoUrl", event.target.value)} placeholder="https://youtu.be/..." />
                </label>
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                <div>
                  <h4>Legacy Video Links</h4>
                  <p className="recording-sidebar-modal__help">Older external videos that should still appear on the page.</p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => addRepeaterItem("legacyVideoLinks", createLinkItem())}>
                  Add video link
                </button>
              </div>

              <div className="member-profile-editor__media-list">
                {draft.legacyVideoLinks.length ? (
                  draft.legacyVideoLinks.map((item, index) => (
                    <div key={item.localId} className="recording-sidebar-repeater__item recording-sidebar-repeater__item--link">
                      <div className="recording-sidebar-repeater__header">
                        <strong>Video Link {index + 1}</strong>
                        <div className="recording-sidebar-repeater__actions">
                          <button type="button" className="btn btn-ghost" onClick={() => removeRepeaterItem("legacyVideoLinks", item.localId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                        <label>
                          Label
                          <input type="text" value={item.label} onChange={(event) => updateRepeaterItem("legacyVideoLinks", item.localId, { label: event.target.value })} />
                        </label>
                        <label>
                          URL
                          <input type="text" value={item.url} onChange={(event) => updateRepeaterItem("legacyVideoLinks", item.localId, { url: event.target.value })} />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="recording-sidebar-modal__help">No legacy video links added yet.</p>
                )}
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                <div>
                  <h4>Audio Links</h4>
                  <p className="recording-sidebar-modal__help">Public audio clips or streaming links.</p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => addRepeaterItem("audioLinks", createAudioItem())}>
                  Add audio link
                </button>
              </div>

              <div className="member-profile-editor__media-list">
                {draft.audioLinks.length ? (
                  draft.audioLinks.map((item, index) => (
                    <div key={item.localId} className="recording-sidebar-repeater__item recording-sidebar-repeater__item--link">
                      <div className="recording-sidebar-repeater__header">
                        <strong>Audio Link {index + 1}</strong>
                        <div className="recording-sidebar-repeater__actions">
                          <button type="button" className="btn btn-ghost" onClick={() => removeRepeaterItem("audioLinks", item.localId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                        <label>
                          Label
                          <input type="text" value={item.label} onChange={(event) => updateRepeaterItem("audioLinks", item.localId, { label: event.target.value })} />
                        </label>
                        <label>
                          URL
                          <input type="text" value={item.url} onChange={(event) => updateRepeaterItem("audioLinks", item.localId, { url: event.target.value })} />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="recording-sidebar-modal__help">No audio links added yet.</p>
                )}
              </div>
            </section>

            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
                <div>
                  <h4>Custom Media</h4>
                  <p className="recording-sidebar-modal__help">Upload images or video files, or add external video links like YouTube.</p>
                </div>
                <div className="member-profile-editor__media-actions">
                  <label className="btn btn-ghost member-profile-editor__upload">
                    {uploadBusy ? "Uploading..." : "Upload media"}
                    <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} disabled={uploadBusy} />
                  </label>
                  <button type="button" className="btn btn-ghost" onClick={() => addRepeaterItem("media", createMediaItem("video"))}>
                    Add video link
                  </button>
                </div>
              </div>

              <div className="member-profile-editor__media-list">
                {draft.media.length ? (
                  draft.media.map((item, index) => (
                    <div key={item.localId} className="recording-sidebar-repeater__item recording-sidebar-repeater__item--link">
                      <div className="recording-sidebar-repeater__header">
                        <strong>
                          {item.mediaType === "video" ? "Video" : "Image"} {index + 1}
                        </strong>
                        <div className="recording-sidebar-repeater__actions">
                          <button type="button" className="btn btn-ghost" onClick={() => removeRepeaterItem("media", item.localId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                        <label>
                          Type
                          <select value={item.mediaType} onChange={(event) => updateRepeaterItem("media", item.localId, { mediaType: event.target.value })}>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </label>
                        <label>
                          Label
                          <input type="text" value={item.label} onChange={(event) => updateRepeaterItem("media", item.localId, { label: event.target.value })} />
                        </label>
                        <label className="recording-sidebar-form-grid__wide">
                          URL
                          <input
                            type="text"
                            value={item.assetUrl}
                            onChange={(event) => updateRepeaterItem("media", item.localId, { assetUrl: event.target.value })}
                            placeholder={item.mediaType === "video" ? "https://youtu.be/..." : "/uploads/member-profiles/..."}
                          />
                          {item.mediaType === "image" || item.mimeType ? (
                            <UploadFieldStatus
                              url={item.assetUrl}
                              kind={item.mediaType === "image" ? "image" : "file"}
                              mimeType={item.mimeType}
                              imageAlt={`${item.label || "Member"} media preview`}
                              emptyLabel={item.mediaType === "image" ? "No image uploaded yet." : "No file selected yet."}
                              statusLabel={item.mediaType === "image" ? "Image ready" : "Media ready"}
                            />
                          ) : null}
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="recording-sidebar-modal__help">No custom media added yet.</p>
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
                  disabled={saveBusy || uploadBusy || deleteBusy}
                >
                  {deleteBusy ? "Deleting..." : confirmDelete ? "Confirm Delete Profile" : "Delete Profile"}
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saveBusy || uploadBusy || deleteBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy || uploadBusy || deleteBusy}>
                {saveBusy ? "Saving..." : uploadBusy ? "Uploading..." : deleteBusy ? "Deleting..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}
