"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_HERO_HOME } from "../lib/hero-home-defaults.mjs";

function formatNewsDate(route) {
  const match = route.match(/\/(\d{4})-(\d{2})$/);
  if (!match) {
    return "Update";
  }

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useRevealOnScroll(reducedMotion) {
  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) {
      return undefined;
    }

    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!elements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reducedMotion]);
}

function useHeroParallax(reducedMotion) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) {
      return undefined;
    }

    let animationFrame = null;
    const handleMove = (event) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 16;
        const y = (event.clientY / window.innerHeight - 0.5) * 14;
        setParallax({ x, y });
      });
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", handleMove);
    };
  }, [reducedMotion]);

  return parallax;
}

export function HomepageExperience({
  siteMeta,
  siteStats,
  homePage,
  aboutPage,
  joinHref,
  benefits,
  events,
  resources,
  spotlight,
  heroHomeConfig,
}) {
  const { data: session } = useSession();
  const isAdmin = !!session?.user;
  const reducedMotion = useReducedMotion();
  const parallax = useHeroParallax(reducedMotion);
  useRevealOnScroll(reducedMotion);

  const heroTransform = useMemo(
    () =>
      reducedMotion
        ? undefined
        : {
            "--hero-shift-x": `${parallax.x}px`,
            "--hero-shift-y": `${parallax.y}px`,
          },
    [parallax.x, parallax.y, reducedMotion]
  );

  const initialHero = heroHomeConfig
    ? { ...heroHomeConfig, images: [...heroHomeConfig.images] }
    : { ...DEFAULT_HERO_HOME, images: [...DEFAULT_HERO_HOME.images] };
  const [heroImages, setHeroImages] = useState(initialHero.images);
  const [activeIndex, setActiveIndex] = useState(0);
  const [delaySeconds, setDelaySeconds] = useState(initialHero.delaySeconds);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const heroFileInputRef = useRef(null);
  const lastSavedJsonRef = useRef(
    JSON.stringify({ images: initialHero.images, delaySeconds: initialHero.delaySeconds })
  );

  useEffect(() => {
    if (reducedMotion || heroImages.length < 2) return undefined;
    const id = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % heroImages.length),
      delaySeconds * 1000
    );
    return () => clearInterval(id);
  }, [heroImages.length, delaySeconds, reducedMotion]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const payload = { images: heroImages, delaySeconds };
    const nextJson = JSON.stringify(payload);
    if (nextJson === lastSavedJsonRef.current) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSaveError("");
      try {
        const res = await fetch("/api/site-config/hero", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: nextJson,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSaveError(err.error || "Could not save hero settings.");
          return;
        }
        lastSavedJsonRef.current = nextJson;
      } catch {
        setSaveError("Could not save hero settings.");
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [heroImages, delaySeconds, isAdmin]);

  const activeHero = heroImages[activeIndex] || heroImages[0];

  const handleAddImageFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (heroImages.length >= 6) return;

    setUploadBusy(true);
    setSaveError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/site-config/hero/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Upload failed.");
        return;
      }
      if (data.url) {
        setHeroImages((prev) => (prev.length >= 6 ? prev : [...prev, data.url]));
      }
    } catch {
      setSaveError("Upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleRemove = (index) => {
    setHeroImages((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => {
      if (prev > index) return prev - 1;
      if (prev >= (heroImages.length || 1) - 1) return 0;
      return prev;
    });
  };

  return (
    <div className="home-exp" style={heroTransform}>
      <section className="hero-image-block">
        <img
          src={activeHero}
          alt="Nashville musicians performing"
          className="hero-image-bg"
        />
        <div className="hero-image-overlay" />
        <div className="hero-image-content">
          <h1 className="hero-image-title">
            Nashville Musicians
            <span>Association</span>
          </h1>
          <p className="hero-image-sub">AFM Local 257 — Since 1902</p>
        </div>
        {isAdmin ? (
          <div className="hero-thumb-admin">
            <div className="hero-thumb-strip">
              {heroImages.map((src, index) => (
                <div key={src + index} className="hero-thumb">
                  <button
                    type="button"
                    className={`hero-thumb-button${index === activeIndex ? " hero-thumb-active" : ""}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show ${src.split("/").pop()}`}
                  >
                    <img src={src} alt="" />
                  </button>
                  <button
                    type="button"
                    className="hero-thumb-remove"
                    onClick={() => handleRemove(index)}
                    aria-label={`Remove ${src.split("/").pop()}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {heroImages.length < 6 ? (
                <div className="hero-thumb hero-thumb-add-slot">
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={handleAddImageFile}
                  />
                  <button
                    type="button"
                    className="hero-thumb-add-image-btn"
                    disabled={uploadBusy}
                    onClick={() => heroFileInputRef.current?.click()}
                  >
                    <span className="hero-thumb-add-icon" aria-hidden="true">
                      +
                    </span>
                    <span className="hero-thumb-add-label">{uploadBusy ? "Uploading…" : "Add image"}</span>
                  </button>
                </div>
              ) : null}
            </div>
            <div className="hero-admin-controls">
              <label className="hero-admin-field">
                <span>Slide duration (seconds)</span>
                <div className="hero-admin-range">
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  />
                  <strong>{delaySeconds}s</strong>
                </div>
              </label>
              {saveError ? (
                <p className="hero-admin-error" role="alert">
                  {saveError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="hero-block" data-reveal>
        <div className="hero-noise" aria-hidden />
        <div className="hero-glow hero-glow-a" aria-hidden />
        <div className="hero-glow hero-glow-b" aria-hidden />
        <div className="hero-gridline" aria-hidden />

        <div className="hero-content">
          <p className="eyebrow">AFM Local 257 Nashville</p>
          <h1 className="hero-title">
            Built for the musicians
            <span>who keep Nashville moving.</span>
          </h1>
          <p className="hero-text">
            Contracts, advocacy, benefits, and community for session players, gigging artists,
            educators, and working professionals across Music City.
          </p>
          <div className="hero-actions">
            <Link href={joinHref} className="btn btn-primary">
              Become a Member
            </Link>
            <Link href="/member-benefits" className="btn btn-secondary">
              Explore Benefits
            </Link>
          </div>
          <div className="hero-tags">
            <span>Fair Pay</span>
            <span>Contract Support</span>
            <span>Local Community</span>
            <span>Professional Growth</span>
          </div>
        </div>

        <div className="hero-panels">
          <article className="hero-panel">
            <p className="panel-kicker">Membership Reach</p>
            <p className="panel-value">{siteStats.pageCount.toLocaleString()}+</p>
            <p className="panel-copy">Resources, updates, and pages serving Nashville musicians.</p>
          </article>
          <article className="hero-panel">
            <p className="panel-kicker">Right Now</p>
            <h3>Live updates and member-first support</h3>
            <p className="panel-copy">{homePage.summary}</p>
            <Link href="/news-and-events" className="text-link">
              View current programming
            </Link>
          </article>
        </div>
      </section>

      <section className="value-strip" data-reveal>
        <article>
          <p>Advocacy</p>
          <h3>Representation where negotiations happen.</h3>
        </article>
        <article>
          <p>Protection</p>
          <h3>Contracts and standards that back your work.</h3>
        </article>
        <article>
          <p>Community</p>
          <h3>A network of professionals in your local scene.</h3>
        </article>
        <article>
          <p>Opportunity</p>
          <h3>Events, benefits, and pathways for growth.</h3>
        </article>
      </section>

      <section className="section-block benefits-block" data-reveal>
        <div className="section-headline">
          <p className="eyebrow">Membership Benefits</p>
          <h2>Practical advantages for working musicians.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`benefit-card ${index % 3 === 0 ? "benefit-card-wide" : ""}`}
            >
              <p className="benefit-label">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span className="text-link">Open page</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block updates-block" data-reveal>
        <div className="section-headline">
          <p className="eyebrow">Live Programming</p>
          <h2>News, events, and local movement.</h2>
        </div>
        <div className="updates-layout">
          {events[0] ? (
            <Link href={events[0].route} className="featured-update">
              <p className="update-date">{formatNewsDate(events[0].route)}</p>
              <h3>{events[0].title}</h3>
              <p>{events[0].summary}</p>
              <span className="text-link">Read update</span>
            </Link>
          ) : null}
          <div className="updates-list">
            {events.slice(1, 5).map((item) => (
              <Link key={item.route} href={item.route} className="update-item">
                <p className="update-date">{formatNewsDate(item.route)}</p>
                <h4>{item.title}</h4>
                <span className="text-link">Open</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block mission-block" data-reveal>
        <div>
          <p className="eyebrow">About Local 257</p>
          <h2>{aboutPage?.title || "A union rooted in Nashville’s working music culture."}</h2>
          <p>
            {aboutPage?.summary ||
              "We support musicians through representation, fair standards, and a practical community centered on careers in music."}
          </p>
          <Link href="/about-us" className="btn btn-secondary">
            Read the Mission
          </Link>
        </div>
        <aside className="mission-aside">
          <p className="quote">
            “{siteMeta.title} gives artists and players a stronger voice on and off the stage.”
          </p>
          <div className="mission-stat-grid">
            <div>
              <p className="stat-value">{siteStats.mirroredPageCount.toLocaleString()}</p>
              <p className="stat-label">Pages mirrored</p>
            </div>
            <div>
              <p className="stat-value">{siteStats.assetCount.toLocaleString()}</p>
              <p className="stat-label">Member resources</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="section-block resources-block" data-reveal>
        <div className="section-headline">
          <p className="eyebrow">Quick Access</p>
          <h2>Resources you need before the next downbeat.</h2>
        </div>
        <div className="resource-grid">
          {resources.map((item) => (
            <Link href={item.href} key={item.href} className="resource-link-card">
              <span className="resource-status">{item.status}</span>
              <h3>{item.label}</h3>
              <p>{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {spotlight?.length ? (
        <section className="section-block spotlight-block" data-reveal>
          <div className="section-headline">
            <p className="eyebrow">Community Spotlight</p>
            <h2>Built by real players across the city.</h2>
          </div>
          <div className="spotlight-row">
            {spotlight.map((item) => (
              <Link key={item.route} href={item.route} className="spotlight-card">
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <span className="text-link">Explore</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cta-band" data-reveal>
        <div>
          <p className="eyebrow">Ready to Join the Local?</p>
          <h2>Step into a stronger network for your career in music.</h2>
          <p>Membership connects you to protection, opportunities, and a trusted Nashville community.</p>
        </div>
        <div className="cta-actions">
          <Link href={joinHref} className="btn btn-primary">
            Join Nashville Musicians
          </Link>
          <Link href="/member-benefits" className="btn btn-secondary">
            Compare Member Benefits
          </Link>
        </div>
      </section>
    </div>
  );
}
