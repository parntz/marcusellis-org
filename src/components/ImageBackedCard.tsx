import type { ReactNode } from "react";
import type { PublicAsset } from "@/lib/assets";
import { PublicImage } from "./PublicImage";

export function ImageBackedCard({ image, title, children }: { image: PublicAsset; title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-ivory/10 p-6">
      <PublicImage asset={image} fill className="object-cover object-top" sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/20" />
      <div className="relative z-10">
        <h3 className="font-serif text-3xl">{title}</h3>
        <div className="mt-3 text-sm leading-7 text-ivory/70">{children}</div>
      </div>
    </div>
  );
}
