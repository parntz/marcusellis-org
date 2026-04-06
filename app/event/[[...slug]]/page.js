import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { INTERNAL_PAGE_DESCRIPTION } from "../../../lib/internal-page-description.js";
import { getClient } from "../../../lib/sqlite.mjs";

async function fetchPage(route) {
  const client = getClient();
  const page = (
    await client.execute({
      sql: `SELECT route, title, summary, meta_description, body_html FROM news_event_pages WHERE route = ? LIMIT 1`,
      args: [route],
    })
  ).rows?.[0];

  const item = (
    await client.execute({
      sql: `SELECT badge_month, badge_day, event_date_text FROM news_events_items WHERE href = ? LIMIT 1`,
      args: [route],
    })
  ).rows?.[0];

  return { page, item };
}

export default async function EventDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];
  const route = `/event/${slug.join("/")}`;

  const { page, item } = await fetchPage(route);
  if (!page) {
    notFound();
  }

  const evDate = item?.event_date_text ?? item?.eventDateText;
  const detailDescription =
    [page.summary, evDate].filter(Boolean).join(" · ") || INTERNAL_PAGE_DESCRIPTION.EVENT_DETAIL;
  const badgeMonth = item?.badge_month ?? item?.badgeMonth;
  const badgeDay = item?.badge_day ?? item?.badgeDay;

  return (
    <article className="page-frame news-shell">
      <PageHeaderWithCallout
        route={route}
        kicker={
          badgeMonth || badgeDay ? (
            <div className="news-detail__eyebrow">
              {badgeMonth ? <span>{badgeMonth}</span> : null}
              {badgeDay ? <strong>{badgeDay}</strong> : null}
            </div>
          ) : null
        }
        title={page.title}
        description={detailDescription}
        trailing={
          <Link href="/news-and-events" className="text-link">
            ← Back to News &amp; Events
          </Link>
        }
      />

      <section className="page-content">
        <div className="richtext" dangerouslySetInnerHTML={{ __html: page.body_html }} />
      </section>
    </article>
  );
}
