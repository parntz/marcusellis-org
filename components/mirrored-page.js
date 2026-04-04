import Link from "next/link";
import { getServerSession } from "next-auth";
import { AssetGallery } from "./asset-gallery";
import { HomepageExperience } from "./homepage-experience";
import { NewsEventsFeed } from "./news-events-feed";
import { PageHeaderWithCallout } from "./page-header-with-callout";
import { computeMirrorPageDescription } from "../lib/internal-page-description.js";
import { RecordingSidebarEditor } from "./recording-sidebar-editor";
import { RecordingSidebarPanel } from "./recording-sidebar-panel";
import { RecordingVideo } from "./recording-video";
import { ScalesMasterDetail } from "./scales-master-detail";
import { authOptions } from "../lib/auth-options";
import { resolveSidebarBoxes } from "../lib/resolve-sidebar-boxes.mjs";
import { pageMap, pages, primaryNav, siteMeta, siteStats, utilityNav } from "../lib/site-data";
import { listNewsEventsItems } from "../lib/news-events-items";

function AssetIndex({ page }) {
  return (
    <section className="asset-section">
      <div className="section-head">
        <h2>Asset Groups</h2>
        <p>Browse every downloaded file by type</p>
      </div>
      <div className="group-grid">
        {page.groups.map((group) => (
          <Link key={group.href} href={group.href} className="group-card">
            <p className="group-count">{group.count}</p>
            <h3>{group.title}</h3>
            <p>Open {group.title.toLowerCase()}</p>
          </Link>
        ))}
      </div>
      {page.groups.map((group) => (
        <AssetGallery
          key={group.href}
          title={`${group.title} Preview`}
          assets={group.sampleAssets}
        />
      ))}
    </section>
  );
}

function cleanDrupalHtml(html) {
  let cleaned = html;
  cleaned = cleaned.replace(/<ul[^>]*>[\s\S]*?<\/ul>\s*/i, (match) => {
    const navPatterns = /href="\/(?:recording|scales-forms|new-use|signatory|live-music|gigs|find-an-artist|live-scales|afm-entertainment|form-ls1|member-services|member-benefits|free-rehearsal|benefits-union|member-site|media|what-sound|photo-and-video|nashville-musician-magazine|directory|members-only)/i;
    if (navPatterns.test(match)) return "";
    return match;
  });
  cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, "");
  cleaned = cleaned.replace(/<source[^>]*>/gi, "");
  cleaned = cleaned.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "");
  cleaned = cleaned.replace(/<div>\s*(?:&nbsp;|\s)*<\/div>/gi, "");
  cleaned = cleaned.replace(/<h3>\s*(?:&nbsp;|\s)*<\/h3>/gi, "");
  cleaned = cleaned.replace(/<h2>\s*(?:&nbsp;|\s)*<\/h2>/gi, "");
  cleaned = cleaned.replace(/<a><\/a>/g, "");
  cleaned = cleaned.replace(/<div[^>]*>Media Folder:[\s\S]*?<\/div>\s*<\/div>/gi, "");
  cleaned = cleaned.replace(
    /<label[^>]*for="edit-url"[^>]*>[\s\S]*?<input[^>]*name="url"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
  cleaned = cleaned.replace(/(\s*\n){3,}/g, "\n");
  return cleaned;
}

/** Curated main copy + sidebar CTAs for /live-music (main uses newspaper columns like signatory). */
const LIVE_MUSIC_PAGE_MAIN_HTML = `
<div class="live-music-article">
  <div class="live-music-hub__lead live-music-preface">
    <p>
      Nashville is home to some of the greatest live music on earth. Our members &ldquo;play out&rdquo;
      every night of the week, and this is the place to find them, whether you are a local looking for
      something new or a tourist looking for that &ldquo;Nashville Moment&rdquo; and everything in
      between.
    </p>
  </div>
  <div class="live-music-newspaper">
    <p>
      On any given night, stages across Middle Tennessee light up with <strong>hundreds of bands and
      solo artists</strong>—union professionals, house bands, pick-up groups, and touring acts passing
      through. From early sets to last call, downtown corridors, neighborhood clubs, listening rooms,
      churches, festivals, and private rooms keep the city humming with drums, steel, horns, and
      voices that have traveled here from every corner of the map.
    </p>
    <p>
      The scene is <strong>dense, diverse, and relentless in the best way</strong>: country and
      Americana are part of the story the world knows, but rock, soul, jazz, gospel, funk, bluegrass,
      Latin music, and songwriter nights share the calendar night after night. Local 257 members are on
      the posters, in the pit orchestras, on Broadway, in East Nashville rooms, and on the festival
      fields that draw fans from around the globe.
    </p>
    <p>
      That energy is what makes Nashville more than a postcard—it is a <strong>working music town</strong>
      where audiences expect craft, show after show. Whether you are mapping a weekend of venues,
      chasing a new favorite artist, or hiring the right group for your room, you are stepping into one
      of the deepest live-music ecosystems anywhere.
    </p>
    <p>
      <strong>Explore what is playing.</strong> Use the listings and resources on this site to follow
      calendars, discover acts, and connect with members who make their living on stage—because in
      Nashville, the show is almost always already going on, and there is another room worth walking
      into tonight.
    </p>
  </div>
</div>
`.trim();

