import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { ImageHero } from "@/components/ImageHero";
import { IntakeForm } from "@/components/IntakeForm";

export const metadata: Metadata = {
  title: "Client Intake",
  description: "A consent-based intake form that avoids unnecessary protected health information."
};

export default function IntakePage() {
  return (
    <>
      <ImageHero title="Start with a simple, careful note." subtitle="This form collects only basic contact context and avoids detailed diagnosis, medication, treatment, or sensitive medical-history fields." image={assets.forestPathHero} eyebrow="Intake" />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[1fr_0.7fr] md:px-8">
        <IntakeForm />
        <div className="grid content-start gap-6">
          <DisclaimerBox type="medical" />
          <div className="rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-6 text-sm leading-7 text-ivory/70">
            <h2 className="font-serif text-3xl text-ivory">Please do not submit urgent needs.</h2>
            <p className="mt-3">For medical emergencies or urgent health concerns, contact emergency services or a qualified healthcare professional directly.</p>
          </div>
        </div>
      </section>
    </>
  );
}
