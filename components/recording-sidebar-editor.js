"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

const FAMILY = "recording_sidebar";

export function RecordingSidebarEditor({ pageRoute, initialBoxes }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => JSON.stringify(initialBoxes, null, 2));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [familyRoutes, setFamilyRoutes] = useState(() => [pageRoute]);

  const label = useMemo(() => {
    if (pageRoute === "/recording") return "Recording";
    if (pageRoute === "/news-and-events") return "News & Events";
    return pageRoute;
  }, [pageRoute]);

  useEffect(() => {
    setText(JSON.stringify(initialBoxes, null, 2));
  }, [initialBoxes]);

  useEffect(() => {
    fetch(`/api/site-config/sidebar?family=${encodeURIComponent(FAMILY)}`)
      .then((r) => r.json())
      .then((d) => {
        const routes = (d.sets || []).map((s) => s.pageRoute).filter(Boolean);
        if (routes.length) {
          setFamilyRoutes(routes.sort());
        }
      })
      .catch(() => {});
  }, []);

  const save = useCallback(async () => {
    setErr("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setErr("Invalid JSON.");
      return;
    }
    if (!Array.isArray(parsed) || !parsed.length) {
      setErr("Expected a non-empty array of { kind, payload }.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/site-config/sidebar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageRoute,
          familyKey: FAMILY,
          boxes: parsed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Save failed.");
        showDbToastError("Database update failed.");
        return;
      }
      if (Array.isArray(data.boxes)) {
        setText(
          JSON.stringify(
            data.boxes.map(({ kind, payload }) => ({ kind, payload })),
            null,
            2
          )
        );
      }
      setOpen(false);
      showDbToastSuccess();
      window.setTimeout(() => window.location.reload(), 600);
    } catch {
      setErr("Save failed.");
      showDbToastError("Database update failed.");
    } finally {
      setBusy(false);
    }
  }, [pageRoute, text]);

  return (
    <div className="recording-sidebar-editor">
      <button
        type="button"
        className="recording-sidebar-editor-toggle"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close sidebar editor" : `Edit ${label} sidebar (Turso)`}
      </button>
      {open ? (
        <div className="recording-sidebar-editor-panel">
          <p className="recording-sidebar-editor-hint">
            Family <code>{FAMILY}</code> — edits apply only to <strong>{pageRoute}</strong>. Related pages:{" "}
            {familyRoutes.map((r, i) => (
              <span key={r}>
                {i > 0 ? " · " : ""}
                <a href={r}>{r}</a>
              </span>
            ))}
          </p>
          <textarea
            className="recording-sidebar-editor-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={18}
            aria-label="Sidebar boxes JSON"
          />
          {err ? (
            <p className="recording-sidebar-editor-error" role="alert">
              {err}
            </p>
          ) : null}
          <div className="recording-sidebar-editor-actions">
            <button type="button" className="recording-sidebar-editor-save" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save to database"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
