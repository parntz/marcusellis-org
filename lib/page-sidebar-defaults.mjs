/**
 * When Turso has no saved sidebar for a route, these creative defaults replace the generic
 * “panels” placeholder. Copy is aligned with nashvillemusicians.org sister pages.
 * Excludes / (home) and /recording — those keep their own treatment in resolveSidebarBoxes.
 */
import { normalizeSidebarRoute } from "./normalize-sidebar-route.mjs";

const HALL = "615-244-9514";
const HALL_TEL = "tel:+16152449514";

const appearance = (accentColor, styleName = "glass-panel") => ({
  layoutName: "standard",
  styleName,
  accentColor,
  showAccentStrip: true,
});

function officeContact(heading, cta, accent = "cyan", staff = []) {
  return {
    kind: "contact",
    payload: {
      heading,
      phoneDisplay: HALL,
      phoneHref: HALL_TEL,
      cta,
      staff,
      appearance: appearance(accent),
    },
  };
}

function rateBox(heading, paragraph, accent = "electric-blue", styleName = "soft-panel") {
  return {
    kind: "rate",
    payload: {
      heading,
      paragraph,
      appearance: appearance(accent, styleName),
    },
  };
}

function bformsBox(heading, body, linkLabel, linkHref, accent = "deep-blue") {
  return {
    kind: "bforms",
    payload: {
      heading,
      body,
      linkLabel,
      linkHref,
      appearance: appearance(accent),
    },
  };
}

function ctaGroup(items, accent = "cyan") {
  return {
    kind: "cta_group",
    payload: {
      appearance: appearance(accent, "soft-panel"),
      items,
    },
  };
}

