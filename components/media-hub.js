"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_MEDIA_HUB, MEDIA_HUB_PANEL_ORDER } from "../lib/media-hub-defaults.mjs";
import { NewsEventsBodyEditor } from "./news-events-body-editor";
import { UploadFieldStatus } from "./upload-field-status";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

const PANEL_LABELS = {
  featuredVideo: "Featured video",
  photoGallery: "Photo & video gallery",
  magazine: "Magazine",
};

function panelBackgroundStyle(backgroundImageSrc, fallbackUrl, position = "center") {
  const imageUrl = backgroundImageSrc || fallbackUrl;
  return {
    backgroundImage:
      `linear-gradient(135deg, rgba(2, 6, 18, 0.62) 0%, rgba(3, 9, 24, 0.55) 46%, rgba(4, 10, 24, 0.58) 100%),` +
      `url("${imageUrl}")`,
    backgroundPosition: `${position}, ${position}`,
    backgroundSize: "cover, cover",
    backgroundRepeat: "no-repeat, no-repeat",
  };
}

function CtaLink({ href, className, children }) {
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function deepCloneConfig(cfg) {
  return JSON.parse(JSON.stringify(cfg));
}

/** Glass slide-in overlay; opens editor on click (same pattern as member site links intro). */
function AdminGlassEditOverlay({ ariaLabel, onOpen, disabled = false }) {
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);

  useEffect(() => {
    if (!overlayActive) return undefined;
    const trigger = () => {
      setGlassVariant((current) => pickRandomGlassVariant(current));
      setGlassCycle((c) => c + 1);
    };
    trigger();
    const id = window.setInterval(trigger, 5000);
    return () => window.clearInterval(id);
  }, [overlayActive]);

  return (
    <button
      type="button"
      className="recording-page-edit-overlay"
      onClick={() => void onOpen()}
      onMouseEnter={() => setOverlayActive(true)}
      onMouseLeave={() => setOverlayActive(false)}
      onFocus={() => setOverlayActive(true)}
      onBlur={() => setOverlayActive(false)}
      aria-label={ariaLabel}
      data-active={overlayActive ? "true" : "false"}
      disabled={disabled}
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
  );
}

