"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_HERO_HOME,
  growSliderToDurationSeconds,
} from "../lib/hero-home-defaults.mjs";

/** After moving one item from `from` to `to`, map an index that pointed at a slide before the move. */
function mapIndexAfterReorder(oldIndex, from, to) {
  if (oldIndex === from) return to;
  if (from < to) {
    if (oldIndex > from && oldIndex <= to) return oldIndex - 1;
  } else if (from > to) {
    if (oldIndex >= to && oldIndex < from) return oldIndex + 1;
  }
  return oldIndex;
}

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

/**
 * Negative delay (ms) so the incoming hero matches the outgoing animation phase (grow vs shrink).
 * Uses Web Animations API when available.
 */
function getHeroAnimationSyncDelayMs(el) {
  if (!el || typeof window === "undefined") return 0;
  const tag = el.tagName?.toLowerCase();
  const img = tag === "img" ? el : el.querySelector?.("img");
  if (!img || typeof img.getAnimations !== "function") return 0;

  const anims = img.getAnimations();
  for (const anim of anims) {
    const name = anim.animationName;
    if (name && name !== "hero-grow-zoom") continue;
    if (anim.playState !== "running" && anim.playState !== "pending") continue;
    const eff = anim.effect;
    if (!eff || eff.constructor?.name !== "KeyframeEffect") continue;
    const timing = eff.getTiming?.();
    if (!timing) continue;
    let dur = timing.duration;
    if (typeof dur === "string") {
      const n = parseFloat(dur);
      dur = Number.isFinite(n) ? n : 0;
    }
    if (!dur || dur <= 0) continue;
    const ct = anim.currentTime;
    if (ct == null || !Number.isFinite(Number(ct))) continue;
    const ctMs = Number(ct);
    const mod = ((ctMs % dur) + dur) % dur;
    return -mod;
  }
  return 0;
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

/**
 * Hero zoom starts after load. Optional animationDelayMs sets --hero-animation-delay (negative ms)
 * so the incoming slide matches the outgoing slide’s oscillating zoom phase at crossfade.
 */
const HeroImageWithGrow = forwardRef(function HeroImageWithGrow(
  { src, alt, className, style, growEnabled, animationDelayMs },
  ref
) {
  const [armed, setArmed] = useState(false);
  const imgRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      imgRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    setArmed(false);
  }, [src]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) {
      return undefined;
    }
    if (el.complete && el.naturalWidth > 0) {
      setArmed(true);
    }
    return undefined;
  }, [src]);

  const handleLoad = useCallback(() => {
    setArmed(true);
  }, []);

  const zoomClass = growEnabled && armed ? "hero-image-bg--grow" : "";

  const mergedStyle = useMemo(() => {
    const base = { ...(style || {}) };
    if (animationDelayMs != null && Number.isFinite(animationDelayMs)) {
      base["--hero-animation-delay"] = `${animationDelayMs}ms`;
    }
    return base;
  }, [style, animationDelayMs]);

  return (
    <Image
      ref={setRefs}
      src={src}
      alt={alt}
      className={[className, zoomClass].filter(Boolean).join(" ")}
      style={mergedStyle}
      onLoadingComplete={handleLoad}
      width={1600}
      height={900}
      priority
    />
  );
});

HeroImageWithGrow.displayName = "HeroImageWithGrow";

const HERO_TEXT_GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];

