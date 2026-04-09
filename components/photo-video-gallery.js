/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ModalLightbox } from "./modal-lightbox";
import { PhotoGalleryItemAdmin } from "./photo-gallery-item-admin";

const GALLERY_ROUTE = "/photo-and-video-gallery";

function getCardVariant(item, index) {
  if (item.mediaType === "video") return "featured";
  if (index === 1 || index === 5) return "wide";
  if (index % 4 === 2) return "tall";
  return "standard";
}

function Stats({ archiveStats, matchingStats, searchQuery }) {
  const searching = Boolean(String(searchQuery || "").trim());
  const activeStats = searching ? matchingStats : archiveStats;
  const totalCount = activeStats?.total ?? 0;
  const photoCount = activeStats?.photos ?? 0;
  const videoCount = activeStats?.videos ?? 0;

  return (
    <div className="photo-video-gallery-stats" aria-label="Gallery archive counts">
      <div className="photo-video-gallery-stat">
        <span className="photo-video-gallery-stat__value">{totalCount}</span>
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

function buildGalleryHref(query, pageNum, shuffleSeed = null) {
  const params = new URLSearchParams();
  const q = String(query || "").trim();
  if (q) params.set("q", q);
  if (!q && shuffleSeed) params.set("s", String(shuffleSeed));
  if (pageNum > 1) params.set("p", String(pageNum));
  const qs = params.toString();
  return qs ? `${GALLERY_ROUTE}?${qs}` : GALLERY_ROUTE;
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

export function PhotoVideoGallery({
  items,
  isAdmin = false,
  searchQuery = "",
  page = 1,
  pageSize = 96,
  totalMatching = 0,
  matchingStats = { total: 0, photos: 0, videos: 0 },
  archiveStats = { total: 0, photos: 0, videos: 0 },
  shuffleSeed = null,
}) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState(null);
  const [queryInput, setQueryInput] = useState(searchQuery);
  const allItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);

  useEffect(() => {
    setQueryInput(searchQuery);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalMatching) / pageSize));

  function onSearchSubmit(event) {
    event.preventDefault();
    router.push(buildGalleryHref(queryInput, 1));
  }

  function onClearSearch() {
    setQueryInput("");
    router.push(GALLERY_ROUTE);
  }

  return (
    <>
      <div className="photo-video-gallery-shell">
        <section className="photo-video-gallery-toolbar" aria-label="Archive search">
          <form className="news-events-search photo-video-gallery-search-form" onSubmit={onSearchSubmit}>
            <div className="news-events-search-row photo-video-gallery-search-row">
              <input
                id="photo-video-gallery-search-input"
                type="search"
                name="q"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search photos and videos"
                autoComplete="off"
                aria-label="Search photo and video gallery"
              />
              <button type="submit">Search</button>
              {queryInput ? (
                <button type="button" className="news-events-search-clear" onClick={onClearSearch}>
                  Clear
                </button>
              ) : null}
            </div>
          </form>
          <Stats
            archiveStats={archiveStats}
            matchingStats={matchingStats}
            searchQuery={searchQuery}
          />
        </section>

        <section className="photo-video-gallery-grid" aria-label="Photo and video gallery">
          {allItems.map((item, index) => {
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
          {!allItems.length ? (
            <div className="photo-video-gallery-empty">
              <p>No archive items match that search.</p>
            </div>
          ) : null}
        </section>

        {totalPages > 1 ? (
          <nav className="photo-video-gallery-pagination" aria-label="Gallery pages">
            {page > 1 ? (
              <Link
                href={buildGalleryHref(searchQuery, page - 1, shuffleSeed)}
                className="photo-video-gallery-page-link"
              >
                Previous
              </Link>
            ) : (
              <span className="photo-video-gallery-page-link photo-video-gallery-page-link--disabled">Previous</span>
            )}
            <span className="photo-video-gallery-page-status">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildGalleryHref(searchQuery, page + 1, shuffleSeed)}
                className="photo-video-gallery-page-link"
              >
                Next
              </Link>
            ) : (
              <span className="photo-video-gallery-page-link photo-video-gallery-page-link--disabled">Next</span>
            )}
          </nav>
        ) : null}
      </div>

      <ModalLightbox
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        closeLabel="Close gallery item"
        aspectRatio={null}
      >
        {activeItem ? (
          <div className="photo-video-gallery-lightbox photo-video-gallery-lightbox--modal">
            <div
              className={
                activeItem.mediaType === "video"
                  ? "photo-video-gallery-lightbox__media-stage photo-video-gallery-lightbox__media-stage--video"
                  : "photo-video-gallery-lightbox__media-stage photo-video-gallery-lightbox__media-stage--photo"
              }
            >
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
            </div>
            {Array.isArray(activeItem.taggedMembers) && activeItem.taggedMembers.length > 0 ? (
              <div
                className="photo-video-gallery-lightbox__tagged"
                aria-label={
                  activeItem.mediaType === "video"
                    ? "Union members tagged in this video"
                    : "Union members tagged in this photo"
                }
              >
                <p className="photo-video-gallery-lightbox__tagged-heading">
                  {activeItem.mediaType === "video"
                    ? "Union members tagged in this video"
                    : "Union members tagged in this photo"}
                </p>
                <ul className="photo-video-gallery-lightbox__tagged-list">
                  {activeItem.taggedMembers.map((m, i) => (
                    <li key={m.memberId ? `m-${m.memberId}` : `n-${m.name}-${i}`}>
                      <span className="photo-video-gallery-lightbox__member-badge">{m.name}</span>
                      {m.instrument ? (
                        <span className="photo-video-gallery-lightbox__member-instrument">{m.instrument}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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
