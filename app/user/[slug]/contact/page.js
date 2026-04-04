import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeaderWithCallout } from "../../../../components/page-header-with-callout";
import { decodeHtmlEntities } from "../../../../lib/decode-html-entities.js";
import { INTERNAL_PAGE_DESCRIPTION } from "../../../../lib/internal-page-description.js";
import { rewriteLegacyNashvilleSiteInHtml } from "../../../../lib/legacy-site-url.js";
import { resolveMemberContactTarget } from "../../../../lib/member-contact-target.js";
import { hasDefaultInboxRecipients } from "../../../../lib/resend-mail.js";

function buildStatus(searchParams) {
  if (searchParams?.submitted === "1") {
    return {
      tone: "success",
      message: "Your message was sent.",
    };
  }

  if (searchParams?.error) {
    return {
      tone: "error",
      message: "Your message could not be sent. Please try again.",
    };
  }

  return null;
}

export default async function ContactMemberPage({ params, searchParams }) {
  const target = await resolveMemberContactTarget(params.slug);
  if (!target) notFound();

  const canSend = hasDefaultInboxRecipients();
  const status = buildStatus(searchParams);
  const title = decodeHtmlEntities(target.title);
  const profileHref = `/users/${target.memberSlug}`;
  const returnTo = `/user/${params.slug}/contact`;

  return (
    <article className="page-frame member-profile-shell">
      <PageHeaderWithCallout
        title={title}
        description={INTERNAL_PAGE_DESCRIPTION.CONTACT_MEMBER}
        trailing={
          <div className="member-profile__header-actions">
            <Link href={profileHref} className="btn btn-ghost">
              View Profile
            </Link>
          </div>
        }
      />

      <section className="member-profile__grid member-contact-layout">
        <section className="member-panel">
          <h2 className="panel-title">Contact Details</h2>
          {target.contactHtml ? (
            <div
              className="richtext"
              dangerouslySetInnerHTML={{
                __html: rewriteLegacyNashvilleSiteInHtml(target.contactHtml),
              }}
            />
          ) : (
            <p className="muted">No public contact details are listed.</p>
          )}
        </section>

        <section className="member-panel member-panel--wide">
          <h2 className="panel-title">Send Message</h2>

          {status ? (
            <p className={`form-status form-status--${status.tone}`}>{status.message}</p>
          ) : null}

          {canSend ? (
            <>
              <p className="member-contact-note">Your message will be delivered to the AFM Nashville inbox.</p>

              <form action="/api/forms/member-contact" method="post" className="member-contact-form">
                <input type="hidden" name="memberSlug" value={target.memberSlug} />
                <input type="hidden" name="returnTo" value={returnTo} />

                <label>
                  Your Name
                  <input type="text" name="name" required />
                </label>

                <label>
                  Your Email
                  <input type="email" name="mail" required />
                </label>

                <label>
                  Subject
                  <input type="text" name="subject" required maxLength="120" />
                </label>

                <label className="member-contact-form__message">
                  Message
                  <textarea name="message" rows="10" required />
                </label>

                <label className="member-contact-honeypot" aria-hidden="true">
                  Leave this field blank
                  <input type="text" name="url" tabIndex={-1} autoComplete="off" />
                </label>

                <div className="member-contact-form__actions">
                  <button type="submit" className="btn btn-primary">
                    Send Message
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p className="muted">Email sending is not configured yet.</p>
          )}
        </section>
      </section>
    </article>
  );
}
