"use client";

import { useEffect, useState } from "react";
import { FindArtistGallery } from "./find-artist-gallery";

export function FindArtistGalleryClient({ items = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <FindArtistGallery items={items} />;
}
