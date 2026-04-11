"use client";

import { useMemo, useState } from "react";
import { LiveScalesItemAdmin, LiveScalesSectionAdmin } from "./live-scales-admin";

function buildSearchText(resource) {
  return [resource.title, resource.summary, resource.href].filter(Boolean).join(" ").toLowerCase();
}

export function LiveScalesDownloads({ section, isAdmin = false }) {
  const [query, setQuery] = useState("");
  const resources = useMemo(() => (Array.isArray(section?.items) ? section.items : []), [section]);

  const filteredResources = useMemo(() => {
    const needle = String(query || "").trim().toLowerCase();
    if (!needle) return resources;
    return resources.filter((resource) => buildSearchText(resource).includes(needle));
  }, [query, resources]);

  const headline = (
    <div className="section-headline live-scales-section-headline">
      {section?.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
      {section?.title ? <h2>{section.title}</h2> : null}
      {section?.description ? <p className="live-scales-section-description">{section.description}</p> : null}
    </div>
  );

  return (
    <section className="live-scales-section live-scales-section--downloads">
      {isAdmin ? (
        <LiveScalesSectionAdmin section="downloads" initialSection={section}>
          {headline}
        </LiveScalesSectionAdmin>
      ) : (
        headline
      )}

      <div className="news-events-search live-scales-search">
        <div className="news-events-search-row live-scales-search-row">
          <input
            id="live-scales-downloads-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all downloadable forms"
            autoComplete="off"
            aria-label="Search all downloadable forms"
          />
        </div>
      </div>

      <div className="live-scales-resource-grid">
        {filteredResources.map((resource, filteredIndex) => {
          const actualIndex = resources.findIndex((item) => item.href === resource.href && item.title === resource.title);
          const card = (
            <a
              key={`${resource.href}-${filteredIndex}`}
              className="live-scales-resource-card"
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="live-scales-resource-kicker">{resource.kicker || "PDF Download"}</span>
              <h3>{resource.title}</h3>
              <p>{resource.summary}</p>
              <span className="live-scales-resource-link">{resource.linkLabel || "Open file"}</span>
            </a>
          );
          return isAdmin && actualIndex >= 0 ? (
            <LiveScalesItemAdmin
              key={`${resource.href}-${filteredIndex}`}
              section="downloads"
              index={actualIndex}
              initialItem={resource}
            >
              {card}
            </LiveScalesItemAdmin>
          ) : (
            card
          );
        })}
      </div>

      {!filteredResources.length ? (
        <p className="live-scales-search-empty">No downloadable forms match that search.</p>
      ) : null}
    </section>
  );
}
