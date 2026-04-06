import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { AssetGallery } from "./asset-gallery";
import { HomepageExperience } from "./homepage-experience";
import { FindArtistEnhancer } from "./find-artist-enhancer";
import { MemberSiteLinksHeroAdmin } from "./member-site-links-hero-admin";
import { MemberSiteLinksIntroAdmin } from "./member-site-links-intro-admin";
import { MemberSiteLinksCreateButton } from "./member-site-links-create-button";
import { MemberSiteLinksDirectory } from "./member-site-links-directory";
import { NewsEventsFeed } from "./news-events-feed";
import { PageHeaderWithCallout } from "./page-header-with-callout";
import { ProfilePageEnhancer } from "./profile-page-enhancer";
import { FaqSearch } from "./faq-search";
import { computeMirrorPageDescription } from "../lib/internal-page-description.js";
import { RecordingSidebarPanel } from "./recording-sidebar-panel";
import { RecordingVideo } from "./recording-video";
import { RecordingPageAdmin } from "./recording-page-admin";
import { RecordingPageOptionsButton } from "./recording-page-options-button";
import { ScalesMasterDetail } from "./scales-master-detail";
import { authOptions } from "../lib/auth-options";
import { listMemberSiteLinks } from "../lib/member-site-links";
import { resolveSidebarBoxes } from "../lib/resolve-sidebar-boxes.mjs";
import { pageMap, primaryNav, siteStats, utilityNav } from "../lib/site-data";
import { listNewsEventsItems } from "../lib/news-events-items";
import { getMemberSiteLinksHeroConfig } from "../lib/site-config-member-site-links-hero";
import { getMemberSiteLinksIntroConfig } from "../lib/site-config-member-site-links-intro";
import { getRecordingPageConfig } from "../lib/site-config-recording-page";
import { getScalesFormsLinksConfig } from "../lib/site-config-scales-forms-links";

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
  cleaned = cleaned.replace(/href=(["'])\/user\/login\/?\1/gi, 'href="/sign-in"');
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
  cleaned = cleaned.replace(
    /<(p|div|li)[^>]*>\s*Source:\s*(?:<a[^>]*>)?https?:\/\/[^\s<]+(?:<\/a>)?\s*<\/\1>/gi,
    ""
  );
  cleaned = cleaned.replace(/(?:^|[\r\n])\s*Source:\s*https?:\/\/\S+\s*(?=[\r\n]|$)/gi, "");
  cleaned = cleaned.replace(/<div[^>]*>Media Folder:[\s\S]*?<\/div>\s*<\/div>/gi, "");
  cleaned = cleaned.replace(
    /<label[^>]*for="edit-url"[^>]*>[\s\S]*?<input[^>]*name="url"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
  cleaned = cleaned.replace(/(\s*\n){3,}/g, "\n");
  return cleaned;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(input = "") {
  return String(input)
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&trade;/gi, "TM")
    .replace(/&reg;/gi, "(R)")
    .replace(/&copy;/gi, "(C)")
    .replace(/&eacute;/gi, "e")
    .replace(/&uuml;/gi, "u")
    .replace(/&ouml;/gi, "o")
    .replace(/&aacute;/gi, "a")
    .replace(/&nbsp/gi, " ");
}

function stripHtml(input = "") {
  return cleanText(
    decodeHtmlEntities(
      String(input)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
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

function normalizeTitleKey(value) {
  return cleanText(stripHtml(value)).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function describeLiveScalesResource(title) {
  const key = normalizeTitleKey(title);
  if (key.includes("touring pension agreement")) {
    return "AFM-EP pension paperwork for touring live engagements.";
  }
  if (key.includes("road scale")) {
    return "Touring wage minimums, travel terms, and per diem guidance.";
  }
  if (key.includes("afm t2")) {
    return "Use this contract when traveling outside the Nashville area.";
  }
  if (key.includes("afm l1")) {
    return "Standard contract for local concerts, weddings, parties, and special events.";
  }
  if (key.includes("ls 1") || key.includes("ls1")) {
    return "Single-engagement pension contribution packet with instructions.";
  }
  if (key.includes("wage scales")) {
    return "Current Local 257 live performance wage minimums.";
  }
  return "Download the current PDF resource.";
}

function extractLiveScalesContent(bodyHtml) {
  const cleaned = cleanDrupalHtml(bodyHtml || "");
  const leadHtml = cleaned.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)?.[0] || "";
  const noteHtml = cleaned.match(/<div>\s*<strong>\s*Note:[\s\S]*?<\/strong>\s*<\/div>/i)?.[0] || "";

  const overviewItems = Array.from(
    cleaned.matchAll(/<div>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>([\s\S]*?)<\/div>/gi),
    (match) => ({
      title: cleanText(stripHtml(match[1])).replace(/:$/, ""),
      description: cleanText(stripHtml(match[2])),
    })
  ).filter((item) => item.title && item.description && !/^note\b/i.test(item.title));

  const resources = [];
  const seenHrefs = new Set();
  for (const match of cleaned.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = cleanText(match[1]);
    if (!/\/sites\/default\/files\//i.test(href) || seenHrefs.has(href)) {
      continue;
    }
    seenHrefs.add(href);
    const title = cleanText(stripHtml(match[2]));
    if (!title) continue;
    resources.push({
      title,
      href,
      summary: describeLiveScalesResource(title),
    });
  }

  return {
    leadHtml,
    noteHtml,
    overviewItems,
    resources,
  };
}

function extractRehearsalHallContent(bodyHtml) {
  const contentHtml = extractContentEncodedHtml(bodyHtml || "");
  const paragraphs = Array.from(contentHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) =>
    cleanText(stripHtml(match[1]))
  ).filter(Boolean);

  return {
    lead:
      paragraphs[0] ||
      "Use of the Cooper Rehearsal Hall at Local 257 is free to all current members.",
  };
}

const BENEFITS_INSURANCE_ITEMS = [
  "Instrument and equipment coverage",
  "Musician liability insurance",
  "Accidental death and dismemberment",
  "Cancer care protection",
  "Catastrophic major medical",
  "Disability income plan",
  "Group term life",
  "Hospital indemnity",
  "Major medical plans",
  "Short-term medical",
];

const BENEFITS_RESOURCE_LINKS = [
  {
    title: "Sound Healthcare & Financial",
    href: "http://soundhealthcare.org",
    external: true,
    summary: "Health and financial resources tailored to working musicians.",
  },
  {
    title: "The Tennessee Credit Union",
    href: "http://www.nashvillemusicians.org/sites/default/files/Media%20Root/300210%20TTCU%20Look%20Services_MAIN.pdf",
    external: true,
    summary: "Member-facing credit union information and services.",
  },
  {
    title: "AFM Pension Info",
    href: "http://afm-epf.org",
    external: true,
    summary: "Plan details, applications, and pension fund resources.",
  },
  {
    title: "HUB Instrument Insurance",
    href: "https://nashvillemusicians.org/sites/default/files/Media%20Root/HUBInstrumentInsurance2024.pdf",
    external: true,
    summary: "Coverage details for instruments and music-related equipment.",
  },
  {
    title: "Union Plus Program",
    href: "/union-plus-program",
    external: false,
    summary: "Discounts, legal services, travel savings, and everyday member perks.",
  },
  {
    title: "Free Rehearsal Hall",
    href: "/free-rehearsal-hall",
    external: false,
    summary: "Book the Cooper Rehearsal Hall as a current Local 257 member.",
  },
  {
    title: "Member Site Links",
    href: "/member-site-links",
    external: false,
    summary: "Jump to member tools, profiles, and practical online resources.",
  },
];

function extractBenefitsHubContent(bodyHtml) {
  const contentHtml = extractContentEncodedHtml(bodyHtml || "");
  const paragraphs = Array.from(contentHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), (match) =>
    cleanText(stripHtml(match[1]))
  ).filter(Boolean);

  return {
    lead:
      paragraphs[0] ||
      "Local 257 offers members meaningful services, insurance access, pension resources, discounts, and practical support for working musicians.",
  };
}

const MEMBER_SITE_LINK_URL_OVERRIDES = new Map([
  ["http://www.billwencepromotions.com/", "https://billwencepromos.com/"],
  ["http://www.brentrowan.com/", "https://brentrowan.com/"],
  ["http://www.buddygreene.com/", "https://www.buddygreene.com/"],
  ["http://www.charliemccoy.com/", "https://charliemccoy.com/"],
  ["http://www.nashvillenumbersystem.com/", "https://nashvillenumbersystem.com/download/"],
  ["http://www.aliasmusic.org/", "https://www.aliasmusic.org/"],
  ["http://www.colinlinden.com/", "https://colinlinden.bandzoogle.com/"],
  ["http://www.davepomeroy.com/", "https://davepomeroy.com/"],
  ["http://www.deanslocum.com/", "https://www.deanslocum.com/"],
  ["http://www.gcmusic1.com/", "https://www.gcmusic1.com/"],
  ["http://www.jackpearson.com/", "https://jackpearson.com/"],
  ["http://www.jaypatten.com/", "https://jaypatten.com/"],
  ["http://www.jeffsteinberg.com/", "https://www.jeffsteinberg.com/"],
  ["http://www.jerrydouglas.com/", "https://jerrydouglas.com/"],
  ["http://www.jellyrolljohnson.com/", "https://www.jellyrolljohnson.com/"],
  ["http://www.beairdmusicgroup.com/", "https://www.beairdmusicgroup.com/"],
  ["http://www.larry-franklin.com/", "https://www.larry-franklin.com/"],
  ["http://www.markoconnor.com/", "https://www.markoconnor.com/"],
  ["http://www.digitalaudiopost.com/", "https://www.digitalaudiopost.com/"],
  ["http://www.digitalmusicworkshop.com/", "https://www.digitalmusicworkshop.com/"],
  ["http://www.paulfranklinmethod.com", "https://www.paulfranklinmethod.com/"],
  ["http://www.stevewariner.com/", "https://www.stevewariner.com/"],
  ["http://www.terrytownson.com/", "https://terrytownson.com/"],
  ["https://www.tigerfitzhugh.com/", "https://www.tigerfitzhugh.com/"],
  ["http://www.vincegill.com/", "https://www.vincegill.com/"],
]);

const MEMBER_SITE_LINK_REMOVALS = new Set([
  "http://www.curtisjay.com/",
  "http://www.leeplaysbass.com/",
  "http://www.ronoates.com/",
]);

function splitMemberSiteLabel(label) {
  const clean = cleanText(label);
  if (!clean) return { title: "", subtitle: "" };
  const pieces = clean.split(/\s+-\s+/);
  if (pieces.length > 1) {
    return { title: pieces[0], subtitle: pieces.slice(1).join(" - ") };
  }
  return { title: clean, subtitle: "" };
}

function extractMemberSiteLinksContent(bodyHtml) {
  const contentHtml = extractContentEncodedHtml(bodyHtml || "");
  const introMatch = contentHtml.match(/<p\b[^>]*>[\s\S]*?<\/p>/i);
  const rawLinks = Array.from(
    contentHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    (match) => {
      const href = cleanText(match[1]);
      const label = cleanText(stripHtml(match[2]));
      const canonicalHref = MEMBER_SITE_LINK_URL_OVERRIDES.get(href) || href;
      const { title, subtitle } = splitMemberSiteLabel(label);
      let domain = "";
      try {
        domain = new URL(canonicalHref).hostname.replace(/^www\./i, "");
      } catch {}
      return {
        href: canonicalHref,
        originalHref: href,
        label,
        title,
        subtitle,
        domain,
      };
    }
  )
    .filter((item) => /^https?:\/\//i.test(item.href))
    .filter((item) => !MEMBER_SITE_LINK_REMOVALS.has(item.originalHref))
    .filter((item) => item.title)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.title === item.title) === index)
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    introHtml: introMatch?.[0] || "",
    links: rawLinks,
    removedCount: Array.from(
      contentHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
      (match) => cleanText(match[1])
    ).filter((href) => MEMBER_SITE_LINK_REMOVALS.has(href)).length,
  };
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

export async function MirroredPage({
  page,
  heroHomeConfig = null,
  homeHeroTextConfig = null,
  homeHeroContentConfig = null,
  homePanelsConfig = null,
  homeValueStripConfig = null,
  searchParams = {},
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user);

  const homeRoute = page.route === "/" && page.kind === "mirror-page";
  const joinHref =
    utilityNav.find((item) => item.label.toLowerCase().includes("join"))?.href ||
    "/join-nashville-musicians-association";
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
  const liveScalesPage = page.kind === "mirror-page" && page.route === "/live-scales-contracts-pension";
  const rehearsalHallPage = page.kind === "mirror-page" && page.route === "/free-rehearsal-hall";
  const benefitsHubPage = page.kind === "mirror-page" && page.route === "/benefits-union-members";
  const memberSiteLinksPage = page.kind === "mirror-page" && page.route === "/member-site-links";
  const findArtistPage = page.kind === "mirror-page" && page.route === "/find-an-artist-or-band";
  const magazinePage = page.kind === "mirror-page" && page.route === "/nashville-musician-magazine";
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
    if (r === "/find-an-artist-or-band") return "pg-find-artist";
    if (r === "/live-scales-contracts-pension") return "pg-scales-live";
    if (r === "/form-ls1-qa") return "pg-faq";
    if (r === "/afm-entertainment") return "pg-hub pg-afm-entertainment";
    if (r === "/what-sound-exchange") return "pg-video";
    if (r === "/nashville-musician-magazine") return "pg-magazine";
    if (r === "/members-only-directory") return "pg-directory";
    if (r === "/signatory-information") return "pg-info";
    if (r === "/terms-of-use" || r === "/privacy-policy") return "pg-legal";
    if (r === "/new-use-reuse") return "pg-form";
    if (r === "/scales-forms-agreements") return "pg-scales-forms";
    if (r.startsWith("/event/")) return "pg-event";
    if (r.startsWith("/musical-styles/") || r.startsWith("/user/")) return "pg-profile";
    if (
      /Contact Information:\s*<\/h2>/i.test(page.bodyHtml || "") &&
      /Personnel\s*\/\s*Instrumentation:\s*<\/h2>/i.test(page.bodyHtml || "")
    ) {
      return "pg-profile";
    }
    return "";
  })();
  const profilePage = pageTypeClass.includes("pg-profile");
  const newsEventItems = newsEventsRoute
    ? await listNewsEventsItems(1000, "/news-and-events")
    : [];
  const recordingSidebarBoxes = isMainRecordingPage ? await resolveSidebarBoxes("/recording") : null;
  const newsSidebarBoxes = newsEventsRoute ? await resolveSidebarBoxes("/news-and-events") : null;
  const signatorySidebarBoxes = signatoryPage
    ? await resolveSidebarBoxes("/signatory-information", "/news-and-events")
    : null;
  const findArtistSidebarBoxes = findArtistPage
    ? await resolveSidebarBoxes("/find-an-artist-or-band", "/recording")
    : null;
  const recordingContent = isMainRecordingPage
    ? extractRecordingContent(page.bodyHtml || "")
    : null;
  const recordingPageConfig = isMainRecordingPage
    ? await getRecordingPageConfig({
        mainHtml: recordingContent?.flowHtml || "",
        videoEmbedSrc: recordingContent?.videoEmbedSrc || "",
        thumbnailSrc: "",
        youtubeKicker: "YouTube video",
        videoHeadline: "Single song overdub scale",
      })
    : null;
  const recordingMainHtml = recordingPageConfig?.mainHtml
    ? `<div class="recording-flow">${recordingPageConfig.mainHtml}</div>`
    : "";
  const recordingSidebarBoxesVisible = isMainRecordingPage
    ? (recordingSidebarBoxes || []).filter(
        (box) => recordingPageConfig?.showSidebarCtas !== false || box.kind !== "cta_group"
      )
    : recordingSidebarBoxes;
  const scalesFormsLinks = scalesFormsPage ? await getScalesFormsLinksConfig() : null;
  const signatoryContentHtml = signatoryPage
    ? enhanceSignatoryArticleHtml(extractContentEncodedHtml(page.bodyHtml || ""))
    : "";
  const liveMusicParts = liveMusicPage ? extractLiveMusicHubParts() : null;
  const liveScalesContent = liveScalesPage ? extractLiveScalesContent(page.bodyHtml || "") : null;
  const rehearsalHallContent = rehearsalHallPage ? extractRehearsalHallContent(page.bodyHtml || "") : null;
  const benefitsHubContent = benefitsHubPage ? extractBenefitsHubContent(page.bodyHtml || "") : null;
  const memberSiteLinksContent = memberSiteLinksPage ? extractMemberSiteLinksContent(page.bodyHtml || "") : null;
  const persistedMemberSiteLinks = memberSiteLinksPage ? await listMemberSiteLinks() : null;
  const memberSiteLinksHeroConfig = memberSiteLinksPage ? await getMemberSiteLinksHeroConfig() : null;
  const memberSiteLinksIntroConfig = memberSiteLinksPage
    ? await getMemberSiteLinksIntroConfig({ html: memberSiteLinksContent?.introHtml || "" })
    : null;
  const memberSiteLinksInitialLinks = memberSiteLinksPage
    ? persistedMemberSiteLinks || []
    : null;

  const bodyHtml =
    isMainRecordingPage ||
    scalesFormsPage ||
    newUseReusePage ||
    signatoryPage ||
    liveMusicPage ||
    liveScalesPage ||
    rehearsalHallPage ||
    benefitsHubPage ||
    memberSiteLinksPage
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
            siteStats={siteStats}
            homePage={page}
            joinHref={joinHref}
            heroHomeConfig={heroHomeConfig}
            homeHeroTextConfig={homeHeroTextConfig}
            homeHeroContentConfig={homeHeroContentConfig}
            homePanelsConfig={homePanelsConfig}
            homeValueStripConfig={homeValueStripConfig}
          />
        ) : (
          <PageHeaderWithCallout
            route={page.route}
            title={page.title}
            description={computeMirrorPageDescription(page, {
              scalesFormsPage,
              hideHeaderSummary,
              isMainRecordingPage,
            })}
            titleAction={
              memberSiteLinksPage && isAdmin ? (
                <MemberSiteLinksCreateButton />
              ) : isMainRecordingPage && isAdmin && recordingPageConfig ? (
                <RecordingPageOptionsButton initialConfig={recordingPageConfig} />
              ) : null
            }
            hideCallout={isMainRecordingPage && recordingPageConfig?.showMemberNotices === false}
          />
        )}

        {page.kind === "mirror-page" && !homeRoute && isMainRecordingPage ? (
          <div className="recording-page recording-sidebar-layout">
            <div className="recording-body-grid">
              <div className="recording-video-area">
                {isAdmin && recordingPageConfig ? (
                  <RecordingPageAdmin initialConfig={recordingPageConfig} target="video">
                    {recordingPageConfig.videoEmbedSrc ? (
                      <RecordingVideo
                        embedSrc={recordingPageConfig.videoEmbedSrc}
                        thumbnailSrc={recordingPageConfig.thumbnailSrc}
                        youtubeKicker={recordingPageConfig.youtubeKicker}
                        captionTitle={recordingPageConfig.videoHeadline}
                      />
                    ) : (
                      <div className="recording-page-editable__empty">No recording video configured.</div>
                    )}
                  </RecordingPageAdmin>
                ) : recordingPageConfig?.videoEmbedSrc ? (
                  <RecordingVideo
                    embedSrc={recordingPageConfig.videoEmbedSrc}
                    thumbnailSrc={recordingPageConfig.thumbnailSrc}
                    youtubeKicker={recordingPageConfig.youtubeKicker}
                    captionTitle={recordingPageConfig.videoHeadline}
                  />
                ) : null}
              </div>
              <aside className="recording-sidebar">
                <RecordingSidebarPanel
                  boxes={recordingSidebarBoxesVisible}
                  pageRoute="/recording"
                  isAdmin={isAdmin}
                />
              </aside>
              {isAdmin && recordingPageConfig ? (
                <RecordingPageAdmin initialConfig={recordingPageConfig} target="main">
                  <section
                    className="page-content recording-content"
                    dangerouslySetInnerHTML={{ __html: recordingMainHtml }}
                  />
                </RecordingPageAdmin>
              ) : (
                <section
                  className="page-content recording-content"
                  dangerouslySetInnerHTML={{ __html: recordingMainHtml }}
                />
              )}
            </div>
          </div>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && scalesFormsPage ? (
          <section className="page-content scales-forms-links-page">
            <ScalesMasterDetail links={scalesFormsLinks} isAdmin={isAdmin} />
          </section>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && !isMainRecordingPage && !scalesFormsPage ? (
          newsEventsRoute ? (
            <div className={`recording-page recording-sidebar-layout news-events-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales recording-body-grid--news">
                <div className="recording-news-main">
                  {newsEventItems.length || isAdmin ? (
                    <NewsEventsFeed items={newsEventItems} isAdmin={isAdmin} />
                  ) : (
                    <section
                      className="page-content recording-content"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  )}
                </div>
                <aside className="recording-sidebar">
                  <RecordingSidebarPanel
                    boxes={newsSidebarBoxes}
                    pageRoute="/news-and-events"
                    isAdmin={isAdmin}
                  />
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
                  <RecordingSidebarPanel
                    boxes={signatorySidebarBoxes}
                    pageRoute="/signatory-information"
                    isAdmin={isAdmin}
                  />
                </aside>
              </div>
            </div>
          ) : liveScalesPage ? (
            <div className={`recording-page recording-sidebar-layout live-scales-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section className="page-content live-scales-content">
                  <div className="live-scales-shell">
                    {liveScalesContent?.leadHtml ? (
                      <div
                        className="live-scales-lead"
                        dangerouslySetInnerHTML={{ __html: liveScalesContent.leadHtml }}
                      />
                    ) : null}

                    {liveScalesContent?.noteHtml ? (
                      <div
                        className="live-scales-note"
                        dangerouslySetInnerHTML={{ __html: liveScalesContent.noteHtml }}
                      />
                    ) : null}

                    {liveScalesContent?.overviewItems?.length ? (
                      <section className="live-scales-section">
                        <div className="section-headline live-scales-section-headline">
                          <p className="eyebrow">Live Department Guide</p>
                          <h2>Which document do you need?</h2>
                        </div>
                        <div className="live-scales-overview-grid">
                          {liveScalesContent.overviewItems.map((item) => (
                            <article key={`${item.title}-${item.description}`} className="live-scales-overview-card">
                              <h3>{item.title}</h3>
                              <p>{item.description}</p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {liveScalesContent?.resources?.length ? (
                      <section className="live-scales-section">
                        <div className="section-headline live-scales-section-headline">
                          <p className="eyebrow">Downloads</p>
                          <h2>Forms and scale sheets</h2>
                        </div>
                        <div className="live-scales-resource-grid">
                          {liveScalesContent.resources.map((resource) => (
                            <a
                              key={resource.href}
                              className="live-scales-resource-card"
                              href={resource.href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="live-scales-resource-kicker">PDF Download</span>
                              <h3>{resource.title}</h3>
                              <p>{resource.summary}</p>
                              <span className="live-scales-resource-link">Open file</span>
                            </a>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                </section>
                <aside className="recording-sidebar live-scales-sidebar">
                  <div className="recording-contact-box">
                    <h3 className="recording-sidebar-heading">Live Department</h3>
                    <a href="tel:+16152449514" className="recording-phone">
                      615-244-9514
                    </a>
                    <p className="recording-contact-cta">Questions about live scales, contracts, or pension paperwork.</p>
                    <div className="recording-staff">
                      <div className="recording-staff-member">
                        <a href="mailto:michael@nashvillemusicians.org">Michael Minton</a>
                        <span>Live and Touring Department</span>
                      </div>
                    </div>
                  </div>

                  <div className="recording-cta-box">
                    <Link href="/form-ls1-qa" className="recording-cta-item">
                      <strong>LS-1 Q&amp;A</strong>
                      <span>Read the detailed guide to pension contribution questions.</span>
                    </Link>
                    <Link href="/gigs" className="recording-cta-item">
                      <strong>Gig Calendar</strong>
                      <span>See where Local 257 musicians are playing right now.</span>
                    </Link>
                    <Link href="/find-an-artist-or-band" className="recording-cta-item">
                      <strong>Find an Artist or Band</strong>
                      <span>Search member listings when you need players or a full group.</span>
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          ) : rehearsalHallPage ? (
            <div className={`recording-page recording-sidebar-layout rehearsal-hall-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section className="page-content rehearsal-hall-content">
                  <div className="rehearsal-hall-shell">
                    <section className="rehearsal-hall-hero">
                      <div className="rehearsal-hall-hero-copy">
                        <p className="eyebrow">Member Rehearsal Space</p>
                        <h2>Cooper Rehearsal Hall</h2>
                        <p>{rehearsalHallContent?.lead}</p>
                      </div>
                      <div className="rehearsal-hall-hero-media">
                        <Image
                          src="/sites/default/files/Media Root/IMG_6820.jpeg"
                          alt="Dissonation rehearsing in Cooper Rehearsal Hall"
                          fill
                          className="rehearsal-hall-hero-image"
                          sizes="(min-width: 860px) 40vw, 100vw"
                        />
                      </div>
                    </section>

                    <section className="rehearsal-hall-section">
                      <div className="section-headline rehearsal-hall-section-headline">
                        <p className="eyebrow">What You Get</p>
                        <h2>Room features built for real rehearsals</h2>
                      </div>
                      <div className="rehearsal-hall-feature-grid">
                        <article className="rehearsal-hall-feature-card">
                          <h3>Member access</h3>
                          <p>Free to all current Local 257 members.</p>
                        </article>
                        <article className="rehearsal-hall-feature-card">
                          <h3>Long booking window</h3>
                          <p>Available from 9 a.m. until 11 p.m. for working bands and projects.</p>
                        </article>
                        <article className="rehearsal-hall-feature-card">
                          <h3>Stage and lighting</h3>
                          <p>A real stage setup with lighting helps groups rehearse like the show matters.</p>
                        </article>
                        <article className="rehearsal-hall-feature-card">
                          <h3>P.A. and treatment</h3>
                          <p>Includes a P.A. with monitors and acoustical treatment in the room.</p>
                        </article>
                      </div>
                    </section>

                  </div>
                </section>
                <aside className="recording-sidebar rehearsal-hall-sidebar">
                  <div className="recording-contact-box">
                    <h3 className="recording-sidebar-heading">Book The Hall</h3>
                    <a href="tel:+16152449514" className="recording-phone">
                      615-244-9514
                    </a>
                    <p className="recording-contact-cta">Call and ask for Michael or Alona to reserve the room.</p>
                    <div className="recording-staff">
                      <div className="recording-staff-member">
                        <span>Hours</span>
                        <span>9 a.m. to 11 p.m.</span>
                      </div>
                      <div className="recording-staff-member">
                        <span>Eligibility</span>
                        <span>Current Local 257 members</span>
                      </div>
                    </div>
                  </div>

                  <div className="recording-callout recording-rate-callout rehearsal-hall-note">
                    <h3 className="recording-sidebar-heading">Good For</h3>
                    <p>Band rehearsals, stage prep, section run-throughs, and getting a room balance before the gig.</p>
                  </div>

                  <div className="recording-cta-box">
                    <Link href="/member-services" className="recording-cta-item">
                      <strong>Member Services</strong>
                      <span>See other practical services available through Local 257.</span>
                    </Link>
                    <Link href="/gigs" className="recording-cta-item">
                      <strong>Upcoming Gigs</strong>
                      <span>Check the calendar and see where members are working.</span>
                    </Link>
                    <Link href="/live-scales-contracts-pension" className="recording-cta-item">
                      <strong>Live Scales and Contracts</strong>
                      <span>Handle the paperwork after the rehearsal turns into a show.</span>
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          ) : benefitsHubPage ? (
            <div className={`recording-page recording-sidebar-layout benefits-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section className="page-content benefits-content">
                  <div className="benefits-shell">
                    <section className="benefits-hero">
                      <div className="benefits-hero-copy">
                        <p className="eyebrow">Member Benefits</p>
                        <h2>Benefits that actually help a working musician</h2>
                        <p>{benefitsHubContent?.lead}</p>
                      </div>
                      <div className="benefits-hero-mark">
                        <Image
                          src="/images/afm-epf-logo.png"
                          alt="AFM-EP Fund logo"
                          width={420}
                          height={260}
                          className="benefits-hero-logo"
                        />
                      </div>
                    </section>

                    <section className="benefits-section">
                      <div className="benefits-pillar-grid">
                        <article className="benefits-pillar-card">
                          <p className="benefits-pillar-kicker">Retirement</p>
                          <h3>Pension and long-term security</h3>
                          <p>
                            The AFM-EP Fund is one of the largest pension funds in the entertainment industry and
                            gives qualifying musicians a real path toward retirement benefits built from covered work.
                          </p>
                        </article>
                        <article className="benefits-pillar-card">
                          <p className="benefits-pillar-kicker">Protection</p>
                          <h3>Insurance built around real gear and real risk</h3>
                          <p>
                            Local 257 members can access instrument coverage, liability protection, and additional
                            health and life-related plans designed to match the realities of music work.
                          </p>
                          <div className="benefits-chip-list" role="list" aria-label="Insurance options">
                            {BENEFITS_INSURANCE_ITEMS.map((item) => (
                              <span key={item} className="benefits-chip">
                                {item}
                              </span>
                            ))}
                          </div>
                        </article>
                        <article className="benefits-pillar-card">
                          <p className="benefits-pillar-kicker">Savings</p>
                          <h3>Discounts and practical day-to-day support</h3>
                          <p>
                            Union Plus, credit union access, healthcare resources, and member tools give the union
                            relationship value well beyond the bandstand.
                          </p>
                        </article>
                      </div>
                    </section>

                    <section className="benefits-section">
                      <div className="section-headline benefits-section-headline">
                        <p className="eyebrow">Quick Access</p>
                        <h2>Open the programs and documents people actually use</h2>
                      </div>
                      <div className="benefits-resource-grid">
                        {BENEFITS_RESOURCE_LINKS.map((item) =>
                          item.external ? (
                            <a
                              key={item.href}
                              href={item.href}
                              className="benefits-resource-card"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="benefits-resource-kicker">Benefit Link</span>
                              <h3>{item.title}</h3>
                              <p>{item.summary}</p>
                              <span className="benefits-resource-link">Open resource</span>
                            </a>
                          ) : (
                            <Link key={item.href} href={item.href} className="benefits-resource-card">
                              <span className="benefits-resource-kicker">Benefit Link</span>
                              <h3>{item.title}</h3>
                              <p>{item.summary}</p>
                              <span className="benefits-resource-link">Open resource</span>
                            </Link>
                          )
                        )}
                      </div>
                    </section>
                  </div>
                </section>
                <aside className="recording-sidebar benefits-sidebar">
                  <div className="recording-contact-box">
                    <h3 className="recording-sidebar-heading">Need Help?</h3>
                    <a href="tel:+16152449514" className="recording-phone">
                      615-244-9514
                    </a>
                    <p className="recording-contact-cta">Call the Local 257 office for benefit questions, paperwork help, and program guidance.</p>
                    <div className="recording-staff">
                      <div className="recording-staff-member">
                        <span>Member support</span>
                        <span>Benefits, resources, and office assistance</span>
                      </div>
                    </div>
                  </div>

                  <div className="recording-callout recording-rate-callout benefits-sidebar-note">
                    <h3 className="recording-sidebar-heading">Worth Using</h3>
                    <p>These benefits are most valuable when members actually use them, not just know they exist.</p>
                  </div>

                  <div className="recording-cta-box">
                    <Link href="/free-rehearsal-hall" className="recording-cta-item">
                      <strong>Book The Rehearsal Hall</strong>
                      <span>Reserve the Cooper Rehearsal Hall as a current member.</span>
                    </Link>
                    <Link href="/member-site-links" className="recording-cta-item">
                      <strong>Member Site Links</strong>
                      <span>Jump to practical resources and member-facing tools.</span>
                    </Link>
                    <Link href="/union-plus-program" className="recording-cta-item">
                      <strong>Union Plus Program</strong>
                      <span>See additional discounts, savings, and member offers.</span>
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          ) : memberSiteLinksPage ? (
            <div className={`recording-page recording-sidebar-layout member-links-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section className="page-content member-links-content">
                  <div className="member-links-shell">
                    {isAdmin ? (
                      <MemberSiteLinksHeroAdmin initialConfig={memberSiteLinksHeroConfig}>
                        <section className="member-links-hero">
                          <div className="member-links-hero-copy">
                            <p className="eyebrow" data-member-links-hero-eyebrow>
                              {memberSiteLinksHeroConfig?.eyebrow}
                            </p>
                            <h2 data-member-links-hero-title>{memberSiteLinksHeroConfig?.title}</h2>
                            <p data-member-links-hero-body>{memberSiteLinksHeroConfig?.body}</p>
                          </div>
                          <div className="member-links-stat-card">
                            <span className="member-links-stat-value">{memberSiteLinksInitialLinks?.length || 0}</span>
                            <span className="member-links-stat-label" data-member-links-stat-label>
                              {memberSiteLinksHeroConfig?.statLabel}
                            </span>
                            <p data-member-links-stat-body>{memberSiteLinksHeroConfig?.statBody}</p>
                          </div>
                        </section>
                      </MemberSiteLinksHeroAdmin>
                    ) : (
                      <section className="member-links-hero">
                        <div className="member-links-hero-copy">
                          <p className="eyebrow" data-member-links-hero-eyebrow>
                            {memberSiteLinksHeroConfig?.eyebrow}
                          </p>
                          <h2 data-member-links-hero-title>{memberSiteLinksHeroConfig?.title}</h2>
                          <p data-member-links-hero-body>{memberSiteLinksHeroConfig?.body}</p>
                        </div>
                        <div className="member-links-stat-card">
                          <span className="member-links-stat-value">{memberSiteLinksInitialLinks?.length || 0}</span>
                          <span className="member-links-stat-label" data-member-links-stat-label>
                            {memberSiteLinksHeroConfig?.statLabel}
                          </span>
                          <p data-member-links-stat-body>{memberSiteLinksHeroConfig?.statBody}</p>
                        </div>
                      </section>
                    )}

                    <section className="member-links-section">
                      {memberSiteLinksIntroConfig?.html ? (
                        <div className={`member-links-intro-shell${isAdmin ? " member-links-intro-shell--admin-editable" : ""}`}>
                          <div
                            className="member-links-intro"
                            data-member-links-intro
                            dangerouslySetInnerHTML={{ __html: memberSiteLinksIntroConfig.html }}
                          />
                          {isAdmin ? (
                            <MemberSiteLinksIntroAdmin defaultHtml={memberSiteLinksContent?.introHtml || ""} />
                          ) : null}
                        </div>
                      ) : null}

                      <MemberSiteLinksDirectory
                        initialLinks={memberSiteLinksInitialLinks || []}
                        isAdmin={isAdmin}
                      />
                    </section>
                  </div>
                </section>
                <aside className="recording-sidebar member-links-sidebar">
                  <div className="recording-callout recording-rate-callout member-links-sidebar-note">
                    <h3 className="recording-sidebar-heading">Public Profiles</h3>
                    <p>Need current profile listings instead of older standalone websites? Start with the public member pages.</p>
                  </div>

                  <div className="recording-cta-box">
                    <Link href="/member-pages" className="recording-cta-item">
                      <strong>Member Profile Pages</strong>
                      <span>Browse the current public member profiles on this site.</span>
                    </Link>
                    <Link href="/find-an-artist-or-band" className="recording-cta-item">
                      <strong>Find An Artist or Band</strong>
                      <span>Search performers, bands, and instrumentation listings.</span>
                    </Link>
                    <Link href="/benefits-union-members" className="recording-cta-item">
                      <strong>Member Benefits</strong>
                      <span>Explore benefits, discounts, and other union support.</span>
                    </Link>
                    <Link href="/free-rehearsal-hall" className="recording-cta-item">
                      <strong>Free Rehearsal Hall</strong>
                      <span>Reserve the Cooper Rehearsal Hall as a current member.</span>
                    </Link>
                  </div>
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
          ) : findArtistPage ? (
            <div className={`recording-page recording-sidebar-layout find-artist-sidebar-layout ${pageTypeClass}`}>
              <div className="recording-body-grid recording-body-grid--scales">
                <section
                  className="recording-content find-artist-main"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
                <FindArtistEnhancer />
                <aside className="recording-sidebar">
                  <RecordingSidebarPanel
                    boxes={findArtistSidebarBoxes}
                    pageRoute="/find-an-artist-or-band"
                    isAdmin={isAdmin}
                  />
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
              ) : pageTypeClass.includes("pg-faq") ? (
                <>
                  <FaqSearch targetId="faq-search-target" />
                  <section
                    id="faq-search-target"
                    className="page-content"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                </>
              ) : (
                <section
                  className={`page-content ${recordingRoute ? "recording-content" : ""}`}
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              )}
              {profilePage ? <ProfilePageEnhancer /> : null}
              {page.pageAssets?.length && !eventDetailRoute && !recordingRoute && !profilePage && !magazinePage ? (
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
