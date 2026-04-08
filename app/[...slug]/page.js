import { notFound } from "next/navigation";
import { MirroredPage } from "../../components/mirrored-page";
import {
  fetchMirrorPageContentRow,
  mergeMirrorPageFromDb,
} from "../../lib/mirror-page-content.mjs";
import { findPageByRoute, normalizeRouteFromSegments, pages, siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

function sanitizeMirroredPage(page) {
  if (!page) return page;
  if (page.route !== "/signatory-information") return page;
  return {
    ...page,
    summary: "Signatory and employer information.",
    metaDescription: "Signatory and employer information.",
  };
}

export function generateStaticParams() {
  return pages
    .filter((page) => page.route !== "/")
    .map((page) => ({
      slug: page.route.replace(/^\/+/, "").split("/"),
    }));
}

async function resolvePageForRoute(route) {
  const staticPage = findPageByRoute(route);
  if (!staticPage || staticPage.kind !== "mirror-page") return staticPage;
  try {
    const row = await fetchMirrorPageContentRow(route);
    return sanitizeMirroredPage(mergeMirrorPageFromDb(staticPage, row));
  } catch (err) {
    console.error("[mirror_page_content] Turso read failed; using bundled site-data for", route, err);
    return sanitizeMirroredPage(staticPage);
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const route = normalizeRouteFromSegments(resolvedParams?.slug);
  const page = await resolvePageForRoute(route);

  if (!page) {
    return {
      title: siteMeta.title,
    };
  }

  return {
    title: route === "/" ? siteMeta.title : `${page.title} | ${siteMeta.title}`,
    description: page.metaDescription || page.summary || siteMeta.title,
  };
}

export default async function CatchAllPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const route = normalizeRouteFromSegments(resolvedParams?.slug);
  const page = await resolvePageForRoute(route);

  if (!page) {
    notFound();
  }

  return <MirroredPage page={page} searchParams={resolvedSearchParams} />;
}
