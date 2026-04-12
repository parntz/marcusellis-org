export function UnionPlusProgramPage({ content }) {
  const introHtml = content?.introHtml || "";
  const sections = Array.isArray(content?.sections) ? content.sections : [];

  return (
    <section className="page-content union-plus-content union-plus-program-shell">
      {introHtml ? (
        <div className="union-plus-program-hero">
          <div
            className="union-plus-program-hero__intro"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
          {sections.length ? (
            <nav className="union-plus-program-toc" aria-label="Union Plus sections">
              <ol className="union-plus-program-toc__list">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="union-plus-program-toc__link">
                      <span className="union-plus-program-toc__index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="union-plus-program-toc__label">{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </div>
      ) : null}

      <div className="union-plus-program-sections">
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="union-plus-program-section">
            <h2 className="union-plus-program-section__title">{section.title}</h2>
            <div
              className="union-plus-program-section__body"
              dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
