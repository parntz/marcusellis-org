/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalLightbox } from "./modal-lightbox";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function BenefitsEditableShell({ children, onOpen, disabled = false, label, contentFit = false }) {
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
      className={`recording-page-editable ${contentFit ? "recording-page-editable--content-fit" : "recording-page-editable--main"}`}
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
        disabled={disabled}
        aria-label={label}
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

async function fetchBenefitsConfig() {
  const res = await fetch("/api/site-config/benefits-hub", { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Unable to load benefits hub.");
  }
  return data;
}

async function saveBenefitsConfig(payload) {
  const res = await fetch("/api/site-config/benefits-hub", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Save failed.");
  }
  return data;
}

function ResourceCard({ item }) {
  if (item.external) {
    return (
      <a href={item.href} className="benefits-resource-card" target="_blank" rel="noopener noreferrer">
        <span className="benefits-resource-kicker">{item.kicker}</span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <span className="benefits-resource-link">{item.linkLabel}</span>
      </a>
    );
  }
  return (
    <Link href={item.href} className="benefits-resource-card">
      <span className="benefits-resource-kicker">{item.kicker}</span>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <span className="benefits-resource-link">{item.linkLabel}</span>
    </Link>
  );
}

function BenefitsHeroAdmin({ hero, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(hero);

  useEffect(() => {
    setDraft(hero);
  }, [hero]);

  const handleOpen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      setDraft(data.hero || hero);
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load benefits hero.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }, [hero]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveBenefitsConfig({ hero: draft });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BenefitsEditableShell onOpen={() => void handleOpen()} disabled={busy} label="Edit benefits hero">
        {children}
      </BenefitsEditableShell>
      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close benefits hero editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit benefits hero</h3>
            </div>
          </div>
          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                <label>
                  Eyebrow
                  <input type="text" value={draft.eyebrow || ""} onChange={(e) => setDraft((c) => ({ ...c, eyebrow: e.target.value }))} />
                </label>
                <label>
                  Title
                  <input type="text" value={draft.title || ""} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Body
                  <textarea value={draft.body || ""} onChange={(e) => setDraft((c) => ({ ...c, body: e.target.value }))} rows={5} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Logo image URL
                  <input type="text" value={draft.logoSrc || ""} onChange={(e) => setDraft((c) => ({ ...c, logoSrc: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Logo alt text
                  <input type="text" value={draft.logoAlt || ""} onChange={(e) => setDraft((c) => ({ ...c, logoAlt: e.target.value }))} />
                </label>
              </div>
            </section>
            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}
            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

function BenefitsPillarAdmin({ index, item, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ ...item, chipsText: (item.chips || []).join("\n") });

  useEffect(() => {
    setDraft({ ...item, chipsText: (item.chips || []).join("\n") });
  }, [item]);

  const handleOpen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      const next = data.pillars?.[index] || item;
      setDraft({ ...next, chipsText: (next.chips || []).join("\n") });
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load benefits card.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }, [index, item]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      const nextPillars = Array.isArray(data.pillars) ? [...data.pillars] : [];
      nextPillars[index] = {
        kicker: draft.kicker,
        title: draft.title,
        body: draft.body,
        chipsText: draft.chipsText,
      };
      await saveBenefitsConfig({ ...data, pillars: nextPillars });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BenefitsEditableShell onOpen={() => void handleOpen()} disabled={busy} label={`Edit benefits card ${index + 1}`}>
        {children}
      </BenefitsEditableShell>
      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close benefits card editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit benefits card {index + 1}</h3>
            </div>
          </div>
          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                <label>
                  Eyebrow
                  <input type="text" value={draft.kicker || ""} onChange={(e) => setDraft((c) => ({ ...c, kicker: e.target.value }))} />
                </label>
                <label>
                  Title
                  <input type="text" value={draft.title || ""} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Body
                  <textarea value={draft.body || ""} onChange={(e) => setDraft((c) => ({ ...c, body: e.target.value }))} rows={5} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Chips
                  <textarea value={draft.chipsText || ""} onChange={(e) => setDraft((c) => ({ ...c, chipsText: e.target.value }))} rows={5} />
                  <span className="recording-sidebar-modal__help">One line per chip. Leave blank for cards without chips.</span>
                </label>
              </div>
            </section>
            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}
            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

function BenefitsResourcesSectionAdmin({ section, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(section);

  useEffect(() => {
    setDraft(section);
  }, [section]);

  const handleOpen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      setDraft(data.resourcesSection || section);
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load quick access section.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }, [section]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      await saveBenefitsConfig({ ...data, resourcesSection: draft });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BenefitsEditableShell onOpen={() => void handleOpen()} disabled={busy} label="Edit quick access section" contentFit>
        {children}
      </BenefitsEditableShell>
      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close quick access editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit quick access section</h3>
            </div>
          </div>
          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                <label>
                  Eyebrow
                  <input type="text" value={draft.eyebrow || ""} onChange={(e) => setDraft((c) => ({ ...c, eyebrow: e.target.value }))} />
                </label>
                <label>
                  Title
                  <input type="text" value={draft.title || ""} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Description
                  <textarea value={draft.description || ""} onChange={(e) => setDraft((c) => ({ ...c, description: e.target.value }))} rows={4} />
                </label>
              </div>
            </section>
            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}
            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

function BenefitsResourceAdmin({ index, item, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const handleOpen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      setDraft(data.resources?.[index] || item);
      setOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load benefit resource.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }, [index, item]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await fetchBenefitsConfig();
      const nextResources = Array.isArray(data.resources) ? [...data.resources] : [];
      nextResources[index] = {
        kicker: draft.kicker,
        title: draft.title,
        href: draft.href,
        external: Boolean(draft.external),
        summary: draft.summary,
        linkLabel: draft.linkLabel,
      };
      await saveBenefitsConfig({ ...data, resources: nextResources });
      setOpen(false);
      router.refresh();
      showDbToastSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      showDbToastError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BenefitsEditableShell onOpen={() => void handleOpen()} disabled={busy} label={`Edit benefits resource ${index + 1}`}>
        {children}
      </BenefitsEditableShell>
      <ModalLightbox open={open} onClose={() => !busy && setOpen(false)} closeLabel="Close benefits resource editor">
        <div className="recording-sidebar-modal recording-page-editor-modal">
          <div className="recording-sidebar-modal__header">
            <div>
              <p className="recording-sidebar-modal__eyebrow">Admin</p>
              <h3>Edit benefits resource {index + 1}</h3>
            </div>
          </div>
          <form className="recording-sidebar-modal__form" onSubmit={handleSave}>
            <section className="recording-sidebar-modal__section">
              <div className="recording-sidebar-form-grid">
                <label>
                  Eyebrow
                  <input type="text" value={draft.kicker || ""} onChange={(e) => setDraft((c) => ({ ...c, kicker: e.target.value }))} />
                </label>
                <label>
                  Title
                  <input type="text" value={draft.title || ""} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Description
                  <textarea value={draft.summary || ""} onChange={(e) => setDraft((c) => ({ ...c, summary: e.target.value }))} rows={4} />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Href
                  <input type="text" value={draft.href || ""} onChange={(e) => setDraft((c) => ({ ...c, href: e.target.value }))} />
                </label>
                <label>
                  Link label
                  <input type="text" value={draft.linkLabel || ""} onChange={(e) => setDraft((c) => ({ ...c, linkLabel: e.target.value }))} />
                </label>
                <label className="recording-sidebar-form-check">
                  <input type="checkbox" checked={Boolean(draft.external)} onChange={(e) => setDraft((c) => ({ ...c, external: e.target.checked }))} />
                  <span>Open as external link</span>
                </label>
              </div>
            </section>
            {error ? <p className="recording-sidebar-modal__error">{error}</p> : null}
            <div className="recording-sidebar-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </>
  );
}

export default function BenefitsHub({ initialConfig, isAdmin = false }) {
  const hero = initialConfig?.hero || {};
  const pillars = Array.isArray(initialConfig?.pillars) ? initialConfig.pillars : [];
  const resourcesSection = initialConfig?.resourcesSection || {};
  const resources = Array.isArray(initialConfig?.resources) ? initialConfig.resources : [];

  return (
    <div className="benefits-shell">
      {isAdmin ? (
        <BenefitsHeroAdmin hero={hero}>
          <section className="benefits-hero">
            <div className="benefits-hero-copy">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h2>{hero.title}</h2>
              <p>{hero.body}</p>
            </div>
            <div className="benefits-hero-mark">
              <img src={hero.logoSrc} alt={hero.logoAlt} width="420" height="260" className="benefits-hero-logo" />
            </div>
          </section>
        </BenefitsHeroAdmin>
      ) : (
        <section className="benefits-hero">
          <div className="benefits-hero-copy">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h2>{hero.title}</h2>
            <p>{hero.body}</p>
          </div>
          <div className="benefits-hero-mark">
            <img src={hero.logoSrc} alt={hero.logoAlt} width="420" height="260" className="benefits-hero-logo" />
          </div>
        </section>
      )}

      <section className="benefits-section">
        <div className="benefits-pillar-grid">
          {pillars.map((item, index) => {
            const card = (
              <article className="benefits-pillar-card">
                <p className="benefits-pillar-kicker">{item.kicker}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {Array.isArray(item.chips) && item.chips.length ? (
                  <div className="benefits-chip-list" role="list" aria-label={`${item.title} options`}>
                    {item.chips.map((chip) => (
                      <span key={chip} className="benefits-chip">{chip}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
            return isAdmin ? (
              <BenefitsPillarAdmin key={`${item.title}-${index}`} index={index} item={item}>
                {card}
              </BenefitsPillarAdmin>
            ) : (
              <div key={`${item.title}-${index}`}>{card}</div>
            );
          })}
        </div>
      </section>

      <section className="benefits-section">
        {isAdmin ? (
          <BenefitsResourcesSectionAdmin section={resourcesSection}>
            <div className="section-headline benefits-section-headline">
              <p className="eyebrow">{resourcesSection.eyebrow}</p>
              <h2>{resourcesSection.title}</h2>
              {resourcesSection.description ? <p className="benefits-section-description">{resourcesSection.description}</p> : null}
            </div>
          </BenefitsResourcesSectionAdmin>
        ) : (
          <div className="section-headline benefits-section-headline">
            <p className="eyebrow">{resourcesSection.eyebrow}</p>
            <h2>{resourcesSection.title}</h2>
            {resourcesSection.description ? <p className="benefits-section-description">{resourcesSection.description}</p> : null}
          </div>
        )}
        <div className="benefits-resource-grid">
          {resources.map((item, index) => {
            const card = <ResourceCard item={item} />;
            return isAdmin ? (
              <BenefitsResourceAdmin key={`${item.title}-${index}`} index={index} item={item}>
                {card}
              </BenefitsResourceAdmin>
            ) : (
              <div key={`${item.title}-${index}`}>{card}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
