"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdminUser } from "../lib/authz";
import { CalloutRotator } from "./callout-rotator";

export function MobileMemberNoticeDock() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = isAdminUser(session?.user);
  const [items, setItems] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  const [config, setConfig] = useState({ delaySeconds: 8 });
  const hideOnMemberProfile =
    typeof pathname === "string" && (pathname.startsWith("/users/") || pathname.startsWith("/user/"));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/site-config/callouts?location=header", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setItems(Array.isArray(data.callouts) ? data.callouts : []);
        setAdminItems(Array.isArray(data.callouts) ? data.callouts : []);
        setConfig(data.config && typeof data.config === "object" ? data.config : { delaySeconds: 8 });
      } catch {
        if (!cancelled) {
          setItems([]);
          setAdminItems([]);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (hideOnMemberProfile) return null;
  if (config?.enabled === false) return null;
  if (!items.length && !isAdmin) return null;

  return (
    <div className="mobile-member-notice-slot">
      <CalloutRotator
        items={items}
        isAdmin={isAdmin}
        adminItems={adminItems}
        intervalMs={(config.delaySeconds || 8) * 1000}
        initialConfig={config}
        suppressSlidePicker
      />
    </div>
  );
}
