import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth-options";
import { isAdminSession } from "../lib/authz";
import { listCallouts, listCalloutsForAdmin } from "../lib/callouts";
import { getPageHeaderOverride } from "../lib/page-header-editor";
import { getCalloutConfig } from "../lib/site-config-callouts";
import { getRouteCalloutConfig } from "../lib/site-config-route-callouts";
import { CalloutRotator } from "./callout-rotator";
import { PageHeaderTextAdmin } from "./page-header-text-admin";

/**
 * Standard internal page header: title + description + optional DB callout (News & Events band).
 * Prefer `title` + `description`; optional `kicker` (e.g. date badge row) and `trailing` (e.g. actions).
 * `children` wraps the main column for rare full overrides.
 */
export async function PageHeaderWithCallout({
  route = "",
  title,
  description,
  kicker,
  trailing,
  titleAction,
  children,
  hideCallout = false,
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  const headerCallouts = await listCallouts("header");
  const adminCallouts = isAdmin ? await listCalloutsForAdmin("header") : [];
  const calloutConfig = await getCalloutConfig("header");
  const routeCalloutConfig = route ? await getRouteCalloutConfig(route, "header") : { enabled: true };
  const suppressCalloutByRoute =
    typeof route === "string" && (route.startsWith("/users/") || route.startsWith("/user/"));
  const hasCallout =
    !hideCallout &&
    !suppressCalloutByRoute &&
    routeCalloutConfig.enabled !== false &&
    calloutConfig.enabled !== false &&
    (headerCallouts.length > 0 || isAdmin);
  const headerOverride = route ? await getPageHeaderOverride(route) : null;
  const resolvedTitle = headerOverride ? headerOverride.title : title;
  const resolvedDescription = headerOverride ? headerOverride.description : description ?? "";

  const main = children ? (
    <div className="page-header-main__inner">{children}</div>
  ) : (
    <div className={`page-header-main__inner${isAdmin ? " page-header-main__inner--admin-editable" : ""}`}>
      {kicker ? <div className="page-header-main__kicker">{kicker}</div> : null}
      <div className={`page-header-main__title-row${titleAction ? " has-action" : ""}`}>
        <h1 className="page-title" data-page-header-title>
          {resolvedTitle}
        </h1>
        {titleAction ? <div className="page-header-main__title-action">{titleAction}</div> : null}
      </div>
      <p className="page-summary page-summary--internal" data-page-header-description>
        {resolvedDescription}
      </p>
      {trailing ? <div className="page-header-main__trailing">{trailing}</div> : null}
      {isAdmin ? <PageHeaderTextAdmin route={route} /> : null}
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
