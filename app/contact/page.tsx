import type { Metadata } from "next";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { ContactForm } from "@/components/ContactForm";
import { ImageHero } from "@/components/ImageHero";
import { PublicImage } from "@/components/PublicImage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Marcus Ellis with general questions or use intake for more detailed inquiries."
};

export default function ContactPage() {
  return (
    <>
      <ImageHero title="Reach out with a grounded next step." subtitle="Use this form for general notes. For more specific inquiries, the intake form gives Marcus Ellis better context without requesting unnecessary health details." image={assets.businessPhotoTwo} eyebrow="Contact" />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[0.8fr_1fr] md:px-8">
        <div className="relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-ivory/10">
          <PublicImage asset={assets.businessPhotoOne} fill className="object-cover object-top" sizes="(min-width: 768px) 40vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
          <div className="absolute bottom-0 p-6">
            <h2 className="font-serif text-4xl">Need more context?</h2>
            <p className="mt-3 text-sm leading-7 text-ivory/70">
              The <Link href="/intake" className="text-gold-200">intake form</Link> is better for topic-specific requests.
            </p>
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
