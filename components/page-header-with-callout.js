import { listCallouts } from "../lib/callouts";
import { CalloutRotator } from "./callout-rotator";

/**
 * Standard internal page header: title + one-line description + optional DB callout (News & Events band).
 * Prefer `title` + `description`; optional `kicker` (e.g. date badge row) and `trailing` (e.g. actions).
 * `children` wraps the main column for rare full overrides.
 */
export async function PageHeaderWithCallout({ title, description, kicker, trailing, children }) {
  const headerCallouts = await listCallouts("header");
  const hasCallout = headerCallouts.length > 0;

  const main = children ? (
    <div className="page-header-main__inner">{children}</div>
  ) : (
    <div className="page-header-main__inner">
      {kicker ? <div className="page-header-main__kicker">{kicker}</div> : null}
      <h1 className="page-title">{title}</h1>
      <p className="page-summary page-summary--internal">{description ?? ""}</p>
      {trailing ? <div className="page-header-main__trailing">{trailing}</div> : null}
    </div>
  );

  return (
    <header className={`page-header page-header--internal${hasCallout ? " page-header--with-callout" : ""}`}>
      <div className="page-header-main page-header-main--internal">{main}</div>
      {hasCallout ? (
        <div className="page-header-callout">
          <CalloutRotator items={headerCallouts} />
        </div>
      ) : null}
    </header>
  );
}
