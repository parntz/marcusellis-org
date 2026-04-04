import Link from "next/link";
import { primaryNav, siteMeta, siteStats, utilityNav } from "../lib/site-data";

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
        <div className="footer-stats">
          <p>{siteStats.mirroredPageCount.toLocaleString()} mirrored pages</p>
          <p>{siteStats.assetCount.toLocaleString()} downloadable assets</p>
          <p>{siteStats.pageCount.toLocaleString()} total pages indexed</p>
        </div>
      </div>
    </footer>
  );
}
