export function EventStack({ items }) {
  return (
    <section className="content-block">
      <div className="section-heading">
        <p className="section-tag">Prototype Content</p>
        <h2>Use realistic modules while the visual system takes shape.</h2>
      </div>
      <div className="event-stack">
        {items.map((item) => (
          <article key={item.title} className="event-card">
            <p className="event-date">{item.date}</p>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
