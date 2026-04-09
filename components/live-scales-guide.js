import { LiveScalesItemAdmin, LiveScalesSectionAdmin } from "./live-scales-admin";

export function LiveScalesGuide({ section, isAdmin = false }) {
  if (!section) return null;

  const headline = (
    <div className="section-headline live-scales-section-headline">
      {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
      {section.title ? <h2>{section.title}</h2> : null}
      {section.description ? <p className="live-scales-section-description">{section.description}</p> : null}
    </div>
  );

  return (
    <section className="live-scales-section live-scales-section--guide">
      {isAdmin ? <LiveScalesSectionAdmin section="guide" initialSection={section}>{headline}</LiveScalesSectionAdmin> : headline}

      <div className="live-scales-overview-grid">
        {section.items.map((item, index) => {
          const card = (
            <article key={`${item.title}-${index}`} className="live-scales-overview-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          );
          return isAdmin ? (
            <LiveScalesItemAdmin key={`${item.title}-${index}`} section="guide" index={index} initialItem={item}>
              {card}
            </LiveScalesItemAdmin>
          ) : (
            card
          );
        })}
      </div>
    </section>
  );
}
