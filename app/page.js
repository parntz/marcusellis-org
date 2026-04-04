import { notFound } from "next/navigation";
import { MirroredPage } from "../components/mirrored-page";
import { findPageByRoute, siteMeta } from "../lib/site-data";
import { getHeroHomeConfig } from "../lib/site-config-hero";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: siteMeta.title,
    description: siteMeta.kicker || siteMeta.title,
  };
}

export default async function HomePage() {
  const page = findPageByRoute("/");
  if (!page) {
    notFound();
  }

  const heroHomeConfig = await getHeroHomeConfig();
  return <MirroredPage page={page} heroHomeConfig={heroHomeConfig} />;
}
