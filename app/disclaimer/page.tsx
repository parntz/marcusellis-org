import type { Metadata } from "next";
import { affiliateDisclosure, financialDisclaimer, medicalDisclaimer } from "@/db/content";
import { assets } from "@/lib/assets";
import { ImageHero } from "@/components/ImageHero";

export const metadata: Metadata = {
  title: "Medical, Legal, Financial, and Affiliate Disclaimer",
  description: "Important educational, medical, legal, financial, external-link, and affiliate disclosures."
};

export default function DisclaimerPage() {
  return (
    <>
      <ImageHero title="Disclaimers and disclosures" subtitle="Clear boundaries for educational content, external links, financial topics, and affiliate relationships." image={assets.icelandWater} eyebrow="Important disclosures" />
      <section className="prose prose-invert prose-lg mx-auto max-w-4xl px-5 py-20 prose-headings:font-serif prose-a:text-gold-200 md:px-8">
        <h2>Medical disclaimer</h2>
        <p>{medicalDisclaimer}</p>
        <h2>Financial, legal, tax, and insurance disclaimer</h2>
        <p>{financialDisclaimer}</p>
        <h2>Products and affiliations</h2>
        <p>Products, interviews, protocols, chemicals, supplements, books, courses, and external links are framed as resources, personal research links, interviews, or affiliated products. They are not medical recommendations.</p>
        <h2>Affiliate disclosure</h2>
        <p>{affiliateDisclosure}</p>
        <h2>External-link disclosure</h2>
        <p>External links are provided for education and context. This site does not control external content and does not endorse every claim, viewpoint, or product presented elsewhere.</p>
      </section>
    </>
  );
}
