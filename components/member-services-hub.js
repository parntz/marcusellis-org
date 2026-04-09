import { MemberServicesPanelsColumn } from "./member-services-panels-column";
import { MemberServicesHubTitleAdmin, MemberServicesIntroHtmlAdmin } from "./member-services-intro-admins";

export default function MemberServicesHub({ introTitle, introHtml, panels, isAdmin }) {
  return (
    <div className="member-services-shell">
      <div className="member-services-hub-layout">
        <header className="member-services-hub-intro">
          {isAdmin ? (
            <>
              <MemberServicesHubTitleAdmin initialHubTitle={introTitle}>
                <h2 className="member-services-hub-intro__title">{introTitle}</h2>
              </MemberServicesHubTitleAdmin>
              <MemberServicesIntroHtmlAdmin initialIntroHtml={introHtml} />
            </>
          ) : (
            <>
              <h2 className="member-services-hub-intro__title">{introTitle}</h2>
              <div
                className="member-services-hub-intro__body member-services-hub-intro__body--rich"
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            </>
          )}
        </header>

        <MemberServicesPanelsColumn initialPanels={panels} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