/** @type {Record<string, { kind: string, payload: Record<string, unknown> }[]>} */
const ROUTE_DEFAULTS = {
  "/news-and-events": [
    rateBox(
      "Stay in the loop",
      "General membership meetings, Wednesday night music at the hall, hearing screenings, and financial seminars land here first — check back often.",
      "cyan"
    ),
    officeContact("Questions about an event?", "Dial 0 for the operator at the union hall", "gold"),
    ctaGroup(
      [
        {
          title: "Live music hub",
          subtitle: "Hire a band, browse scales, and gig ideas",
          href: "/live-music",
          external: false,
        },
        {
          title: "Cooper Rehearsal Hall",
          subtitle: "Free member rehearsal space downtown",
          href: "/free-rehearsal-hall",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/signatory-information": [
    rateBox(
      "What “signatory” means",
      "A signatory employer has an agreement on file with the AFM or Local 257 so sessions are documented, musicians are paid correctly, and pension can be contributed.",
      "cyan"
    ),
    bformsBox(
      "Forms & scales in one place",
      "Master and demo agreements, Limited Pressing, Letters of Acceptance, and time cards — everything the Recording Department can provide.",
      "Open Scales, Forms & Agreements →",
      "/scales-forms-agreements",
      "deep-blue"
    ),
    officeContact(
      "Recording Department",
      "Heather — ext. 118 — for signatory and agreement questions",
      "gold",
      [{ name: "Recording front desk", email: "", role: `${HALL} (ext. 118)` }]
    ),
  ],

  "/live-scales-contracts-pension": [
    officeContact(
      "Live & Touring Department",
      "Michael Minton — live contracts, road scale, and wage questions",
      "cyan",
      [
        {
          name: "Michael Minton",
          email: "michael@nashvillemusicians.org",
          role: "Live & Touring",
        },
      ]
    ),
    rateBox(
      "New live wage scales",
      "The Live Performance Wage Scales booklet on the main site was updated May 1, 2024. Scroll the page for PDFs: L-1, LS-1, T-2, Touring Pension, and Road Scale.",
      "electric-blue"
    ),
    ctaGroup(
      [
        {
          title: "LS-1 packet (2025)",
          subtitle: "Pension contribution form + instructions",
          href: "/_downloaded/sites/default/files/LS-1%20packet%20-%20form%20and%20instructions%20%282025%29%201.pdf",
          external: false,
        },
        {
          title: "Form LS-1 Q&A",
          subtitle: "Weddings, casual employers, and timelines",
          href: "/form-ls1-qa",
          external: false,
        },
      ],
      "deep-blue"
    ),
  ],

  "/free-rehearsal-hall": [
    rateBox(
      "Cooper Rehearsal Hall",
      "Free for current Local 257 members. Large room with stage, lighting, new P.A. with monitors, and acoustical treatment — book 9 a.m.–11 p.m.",
      "cyan"
    ),
    officeContact("Reserve the hall", `Call ${HALL} and ask for Michael or Alona`, "gold"),
    ctaGroup(
      [
        {
          title: "Member benefits",
          subtitle: "Insurance, discounts, rehearsal hall, and more",
          href: "/benefits-union-members",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/benefits-union-members": [
    rateBox(
      "AFM-EP Pension",
      "One of the largest funds in entertainment — millions paid to musicians each year. Summary materials and applications live at afm-epf.org.",
      "gold"
    ),
    rateBox(
      "Instrument & liability coverage",
      "AFM’s all-risk instrument plan and musician liability options protect gear and gigs when homeowner policies fall short.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "Union Plus",
          subtitle: "Travel, tech, prescriptions, and AFL-CIO discounts",
          href: "/union-plus-program",
          external: false,
        },
        {
          title: "Sound Healthcare",
          subtitle: "Group health options for members",
          href: "http://soundhealthcare.org",
          external: true,
        },
      ],
      "deep-blue"
    ),
  ],

  "/member-site-links": [
    rateBox(
      "Find members online",
      "Member Profile Pages list websites, audio, and video for players who opt in — plus curated links from our legacy member directory.",
      "cyan"
    ),
    bformsBox(
      "Build your public page",
      "Register and sign in to create or refresh your profile so bookers can hear you and reach you.",
      "Open Member Profile Pages →",
      "/member-pages",
      "electric-blue"
    ),
    officeContact("Need help with the site?", `Office ${HALL} — we’ll point you to the right login or form`, "gold"),
  ],

  "/live-music": [
    rateBox(
      "Nashville’s live scene",
      "Members play out every night — from Broadway to songwriter rounds. This hub ties together who to hire, what to pay, and where to read contracts.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "Hire a musician or band",
          subtitle: "Searchable roster by style and instrument",
          href: "/find-an-artist-or-band",
          external: false,
        },
        {
          title: "Live scales & contracts",
          subtitle: "Wage scales, L-1 / LS-1 / T-2, pension forms",
          href: "/live-scales-contracts-pension",
          external: false,
        },
        {
          title: "Upcoming gigs",
          subtitle: "Where members are on the calendar",
          href: "/gigs",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/find-an-artist-or-band": [
    rateBox(
      "Hire with confidence",
      "Filter by musical style and instrumentation, then open a profile for audio clips, personnel, and direct contact links.",
      "cyan"
    ),
    bformsBox(
      "Members: polish your profile",
      "Public pages showcase your skills, gear, and availability — keep photos and audio current so bookers can say yes faster.",
      "Edit via Member Profile Pages →",
      "/member-pages",
      "gold"
    ),
    ctaGroup(
      [
        {
          title: "AFM Entertainment",
          subtitle: "National AFM booking assistance",
          href: "http://afmentertainment.org/",
          external: true,
        },
      ],
      "deep-blue"
    ),
  ],

  "/gigs": [
    rateBox(
      "On the calendar",
      "Shows listed here feature AFM Local 257 members on stage — bookmark the page for steady updates.",
      "cyan"
    ),
    officeContact("Add or correct a listing?", `Call the office at ${HALL} so we can route you to the right department`, "gold"),
    ctaGroup(
      [
        {
          title: "Live Music hub",
          subtitle: "More resources for players and presenters",
          href: "/live-music",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/member-pages": [
    rateBox(
      "Optional public profiles",
      "These are optional, public-facing pages that members choose to publish. Each profile may include credits, audio or video, styles, and booking details on its own page.",
      "cyan",
      "glass-panel"
    ),
    bformsBox(
      "Search, instruments & roster",
      "Use search for names or keywords. Use the instrument list to narrow results when personnel lines include that role. Need the full membership roster? That stays behind the members-only directory.",
      "Members-only directory →",
      "/members-only-directory",
      "electric-blue"
    ),
    officeContact("Office", `Profile or login questions — ${HALL}`, "gold"),
  ],

  "/scales-forms-agreements": [
    rateBox(
      "Recording in Nashville",
      "From master sessions to demos and limited pressing, Local 257 publishes current SRLA rates, B Forms, worksheets, and overdub guidelines — updated with the latest wage and H&W notes from the union.",
      "cyan"
    ),
    officeContact(
      "Not sure which contract?",
      `Call the Recording Department at ${HALL} before you file paperwork`,
      "gold",
      []
    ),
    ctaGroup(
      [
        {
          title: "Scales summary PDF",
          subtitle: "One-sheet overview of current rates",
          href: "/_downloaded/sites/default/files/RECORDINGSCALESUMMARYSHEET0203%202025A.pdf",
          external: false,
        },
        {
          title: "Single Song Overdub help",
          subtitle: "Video walkthrough on the legacy site topic",
          href: "/how-use-single-song-overdub-scale",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/member-services": [
    rateBox(
      "Built for working musicians",
      "Healthcare navigation, credit union membership, pension links, rehearsal hall access, and member discounts — Local 257 bundles services around real-life needs.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "Benefits deep dive",
          subtitle: "Pension, insurance, Union Plus, and more",
          href: "/benefits-union-members",
          external: false,
        },
        {
          title: "Member Site Links",
          subtitle: "Curated member websites",
          href: "/member-site-links",
          external: false,
        },
        {
          title: "Free rehearsal hall",
          subtitle: "Book Cooper Hall",
          href: "/free-rehearsal-hall",
          external: false,
        },
      ],
      "gold"
    ),
    officeContact("Personal guidance?", `Call ${HALL} — we’ll connect you to the right program`, "deep-blue"),
  ],

  "/media": [
    rateBox(
      "Stories, sight, and sound",
      "Catch the featured Sound Exchange piece, browse the photo & video gallery, and read Nashville Musician magazine — all from one media hub.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "Featured video",
          subtitle: "Sound Exchange & artist features",
          href: "/what-sound-exchange",
          external: false,
        },
        {
          title: "Photo & video gallery",
          subtitle: "Event and member imagery",
          href: "/photo-and-video-gallery",
          external: false,
        },
        {
          title: "Nashville Musician magazine",
          subtitle: "Issues and archives",
          href: "/nashville-musician-magazine",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/directory": [
    rateBox(
      "Two directories",
      "The password-protected roster protects home addresses and personal data. Public Member Profile Pages are optional marketing pages members control.",
      "cyan"
    ),
    officeContact("Directory password help?", `Call ${HALL} (dial 0) — we’ll verify membership and resend access`, "gold"),
    ctaGroup(
      [
        {
          title: "Member Profile Pages (public)",
          subtitle: "Searchable showcase for bookers",
          href: "/member-pages",
          external: false,
        },
        {
          title: "Printed / PDF roster",
          subtitle: "Download the latest password-protected PDF from the legacy directory page when available",
          href: "/members-only-directory",
          external: false,
        },
      ],
      "deep-blue"
    ),
  ],

  "/new-use-reuse": [
    rateBox(
      "Protect your masters",
      "New use happens when a recording jumps to a new medium (for example, a track licensed into a film). Re-use covers ongoing payments in TV, ads, and more.",
      "cyan"
    ),
    bformsBox(
      "Why report it?",
      "The union often learns about unpaid uses from members first. Filing the form below helps trace money that should follow the contract.",
      "Recording Department",
      "/recording",
      "gold"
    ),
    officeContact("Need help filing?", `Recording Department ${HALL}`, "electric-blue"),
  ],

  "/afm-entertainment": [
    rateBox(
      "National booking desk",
      "AFM Entertainment lists union-affiliated artists across the U.S. and Canada with staff support from AFM headquarters in New York.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "AFMentertainment.org",
          subtitle: "Browse acts and start a booking conversation",
          href: "http://afmentertainment.org/",
          external: true,
        },
        {
          title: "Hire locally first",
          subtitle: "Search Nashville members by style",
          href: "/find-an-artist-or-band",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/form-ls1-qa": [
    rateBox(
      "LS-1 in plain English",
      "The LS-1 lets a casual employer (or their designee) pay pension on a single live engagement — weddings, parties, funerals, and similar gigs.",
      "cyan"
    ),
    rateBox(
      "Remember",
      "Checks and forms go through your Local officer within 30 days of the final engagement. AFM-EPF will not accept an LS-1 without Local signature.",
      "gold"
    ),
    ctaGroup(
      [
        {
          title: "Live scales & downloads",
          subtitle: "Packets and wage PDFs",
          href: "/live-scales-contracts-pension",
          external: false,
        },
      ],
      "deep-blue"
    ),
  ],

  "/join-nashville-musicians-association": [
    rateBox(
      "Strength in numbers",
      "Local 257 represents symphony, studio, road, and teaching musicians alike — solidarity is how we protect wages, benefits, and working conditions.",
      "gold"
    ),
    officeContact(
      "Joining questions",
      "Madyson — new member onboarding",
      "cyan",
      [{ name: "Call the office", email: "", role: `${HALL}` }]
    ),
    ctaGroup(
      [
        {
          title: "Fillable membership application",
          subtitle: "Download the PDF from the main site",
          href: "/_downloaded/sites/default/files/Media%20Root/Fillable%20New%20Member%20App2025.pdf",
          external: false,
        },
        {
          title: "Member benefits",
          subtitle: "Rehearsal hall, relief funds, insurance, discounts",
          href: "/benefits-union-members",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/union-plus-program": [
    rateBox(
      "Union Plus",
      "AFL-CIO endorsed programs cover everything from cell plans and computers to legal help, travel deals, and supplemental insurance — stacked on top of Local 257 benefits.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "UnionPlus.org",
          subtitle: "Browse every national discount",
          href: "http://www.unionplus.org/",
          external: true,
        },
        {
          title: "More Local 257 perks",
          subtitle: "Healthcare, pension, and rehearsal hall",
          href: "/benefits-union-members",
          external: false,
        },
      ],
      "electric-blue"
    ),
  ],

  "/about-us": [
    rateBox(
      "Local 257",
      "We’re the Nashville chapter of the AFM — negotiating agreements, enforcing contracts, and standing with musicians in the studio, on the road, and on stage.",
      "cyan"
    ),
    officeContact("Visit or call", `Office ${HALL} — Broadway in the heart of Music City`, "gold"),
    ctaGroup(
      [
        { title: "Mission statement", subtitle: "Why we organize", href: "/mission-statement", external: false },
        { title: "Join the union", subtitle: "Dues, forms, and next steps", href: "/join-nashville-musicians-association", external: false },
      ],
      "deep-blue"
    ),
  ],

  "/mission-statement": [
    rateBox(
      "Our purpose",
      "We unite Nashville musicians to win fair pay, safe workplaces, and respect for creative work — in the studio, on tour, and in the community.",
      "gold"
    ),
    ctaGroup(
      [
        { title: "About Local 257", subtitle: "Leadership and history", href: "/about-us", external: false },
        { title: "Join", subtitle: "Become a member", href: "/join-nashville-musicians-association", external: false },
      ],
      "cyan"
    ),
  ],

  "/members-only-directory": [
    rateBox(
      "Privacy first",
      "The roster includes member contact details, so it stays password-protected. Email notices from the local usually include the current passphrase.",
      "cyan"
    ),
    officeContact("Locked out?", `Call ${HALL}, dial 0 — we’ll confirm membership and help with access`, "gold"),
    bformsBox(
      "Marketing-friendly option",
      "Need a public-facing page with audio and photos? Build a Member Profile Page instead.",
      "Browse public profiles →",
      "/member-pages",
      "electric-blue"
    ),
  ],

  "/nashville-musician-magazine": [
    rateBox(
      "Nashville Musician",
      "The local’s print and digital voice for news, politics, and culture affecting Music City players.",
      "cyan"
    ),
    ctaGroup(
      [
        { title: "News & Events", subtitle: "Latest announcements", href: "/news-and-events", external: false },
        { title: "Media hub", subtitle: "Video, gallery, magazine", href: "/media", external: false },
      ],
      "deep-blue"
    ),
  ],

  "/what-sound-exchange": [
    rateBox(
      "Sound Exchange",
      "Featured performances and educational clips highlight how Nashville musicians show up on record, on screen, and on the road.",
      "cyan"
    ),
    ctaGroup(
      [
        { title: "Photo & video gallery", subtitle: "Still and motion archives", href: "/photo-and-video-gallery", external: false },
        { title: "Media overview", subtitle: "Magazine, gigs, and more", href: "/media", external: false },
      ],
      "electric-blue"
    ),
  ],

  "/photo-and-video-gallery": [
    rateBox(
      "Gallery",
      "Event photography and member features — bookmark for press kits, social assets, and inspiration.",
      "cyan"
    ),
    ctaGroup(
      [
        { title: "Featured video", subtitle: "Sound Exchange", href: "/what-sound-exchange", external: false },
        { title: "Magazine", subtitle: "Long-form stories", href: "/nashville-musician-magazine", external: false },
      ],
      "deep-blue"
    ),
  ],

  "/how-use-single-song-overdub-scale": [
    rateBox(
      "Home overdubs, union-backed",
      "The Single Song Overdub Agreement bundles employer paperwork, worksheets, and time cards so casual home sessions stay pension-eligible and enforceable.",
      "cyan"
    ),
    ctaGroup(
      [
        {
          title: "Scales & B Forms hub",
          subtitle: "PDFs, worksheets, and fillable contracts",
          href: "/scales-forms-agreements",
          external: false,
        },
        {
          title: "Recording overview",
          subtitle: "Video, rates, and department contacts",
          href: "/recording",
          external: false,
        },
      ],
      "electric-blue"
    ),
    officeContact("Still stuck?", `Recording Department ${HALL}`, "gold"),
  ],

  "/member-benefits": [
    rateBox(
      "Member advantages",
      "Pension, instrument insurance, Union Plus, rehearsal hall access, and emergency relief — benefits scale with participation.",
      "cyan"
    ),
    ctaGroup(
      [
        { title: "Full benefits guide", subtitle: "Insurance, pension, discounts", href: "/benefits-union-members", external: false },
        { title: "Member services hub", subtitle: "Healthcare, credit union, links", href: "/member-services", external: false },
      ],
      "gold"
    ),
  ],
};

/**
 * @param {string} routeInput
 * @returns {{ kind: string, payload: Record<string, unknown> }[] | null}
 */
export function getCreativeDefaultSidebarBoxes(routeInput) {
  const route = normalizeSidebarRoute(routeInput);
  if (route === "/" || route === "/recording") {
    return null;
  }
  if (ROUTE_DEFAULTS[route]) {
    return ROUTE_DEFAULTS[route].map((box) => ({
      kind: box.kind,
      payload: { ...box.payload },
    }));
  }
  if (route.startsWith("/news-and-events/") || route.startsWith("/event/")) {
    return getCreativeDefaultSidebarBoxes("/news-and-events");
  }
  if (route.startsWith("/media/photo-gallery/")) {
    return getCreativeDefaultSidebarBoxes("/photo-and-video-gallery");
  }
  if (route.startsWith("/user/") || route.startsWith("/users/")) {
    return getCreativeDefaultSidebarBoxes("/member-pages");
  }
  return null;
}
