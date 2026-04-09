import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { NewsEventsCreateButton } from "../../../components/news-events-create-button";
import { NewsEventsFeed } from "../../../components/news-events-feed";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { RecordingSidebarPanel } from "../../../components/recording-sidebar-panel";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import { listNewsEventsItems } from "../../../lib/news-events-items";
import { resolveSidebarBoxes } from "../../../lib/resolve-sidebar-boxes.mjs";
import { INTERNAL_PAGE_DESCRIPTION } from "../../../lib/internal-page-description.js";
import { getRouteSidebarConfig } from "../../../lib/site-config-route-sidebar";
import { siteMeta } from "../../../lib/site-data";
import { getEditablePageHeader } from "../../../lib/page-header-editor";
import { rewriteLegacyNashvilleSiteInHtml } from "../../../lib/legacy-site-url.js";
import { getClient } from "../../../lib/sqlite.mjs";

export const dynamic = "force-dynamic";

function normalizeSlug(params) {
  const s = params?.slug;
  if (Array.isArray(s)) return s;
  if (s) return [s];
  return [];
}

async function fetchNewsDetailPage(route) {
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

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = normalizeSlug(resolvedParams);
  if (!slug.length) {
    return {
      title: `News & Events | ${siteMeta.title}`,
      description: siteMeta.kicker || siteMeta.title,
    };
  }
  const route = `/news-and-events/${slug.join("/")}`;
  const client = getClient();
  const row = (
    await client.execute({
      sql: `SELECT title, meta_description FROM news_event_pages WHERE route = ? LIMIT 1`,
      args: [route],
    })
  ).rows?.[0];
  if (!row?.title) {
    return { title: siteMeta.title };
  }
  return {
    title: `${row.title} | ${siteMeta.title}`,
    description: row.meta_description || row.title,
  };
}

export default async function NewsAndEventsPage({ params }) {
  const resolvedParams = await params;
  const slug = normalizeSlug(resolvedParams);
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);

  if (!slug.length) {
    const listRoute = "/news-and-events";
    const routeSidebarEnabled = Boolean((await getRouteSidebarConfig(listRoute))?.enabled);
    const newsSidebarBoxes = routeSidebarEnabled ? await resolveSidebarBoxes(listRoute) : [];
    const newsEventItems = await listNewsEventsItems(1000, "/news-and-events");
    const listHeader = await getEditablePageHeader("/news-and-events");
    const listTitle = listHeader?.title?.trim() || "News & Events";
    const listDescription =
      listHeader?.description?.trim() || INTERNAL_PAGE_DESCRIPTION.NEWS_EVENTS;
    return (
      <article className="page-frame news-shell pg-news-events">
        <PageHeaderWithCallout
          route="/news-and-events"
          title={listTitle}
          description={listDescription}
          titleAction={isAdmin ? <NewsEventsCreateButton /> : null}
        />

        <div className="recording-page recording-sidebar-layout news-events-sidebar-layout">
          <div className="recording-body-grid recording-body-grid--scales recording-body-grid--news">
            <div className="recording-news-main">
              {newsEventItems.length || isAdmin ? (
                <NewsEventsFeed items={newsEventItems} isAdmin={isAdmin} />
              ) : (
                <section className="page-content recording-content">
                  <p className="news-events-empty">No news or events are available yet.</p>
                </section>
              )}
            </div>
            {routeSidebarEnabled ? (
              <aside className="recording-sidebar">
                <RecordingSidebarPanel boxes={newsSidebarBoxes} pageRoute={listRoute} isAdmin={isAdmin} />
              </aside>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const route = `/news-and-events/${slug.join("/")}`;
  const { page, item } = await fetchNewsDetailPage(route);
  if (!page) {
    notFound();
  }

  const routeSidebarEnabled = Boolean((await getRouteSidebarConfig(route))?.enabled);
  const newsSidebarBoxes = routeSidebarEnabled ? await resolveSidebarBoxes(route) : [];

  const evDate = item?.event_date_text ?? item?.eventDateText;
  const detailDescription =
    [page.summary, evDate].filter(Boolean).join(" · ") || INTERNAL_PAGE_DESCRIPTION.NEWS_ARCHIVE_DETAIL;
  const badgeMonth = item?.badge_month ?? item?.badgeMonth;
  const badgeDay = item?.badge_day ?? item?.badgeDay;

  return (
    <article className="page-frame news-shell pg-news-events">
      <div className="recording-page recording-sidebar-layout news-events-sidebar-layout">
        <div className="recording-body-grid recording-body-grid--scales recording-body-grid--news">
          <div className="recording-news-main">
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
              <div className="richtext" dangerouslySetInnerHTML={{ __html: rewriteLegacyNashvilleSiteInHtml(page.body_html) }} />
            </section>
          </div>
          {routeSidebarEnabled ? (
            <aside className="recording-sidebar">
              <RecordingSidebarPanel boxes={newsSidebarBoxes} pageRoute={route} isAdmin={isAdmin} />
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
