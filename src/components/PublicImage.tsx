"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { defaultPublicImage, resolvePublicImageSrc, type PublicAsset } from "@/lib/assets";

type Props = Omit<ImageProps, "src" | "alt"> & {
  asset?: PublicAsset;
  src?: string | null;
  fallback?: string;
  alt?: string;
};

export function PublicImage({ asset, src, fallback, alt, fill, style, ...props }: Props) {
  const initialSrc = resolvePublicImageSrc(src ?? asset?.src ?? fallback);
  const fallbackSrc = resolvePublicImageSrc(fallback ?? asset?.fallback ?? defaultPublicImage);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const imageStyle = fill ? { objectPosition: "top center", ...style } : style;

  return (
    <Image
      {...props}
      fill={fill}
      style={imageStyle}
      src={currentSrc}
      alt={alt ?? asset?.alt ?? ""}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
