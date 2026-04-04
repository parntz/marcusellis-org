export function FeatureGrid({ items }) {
  return (
    <section className="content-block">
      <div className="section-heading">
        <p className="section-tag">Core Opportunities</p>
        <h2>Build the system before rebuilding every page.</h2>
      </div>
      <div className="feature-grid">
        {items.map((item) => (
          <article key={item.title} className="feature-card">
            <p className="feature-eyebrow">{item.eyebrow}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
