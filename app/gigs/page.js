import { getServerSession } from "next-auth";
import { GigsList } from "../../components/gigs-list";
import { GigsManager } from "../../components/gigs-manager";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { authOptions } from "../../lib/auth-options";
import { listAllGigs, listUpcomingGigs } from "../../lib/gigs";
import { siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Upcoming Gigs | ${siteMeta.title}`,
  description: "Upcoming performances, where they are happening, who is on the bill, and how to get there.",
};

export default async function GigsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user);
  const [upcomingGigs, allGigs] = await Promise.all([
    listUpcomingGigs(150),
    isAdmin ? listAllGigs(250) : Promise.resolve([]),
  ]);

  return (
    <article className="page-frame gigs-shell pg-gigs">
      <PageHeaderWithCallout
        title="Upcoming Gigs"
        description="Where AFM Local 257 musicians are playing next, with schedules, venue details, maps, artists, and gig notes."
      />

      {isAdmin ? <GigsManager initialGigs={allGigs} /> : null}

      <GigsList gigs={upcomingGigs} />
    </article>
  );
}
