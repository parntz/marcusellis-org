"use client";

import { useCallback, useEffect, useState } from "react";

function extractYouTubeId(url) {
  const match = url.match(/\/embed\/([^?/]+)/);
  return match ? match[1] : null;
}

export function RecordingVideo({ embedSrc }) {
  const [open, setOpen] = useState(false);
  const videoId = extractYouTubeId(embedSrc);
  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!thumbUrl) return null;

  const autoplaySrc = embedSrc.includes("?")
    ? `${embedSrc}&autoplay=1`
    : `${embedSrc}?autoplay=1`;

  return (
    <>
      <button
        type="button"
        className="recording-video-thumb"
        onClick={() => setOpen(true)}
        aria-label="Play video"
      >
        <img src={thumbUrl} alt="Recording department video" />
        <span className="recording-video-play">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="recording-lightbox" onClick={close}>
          <div
            className="recording-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="recording-lightbox-close"
              onClick={close}
              aria-label="Close video"
            >
              &times;
            </button>
            <iframe
              src={autoplaySrc}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Recording department video"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
