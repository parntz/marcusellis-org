"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_HERO_HOME, growSliderToDurationSeconds } from "../lib/hero-home-defaults.mjs";

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

export function HomepageHeroOnly({ heroHomeConfig = null, homeHeroTextConfig = null }) {
  const reducedMotion = useReducedMotion();
  const images = Array.isArray(heroHomeConfig?.images) && heroHomeConfig.images.length
    ? heroHomeConfig.images
    : DEFAULT_HERO_HOME.images;
  const delaySeconds =
    typeof heroHomeConfig?.delaySeconds === "number" && heroHomeConfig.delaySeconds > 0
      ? heroHomeConfig.delaySeconds
      : DEFAULT_HERO_HOME.delaySeconds;
  const growDurationSec = growSliderToDurationSeconds(
    typeof heroHomeConfig?.growSlider === "number" ? heroHomeConfig.growSlider : DEFAULT_HERO_HOME.growSlider
  );
  const growZoomEnabled = !reducedMotion && growDurationSec != null;

  const heroTitleLine1 = String(homeHeroTextConfig?.titleLine1 || "Huge tagline here!");
  const heroTitleLine2 = String(homeHeroTextConfig?.titleLine2 || "Serving your community");
  const heroSubheading = String(homeHeroTextConfig?.subheading || "since 1902");
  const heroLinkHref = String(homeHeroTextConfig?.linkHref || "").trim();

  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    setVisibleIndex(0);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1 || delaySeconds <= 0) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setVisibleIndex((current) => (current + 1) % images.length);
    }, delaySeconds * 1000);

    return () => window.clearInterval(id);
  }, [images, delaySeconds]);

  const heroStyle = useMemo(
    () => ({
      ...(growDurationSec != null ? { "--hero-grow-duration": `${growDurationSec}s` } : {}),
    }),
    [growDurationSec]
  );

  const heroVisual = (
    <>
      <h1 className="hero-image-title">
        {heroTitleLine1}
        <span>{heroTitleLine2}</span>
      </h1>
      <p className="hero-image-sub">{heroSubheading}</p>
    </>
  );

  return (
    <div className="home-exp">
      <section className="hero-image-block" style={heroStyle}>
        <div className="hero-image-bg-holder">
          <Image
            key={images[visibleIndex] || images[0]}
            src={images[visibleIndex] || images[0]}
            alt="Homepage hero"
            className={`hero-image-bg${growZoomEnabled ? " hero-image-bg--grow" : ""}`}
            width={1600}
            height={900}
            priority
          />
        </div>
        <div className="hero-image-overlay" />
        <div className="hero-image-content">
          {heroLinkHref ? (
            <Link href={heroLinkHref} className="hero-image-link">
              {heroVisual}
            </Link>
          ) : (
            heroVisual
          )}
        </div>
      </section>
    </div>
  );
}
