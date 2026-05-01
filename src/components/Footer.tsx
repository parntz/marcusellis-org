import Link from "next/link";
import { affiliateDisclosure, medicalDisclaimer } from "@/db/content";

export function Footer() {
  return (
    <footer className="border-t border-ivory/10 bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <div>
          <p className="font-serif text-4xl text-ivory">Gabriel</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/64">{medicalDisclaimer}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/64">{affiliateDisclosure}</p>
        </div>
        <div className="grid gap-3 text-sm text-ivory/72 md:justify-end">
          <Link href="/privacy" className="hover:text-gold-200">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-gold-200">Cookie Policy</Link>
          <Link href="/disclaimer" className="hover:text-gold-200">Medical / Legal / Affiliate Disclaimer</Link>
          <Link href="/contact" className="hover:text-gold-200">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
