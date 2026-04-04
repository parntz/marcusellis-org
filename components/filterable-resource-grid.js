"use client";

import { useMemo, useState } from "react";
import { ResourceCard } from "./resource-card";

export function FilterableResourceGrid({ items }) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      return matchesQuery;
    });
  }, [items, query]);

  return (
    <section className="content-block">
      <div className="filter-bar filter-bar-single">
        <label className="filter-field">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
          />
        </label>
      </div>
      <div className="card-grid">
        {filteredItems.map((item) => (
          <ResourceCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}
