import Link from "next/link";
import { getServerSession } from "next-auth";
import { MemberPagesDirectory } from "../../components/member-pages-directory";
import { PageHeaderWithCallout } from "../../components/page-header-with-callout";
import { RecordingSidebarPanel } from "../../components/recording-sidebar-panel";
import { authOptions } from "../../lib/auth-options";
import { isAdminSession } from "../../lib/authz";
import { decodeHtmlEntities, dedupeMembersByTitle } from "../../lib/decode-html-entities.js";
import { resolveMemberMediaHref, resolveMemberWebsiteHref } from "../../lib/legacy-site-url.js";
import { INTERNAL_PAGE_DESCRIPTION } from "../../lib/internal-page-description.js";
import { resolveSidebarBoxes } from "../../lib/resolve-sidebar-boxes.mjs";
import { getRouteSidebarConfig } from "../../lib/site-config-route-sidebar";
import { getClient } from "../../lib/sqlite.mjs";

export const dynamic = "force-dynamic";

function plainFromPersonnel(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function plainFromHtml(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function truncateSummary(value, maxLength = 180) {
  const plain = String(value || "").trim();
  if (!plain) return "";
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}...`;
}

function formatInstruments(personnelHtml) {
  const plain = plainFromPersonnel(personnelHtml);
  if (!plain) return [];
  return plain
    .split(/[,;/]/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 2 && item.length <= 48)
    .filter((item) => !/^https?:\/\//i.test(item))
    .slice(0, 8);
}

async function fetchMembers() {
  const client = getClient();
  const list = (
    await client.execute({
      sql: `SELECT slug, title, description_html, contact_html, personnel_html, canonical_url, picture_url
            FROM member_pages
            ORDER BY title ASC`,
    })
  ).rows;

  return dedupeMembersByTitle(list).map((member) => {
    const title = decodeHtmlEntities(member.title);
    const instruments = formatInstruments(member.personnel_html).map((item) => decodeHtmlEntities(item));
    const description = plainFromHtml(member.description_html);
    const contact = plainFromHtml(member.contact_html);
    const personnel = plainFromHtml(member.personnel_html);
    const website = resolveMemberWebsiteHref(member.canonical_url);
    const summary = truncateSummary(description || contact);

    return {
      slug: String(member.slug),
      title,
      instruments,
      summary,
      pictureUrl: resolveMemberMediaHref(String(member.picture_url || "").trim()),
      website: website
        ? {
            href: website.href,
            isInternal: Boolean(website.isInternal),
          }
        : null,
      searchText: [title, description, contact, personnel, member.canonical_url, member.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });
}

export default async function MemberPages() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  const routeSidebarEnabled = Boolean((await getRouteSidebarConfig("/member-pages"))?.enabled);
  const [members, memberPagesSidebarBoxes] = await Promise.all([
    fetchMembers(),
    routeSidebarEnabled ? resolveSidebarBoxes("/member-pages") : Promise.resolve([]),
  ]);

  return (
    <article className="page-frame member-pages-shell">
      <PageHeaderWithCallout
        route="/member-pages"
        title="Member profile directory"
        description={INTERNAL_PAGE_DESCRIPTION.MEMBER_PAGES}
      />

      <div className="recording-page recording-sidebar-layout">
        <div className="recording-body-grid recording-body-grid--scales">
          <div className="recording-content member-pages-main-column">
            <MemberPagesDirectory members={members} />
          </div>
          {routeSidebarEnabled ? (
            <aside className="recording-sidebar">
              <RecordingSidebarPanel
                boxes={memberPagesSidebarBoxes}
                pageRoute="/member-pages"
                isAdmin={isAdmin}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
