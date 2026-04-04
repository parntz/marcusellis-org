"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { primaryNav, siteMeta, utilityNav } from "../lib/site-data";

function normalizeNavHref(href = "") {
  if (href.startsWith("/sites/default/files/")) {
    return `/_downloaded${href}`;
  }

  return href;
}

function isAppRouteHref(href = "") {
  if (!href.startsWith("/")) {
    return false;
  }

  if (href.startsWith("/_downloaded/")) {
    return false;
  }

  // Treat file-like paths as static assets, not app routes.
  if (/\.[a-z0-9]+(?:$|[?#])/i.test(href)) {
    return false;
  }

  return true;
}

function SmartNavLink({ href, className, children, onNavigate }) {
  const normalizedHref = normalizeNavHref(href);

  if (isAppRouteHref(normalizedHref)) {
    return (
      <Link href={normalizedHref} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  return (
    <a href={normalizedHref} className={className} onClick={onNavigate}>
      {children}
    </a>
  );
}

function NavList({ items, depth = 0, onNavigate, activePath }) {
  const listClassName = depth === 0 ? "main-nav-list" : "sub-nav";
  const linkClassName = depth === 0 ? "nav-link" : "sub-nav-link";

  return (
    <ul className={listClassName}>
      {items.map((item) => (
        <li
          key={`${depth}-${item.label}-${item.href}`}
          className={`nav-item ${activePath === item.href ? "is-active" : ""}`}
        >
          <SmartNavLink href={item.href} className={linkClassName} onNavigate={onNavigate}>
            {item.label}
          </SmartNavLink>
          {item.children?.length ? (
            <NavList
              items={item.children}
              depth={depth + 1}
              onNavigate={onNavigate}
              activePath={activePath}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const joinItem = utilityNav.find((item) => item.label.toLowerCase().includes("join"));

  const renderUtilityItems = (onNavigate) => (
    <>
      {joinItem ? (
        <SmartNavLink
          key={`${joinItem.label}-${joinItem.href}`}
          href={joinItem.href}
          className="utility-link"
          onNavigate={onNavigate}
        >
          {joinItem.label}
        </SmartNavLink>
      ) : null}
      {session?.user?.id ? (
        <>
          <SmartNavLink href="/account" className="utility-link" onNavigate={onNavigate}>
            Account
          </SmartNavLink>
          <button
            type="button"
            className="utility-link utility-button"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <SmartNavLink href="/sign-in" className="utility-link" onNavigate={onNavigate}>
            Sign In
          </SmartNavLink>
          <SmartNavLink href="/register" className="utility-link" onNavigate={onNavigate}>
            Register
          </SmartNavLink>
        </>
      )}
    </>
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="brand-band">
        <Link href="/" className="brand-lockup">
          {siteMeta.logoImage ? (
            <img src={siteMeta.logoImage} alt={siteMeta.title} className="brand-mark" />
          ) : null}
          <div>
            <p className="brand-kicker">{siteMeta.kicker}</p>
            <h1 className="brand-name">{siteMeta.title}</h1>
          </div>
        </Link>
        <div className="brand-actions">
          {utilityNav.length ? (
            <nav className="utility-nav utility-desktop" aria-label="Utility">
              {renderUtilityItems(() => setMenuOpen(false))}
            </nav>
          ) : null}
          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>
      <div className={`header-panels ${menuOpen ? "is-open" : ""}`} id="primary-navigation">
        {utilityNav.length ? (
          <nav className="utility-nav utility-mobile" aria-label="Utility">
            {renderUtilityItems(() => setMenuOpen(false))}
          </nav>
        ) : null}
        {primaryNav.length ? (
          <nav className="main-nav" aria-label="Primary">
            <NavList items={primaryNav} onNavigate={() => setMenuOpen(false)} activePath={pathname} />
          </nav>
        ) : null}
      </div>
    </header>
  );
}
