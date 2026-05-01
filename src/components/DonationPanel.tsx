import { ExternalLink } from "lucide-react";
import type { DonationLink } from "@/db/schema";
import { CTAButton } from "./CTAButton";

export function DonationPanel({ links }: { links: Partial<DonationLink>[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {links.map((link) => (
        <article key={`${link.provider}-${link.url}`} className="rounded-[2rem] border border-ivory/10 bg-ivory/[0.04] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-200">{link.provider}</p>
          <h3 className="mt-3 font-serif text-3xl">{link.label}</h3>
          <p className="mt-3 text-sm leading-7 text-ivory/68">{link.description}</p>
          {link.url ? (
            <CTAButton href={link.url} external className="mt-6">
              Open Donation Link <ExternalLink className="ml-2" size={15} />
            </CTAButton>
          ) : null}
        </article>
      ))}
    </div>
  );
}
