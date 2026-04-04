"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LegacyHomeHero({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slides?.length) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  if (!slides?.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];

  return (
    <section className="legacy-hero">
      <div className="legacy-hero-frame">
        {activeSlide.image ? (
          <div className="legacy-hero-image-wrap">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="legacy-hero-image"
            />
          </div>
        ) : null}
        <div className="legacy-hero-overlay">
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.body}</p>
          {activeSlide.ctaLabel ? (
            <Link href={activeSlide.href} className="legacy-hero-cta">
              <span>{activeSlide.ctaLabel}</span>
              <img
                src="/images/slide-learn-more.png"
                alt=""
                width="129"
                height="29"
              />
            </Link>
          ) : null}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="legacy-hero-pager" aria-label="Homepage highlights">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeIndex ? "legacy-hero-dot is-active" : "legacy-hero-dot"}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${slide.title}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
