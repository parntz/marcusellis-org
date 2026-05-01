"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { NavigationLink } from "@/db/schema";

export function MobileNav({ links }: { links: Pick<NavigationLink, "label" | "href" | "external">[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="focus-ring rounded-full border border-ivory/20 bg-ivory/10 p-3 text-ivory"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-forest-950/96 px-6 py-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-serif text-3xl" onClick={() => setOpen(false)}>
              Gabriel
            </Link>
            <button
              type="button"
              className="focus-ring rounded-full border border-ivory/20 p-3"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="mt-12 grid gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-ivory/10 pb-4 font-serif text-4xl"
                onClick={() => setOpen(false)}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/intake"
            className="focus-ring mt-10 inline-flex rounded-full bg-gold-200 px-5 py-3 font-semibold text-forest-950"
            onClick={() => setOpen(false)}
          >
            Start with Gabriel
          </Link>
        </div>
      ) : null}
    </div>
  );
}
