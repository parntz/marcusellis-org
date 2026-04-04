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

/**
 * 0 = zoom off. 1–100: left = slower zoom, right = faster zoom.
 * Stored value; use growSliderToDurationSeconds() for CSS duration (one zoom from 1× to 1.2×, then hold).
 */
export const DEFAULT_HERO_GROW_SLIDER = 50;

/** Zoom-in duration at slider 100 (fastest). */
export const GROW_ZOOM_DURATION_MIN_SEC = 5;

/** Zoom-in duration at slider 1 (slowest). */
export const GROW_ZOOM_DURATION_MAX_SEC = 120;

/**
 * @param {number} slider 0 = off; 1–100 = zoom speed (higher = faster = shorter time to 1.2×)
 * @returns {number | null} seconds for one zoom from scale(1) to scale(1.2), or null when off
 */
export function growSliderToDurationSeconds(slider) {
  if (typeof slider !== "number" || Number.isNaN(slider) || slider <= 0 || slider > 100) {
    return null;
  }
  const s = Math.max(1, Math.min(100, Math.round(slider)));
  return (
    GROW_ZOOM_DURATION_MAX_SEC -
    (GROW_ZOOM_DURATION_MAX_SEC - GROW_ZOOM_DURATION_MIN_SEC) * ((s - 1) / 99)
  );
}

export const DEFAULT_HERO_HOME = {
  images: DEFAULT_HERO_IMAGES,
  delaySeconds: DEFAULT_HERO_DELAY_SECONDS,
  transitionSeconds: DEFAULT_HERO_TRANSITION_SECONDS,
  growSlider: DEFAULT_HERO_GROW_SLIDER,
};
