import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArtistBandProfileEditor } from "../../../components/artist-band-profile-editor";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { ProfileShowcase } from "../../../components/profile-showcase";
import { authOptions } from "../../../lib/auth-options";
import { canEditMemberPage, isAdminUser } from "../../../lib/authz";
import { decodeHtmlEntities } from "../../../lib/decode-html-entities.js";
import {
  normalizeLikelyExternalHref,
  resolveMemberWebsiteHref,
} from "../../../lib/legacy-site-url.js";
import { getMemberProfileBySlug } from "../../../lib/member-profiles";
import { siteMeta } from "../../../lib/site-data";

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function plainTextFromHtml(value) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function normalizeMemberLinks(member) {
  const websiteUrl = normalizeLikelyExternalHref(member.websiteUrl);
  const facebookUrl = normalizeLikelyExternalHref(member.facebookUrl);
  const instagramUrl = normalizeLikelyExternalHref(member.reverbnationUrl);
  const xUrl = normalizeLikelyExternalHref(member.xUrl);
  const primaryLinks = [
    ...(hasText(websiteUrl) ? [{ label: "Website", url: websiteUrl }] : []),
    ...(hasText(facebookUrl) ? [{ label: "Facebook", url: facebookUrl }] : []),
    ...(hasText(instagramUrl) ? [{ label: "Instagram", url: instagramUrl }] : []),
    ...(hasText(xUrl) ? [{ label: "X", url: xUrl }] : []),
    ...(Array.isArray(member.webLinks)
      ? member.webLinks.map((item) => ({
          label: item.label,
          url: normalizeLikelyExternalHref(item.url || item.href),
        }))
      : []),
  ];

  return primaryLinks
    .map((item) => {
      const resolved = resolveMemberWebsiteHref(item.url);
      if (!resolved?.href) return null;
      return {
        label: item.label || resolved.href,
        href: resolved.href,
        isExternal: !resolved.isInternal,
      };
    })
    .filter(Boolean);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const member = await getMemberProfileBySlug(resolvedParams?.slug);

  if (!member) {
    return {
      title: `Artist Profile Not Found | ${siteMeta.title}`,
    };
  }

  return {
    title: `${member.title} | Member Profile | ${siteMeta.title}`,
    description: plainTextFromHtml(member.descriptionHtml),
  };
}

export default async function MemberProfilePage({ params }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const member = await getMemberProfileBySlug(resolvedParams?.slug);

  if (!member) {
    notFound();
  }

  const canEdit = canEditMemberPage(session?.user, member);
  const canDelete = isAdminUser(session?.user);
  const title = decodeHtmlEntities(member.title);

  return (
    <article className="page-frame find-artist-profile-shell">
      <PageHeaderWithCallout
        route={`/users/${member.slug}`}
        title="Member Profile"
        description=""
        hideDescription
        disableHeaderEditing
        titleAction={
          canEdit ? (
            <ArtistBandProfileEditor
              profile={member}
              saveHref={`/api/member-profiles/${encodeURIComponent(member.slug)}`}
              uploadHref={`/api/member-profiles/${encodeURIComponent(member.slug)}/upload`}
              entityLabel="Member Profile"
              supportsPrimaryLinks
              deleteHref={`/api/member-profiles/${encodeURIComponent(member.slug)}`}
              canDelete={canDelete}
              deleteRedirectHref="/member-pages"
            />
          ) : null
        }
      />

      <ProfileShowcase
        title={title}
        imageUrl={member.pictureUrl}
        summary={plainTextFromHtml(member.descriptionHtml)}
        musicalStyles={member.musicalStyles}
        contactHtml={member.contactHtml}
        personnelHtml={member.personnelHtml}
        webLinks={normalizeMemberLinks(member)}
        featuredVideoUrl={member.featuredVideoUrl}
        featuredVideoTitle={member.featuredVideoTitle}
        backHref="/member-pages"
        backLabel="← Back to Member Pages"
      />
    </article>
  );
}
