import { notFound } from "next/navigation";
import { MirroredPage } from "../../components/mirrored-page";
import { normalizeRouteFromSegments, siteMeta } from "../../lib/site-data";
import { getSitePageByRoute } from "../../lib/site-pages";

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

async function resolvePageForRoute(route) {
  const page = await getSitePageByRoute(route);
  return sanitizeMirroredPage(page);
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