function extractLiveMusicHubParts() {
  const sidebarHtml = `<div class="live-music-hub__ctas" role="group" aria-label="Quick links">
    <a class="live-music-hub__cta" href="/find-an-artist-or-band">
      <span class="live-music-hub__cta-kicker">Hire talent</span>
      <span class="live-music-hub__cta-title">Find an artist or band</span>
      <p class="live-music-hub__cta-desc">Search our member listings to book musicians and bands for your venue or event.</p>
    </a>
    <a class="live-music-hub__cta" href="/live-scales-contracts-pension">
      <span class="live-music-hub__cta-kicker">Live engagements</span>
      <span class="live-music-hub__cta-title">Scales, contracts &amp; pension</span>
      <p class="live-music-hub__cta-desc">Live AFM rates, agreements, and pension resources for covered work.</p>
    </a>
  </div>`;

  return { mainHtml: LIVE_MUSIC_PAGE_MAIN_HTML, sidebarHtml };
}

function getRouteBodyHtml(route, bodyHtml) {
  if (route.startsWith("/recording")) {
    const emphasized = bodyHtml.replace(
      /<p[^>]*>(\s*Please Note:[\s\S]*?)<\/p>/i,
      '<p class="recording-priority-note">$1</p>'
    );
    return `<div class="recording-flow">${emphasized}</div>`;
  }

  return cleanDrupalHtml(bodyHtml);
}

/** Curated intro: clearer tone; no “below/next to” layout assumptions (responsive grid). */
const NEW_USE_REUSE_INTRO_HTML = `
<div class="new-use-intro-copy">
  <p>
    Use this page to report <strong>new use</strong> and <strong>reuse</strong>—any use, anywhere—of
    your recorded work. Local 257 often learns about unpaid use of union recordings because members
    speak up; your report helps the union follow up.
  </p>
  <p>
    <strong>New use</strong> is when music recorded for one medium shows up in another medium, for a
    different purpose. If your name is on the union contract, that can mean an additional wage
    payment. For example, a track cut for CD that later appears in a film soundtrack is a new use.
  </p>
  <p>
    <strong>Reuse</strong> refers to continued use of your recorded music under many electronic-media
    agreements—extra payments when the same recording keeps airing or circulating. Examples include
    TV programs and commercial jingles.
  </p>
</div>
`.trim();

function extractNewUseReuseSections(bodyHtml) {
  if (!bodyHtml) {
    return { copyHtml: "", formHtml: "" };
  }

  const copyMatch = bodyHtml.match(
    /<div><div><div\s+property="content:encoded">([\s\S]*?)<\/div><\/div><\/div>/i
  );
  const formMatch = bodyHtml.match(/<form[\s\S]*?<\/form>/i);

  return {
    copyHtml: copyMatch?.[1] ? NEW_USE_REUSE_INTRO_HTML : "",
    formHtml: enhanceNewUseReuseFormHtml(formMatch?.[0] || ""),
  };
}

function extractContentEncodedHtml(bodyHtml) {
  if (!bodyHtml) return "";

  const match = bodyHtml.match(
    /<div><div><div\s+property="content:encoded">([\s\S]*?)<\/div><\/div><\/div>/i
  );

  return cleanDrupalHtml(match?.[1] || bodyHtml);
}

/**
 * Drupal signatory export wraps almost everything in nested <strong>, <em>, <font>, <span>.
 * Strip those so body copy uses normal .page-content weight; keep p, headings, lists, links, tables.
 */
