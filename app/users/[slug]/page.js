import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { decodeHtmlEntities } from "../../../lib/decode-html-entities.js";
import { resolveMemberWebsiteHref, rewriteLegacyNashvilleSiteInHtml } from "../../../lib/legacy-site-url.js";
import { INTERNAL_PAGE_DESCRIPTION } from "../../../lib/internal-page-description.js";
import { getClient } from "../../../lib/sqlite.mjs";

async function fetchMember(slug) {
  const client = getClient();
  const { rows } = await client.execute({
    sql: `SELECT slug, title, canonical_url, contact_html, description_html, personnel_html, body_html
          FROM member_pages
          WHERE slug = ?
          LIMIT 1`,
    args: [slug],
  });
  return rows?.[0] || null;
}

export default async function MemberProfilePage({ params }) {
  const member = await fetchMember(params.slug);

  if (!member) {
    notFound();
  }

  const website = resolveMemberWebsiteHref(member.canonical_url);

  return (
    <article className="page-frame member-profile-shell">
      <PageHeaderWithCallout
        title={decodeHtmlEntities(member.title)}
        description={INTERNAL_PAGE_DESCRIPTION.MEMBER_PROFILE}
        trailing={
          <div className="member-profile__header-actions">
            <Link href={`/user/${member.slug}/contact`} className="btn btn-primary">
              Contact
            </Link>
            {website ? (
              website.isInternal ? (
                <Link href={website.href} className="btn btn-ghost">
                  Website
                </Link>
              ) : (
                <a href={website.href} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  Website
                </a>
              )
            ) : null}
          </div>
        }
      />

        <section className="member-profile__grid">
          <div className="member-panel">
            <h2 className="panel-title">Overview</h2>
            {member.description_html ? (
              <div
                className="richtext"
                dangerouslySetInnerHTML={{
                  __html: rewriteLegacyNashvilleSiteInHtml(member.description_html),
                }}
              />
            ) : (
              <p className="muted">No overview provided.</p>
            )}
          </div>

          <div className="member-panel">
            <h2 className="panel-title">Personnel / Instrumentation</h2>
            {member.personnel_html ? (
              <div
                className="richtext"
                dangerouslySetInnerHTML={{
                  __html: rewriteLegacyNashvilleSiteInHtml(member.personnel_html),
                }}
              />
            ) : (
              <p className="muted">No instrumentation listed.</p>
            )}
          </div>

          <div className="member-panel member-panel--wide">
            <h2 className="panel-title">Details</h2>
            {member.body_html ? (
              <div
                className="richtext"
                dangerouslySetInnerHTML={{
                  __html: rewriteLegacyNashvilleSiteInHtml(member.body_html),
                }}
              />
            ) : (
              <p className="muted">No additional details.</p>
            )}
          </div>
        </section>
    </article>
  );
}
