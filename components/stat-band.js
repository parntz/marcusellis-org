export function StatBand({ items }) {
  return (
    <section className="stat-band">
      {items.map((item) => (
        <article key={item.label} className="stat-chip">
          <p className="stat-value">{item.value}</p>
          <p className="stat-label">{item.label}</p>
        </article>
      ))}
    </section>
  );
}
