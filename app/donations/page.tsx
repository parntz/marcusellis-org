import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { getDonationLinks } from "@/db/queries";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { DonationPanel } from "@/components/DonationPanel";
import { ImageHero } from "@/components/ImageHero";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Donations",
  description: "Support Marcus Ellis's educational resource library and media work."
};

export default async function DonationsPage() {
  const links = await getDonationLinks();

  return (
    <>
      <ImageHero title="Support the work behind the library." subtitle="Donations help maintain the resource collection, video presentation, editorial care, hosting, and thoughtful updates." image={assets.clientPortrait} eyebrow="Donations" />
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <SectionHeading eyebrow="What support makes possible" title="A warmer, clearer place for difficult questions.">
          <p>Gifts support hosting, content organization, careful writing, design maintenance, and future interviews or media updates.</p>
        </SectionHeading>
        <div className="mt-10">
          <DonationPanel links={links} />
        </div>
        <div className="mt-8">
          <DisclaimerBox type="general" />
        </div>
      </section>
    </>
  );
}
