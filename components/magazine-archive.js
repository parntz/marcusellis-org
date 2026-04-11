/* eslint-disable @next/next/no-img-element */

export function MagazineArchive({ introHtml = "", issues = [], latestIssue = null }) {
  return (
    <section className="page-content magazine-archive-content">
      {issues.length ? (
        <div className="magazine-archive-grid-shell">
          <div className="magazine-archive-grid-main">
            <div className="magazine-archive-grid">
              {issues.map((issue) => (
                <a
                  key={`${issue.href}-${issue.title}`}
                  className="magazine-issue-card"
                  href={issue.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="magazine-issue-card__cover">
                    {issue.imageSrc ? <img src={issue.imageSrc} alt={issue.title} loading="lazy" /> : null}
                  </div>
                  <div className="magazine-issue-card__body">
                    <p className="magazine-issue-card__eyebrow">{issue.year || "Archive issue"}</p>
                    <h3>{issue.label}</h3>
                    <span className="magazine-issue-card__link">
                      Read online
                      <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {latestIssue ? (
            <aside className="magazine-archive-rail">
              <a
                className="magazine-archive-feature"
                href={latestIssue.href}
                target="_blank"
                rel="noreferrer"
              >
                <div className="magazine-archive-feature__cover">
                  {latestIssue.imageSrc ? (
                    <img src={latestIssue.imageSrc} alt={latestIssue.title} loading="eager" />
                  ) : null}
                </div>
                <div className="magazine-archive-feature__body">
                  <p className="magazine-archive-feature__eyebrow">Latest issue</p>
                  <h3>{latestIssue.label}</h3>
                  <p>Open the most recent edition in a new tab and read it online.</p>
                  <span className="btn btn-primary magazine-archive-feature__cta">Open issue</span>
                </div>
              </a>
            </aside>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
