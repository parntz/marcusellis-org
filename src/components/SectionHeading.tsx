import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, children, align = "left" }: Props) {
  return (
    <div className={cn("mx-auto max-w-3xl", align === "center" ? "text-center" : "mx-0")}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-gold-200/85">{eyebrow}</p>
      ) : null}
      <h2 className="font-serif text-4xl leading-tight text-balance text-ivory md:text-6xl">{title}</h2>
      {children ? <div className="mt-5 text-base leading-8 text-ivory/72 md:text-lg">{children}</div> : null}
    </div>
  );
}
