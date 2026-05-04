import { assets } from "@/lib/assets";
import { Sparkles } from "lucide-react";
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
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-200">
          <Sparkles size={14} />
          <span>Your guide</span>
        </div>
        <h3 className="mt-2 font-serif text-3xl">Start with Marcus Ellis</h3>
        <p className="mt-3 text-sm leading-7 text-ivory/72">
          Marcus Ellis is your guide through this collection, helping you find the story, articles, videos, and resources most relevant to your next step.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CTAButton href="/intake" variant="primary">
            Intake
          </CTAButton>
          <CTAButton href="/contact" variant="secondary">
            Contact
          </CTAButton>
        </div>
      </div>
    </aside>
  );
}