function normalizeSignatoryBodyHtml(html) {
  if (!html) return "";
  let out = html;

  out = out.replace(/<\/?strong\b[^>]*>/gi, "");
  out = out.replace(/<\/?b\b[^>]*>/gi, "");
  out = out.replace(/<\/?em\b[^>]*>/gi, "");
  out = out.replace(/<\/?i\b[^>]*>/gi, "");
  out = out.replace(/<\/?u\b[^>]*>/gi, "");

  while (/<span\b/i.test(out)) {
    out = out.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1");
  }
  while (/<font\b/i.test(out)) {
    out = out.replace(/<font\b[^>]*>([\s\S]*?)<\/font>/gi, "$1");
  }

  out = out.replace(/\s*style="[^"]*"/gi, "");
  out = out.replace(/\salign="[^"]*"/gi, "");

  return out;
}

/** Full-width intro + “What does Signatory mean?” heading; following copy flows in newspaper columns. */
function enhanceSignatoryArticleHtml(html) {
  const trimmed = normalizeSignatoryBodyHtml((html || "").trim());
  if (!trimmed) return "";

  const headingRe = /<h3\b[^>]*>[\s\S]*?what\s+does[\s\S]*?signatory[\s\S]*?<\/h3>/i;
  const m = trimmed.match(headingRe);
  if (!m || m.index === undefined) {
    return `<div class="signatory-article"><div class="signatory-newspaper signatory-newspaper--full">${trimmed}</div></div>`;
  }

  const end = m.index + m[0].length;
  const preface = trimmed.slice(0, end);
  const newspaper = trimmed.slice(end).replace(/^\s+/, "");

  if (!newspaper) {
    return `<div class="signatory-article"><div class="signatory-preface">${preface}</div></div>`;
  }

  return `<div class="signatory-article"><div class="signatory-preface">${preface}</div><div class="signatory-newspaper">${newspaper}</div></div>`;
}

function enhanceNewUseReuseFormHtml(formHtml) {
  if (!formHtml) return "";

  let enhanced = formHtml.replace(
    /<form\b[^>]*>/i,
    '<form class="new-use-form-layout" action="/api/forms/new-use-reuse" method="post">'
  );

  const fieldClasses = [
    ["edit-submitted-name", "new-use-field new-use-field--song"],
    ["edit-submitted-artist", "new-use-field new-use-field--artist"],
    ["edit-submitted-label", "new-use-field new-use-field--label"],
    [
      "edit-submitted-date-of-recording",
      "new-use-field new-use-field--recording-date new-use-field--date",
    ],
    ["edit-submitted-session-leader-and-other-musicians-if-known-", "new-use-field new-use-field--session"],
    [
      "edit-submitted-broadcast-date",
      "new-use-field new-use-field--broadcast-date new-use-field--date",
    ],
    [
      "edit-submitted-date-seen-if-different-from-original-broadcast-date",
      "new-use-field new-use-field--seen-date new-use-field--date",
    ],
    ["edit-submitted-type-of-new-use", "new-use-field new-use-field--use-type"],
    ["edit-submitted-your-name", "new-use-field new-use-field--contact-name"],
    ["edit-submitted-e-mail-address", "new-use-field new-use-field--email"],
    ["edit-submitted-phone-number", "new-use-field new-use-field--phone"],
    ["edit-submitted-any-additional-information", "new-use-field new-use-field--notes"],
  ];

  for (const [fieldId, className] of fieldClasses) {
    const pattern = new RegExp(`<div>(\\s*<label\\s+for="${fieldId}"[^>]*>)`, "i");
    enhanced = enhanced.replace(pattern, `<div class="${className}">$1`);
  }

  enhanced = enhanced.replace(
    /<label(\s+for="edit-submitted-date-seen-if-different-from-original-broadcast-date"[^>]*)>([\s\S]*?)<\/label>/gi,
    (_, attrs, inner) => {
      const spanMatch = inner.match(/<span\b[^>]*>[\s\S]*?<\/span>/i);
      return `<label${attrs}>Date seen${spanMatch ? ` ${spanMatch[0]}` : ""}</label>`;
    }
  );

  enhanced = enhanced.replace(
    /<div><input type="hidden" name="captcha_sid"/i,
    '<div class="new-use-field new-use-field--captcha"><input type="hidden" name="captcha_sid"'
  );
  enhanced = enhanced.replace(
    /<div><input type="submit"/i,
    '<div class="new-use-field new-use-field--actions"><input type="submit"'
  );
  enhanced = enhanced.replace(/<input type="hidden" name="details\[[^\]]+\]"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<input type="hidden" name="form_build_id"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<input type="hidden" name="form_id"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<input type="hidden" name="honeypot_time"[^>]*>\n?/gi, "");
  /* Visible honeypot: "Leave this field blank" + name="url" (API rejects non-empty url). */
  enhanced = enhanced.replace(
    /<div>\s*<div>\s*<label[^>]*\bfor="edit-url"[^>]*>[\s\S]*?<\/label>\s*<input[^>]*\bname="url"[^>]*>\s*<\/div>\s*<\/div>\s*/gi,
    ""
  );
  enhanced = enhanced.replace(/<input type="hidden" name="captcha_sid"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<input type="hidden" name="captcha_token"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<input type="hidden" name="captcha_response"[^>]*>\n?/gi, "");
  enhanced = enhanced.replace(/<div data-sitekey="[^"]*"[\s\S]*?<\/div>\s*<\/div>/i, "");
  enhanced = enhanced.replace(/<div class="new-use-field new-use-field--captcha">\s*<\/div>/i, "");

  /* Avoid whitespace text nodes between label and control (breaks display:contents grid rows). */
  enhanced = enhanced.replace(/<\/label>\s+(?=<)/gi, "</label>");

  return enhanced;
}

