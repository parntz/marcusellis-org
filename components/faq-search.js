"use client";

import { useEffect, useId, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function FaqSearch({ targetId = "" }) {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(null);
  const inputId = useId();
  const normalizedQuery = useMemo(() => normalize(query), [query]);

  useEffect(() => {
    if (!targetId) return undefined;
    const root = document.getElementById(targetId);
    if (!root) return undefined;

    const items = Array.from(root.querySelectorAll("ol > li"));
    if (!items.length) {
      setMatchCount(0);
      return undefined;
    }

    let visible = 0;
    items.forEach((item) => {
      const matches = !normalizedQuery || normalize(item.textContent).includes(normalizedQuery);
      item.style.display = matches ? "" : "none";
      if (matches) {
        visible += 1;
      }
    });
    setMatchCount(visible);

    return () => {
      items.forEach((item) => {
        item.style.display = "";
      });
    };
  }, [normalizedQuery, targetId]);

  return (
    <div className="faq-search">
      <label className="faq-search__label" htmlFor={inputId}>
        Search this page
      </label>
      <input
        id={inputId}
        type="search"
        className="faq-search__input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search questions and answers..."
      />
      {normalizedQuery && matchCount === 0 ? (
        <p className="faq-search__empty">No questions match that search.</p>
      ) : null}
    </div>
  );
}
