/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { ModalLightbox } from "./modal-lightbox";
import { PhotoGalleryItemAdmin } from "./photo-gallery-item-admin";

function stripHtml(input = "") {
  return String(input)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getCardVariant(item, index) {
  if (item.mediaType === "video") return "featured";
  if (index === 1 || index === 5) return "wide";
  if (index % 4 === 2) return "tall";
  return "standard";
}

function Stats({ items }) {
  const photoCount = items.filter((item) => item.mediaType !== "video").length;
  const videoCount = items.filter((item) => item.mediaType === "video").length;

  return (
    <div className="photo-video-gallery-stats" aria-label="Gallery archive counts">
      <div className="photo-video-gallery-stat">
        <span className="photo-video-gallery-stat__value">{items.length}</span>
        <span className="photo-video-gallery-stat__label">Archived pieces</span>
      </div>
      <div className="photo-video-gallery-stat">
        <span className="photo-video-gallery-stat__value">{photoCount}</span>
        <span className="photo-video-gallery-stat__label">Photos</span>
      </div>
      <div className="photo-video-gallery-stat">
        <span className="photo-video-gallery-stat__value">{videoCount}</span>
        <span className="photo-video-gallery-stat__label">Videos</span>
      </div>
    </div>
  );
}

function matchesQuery(item, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  const haystack = [item.title, item.mediaType, stripHtml(item.descriptionHtml || "")]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function GalleryCardBody({ item, index, variant }) {
  const v = variant ?? getCardVariant(item, index);
  return (
    <article className={`photo-video-gallery-card photo-video-gallery-card--${v}`}>
      <div className="photo-video-gallery-card__media">
        <img src={item.imageUrl} alt={item.imageAlt || item.title} />
      </div>
      <div className="photo-video-gallery-card__body">
        <h3>{item.title}</h3>
      </div>
    </article>
  );
}

export function PhotoVideoGallery({ items, isAdmin = false }) {
  const [activeItem, setActiveItem] = useState(null);
  const [query, setQuery] = useState("");
  const allItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const visibleItems = useMemo(() => allItems.filter((item) => matchesQuery(item, query)), [allItems, query]);

  return (
    <>
      <div className="photo-video-gallery-shell">
        <section className="photo-video-gallery-toolbar" aria-label="Archive search">
          <div className="news-events-search photo-video-gallery-search">
            <label htmlFor="photo-video-gallery-search-input">Search archive</label>
            <div className="news-events-search-row">
              <input
                id="photo-video-gallery-search-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search photos and videos"
              />
              {query ? (
                <button type="button" className="news-events-search-clear" onClick={() => setQuery("")}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <Stats items={visibleItems} />
        </section>

        <section className="photo-video-gallery-grid" aria-label="Photo and video gallery">
          {visibleItems.map((item, index) => {
            const variant = getCardVariant(item, index);
            return isAdmin ? (
              <PhotoGalleryItemAdmin key={item.id} item={item}>
                <GalleryCardBody item={item} index={index} variant={variant} />
              </PhotoGalleryItemAdmin>
            ) : (
              <button
                key={item.id}
                type="button"
                className="photo-video-gallery-card-button"
                onClick={() => setActiveItem(item)}
              >
                <GalleryCardBody item={item} index={index} variant={variant} />
              </button>
            );
          })}
          {!visibleItems.length ? (
            <div className="photo-video-gallery-empty">
              <p>No archive items match that search.</p>
            </div>
          ) : null}
        </section>
      </div>

      <ModalLightbox
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        closeLabel="Close gallery item"
        aspectRatio={activeItem?.mediaType === "video" ? "16/9" : null}
      >
        {activeItem ? (
          <div className="photo-video-gallery-lightbox">
            {activeItem.mediaType === "video" ? (
              <iframe
                src={activeItem.videoUrl}
                title={activeItem.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                className="photo-video-gallery-lightbox__image"
                src={activeItem.imageUrl}
                alt={activeItem.imageAlt || activeItem.title}
              />
            )}
            <div className="photo-video-gallery-lightbox__meta">
              <p className="photo-video-gallery-lightbox__kicker">
                {activeItem.mediaType === "video" ? "Video" : "Photo"}
              </p>
              <h3>{activeItem.title}</h3>
              {activeItem.descriptionHtml ? (
                <div dangerouslySetInnerHTML={{ __html: activeItem.descriptionHtml }} />
              ) : null}
            </div>
          </div>
        ) : null}
      </ModalLightbox>
    </>
  );
}
