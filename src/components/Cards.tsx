import Link from "next/link";
import { ExternalLink, Play } from "lucide-react";
import type { Article, Product, Video } from "@/db/schema";
import { PublicImage } from "./PublicImage";
import { CTAButton } from "./CTAButton";

export function ArticleCard({ article, featured = false }: { article: Partial<Article>; featured?: boolean }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.04]">
      <div className={featured ? "relative aspect-[16/9]" : "relative aspect-[4/3]"}>
        <PublicImage src={article.heroImage} fill className="object-cover object-top transition duration-700 group-hover:scale-105" sizes="(min-width: 768px) 33vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/88 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-forest-950/65 px-3 py-1 text-xs font-semibold text-gold-200 backdrop-blur">{article.category}</span>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-3xl leading-tight text-ivory">{article.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-ivory/66">{article.subtitle}</p>
      </div>
    </Link>
  );
}

export function VideoCard({ video }: { video: Partial<Video> }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.04]">
      <div className="relative aspect-video">
        <PublicImage src={video.thumbnailImage} fill className="object-cover object-top transition duration-700 group-hover:scale-105" sizes="(min-width: 768px) 33vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 to-charcoal/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-200 text-forest-950 shadow-gold">
            <Play fill="currentColor" size={24} />
          </span>
        </div>
        <span className="absolute left-5 top-5 rounded-full bg-forest-950/65 px-3 py-1 text-xs font-semibold text-gold-200 backdrop-blur">{video.category}</span>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-3xl leading-tight">{video.title}</h3>
        <p className="mt-3 text-sm leading-7 text-ivory/66">{video.description}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ivory/45">{[video.speaker, video.sourceName].filter(Boolean).join(" / ")}</p>
        {video.externalUrl ? (
          <CTAButton href={video.externalUrl} external variant="secondary" className="mt-5">
            Watch externally <ExternalLink className="ml-2" size={15} />
          </CTAButton>
        ) : null}
      </div>
    </article>
  );
}

export function ProductCard({ product }: { product: Partial<Product> }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.04]">
      <div className="relative aspect-[4/3]">
        <PublicImage src={product.image} fill className="object-cover object-top" sizes="(min-width: 768px) 33vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/88 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-forest-950/65 px-3 py-1 text-xs font-semibold text-gold-200 backdrop-blur">{product.category}</span>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-3xl">{product.name}</h3>
        <p className="mt-3 text-sm leading-7 text-ivory/66">{product.description}</p>
        {product.affiliate ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">Affiliate disclosure applies</p> : null}
        {product.externalUrl ? <CTAButton href={product.externalUrl} external className="mt-5">Learn More</CTAButton> : null}
      </div>
    </article>
  );
}
