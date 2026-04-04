import Link from "next/link";

export function LegacyHomeInfo({ intro, infoLinks, newsItems }) {
  if (!infoLinks.length && !newsItems.length && !intro) {
    return null;
  }

  return (
    <section className="legacy-home-columns">
      {infoLinks.length ? (
        <div className="legacy-panel">
          <div className="legacy-info-links">
            {infoLinks.map((item) => (
              <Link key={item.label} href={item.href} className="legacy-info-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {intro ? (
        <div className="legacy-panel legacy-faq-panel">
          <p>{intro}</p>
        </div>
      ) : null}
      {newsItems.length ? (
        <div className="legacy-panel">
          <div className="legacy-news-list">
            {newsItems.slice(0, 2).map((item) => {
              const [month = "", day = ""] = (item.date || "").split(" ");
              return (
                <article key={item.slug} className="legacy-news-item">
                  <div className="legacy-news-date">
                    <span className="legacy-news-month">{month.slice(0, 3)}</span>
                    <span className="legacy-news-day">{day.replace(",", "")}</span>
                  </div>
                  <div className="legacy-news-copy">
                    <h3>
                      <Link href={`/news/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <p>{item.summary}</p>
                    <Link href={`/news/${item.slug}`} className="legacy-news-more">
                      View &gt;&gt;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
