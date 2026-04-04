/** Shared defaults for homepage hero (no DB imports — safe for client bundles). */
export const DEFAULT_HERO_IMAGES = [
  "/images/heros/nashville-hero1.jpg",
  "/images/heros/nashville-hero4.jpg",
  "/images/heros/nashville-hero7.jpg",
  "/images/heros/nashville-hero8.jpg",
  "/images/heros/nashville-hero9.jpg",
  "/images/heros/nashville-hero10.jpg",
];

export const DEFAULT_HERO_DELAY_SECONDS = 6;

/** Crossfade duration between hero slides (seconds). */
export const DEFAULT_HERO_TRANSITION_SECONDS = 0.8;

export const DEFAULT_HERO_HOME = {
  images: DEFAULT_HERO_IMAGES,
  delaySeconds: DEFAULT_HERO_DELAY_SECONDS,
  transitionSeconds: DEFAULT_HERO_TRANSITION_SECONDS,
};
