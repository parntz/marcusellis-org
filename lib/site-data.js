export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const utilityNav = [];

export const siteMeta = {
  title: "Marcus Ellis",
  kicker: "Health & Wellness Advocate",
  logoImage: "",
};

export const siteTheme = {
  bg: "#f8f6f3",
  surface: "#ffffff",
  surfaceStrong: "rgba(255, 255, 255, 0.95)",
  ink: "#2c2416",
  muted: "#5a5045",
  line: "rgba(44, 36, 22, 0.12)",
  accent: "#8b6f4e",
  accentDark: "#5c4a35",
  accentSoft: "#e8dfd4",
  shadow: "0 20px 48px rgba(22, 26, 29, 0.12)",
  display: "Georgia",
  body: "Georgia",
  pageBackground: "linear-gradient(180deg, #f8f6f3 0%, #e8dfd4 100%)",
  brandBackground: "#8b6f4e",
};

export const siteStats = {
  mirroredPageCount: 3445,
  pageCount: 3451,
  assetCount: 5479,
};

export function normalizeRouteFromSegments(segments = []) {
  if (!segments?.length) {
    return "/";
  }

  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}
