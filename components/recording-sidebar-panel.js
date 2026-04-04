import Link from "next/link";

function ContactBox({ payload }) {
  const heading = payload.heading || "Recording Department";
  const phoneDisplay = payload.phoneDisplay || "";
  const phoneHref = payload.phoneHref || `tel:${phoneDisplay.replace(/\D/g, "")}`;
  const cta = payload.cta || "";
  const staff = Array.isArray(payload.staff) ? payload.staff : [];

  return (
    <div className="recording-contact-box">
      <h3 className="recording-sidebar-heading">{heading}</h3>
      {phoneDisplay ? (
        <a href={phoneHref} className="recording-phone">
          {phoneDisplay}
        </a>
      ) : null}
      {cta ? <p className="recording-contact-cta">{cta}</p> : null}
      <div className="recording-staff">
        {staff.map((member, idx) => (
          <div key={`${member.email || member.name || idx}`} className="recording-staff-member">
            {member.email ? (
              <a href={`mailto:${member.email}`}>{member.name || member.email}</a>
            ) : (
              <span>{member.name}</span>
            )}
            {member.role ? <span>{member.role}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function RateBox({ payload }) {
  const heading = payload.heading || "Rate Update";
  const paragraph = payload.paragraph || "";
  if (!paragraph) return null;
  return (
    <div className="recording-callout recording-rate-callout">
      <h3 className="recording-sidebar-heading">{heading}</h3>
      <p>{paragraph}</p>
    </div>
  );
}

function BformsBox({ payload }) {
  const heading = payload.heading || "B Forms";
  const body = payload.body || "";
  const linkLabel = payload.linkLabel || "";
  const linkHref = payload.linkHref || "/scales-forms-agreements";

  return (
    <Link href={linkHref} className="recording-callout recording-bforms-callout">
      <h3 className="recording-bforms-title">{heading}</h3>
      {body ? <p>{body}</p> : null}
      {linkLabel ? <span className="recording-callout-link">{linkLabel}</span> : null}
    </Link>
  );
}

function CtaGroupBox({ payload }) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  return (
    <div className="recording-cta-box">
      {items.map((item, idx) => {
        const title = item.title || "";
        const subtitle = item.subtitle || "";
        const href = item.href || "#";
        const external = Boolean(item.external);
        const className = "recording-cta-item";
        if (external) {
          return (
            <a
              key={`${href}-${idx}`}
              href={href}
              className={className}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{title}</strong>
              {subtitle ? <span>{subtitle}</span> : null}
            </a>
          );
        }
        return (
          <Link key={`${href}-${idx}`} href={href} className={className}>
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

export function RecordingSidebarPanel({ boxes }) {
  if (!boxes?.length) {
    return null;
  }

  return (
    <>
      {boxes.map((box, idx) => {
        const key = `sidebar-${idx}-${box.kind}`;
        switch (box.kind) {
          case "contact":
            return <ContactBox key={key} payload={box.payload || {}} />;
          case "rate":
            return <RateBox key={key} payload={box.payload || {}} />;
          case "bforms":
            return <BformsBox key={key} payload={box.payload || {}} />;
          case "cta_group":
            return <CtaGroupBox key={key} payload={box.payload || {}} />;
          default:
            return null;
        }
      })}
    </>
  );
}
