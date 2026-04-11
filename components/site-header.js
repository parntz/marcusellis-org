"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
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

function isPdfHref(href = "") {
  if (!href || String(href).trim().startsWith("#")) return false;
  try {
    const pathname = new URL(String(href).trim(), "https://placeholder.local").pathname;
    return /\.pdf$/i.test(pathname.replace(/[?#].*$/, ""));
  } catch {
    return false;
  }
}

function resolvePdfHref(href = "", baseUrl = "https://placeholder.local") {
  const rawHref = String(href || "").trim();
  if (!rawHref) return "";

  try {
    const base = new URL(baseUrl, "https://placeholder.local");
    const url = new URL(rawHref, base);
    let pathname = url.pathname;

    if (pathname.startsWith("/file/")) {
      pathname = `/_downloaded${pathname}--asset`;
    } else if (pathname.startsWith("/sites/default/files/")) {
      pathname = `/_downloaded${pathname}`;
    }

    const isMirroredDrupalHost = /(^|\.)nashvillemusicians\.org$/i.test(url.hostname);
    const isCurrentOrigin = url.origin === base.origin;

    if (isMirroredDrupalHost || isCurrentOrigin) {
      return `${pathname}${url.search}${url.hash}`;
    }

    return `${url.origin}${pathname}${url.search}${url.hash}`;
  } catch {
    return normalizeNavHref(rawHref);
  }
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

function SmartNavLink({ href, className, children, onNavigate }) {
  const normalizedHref = normalizeNavHref(href);
  const pdfHref = isPdfHref(normalizedHref);

  function handleClick(e) {
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
    <a
      href={normalizedHref}
      className={className}
      onClick={handleClick}
      target={pdfHref ? "_blank" : undefined}
      rel={pdfHref ? "noopener noreferrer" : undefined}
    >
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
          <SmartNavLink
            href={item.href}
            className={linkClassName}
            onNavigate={onNavigate}
          >
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

function SiteHeaderContent({ initialBackgroundOpacity = 1 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = isAdminUser(session?.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pdfPrompt, setPdfPrompt] = useState(null);
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

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function applyPdfLinkAttrs(root) {
      if (!(root instanceof Element) && !(root instanceof Document)) return;
      root.querySelectorAll("a[href]").forEach((anchor) => {
        const href = anchor.getAttribute("href");
        if (!isPdfHref(href)) return;
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      });
    }

    applyPdfLinkAttrs(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof Element && mutation.type === "attributes" && mutation.target.matches("a[href]")) {
          applyPdfLinkAttrs(mutation.target);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            applyPdfLinkAttrs(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  // Sitewide PDF speed bump: intercept regular clicks and open PDFs in a new tab after confirmation.
  useEffect(() => {
    const onDocClickCapture = (e) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!isPdfHref(href)) return;
      e.preventDefault();
      setPdfPrompt({
        url: resolvePdfHref(href, window.location.href),
        title: anchor.textContent?.trim() || "PDF Document",
      });
    };
    document.addEventListener("click", onDocClickCapture, true);
    return () => document.removeEventListener("click", onDocClickCapture, true);
  }, []);

  function openPdfInNewTab() {
    if (!pdfPrompt?.url) return;
    window.open(pdfPrompt.url, "_blank", "noopener,noreferrer");
    setPdfPrompt(null);
  }

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
        open={Boolean(pdfPrompt)}
        onClose={() => setPdfPrompt(null)}
        closeLabel="Close PDF notice"
      >
        {pdfPrompt ? (
          <div className="pdf-speedbump">
            <p className="pdf-speedbump__eyebrow">PDF Link</p>
            <h2>Open document in a new tab?</h2>
            <p className="pdf-speedbump__body">
              {pdfPrompt.title || "This PDF"} will open in a separate browser tab so you do not lose your place on
              the site.
            </p>
            <div className="pdf-speedbump__actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPdfPrompt(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={openPdfInNewTab}>
                Open PDF
              </button>
            </div>
          </div>
        ) : null}
      </ModalLightbox>
    </header>
  );
}

export function SiteHeader({ initialBackgroundOpacity = 1 }) {
  return (
    <Suspense fallback={<header className="site-header" aria-hidden />}>
      <SiteHeaderContent initialBackgroundOpacity={initialBackgroundOpacity} />
    </Suspense>
  );
}
