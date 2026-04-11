/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getArtistBandImageCandidates, getInitials, stripHtml } from "../lib/find-artist-directory-ui.js";
import { rewriteLegacyNashvilleSiteInHtml } from "../lib/legacy-site-url.js";

function normalizeHref(value) {
  const href = String(value || "").trim();
  if (!href) return "";
  if (href.startsWith("/")) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  return `https://${href.replace(/^\/+/, "")}`;
}

function getLinkType(link) {
  const label = String(link?.label || "").trim().toLowerCase();
  const href = normalizeHref(link?.href || link?.url || "");
  if (!href) return "";

  try {
    const url = new URL(href, "https://example.com");
    const host = String(url.hostname || "").toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be") || label.includes("youtube")) return "youtube";
    if (host.includes("facebook.com") || label.includes("facebook")) return "facebook";
    if (host.includes("instagram.com") || label.includes("instagram")) return "instagram";
    if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com") || label === "x" || label.includes("twitter")) return "x";
  } catch {
    return "";
  }

  if (label.includes("website") || label.includes("web")) return "website";
  return "website";
}

function toYouTubeWatchHref(value) {
  const href = normalizeHref(value);
  if (!href) return "";

  try {
    const url = new URL(href);
    const host = String(url.hostname || "").toLowerCase();
    if (host.includes("youtu.be")) {
      const id = url.pathname.replace(/^\/+/, "").trim();
      return id ? `https://www.youtube.com/watch?v=${id}` : href;
    }
    if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      const embeddedId = url.pathname.match(/\/embed\/([A-Za-z0-9_-]+)/i)?.[1];
      if (embeddedId) return `https://www.youtube.com/watch?v=${embeddedId}`;
      const watchId = url.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/watch?v=${watchId}`;
    }
  } catch {
    return href;
  }

  return href;
}

function collectProfileIconLinks({ webLinks = [], featuredVideoUrl = "" }) {
  const slots = {
    website: null,
    youtube: featuredVideoUrl
      ? {
          type: "youtube",
          href: toYouTubeWatchHref(featuredVideoUrl),
          label: "YouTube",
        }
      : null,
    facebook: null,
    instagram: null,
    x: null,
  };

  for (const link of Array.isArray(webLinks) ? webLinks : []) {
    const href = normalizeHref(link?.href || link?.url || "");
    if (!href) continue;
    const type = getLinkType(link);
    if (!type || slots[type]) continue;
    slots[type] = {
      type,
      href,
      label:
        type === "website"
          ? "Website"
          : type === "facebook"
            ? "Facebook"
              : type === "instagram"
                ? "Instagram"
                : type === "x"
                  ? "X"
                : "YouTube",
    };
  }

  return Object.values(slots).filter((item) => item?.href);
}

function ProfileIcon({ type }) {
  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23 12.3c0-2.2-.2-4.4-.7-6.5a3.2 3.2 0 0 0-2.2-2.2C18 3 12 3 12 3S6 3 3.9 3.6A3.2 3.2 0 0 0 1.7 5.8C1.2 7.9 1 10.1 1 12.3c0 2.2.2 4.4.7 6.5a3.2 3.2 0 0 0 2.2 2.2C6 21.6 12 21.6 12 21.6s6 0 8.1-.6a3.2 3.2 0 0 0 2.2-2.2c.5-2.1.7-4.3.7-6.5Z" />
        <path d="M10 15.8 16 12l-6-3.8Z" fill="currentColor" className="find-artist-profile__icon-cutout" />
      </svg>
    );
  }

  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.5 1.6-1.5H17V4.1c-.4-.1-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7.2v3.2H10V22Z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6A5.2 5.2 0 0 1 16.8 22H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 1.8A3.4 3.4 0 0 0 3.8 7.2v9.6a3.4 3.4 0 0 0 3.4 3.4h9.6a3.4 3.4 0 0 0 3.4-3.4V7.2a3.4 3.4 0 0 0-3.4-3.4Z" />
        <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
        <circle cx="17.4" cy="6.6" r="1.2" />
      </svg>
    );
  }

  if (type === "x") {
    return <span className="find-artist-profile__icon-mark find-artist-profile__icon-mark--x" aria-hidden="true" />;
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.9 9h-3.1a15.6 15.6 0 0 0-1.2-5A8.2 8.2 0 0 1 18.9 11Zm-6.9 9a13.6 13.6 0 0 1-1.9-7h3.8a13.6 13.6 0 0 1-1.9 7Zm-1.9-9a13.6 13.6 0 0 1 1.9-7 13.6 13.6 0 0 1 1.9 7Zm-1.5-5a15.6 15.6 0 0 0-1.2 5H5.1A8.2 8.2 0 0 1 8.6 6ZM5.1 13h3.1a15.6 15.6 0 0 0 1.2 5A8.2 8.2 0 0 1 5.1 13Zm9.5 5a15.6 15.6 0 0 0 1.2-5h3.1a8.2 8.2 0 0 1-4.3 5Z" />
    </svg>
  );
}

function DetailSection({ title, html, tone = "default", displayLabel = title }) {
  if (!html || !stripHtml(html)) return null;
  return (
    <section
      className={`find-artist-profile__section find-artist-profile__section--${tone}`}
      data-panel-label={displayLabel}
    >
      <h2>{title}</h2>
      <div className="richtext" dangerouslySetInnerHTML={{ __html: rewriteLegacyNashvilleSiteInHtml(html) }} />
    </section>
  );
}

function ProfileImage({ title, item }) {
  const candidates = getArtistBandImageCandidates(item);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [item.pictureUrl, item.sourcePath, item.featuredVideoUrl, title]);

  const current = candidates[index] || "";
  if (!current) {
    return (
      <div className="find-artist-directory-card__placeholder" aria-hidden="true">
        {getInitials(title) || "AFM"}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={title}
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

export function ProfileShowcase({
  title,
  imageUrl = "",
  sourcePath = "",
  summary = "",
  musicalStyles = [],
  contactHtml = "",
  personnelHtml = "",
  listingPersonnelHtml = "",
  webLinks = [],
  featuredVideoUrl = "",
  featuredVideoTitle = "",
  backHref,
  backLabel,
}) {
  const iconLinks = collectProfileIconLinks({ webLinks, featuredVideoUrl });

  return (
    <section className="find-artist-profile">
      {backHref && backLabel ? (
        <p className="find-artist-profile__back">
          <Link href={backHref} className="find-artist-profile__back-link">
            {backLabel}
          </Link>
        </p>
      ) : null}

      <div className="find-artist-profile__hero">
        <div
          className={`find-artist-profile__media ${
            imageUrl ? "find-artist-profile__media--image" : "find-artist-profile__media--placeholder"
          }`}
        >
          <ProfileImage title={title} item={{ pictureUrl: imageUrl, sourcePath, featuredVideoUrl }} />
        </div>

        <div className="find-artist-profile__intro">
          <h1>{title}</h1>
          {iconLinks.length ? (
            <div className="find-artist-profile__icon-links" aria-label="Profile links">
              {iconLinks.map((link) => (
                <a
                  key={`${title}-${link.type}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`find-artist-profile__icon-link find-artist-profile__icon-link--${link.type}`}
                  aria-label={link.label}
                  title={link.label}
                >
                  <ProfileIcon type={link.type} />
                </a>
              ))}
            </div>
          ) : null}
          {summary ? <p>{summary}</p> : null}

          {Array.isArray(musicalStyles) && musicalStyles.length ? (
            <div className="find-artist-directory-card__chips" aria-label="Musical styles">
              {musicalStyles.map((style) => (
                <span key={`${title}-${style}`} className="find-artist-directory-card__chip">
                  {style}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="find-artist-profile__body">
        <DetailSection title="Contact Information" html={contactHtml} tone="contact" displayLabel="Contact" />
        <DetailSection
          title="Personnel / Instrumentation"
          html={personnelHtml || listingPersonnelHtml}
          tone="personnel"
          displayLabel="Personnel"
        />

        {Array.isArray(webLinks) && webLinks.length ? (
          <section className="find-artist-profile__section find-artist-profile__section--links" data-panel-label="Links">
            <h2>Web Links</h2>
            <ul className="find-artist-profile__links">
              {webLinks.map((link) => (
                <li key={`${title}-${link.href || link.url}-${link.label || "link"}`}>
                  <a
                    href={link.href || link.url}
                    target={link.isExternal === false || String(link.href || link.url || "").startsWith("/") ? undefined : "_blank"}
                    rel={link.isExternal === false || String(link.href || link.url || "").startsWith("/") ? undefined : "noreferrer"}
                  >
                    {link.label || link.href || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

      </div>
    </section>
  );
}
