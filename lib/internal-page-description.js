import { siteMeta } from "./site-data.js";

/** One-line descriptions for mirrored / internal pages. */
export const INTERNAL_PAGE_DESCRIPTION = {
  NEWS_EVENTS: "Latest updates and announcements.",
  MEMBER_PAGES: "Public profiles and information.",
  MEMBER_PROFILE: "Profile and contact information.",
  CONTACT_MEMBER: "Send a message or inquiry through this contact form.",
  ACCOUNT: "Account overview and sign-in status.",
  SIGN_IN: "Secure access to member area.",
  REGISTER: "Create a password-protected account.",
  EVENT_DETAIL: "Event details and information.",
  NEWS_ARCHIVE_DETAIL: "News archive or article details.",
};

const ROUTE_DESCRIPTION_FALLBACK = {
  "/recording": "Recording services and resources.",
  "/scales-forms-agreements": "Scales, forms, and agreements.",
  "/new-use-reuse": "Report new use and reuse of recorded work.",
  "/signatory-information": "Signatory employer information.",
  "/about-us": "About Marcus Ellis - Natural Health Advocate & Cancer Survivor.",
  "/mission-statement": "Mission and values.",
  "/live-music": "Live music resources.",
  "/member-services": "Services and support.",
  "/media": "Photos, video, and media.",
  "/directory": "Directory and listings.",
  "/member-benefits": "Member benefits.",
  "/benefits-union-members": "Benefits and programs.",
  "/join": "How to connect with Marcus Ellis.",
  "/free-rehearsal-hall": "Rehearsal space information.",
  "/member-site-links": "Useful links.",
  "/gigs": "Opportunities and gigs.",
  "/live-scales-contracts-pension": "Scales, contracts, and pension resources.",
  "/form-ls1-qa": "Questions and answers.",
  "/featured-video": "Watch the latest featured video.",
  "/members-only-directory": "Private directory.",
  "/find-an-artist-or-band": "Hire artists and bands.",
};

function isBogusSummary(text) {
  if (!text?.trim()) return true;
  return (
    /^Instrument Insurance/i.test(text) ||
    /^AFM-EP Fund/i.test(text) ||
    /finest recording/i.test(text)
  );
}

/** Full header description text; length is editorial. */
function normalizeHeaderDescription(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}

/**
 * @param {*} page
 * @param {{ scalesFormsPage?: boolean; hideHeaderSummary?: boolean; isMainRecordingPage?: boolean }} ctx
 */
export function computeMirrorPageDescription(page, ctx = {}) {
  const { scalesFormsPage, hideHeaderSummary, isMainRecordingPage } = ctx;
  const route = page?.route || "";

  if (scalesFormsPage) return ROUTE_DESCRIPTION_FALLBACK["/scales-forms-agreements"];
  if (isMainRecordingPage) return ROUTE_DESCRIPTION_FALLBACK["/recording"];
  if (route === "/new-use-reuse") return ROUTE_DESCRIPTION_FALLBACK["/new-use-reuse"];
  if (route === "/signatory-information") return ROUTE_DESCRIPTION_FALLBACK["/signatory-information"];
  if (route === "/member-pages") return INTERNAL_PAGE_DESCRIPTION.MEMBER_PAGES;
  if (route === "/news-and-events" || route.startsWith("/news-and-events/")) {
    return INTERNAL_PAGE_DESCRIPTION.NEWS_EVENTS;
  }

  if (hideHeaderSummary) return INTERNAL_PAGE_DESCRIPTION.NEWS_EVENTS;

  let text = (page.summary || "").trim();
  if (isBogusSummary(text)) text = "";
  if (!text) text = (page.metaDescription || "").trim();
  if (isBogusSummary(text)) text = "";

  if (!text && ROUTE_DESCRIPTION_FALLBACK[route]) {
    return ROUTE_DESCRIPTION_FALLBACK[route];
  }

  if (text) return normalizeHeaderDescription(text);

  if (route.startsWith("/event/")) return INTERNAL_PAGE_DESCRIPTION.EVENT_DETAIL;
  if (route.startsWith("/user/")) return INTERNAL_PAGE_DESCRIPTION.CONTACT_MEMBER;
  if (route.startsWith("/musical-styles/")) return INTERNAL_PAGE_DESCRIPTION.MEMBER_PROFILE;

  return normalizeHeaderDescription(siteMeta.kicker || siteMeta.title || "Marcus Ellis");
}
