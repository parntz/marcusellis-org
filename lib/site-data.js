export const primaryNav = [
  { label: "News & Events", href: "/news-and-events" },
  {
    label: "Recording",
    href: "/recording",
    children: [
      { label: "Scales, Forms & Agreements", href: "/scales-forms-agreements" },
      { label: "New Use / Reuse", href: "/new-use-reuse" },
      { label: "Signatory Information", href: "/signatory-information" },
    ],
  },
  {
    label: "Live Music",
    href: "/live-music",
    children: [
      { label: "Gig Calendar", href: "/gigs" },
      { label: "Find an Artist or Band", href: "/find-an-artist-or-band" },
      { label: "Live Scales, Contracts, Pension", href: "/live-scales-contracts-pension" },
      { label: "AFM Entertainment", href: "/afm-entertainment" },
      { label: "Form LS1 Q&A", href: "/form-ls1-qa" },
    ],
  },
  {
    label: "Member Services",
    href: "/member-services",
    children: [
      { label: "Sound Healthcare & Financial", href: "http://soundhealthcare.org" },
      { label: "The Tennessee Credit Union", href: "/_downloaded/sites/default/files/Media%20Root/300210%20TTCU%20Look%20Services_MAIN.pdf" },
      { label: "AFM Pension Info", href: "http://afm-epf.org" },
      { label: "Free Rehearsal Hall", href: "/free-rehearsal-hall" },
      { label: "Instrument Insurance", href: "/benefits-union-members" },
      {
        label: "HUB Instrument Insurance",
        href: "/_downloaded/sites/default/files/Media%20Root/HUBInstrumentInsurance2024.pdf",
      },
      { label: "Other AFM 257 Discounts", href: "/benefits-union-members" },
      { label: "Union Plus Program", href: "/union-plus-program" },
      { label: "Member Site Links", href: "/member-site-links" },
    ],
  },
  {
    label: "Media",
    href: "/media",
    children: [
      { label: "Featured Video", href: "/what-sound-exchange" },
      { label: "Photo and Video Gallery", href: "/photo-and-video-gallery" },
      { label: "Magazine", href: "/nashville-musician-magazine" },
    ],
  },
  {
    label: "Directory",
    href: "/directory",
    children: [
      { label: "Members Only Directory", href: "/members-only-directory" },
      { label: "Member Profile Pages (Public)", href: "/member-pages" },
    ],
  },
  {
    label: "About Us",
    href: "/about-us",
    children: [
      { label: "Constitution and By-Laws", href: "/_downloaded/sites/default/files/Media%20Root/257Bylaws2024_0.pdf" },
      { label: "Mission Statement", href: "/mission-statement" },
    ],
  },
];

export const utilityNav = [
  { label: "Join Now", href: "/join-nashville-musicians-association" },
  { label: "Sign In", href: "/user" },
];

export const siteMeta = {
  title: "Nashville Musicians Association",
  kicker: "AFM Local 257",
  logoImage: "/_downloaded/sites/default/themes/musicians/images/nma-logo.png",
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
  brandBackground: "linear-gradient(135deg, #f5f5f3 0%, #dbeaf6 100%)",
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
