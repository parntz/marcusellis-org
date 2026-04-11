/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { getArtistBandImageCandidates, getInitials, stripHtml } from "../lib/find-artist-directory-ui";

function ArtistCardImage({ item }) {
  const candidates = getArtistBandImageCandidates(item);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [item.slug, item.pictureUrl, item.sourcePath, item.featuredVideoUrl]);

  const current = candidates[index] || "";
  if (!current) {
    return (
      <div className="find-artist-directory-card__placeholder" aria-hidden="true">
        {getInitials(item.title) || "AFM"}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={item.title}
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex(index + 1);
        } else {
          setIndex(candidates.length);
        }
      }}
    />
  );
}

function matchesItem(item, query) {
  if (!query) return true;
  const haystack = [
    item.title,
    stripHtml(item.listingPersonnelHtml),
    stripHtml(item.contactHtml),
    stripHtml(item.descriptionHtml),
    stripHtml(item.personnelHtml),
    ...(Array.isArray(item.musicalStyles) ? item.musicalStyles : []),
    ...(Array.isArray(item.webLinks) ? item.webLinks.flatMap((link) => [link.label, link.href]) : []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function FindArtistGallery({ items = [] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(String(query || "").trim().toLowerCase());
  const filteredItems = items.filter((item) => matchesItem(item, deferredQuery));
  const cardItems = filteredItems.filter((item) => String(item.pictureUrl || "").trim());
  const listItems = filteredItems.filter((item) => !String(item.pictureUrl || "").trim());

  return (
    <div className="find-artist-directory-shell">
      <section className="find-artist-directory-toolbar" aria-label="Artist and band directory search">
        <div className="find-artist-directory-controls">
          <label className="find-artist-directory-search">
            <span className="sr-only">Search artists and bands</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artists, bands, styles, or instruments"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      <section className="find-artist-directory-grid" aria-label="Artist cards">
        {cardItems.map((item) => {
          return (
            <Link
              key={item.slug}
              href={`/find-an-artist-or-band/${item.slug}`}
              className="find-artist-directory-card-button"
              aria-label={`Open profile for ${item.title}`}
            >
              <article className="find-artist-directory-card">
                <div className="find-artist-directory-card__media">
                  <ArtistCardImage item={item} />
                </div>
                <div className="find-artist-directory-card__body">
                  <h3>{item.title}</h3>
                </div>
              </article>
            </Link>
          );
        })}
        {!filteredItems.length ? (
          <div className="find-artist-directory-empty">
            <p>No artist or band profiles match that search.</p>
          </div>
        ) : null}
      </section>

      {listItems.length ? (
        <section className="find-artist-directory-list" aria-label="Artists without profile pictures">
          <h3>Artists Without Profile Pictures</h3>
          <div className="find-artist-directory-list__items">
            {listItems.map((item) => (
              <Link
                key={`list-${item.slug}`}
                className="find-artist-directory-list__button"
                href={`/find-an-artist-or-band/${item.slug}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
