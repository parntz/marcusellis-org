"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DB_TOAST_EVENT } from "../lib/db-toast";

export function DbSaveToastHost() {
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onToast(event) {
      const d = event?.detail;
      if (!d || (d.variant !== "success" && d.variant !== "error")) return;
      setToast({ variant: d.variant, message: String(d.message || "") });
    }
    window.addEventListener(DB_TOAST_EVENT, onToast);
    return () => window.removeEventListener(DB_TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!mounted || !toast?.message) return null;

  return createPortal(
    <div
      className="db-save-toast-host"
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
    >
      <div className={`db-save-toast db-save-toast--${toast.variant}`}>{toast.message}</div>
    </div>,
    document.body
  );
}
