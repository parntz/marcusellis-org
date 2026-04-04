"use client";

import { useId, useState } from "react";

/**
 * Master–detail layout for scales/forms sections: stable nav + single content pane.
 */
export function ScalesMasterDetail({ sections }) {
  const list = sections?.length ? sections : [];
  const [selected, setSelected] = useState(0);
  const baseId = useId();

  if (list.length === 0) return null;

  const safeIndex = selected >= 0 && selected < list.length ? selected : 0;
  const body = list[safeIndex]?.body ?? "";
  const n = list.length;

  function focusTab(index) {
    const el = document.getElementById(`${baseId}-tab-${index}`);
    el?.focus();
  }

  function handleTabKeyDown(e, idx) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % n;
      setSelected(next);
      requestAnimationFrame(() => focusTab(next));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + n) % n;
      setSelected(prev);
      requestAnimationFrame(() => focusTab(prev));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelected(0);
      requestAnimationFrame(() => focusTab(0));
    } else if (e.key === "End") {
      e.preventDefault();
      const last = n - 1;
      setSelected(last);
      requestAnimationFrame(() => focusTab(last));
    }
  }

  return (
    <div className="recording-scales-master">
      <nav className="recording-scales-master-nav" aria-label="Document sections">
        <ul className="recording-scales-master-list" role="tablist">
          {list.map((section, idx) => {
            const tabId = `${baseId}-tab-${idx}`;
            const isActive = idx === safeIndex;
            return (
              <li key={`${section.title}-${idx}`} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={tabId}
                  className={`recording-scales-master-tab${isActive ? " is-active" : ""}`}
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setSelected(idx)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span className="recording-scales-master-tab-label">{section.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div
        className="recording-scales-master-panel recording-flow"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${safeIndex}`}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
