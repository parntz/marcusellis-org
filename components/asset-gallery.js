/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"];

function buildThumb(asset) {
  if (asset.group === "images") {
    return asset.publicUrl;
  }
  if (asset.publicUrl?.includes("youtube.com") || asset.publicUrl?.includes("youtu.be")) {
    const match = asset.publicUrl.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  }
  return null;
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [item, onClose]);

  if (!item) return null;

  const isYouTube = item.type === "video" && /youtu/.test(item.src);
  const autoplaySrc =
    isYouTube && item.src.includes("embed")
      ? `${item.src}${item.src.includes("?") ? "&" : "?"}autoplay=1`
      : item.src;

  return (
    <div className="asset-lightbox">
      <div className="asset-lightbox-inner">
        <button type="button" className="asset-lightbox-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {item.type === "image" ? (
          <img src={item.src} alt={item.title || "Image preview"} />
        ) : isYouTube ? (
          <iframe
            src={autoplaySrc}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title || "Video"}
          />
        ) : (
          <video src={item.src} controls autoPlay />
        )}
        {item.title ? <p className="asset-lightbox-title">{item.title}</p> : null}
      </div>
    </div>
  );
}

function AssetCard({ asset, onOpen }) {
  const extension = (asset.extension || "").toLowerCase();
  const isImage = asset.group === "images" || IMAGE_EXTENSIONS.includes(extension);
  const isVideo =
    VIDEO_EXTENSIONS.includes(extension) ||
    asset.publicUrl?.includes("youtube.com") ||
    asset.publicUrl?.includes("youtu.be");
  const thumb = buildThumb(asset);

  if (isImage || isVideo) {
    return (
      <button
        type="button"
        className="asset-card asset-card-media"
        onClick={() => onOpen({ type: isImage ? "image" : "video", src: asset.publicUrl, title: asset.label })}
      >
        <div className={`asset-thumb-frame ${isVideo ? "asset-thumb-video" : ""}`}>
          {thumb ? (
            <img src={thumb} alt={asset.label} className="asset-thumb-image" />
          ) : (
            <span className="asset-thumb-title">{asset.label}</span>
          )}
          {isVideo ? (
            <span className="asset-thumb-play">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            </span>
          ) : null}
        </div>
        <p className="asset-name">{asset.label}</p>
        <p className="asset-meta">{asset.sizeLabel || extension.toUpperCase()}</p>
      </button>
    );
  }

  if (asset.group === "documents" && asset.extension === "pdf") {
    return (
      <Link href={asset.publicUrl} className="asset-card">
        <div className="asset-thumb-frame asset-thumb-pdf">
          <span className="asset-thumb-badge">PDF</span>
          <span className="asset-thumb-title">{asset.label}</span>
        </div>
        <p className="asset-name">{asset.label}</p>
        <p className="asset-meta">{asset.sizeLabel || "PDF document"}</p>
      </Link>
    );
  }

  return (
    <Link href={asset.publicUrl} className="asset-card">
      <div className="asset-thumb-frame asset-thumb-file">
        <span className="asset-thumb-badge">{asset.extension.toUpperCase()}</span>
        <span className="asset-thumb-title">{asset.label}</span>
      </div>
      <p className="asset-name">{asset.label}</p>
      <p className="asset-meta">{asset.sizeLabel || asset.contentType}</p>
    </Link>
  );
}

export function AssetGallery({ title, assets }) {
  const [lightbox, setLightbox] = useState(null);
  const open = useCallback((item) => setLightbox(item), []);
  const close = useCallback(() => setLightbox(null), []);

  if (!assets?.length) {
    return null;
  }

  return (
    <>
      <section className="asset-section">
        <div className="section-head">
          <h2>{title}</h2>
          <p>{assets.length} files</p>
        </div>
        <div className="asset-grid">
          {assets.map((asset) => (
            <AssetCard key={asset.path} asset={asset} onOpen={open} />
          ))}
        </div>
      </section>
      <Lightbox item={lightbox} onClose={close} />
    </>
  );
}
