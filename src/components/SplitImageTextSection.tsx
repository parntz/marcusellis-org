import type { ReactNode } from "react";
import type { PublicAsset } from "@/lib/assets";
import { PublicImage } from "./PublicImage";

export function SplitImageTextSection({
  image,
  eyebrow,
  title,
  children,
  reverse = false
}: {
  image: PublicAsset;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-2 md:px-8">
      <div className={reverse ? "md:order-2" : undefined}>
        <div className="relative min-h-[28rem] overflow-hidden rounded-[2.5rem] border border-ivory/10">
          <PublicImage asset={image} fill className="object-cover object-top" sizes="(min-width: 768px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
        </div>
      </div>
      <div className="flex items-center">
        <div>
          {eyebrow ? <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-gold-200">{eyebrow}</p> : null}
          <h2 className="font-serif text-4xl leading-tight text-ivory md:text-6xl">{title}</h2>
          <div className="mt-6 text-base leading-8 text-ivory/72">{children}</div>
        </div>
      </div>
    </section>
  );
}
