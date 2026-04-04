/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

export function CalloutRotator({ items = [], intervalMs = 8000 }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  if (!items.length) return null;
  const item = items[active] || items[0];

  return (
    <aside className="callout-rotator" aria-live="polite">
      <div className="callout-card">
        <div className="callout-card-main">
          <p className="callout-kicker">Member Notice</p>
          <h3>{item.title}</h3>
          <p className="callout-body">{item.body}</p>
        </div>
        <a href={item.ctaHref} className="callout-link-rail" target="_blank" rel="noreferrer">
          <span className="callout-link-rail__icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="callout-link-rail__label">{item.ctaLabel}</span>
        </a>
      </div>
    </aside>
  );
}
