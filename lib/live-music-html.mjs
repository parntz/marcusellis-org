import { cleanDrupalHtml, extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export const LIVE_MUSIC_ROUTE = "/live-music";

export const LIVE_MUSIC_CANONICAL_SOURCE_HTML = `
<p>
  Nashville is home to some of the greatest live music on earth. Our members &ldquo;play out&rdquo;
  every night of the week, and this is the place to find them, whether you are a local looking for
  something new or a tourist looking for that &ldquo;Nashville Moment&rdquo; and everything in between.
</p>
<p>
  If you want to hire a band, you are welcome to peruse our searchable musician and band listings.
  Click <a href="/find-an-artist-or-band">Find An Artist or Band</a> to learn more.
</p>
<p>
  If you are looking for live scales or contracts for live engagements, you can find them here as
  well.
</p>
`.trim();

const LIVE_MUSIC_LINKS = [
  {
    href: "/gigs",
    kicker: "01",
    title: "Gig Calendar",
    description: "Track where Local 257 players are on stage around town.",
  },
  {
    href: "/find-an-artist-or-band",
    kicker: "02",
    title: "Find an Artist or Band",
    description: "Search musicians, bands, styles, and instrumentation for bookings.",
  },
  {
    href: "/live-scales-contracts-pension",
    kicker: "03",
    title: "Live Scales, Contracts, Pension",
    description: "Rates, live forms, contract language, and pension paperwork.",
  },
  {
    href: "/afm-entertainment",
    kicker: "04",
    title: "AFM Entertainment",
    description: "Booking support and national union talent resources.",
  },
  {
    href: "/form-ls1-qa",
    kicker: "05",
    title: "Form LS1 Q&A",
    description: "Quick guidance for questions that come up around LS1 paperwork.",
  },
];

function normalizeLiveMusicSourceHtml(sourceHtml) {
  return rewriteLegacyNashvilleSiteInHtml(
    cleanDrupalHtml(String(sourceHtml || "").trim() || LIVE_MUSIC_CANONICAL_SOURCE_HTML)
  );
}

function splitLeadParagraph(html) {
  const normalized = String(html || "").trim();
  const leadMatch = normalized.match(/<p\b[^>]*>[\s\S]*?<\/p>/i);
  if (!leadMatch) {
    return {
      leadHtml: "",
      bodyHtml: normalized,
    };
  }

  const leadHtml = leadMatch[0].trim();
  const bodyHtml = normalized.replace(leadMatch[0], "").trim();
  return {
    leadHtml,
    bodyHtml,
  };
}

function renderLiveMusicLinksHtml() {
  return LIVE_MUSIC_LINKS.map(
    (link) => `
      <a class="news-events-item live-music-link-list__item" href="${link.href}">
        <div class="news-events-badge" aria-hidden>
          <span>LINK</span>
          <strong>${link.kicker}</strong>
        </div>
        <div class="news-events-content">
          <h3>${link.title}</h3>
          <p class="news-events-summary">${link.description}</p>
        </div>
      </a>
    `
  ).join("");
}

export function getLiveMusicSourceFromPageBody(bodyHtml) {
  const raw = String(bodyHtml || "").trim();
  if (!raw) return LIVE_MUSIC_CANONICAL_SOURCE_HTML;

  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  return rewriteLegacyNashvilleSiteInHtml(extracted || raw);
}

export function getLiveMusicDisplayHtmlFromSource(sourceHtml) {
  const normalized = normalizeLiveMusicSourceHtml(sourceHtml);
  const { bodyHtml } = splitLeadParagraph(normalized);

  return `
    <div class="live-music-feature">
      <div class="live-music-feature__layout">
        <nav class="live-music-link-section" aria-label="Live Music links">
          <p class="live-music-link-section__label">Start Here</p>
          <div class="news-events-list live-music-link-list">${renderLiveMusicLinksHtml()}</div>
        </nav>

        <div class="live-music-feature__body">
          <div class="live-music-feature__body-intro">
            <p class="live-music-feature__body-kicker">Live music resources</p>
            <h2 class="live-music-feature__body-title">Everything on this page points back to the stage.</h2>
          </div>
          <div class="live-music-article live-music-newspaper">
            ${
              bodyHtml ||
              `<p>If you want to hire a band, browse the searchable roster. If you need scales, forms, or contract help for live engagements, use the links alongside this page.</p>`
            }
          </div>
        </div>
      </div>
    </div>
  `.trim();
}
