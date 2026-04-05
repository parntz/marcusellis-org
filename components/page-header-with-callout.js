import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth-options";
import { listCallouts, listCalloutsForAdmin } from "../lib/callouts";
import { getCalloutConfig } from "../lib/site-config-callouts";
import { CalloutRotator } from "./callout-rotator";

/**
 * Standard internal page header: title + one-line description + optional DB callout (News & Events band).
 * Prefer `title` + `description`; optional `kicker` (e.g. date badge row) and `trailing` (e.g. actions).
 * `children` wraps the main column for rare full overrides.
 */
export async function PageHeaderWithCallout({ title, description, kicker, trailing, titleAction, children }) {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user);
  const headerCallouts = await listCallouts("header");
  const adminCallouts = isAdmin ? await listCalloutsForAdmin("header") : [];
  const calloutConfig = await getCalloutConfig("header");
  const hasCallout = headerCallouts.length > 0 || isAdmin;

  const main = children ? (
    <div className="page-header-main__inner">{children}</div>
  ) : (
    <div className="page-header-main__inner">
      {kicker ? <div className="page-header-main__kicker">{kicker}</div> : null}
      <div className={`page-header-main__title-row${titleAction ? " has-action" : ""}`}>
        <h1 className="page-title">{title}</h1>
        {titleAction ? <div className="page-header-main__title-action">{titleAction}</div> : null}
      </div>
      <p className="page-summary page-summary--internal">{description ?? ""}</p>
      {trailing ? <div className="page-header-main__trailing">{trailing}</div> : null}
    </div>
  );

  return (
    <header className={`page-header page-header--internal${hasCallout ? " page-header--with-callout" : ""}`}>
      <div className="page-header-main page-header-main--internal">{main}</div>
      {hasCallout ? (
        <div className="page-header-callout">
          <CalloutRotator
            items={headerCallouts}
            isAdmin={isAdmin}
            adminItems={adminCallouts}
            intervalMs={calloutConfig.delaySeconds * 1000}
            initialConfig={calloutConfig}
          />
        </div>
      ) : null}
    </header>
  );
}
