import Link from "next/link";
import { siteMeta, utilityNav } from "../lib/site-data";

const FOOTER_PARTNER_LINKS = [
  {
    href: "https://www.musicares.org",
    label: "MusiCares",
    src: "/_downloaded/sites/default/files/MC2color_clearbkgnd3.png",
  },
  {
    href: "https://www.afm.org",
    label: "American Federation of Musicians",
    src: "/_downloaded/sites/default/files/styles/hg_media_image_medium/public/AFMLogo_new--3f69746f6b3d.png",
  },
  {
    href: "https://www.musiciansofthenashvillesymphony.org",
    label: "Musicians of the Nashville Symphony",
    src: "/_downloaded/sites/default/files/MONSO2.png",
  },
  {
    href: "https://www.afm-epf.org",
    label: "AFM Employers Pension Fund",
    src: "/_downloaded/sites/default/files/AFM-EPF_Logo3_0.png",
  },
];

const FOOTER_LEGAL_LINKS = [
  { href: "/terms-of-use", label: "Terms of Use" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export function Footer() {
  const memberAction =
    utilityNav.find((item) => item.label.toLowerCase().includes("join"))?.href ||
    "/join-nashville-musicians-association";

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <p className="footer-title">{siteMeta.title}</p>
          <p className="footer-copy">Union representation and support for Nashville musicians.</p>
          <Link href={memberAction} className="btn btn-primary footer-cta">
            Join the Union
          </Link>
          <nav className="footer-legal-nav" aria-label="Legal">
            {FOOTER_LEGAL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="footer-legal-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav className="footer-promo-logos" aria-label="Partner links">
          {FOOTER_PARTNER_LINKS.map((item) => {
            return (
              <a
                key={item.href}
                href={item.href}
                className="footer-promo-logo-link"
                aria-label={item.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="footer-promo-logo-frame">
                  <img
                    src={item.src}
                    alt={item.label}
                    className="footer-promo-logo-img"
                    loading="lazy"
                  />
                </span>
                <span className="sr-only">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
