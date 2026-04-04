export function PageHero({ eyebrow, title, summary }) {
  return (
    <section className="page-hero">
      <p className="section-tag">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{summary}</p>
    </section>
  );
}
