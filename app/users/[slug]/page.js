import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { MemberProfileEditor } from "../../../components/member-profile-editor";
import { MemberProfileMediaGallery } from "../../../components/member-profile-media-gallery";
import { PageHeaderWithCallout } from "../../../components/page-header-with-callout";
import { authOptions } from "../../../lib/auth-options";
import { canEditMemberPage, isAdminSession } from "../../../lib/authz";
import { decodeHtmlEntities } from "../../../lib/decode-html-entities.js";
import { resolveMemberWebsiteHref, rewriteLegacyNashvilleSiteInHtml } from "../../../lib/legacy-site-url.js";
import { INTERNAL_PAGE_DESCRIPTION } from "../../../lib/internal-page-description.js";
import { getMemberProfileBySlug } from "../../../lib/member-profiles";

function normalizeLink(href) {
  const resolved = resolveMemberWebsiteHref(href);
  if (!resolved?.href) return null;
  return resolved;
}

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function isYouTubeUrl(url = "") {
  return /(?:youtube\.com|youtu\.be)/i.test(String(url || ""));
}

function toYouTubeEmbed(url = "") {
  const value = String(url || "").trim();
  const match =
    value.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    value.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    value.match(/embed\/([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

function isDirectVideoUrl(url = "") {
  return /\.(mp4|m4v|webm|ogg|ogv)(?:[?#].*)?$/i.test(String(url || "").trim());
}

function isDirectAudioUrl(url = "", mimeType = "") {
  return /^audio\//i.test(String(mimeType || "")) || /\.(mp3|m4a|wav|aiff|aac|ogg)(?:[?#].*)?$/i.test(String(url || "").trim());
}

function renderExternalLink(item, className = "btn btn-ghost") {
  const resolved = normalizeLink(item?.url);
  const label = item?.label || item?.url || "";
  if (!resolved || !label) return null;
  if (resolved.isInternal) {
    return (
      <Link href={resolved.href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={resolved.href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}

function FactList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div className="member-fact-block">
      <h3>{title}</h3>
      <div className="member-tag-list">
        {items.map((item) => (
          <span key={`${title}-${item}`} className="member-tag">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function LinkListPanel({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div className="member-panel">
      <h2 className="panel-title">{title}</h2>
      <div className="member-link-list">
        {items.map((item, index) => {
          const node = renderExternalLink(item, "member-link-card");
          return node ? <div key={`${title}-${item.url || index}`}>{node}</div> : null;
        })}
      </div>
    </div>
  );
}

function FeaturedVideo({ title, url }) {
  if (!hasText(url)) return null;
  const embedUrl = isYouTubeUrl(url) ? toYouTubeEmbed(url) : "";
  return (
    <div className="member-panel">
      <h2 className="panel-title">Featured Video</h2>
      <div className="member-featured-video">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || "Featured member video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isDirectVideoUrl(url) ? (
          <video controls preload="metadata" src={url} />
        ) : (
          renderExternalLink({ label: title || "Watch video", url }, "btn btn-primary")
        )}
      </div>
      {hasText(title) ? <p className="member-caption">{title}</p> : null}
    </div>
  );
}

function AudioPanel({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="member-panel member-panel--wide">
      <h2 className="panel-title">Audio</h2>
      <div className="member-audio-list">
        {items.map((item, index) => (
          <div key={`${item.url}-${index}`} className="member-audio-card">
            <div className="member-audio-card__head">
              <strong>{item.label || `Audio ${index + 1}`}</strong>
              {renderExternalLink({ label: "Open", url: item.url }, "btn btn-ghost")}
            </div>
            {isDirectAudioUrl(item.url, item.mimeType) ? <audio controls preload="none" src={item.url} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MemberProfilePage({ params }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const member = await getMemberProfileBySlug(resolvedParams?.slug);

  if (!member) {
    notFound();
  }

  const primaryWebsite = normalizeLink(member.websiteUrl || member.canonicalUrl);
  const canEdit = canEditMemberPage(session?.user, member);
  const canDelete = isAdminSession(session);
  const primaryFacts = [member.firstName, member.lastName].filter(Boolean);
  const workDesired = [
    ...(Array.isArray(member.workDesired) ? member.workDesired : []),
    ...(hasText(member.workDesiredOther) ? [member.workDesiredOther] : []),
  ];
  const additionalSkills = [
    ...(Array.isArray(member.additionalSkills) ? member.additionalSkills : []),
    ...(hasText(member.additionalSkillsOther) ? [member.additionalSkillsOther] : []),
  ];
  const chartSkills = [
    ...(member.numberChartRead ? ["Reads number charts"] : []),
    ...(member.numberChartWrite ? ["Writes number charts"] : []),
    ...(member.chordChartRead ? ["Reads chord charts"] : []),
    ...(member.chordChartWrite ? ["Writes chord charts"] : []),
    ...(member.hasHomeStudio ? ["Home studio"] : []),
    ...(member.isEngineer ? ["Engineer"] : []),
  ];
  const publicLinks = [
    ...(hasText(member.websiteUrl) ? [{ label: "Website", url: member.websiteUrl }] : []),
    ...(hasText(member.facebookUrl) ? [{ label: "Facebook", url: member.facebookUrl }] : []),
    ...(hasText(member.reverbnationUrl) ? [{ label: "ReverbNation", url: member.reverbnationUrl }] : []),
    ...member.webLinks,
  ];

  return (
    <article className="page-frame member-profile-shell">
      <PageHeaderWithCallout
        route={`/users/${member.slug}`}
        title={decodeHtmlEntities(member.title)}
        description={INTERNAL_PAGE_DESCRIPTION.MEMBER_PROFILE}
        hideCallout
        trailing={
          <div className="member-profile__header-actions">
            {canEdit ? <MemberProfileEditor profile={member} canDelete={canDelete} /> : null}
            <Link href={`/user/${member.slug}/contact`} className="btn btn-primary">
              Contact
            </Link>
            {primaryWebsite ? (
              primaryWebsite.isInternal ? (
                <Link href={primaryWebsite.href} className="btn btn-ghost">
                  Website
                </Link>
              ) : (
                <a href={primaryWebsite.href} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  Website
                </a>
              )
            ) : null}
          </div>
        }
      />

      <section className="member-profile__grid">
        <div className="member-panel member-panel--wide member-profile-hero">
          {hasText(member.pictureUrl) ? (
            <div className="member-profile-hero__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.pictureUrl} alt={member.title || "Member profile"} loading="lazy" />
            </div>
          ) : null}
          <div className="member-profile-hero__body">
            {primaryFacts.length ? <p className="member-profile-hero__eyebrow">{primaryFacts.join(" ")}</p> : null}
            <h2 className="member-profile-hero__title">{decodeHtmlEntities(member.title)}</h2>
            {hasText(member.additionalInstrumentsText) ? <p className="member-profile-hero__subcopy">{member.additionalInstrumentsText}</p> : null}
            <div className="member-profile-hero__facts">
              <FactList title="Primary Instruments" items={member.primaryInstruments} />
              <FactList title="Musical Styles" items={member.musicalStyles} />
              <FactList title="Work Desired" items={workDesired} />
              <FactList title="Additional Skills" items={additionalSkills} />
              <FactList title="Capabilities" items={chartSkills} />
            </div>
          </div>
        </div>

        <div className="member-panel">
          <h2 className="panel-title">Overview</h2>
          {member.descriptionHtml ? (
            <div
              className="richtext"
              dangerouslySetInnerHTML={{
                __html: rewriteLegacyNashvilleSiteInHtml(member.descriptionHtml),
              }}
            />
          ) : (
            <p className="muted">No overview provided.</p>
          )}
        </div>

        <div className="member-panel">
          <h2 className="panel-title">Personnel / Instrumentation</h2>
          {member.personnelHtml ? (
            <div
              className="richtext"
              dangerouslySetInnerHTML={{
                __html: rewriteLegacyNashvilleSiteInHtml(member.personnelHtml),
              }}
            />
          ) : (
            <p className="muted">No instrumentation listed.</p>
          )}
        </div>

        <div className="member-panel member-panel--wide">
          <h2 className="panel-title">Details</h2>
          {member.bodyHtml ? (
            <div
              className="richtext"
              dangerouslySetInnerHTML={{
                __html: rewriteLegacyNashvilleSiteInHtml(member.bodyHtml),
              }}
            />
          ) : (
            <p className="muted">No additional details.</p>
          )}
        </div>

        {member.contactHtml ? (
          <div className="member-panel">
            <h2 className="panel-title">Contact Information</h2>
            <div
              className="richtext"
              dangerouslySetInnerHTML={{
                __html: rewriteLegacyNashvilleSiteInHtml(member.contactHtml),
              }}
            />
          </div>
        ) : null}

        <LinkListPanel title="Links" items={publicLinks} />
        <LinkListPanel title="Legacy Video Links" items={member.legacyVideoLinks} />
        <FeaturedVideo title={member.featuredVideoTitle} url={member.featuredVideoUrl} />
        <AudioPanel items={member.audioLinks} />
      </section>

      <MemberProfileMediaGallery items={member.media} />
    </article>
  );
}
