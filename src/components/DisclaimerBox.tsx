import { affiliateDisclosure, financialDisclaimer, medicalDisclaimer } from "@/db/content";

type Props = {
  type?: string | null;
  compact?: boolean;
};

export function DisclaimerBox({ type = "medical", compact = false }: Props) {
  const copy =
    type === "financial"
      ? financialDisclaimer
      : type === "affiliate"
        ? affiliateDisclosure
        : type === "general"
          ? "External resources are provided for education and context. Inclusion does not imply endorsement of every claim or viewpoint."
          : medicalDisclaimer;

  return (
    <aside className="rounded-3xl border border-gold-200/25 bg-gold-200/10 p-5 text-sm leading-7 text-ivory/78">
      <p className="font-semibold text-gold-200">{type === "financial" ? "Financial/legal note" : "Important note"}</p>
      <p className={compact ? "mt-1" : "mt-3"}>{copy}</p>
    </aside>
  );
}
