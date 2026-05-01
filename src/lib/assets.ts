export type PublicAsset = {
  src: string;
  fallback: string;
  alt: string;
};

const imageFallback = "/placeholders/image-placeholder.svg";
const portraitFallback = "/placeholders/portrait-placeholder.svg";
const videoFallback = "/placeholders/video-placeholder.svg";

export const assets = {
  forestPathHero: {
    src: "/images/hero/forest-path.jpg",
    fallback: imageFallback,
    alt: "A quiet forest pathway suggesting a reflective journey"
  },
  icelandWater: {
    src: "/images/hero/iceland-water.jpg",
    fallback: imageFallback,
    alt: "Blue glacial water flowing through a rugged Icelandic landscape"
  },
  clientPortrait: {
    src: "/images/portraits/client-main.jpg",
    fallback: portraitFallback,
    alt: "Portrait of Gabriel"
  },
  clientSpeaking: {
    src: "/images/portraits/client-speaking.jpg",
    fallback: portraitFallback,
    alt: "Gabriel speaking with an audience"
  },
  businessPhotoOne: {
    src: "/images/business/business-1.jpg",
    fallback: imageFallback,
    alt: "Professional business setting"
  },
  businessPhotoTwo: {
    src: "/images/business/business-2.jpg",
    fallback: imageFallback,
    alt: "Warm professional conversation"
  },
  myStoryThumb: {
    src: "/images/videos/my-story-thumb.jpg",
    fallback: videoFallback,
    alt: "Video thumbnail for Gabriel's personal story"
  },
  redPillThumb: {
    src: "/images/videos/red-pill-thumb.jpg",
    fallback: videoFallback,
    alt: "Video thumbnail for a Red Pill Expo talk"
  },
  healingWebThumb: {
    src: "/images/videos/healing-web-thumb.jpg",
    fallback: videoFallback,
    alt: "Video thumbnail for The Healing Web"
  },
  keyboardsThumb: {
    src: "/images/videos/keyboards-thumb.jpg",
    fallback: videoFallback,
    alt: "Atmospheric keyboard performance video thumbnail"
  },
  grain: {
    src: "/images/textures/grain.png",
    fallback: "/placeholders/grain.svg",
    alt: ""
  }
} satisfies Record<string, PublicAsset>;

export type AssetName = keyof typeof assets;

export function assetByName(name: AssetName): PublicAsset {
  return assets[name];
}
