"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { isAdminUser } from "../lib/authz";
import { primaryNav, siteMeta, utilityNav } from "../lib/site-data";
import { ModalLightbox } from "./modal-lightbox";
import { CalloutVisibilityToggle } from "./callout-visibility-toggle";
import { RouteSidebarToggle } from "./route-sidebar-toggle";
import { SiteBackgroundOpacitySlider } from "./site-background-opacity-slider";

/** Static brand logo (see public/images/nma-logo.png) */
const BRAND_LOGO_SRC = "/images/nma-logo.png";
const HIDDEN_PRIMARY_NAV_HREFS = new Set(["/downloaded-assets"]);

function normalizeNavHref(href = "") {
  const normalizedHref = String(href || "").trim();

  if (normalizedHref.startsWith("/file/")) {
    return `/_downloaded${normalizedHref}--asset`;
  }

  if (normalizedHref.startsWith("/sites/default/files/")) {
    return `/_downloaded${normalizedHref}`;
  }

  return normalizedHref;
}

function isAppRouteHref(href = "") {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return false;
  }

  // Treat file-like paths as static assets, not app routes.
  if (/\.[a-z0-9]+(?:$|[?#])/i.test(href)) {
    return false;
  }

  return true;
}

/**
 * Tennessee Credit Union member PDF — match nav (`/...`), mirrored body
 * (`/sites/default/files/...` or absolute nashvillemusicians.org URLs after build rewrite).
 */
function isTtcuPdfLinkHref(href = "") {
  if (!href || href.startsWith("#")) return false;
  let pathname = href;
  try {
    pathname = new URL(href, "https://placeholder.local").pathname;
  } catch {
    return false;
  }
  if (!/\.pdf$/i.test(pathname.replace(/[?#].*$/, ""))) return false;
  try {
    return decodeURIComponent(pathname).includes("300210 TTCU Look Services_MAIN.pdf");
  } catch {
    return pathname.includes("TTCU") && pathname.includes("Look%20Services_MAIN");
  }
}

/** Use local mirror in the iframe (same-origin) when the href pointed at Drupal `/sites/default/files/`. */
function localTtcuPdfIframeSrc(href, baseUrl) {
  try {
    const u = new URL(href, baseUrl);
    const path = u.pathname;
    const suffix = `${u.search}${u.hash}`;
    if (path.startsWith("/sites/default/files/")) {
      return `/_downloaded${path}${suffix}`;
    }
    return `${path}${suffix}`;
  } catch {
    return href;
  }
}

function SmartNavLink({ href, className, children, onNavigate, onPdfLightbox }) {
  const normalizedHref = normalizeNavHref(href);

  function handleClick(e) {
    if (onPdfLightbox && isTtcuPdfLinkHref(normalizedHref)) {
      e.preventDefault();
      const title = typeof children === "string" ? children : "Document";
      onPdfLightbox({ url: normalizedHref, title });
    }
    onNavigate?.();
  }

  if (!normalizedHref) {
    return <span className={className}>{children}</span>;
  }

  if (isAppRouteHref(normalizedHref)) {
    return (
      <Link href={normalizedHref} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={normalizedHref} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

function NavList({ items, depth = 0, onNavigate, onPdfLightbox, activePath }) {
  const listClassName = depth === 0 ? "main-nav-list" : "sub-nav";
  const linkClassName = depth === 0 ? "nav-link" : "sub-nav-link";

  return (
    <ul className={listClassName}>
      {items.map((item) => (
        <li
          key={`${depth}-${item.label}-${item.href}`}
          className={`nav-item ${activePath === item.href ? "is-active" : ""}`}
        >
          <SmartNavLink
            href={item.href}
            className={linkClassName}
            onNavigate={onNavigate}
            onPdfLightbox={onPdfLightbox}
          >
            {item.label}
          </SmartNavLink>
          {item.children?.length ? (
            <NavList
              items={item.children}
              depth={depth + 1}
              onNavigate={onNavigate}
              onPdfLightbox={onPdfLightbox}
              activePath={activePath}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader({ initialBackgroundOpacity = 1 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = isAdminUser(session?.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pdfLightbox, setPdfLightbox] = useState(null);
  const joinItem = utilityNav.find((item) => item.label.toLowerCase().includes("join"));
  const visiblePrimaryNav = primaryNav.filter((item) => !HIDDEN_PRIMARY_NAV_HREFS.has(item.href));
  const callbackUrl = (() => {
    const qs = searchParams?.toString();
    return `${pathname || "/"}${qs ? `?${qs}` : ""}`;
  })();
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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
            onClick={() => signOut({ callbackUrl })}
          >
            Sign Out
          </button>
          {isAdmin && pathname !== "/" ? <CalloutVisibilityToggle className="utility-sidebar-toggle" /> : null}
          {isAdmin && pathname !== "/" ? <RouteSidebarToggle className="utility-sidebar-toggle" /> : null}
        </>
      ) : (
        <>
          <SmartNavLink href={signInHref} className="utility-link" onNavigate={onNavigate}>
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

  // Mirrored page body uses raw <a href>; those are not SmartNavLink, so we cancel navigation here.
  useEffect(() => {
    const onDocClickCapture = (e) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !isTtcuPdfLinkHref(href)) return;
      e.preventDefault();
      setPdfLightbox({
        url: localTtcuPdfIframeSrc(href, window.location.href),
        title: anchor.textContent?.trim() || "Document",
      });
    };
    document.addEventListener("click", onDocClickCapture, true);
    return () => document.removeEventListener("click", onDocClickCapture, true);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="brand-band">
        <Link href="/" className="brand-lockup">
          <Image src={BRAND_LOGO_SRC} alt={siteMeta.title} className="brand-mark" width={64} height={64} />
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
        <div className="header-panels__inner">
          <div className="header-panels__nav-stack">
            {utilityNav.length ? (
              <nav className="utility-nav utility-mobile" aria-label="Utility">
                {renderUtilityItems(() => setMenuOpen(false))}
              </nav>
            ) : null}
            {visiblePrimaryNav.length ? (
              <nav
                className="main-nav"
                aria-label="Primary"
                onMouseLeave={() => {
                  const active = document.activeElement;
                  if (active instanceof HTMLElement) {
                    active.blur();
                  }
                }}
              >
                <NavList
                  items={visiblePrimaryNav}
                  onNavigate={() => setMenuOpen(false)}
                  onPdfLightbox={(payload) => {
                    setPdfLightbox(payload);
                    setMenuOpen(false);
                  }}
                  activePath={pathname}
                />
              </nav>
            ) : null}
          </div>
          {isAdmin ? (
            <SiteBackgroundOpacitySlider
              initialOpacity={initialBackgroundOpacity}
              className="header-panels__background-control"
            />
          ) : null}
        </div>
      </div>
      <ModalLightbox
        open={Boolean(pdfLightbox)}
        onClose={() => setPdfLightbox(null)}
        aspectRatio="pdf"
        closeLabel="Close document"
      >
        {pdfLightbox ? (
          <iframe title={pdfLightbox.title} src={pdfLightbox.url} />
        ) : null}
      </ModalLightbox>
    </header>
  );
}
