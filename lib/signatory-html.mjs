import { extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export const SIGNATORY_INFORMATION_ROUTE = "/signatory-information";

/**
 * Default main-column HTML (no Drupal chrome). Boilerplate paragraphs removed; links point at mirrored assets.
 */
export const SIGNATORY_CANONICAL_SOURCE_HTML = `
<h3>What does &quot;Signatory&quot; mean?</h3>
<p>A signatory is an employer who has agreed to work with the union and has an agreement on file with the AFM or Local 257. Master recordings must use either the <a href="/_downloaded/sites/default/files/SRLALetter%20of%20Acceptance%20031323013126Rev0313.pdf">AFM Letter of Acceptance</a>, or the <a href="/_downloaded/sites/default/files/SRLA%20Single%20Project%20Short%20Form%20Rev03%2013%202023_0.pdf">AFM Single Project Short Form</a>. The AFM Letter of Acceptance requires a one-time payment of $100 and the fee goes to the Music Performance Trust Fund. The Single Project Short Form is free, but must be filed for each new project the employer does. A full signatory AFM employer will have to periodically report sales to the AFM, but will not be liable for any Special Payments Contributions until the record sells upwards of 30,000 units. The <a href="/_downloaded/sites/default/files/LimitedPressingAgreement2023.pdf">Local 257 Limited Pressing Agreement</a> is free and is designed for independent and custom projects.</p>
<p>All union sessions must have a signatory when the paperwork is filed. Demo contracts require that the timecard be signed at the bottom by a company representative. This ensures that the players will be paid in a timely manner and a pension payment will be made on each player&apos;s behalf. The Local 257 Recording Department has all the forms that you need and will provide them for you free of charge, of course.</p>
<h3>Why should you become an AFM signatory?</h3>
<p>Becoming a signatory enables the musicians who work for you to be properly compensated and receive the proper AFM Pension credit. It also protects you by carefully documenting all payments made so there is no confusion about who has been paid and how much. ALL recording agreements except demo REQUIRE a signatory before Pension contributions can be made and a contract properly executed. On a demo contract the employer MUST sign the bottom of the time card, which contains the demo agreement language on the back side if there are any questions. Remember, you cannot release a demo without becoming a signatory to one or more of our Agreements, such as Limited Pressing or Phono. Contact Heather at the Local 257 recording department at 615-244-9514 x 118 to find out more.</p>
`.trim();

/**
 * Drupal signatory export wraps almost everything in nested &lt;strong&gt;, &lt;em&gt;, &lt;font&gt;, &lt;span&gt;.
 * Strip those so body copy uses normal .page-content weight; keep p, headings, lists, links, tables.
 */
export function normalizeSignatoryBodyHtml(html) {
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

  out = out.replace(
    /<p\b[^>]*>\s*(?:<strong\b[^>]*>\s*)*Please refer to the Scale Summary for exact check amounts and the applicable rate sheets for exact scale amounts and terms\.\s*(?:<\/strong>\s*)*<\/p>/gi,
    ""
  );
  out = out.replace(
    /<p\b[^>]*>[\s\S]*?For a complete list of all AFM 257 forms, agreements and contracts, click(?:&nbsp;|\s)*<a\b[^>]*>here<\/a>\.\s*(?:<\/strong>\s*)*<\/p>/gi,
    ""
  );

  out = out.replace(/\s*style="[^"]*"/gi, "");
  out = out.replace(/\salign="[^"]*"/gi, "");

  return out;
}

/** Full-width intro + “What does Signatory mean?” heading; following copy flows in newspaper columns. */
export function enhanceSignatoryArticleHtml(html) {
  const trimmed = normalizeSignatoryBodyHtml(String(html || "").trim())
    .replace(
      /<p\b[^>]*>[\s\S]*?Please refer to the Scale Summary for exact check amounts and the applicable rate sheets for exact scale amounts and terms\.[\s\S]*?<\/p>/i,
      ""
    )
    .replace(
      /<p\b[^>]*>[\s\S]*?For a complete list of all AFM 257 forms, agreements and contracts, click[\s\S]*?<\/p>/i,
      ""
    )
    .trim();
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

export function getSignatorySourceFromPageBody(bodyHtml) {
  return normalizeSignatoryBodyHtml(extractDrupalContentEncodedHtml(bodyHtml || ""));
}

export function getSignatoryDisplayHtmlFromSource(sourceHtml) {
  return rewriteLegacyNashvilleSiteInHtml(enhanceSignatoryArticleHtml(sourceHtml || ""));
}
