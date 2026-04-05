import Image from "next/image";
import Link from "next/link";
import { primaryNav, siteMeta, utilityNav } from "../lib/site-data";

/** Legacy Drupal promo tiles from `public/images/` (same art as nashvillemusicians.org). */
const FOOTER_LOGO_LINKS = [
  {
    href: "/donate-here-plus-assistance-info-musicians",
    label: "Donate",
    src: "/images/slide-donate.jpeg",
    width: 160,
    height: 80,
  },
  {
    href: "/live-music",
    label: "Live music",
    src: "/images/slide-live-music.jpg",
    width: 160,
    height: 80,
  },
  {
    href: "/nashville-musician-magazine",
    label: "Magazine",
    src: "/images/slide-magazine.png",
    width: 160,
    height: 80,
  },
  {
    href: null,
    label: "Join",
    src: "/images/slide-join.jpeg",
    width: 160,
    height: 80,
  },
];

export function Footer() {
  const quickNav = primaryNav.slice(0, 6);
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
        </div>

        <nav className="footer-nav" aria-label="Footer">
          {quickNav.map((item) => (
            <Link key={item.href} href={item.href} className="footer-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="footer-promo-logos" aria-label="Featured links">
          {FOOTER_LOGO_LINKS.map((item) => {
            const href = item.href ?? memberAction;
            return (
              <Link key={href} href={href} className="footer-promo-logo-link" aria-label={item.label}>
                <span className="footer-promo-logo-frame">
                  <Image
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    className="footer-promo-logo-img"
                    sizes="80px"
                  />
                </span>
                <span className="footer-promo-logo-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
