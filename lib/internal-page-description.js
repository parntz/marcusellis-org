import { siteMeta } from "./site-data.js";

/** One-line descriptions for mirrored / internal pages (matches News & Events band style). */
export const INTERNAL_PAGE_DESCRIPTION = {
  NEWS_EVENTS: "Latest updates, announcements, and calendar highlights.",
  MEMBER_PAGES: "Search public member profiles and contact links.",
  MEMBER_PROFILE: "Credits, instruments, and booking information.",
  CONTACT_MEMBER: "Send a message or inquiry through this member’s contact form.",
  ACCOUNT: "Account overview and sign-in status.",
  SIGN_IN: "Secure access to member tools.",
  REGISTER: "Create a password-protected member account.",
  EVENT_DETAIL: "Event details and information.",
  NEWS_ARCHIVE_DETAIL: "News archive or article details.",
};

const ROUTE_DESCRIPTION_FALLBACK = {
  "/recording": "Recording department rates, contracts, and session resources.",
  "/scales-forms-agreements": "Scales, forms, and limited pressing agreements.",
  "/new-use-reuse":
    "Report new use and reuse of recorded work; definitions of terms and the member submission form.",
  "/signatory-information": "Signatory and employer information.",
  "/about-us": "About AFM Local 257 Nashville.",
  "/mission-statement": "Mission and values of the local.",
  "/live-music": "Live music resources and listings.",
  "/member-services": "Services and support for members.",
  "/media": "Photos, video, and media from the local.",
  "/directory": "Directory and member listings.",
  "/member-benefits": "Member benefits and discounts.",
  "/benefits-union-members": "Union member benefits and programs.",
  "/join-nashville-musicians-association": "How to join Local 257.",
  "/free-rehearsal-hall": "Rehearsal space for members.",
  "/member-site-links": "Useful links for members.",
  "/gigs": "Gigs and work opportunities.",
  "/live-scales-contracts-pension": "Scales, contracts, and pension resources.",
  "/form-ls1-qa": "Questions and answers.",
  "/afm-entertainment": "Entertainment industry resources.",
  "/what-sound-exchange": "SoundExchange and royalty information.",
  "/nashville-musician-magazine": "Magazine articles and archives.",
  "/members-only-directory": "Password-protected member directory.",
  "/find-an-artist-or-band": "Hire musicians and bands.",
};

function isBogusSummary(text) {
  if (!text?.trim()) return true;
  return (
    /^Instrument Insurance/i.test(text) ||
    /^AFM-EP Fund/i.test(text) ||
    /finest recording/i.test(text)
  );
}

function firstLine(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const sentence = t.split(/(?<=[.!?])\s+/)[0] || t;
  return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
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

  if (text) return firstLine(text);

  if (route.startsWith("/event/")) return INTERNAL_PAGE_DESCRIPTION.EVENT_DETAIL;
  if (route.startsWith("/user/")) return INTERNAL_PAGE_DESCRIPTION.CONTACT_MEMBER;
  if (route.startsWith("/musical-styles/")) return INTERNAL_PAGE_DESCRIPTION.MEMBER_PROFILE;

  return firstLine(siteMeta.kicker || siteMeta.title || "Nashville AFM Local 257.");
}
