import type { PublicAsset } from "@/lib/assets";
import { PublicImage } from "./PublicImage";

type Props = {
  title: string;
  subtitle: string;
  image: PublicAsset;
  eyebrow?: string;
};

export function ImageHero({ title, subtitle, image, eyebrow }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-ivory/10 bg-charcoal">
      <div className="absolute inset-0">
        <PublicImage asset={image} fill priority loading="eager" className="object-cover object-top opacity-58" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/70 to-forest-950/20" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-40 md:px-8">
        {eyebrow ? <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-gold-200">{eyebrow}</p> : null}
        <h1 className="max-w-4xl font-serif text-5xl leading-tight text-balance text-ivory md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/75">{subtitle}</p>
      </div>
    </section>
  );
}
