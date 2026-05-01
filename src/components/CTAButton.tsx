import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
  className?: string;
};

export function CTAButton({ href, children, variant = "primary", external, className }: Props) {
  const classes = cn(
    "focus-ring inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-300",
    variant === "primary" && "bg-gold-200 text-forest-950 shadow-gold hover:bg-ivory",
    variant === "secondary" && "border border-ivory/25 bg-ivory/10 text-ivory backdrop-blur hover:bg-ivory/18",
    variant === "ghost" && "text-gold-200 hover:text-ivory",
    className
  );

  return (
    <Link
      className={classes}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </Link>
  );
}
