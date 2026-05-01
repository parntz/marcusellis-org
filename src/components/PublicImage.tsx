"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import type { PublicAsset } from "@/lib/assets";

type Props = Omit<ImageProps, "src" | "alt"> & {
  asset?: PublicAsset;
  src?: string | null;
  fallback?: string;
  alt?: string;
};

export function PublicImage({ asset, src, fallback, alt, ...props }: Props) {
  const initialSrc = src ?? asset?.src ?? fallback ?? "/placeholders/image-placeholder.svg";
  const fallbackSrc = fallback ?? asset?.fallback ?? "/placeholders/image-placeholder.svg";
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt ?? asset?.alt ?? ""}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}
