import { Sparkles } from "lucide-react";
import { CTAButton } from "./CTAButton";

export function GabrielGuideCard() {
  return (
    <aside className="rounded-[2rem] border border-gold-200/25 bg-forest-900/80 p-6 shadow-gold backdrop-blur">
      <div className="mb-5 inline-flex rounded-full bg-gold-200/15 p-3 text-gold-200">
        <Sparkles size={22} />
      </div>
      <h3 className="font-serif text-3xl text-ivory">Start with Gabriel</h3>
      <p className="mt-3 text-sm leading-7 text-ivory/70">
        Gabriel is your guide through this collection, helping you find the story, articles, videos, and resources most relevant to your next step.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <CTAButton href="/intake">Intake</CTAButton>
        <CTAButton href="/contact" variant="secondary">Contact</CTAButton>
      </div>
    </aside>
  );
}
