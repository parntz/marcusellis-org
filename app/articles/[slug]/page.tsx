import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assets, resolvePublicImageSrc } from "@/lib/assets";
import { absoluteUrl } from "@/lib/utils";
import { getArticleBySlug, getArticles } from "@/db/queries";
import { ArticleCard } from "@/components/ArticleCard";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { ImageHero } from "@/components/ImageHero";
import { PullQuote } from "@/components/PullQuote";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const heroImage = article?.heroImage ? resolvePublicImageSrc(article.heroImage) : undefined;

  return {
    title: article?.title ?? "Article",
    description: article?.subtitle ?? "Educational article from Marcus Ellis.",
    openGraph: {
      title: article?.title,
      description: article?.subtitle ?? undefined,
      url: absoluteUrl(`/articles/${slug}`),
      type: "article",
      images: heroImage ? [{ url: heroImage }] : undefined
    }
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const [article, articles] = await Promise.all([getArticleBySlug(slug), getArticles()]);

  if (!article) {
    notFound();
  }

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <>
      <ImageHero title={article.title} subtitle={article.subtitle ?? "Educational article"} image={{ ...assets.forestPathHero, src: article.heroImage ?? assets.forestPathHero.src }} eyebrow={article.category} />
      <article className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[1fr_20rem] md:px-8">
        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-a:text-gold-200">
          <p className="lead">{article.subtitle}</p>
          <p>{article.body}</p>
          <PullQuote quote="A link is a starting point, not a conclusion." />
          <p>
            Please evaluate sources carefully, consider the date and context, and discuss health-related decisions with qualified healthcare professionals.
          </p>
        </div>
        <div className="grid content-start gap-6">
          <DisclaimerBox type={article.disclaimerType} />
          {article.externalSourceUrl ? (
            <a className="focus-ring rounded-full bg-gold-200 px-5 py-3 text-center font-semibold text-forest-950" href={article.externalSourceUrl} target="_blank" rel="noreferrer">
              Visit external source
            </a>
          ) : null}
        </div>
      </article>
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <h2 className="font-serif text-4xl">Related articles</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {related.map((item) => (
            <ArticleCard key={item.slug} article={item} />
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.subtitle,
            author: article.author,
            datePublished: article.publishedAt,
            image: article.heroImage ? absoluteUrl(resolvePublicImageSrc(article.heroImage)) : undefined
          })
        }}
      />
    </>
  );
}
