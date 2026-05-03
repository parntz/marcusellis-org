import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { requireSetting } from "@/db/queries";
import { CTAButton } from "@/components/CTAButton";
import { ImageHero } from "@/components/ImageHero";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Patient Flow Websites",
  description: "A bridge page to the separate Patient Flow Websites service."
};

export default async function PatientFlowWebsitesPage() {
  const url = await requireSetting("patient_flow_url");

  return (
    <>
      <ImageHero title="Patient Flow Websites is a separate service." subtitle="This bridge page points visitors to a dedicated website and service distinct from Marcus Ellis's educational resource library." image={assets.businessPhotoOne} eyebrow="Bridge page" />
      <section className="mx-auto max-w-4xl px-5 py-20 md:px-8">
        <SectionHeading eyebrow="Separate destination" title="For clinic and business website support, continue to Patient Flow Websites.">
          <p>The outbound link is configurable through the database in `site_settings` using the `patient_flow_url` key.</p>
        </SectionHeading>
        <div className="mt-8">
          <CTAButton href={url} external>Visit Patient Flow Websites</CTAButton>
        </div>
      </section>
    </>
  );
}
