/* eslint-disable @next/next/no-img-element */

export function GigsList({ gigs = [] }) {
  if (!gigs.length) {
    return (
      <section className="page-content gigs-empty-state">
        <h2>Upcoming Gigs</h2>
        <p>No upcoming gigs have been posted yet.</p>
      </section>
    );
  }

  return (
    <section className="gigs-grid" aria-label="Upcoming gigs">
      {gigs.map((gig) => (
        <article key={gig.id} className="gig-card">
          <div className="gig-card__media">
            {gig.imageUrl ? (
              <img
                src={gig.imageUrl}
                alt={`${gig.locationName || "Gig"} poster`}
                className="gig-card__image"
              />
            ) : (
              <div className="gig-card__image gig-card__image--placeholder" aria-hidden="true" />
            )}
          </div>

          <div className="gig-card__body">
            <p className="gig-card__eyebrow">Upcoming Gig</p>
            <h2 className="gig-card__title">{gig.locationName}</h2>
            <p className="gig-card__date">{gig.dateLabel}</p>

            {gig.locationAddress ? <p className="gig-card__location">{gig.locationAddress}</p> : null}

            {gig.mapHref ? (
              <p className="gig-card__map">
                <a href={gig.mapHref} target="_blank" rel="noreferrer">
                  View Map
                </a>
              </p>
            ) : null}

            {gig.artists?.length ? (
              <div className="gig-card__artists">
                <p className="gig-card__label">Gig Artists</p>
                <div className="gig-card__chips">
                  {gig.artists.map((artist) => (
                    <span key={`${gig.id}-${artist}`} className="gig-chip">
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {gig.notes ? (
              <div className="gig-card__notes">
                <p className="gig-card__label">Notes</p>
                <p>{gig.notes}</p>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
