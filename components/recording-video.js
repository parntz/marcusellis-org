"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ModalLightbox } from "./modal-lightbox";

const RECORDING_THUMB_PATH =
  "/images/Dave_Pomeroy_and_friends-copy-jpeg-e1707492091763-2087x1256.webp";

const CUSTOM_THUMBNAILS = {
  NLsFpMEDcF0: RECORDING_THUMB_PATH,
};

function extractYouTubeId(url) {
  const match = url.match(/\/embed\/([^?/]+)/);
  return match ? match[1] : null;
}

const DEFAULT_CAPTION = {
  headline: "Single song overdub scale",
  kicker: "YouTube video",
};

export function RecordingVideo({
  embedSrc,
  captionTitle = DEFAULT_CAPTION.headline,
  captionSubtitle = "",
  youtubeKicker = DEFAULT_CAPTION.kicker,
}) {
  const [open, setOpen] = useState(false);
  const videoId = extractYouTubeId(embedSrc);
  const thumbUrl =
    (videoId && CUSTOM_THUMBNAILS[videoId]) ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  const close = useCallback(() => setOpen(false), []);

  if (!thumbUrl) return null;

  const autoplaySrc = embedSrc.includes("?")
    ? `${embedSrc}&autoplay=1`
    : `${embedSrc}?autoplay=1`;

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
        <Image
          src={thumbUrl}
          alt=""
          fill
          sizes="(min-width: 1100px) min(900px, 72vw), 100vw"
          className="recording-video-thumb__fill"
        />
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
