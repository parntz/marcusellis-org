/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getGigById } from "../../../lib/gigs";
import { siteMeta } from "../../../lib/site-data";

export const dynamic = "force-dynamic";

function parseGigId(params) {
  const id = Number(params?.id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function getDisplayNotes(notes) {
  const text = String(notes || "").trim();
  if (!text) return "";

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^imported from nashville symphony$/i.test(line))
    .join("\n");
}

export async function generateMetadata({ params }) {
  const id = parseGigId(params);
  const gig = id ? await getGigById(id) : null;
  if (!gig) {
    return {
      title: `Gig Not Found | ${siteMeta.title}`,
    };
  }

  return {
    title: `${gig.bandName || gig.locationName} | Upcoming Gigs | ${siteMeta.title}`,
    description: gig.notes || gig.dateLabel || "Gig details and venue information.",
  };
}

export default async function GigDetailPage({ params }) {
  const id = parseGigId(params);
  if (!id) notFound();

  const gig = await getGigById(id);
  if (!gig) notFound();
  const displayNotes = getDisplayNotes(gig.notes);

  return (
    <article className="page-frame gigs-shell pg-gigs pg-gig-detail">
      <section className="gig-detail-raw">
        <p className="gig-detail-raw__back">
          <Link href="/gigs" className="gig-detail-raw__back-link">
            ← All Gigs
          </Link>
        </p>
        <h1 className="gig-detail-raw__title">{gig.bandName || gig.locationName}</h1>
        <div className="gig-detail-raw__body">
          <div className="gig-detail-raw__top">
            {gig.imageUrl ? (
              <figure className="gig-detail-raw__cover">
                <img src={gig.imageUrl} alt={`${gig.bandName || gig.locationName || "Gig"} poster`} />
              </figure>
            ) : null}

            <div className="gig-detail-raw__meta">
              <p className="gig-detail-raw__date-venue">
                {gig.dateLabel}
                {gig.locationName ? "\u00A0\u00A0|\u00A0\u00A0" : ""}
                {gig.locationName || ""}
              </p>
              {gig.locationAddress ? <p>{gig.locationAddress}</p> : null}

              {gig.mapHref ? (
                <p>
                  <a href={gig.mapHref} target="_blank" rel="noreferrer" className="gig-detail-raw__map-link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21.75s7.5-4.108 7.5-11.25a7.5 7.5 0 1 0-15 0c0 7.142 7.5 11.25 7.5 11.25Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                    <span aria-hidden="true">Map</span>
                    <span className="sr-only">View map</span>
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          {displayNotes ? (
            <section>
              <p>Notes</p>
              <p>{displayNotes}</p>
            </section>
          ) : null}
        </div>
      </section>
    </article>
  );
}
