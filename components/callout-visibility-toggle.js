"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";

export function CalloutVisibilityToggle({ className = "", location = "header" }) {
  const pathname = usePathname();
  const router = useRouter();
  /** Per-route flag in site_config (whether this route allows the notice strip). */
  const [routeEnabled, setRouteEnabled] = useState(true);
  /** Whether the header strip is actually rendered (matches PageHeaderWithCallout). */
  const [stripVisible, setStripVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(
      `/api/site-config/callouts/visibility?location=${encodeURIComponent(location)}&route=${encodeURIComponent(pathname || "/")}`,
      {
        cache: "no-store",
      }
    )
      .then((res) => res.json().catch(() => ({})).then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setRouteEnabled(data?.enabled !== false);
        setStripVisible(data?.stripVisible === true);
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
  }, [location, pathname]);

  async function handleToggle() {
    const nextRouteEnabled = !routeEnabled;
    setRouteEnabled(nextRouteEnabled);
    setSaving(true);

    try {
      const res = await fetch("/api/site-config/callouts/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          route: pathname || "/",
          enabled: nextRouteEnabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRouteEnabled(!nextRouteEnabled);
        showDbToastError(data?.error || "Database update failed.");
        return;
      }

      if (typeof data?.stripVisible === "boolean") {
        setStripVisible(data.stripVisible);
      }
      showDbToastSuccess();
      router.refresh();
      window.location.reload();
    } catch {
      setRouteEnabled(!nextRouteEnabled);
      showDbToastError("Database update failed.");
    } finally {
      setSaving(false);
    }
  }

  const labelNoticesShowing = stripVisible;

  return (
    <div className={className ? `route-sidebar-toggle ${className}` : "route-sidebar-toggle"}>
      <button type="button" className="route-sidebar-toggle__button" onClick={handleToggle} disabled={loading || saving}>
        {saving ? "Saving notices..." : labelNoticesShowing ? "Remove notices" : "Add notices"}
      </button>
    </div>
  );
}
