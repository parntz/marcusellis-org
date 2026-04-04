import { notFound } from "next/navigation";
import { MirroredPage } from "../../components/mirrored-page";
import { findPageByRoute, normalizeRouteFromSegments, pages, siteMeta } from "../../lib/site-data";

export function generateStaticParams() {
  return pages
    .filter((page) => page.route !== "/")
    .map((page) => ({
      slug: page.route.replace(/^\/+/, "").split("/"),
    }));
}

export function generateMetadata({ params }) {
  const route = normalizeRouteFromSegments(params.slug);
  const page = findPageByRoute(route);

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

export default function CatchAllPage({ params }) {
  const route = normalizeRouteFromSegments(params.slug);
  const page = findPageByRoute(route);

  if (!page) {
    notFound();
  }

  return <MirroredPage page={page} />;
}
