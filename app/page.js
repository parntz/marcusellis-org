import { notFound } from "next/navigation";
import { MirroredPage } from "../components/mirrored-page";
import { siteMeta } from "../lib/site-data";
import { getSitePageByRoute } from "../lib/site-pages";
import { getHeroHomeConfig } from "../lib/site-config-hero";
import { getHomeHeroTextConfig } from "../lib/site-config-home-hero-text";
import { getHomeHeroContentConfig } from "../lib/site-config-home-hero-content";
import { getHomePanelsConfig } from "../lib/site-config-home-panels";
import { getHomeValueStripConfig } from "../lib/site-config-home-value-strip";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: siteMeta.title,
    description: siteMeta.kicker || siteMeta.title,
  };
}

export default async function HomePage() {
  const page = await getSitePageByRoute("/");
  if (!page) {
    notFound();
  }

  const [
    heroHomeConfig,
    homeHeroTextConfig,
    homeHeroContentConfig,
    homePanelsConfig,
    homeValueStripConfig,
  ] = await Promise.all([
    getHeroHomeConfig(),
    getHomeHeroTextConfig(),
    getHomeHeroContentConfig(),
    getHomePanelsConfig(),
    getHomeValueStripConfig(),
  ]);
  return (
    <MirroredPage
      page={page}
      heroHomeConfig={heroHomeConfig}
      homeHeroTextConfig={homeHeroTextConfig}
      homeHeroContentConfig={homeHeroContentConfig}
      homePanelsConfig={homePanelsConfig}
      homeValueStripConfig={homeValueStripConfig}
    />
  );
}
