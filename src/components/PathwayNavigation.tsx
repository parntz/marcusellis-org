import Link from "next/link";
import type { PublicAsset } from "@/lib/assets";
import { PublicImage } from "./PublicImage";

type Pathway = {
  title: string;
  href: string;
  description: string;
  image: PublicAsset;
};

export function PathwayNavigation({ pathways }: { pathways: Pathway[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pathways.map((pathway) => (
        <Link key={pathway.href} href={pathway.href} className="group relative min-h-80 overflow-hidden rounded-[2rem] border border-ivory/10">
          <PublicImage asset={pathway.image} fill className="object-cover object-top transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h3 className="font-serif text-4xl text-ivory">{pathway.title}</h3>
            <p className="mt-3 text-sm leading-7 text-ivory/70">{pathway.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
