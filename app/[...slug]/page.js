import { notFound, redirect } from "next/navigation";
import { MirroredPage } from "../../components/mirrored-page";
import { normalizeRouteFromSegments, siteMeta } from "../../lib/site-data";
import { getSitePageByRoute } from "../../lib/site-pages";
import { getFeaturedVideoPageConfig } from "../../lib/site-config-featured-video";

export const dynamic = "force-dynamic";

const FEATURED_VIDEO_ROUTE = "/featured-video";
const LEGACY_FEATURED_VIDEO_ROUTE = "/what-sound-exchange";

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
  const dbRoute = route === FEATURED_VIDEO_ROUTE ? LEGACY_FEATURED_VIDEO_ROUTE : route;
  const page = await getSitePageByRoute(dbRoute);
  if (!page) return page;
  if (route !== FEATURED_VIDEO_ROUTE) return sanitizeMirroredPage(page);
  return sanitizeMirroredPage({
    ...page,
    route: FEATURED_VIDEO_ROUTE,
  });
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const route = normalizeRouteFromSegments(resolvedParams?.slug);
  if (route === LEGACY_FEATURED_VIDEO_ROUTE) {
    redirect(FEATURED_VIDEO_ROUTE);
  }
  const page = await resolvePageForRoute(route);

  if (!page) {
    return {
      title: siteMeta.title,
    };
  }

  if (route === FEATURED_VIDEO_ROUTE) {
    const featuredVideoConfig = await getFeaturedVideoPageConfig();
    return {
      title: `${featuredVideoConfig.pageTitle || page.title} | ${siteMeta.title}`,
      description: featuredVideoConfig.pageDescription || page.metaDescription || page.summary || siteMeta.title,
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
  if (route === LEGACY_FEATURED_VIDEO_ROUTE) {
    redirect(FEATURED_VIDEO_ROUTE);
  }
  const page = await resolvePageForRoute(route);

  if (!page) {
    notFound();
  }

  return <MirroredPage page={page} searchParams={resolvedSearchParams} />;
}
