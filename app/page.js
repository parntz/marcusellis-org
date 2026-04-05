import { notFound } from "next/navigation";
import { MirroredPage } from "../components/mirrored-page";
import { findPageByRoute, siteMeta } from "../lib/site-data";
import { getHeroHomeConfig } from "../lib/site-config-hero";
import { getHomeHeroTextConfig } from "../lib/site-config-home-hero-text";

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

  const [heroHomeConfig, homeHeroTextConfig] = await Promise.all([
    getHeroHomeConfig(),
    getHomeHeroTextConfig(),
  ]);
  return (
    <MirroredPage
      page={page}
      heroHomeConfig={heroHomeConfig}
      homeHeroTextConfig={homeHeroTextConfig}
    />
  );
}
