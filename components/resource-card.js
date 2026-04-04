import Link from "next/link";

export function ResourceCard({ item }) {
  return (
    <article className="resource-card">
      {item.category ? <p className="feature-eyebrow">{item.category}</p> : null}
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <Link href={`/resources/${item.slug}/`} className="text-link">
        View &gt;&gt;
      </Link>
    </article>
  );
}