function pickRandomHeroTextGlassVariant(current = HERO_TEXT_GLASS_VARIANTS[0]) {
  const options = HERO_TEXT_GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
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
  homeHeroTextConfig,
}) {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && Boolean(session?.user);
  const reducedMotion = useReducedMotion();
  useRevealOnScroll(reducedMotion);

  const initialHero = heroHomeConfig
    ? {
        ...DEFAULT_HERO_HOME,
        ...heroHomeConfig,
        images: [...heroHomeConfig.images],
        delaySeconds: heroHomeConfig.delaySeconds ?? DEFAULT_HERO_HOME.delaySeconds,
        transitionSeconds:
          heroHomeConfig.transitionSeconds ?? DEFAULT_HERO_HOME.transitionSeconds,
        growSlider: heroHomeConfig.growSlider ?? DEFAULT_HERO_HOME.growSlider,
      }
    : { ...DEFAULT_HERO_HOME, images: [...DEFAULT_HERO_HOME.images] };
  const [heroImages, setHeroImages] = useState(initialHero.images);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(initialHero.delaySeconds);
  const [transitionSeconds, setTransitionSeconds] = useState(initialHero.transitionSeconds);
  const [growSlider, setGrowSlider] = useState(initialHero.growSlider);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [heroTextEditorOpen, setHeroTextEditorOpen] = useState(false);
  const [heroTextSaveBusy, setHeroTextSaveBusy] = useState(false);
  const [heroTextError, setHeroTextError] = useState("");
  const heroFileInputRef = useRef(null);
  const slotARef = useRef(null);
  const slotBRef = useRef(null);
  const activeSlotRef = useRef("a");
  const visibleRef = useRef(0);
  const pendingRef = useRef(false);

  const len = heroImages.length;
  const [slotAIdx, setSlotAIdx] = useState(0);
  const [slotBIdx, setSlotBIdx] = useState(() => (len > 1 ? 1 : 0));
  const [activeSlot, setActiveSlot] = useState("a");
  const [slotAAnimDelayMs, setSlotAAnimDelayMs] = useState(null);
  const [slotBAnimDelayMs, setSlotBAnimDelayMs] = useState(null);
  const lastSavedJsonRef = useRef(
    JSON.stringify({
      images: initialHero.images,
      delaySeconds: initialHero.delaySeconds,
      transitionSeconds: initialHero.transitionSeconds,
      growSlider: initialHero.growSlider,
    })
  );
  const initialHeroText = {
    titleLine1: String(homeHeroTextConfig?.titleLine1 || "Nashville Musicians"),
    titleLine2: String(homeHeroTextConfig?.titleLine2 || "Association"),
    subheading: String(homeHeroTextConfig?.subheading || "AFM Local 257 — Since 1902"),
  };
  const [heroTitleLine1, setHeroTitleLine1] = useState(initialHeroText.titleLine1);
  const [heroTitleLine2, setHeroTitleLine2] = useState(initialHeroText.titleLine2);
  const [heroSubheading, setHeroSubheading] = useState(initialHeroText.subheading);
  const [heroTitleLine1Draft, setHeroTitleLine1Draft] = useState(initialHeroText.titleLine1);
  const [heroTitleLine2Draft, setHeroTitleLine2Draft] = useState(initialHeroText.titleLine2);
  const [heroSubheadingDraft, setHeroSubheadingDraft] = useState(initialHeroText.subheading);
  const [heroTextOverlayActive, setHeroTextOverlayActive] = useState(false);
  const [heroTextGlassVariant, setHeroTextGlassVariant] = useState(HERO_TEXT_GLASS_VARIANTS[0]);
  const [heroTextGlassCycle, setHeroTextGlassCycle] = useState(0);

  useEffect(() => {
    visibleRef.current = visibleIndex;
  }, [visibleIndex]);

  useEffect(() => {
    pendingRef.current = pendingIndex !== null;
  }, [pendingIndex]);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  const useDualSlotHero =
    heroImages.length >= 2 && !reducedMotion && transitionSeconds > 0;

  const prevHeroLenRef = useRef(heroImages.length);
  useEffect(() => {
    if (heroImages.length < 2) {
      prevHeroLenRef.current = heroImages.length;
      return;
    }
    if (prevHeroLenRef.current === heroImages.length) return;
    prevHeroLenRef.current = heroImages.length;
    const v = Math.min(visibleRef.current, heroImages.length - 1);
    setVisibleIndex(v);
    setSlotAIdx(v);
    setSlotBIdx((v + 1) % heroImages.length);
    setActiveSlot("a");
    setSlotAAnimDelayMs(null);
    setSlotBAnimDelayMs(null);
  }, [heroImages.length]);

  const useDualSlotHeroRef = useRef(useDualSlotHero);
  useEffect(() => {
    useDualSlotHeroRef.current = useDualSlotHero;
  }, [useDualSlotHero]);
  const heroLenRef = useRef(heroImages.length);
  useEffect(() => {
    heroLenRef.current = heroImages.length;
  }, [heroImages.length]);

  useEffect(() => {
    if (reducedMotion || heroImages.length < 2) return undefined;
    const id = setInterval(() => {
      if (pendingRef.current) return;
      const n = heroImages.length;
      setPendingIndex((visibleRef.current + 1) % n);
    }, delaySeconds * 1000);
    return () => clearInterval(id);
  }, [heroImages.length, delaySeconds, reducedMotion]);

  useLayoutEffect(() => {
    if (pendingIndex === null || !useDualSlotHero) return;
    const slot = activeSlot;
    const inactive = slot === "a" ? "b" : "a";
    if (inactive === "a") {
      setSlotAIdx((idx) => (idx === pendingIndex ? idx : pendingIndex));
    } else {
      setSlotBIdx((idx) => (idx === pendingIndex ? idx : pendingIndex));
    }
    const outgoingRef = slot === "a" ? slotARef : slotBRef;
    const incomingSlot = slot === "a" ? "b" : "a";
    let raf2 = null;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const delayMs = getHeroAnimationSyncDelayMs(outgoingRef.current);
        if (incomingSlot === "a") setSlotAAnimDelayMs(delayMs);
        else setSlotBAnimDelayMs(delayMs);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [pendingIndex, useDualSlotHero, activeSlot]);

  useEffect(() => {
    if (pendingIndex === null) {
      setFadeOut(false);
      return undefined;
    }
    if (transitionSeconds <= 0) {
      setVisibleIndex(pendingIndex);
      setPendingIndex(null);
      return undefined;
    }
    setFadeOut(false);
    let innerRaf = null;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setFadeOut(true));
    });
    const ms = Math.max(0, transitionSeconds * 1000);
    const doneIndex = pendingIndex;
    const t = setTimeout(() => {
      setVisibleIndex(doneIndex);
      setPendingIndex(null);
      setFadeOut(false);
      const lenNow = heroLenRef.current;
      if (useDualSlotHeroRef.current && lenNow >= 2) {
        const outgoingWas = activeSlotRef.current;
        setActiveSlot(outgoingWas === "a" ? "b" : "a");
        const preloadIdx = (doneIndex + 1) % lenNow;
        if (outgoingWas === "a") {
          setSlotAIdx(preloadIdx);
          setSlotAAnimDelayMs(null);
        } else {
          setSlotBIdx(preloadIdx);
          setSlotBAnimDelayMs(null);
        }
      }
    }, ms);
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
      clearTimeout(t);
    };
  }, [pendingIndex, transitionSeconds]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const payload = { images: heroImages, delaySeconds, transitionSeconds, growSlider };
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
  }, [heroImages, delaySeconds, transitionSeconds, growSlider, isAdmin]);

  const growDurationSec = useMemo(
    () => growSliderToDurationSeconds(growSlider),
    [growSlider]
  );
  const growZoomEnabled = Boolean(!reducedMotion && growDurationSec != null);

  const thumbActive = pendingIndex !== null ? pendingIndex : visibleIndex;

  const { opA, opB, zA, zB } = useMemo(() => {
    if (pendingIndex === null) {
      return {
        opA: activeSlot === "a" ? 1 : 0,
        opB: activeSlot === "b" ? 1 : 0,
        zA: 1,
        zB: 1,
      };
    }
    const outgoing = fadeOut ? 0 : 1;
    const incoming = fadeOut ? 1 : 0;
    const incomingSlot = activeSlot === "a" ? "b" : "a";
    return {
      opA: activeSlot === "a" ? outgoing : incoming,
      opB: activeSlot === "b" ? outgoing : incoming,
      zA: incomingSlot === "a" ? 2 : 1,
      zB: incomingSlot === "b" ? 2 : 1,
    };
  }, [activeSlot, pendingIndex, fadeOut]);

  const safeSlotA = len > 0 ? Math.min(Math.max(0, slotAIdx), len - 1) : 0;
  const safeSlotB = len > 0 ? Math.min(Math.max(0, slotBIdx), len - 1) : 0;

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
    setPendingIndex(null);
    setHeroImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setVisibleIndex((v) => {
        if (v > index) return v - 1;
        if (v >= next.length) return Math.max(0, next.length - 1);
        return v;
      });
      return next;
    });
  };

  const openHeroTextEditor = useCallback(async () => {
    setHeroTextError("");
    try {
      const res = await fetch("/api/site-config/home-hero-text", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not load hero text.");
      }
      setHeroTitleLine1(String(data.titleLine1 || ""));
      setHeroTitleLine2(String(data.titleLine2 || ""));
      setHeroSubheading(String(data.subheading || ""));
      setHeroTitleLine1Draft(String(data.titleLine1 || ""));
      setHeroTitleLine2Draft(String(data.titleLine2 || ""));
      setHeroSubheadingDraft(String(data.subheading || ""));
    } catch (err) {
      setHeroTextError(err instanceof Error ? err.message : "Could not load hero text.");
      setHeroTitleLine1Draft(heroTitleLine1);
      setHeroTitleLine2Draft(heroTitleLine2);
      setHeroSubheadingDraft(heroSubheading);
    } finally {
      setHeroTextEditorOpen(true);
    }
  }, [heroSubheading, heroTitleLine1, heroTitleLine2]);

  const saveHeroText = useCallback(
    async (event) => {
      event.preventDefault();
      setHeroTextSaveBusy(true);
      setHeroTextError("");
      try {
        const res = await fetch("/api/site-config/home-hero-text", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleLine1: heroTitleLine1Draft,
            titleLine2: heroTitleLine2Draft,
            subheading: heroSubheadingDraft,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not save hero text.");
        }
        setHeroTitleLine1(String(data.titleLine1 || ""));
        setHeroTitleLine2(String(data.titleLine2 || ""));
        setHeroSubheading(String(data.subheading || ""));
        setHeroTextEditorOpen(false);
      } catch (err) {
        setHeroTextError(err instanceof Error ? err.message : "Could not save hero text.");
      } finally {
        setHeroTextSaveBusy(false);
      }
    },
    [heroSubheadingDraft, heroTitleLine1Draft, heroTitleLine2Draft]
  );

  const triggerHeroTextGlass = useCallback(() => {
    setHeroTextGlassVariant((current) => pickRandomHeroTextGlassVariant(current));
    setHeroTextGlassCycle((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !heroTextOverlayActive) return undefined;
    triggerHeroTextGlass();
    const id = window.setInterval(triggerHeroTextGlass, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, heroTextOverlayActive, triggerHeroTextGlass]);

  const handleHeroDragStart = useCallback((e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }, []);

  const handleHeroDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleHeroDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleHeroDrop = useCallback(
    (e, toIndex) => {
      e.preventDefault();
      const fromIndex = Number(e.dataTransfer.getData("text/plain"));
      if (Number.isNaN(fromIndex) || fromIndex === toIndex) {
        handleHeroDragEnd();
        return;
      }
      setHeroImages((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
      setVisibleIndex((v) => mapIndexAfterReorder(v, fromIndex, toIndex));
      setPendingIndex((p) =>
        p === null ? null : mapIndexAfterReorder(p, fromIndex, toIndex)
      );
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [handleHeroDragEnd]
  );

  return (
    <div className="home-exp">
      <section
        className="hero-image-block"
        style={{
          ...(growDurationSec != null
            ? { "--hero-grow-duration": `${growDurationSec}s` }
            : {}),
          ...(transitionSeconds > 0 ? { "--hero-transition-duration": `${transitionSeconds}s` } : {}),
        }}
      >
        <div className="hero-image-bg-holder">
          {useDualSlotHero ? (
            <div className="hero-image-bg-stack">
              <HeroImageWithGrow
                ref={slotARef}
                key="hero-slot-a"
                src={heroImages[safeSlotA]}
                alt=""
                className="hero-image-bg hero-image-bg-layer"
                style={{ opacity: opA, zIndex: zA }}
                growEnabled={growZoomEnabled}
                animationDelayMs={slotAAnimDelayMs}
              />
              <HeroImageWithGrow
                ref={slotBRef}
                key="hero-slot-b"
                src={heroImages[safeSlotB]}
                alt=""
                className="hero-image-bg hero-image-bg-layer"
                style={{ opacity: opB, zIndex: zB }}
                growEnabled={growZoomEnabled}
                animationDelayMs={slotBAnimDelayMs}
              />
            </div>
          ) : (
            <HeroImageWithGrow
              src={heroImages[visibleIndex] || heroImages[0]}
              alt="Nashville musicians performing"
              className="hero-image-bg"
              growEnabled={growZoomEnabled}
            />
          )}
        </div>
        <div className="hero-image-overlay" />
        <div
          className={`hero-image-content${isAdmin ? " hero-image-content--admin-editable" : ""}`}
          role={isAdmin ? "button" : undefined}
          tabIndex={isAdmin ? 0 : undefined}
          aria-label={isAdmin ? "Edit homepage hero text" : undefined}
          onClick={isAdmin ? () => void openHeroTextEditor() : undefined}
          onKeyDown={
            isAdmin
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openHeroTextEditor();
                  }
                }
              : undefined
          }
          onMouseEnter={() => {
            if (isAdmin) setHeroTextOverlayActive(true);
          }}
          onMouseLeave={() => setHeroTextOverlayActive(false)}
          onFocusCapture={() => {
            if (isAdmin) setHeroTextOverlayActive(true);
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHeroTextOverlayActive(false);
            }
          }}
        >
          <h1 className="hero-image-title">
            {heroTitleLine1}
            <span>{heroTitleLine2}</span>
          </h1>
          <p className="hero-image-sub">{heroSubheading}</p>
          {isAdmin ? (
            <span
              className="hero-image-content__admin-overlay"
              aria-hidden="true"
              data-active={heroTextOverlayActive ? "true" : "false"}
            >
              <span className="hero-image-content__admin-overlay__wash">
                {heroTextOverlayActive ? (
                  <span
                    key={`hero-text-glass-${heroTextGlassVariant}-${heroTextGlassCycle}`}
                    className={`hero-image-content__admin-overlay__glass hero-image-content__admin-overlay__glass--${heroTextGlassVariant}`}
                  />
                ) : null}
              </span>
            </span>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="hero-thumb-admin">
            <div className="hero-thumb-strip">
              {heroImages.map((src, index) => (
                <div
                  key={src}
                  className={`hero-thumb${dragIndex === index ? " hero-thumb-dragging" : ""}${
                    dragOverIndex === index && dragIndex !== index ? " hero-thumb-drag-over" : ""
                  }`}
                  draggable
                  aria-grabbed={dragIndex === index}
                  onDragStart={(e) => handleHeroDragStart(e, index)}
                  onDragEnd={handleHeroDragEnd}
                  onDragOver={(e) => handleHeroDragOver(e, index)}
                  onDrop={(e) => handleHeroDrop(e, index)}
                  title="Drag to reorder slides"
                >
                  <button
                    type="button"
                    className={`hero-thumb-button${index === thumbActive ? " hero-thumb-active" : ""}`}
                    onClick={() => {
                      if (index === visibleIndex && pendingIndex === null) return;
                      setPendingIndex(index);
                    }}
                    aria-label={`Show ${src.split("/").pop()}`}
                  >
                    <Image src={src} alt="" draggable={false} width={160} height={90} />
                  </button>
                  <button
                    type="button"
                    className="hero-thumb-remove"
                    draggable={false}
                    onDragStart={(e) => e.stopPropagation()}
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
                <span>Seconds between slides</span>
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
              <label className="hero-admin-field">
                <span>Transition duration (seconds)</span>
                <div className="hero-admin-range">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={transitionSeconds}
                    onChange={(e) => setTransitionSeconds(Number(e.target.value))}
                  />
                  <strong>{transitionSeconds === 0 ? "Off (instant)" : `${transitionSeconds}s`}</strong>
                </div>
              </label>
              <label className="hero-admin-field">
                <span>Grow zoom speed</span>
                <div className="hero-admin-range">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={growSlider}
                    onChange={(e) => setGrowSlider(Number(e.target.value))}
                  />
                  <strong>
                    {growSlider === 0
                      ? "Off"
                      : `${growDurationSec != null ? growDurationSec.toFixed(1) : "—"}s`}
                  </strong>
                </div>
              </label>
              <button type="button" className="btn btn-ghost" onClick={() => void openHeroTextEditor()}>
                Edit hero text
              </button>
              {saveError ? (
                <p className="hero-admin-error" role="alert">
                  {saveError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {heroTextEditorOpen ? (
        <div
          className="page-header-editor-backdrop"
          role="presentation"
          onClick={() => !heroTextSaveBusy && setHeroTextEditorOpen(false)}
        >
          <div
            className="page-header-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit homepage hero text"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="page-header-editor-modal__header">
              <p className="gigs-admin__eyebrow">Admin</p>
              <h3>Edit Hero Text</h3>
            </div>
            <form className="page-header-editor-form" onSubmit={saveHeroText}>
              <label>
                Title line 1
                <input
                  type="text"
                  value={heroTitleLine1Draft}
                  onChange={(event) => setHeroTitleLine1Draft(event.target.value)}
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Title line 2
                <input
                  type="text"
                  value={heroTitleLine2Draft}
                  onChange={(event) => setHeroTitleLine2Draft(event.target.value)}
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Subheading
                <input
                  type="text"
                  value={heroSubheadingDraft}
                  onChange={(event) => setHeroSubheadingDraft(event.target.value)}
                  maxLength={220}
                  required
                />
              </label>
              {heroTextError ? <p className="hero-admin-error">{heroTextError}</p> : null}
              <div className="page-header-editor-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setHeroTextEditorOpen(false)}
                  disabled={heroTextSaveBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={heroTextSaveBusy}>
                  {heroTextSaveBusy ? "Saving..." : "Save Hero Text"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
