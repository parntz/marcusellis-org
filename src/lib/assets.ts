export type PublicAsset = {
  src: string;
  fallback?: string;
  alt: string;
};

export const publicImages = {
  canyonClouds: "/IncomingPictures%20005.jpg",
  formalPortrait: "/_GP_6081.jpg",
  closePortrait: "/Pix%20up%20close%20blonde%20guy%21.jpg",
  mirrorPortrait: "/Cowboy%20Aqua%20at%20home.jpg",
  studioCowboySeated: "/STUDIO%201%20Marcus_E-20%20COWBOY%202%20BEST.jpg",
  studioCowboyStanding: "/STUDIO%201%20Marcus_E-19%20COWBOY%20%281%29.jpg"
} as const;

export const defaultPublicImage = publicImages.formalPortrait;

const legacyPublicImageMap: Record<string, string> = {
  "/images/hero/forest-path.jpg": publicImages.canyonClouds,
  "/images/hero/iceland-water.jpg": publicImages.canyonClouds,
  "/images/portraits/client-main.jpg": publicImages.formalPortrait,
  "/images/portraits/client-speaking.jpg": publicImages.studioCowboyStanding,
  "/images/business/business-1.jpg": publicImages.studioCowboySeated,
  "/images/business/business-2.jpg": publicImages.mirrorPortrait,
  "/images/videos/my-story-thumb.jpg": publicImages.formalPortrait,
  "/images/videos/red-pill-thumb.jpg": publicImages.studioCowboySeated,
  "/images/videos/healing-web-thumb.jpg": publicImages.canyonClouds,
  "/images/videos/keyboards-thumb.jpg": publicImages.closePortrait,
  "/images/textures/grain.png": publicImages.canyonClouds
};

export function resolvePublicImageSrc(src?: string | null) {
  if (!src) {
    return defaultPublicImage;
  }

  const resolvedSrc = legacyPublicImageMap[src] ?? src;

  if (!resolvedSrc.startsWith("/") || resolvedSrc.startsWith("/placeholders/")) {
    return defaultPublicImage;
  }

  return resolvedSrc;
}

export const assets = {
  forestPathHero: {
    src: publicImages.canyonClouds,
    alt: "Clouds moving across a rugged mountain canyon"
  },
  icelandWater: {
    src: publicImages.canyonClouds,
    alt: "Blue mountain cliffs partially covered by clouds"
  },
  clientPortrait: {
    src: publicImages.formalPortrait,
    alt: "Portrait of Marcus Ellis"
  },
  clientSpeaking: {
    src: publicImages.studioCowboyStanding,
    alt: "Studio portrait of Marcus Ellis in a cowboy hat"
  },
  businessPhotoOne: {
    src: publicImages.studioCowboySeated,
    alt: "Seated studio portrait of Marcus Ellis in a cowboy hat"
  },
  businessPhotoTwo: {
    src: publicImages.mirrorPortrait,
    alt: "Mirror portrait of Marcus Ellis in a blue shirt and cowboy hat"
  },
  myStoryThumb: {
    src: publicImages.formalPortrait,
    alt: "Video thumbnail for Marcus Ellis's personal story"
  },
  redPillThumb: {
    src: publicImages.studioCowboySeated,
    alt: "Video thumbnail for a Red Pill Expo talk"
  },
  healingWebThumb: {
    src: publicImages.canyonClouds,
    alt: "Video thumbnail for The Healing Web"
  },
  keyboardsThumb: {
    src: publicImages.closePortrait,
    alt: "Atmospheric keyboard performance video thumbnail"
  },
  grain: {
    src: publicImages.canyonClouds,
    alt: ""
  }
} satisfies Record<string, PublicAsset>;

export type AssetName = keyof typeof assets;

export function assetByName(name: AssetName): PublicAsset {
  return assets[name];
}
