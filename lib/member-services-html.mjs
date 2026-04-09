import { cleanDrupalHtml, extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export const MEMBER_SERVICES_ROUTE = "/member-services";

export const MEMBER_SERVICES_DEFAULT_HUB_TITLE = "Member Services";

/** Default tagline paragraph (class preserved for hub typography). */
export const MEMBER_SERVICES_DEFAULT_TAGLINE_HTML = `<p class="member-services-hub-intro__tagline">Programs worth a full read—not a buried bullet</p>`;

/** Default body copy only (legacy: stored alone in site_pages.body_html before hub split). */
export const MEMBER_SERVICES_DEFAULT_SOURCE_HTML = `
<p>
  Local 257 is committed to offer our members a variety of meaningful services, including a group health
  care plan, discounts on auto and life insurance, access to the AFM&apos;s instrument insurance policy,
  free rehearsal hall and much more.
</p>
`.trim();

/** Full default intro HTML (tagline + body) for the rich-text field. */
export const MEMBER_SERVICES_DEFAULT_INTRO_HTML =
  `${MEMBER_SERVICES_DEFAULT_TAGLINE_HTML}\n${MEMBER_SERVICES_DEFAULT_SOURCE_HTML}`.trim();

/** HTML loaded into the rich-text editor (Drupal wrapper stripped when present). */
export function getMemberServicesSourceFromPageBody(bodyHtml) {
  const raw = String(bodyHtml || "").trim();
  if (!raw) return MEMBER_SERVICES_DEFAULT_SOURCE_HTML;

  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  const base = extracted || raw;
  return rewriteLegacyNashvilleSiteInHtml(base);
}

/** Sanitized intro HTML rendered in the hub left column. */
export function getMemberServicesIntroDisplayHtml(bodyHtml) {
  const raw = String(bodyHtml || "").trim();
  if (!raw) return MEMBER_SERVICES_DEFAULT_SOURCE_HTML;

  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  const base = extracted || raw;
  const cleaned = cleanDrupalHtml(rewriteLegacyNashvilleSiteInHtml(base)).trim();
  return cleaned || MEMBER_SERVICES_DEFAULT_SOURCE_HTML;
}
