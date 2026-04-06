"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";
import { ModalLightbox } from "./modal-lightbox";
import { NewsEventsBodyEditor } from "./news-events-body-editor";

const SIDEBAR_FAMILY = "recording_sidebar";
const GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];
const SIDEBAR_LAYOUT_OPTIONS = [
  {
    value: "standard",
    label: "Standard Stack",
    description: "Balanced spacing for most sidebar panels.",
  },
  {
    value: "compact",
    label: "Compact Stack",
    description: "Tighter spacing for denser informational callouts.",
  },
  {
    value: "feature",
    label: "Feature Panel",
    description: "Roomier spacing for a more promotional panel treatment.",
  },
];
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
const SIDEBAR_BLOCK_TYPE_OPTIONS = [
  {
    value: "phone",
    label: "Phone Callout",
    description: "Large phone number with small supporting copy underneath.",
  },
  {
    value: "person",
    label: "Name + Title",
    description: "One person row with a name, optional email link, and title line.",
  },
  {
    value: "text",
    label: "Plain Text",
    description: "Simple paragraph copy.",
  },
  {
    value: "html",
    label: "Simple HTML",
    description: "Rich text block using the inline HTML editor.",
  },
  {
    value: "link",
    label: "Accent Link",
    description: "A text link with optional supporting note.",
  },
  {
    value: "cta",
    label: "CTA Card",
    description: "A larger linked card with title and subtitle.",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pickRandomGlassVariant(current = GLASS_VARIANTS[0]) {
  const options = GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanHref(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function cleanHtml(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAccentOption(value = "cyan") {
  return SIDEBAR_ACCENT_OPTIONS.find((option) => option.value === value) || SIDEBAR_ACCENT_OPTIONS[0];
}

function getLayoutOption(value = "standard") {
  return SIDEBAR_LAYOUT_OPTIONS.find((option) => option.value === value) || SIDEBAR_LAYOUT_OPTIONS[0];
}

function getStyleOption(value = "glass-panel") {
  return SIDEBAR_STYLE_OPTIONS.find((option) => option.value === value) || SIDEBAR_STYLE_OPTIONS[0];
}

function getBlockTypeOption(value = "text") {
  return SIDEBAR_BLOCK_TYPE_OPTIONS.find((option) => option.value === value) || SIDEBAR_BLOCK_TYPE_OPTIONS[0];
}

function normalizeAppearance(input = {}) {
  const layoutName = SIDEBAR_LAYOUT_OPTIONS.some((option) => option.value === input?.layoutName)
    ? input.layoutName
    : "standard";
  const styleName = SIDEBAR_STYLE_OPTIONS.some((option) => option.value === input?.styleName)
    ? input.styleName
    : "glass-panel";
  const accent = getAccentOption(input?.accentColor);
  return {
    layoutName,
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

function emptyContentBlock(type = "text") {
  switch (type) {
    case "phone":
      return {
        type,
        phoneDisplay: "",
        phoneHref: "",
        supportingText: "",
      };
    case "person":
      return {
        type,
        name: "",
        email: "",
        title: "",
      };
    case "html":
      return {
        type,
        html: "",
      };
    case "link":
      return {
        type,
        label: "",
        href: "",
        external: false,
        supportingText: "",
      };
    case "cta":
      return {
        type,
        title: "",
        subtitle: "",
        href: "",
        external: false,
      };
    case "text":
    default:
      return {
        type: "text",
        text: "",
      };
  }
}

function normalizeContentBlock(input = {}) {
  const type = SIDEBAR_BLOCK_TYPE_OPTIONS.some((option) => option.value === input?.type)
    ? input.type
    : "text";

  if (type === "phone") {
    return {
      type,
      phoneDisplay: cleanText(input.phoneDisplay, 80),
      phoneHref: cleanHref(input.phoneHref, 255),
      supportingText: cleanText(input.supportingText, 240),
    };
  }

  if (type === "person") {
    return {
      type,
      name: cleanText(input.name, 120),
      email: cleanText(input.email, 160),
      title: cleanText(input.title, 160),
    };
  }

  if (type === "html") {
    return {
      type,
      html: cleanHtml(input.html),
    };
  }

  if (type === "link") {
    return {
      type,
      label: cleanText(input.label, 140),
      href: cleanHref(input.href, 500),
      external: Boolean(input.external),
      supportingText: cleanText(input.supportingText, 240),
    };
  }

  if (type === "cta") {
    return {
      type,
      title: cleanText(input.title, 140),
      subtitle: cleanText(input.subtitle, 240),
      href: cleanHref(input.href, 500),
      external: Boolean(input.external),
    };
  }

  return {
    type: "text",
    text: cleanText(input.text, 600),
  };
}

function defaultHeadingForKind(kind = "") {
  if (kind === "contact") return "Recording Department";
  if (kind === "rate") return "Rate Update";
  if (kind === "bforms") return "B Forms";
  return "";
}

function paragraphsToHtml(value) {
  const text = cleanText(value, 1000);
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

function legacyBlocksForPayload(kind, payload = {}) {
  if (Array.isArray(payload.contentBlocks) && payload.contentBlocks.length) {
    return payload.contentBlocks.map(normalizeContentBlock);
  }

  if (kind === "contact") {
    const blocks = [];
    if (payload.phoneDisplay || payload.cta) {
      blocks.push(
        normalizeContentBlock({
          type: "phone",
          phoneDisplay: payload.phoneDisplay || "",
          phoneHref: payload.phoneHref || "",
          supportingText: payload.cta || "",
        })
      );
    }
    const staff = Array.isArray(payload.staff) ? payload.staff : [];
    staff.forEach((member) => {
      blocks.push(
        normalizeContentBlock({
          type: "person",
          name: member?.name || "",
          email: member?.email || "",
          title: member?.role || "",
        })
      );
    });
    return blocks;
  }

  if (kind === "rate") {
    return payload.paragraph
      ? [normalizeContentBlock({ type: "html", html: paragraphsToHtml(payload.paragraph) })]
      : [];
  }

  if (kind === "bforms") {
    const blocks = [];
    if (payload.body) {
      blocks.push(normalizeContentBlock({ type: "text", text: payload.body }));
    }
    if (payload.linkLabel || payload.linkHref) {
      blocks.push(
        normalizeContentBlock({
          type: "link",
          label: payload.linkLabel || "Open link",
          href: payload.linkHref || "",
          external: payload.external,
        })
      );
    }
    return blocks;
  }

  if (kind === "cta_group") {
    return (Array.isArray(payload.items) ? payload.items : []).map((item) =>
      normalizeContentBlock({
        type: "cta",
        title: item?.title || "",
        subtitle: item?.subtitle || "",
        href: item?.href || "",
        external: item?.external,
      })
    );
  }

  return [];
}

function normalizePayloadByKind(kind, payload = {}) {
  return {
    heading: cleanText(payload.heading, 160) || defaultHeadingForKind(kind),
    appearance: normalizeAppearance(payload.appearance),
    contentBlocks: legacyBlocksForPayload(kind, payload),
  };
}

function normalizeBox(box = {}) {
  const kind = String(box.kind || "");
  return {
    kind,
    payload: normalizePayloadByKind(kind, box.payload),
  };
}

function normalizeBoxes(boxes = []) {
  return (Array.isArray(boxes) ? boxes : []).map(normalizeBox);
}

function toSavePayload(box) {
  const normalized = normalizeBox(box);
  return {
    kind: normalized.kind,
    payload: {
      heading: normalized.payload.heading,
      appearance: normalized.payload.appearance,
      contentBlocks: normalized.payload.contentBlocks,
    },
  };
}

function getBoxStyleVars(appearance) {
  const accent = getAccentOption(appearance?.accentColor);
  return {
    "--sidebar-accent": accent.hex,
    "--sidebar-accent-rgb": accent.rgb,
  };
}

function moveItem(list, fromIndex, delta) {
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= list.length) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function renderLinkedElement({ href, external = false, className, children, key }) {
  if (!href) {
    return (
      <span key={key} className={className}>
        {children}
      </span>
    );
  }

  if (external) {
    return (
      <a key={key} href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link key={key} href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a key={key} href={href} className={className}>
      {children}
    </a>
  );
}

function SidebarAppearanceFields({ appearance, onChange }) {
  const layoutOption = getLayoutOption(appearance.layoutName);
  const styleOption = getStyleOption(appearance.styleName);

  return (
    <section className="recording-sidebar-modal__section recording-sidebar-modal__section--appearance">
      <div className="recording-sidebar-modal__section-head">
        <p className="recording-sidebar-modal__eyebrow">Appearance</p>
        <h4>Layout & Style</h4>
      </div>

      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
        <label>
          Layout
          <select
            value={appearance.layoutName}
            onChange={(event) => onChange({ ...appearance, layoutName: event.target.value })}
          >
            {SIDEBAR_LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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

      <p className="recording-sidebar-modal__help">{layoutOption.description}</p>
      <p className="recording-sidebar-modal__help">{styleOption.description}</p>
    </section>
  );
}

function SidebarContentBlockFields({ block, onChange }) {
  if (block.type === "phone") {
    return (
      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
        <label>
          Phone Number
          <input
            type="text"
            value={block.phoneDisplay}
            onChange={(event) => onChange({ ...block, phoneDisplay: event.target.value })}
            placeholder="615-244-9514"
          />
        </label>
        <label>
          Phone Link
          <input
            type="text"
            value={block.phoneHref}
            onChange={(event) => onChange({ ...block, phoneHref: event.target.value })}
            placeholder="Leave blank to build a tel: link"
          />
        </label>
        <label className="recording-sidebar-form-grid__wide">
          Supporting Text
          <input
            type="text"
            value={block.supportingText}
            onChange={(event) => onChange({ ...block, supportingText: event.target.value })}
            placeholder="Call for more information"
          />
        </label>
      </div>
    );
  }

  if (block.type === "person") {
    return (
      <div className="recording-sidebar-form-grid recording-sidebar-form-grid--3col">
        <label>
          Name
          <input
            type="text"
            value={block.name}
            onChange={(event) => onChange({ ...block, name: event.target.value })}
            placeholder="Billy Lynn"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={block.email}
            onChange={(event) => onChange({ ...block, email: event.target.value })}
            placeholder="billy@nashvillemusicians.org"
          />
        </label>
        <label>
          Title
          <input
            type="text"
            value={block.title}
            onChange={(event) => onChange({ ...block, title: event.target.value })}
            placeholder="Director of Recording"
          />
        </label>
      </div>
    );
  }

  if (block.type === "html") {
    return (
      <div className="recording-page-editor__richtext">
        <NewsEventsBodyEditor value={block.html} onChange={(html) => onChange({ ...block, html })} labelledBy="" />
      </div>
    );
  }

  if (block.type === "link") {
    return (
      <>
        <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
          <label>
            Link Label
            <input
              type="text"
              value={block.label}
              onChange={(event) => onChange({ ...block, label: event.target.value })}
              placeholder="View under Scales, Forms & Agreements"
            />
          </label>
          <label>
            Link URL
            <input
              type="text"
              value={block.href}
              onChange={(event) => onChange({ ...block, href: event.target.value })}
              placeholder="/scales-forms-agreements"
            />
          </label>
          <label className="recording-sidebar-form-grid__wide">
            Supporting Note
            <input
              type="text"
              value={block.supportingText}
              onChange={(event) => onChange({ ...block, supportingText: event.target.value })}
              placeholder="Optional supporting line under the link"
            />
          </label>
        </div>
        <label className="recording-sidebar-form-check">
          <input
            type="checkbox"
            checked={block.external}
            onChange={(event) => onChange({ ...block, external: event.target.checked })}
          />
          <span>Open this link externally</span>
        </label>
      </>
    );
  }

  if (block.type === "cta") {
    return (
      <>
        <div className="recording-sidebar-form-grid recording-sidebar-form-grid--2col">
          <label>
            Card Title
            <input
              type="text"
              value={block.title}
              onChange={(event) => onChange({ ...block, title: event.target.value })}
              placeholder="Scales & Agreements"
            />
          </label>
          <label>
            Card URL
            <input
              type="text"
              value={block.href}
              onChange={(event) => onChange({ ...block, href: event.target.value })}
              placeholder="/scales-forms-agreements"
            />
          </label>
          <label className="recording-sidebar-form-grid__wide">
            Card Subtitle
            <input
              type="text"
              value={block.subtitle}
              onChange={(event) => onChange({ ...block, subtitle: event.target.value })}
              placeholder="Recording scales, forms, and contract information"
            />
          </label>
        </div>
        <label className="recording-sidebar-form-check">
          <input
            type="checkbox"
            checked={block.external}
            onChange={(event) => onChange({ ...block, external: event.target.checked })}
          />
          <span>Open this CTA externally</span>
        </label>
      </>
    );
  }

  return (
    <div className="recording-sidebar-form-grid">
      <label>
        Paragraph
        <textarea
          rows="5"
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          placeholder="Simple paragraph copy"
        />
      </label>
    </div>
  );
}

function SidebarContentEditor({ box, onChange }) {
  const payload = box.payload;
  const blocks = Array.isArray(payload.contentBlocks) ? payload.contentBlocks : [];
  const [nextBlockType, setNextBlockType] = useState("phone");

  useEffect(() => {
    if (!SIDEBAR_BLOCK_TYPE_OPTIONS.some((option) => option.value === nextBlockType)) {
      setNextBlockType("phone");
    }
  }, [nextBlockType]);

  function updatePayload(nextPayload) {
    onChange({
      ...box,
      payload: nextPayload,
    });
  }

  function updateBlock(index, nextBlock) {
    updatePayload({
      ...payload,
      contentBlocks: blocks.map((block, blockIndex) => (blockIndex === index ? normalizeContentBlock(nextBlock) : block)),
    });
  }

  function changeBlockType(index, nextType) {
    updateBlock(index, emptyContentBlock(nextType));
  }

  function addBlock() {
    updatePayload({
      ...payload,
      contentBlocks: [...blocks, emptyContentBlock(nextBlockType)],
    });
  }

  function removeBlock(index) {
    updatePayload({
      ...payload,
      contentBlocks: blocks.filter((_, blockIndex) => blockIndex !== index),
    });
  }

  function moveBlock(index, delta) {
    updatePayload({
      ...payload,
      contentBlocks: moveItem(blocks, index, delta),
    });
  }

  return (
    <>
      <section className="recording-sidebar-modal__section">
        <div className="recording-sidebar-modal__section-head">
          <p className="recording-sidebar-modal__eyebrow">Content</p>
          <h4>Panel Structure</h4>
        </div>

        <div className="recording-sidebar-form-grid">
          <label>
            Heading
            <input
              type="text"
              value={payload.heading || ""}
              onChange={(event) => updatePayload({ ...payload, heading: event.target.value })}
              placeholder={defaultHeadingForKind(box.kind) || "Optional heading"}
            />
          </label>
        </div>
      </section>

      <section className="recording-sidebar-modal__section">
        <div className="recording-sidebar-modal__section-head recording-sidebar-modal__section-head--row">
          <div>
            <p className="recording-sidebar-modal__eyebrow">Blocks</p>
            <h4>Ordered Content</h4>
          </div>
          <div className="recording-sidebar-block-picker">
            <select value={nextBlockType} onChange={(event) => setNextBlockType(event.target.value)}>
              {SIDEBAR_BLOCK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={addBlock}>
              Add Block
            </button>
          </div>
        </div>

        <p className="recording-sidebar-modal__help">{getBlockTypeOption(nextBlockType).description}</p>

        <div className="recording-sidebar-repeater">
          {blocks.length ? (
            blocks.map((block, index) => (
              <section
                key={`content-block-${index}-${block.type}`}
                className={`recording-sidebar-repeater__item recording-sidebar-repeater__item--${block.type}`}
              >
                <div className="recording-sidebar-repeater__header">
                  <strong>
                    {index + 1}. {getBlockTypeOption(block.type).label}
                  </strong>
                  <div className="recording-sidebar-repeater__actions">
                    <button type="button" className="btn btn-ghost" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                      Up
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                    >
                      Down
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => removeBlock(index)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="recording-sidebar-form-grid">
                  <label>
                    Block Type
                    <select value={block.type} onChange={(event) => changeBlockType(index, event.target.value)}>
                      {SIDEBAR_BLOCK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <SidebarContentBlockFields block={block} onChange={(nextBlock) => updateBlock(index, nextBlock)} />
              </section>
            ))
          ) : (
            <p className="recording-sidebar-modal__help">
              No content blocks yet. Add blocks like phone callouts, people, HTML, links, and CTA cards.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function SidebarBoxEditor({ box, onChange }) {
  return <SidebarContentEditor box={box} onChange={onChange} />;
}

function EditableSidebarBox({ isAdmin = false, onEdit, children }) {
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

function renderSidebarBlock(block, index) {
  if (block.type === "phone") {
    const href = formatTelHref(block.phoneDisplay, block.phoneHref);
    return (
      <div key={`sidebar-block-${index}`} className="recording-sidebar-block recording-sidebar-block--phone">
        {block.phoneDisplay ? (
          <a href={href} className="recording-phone">
            {block.phoneDisplay}
          </a>
        ) : null}
        {block.supportingText ? <p className="recording-contact-cta">{block.supportingText}</p> : null}
      </div>
    );
  }

  if (block.type === "person") {
    return (
      <div key={`sidebar-block-${index}`} className="recording-sidebar-block recording-sidebar-block--person">
        {block.email ? (
          <a href={`mailto:${block.email}`} className="recording-sidebar-person-name">
            {block.name || block.email}
          </a>
        ) : (
          <span className="recording-sidebar-person-name">{block.name}</span>
        )}
        {block.title ? <span className="recording-sidebar-person-title">{block.title}</span> : null}
      </div>
    );
  }

  if (block.type === "html") {
    return (
      <div
        key={`sidebar-block-${index}`}
        className="recording-sidebar-block recording-sidebar-block--html recording-sidebar-richtext richtext"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }

  if (block.type === "link") {
    return (
      <div key={`sidebar-block-${index}`} className="recording-sidebar-block recording-sidebar-block--link">
        {renderLinkedElement({
          key: `sidebar-link-${index}`,
          href: block.href,
          external: block.external,
          className: "recording-callout-link",
          children: block.label || "Open link",
        })}
        {block.supportingText ? <p className="recording-sidebar-link-note">{block.supportingText}</p> : null}
      </div>
    );
  }

  if (block.type === "cta") {
    return renderLinkedElement({
      key: `sidebar-cta-${index}`,
      href: block.href,
      external: block.external,
      className: "recording-sidebar-block recording-sidebar-block--cta recording-cta-item",
      children: (
        <>
          <strong>{block.title || "CTA"}</strong>
          {block.subtitle ? <span>{block.subtitle}</span> : null}
        </>
      ),
    });
  }

  return (
    <div key={`sidebar-block-${index}`} className="recording-sidebar-block recording-sidebar-block--text">
      {block.text ? <p>{block.text}</p> : null}
    </div>
  );
}

function GenericSidebarBox({ kind, payload, rootClassName, rootStyle }) {
  const appearance = normalizeAppearance(payload.appearance);
  const kindClassName =
    kind === "contact"
      ? "recording-contact-box"
      : kind === "rate"
        ? "recording-callout recording-rate-callout"
        : kind === "bforms"
          ? "recording-callout recording-bforms-callout"
          : "recording-cta-box recording-cta-box--sidebar";

  const className = [
    rootClassName,
    kindClassName,
    `recording-sidebar-box--layout-${appearance.layoutName}`,
  ]
    .filter(Boolean)
    .join(" ");

  const blocks = Array.isArray(payload.contentBlocks) ? payload.contentBlocks : [];

  return (
    <div className={className} style={rootStyle}>
      {payload.heading ? <h3 className="recording-sidebar-heading">{payload.heading}</h3> : null}
      <div className={`recording-sidebar-blocks recording-sidebar-blocks--${appearance.layoutName}`}>
        {blocks.map((block, index) => renderSidebarBlock(block, index))}
      </div>
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

  const content = <GenericSidebarBox kind={box.kind} payload={box.payload} rootClassName={rootClassName} rootStyle={rootStyle} />;

  return (
    <EditableSidebarBox isAdmin={isAdmin} onEdit={onEdit}>
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
      {currentBoxes.map((box, index) => (
        <div key={`sidebar-${index}-${box.kind}`}>{renderSidebarBox(box, isAdmin, () => openEditor(index))}</div>
      ))}

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
