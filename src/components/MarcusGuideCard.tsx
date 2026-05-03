import { assets } from "@/lib/assets";
import { CTAButton } from "./CTAButton";
import { PublicImage } from "./PublicImage";

export function MarcusGuideCard() {
  return (
    <aside className="relative overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-6">
      <div className="relative h-56 overflow-hidden rounded-2xl">
        <PublicImage
          asset={assets.clientPortrait}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 30vw, 100vw"
        />
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-200">Your guide</p>
        <h3 className="mt-2 font-serif text-3xl">Marcus Ellis</h3>
        <p className="mt-3 text-sm leading-7 text-ivory/72">
          Marcus is here as a careful guide, helping visitors navigate stories, articles, videos, and resources without offering medical, legal, or financial advice.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CTAButton href="/my-story" variant="primary">
            Read his story
          </CTAButton>
          <CTAButton href="/contact" variant="secondary">
            Get in touch
          </CTAButton>
        </div>
      </div>
    </aside>
  );
}
