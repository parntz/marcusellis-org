export const primaryNav = [];

export const utilityNav = [];

export const siteMeta = {
  title: "Marcus Ellis",
  kicker: "Natural Health Advocate & Cancer Survivor",
  logoImage: "",
};

export const siteTheme = {
  bg: "#f8f6f3",
  surface: "#ffffff",
  surfaceStrong: "rgba(255, 255, 255, 0.95)",
  ink: "#2c2416",
  muted: "rgba(90, 80, 69, 0.78)",
  line: "rgba(139, 111, 78, 0.28)",
  accent: "#6b8f5e",
  accentDark: "#4a6b3f",
  accentSoft: "#e8f0e5",
  shadow: "0 20px 48px rgba(0, 0, 0, 0.12)",
  display: "Georgia, 'Times New Roman', serif",
  body: "Georgia, 'Times New Roman', serif",
  pageBackground: "linear-gradient(180deg, #f8f6f3 0%, #e8dfd4 100%)",
  brandBackground: "#6b8f5e",
};

export const siteStats = {
  mirroredPageCount: 0,
  pageCount: 1,
  assetCount: 0,
};

export function normalizeRouteFromSegments(segments = []) {
  if (!segments?.length) {
    return "/";
  }

  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}
