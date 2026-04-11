"use client";

import Image from "next/image";

function normalizeUrl(value = "") {
  return String(value || "").trim();
}

function getFilename(url = "", fallback = "Uploaded file") {
  const raw = normalizeUrl(url);
  if (!raw) return fallback;

  try {
    const pathname = new URL(raw, "https://example.com").pathname || "";
    const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
    return name || fallback;
  } catch {
    const clean = raw.split("#")[0].split("?")[0];
    const name = decodeURIComponent(clean.split("/").filter(Boolean).pop() || "");
    return name || fallback;
  }
}

function isImageAsset(url = "", mimeType = "", kind = "auto") {
  if (kind === "image") return true;
  if (kind === "file") return false;
  if (String(mimeType || "").toLowerCase().startsWith("image/")) return true;
  return /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(normalizeUrl(url));
}

export function UploadFieldStatus({
  url = "",
  mimeType = "",
  kind = "auto",
  imageAlt = "Uploaded image preview",
  emptyLabel = "",
  statusLabel = "",
}) {
  const resolvedUrl = normalizeUrl(url);
  if (!resolvedUrl) {
    return emptyLabel ? <p className="upload-field-status upload-field-status--empty">{emptyLabel}</p> : null;
  }

  const image = isImageAsset(resolvedUrl, mimeType, kind);
  const filename = getFilename(resolvedUrl, image ? "Uploaded image" : "Uploaded file");
  const label = statusLabel || (image ? "Image ready" : "File uploaded");

  return (
    <div className={`upload-field-status ${image ? "upload-field-status--image" : "upload-field-status--file"}`}>
      {image ? (
        <Image
          src={resolvedUrl}
          alt={imageAlt}
          className="upload-field-status__thumb"
          width={56}
          height={56}
          unoptimized
        />
      ) : (
        <span className="upload-field-status__badge" aria-hidden="true">
          FILE
        </span>
      )}
      <div className="upload-field-status__meta">
        <strong>{label}</strong>
        <span>{filename}</span>
      </div>
    </div>
  );
}
