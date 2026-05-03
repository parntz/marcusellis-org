import type { ReactNode } from "react";
import { PublicImage } from "./PublicImage";
import { CTAButton } from "./CTAButton";
import type { PublicAsset } from "@/lib/assets";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  image: PublicAsset;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  tertiaryCta?: { label: string; href: string };
  children?: ReactNode;
};

export function CinematicHero({
  eyebrow,
  title,
  subtitle,
  image,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  children
}: Props) {
  return (
    <section className="grain relative isolate min-h-[88vh] overflow-hidden">
      <PublicImage
        asset={image}
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/78 to-forest-950/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-transparent to-charcoal/45" />
      <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-7xl items-end px-5 pb-20 pt-36 md:px-8 lg:pb-28">
        <div className="max-w-4xl">
          {eyebrow ? <p className="mb-5 text-xs font-bold uppercase tracking-[0.42em] text-gold-200">{eyebrow}</p> : null}
          <h1 className="font-serif text-5xl leading-[0.95] text-balance text-ivory md:text-7xl lg:text-8xl">{title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/78 md:text-xl">{subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {primaryCta ? <CTAButton href={primaryCta.href}>{primaryCta.label}</CTAButton> : null}
            {secondaryCta ? <CTAButton href={secondaryCta.href} variant="secondary">{secondaryCta.label}</CTAButton> : null}
            {tertiaryCta ? <CTAButton href={tertiaryCta.href} variant="ghost">{tertiaryCta.label}</CTAButton> : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
