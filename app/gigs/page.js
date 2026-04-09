import { getServerSession } from "next-auth";
import { GigsList } from "../../components/gigs-list";
import { GigsCreateButton } from "../../components/gigs-create-button";
import { GigsManager } from "../../components/gigs-manager";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { RecordingSidebarPanel } from "../../components/recording-sidebar-panel";
import { authOptions } from "../../lib/auth-options";
import { isAdminSession } from "../../lib/authz";
import { listUpcomingGigs } from "../../lib/gigs";
import { resolveSidebarBoxes } from "../../lib/resolve-sidebar-boxes.mjs";
import { getRouteSidebarConfig } from "../../lib/site-config-route-sidebar";
import { getSidebarWidthConfig } from "../../lib/site-config-sidebar-width";
import { siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Upcoming Gigs | ${siteMeta.title}`,
  description: "Upcoming performances, where they are happening, who is on the bill, and how to get there.",
};

export default async function GigsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  const routeSidebarConfig = await getRouteSidebarConfig("/gigs");
  const sidebarWidthConfig = await getSidebarWidthConfig();
  const routeSidebarEnabled = Boolean(routeSidebarConfig?.enabled);
  const routeSidebarStyle = routeSidebarEnabled
    ? { "--recording-sidebar-width": `${sidebarWidthConfig?.widthPx ?? 350}px` }
    : undefined;
  const [upcomingGigs, gigsSidebarBoxes] = await Promise.all([
    listUpcomingGigs(150),
    routeSidebarEnabled ? resolveSidebarBoxes("/gigs") : Promise.resolve([]),
  ]);

  return (
    <article className="page-frame gigs-shell pg-gigs news-events-sidebar-layout">
      <PageHeaderWithCallout
        route="/gigs"
        title="Upcoming Gigs"
        description="Where AFM Local 257 musicians are playing next, with schedules, venue details, maps, artists, and gig notes."
        titleAction={isAdmin ? <GigsCreateButton /> : null}
      />

      <div className="recording-page recording-sidebar-layout" style={routeSidebarStyle}>
        <div className="recording-body-grid recording-body-grid--scales">
          <div className="recording-content">
            {isAdmin ? <GigsManager initialGigs={upcomingGigs} /> : <GigsList gigs={upcomingGigs} />}
          </div>
          {routeSidebarEnabled ? (
            <aside className="recording-sidebar" style={routeSidebarStyle}>
              <RecordingSidebarPanel
                boxes={gigsSidebarBoxes}
                pageRoute="/gigs"
                isAdmin={isAdmin}
                initialWidthStep={sidebarWidthConfig?.widthStep}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
