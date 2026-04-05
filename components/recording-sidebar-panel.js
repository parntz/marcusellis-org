"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";
import { ModalLightbox } from "./modal-lightbox";

const SIDEBAR_FAMILY = "recording_sidebar";
const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];
const SIDEBAR_STYLE_OPTIONS = [
  {
    value: "glass-panel",
    label: "Glass Panel",
    description: "Glossy panel with depth and the strongest card treatment.",
  },
  {
    value: "soft-panel",
    label: "Soft Panel",
    description: "Lighter panel with a quieter border and softer surface.",
  },
  {
    value: "bare-panel",
    label: "Bare Panel",
    description: "Minimal shell that lets the content sit more directly in the sidebar.",
  },
];
const SIDEBAR_ACCENT_OPTIONS = [
  { value: "cyan", label: "Cyan", hex: "#24d6ff", rgb: "36, 214, 255" },
  { value: "electric-blue", label: "Electric Blue", hex: "#00a8ff", rgb: "0, 168, 255" },
  { value: "deep-blue", label: "Deep Blue", hex: "#3b82ff", rgb: "59, 130, 255" },
  { value: "gold", label: "Gold", hex: "#ffd54f", rgb: "255, 213, 79" },
  { value: "coral", label: "Coral", hex: "#ff7a6b", rgb: "255, 122, 107" },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function getAccentOption(value = "cyan") {
  return (
    SIDEBAR_ACCENT_OPTIONS.find((option) => option.value === value) ||
    SIDEBAR_ACCENT_OPTIONS[0]
  );
}

function normalizeAppearance(input = {}) {
  const styleName = SIDEBAR_STYLE_OPTIONS.some((option) => option.value === input?.styleName)
    ? input.styleName
    : "glass-panel";
  const accent = getAccentOption(input?.accentColor);
  return {
    styleName,
    accentColor: accent.value,
    showAccentStrip: input?.showAccentStrip !== false,
  };
}

function formatTelHref(phoneDisplay = "", phoneHref = "") {
  const explicit = String(phoneHref || "").trim();
  if (explicit) return explicit;
  const digits = String(phoneDisplay || "").replace(/\D/g, "");
  return digits ? `tel:${digits}` : "";
}

function normalizeContactPayload(payload = {}) {
  return {
    heading: String(payload.heading || "Recording Department"),
    phoneDisplay: String(payload.phoneDisplay || ""),
    phoneHref: String(payload.phoneHref || ""),
    cta: String(payload.cta || ""),
    staff: Array.isArray(payload.staff)
      ? payload.staff.map((member) => ({
          name: String(member?.name || ""),
          email: String(member?.email || ""),
          role: String(member?.role || ""),
        }))
      : [],
    appearance: normalizeAppearance(payload.appearance),
  };
}

function normalizeRatePayload(payload = {}) {
  return {
    heading: String(payload.heading || "Rate Update"),
    paragraph: String(payload.paragraph || ""),
    appearance: normalizeAppearance(payload.appearance),
  };
}

function normalizeBformsPayload(payload = {}) {
  return {
    heading: String(payload.heading || "B Forms"),
    body: String(payload.body || ""),
    linkLabel: String(payload.linkLabel || ""),
    linkHref: String(payload.linkHref || "/scales-forms-agreements"),
    external: Boolean(payload.external),
    appearance: normalizeAppearance(payload.appearance),
  };
}

function normalizeCtaGroupPayload(payload = {}) {
  return {
    items: Array.isArray(payload.items)
      ? payload.items.map((item) => ({
          title: String(item?.title || ""),
          subtitle: String(item?.subtitle || ""),
          href: String(item?.href || ""),
          external: Boolean(item?.external),
        }))
      : [],
    appearance: normalizeAppearance(payload.appearance),
  };
}

function normalizeBox(box = {}) {
  const kind = String(box.kind || "");
  switch (kind) {
    case "contact":
      return { kind, payload: normalizeContactPayload(box.payload) };
    case "rate":
      return { kind, payload: normalizeRatePayload(box.payload) };
    case "bforms":
      return { kind, payload: normalizeBformsPayload(box.payload) };
    case "cta_group":
      return { kind, payload: normalizeCtaGroupPayload(box.payload) };
    default:
      return { kind, payload: { appearance: normalizeAppearance() } };
  }
}

function normalizeBoxes(boxes = []) {
  return (Array.isArray(boxes) ? boxes : []).map(normalizeBox);
}

function toSavePayload(box) {
  const normalized = normalizeBox(box);
  const appearance = normalizeAppearance(normalized.payload.appearance);

  if (normalized.kind === "contact") {
    return {
      kind: normalized.kind,
      payload: {
        heading: normalized.payload.heading.trim(),
        phoneDisplay: normalized.payload.phoneDisplay.trim(),
        phoneHref: formatTelHref(normalized.payload.phoneDisplay, normalized.payload.phoneHref),
        cta: normalized.payload.cta.trim(),
        staff: normalized.payload.staff
          .map((member) => ({
            name: member.name.trim(),
            email: member.email.trim(),
            role: member.role.trim(),
          }))
          .filter((member) => member.name || member.email || member.role),
        appearance,
      },
    };
  }

  if (normalized.kind === "rate") {
    return {
      kind: normalized.kind,
      payload: {
        heading: normalized.payload.heading.trim(),
        paragraph: normalized.payload.paragraph.trim(),
        appearance,
      },
    };
  }

  if (normalized.kind === "bforms") {
    return {
      kind: normalized.kind,
      payload: {
        heading: normalized.payload.heading.trim(),
        body: normalized.payload.body.trim(),
        linkLabel: normalized.payload.linkLabel.trim(),
        linkHref: normalized.payload.linkHref.trim(),
        external: Boolean(normalized.payload.external),
        appearance,
      },
    };
  }

  if (normalized.kind === "cta_group") {
    return {
      kind: normalized.kind,
      payload: {
        items: normalized.payload.items
          .map((item) => ({
            title: item.title.trim(),
            subtitle: item.subtitle.trim(),
            href: item.href.trim(),
            external: Boolean(item.external),
          }))
          .filter((item) => item.title || item.subtitle || item.href),
        appearance,
      },
    };
  }

  return normalized;
}

function getBoxStyleVars(appearance) {
  const accent = getAccentOption(appearance?.accentColor);
  return {
    "--sidebar-accent": accent.hex,
    "--sidebar-accent-rgb": accent.rgb,
  };
}

function getStyleOption(value) {
  return (
    SIDEBAR_STYLE_OPTIONS.find((option) => option.value === value) ||
    SIDEBAR_STYLE_OPTIONS[0]
  );
}

function SidebarAppearanceFields({ appearance, onChange }) {
  const styleOption = getStyleOption(appearance.styleName);

  return (
    <section className="recording-sidebar-modal__section recording-sidebar-modal__section--appearance">
      <div className="recording-sidebar-modal__section-head">
        <p className="recording-sidebar-modal__eyebrow">Appearance</p>
        <h4>Style</h4>
      </div>

      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
        <label>
          Style Name
          <select
            value={appearance.styleName}
            onChange={(event) => onChange({ ...appearance, styleName: event.target.value })}
          >
            {SIDEBAR_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Accent Color
          <select
            value={appearance.accentColor}
            onChange={(event) => onChange({ ...appearance, accentColor: event.target.value })}
          >
            {SIDEBAR_ACCENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="recording-sidebar-form-check">
        <input
          type="checkbox"
          checked={appearance.showAccentStrip}
          onChange={(event) =>
            onChange({
              ...appearance,
              showAccentStrip: event.target.checked,
            })
          }
        />
        <span>Show accent strip on the left edge</span>
      </label>

      <p className="recording-sidebar-modal__help">{styleOption.description}</p>
    </section>
  );
}

function ContactFormFields({ payload, onChange }) {
  const staff = payload.staff || [];

  function updateField(field, value) {
    onChange({ ...payload, [field]: value });
  }

  function updateStaff(index, field, value) {
    onChange({
      ...payload,
      staff: staff.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      ),
    });
  }

  function addStaff() {
    onChange({
      ...payload,
      staff: [...staff, { name: "", email: "", role: "" }],
    });
  }

  function removeStaff(index) {
    onChange({
      ...payload,
      staff: staff.filter((_, memberIndex) => memberIndex !== index),
    });
  }

  return (
    <>
      <section className="recording-sidebar-modal__section">
        <div className="recording-sidebar-modal__section-head">
          <p className="recording-sidebar-modal__eyebrow">Content</p>
          <h4>Recording Department Box</h4>
        </div>

        <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
          <label>
            Heading
            <input type="text" value={payload.heading} onChange={(event) => updateField("heading", event.target.value)} />
          </label>

          <label>
            Phone Number
            <input
              type="text"
              value={payload.phoneDisplay}
              onChange={(event) => updateField("phoneDisplay", event.target.value)}
            />
          </label>

          <label className="recording-sidebar-form-grid__wide">
            Phone Link
            <input
              type="text"
              value={payload.phoneHref}
              onChange={(event) => updateField("phoneHref", event.target.value)}
              placeholder="Leave blank to build a tel: link automatically"
            />
          </label>

          <label className="recording-sidebar-form-grid__wide">
            Supporting Line
            <input type="text" value={payload.cta} onChange={(event) => updateField("cta", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="recording-sidebar-modal__section">
        <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
          <div>
            <p className="recording-sidebar-modal__eyebrow">People</p>
            <h4>Staff Entries</h4>
          </div>
          <button type="button" className="btn btn-primary" onClick={addStaff}>
            Add Staff
          </button>
        </div>

        <div className="recording-sidebar-repeater">
          {staff.length ? (
            staff.map((member, index) => (
              <section key={`staff-${index}`} className="recording-sidebar-repeater__item">
                <div className="recording-sidebar-repeater__header">
                  <strong>Staff {index + 1}</strong>
                  <button type="button" className="btn btn-ghost" onClick={() => removeStaff(index)}>
                    Delete
                  </button>
                </div>
                <div className="recording-sidebar-form-grid recording-sidebar-form-grid--3col">
                  <label>
                    Name
                    <input
                      type="text"
                      value={member.name}
                      onChange={(event) => updateStaff(index, "name", event.target.value)}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={member.email}
                      onChange={(event) => updateStaff(index, "email", event.target.value)}
                    />
                  </label>
                  <label>
                    Role
                    <input
                      type="text"
                      value={member.role}
                      onChange={(event) => updateStaff(index, "role", event.target.value)}
                    />
                  </label>
                </div>
              </section>
            ))
          ) : (
            <p className="recording-sidebar-modal__help">No staff entries yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

function RateFormFields({ payload, onChange }) {
  return (
    <section className="recording-sidebar-modal__section">
      <div className="recording-sidebar-modal__section-head">
        <p className="recording-sidebar-modal__eyebrow">Content</p>
        <h4>Rate Update Box</h4>
      </div>

      <div className="recording-sidebar-form-grid">
        <label>
          Heading
          <input
            type="text"
            value={payload.heading}
            onChange={(event) => onChange({ ...payload, heading: event.target.value })}
          />
        </label>
        <label>
          Paragraph
          <textarea
            rows="6"
            value={payload.paragraph}
            onChange={(event) => onChange({ ...payload, paragraph: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}

function BformsFormFields({ payload, onChange }) {
  return (
    <section className="recording-sidebar-modal__section">
      <div className="recording-sidebar-modal__section-head">
        <p className="recording-sidebar-modal__eyebrow">Content</p>
        <h4>B Forms Box</h4>
      </div>

      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
        <label>
          Heading
          <input
            type="text"
            value={payload.heading}
            onChange={(event) => onChange({ ...payload, heading: event.target.value })}
          />
        </label>

        <label>
          Link Label
          <input
            type="text"
            value={payload.linkLabel}
            onChange={(event) => onChange({ ...payload, linkLabel: event.target.value })}
          />
        </label>

        <label className="recording-sidebar-form-grid__wide">
          Body
          <textarea
            rows="5"
            value={payload.body}
            onChange={(event) => onChange({ ...payload, body: event.target.value })}
          />
        </label>

        <label className="recording-sidebar-form-grid__wide">
          Link URL
          <input
            type="text"
            value={payload.linkHref}
            onChange={(event) => onChange({ ...payload, linkHref: event.target.value })}
          />
        </label>
      </div>

      <label className="recording-sidebar-form-check">
        <input
          type="checkbox"
          checked={payload.external}
          onChange={(event) => onChange({ ...payload, external: event.target.checked })}
        />
        <span>Open this box as an external link</span>
      </label>
    </section>
  );
}

function CtaGroupFormFields({ payload, onChange }) {
  const items = payload.items || [];

  function updateItem(index, field, value) {
    onChange({
      ...payload,
      items: items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    });
  }

  function addItem() {
    onChange({
      ...payload,
      items: [...items, { title: "", subtitle: "", href: "", external: false }],
    });
  }

  function removeItem(index) {
    onChange({
      ...payload,
      items: items.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <section className="recording-sidebar-modal__section">
      <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
        <div>
          <p className="recording-sidebar-modal__eyebrow">Links</p>
          <h4>CTA Group</h4>
        </div>
        <button type="button" className="btn btn-primary" onClick={addItem}>
          Add Link
        </button>
      </div>

      <div className="recording-sidebar-repeater">
        {items.length ? (
          items.map((item, index) => (
            <section key={`cta-${index}`} className="recording-sidebar-repeater__item">
              <div className="recording-sidebar-repeater__header">
                <strong>CTA {index + 1}</strong>
                <button type="button" className="btn btn-ghost" onClick={() => removeItem(index)}>
                  Delete
                </button>
              </div>
              <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
                <label>
                  Title
                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) => updateItem(index, "title", event.target.value)}
                  />
                </label>
                <label>
                  URL
                  <input
                    type="text"
                    value={item.href}
                    onChange={(event) => updateItem(index, "href", event.target.value)}
                  />
                </label>
                <label className="recording-sidebar-form-grid__wide">
                  Subtitle
                  <input
                    type="text"
                    value={item.subtitle}
                    onChange={(event) => updateItem(index, "subtitle", event.target.value)}
                  />
                </label>
              </div>
              <label className="recording-sidebar-form-check">
                <input
                  type="checkbox"
                  checked={item.external}
                  onChange={(event) => updateItem(index, "external", event.target.checked)}
                />
                <span>Open this CTA as an external link</span>
              </label>
            </section>
          ))
        ) : (
          <p className="recording-sidebar-modal__help">No calls to action yet.</p>
        )}
      </div>
    </section>
  );
}

function SidebarBoxEditor({ box, onChange }) {
  const payload = box.payload;

  switch (box.kind) {
    case "contact":
      return <ContactFormFields payload={payload} onChange={(next) => onChange({ ...box, payload: next })} />;
    case "rate":
      return <RateFormFields payload={payload} onChange={(next) => onChange({ ...box, payload: next })} />;
    case "bforms":
      return <BformsFormFields payload={payload} onChange={(next) => onChange({ ...box, payload: next })} />;
    case "cta_group":
      return <CtaGroupFormFields payload={payload} onChange={(next) => onChange({ ...box, payload: next })} />;
    default:
      return null;
  }
}

function EditableSidebarBox({ box, isAdmin = false, onEdit, children }) {
  const [overlayActive, setOverlayActive] = useState(false);
  const [glassVariant, setGlassVariant] = useState(GLASS_VARIANTS[0]);
  const [glassCycle, setGlassCycle] = useState(0);

  const triggerGlassEffect = useCallback(() => {
    setGlassVariant((current) => pickRandomGlassVariant(current));
    setGlassCycle((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !overlayActive) return undefined;
    triggerGlassEffect();
    const id = window.setInterval(triggerGlassEffect, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, overlayActive, triggerGlassEffect]);

  return (
    <div
      className="recording-sidebar-box-wrap"
      onMouseEnter={isAdmin ? () => setOverlayActive(true) : undefined}
      onMouseLeave={isAdmin ? () => setOverlayActive(false) : undefined}
      onFocusCapture={isAdmin ? () => setOverlayActive(true) : undefined}
      onBlurCapture={
        isAdmin
          ? (event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setOverlayActive(false);
              }
            }
          : undefined
      }
    >
      {children}
      {isAdmin ? (
        <button
          type="button"
          className="recording-sidebar-box__admin-overlay"
          onClick={onEdit}
          aria-label="Edit sidebar callout"
          data-active={overlayActive ? "true" : "false"}
        >
          <span className="recording-sidebar-box__admin-overlay__wash" aria-hidden="true">
            {overlayActive ? (
              <span
                key={`${glassVariant}-${glassCycle}`}
                className={`recording-sidebar-box__admin-overlay__glass recording-sidebar-box__admin-overlay__glass--${glassVariant}`}
              />
            ) : null}
          </span>
        </button>
      ) : null}
    </div>
  );
}

function ContactBox({ payload, rootClassName, rootStyle }) {
  const heading = payload.heading || "Recording Department";
  const phoneDisplay = payload.phoneDisplay || "";
  const phoneHref = formatTelHref(payload.phoneDisplay, payload.phoneHref);
  const cta = payload.cta || "";
  const staff = Array.isArray(payload.staff) ? payload.staff : [];

  return (
    <div className={`${rootClassName} recording-contact-box`} style={rootStyle}>
      <h3 className="recording-sidebar-heading">{heading}</h3>
      {phoneDisplay ? (
        <a href={phoneHref} className="recording-phone">
          {phoneDisplay}
        </a>
      ) : null}
      {cta ? <p className="recording-contact-cta">{cta}</p> : null}
      <div className="recording-staff">
        {staff.map((member, idx) => (
          <div key={`${member.email || member.name || idx}`} className="recording-staff-member">
            {member.email ? (
              <a href={`mailto:${member.email}`}>{member.name || member.email}</a>
            ) : (
              <span className="recording-staff-member__name">{member.name}</span>
            )}
            {member.role ? <span>{member.role}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function RateBox({ payload, rootClassName, rootStyle }) {
  if (!payload.paragraph) return null;

  return (
    <div className={`${rootClassName} recording-callout recording-rate-callout`} style={rootStyle}>
      <h3 className="recording-sidebar-heading">{payload.heading || "Rate Update"}</h3>
      <p>{payload.paragraph}</p>
    </div>
  );
}

function BformsBox({ payload, rootClassName, rootStyle }) {
  const heading = payload.heading || "B Forms";
  const body = payload.body || "";
  const linkLabel = payload.linkLabel || "";
  const linkHref = payload.linkHref || "/scales-forms-agreements";
  const sharedClassName = `${rootClassName} recording-callout recording-bforms-callout`;

  if (payload.external) {
    return (
      <a href={linkHref} className={sharedClassName} style={rootStyle} target="_blank" rel="noreferrer">
        <h3 className="recording-bforms-title">{heading}</h3>
        {body ? <p>{body}</p> : null}
        {linkLabel ? <span className="recording-callout-link">{linkLabel}</span> : null}
      </a>
    );
  }

  return (
    <Link href={linkHref} className={sharedClassName} style={rootStyle}>
      <h3 className="recording-bforms-title">{heading}</h3>
      {body ? <p>{body}</p> : null}
      {linkLabel ? <span className="recording-callout-link">{linkLabel}</span> : null}
    </Link>
  );
}

function CtaGroupBox({ payload, rootClassName, rootStyle }) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return (
    <div className={`${rootClassName} recording-cta-box recording-cta-box--sidebar`} style={rootStyle}>
      {items.map((item, idx) => {
        const title = item.title || "";
        const subtitle = item.subtitle || "";
        const href = item.href || "#";
        const external = Boolean(item.external);
        const className = "recording-cta-item";

        if (external) {
          return (
            <a
              key={`${href}-${idx}`}
              href={href}
              className={className}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{title}</strong>
              {subtitle ? <span>{subtitle}</span> : null}
            </a>
          );
        }

        return (
          <Link key={`${href}-${idx}`} href={href} className={className}>
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

function renderSidebarBox(box, isAdmin, onEdit) {
  const appearance = normalizeAppearance(box.payload?.appearance);
  const rootClassName = [
    "recording-sidebar-box",
    `recording-sidebar-box--${appearance.styleName}`,
    appearance.showAccentStrip ? "" : "recording-sidebar-box--no-accent",
  ]
    .filter(Boolean)
    .join(" ");
  const rootStyle = getBoxStyleVars(appearance);

  let content = null;
  switch (box.kind) {
    case "contact":
      content = <ContactBox payload={box.payload} rootClassName={rootClassName} rootStyle={rootStyle} />;
      break;
    case "rate":
      content = <RateBox payload={box.payload} rootClassName={rootClassName} rootStyle={rootStyle} />;
      break;
    case "bforms":
      content = <BformsBox payload={box.payload} rootClassName={rootClassName} rootStyle={rootStyle} />;
      break;
    case "cta_group":
      content = <CtaGroupBox payload={box.payload} rootClassName={rootClassName} rootStyle={rootStyle} />;
      break;
    default:
      content = null;
  }

  if (!content) return null;

  return (
    <EditableSidebarBox box={box} isAdmin={isAdmin} onEdit={onEdit}>
      {content}
    </EditableSidebarBox>
  );
}

export function RecordingSidebarPanel({
  boxes,
  pageRoute = "",
  familyKey = SIDEBAR_FAMILY,
  isAdmin = false,
}) {
  const router = useRouter();
  const [currentBoxes, setCurrentBoxes] = useState(() => normalizeBoxes(boxes));
  const [editingIndex, setEditingIndex] = useState(-1);
  const [draftBox, setDraftBox] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentBoxes(normalizeBoxes(boxes));
  }, [boxes]);

  const editingBox = useMemo(() => {
    if (editingIndex < 0) return null;
    return draftBox || currentBoxes[editingIndex] || null;
  }, [currentBoxes, draftBox, editingIndex]);

  const openEditor = useCallback(
    (index) => {
      setEditingIndex(index);
      setDraftBox(clone(currentBoxes[index]));
      setError("");
    },
    [currentBoxes]
  );

  const closeEditor = useCallback(() => {
    setEditingIndex(-1);
    setDraftBox(null);
    setError("");
  }, []);

  const saveBox = useCallback(
    async (event) => {
      event.preventDefault();
      if (!pageRoute || editingIndex < 0 || !editingBox) {
        setError("This sidebar box cannot be saved from this page.");
        return;
      }

      const nextBoxes = currentBoxes.map((box, index) =>
        index === editingIndex ? toSavePayload(editingBox) : toSavePayload(box)
      );

      setSaveBusy(true);
      setError("");
      try {
        const res = await fetch("/api/site-config/sidebar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageRoute,
            familyKey,
            boxes: nextBoxes,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || "Save failed.";
          setError(msg);
          showDbToastError("Database update failed.");
          return;
        }
        const savedBoxes = normalizeBoxes(data.boxes || []);
        setCurrentBoxes(savedBoxes);
        setDraftBox(null);
        setEditingIndex(-1);
        router.refresh();
        showDbToastSuccess();
      } catch {
        setError("Save failed.");
        showDbToastError("Database update failed.");
      } finally {
        setSaveBusy(false);
      }
    },
    [currentBoxes, editingBox, editingIndex, familyKey, pageRoute, router]
  );

  if (!currentBoxes.length) {
    return null;
  }

  return (
    <>
      {currentBoxes.map((box, index) => {
        const rendered = renderSidebarBox(box, isAdmin, () => openEditor(index));
        return rendered ? <div key={`sidebar-${index}-${box.kind}`}>{rendered}</div> : null;
      })}

      {isAdmin && editingBox ? (
        <ModalLightbox open onClose={closeEditor} closeLabel="Close sidebar callout editor">
          <div className="recording-sidebar-modal">
            <div className="recording-sidebar-modal__header">
              <div>
                <p className="recording-sidebar-modal__eyebrow">Admin</p>
                <h3>Edit Sidebar Callout</h3>
              </div>
            </div>

            <form className="recording-sidebar-modal__form" onSubmit={saveBox}>
              <SidebarAppearanceFields
                appearance={normalizeAppearance(editingBox.payload?.appearance)}
                onChange={(appearance) =>
                  setDraftBox((current) => ({
                    ...current,
                    payload: {
                      ...current.payload,
                      appearance,
                    },
                  }))
                }
              />

              <SidebarBoxEditor box={editingBox} onChange={setDraftBox} />

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
                  {saveBusy ? "Saving..." : "Save Callout"}
                </button>
              </div>
            </form>
          </div>
        </ModalLightbox>
      ) : null}
    </>
  );
}
