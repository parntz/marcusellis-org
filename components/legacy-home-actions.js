import Link from "next/link";

export function LegacyHomeActions({ items }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="legacy-action-strip" aria-label="Primary actions">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`legacy-action-card legacy-action-${item.variant}`}
        >
          <span>{item.label}</span>
        </Link>
      ))}
    </section>
  );
}
