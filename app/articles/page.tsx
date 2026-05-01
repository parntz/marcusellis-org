import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { getArticles } from "@/db/queries";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { ImageHero } from "@/components/ImageHero";

export const metadata: Metadata = {
  title: "Articles",
  description: "An editorial library of educational articles, external resources, research links, and healing stories."
};

export default async function ArticlesPage() {
  const articles = await getArticles();
  const featured = articles.find((article) => article.featured) ?? articles[0];

  return (
    <>
      <ImageHero title="An editorial library for careful questions." subtitle="Read personal reflections, external resources, research links, and financial topics with clear disclaimers and grounded language." image={assets.icelandWater} eyebrow="Articles" />
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <DisclaimerBox type="medical" />
        {featured ? (
          <div className="mt-10">
            <ArticleCard article={featured} featured />
          </div>
        ) : null}
        <div className="mt-12">
          <ArticleLibrary articles={articles} />
        </div>
      </section>
    </>
  );
}
