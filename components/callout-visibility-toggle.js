"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

export function CalloutVisibilityToggle({ className = "", location = "header" }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/site-config/callouts/visibility?location=${encodeURIComponent(location)}`, {
      cache: "no-store",
    })
      .then((res) => res.json().catch(() => ({})).then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setEnabled(data?.enabled !== false);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [location]);

  async function handleToggle() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setSaving(true);

    try {
      const res = await fetch("/api/site-config/callouts/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          enabled: nextEnabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnabled(!nextEnabled);
        showDbToastError(data?.error || "Database update failed.");
        return;
      }

      showDbToastSuccess();
      router.refresh();
      window.location.reload();
    } catch {
      setEnabled(!nextEnabled);
      showDbToastError("Database update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={className ? `route-sidebar-toggle ${className}` : "route-sidebar-toggle"}>
      <button type="button" className="route-sidebar-toggle__button" onClick={handleToggle} disabled={loading || saving}>
        {saving ? "Saving notices..." : enabled ? "Remove notices" : "Add notices"}
      </button>
    </div>
  );
}
