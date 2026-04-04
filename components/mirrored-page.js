import Link from "next/link";
import { AssetGallery } from "./asset-gallery";
import { Footer } from "./footer";
import { HomepageExperience } from "./homepage-experience";
import { NewsEventsFeed } from "./news-events-feed";
import { SiteHeader } from "./site-header";
import { RecordingVideo } from "./recording-video";
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
  cleaned = cleaned.replace(/(\s*\n){3,}/g, "\n");
  return cleaned;
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

function extractRecordingContent(bodyHtml) {
  let main = bodyHtml;

  main = main.replace(/\s+style="[^"]*"/gi, "");
  main = main.replace(/<ul>[\s\S]*?scales-forms-agreements[\s\S]*?<\/ul>/i, "");
  main = main.replace(/<h1>\s*Recording\s*<\/h1>/i, "");
  main = main.replace(/<h3[^>]*>\s*(?:&nbsp;|\s)*<\/h3>/gi, "");

  let videoEmbedSrc = "";
  const iframeMatch = main.match(/<iframe[\s\S]*?src="([^"]*)"[\s\S]*?<\/iframe>/i);
  if (iframeMatch) {
    videoEmbedSrc = iframeMatch[1];
    main = main.replace(/<p>\s*<iframe[\s\S]*?<\/iframe>\s*<\/p>/i, "");
  }

  let rateUpdateText = "";
  main = main.replace(/<h3[^>]*>([^<]|<(?!\/h3>))*<\/h3>/gi, (match) => {
    if (/SRLA/i.test(match)) {
      rateUpdateText = match.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      return "";
    }
    return /Click/i.test(match) ? "" : match;
  });

  const callIdx = main.indexOf("Call the Local 257");
  if (callIdx > -1) {
    const before = main.substring(0, callIdx);
    const lastDiv = before.lastIndexOf("<div");
    if (lastDiv > -1) main = main.substring(0, lastDiv);
  }

  main = main.replace(/<a><\/a>/g, "");
  main = main.replace(/<\/?div[^>]*>/gi, "");
  main = main.replace(/<p[^>]*>/gi, "<p>");
  main = main.replace(/<(?!\/?p>)[^>]+>/g, "");
  main = main.replace(/(?:^|\s)(?:Click|click)[^<]*(?=<|$)/g, "");
  main = main.replace(/(\s*\n){3,}/g, "\n");
  main = main.replace(/<p>\s*Please Note:[\s\S]*?<\/p>/i, "");

  return {
    videoEmbedSrc,
    rateUpdateText,
    flowHtml: `<div class="recording-flow">${main}</div>`,
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

export async function MirroredPage({ page, heroHomeConfig = null }) {
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
  const recordingContent = isMainRecordingPage
    ? extractRecordingContent(page.bodyHtml || "")
    : null;
  const scalesContent = scalesFormsPage ? transformScalesFormsContent(page.bodyHtml || "") : null;
  const rateUpdateText = (() => {
    if (recordingContent?.rateUpdateText) return recordingContent.rateUpdateText;
    if (!scalesFormsPage) return "";
    const recPage = pageMap["/recording"];
    if (!recPage?.bodyHtml) return "";
    const m = recPage.bodyHtml.match(/<h3[^>]*>([^<]|<(?!\/h3>))*SRLA([^<]|<(?!\/h3>))*<\/h3>/i);
    return m ? m[0].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : "";
  })();
  const bodyHtml =
    isMainRecordingPage || scalesFormsPage ? "" : getRouteBodyHtml(page.route, page.bodyHtml || "");

  return (
    <main className="page-shell">
      <SiteHeader />
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
          <header className="page-header">
            <h2 className="page-title">{page.title}</h2>
            {(() => {
              if (scalesFormsPage || hideHeaderSummary) return null;
              let summaryText = page.summary || "";
              const isBogus = /^Instrument Insurance/i.test(summaryText) || /^AFM-EP Fund/i.test(summaryText) || /finest recording/i.test(summaryText);
              if (isBogus || !summaryText) {
                summaryText = page.metaDescription && !/^Instrument|finest recording/i.test(page.metaDescription)
                  ? page.metaDescription : "";
              }
              if (!summaryText) return null;
              return <p className="page-summary">{summaryText}</p>;
            })()}
          </header>
        )}

        {page.kind === "mirror-page" && !homeRoute && isMainRecordingPage ? (
          <div className="recording-page">
            <div className="recording-body-grid">
              <div className="recording-video-area">
                {recordingContent?.videoEmbedSrc ? (
                  <RecordingVideo embedSrc={recordingContent.videoEmbedSrc} />
                ) : null}
              </div>
              <aside className="recording-sidebar">
                <div className="recording-contact-box">
                  <h3 className="recording-sidebar-heading">Recording Department</h3>
                  <a href="tel:+16152449514" className="recording-phone">
                    615-244-9514
                  </a>
                  <p className="recording-contact-cta">Call for more information</p>
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
                <Link href="/scales-forms-agreements" className="recording-callout recording-bforms-callout">
                  <h3 className="recording-bforms-title">B Forms</h3>
                  <p>
                    Blank AFM recording contracts available online. B-4 covers most
                    SRLA categories, B-5 for Demo sessions, B-9 for Limited Pressing.
                  </p>
                  <span className="recording-callout-link">
                    View under Scales, Forms &amp; Agreements &rarr;
                  </span>
                </Link>
                <div className="recording-cta-box">
                  <a
                    href="https://nashvillemusicians.org/sites/default/files/RECORDINGSCALESUMMARYSHEET0203%202025A.pdf"
                    className="recording-cta-item"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>Info Sheet</strong>
                    <span>Summarizing all recording scales</span>
                  </a>
                  <Link href="/scales-forms-agreements" className="recording-cta-item">
                    <strong>Scales &amp; Agreements</strong>
                    <span>Recording scales, forms, and contract information</span>
                  </Link>
                </div>
              </aside>
              <section
                className="page-content recording-content"
                dangerouslySetInnerHTML={{ __html: recordingContent?.flowHtml || "" }}
              />
            </div>
          </div>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && scalesFormsPage ? (
          <div className="recording-page">
            <div className="recording-body-grid recording-body-grid--scales">
              <section className="recording-content">
                <div className="recording-accordion-stack">
                  {scalesContent?.sections?.map((section, idx) => (
                    <details key={`${section.title}-${idx}`} className="recording-accordion" open={idx === 0}>
                      <summary>
                        <span className="recording-accordion-label">{section.title}</span>
                        <span className="recording-accordion-caret" aria-hidden="true">
                          ▾
                        </span>
                      </summary>
                      <div
                        className="recording-accordion-body recording-flow"
                        dangerouslySetInnerHTML={{ __html: section.body }}
                      />
                    </details>
                  ))}
                </div>

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
                    B-4 (SRLA), B-5 (Demo), and B-9 (Limited Pressing) fillable PDFs live below in the accordion.
                  </p>
                  <span className="recording-callout-link">Open B Forms section ↓</span>
                </Link>
              </aside>
            </div>
          </div>
        ) : null}

        {page.kind === "mirror-page" && !homeRoute && !isMainRecordingPage && !scalesFormsPage ? (
          <div className={`page-columns ${recordingRoute ? "recording-columns" : ""} ${pageTypeClass}`}>
            {newsEventsRoute && newsEventItems.length ? (
              <NewsEventsFeed items={newsEventItems} />
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
        ) : null}

        {page.kind === "asset-index" ? <AssetIndex page={page} /> : null}
        {page.kind === "asset-group" ? (
          <AssetGallery title={page.title} assets={page.assets} />
        ) : null}
      </article>
      <Footer />
    </main>
  );
}
