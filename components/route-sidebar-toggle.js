"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

export function RouteSidebarToggle({ className = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/site-config/route-sidebar?route=${encodeURIComponent(pathname || "/")}`, {
      cache: "no-store",
    })
      .then((res) => res.json().catch(() => ({})).then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setEnabled(Boolean(data?.enabled));
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
  }, [pathname]);

  async function handleToggle() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setSaving(true);
    try {
      const res = await fetch("/api/site-config/route-sidebar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: pathname || "/",
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
        {saving ? "Saving sidebar..." : enabled ? "Remove sidebar" : "Add sidebar"}
      </button>
    </div>
  );
}
