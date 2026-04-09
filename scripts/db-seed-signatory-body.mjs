import "./load-env.mjs";
import { closeDb, getClient, dbPath } from "../lib/sqlite.mjs";

const SIGNATORY_ROUTE = "/signatory-information";

/** Keep in sync with `lib/signatory-html.mjs` SIGNATORY_CANONICAL_SOURCE_HTML. */
const SIGNATORY_CANONICAL_SOURCE_HTML = `
<h3>What does &quot;Signatory&quot; mean?</h3>
<p>A signatory is an employer who has agreed to work with the union and has an agreement on file with the AFM or Local 257. Master recordings must use either the <a href="/_downloaded/sites/default/files/SRLALetter%20of%20Acceptance%20031323013126Rev0313.pdf">AFM Letter of Acceptance</a>, or the <a href="/_downloaded/sites/default/files/SRLA%20Single%20Project%20Short%20Form%20Rev03%2013%202023_0.pdf">AFM Single Project Short Form</a>. The AFM Letter of Acceptance requires a one-time payment of $100 and the fee goes to the Music Performance Trust Fund. The Single Project Short Form is free, but must be filed for each new project the employer does. A full signatory AFM employer will have to periodically report sales to the AFM, but will not be liable for any Special Payments Contributions until the record sells upwards of 30,000 units. The <a href="/_downloaded/sites/default/files/LimitedPressingAgreement2023.pdf">Local 257 Limited Pressing Agreement</a> is free and is designed for independent and custom projects.</p>
<p>All union sessions must have a signatory when the paperwork is filed. Demo contracts require that the timecard be signed at the bottom by a company representative. This ensures that the players will be paid in a timely manner and a pension payment will be made on each player&apos;s behalf. The Local 257 Recording Department has all the forms that you need and will provide them for you free of charge, of course.</p>
<h3>Why should you become an AFM signatory?</h3>
<p>Becoming a signatory enables the musicians who work for you to be properly compensated and receive the proper AFM Pension credit. It also protects you by carefully documenting all payments made so there is no confusion about who has been paid and how much. ALL recording agreements except demo REQUIRE a signatory before Pension contributions can be made and a contract properly executed. On a demo contract the employer MUST sign the bottom of the time card, which contains the demo agreement language on the back side if there are any questions. Remember, you cannot release a demo without becoming a signatory to one or more of our Agreements, such as Limited Pressing or Phono. Contact Heather at the Local 257 recording department at 615-244-9514 x 118 to find out more.</p>
`.trim();

const client = getClient();

const rs = await client.execute({
  sql: `SELECT route FROM site_pages WHERE route = ? LIMIT 1`,
  args: [SIGNATORY_ROUTE],
});

if (!rs.rows?.length) {
  console.error(`No site_pages row for ${SIGNATORY_ROUTE}. Run db:sync:site-pages first.`);
  process.exitCode = 1;
} else {
  await client.execute({
    sql: `UPDATE site_pages SET body_html = ?, updated_at = datetime('now') WHERE route = ?`,
    args: [SIGNATORY_CANONICAL_SOURCE_HTML, SIGNATORY_ROUTE],
  });
  console.log(`Updated ${SIGNATORY_ROUTE} body_html with canonical HTML (${dbPath}).`);
}

await closeDb();
