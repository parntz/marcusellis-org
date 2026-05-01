import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { ImageHero } from "@/components/ImageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Gabriel's educational resource website."
};

export default function PrivacyPage() {
  return (
    <>
      <ImageHero title="Privacy Policy" subtitle="How contact forms, intake forms, analytics consent, and external links are handled." image={assets.icelandWater} eyebrow="Privacy" />
      <section className="prose prose-invert prose-lg mx-auto max-w-4xl px-5 py-20 prose-headings:font-serif prose-a:text-gold-200 md:px-8">
        <h2>Information you provide</h2>
        <p>Contact and intake forms collect the details you choose to submit. Intake is intentionally limited and should not include detailed diagnosis, medication lists, treatment plans, or urgent medical needs.</p>
        <h2>Analytics and cookies</h2>
        <p>Analytics and advertising scripts are loaded only after consent and only when the relevant environment variables are configured.</p>
        <h2>External links</h2>
        <p>This site links to outside articles, videos, products, donation providers, and services. External sites have their own policies and practices.</p>
      </section>
    </>
  );
}