export function MediaHub({ initialConfig, isAdmin = false }) {
  const router = useRouter();

  const [config, setConfig] = useState(() => deepCloneConfig(initialConfig));
  const [portalReady, setPortalReady] = useState(false);

  const [introOpen, setIntroOpen] = useState(false);
  const [introTitle, setIntroTitle] = useState("");
  const [introHtml, setIntroHtml] = useState("");

  const [editingPanelKey, setEditingPanelKey] = useState(null);
  const [panelDraft, setPanelDraft] = useState(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConfig(deepCloneConfig(initialConfig));
  }, [initialConfig]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/site-config/media-hub", { cache: "no-store" });
    if (!res.ok) throw new Error("Unable to load media hub.");
    return res.json();
  }, []);

  const openIntroEditor = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const data = await fetchConfig();
      setIntroTitle(String(data.introTitle ?? ""));
      setIntroHtml(String(data.introHtml ?? ""));
      setEditingPanelKey(null);
      setPanelDraft(null);
      setIntroOpen(true);
    } catch {
      setIntroTitle(config.introTitle);
      setIntroHtml(config.introHtml);
      setIntroOpen(true);
      showDbToastError("Could not refresh intro; editing local copy.");
    } finally {
      setBusy(false);
    }
  }, [config.introHtml, config.introTitle, fetchConfig]);

  const openPanelEditor = useCallback(
    async (panelKey) => {
      setError("");
      setBusy(true);
      try {
        const data = await fetchConfig();
        setPanelDraft(deepCloneConfig(data.panels[panelKey]));
        setIntroOpen(false);
        setEditingPanelKey(panelKey);
      } catch {
        setPanelDraft(deepCloneConfig(config.panels[panelKey]));
        setEditingPanelKey(panelKey);
        showDbToastError("Could not refresh panel; editing local copy.");
      } finally {
        setBusy(false);
      }
    },
    [config.panels, fetchConfig]
  );

  const saveIntro = useCallback(
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        const payload = { ...config, introTitle, introHtml };
        const res = await fetch("/api/site-config/media-hub", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Save failed.");
        setConfig(deepCloneConfig(data));
        showDbToastSuccess("Intro saved.");
        setIntroOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
        showDbToastError("Could not save intro.");
      } finally {
        setBusy(false);
      }
    },
    [config, introHtml, introTitle, router]
  );

  const savePanel = useCallback(
    async (event) => {
      event.preventDefault();
      if (!editingPanelKey || !panelDraft) return;
      setBusy(true);
      setError("");
      try {
        const payload = {
          ...config,
          panels: {
            ...config.panels,
            [editingPanelKey]: panelDraft,
          },
        };
        const res = await fetch("/api/site-config/media-hub", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Save failed.");
        setConfig(deepCloneConfig(data));
        showDbToastSuccess("Callout saved.");
        setEditingPanelKey(null);
        setPanelDraft(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
        showDbToastError("Could not save callout.");
      } finally {
        setBusy(false);
      }
    },
    [config, editingPanelKey, panelDraft, router]
  );

  const uploadPanelImage = useCallback(async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/site-config/media-hub/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Upload failed.");
    }
    if (!data?.url) throw new Error("No image URL returned.");
    setPanelDraft((current) => (current ? { ...current, backgroundImageSrc: data.url } : current));
  }, []);

  const panelEntries = useMemo(
    () =>
      MEDIA_HUB_PANEL_ORDER.map((key) => ({
        key,
        label: PANEL_LABELS[key],
        panel: config.panels[key],
        defaults: DEFAULT_MEDIA_HUB.panels[key],
      })),
    [config.panels]
  );

  const editingPanelDefaults =
    editingPanelKey && DEFAULT_MEDIA_HUB.panels[editingPanelKey]
      ? DEFAULT_MEDIA_HUB.panels[editingPanelKey]
      : null;

  const introModal =
    portalReady && introOpen && isAdmin ? (
      <div className="page-header-editor-backdrop" role="presentation">
        <div
          className="page-header-editor-modal page-header-editor-modal--wide"
          role="dialog"
          aria-modal="true"
          aria-label="Edit media hub intro"
        >
          <div className="page-header-editor-modal__header">
            <p className="gigs-admin__eyebrow">Admin</p>
            <h3>Edit Media intro</h3>
          </div>
          <form className="page-header-editor-form" onSubmit={saveIntro}>
            <div className="home-panels-editor-grid">
              <label className="home-panels-editor-grid__wide">
                Title
                <input
                  type="text"
                  value={introTitle}
                  onChange={(e) => setIntroTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </label>
              <label className="home-panels-editor-grid__wide">
                Body HTML
                <div className="recording-page-editor__richtext">
                  <NewsEventsBodyEditor value={introHtml} onChange={setIntroHtml} labelledBy="" />
                </div>
              </label>
            </div>
            {error && introOpen ? <p className="hero-admin-error">{error}</p> : null}
            <div className="page-header-editor-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setIntroOpen(false);
                  setError("");
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save intro"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  const panelModal =
    portalReady && editingPanelKey && panelDraft && isAdmin ? (
      <div className="page-header-editor-backdrop" role="presentation">
        <div
          className="page-header-editor-modal page-header-editor-modal--wide"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${PANEL_LABELS[editingPanelKey]}`}
        >
          <div className="page-header-editor-modal__header">
            <p className="gigs-admin__eyebrow">Admin</p>
            <h3>Edit {PANEL_LABELS[editingPanelKey]}</h3>
          </div>
          <form className="page-header-editor-form" onSubmit={savePanel}>
            <div className="home-panels-editor-grid">
              <label>
                Kicker
                <input
                  type="text"
                  value={panelDraft.kicker}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, kicker: e.target.value }))}
                  maxLength={80}
                />
              </label>
              <label>
                Title
                <input
                  type="text"
                  value={panelDraft.title}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, title: e.target.value }))}
                  maxLength={160}
                />
              </label>
              <label className="home-panels-editor-grid__wide">
                Body
                <textarea
                  value={panelDraft.body}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, body: e.target.value }))}
                  rows={4}
                  maxLength={400}
                />
              </label>
              <label>
                Button label
                <input
                  type="text"
                  value={panelDraft.ctaLabel}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
                  maxLength={120}
                />
              </label>
              <label>
                Button URL
                <input
                  type="text"
                  value={panelDraft.ctaHref}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, ctaHref: e.target.value }))}
                  maxLength={500}
                />
              </label>
              <label>
                Background position
                <input
                  type="text"
                  value={panelDraft.backgroundPosition || ""}
                  placeholder={editingPanelDefaults?.backgroundPosition || "center"}
                  onChange={(e) => setPanelDraft((d) => ({ ...d, backgroundPosition: e.target.value }))}
                  maxLength={40}
                />
              </label>
              <div className="home-panels-editor-upload-row home-panels-editor-grid__wide">
                <label>
                  Upload background image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        await uploadPanelImage(f);
                        showDbToastSuccess("Image uploaded.");
                      } catch (err) {
                        showDbToastError(err instanceof Error ? err.message : "Upload failed.");
                      }
                    }}
                  />
                  <UploadFieldStatus
                    url={panelDraft.backgroundImageSrc}
                    kind="image"
                    imageAlt={`${PANEL_LABELS[editingPanelKey]} background preview`}
                    emptyLabel="No background image selected."
                  />
                </label>
              </div>
            </div>
            {error && editingPanelKey ? <p className="hero-admin-error">{error}</p> : null}
            <div className="page-header-editor-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditingPanelKey(null);
                  setPanelDraft(null);
                  setError("");
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save callout"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <div className="media-hub-shell">
      <div className="media-hub-hub-layout">
        <div className={isAdmin ? "media-hub-intro-wrap media-hub-intro-wrap--admin" : "media-hub-intro-wrap"}>
          <header className="media-hub-intro">
            <div className="media-hub-intro__head">
              <h2 className="media-hub-intro__title">{config.introTitle}</h2>
            </div>
            <div
              className="media-hub-intro__body media-hub-intro__body--rich"
              dangerouslySetInnerHTML={{ __html: config.introHtml }}
            />
          </header>
          {isAdmin ? (
            <AdminGlassEditOverlay ariaLabel="Edit media hub intro" onOpen={openIntroEditor} disabled={busy} />
          ) : null}
        </div>

        <div className="media-hub-panels" aria-label="Media destinations">
          {panelEntries.map(({ key, panel, defaults }) => (
            <div
              key={key}
              className={isAdmin ? "media-hub-card-wrap media-hub-card-wrap--admin" : "media-hub-card-wrap"}
            >
              <article
                className="hero-panel hero-panel--promo media-hub-card"
                style={panelBackgroundStyle(
                  panel.backgroundImageSrc,
                  defaults.backgroundImageSrc,
                  panel.backgroundPosition || defaults.backgroundPosition || "center"
                )}
              >
                <p className="panel-kicker">{panel.kicker}</p>
                <h3 className="parking-panel-title">{panel.title}</h3>
                <p className="parking-panel-copy">{panel.body}</p>
                <CtaLink href={panel.ctaHref} className="btn btn-primary parking-panel-cta">
                  {panel.ctaLabel}
                </CtaLink>
              </article>
              {isAdmin ? (
                <AdminGlassEditOverlay
                  ariaLabel={`Edit ${PANEL_LABELS[key]} callout`}
                  onOpen={() => void openPanelEditor(key)}
                  disabled={busy}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {portalReady && isAdmin
        ? createPortal(
            <>
              {introModal}
              {panelModal}
            </>,
            document.body
          )
        : null}
    </div>
  );
}