/** Drop opening tags left hanging when we cut before “Call the Local…”. */
function trimIncompleteContactLead(html) {
  let s = html;
  let prev;
  do {
    prev = s;
    s = s.replace(/\s*(?:<div\b[^>]*>|<strong>|<em>|<u>|<b>)\s*$/gi, "").trimEnd();
  } while (s !== prev);
  return s;
}

function cutRecordingHtmlBeforeContact(html) {
  const markers = ["Call the Local 257", "Call the Local 257 recording"];
  let cut = -1;
  for (const m of markers) {
    const i = html.indexOf(m);
    if (i >= 0 && (cut < 0 || i < cut)) cut = i;
  }
  if (cut < 0) return html;
  return trimIncompleteContactLead(html.slice(0, cut));
}

function extractRecordingContent(bodyHtml) {
  let main = bodyHtml || "";

  main = main.replace(/\s+style="[^"]*"/gi, "");
  main = main.replace(/<ul>[\s\S]*?scales-forms-agreements[\s\S]*?<\/ul>/i, "");
  main = main.replace(/<h1[^>]*>\s*Recording\s*<\/h1>/i, "");
  main = main.replace(/<h3[^>]*>\s*(?:&nbsp;|\s)*<\/h3>/gi, "");

  let videoEmbedSrc = "";
  const iframeMatch =
    main.match(/<iframe[\s\S]*?src="([^"]*)"[\s\S]*?<\/iframe>/i) ||
    main.match(/<iframe[\s\S]*?src='([^']*)'[\s\S]*?<\/iframe>/i);
  if (iframeMatch) {
    videoEmbedSrc = iframeMatch[1];
    main = main.replace(/<p>\s*<iframe[\s\S]*?<\/iframe>\s*<\/p>/i, "");
    main = main.replace(/<iframe[\s\S]*?<\/iframe>/i, "");
  }

  let rateUpdateText = "";
  main = main.replace(/<h3[^>]*>([^<]|<(?!\/h3>))*<\/h3>/gi, (match) => {
    if (/SRLA/i.test(match)) {
      rateUpdateText = match.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      return "";
    }
    return /Click/i.test(match) ? "" : match;
  });

  /*
   * Never use lastIndexOf("<div") before the callout: if “Call…” is not inside
   * a leading <div>, that index can point at content:encoded / Page 1 and wipe
   * all body copy under the video.
   */
  main = cutRecordingHtmlBeforeContact(main);

  /* Main column copy under the video: keep links/formatting for .recording-flow columns */
  let flowBody = main.replace(/<a><\/a>/g, "");
  flowBody = flowBody.replace(/<h3\b[^>]*>[\s\S]*?\bClick\b[\s\S]*?<\/h3>/gi, "");
  flowBody = flowBody.replace(/\s+style="[^"]*"/gi, "");
  flowBody = flowBody.replace(/<\/?div[^>]*>/gi, "");
  flowBody = flowBody.replace(/<p[^>]*>/gi, "<p>");
  flowBody = flowBody.replace(/(\s*\n){3,}/g, "\n");
  flowBody = flowBody.replace(/<p>\s*Please Note:[\s\S]*?<\/p>/i, "");
  flowBody = flowBody.trim();

  const flowHtml = flowBody
    ? `<div class="recording-flow">${flowBody}</div>`
    : "";

  return {
    videoEmbedSrc,
    rateUpdateText,
    flowHtml,
  };
}

