"use client";

import { useMemo, useState } from "react";
import { ProfileCard } from "./profile-card";

export function FilterableProfileGrid({ items }) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const haystack =
        `${item.name} ${item.discipline} ${item.summary}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, query]);

  return (
    <section className="content-block">
      <div className="filter-bar filter-bar-single">
        <label className="filter-field">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
          />
        </label>
      </div>
      <div className="card-grid profile-grid">
        {filteredItems.map((item) => (
          <ProfileCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}
