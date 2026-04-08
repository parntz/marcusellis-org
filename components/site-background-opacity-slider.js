"use client";

import { useEffect, useRef, useState } from "react";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function applyOpacity(percent) {
  document.documentElement.style.setProperty("--site-page-wash-opacity", String(clampPercent(percent) / 100));
}

export function SiteBackgroundOpacitySlider({ initialOpacity = 1, className = "" }) {
  const initialPercent = clampPercent(Number(initialOpacity) * 100);
  const [value, setValue] = useState(initialPercent);
  const [saving, setSaving] = useState(false);
  const committedRef = useRef(initialPercent);

  useEffect(() => {
    const next = clampPercent(Number(initialOpacity) * 100);
    committedRef.current = next;
    setValue(next);
    applyOpacity(next);
  }, [initialOpacity]);

  async function commitIfDirty() {
    if (saving) return;
    if (value === committedRef.current) return;

    setSaving(true);
    try {
      const res = await fetch("/api/site-config/background-opacity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opacity: value / 100 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to save background opacity.");
      }
      committedRef.current = clampPercent(Number(data?.opacity) * 100);
      setValue(committedRef.current);
      applyOpacity(committedRef.current);
      showDbToastSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save background opacity.";
      setValue(committedRef.current);
      applyOpacity(committedRef.current);
      showDbToastError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(event) {
    const next = clampPercent(event.target.value);
    setValue(next);
    applyOpacity(next);
  }

  return (
    <div className={`site-background-opacity ${className}`.trim()}>
      <div className="site-background-opacity__copy">
        <span className="site-background-opacity__label">Page Background</span>
        <span className="site-background-opacity__value">{value}%</span>
      </div>
      <input
        className="site-background-opacity__slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={handleChange}
        onPointerUp={commitIfDirty}
        onKeyUp={commitIfDirty}
        onBlur={commitIfDirty}
        aria-label="Adjust the global page background opacity"
        disabled={saving}
      />
    </div>
  );
}