function transformScalesFormsContent(bodyHtml) {
  let html = bodyHtml || "";

  html = html.replace(/\s+style="[^"]*"/gi, "");
  html = html.replace(/<ul>[\s\S]*?scales-forms-agreements[\s\S]*?<\/ul>/i, "");
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  html = html.replace(/<p[^>]*>[\s\S]*?finest recording musicians[\s\S]*?<\/p>/i, "");
  html = html.replace(/<p[^>]*>[\s\S]*?Click here to watch[\s\S]*?<\/p>/i, "");
  html = html.replace(/<p[^>]*>[\s\S]*?Please Note:[\s\S]*?<\/p>/i, "");
  html = html.replace(/<h3[^>]*>[\s\S]*?AFM SRLA scales[\s\S]*?<\/h3>/i, "");
  html = html.replace(/<h3[^>]*>[\s\S]*?Contact the Local 257 Recording Department[\s\S]*?<\/h3>/i, "");

  const tablistIndex = html.search(/<div[^>]*role="tablist"[^>]*>/i);
  const introHtml = tablistIndex > -1 ? html.slice(0, tablistIndex) : html;
  const tabHtml = tablistIndex > -1 ? html.slice(tablistIndex) : "";

  const sections = [];
  const sectionRegex =
    /<h3[^>]*role="tab"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>\s*<div[^>]*role="tabpanel"[^>]*>([\s\S]*?)<\/div>/gi;

  tabHtml.replace(sectionRegex, (match, rawTitle, rawBody) => {
    const title = rawTitle.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const body = rawBody
      .replace(/<\/?div[^>]*>/gi, "")
      .replace(/<\/?span[^>]*>/gi, "")
      .replace(
        /<a\s+href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi,
        (_m, href, _attrs, text) =>
          `<a href="${href}" target="_blank" rel="noopener noreferrer">${text.trim()}</a>`
      )
      .replace(/&nbsp;/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    sections.push({ title, body });
    return "";
  });

  const intro = introHtml
    .replace(/<a><\/a>/g, "")
    .replace(/<\/?div[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return { introHtml: intro, sections };
}

export async function MirroredPage({ page, heroHomeConfig = null, searchParams = {} }) {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user);

  const uniquePages = Array.from(
    new Map((pages || []).map((item) => [item.route, item])).values()
  );
  const homeRoute = page.route === "/" && page.kind === "mirror-page";
  const aboutPage = pageMap["/about-us"] || null;
  const joinHref =
    utilityNav.find((item) => item.label.toLowerCase().includes("join"))?.href ||
    "/join-nashville-musicians-association";
  const benefits = [
    {
      label: "Contracts",
      title: "Contract support and protections",
      summary: "Access negotiated standards and practical support for recording and live work.",
      href: "/scales-forms-agreements",
    },
    {
      label: "Benefits",
      title: "Benefits built for working players",
      summary: "Explore union-backed services, discounts, and career-focused member support.",
      href: "/member-benefits",
    },
    {
      label: "Community",
      title: "A connected Nashville network",
      summary: "Find collaborations, local opportunities, and peers across the music community.",
      href: "/find-an-artist-or-band",
    },
    {
      label: "Advocacy",
      title: "Representation where it matters",
      summary: "Strengthen your leverage with a union voice in negotiations and workplace issues.",
      href: "/about-us",
    },
    {
      label: "Resources",
      title: "Actionable resources and documents",
      summary: "Get quick access to scales, forms, agreements, and key member information.",
      href: "/downloaded-assets/documents",
    },
    {
      label: "Events",
      title: "Stay in sync with local programming",
      summary: "Track announcements, updates, and opportunities around Nashville music.",
      href: "/news-and-events",
    },
  ];
  const events = uniquePages
    .filter(
      (item) =>
        item.kind === "mirror-page" &&
        /^\/news-and-events\/\d{4}-\d{2}$/.test(item.route) &&
        item.summary
    )
    .sort((left, right) => right.route.localeCompare(left.route))
    .slice(0, 6);
  const resources = [
    {
      label: "Scales, Forms & Agreements",
      href: "/scales-forms-agreements",
      summary: "Essential contracts and rate resources.",
      status: "Member Info",
    },
    {
      label: "Membership Directory",
      href: "/directory",
      summary: "Locate peers and member contacts.",
      status: "Popular",
    },
    {
      label: "Member Site Links",
      href: "/member-site-links",
      summary: "Fast links to day-to-day member tools.",
      status: "Quick Access",
    },
    {
      label: "Downloaded Assets",
      href: "/downloaded-assets",
      summary: "Browse documents, media, and files.",
      status: "New",
    },
  ];
  const spotlight = [
    "/find-an-artist-or-band",
    "/free-rehearsal-hall",
    "/join-nashville-musicians-association",
  ]
    .map((route) => pageMap[route])
    .filter(Boolean);
  const newsEventsRoute = page.kind === "mirror-page" && page.route === "/news-and-events";
  const eventDetailRoute = page.kind === "mirror-page" && page.route.startsWith("/event/");
  const memberPagesRoute = page.kind === "mirror-page" && page.route === "/member-pages";
  const recordingFamilyRoutes = [
    "/scales-forms-agreements",
    "/new-use-reuse",
    "/signatory-information",
  ];
  const recordingRoute =
    page.kind === "mirror-page" &&
    (page.route.startsWith("/recording") || recordingFamilyRoutes.includes(page.route));
  const isMainRecordingPage = page.kind === "mirror-page" && page.route === "/recording";
  const scalesFormsPage = page.kind === "mirror-page" && page.route === "/scales-forms-agreements";
  const newUseReusePage = page.kind === "mirror-page" && page.route === "/new-use-reuse";
  const signatoryPage = page.kind === "mirror-page" && page.route === "/signatory-information";
  const liveMusicPage = page.kind === "mirror-page" && page.route === "/live-music";
  const recordingNavChildren =
    primaryNav.find((item) => item.href === "/recording")?.children || [];
  const hideHeaderSummary =
    page.kind === "mirror-page" && page.route.startsWith("/news-and-events");

  const pageTypeClass = (() => {
    if (page.kind !== "mirror-page") return "";
    const r = page.route;
    if (r === "/about-us") return "pg-about";
    if (r === "/mission-statement") return "pg-mission";
    if (r === "/live-music") return "pg-hub pg-live";
    if (r === "/member-services") return "pg-hub pg-services";
    if (r === "/media") return "pg-hub pg-media-hub";
    if (r === "/directory") return "pg-hub pg-directory";
    if (r === "/member-benefits" || r === "/benefits-union-members") return "pg-benefits";
    if (r === "/join-nashville-musicians-association") return "pg-join";
    if (r === "/free-rehearsal-hall") return "pg-venue";
    if (r === "/member-site-links") return "pg-links";
    if (r === "/gigs") return "pg-gigs";
    if (r === "/live-scales-contracts-pension") return "pg-scales-live";
    if (r === "/form-ls1-qa") return "pg-faq";
    if (r === "/afm-entertainment") return "pg-hub";
    if (r === "/what-sound-exchange") return "pg-video";
    if (r === "/nashville-musician-magazine") return "pg-magazine";
    if (r === "/members-only-directory") return "pg-directory";
    if (r === "/signatory-information") return "pg-info";
    if (r === "/new-use-reuse") return "pg-form";
    if (r === "/scales-forms-agreements") return "pg-scales-forms";
    if (r.startsWith("/event/")) return "pg-event";
    if (r.startsWith("/musical-styles/") || r.startsWith("/user/")) return "pg-profile";
    return "";
  })();
  const newsEventItems = newsEventsRoute
    ? await listNewsEventsItems(1000, "/news-and-events")
    : [];
  const recordingSidebarBoxes = isMainRecordingPage ? await resolveSidebarBoxes("/recording") : null;
  const newsSidebarBoxes = newsEventsRoute ? await resolveSidebarBoxes("/news-and-events") : null;
  const signatorySidebarBoxes = signatoryPage
    ? await resolveSidebarBoxes("/signatory-information", "/news-and-events")
    : null;
  const recordingContent = isMainRecordingPage
    ? extractRecordingContent(page.bodyHtml || "")
    : null;
  const scalesContent = scalesFormsPage ? transformScalesFormsContent(page.bodyHtml || "") : null;
  const signatoryContentHtml = signatoryPage
    ? enhanceSignatoryArticleHtml(extractContentEncodedHtml(page.bodyHtml || ""))
    : "";
  const rateUpdateText = (() => {
    if (recordingContent?.rateUpdateText) return recordingContent.rateUpdateText;
    if (!scalesFormsPage) return "";
    const recPage = pageMap["/recording"];
    if (!recPage?.bodyHtml) return "";
    const m = recPage.bodyHtml.match(/<h3[^>]*>([^<]|<(?!\/h3>))*SRLA([^<]|<(?!\/h3>))*<\/h3>/i);
    return m ? m[0].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : "";
  })();
  const liveMusicParts = liveMusicPage ? extractLiveMusicHubParts() : null;

  const bodyHtml =
    isMainRecordingPage || scalesFormsPage || newUseReusePage || signatoryPage || liveMusicPage
      ? ""
      : getRouteBodyHtml(page.route, page.bodyHtml || "");

  const newUseReuseSections = newUseReusePage
    ? extractNewUseReuseSections(page.bodyHtml || "")
    : null;
  const newUseStatus =
    newUseReusePage && searchParams?.submitted === "1"
      ? { tone: "success", message: "Your submission was sent." }
      : newUseReusePage && searchParams?.error
        ? { tone: "error", message: "Your submission could not be sent. Please try again." }
        : null;

  return (
    <article className={`page-frame ${memberPagesRoute ? "member-pages-shell" : ""} ${pageTypeClass}`}>
        {homeRoute ? (
          <HomepageExperience
            siteMeta={siteMeta}
            siteStats={siteStats}
            homePage={page}
            aboutPage={aboutPage}
            joinHref={joinHref}
            benefits={benefits}
            events={events}
            resources={resources}
            spotlight={spotlight}
            heroHomeConfig={heroHomeConfig}
          />
        ) : (
          <PageHeaderWithCallout
            title={page.title}
            description={computeMirrorPageDescription(page, {
              scalesFormsPage,
              hideHeaderSummary,
              isMainRecordingPage,
            })}
          />
        )}

        {page.kind === "mirror-page" && !homeRoute && isMainRecordingPage ? (
          <div className="recording-page recording-sidebar-layout">
            <div className="recording-body-grid">
              <div className="recording-video-area">
                {recordingContent?.videoEmbedSrc ? (
                  <RecordingVideo embedSrc={recordingContent.videoEmbedSrc} />
                ) : null}
              </div>
              <aside className="recording-sidebar">
                <RecordingSidebarPanel boxes={recordingSidebarBoxes} />
                {isAdmin ? (
                  <RecordingSidebarEditor pageRoute="/recording" initialBoxes={recordingSidebarBoxes} />
                ) : null}
              </aside>
              <section
                className="page-content recording-content"
                dangerouslySetInnerHTML={{ __html: recordingContent?.flowHtml || "" }}
              />
            </div>
          </div>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && scalesFormsPage ? (
          <div className="recording-page recording-sidebar-layout">
            <div className="recording-body-grid recording-body-grid--scales">
              <section className="recording-content">
                <ScalesMasterDetail sections={scalesContent?.sections} />

                {scalesContent?.introHtml ? (
                  <div
                    className="recording-flow recording-scales-intro recording-scales-intro--after-accordion"
                    dangerouslySetInnerHTML={{ __html: scalesContent.introHtml }}
                  />
                ) : null}
              </section>

              <aside className="recording-sidebar">
                <div className="recording-contact-box">
                  <h3 className="recording-sidebar-heading">Recording Department</h3>
                  <a href="tel:+16152449514" className="recording-phone">
                    615-244-9514
                  </a>
                  <p className="recording-contact-cta">Call for contract guidance or paperwork help</p>
                  <div className="recording-staff">
                    <div className="recording-staff-member">
                      <a href="mailto:billy@nashvillemusicians.org">Billy Lynn</a>
                      <span>Director of Recording</span>
                    </div>
                    <div className="recording-staff-member">
                      <a href="mailto:william@nashvillemusicians.org">William Sansbury</a>
                    </div>
                    <div className="recording-staff-member">
                      <a href="mailto:paige@nashvillemusicians.org">Paige Conners</a>
                    </div>
                  </div>
                </div>
                {rateUpdateText ? (
                  <div className="recording-callout recording-rate-callout">
                    <h3 className="recording-sidebar-heading">Rate Update</h3>
                    <p>{rateUpdateText}</p>
                  </div>
                ) : null}

                <div className="recording-cta-box">
                  <a
                    href="https://nashvillemusicians.org/sites/default/files/RECORDINGSCALESUMMARYSHEET0203%202025A.pdf"
                    className="recording-cta-item"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>Scales Summary</strong>
                    <span>One-sheet of current SRLA, Demo, and Limited Pressing rates</span>
                  </a>
                  <a
                    href="https://nashvillemusicians.org/sites/default/files/Local257TimeCard8.pdf"
                    className="recording-cta-item"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>Time Card</strong>
                    <span>Download the latest Local 257 time card</span>
                  </a>
                  <Link href="/recording" className="recording-cta-item">
                    <strong>Recording Overview</strong>
                    <span>Return to the recording homepage</span>
                  </Link>
                </div>

                <Link href="/scales-forms-agreements" className="recording-callout recording-bforms-callout">
                  <h3 className="recording-bforms-title">B Forms</h3>
                  <p>
                    B-4 (SRLA), B-5 (Demo), and B-9 (Limited Pressing) fillable PDFs — choose <strong>B Forms</strong> in the section list.
                  </p>
                  <span className="recording-callout-link">Open B Forms section ↓</span>
                </Link>
              </aside>
            </div>
          </div>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && !isMainRecordingPage && !scalesFormsPage ? (
          newsEventsRoute ? (
            <div className={`recording-page recording-sidebar-layout news-events-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales recording-body-grid--news">
                <div className="recording-news-main">
                  {newsEventItems.length ? (
                    <NewsEventsFeed items={newsEventItems} />
                  ) : (
                    <section
                      className="page-content recording-content"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  )}
                </div>
                <aside className="recording-sidebar">
                  <RecordingSidebarPanel boxes={newsSidebarBoxes} />
                  {isAdmin ? (
                    <RecordingSidebarEditor
                      pageRoute="/news-and-events"
                      initialBoxes={newsSidebarBoxes}
                    />
                  ) : null}
                </aside>
              </div>
            </div>
          ) : signatoryPage ? (
            <div className={`recording-page recording-sidebar-layout signatory-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section className="page-content signatory-content">
                  <div
                    className="signatory-article-host"
                    dangerouslySetInnerHTML={{ __html: signatoryContentHtml }}
                  />
                </section>
                <aside className="recording-sidebar">
                  <RecordingSidebarPanel boxes={signatorySidebarBoxes} />
                  {isAdmin ? (
                    <RecordingSidebarEditor
                      pageRoute="/signatory-information"
                      initialBoxes={signatorySidebarBoxes}
                    />
                  ) : null}
                </aside>
              </div>
            </div>
          ) : liveMusicPage ? (
            <div className={`recording-page recording-sidebar-layout live-music-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section
                  className="page-content recording-content live-music-main"
                  dangerouslySetInnerHTML={{ __html: liveMusicParts.mainHtml }}
                />
                <aside className="recording-sidebar live-music-sidebar">
                  <div dangerouslySetInnerHTML={{ __html: liveMusicParts.sidebarHtml }} />
                </aside>
              </div>
            </div>
          ) : (
            <div className={`page-columns ${recordingRoute ? "recording-columns" : ""} ${pageTypeClass}`}>
              {newUseReusePage && newUseReuseSections ? (
                <div className="new-use-grid">
                  <section
                    className="page-content new-use-copy"
                    dangerouslySetInnerHTML={{ __html: newUseReuseSections.copyHtml }}
                  />
                  <section className="page-content new-use-form">
                    {newUseStatus ? (
                      <p className={`form-status form-status--${newUseStatus.tone}`}>
                        {newUseStatus.message}
                      </p>
                    ) : null}
                    <div dangerouslySetInnerHTML={{ __html: newUseReuseSections.formHtml }} />
                  </section>
                </div>
              ) : eventDetailRoute ? (
                <section
                  className="page-content event-detail-content"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <section
                  className={`page-content ${recordingRoute ? "recording-content" : ""}`}
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              )}
              {page.pageAssets?.length && !eventDetailRoute && !recordingRoute ? (
                <aside className="page-sidebar">
                  <AssetGallery title="Unique Page Assets" assets={page.pageAssets} />
                </aside>
              ) : null}
            </div>
          )
        ) : null}

        {page.kind === "asset-index" ? <AssetIndex page={page} /> : null}
        {page.kind === "asset-group" ? (
          <AssetGallery title={page.title} assets={page.assets} />
        ) : null}
    </article>
  );
}
