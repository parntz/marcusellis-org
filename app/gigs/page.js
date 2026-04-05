import { getServerSession } from "next-auth";
import { GigsList } from "../../components/gigs-list";
import { GigsCreateButton } from "../../components/gigs-create-button";
import { GigsManager } from "../../components/gigs-manager";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { RecordingSidebarPanel } from "../../components/recording-sidebar-panel";
import { authOptions } from "../../lib/auth-options";
import { listUpcomingGigs } from "../../lib/gigs";
import { resolveSidebarBoxes } from "../../lib/resolve-sidebar-boxes.mjs";
import { siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Upcoming Gigs | ${siteMeta.title}`,
  description: "Upcoming performances, where they are happening, who is on the bill, and how to get there.",
};

export default async function GigsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user);
  const [upcomingGigs, gigsSidebarBoxes] = await Promise.all([
    listUpcomingGigs(150),
    resolveSidebarBoxes("/gigs", "/recording"),
  ]);

  return (
    <article className="page-frame gigs-shell pg-gigs news-events-sidebar-layout">
      <PageHeaderWithCallout
        title="Upcoming Gigs"
        description="Where AFM Local 257 musicians are playing next, with schedules, venue details, maps, artists, and gig notes."
        titleAction={isAdmin ? <GigsCreateButton /> : null}
      />

      <div className="recording-page recording-sidebar-layout">
        <div className="recording-body-grid recording-body-grid--scales">
          <div className="recording-content">
            {isAdmin ? <GigsManager initialGigs={upcomingGigs} /> : <GigsList gigs={upcomingGigs} />}
          </div>
          <aside className="recording-sidebar">
            <RecordingSidebarPanel boxes={gigsSidebarBoxes} pageRoute="/gigs" isAdmin={isAdmin} />
          </aside>
        </div>
      </div>
    </article>
  );
}
