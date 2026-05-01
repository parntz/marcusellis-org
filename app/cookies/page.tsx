import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { ImageHero } from "@/components/ImageHero";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie and analytics consent policy for Gabriel's website."
};

export default function CookiesPage() {
  return (
    <>
      <ImageHero title="Cookie Policy" subtitle="Essential preferences are minimal. Analytics and tracking tools wait for consent." image={assets.forestPathHero} eyebrow="Cookies" />
      <section className="prose prose-invert prose-lg mx-auto max-w-4xl px-5 py-20 prose-headings:font-serif prose-a:text-gold-200 md:px-8">
        <h2>Essential cookies</h2>
        <p>The site stores your cookie preference locally so the banner does not reappear on every visit.</p>
        <h2>Optional analytics</h2>
        <p>Google Analytics, Meta Pixel, or other scripts are placeholders until IDs are provided and a visitor consents.</p>
        <h2>Changing preferences</h2>
        <p>You can clear site data in your browser to reset cookie preferences.</p>
      </section>
    </>
  );
}
