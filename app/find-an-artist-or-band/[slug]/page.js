import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArtistBandProfileEditor } from "../../../components/artist-band-profile-editor";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { ProfileShowcase } from "../../../components/profile-showcase";
import { authOptions } from "../../../lib/auth-options";
import { isAdminSession } from "../../../lib/authz";
import { getArtistBandProfileBySlug } from "../../../lib/find-artist-directory.mjs";
import { getCardImage, getSummary } from "../../../lib/find-artist-directory-ui.js";
import { siteMeta } from "../../../lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const artist = await getArtistBandProfileBySlug(resolvedParams?.slug);

  if (!artist) {
    return {
      title: `Artist Profile Not Found | ${siteMeta.title}`,
    };
  }

  return {
    title: `${artist.title} | Find an Artist or Band | ${siteMeta.title}`,
    description: getSummary(artist),
  };
}

export default async function ArtistBandProfilePage({ params }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  const artist = await getArtistBandProfileBySlug(resolvedParams?.slug);

  if (!artist) {
    notFound();
  }

  const heroImage = getCardImage(artist);
  const profileRoute = `/find-an-artist-or-band/${artist.slug}`;

  return (
    <article className="page-frame find-artist-profile-shell">
      <PageHeaderWithCallout
        route={profileRoute}
        title="Artist Profile"
        description=""
        hideDescription
        disableHeaderEditing
        titleAction={
          isAdmin ? (
            <ArtistBandProfileEditor
              profile={artist}
              uploadHref={`/api/artist-band-profiles/${encodeURIComponent(artist.slug)}/upload`}
            />
          ) : null
        }
      />

      <ProfileShowcase
        title={artist.title}
        imageUrl={heroImage}
        summary={getSummary(artist)}
        musicalStyles={artist.musicalStyles}
        contactHtml={artist.contactHtml}
        personnelHtml={artist.personnelHtml}
        listingPersonnelHtml={artist.listingPersonnelHtml}
        webLinks={artist.webLinks}
        featuredVideoUrl={artist.featuredVideoUrl}
        featuredVideoTitle={artist.featuredVideoTitle}
        backHref="/find-an-artist-or-band"
        backLabel="← Back to Find an Artist or Band"
      />
    </article>
  );
}
