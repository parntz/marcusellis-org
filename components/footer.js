import Link from "next/link";
import { siteMeta } from "../lib/site-data";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <p className="footer-title">{siteMeta.title}</p>
          <p className="footer-copy">Your tagline here</p>
          <Link href="/sign-in" className="btn btn-primary footer-cta">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
