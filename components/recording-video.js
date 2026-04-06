"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import { ModalLightbox } from "./modal-lightbox";
import { extractYouTubeId, normalizeYouTubeEmbedUrl } from "../lib/youtube.js";

const RECORDING_THUMB_PATH =
  "/images/Dave_Pomeroy_and_friends-copy-jpeg-e1707492091763-2087x1256.webp";

const CUSTOM_THUMBNAILS = {
  NLsFpMEDcF0: RECORDING_THUMB_PATH,
};

const DEFAULT_CAPTION = {
  headline: "Single song overdub scale",
  kicker: "YouTube video",
};

export function RecordingVideo({
  embedSrc,
  thumbnailSrc = "",
  captionTitle = DEFAULT_CAPTION.headline,
  captionSubtitle = "",
  youtubeKicker = DEFAULT_CAPTION.kicker,
}) {
  const [open, setOpen] = useState(false);
  const normalizedEmbedSrc = normalizeYouTubeEmbedUrl(embedSrc);
  const videoId = extractYouTubeId(normalizedEmbedSrc);
  const thumbUrl =
    String(thumbnailSrc || "").trim() ||
    (videoId && CUSTOM_THUMBNAILS[videoId]) ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  const close = useCallback(() => setOpen(false), []);

  if (!thumbUrl) return null;

  const autoplaySrc = normalizedEmbedSrc.includes("?")
    ? `${normalizedEmbedSrc}&autoplay=1`
    : `${normalizedEmbedSrc}?autoplay=1`;

  const label = captionTitle
    ? `Play YouTube video: ${captionTitle}`
    : "Play YouTube video";

  return (
    <>
      <button
        type="button"
        className="recording-video-thumb"
        onClick={() => setOpen(true)}
        aria-label={label}
      >
        <img src={thumbUrl} alt="" className="recording-video-thumb__fill" />
        {captionTitle || captionSubtitle || youtubeKicker ? (
          <span className="recording-video-thumb-caption">
            {youtubeKicker ? (
              <span className="recording-video-thumb-kicker">{youtubeKicker}</span>
            ) : null}
            {captionTitle ? (
              <span className="recording-video-thumb-headline">{captionTitle}</span>
            ) : null}
            {captionSubtitle ? (
              <span className="recording-video-thumb-desc">{captionSubtitle}</span>
            ) : null}
          </span>
        ) : null}
        <span className="recording-video-play recording-video-play--youtube" aria-hidden="true">
          <svg className="recording-video-play-triangle" viewBox="0 0 24 24">
            <polygon points="8,5 20,12 8,19" />
          </svg>
        </span>
      </button>

      <ModalLightbox
        open={open}
        onClose={close}
        closeLabel="Close video"
        aspectRatio="16/9"
      >
        <iframe
          src={autoplaySrc}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={captionTitle || "Recording department video"}
        />
      </ModalLightbox>
    </>
  );
}
