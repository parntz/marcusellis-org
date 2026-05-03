import Link from "next/link";
import type { NavigationLink } from "@/db/schema";
import { MobileNav } from "./MobileNav";

export function Header({ links }: { links: Pick<NavigationLink, "label" | "href" | "external">[] }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ivory/10 bg-forest-950/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="font-serif text-3xl tracking-tight text-ivory">
          Marcus Ellis
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ivory/72 transition hover:text-gold-200"
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileNav links={links} />
      </div>
    </header>
  );
}
