export const primaryNav = [{ label: "About Us", href: "/about-us" }];

export const utilityNav = [{ label: "Sign In", href: "/sign-in" }];

export const siteMeta = {
  title: "Default Title",
  kicker: "eyebrow",
  logoImage: "",
};

export const siteTheme = {
  bg: "#f5f5f3",
  surface: "#ffffff",
  surfaceStrong: "rgba(255, 255, 255, 0.95)",
  ink: "#1f2328",
  muted: "#6b7280",
  line: "rgba(31, 35, 40, 0.16)",
  accent: "#6aa7d8",
  accentDark: "#2f5f87",
  accentSoft: "#dbeaf6",
  shadow: "0 20px 48px rgba(22, 26, 29, 0.12)",
  display: "Anton",
  body: "Lato",
  pageBackground: "linear-gradient(180deg, #f5f5f3 0%, #dbeaf6 100%)",
  brandBackground: "#757575",
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
