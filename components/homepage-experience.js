"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
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
import { DEFAULT_HOME_HERO_CONTENT } from "../lib/home-hero-content-defaults";
import { DEFAULT_HOME_VALUE_STRIP } from "../lib/home-value-strip-defaults";
import { showDbToastError, showDbToastSuccess } from "../lib/db-toast";
import { DEFAULT_HOME_PANELS } from "../lib/home-panels-defaults";
import { isAdminUser } from "../lib/authz";
import { ModalLightbox } from "./modal-lightbox";
import { UploadFieldStatus } from "./upload-field-status";

const DEFAULT_TRAVEL_TIPS_PDF =
  "/_downloaded/sites/default/files/Media%20Root/Travel%20Tips%20for%20Musicians2023.pdf";

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
  { src, alt, className, style, growEnabled, animationDelayMs, loading = "eager" },
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
      loading={loading}
      fetchPriority="high"
      onLoad={handleLoad}
      width={1600}
      height={900}
      priority
    />
  );
});

HeroImageWithGrow.displayName = "HeroImageWithGrow";

const HERO_TEXT_GLASS_VARIANTS = ["sweep", "prism", "ripple", "flare"];
const HOME_PANEL_KEYS = ["parking", "travel"];
const HOME_VALUE_KEYS = ["advocacy", "protection", "community", "opportunity"];

function pickRandomHeroTextGlassVariant(current = HERO_TEXT_GLASS_VARIANTS[0]) {
  const options = HERO_TEXT_GLASS_VARIANTS.filter((variant) => variant !== current);
  return options[Math.floor(Math.random() * options.length)] || current;
}

function normalizeHomePanels(config) {
  return {
    parking: {
      ...DEFAULT_HOME_PANELS.parking,
      ...(config?.parking || {}),
    },
    travel: {
      ...DEFAULT_HOME_PANELS.travel,
      ...(config?.travel || {}),
    },
  };
}

function normalizeHomeValueStrip(config) {
  return {
    advocacy: {
      ...DEFAULT_HOME_VALUE_STRIP.advocacy,
      ...(config?.advocacy || {}),
    },
    protection: {
      ...DEFAULT_HOME_VALUE_STRIP.protection,
      ...(config?.protection || {}),
    },
    community: {
      ...DEFAULT_HOME_VALUE_STRIP.community,
      ...(config?.community || {}),
    },
    opportunity: {
      ...DEFAULT_HOME_VALUE_STRIP.opportunity,
      ...(config?.opportunity || {}),
    },
  };
}

function HomePanelButton({ href, className, children }) {
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function heroPanelBackgroundStyle(backgroundImageSrc, fallbackUrl, position = "center") {
  const imageUrl = backgroundImageSrc || fallbackUrl;
  return {
    backgroundImage:
      `linear-gradient(135deg, rgba(2, 6, 18, 0.6) 0%, rgba(3, 9, 24, 0.6) 46%, rgba(4, 10, 24, 0.6) 100%),` +
      `url("${imageUrl}")`,
    backgroundPosition: `${position}, ${position}`,
    backgroundSize: "cover, cover",
    backgroundRepeat: "no-repeat, no-repeat",
  };
}

export function HomepageExperience({
  siteStats,
  homePage,
  joinHref,
  heroHomeConfig,
  homeHeroTextConfig,
  homeHeroContentConfig,
  homePanelsConfig,
  homeValueStripConfig,
}) {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && isAdminUser(session?.user);
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
    linkHref: String(homeHeroTextConfig?.linkHref || ""),
  };
  const initialHomePanels = normalizeHomePanels(homePanelsConfig);
  const initialHomeValueStrip = normalizeHomeValueStrip(homeValueStripConfig);
  const initialHeroContent = {
    eyebrow: String(homeHeroContentConfig?.eyebrow || DEFAULT_HOME_HERO_CONTENT.eyebrow),
    titleLine1: String(homeHeroContentConfig?.titleLine1 || DEFAULT_HOME_HERO_CONTENT.titleLine1),
    titleLine2: String(homeHeroContentConfig?.titleLine2 || DEFAULT_HOME_HERO_CONTENT.titleLine2),
    body: String(homeHeroContentConfig?.body || DEFAULT_HOME_HERO_CONTENT.body),
    primaryCta: {
      label: String(
        homeHeroContentConfig?.primaryCta?.label || DEFAULT_HOME_HERO_CONTENT.primaryCta.label
      ),
      href: String(
        homeHeroContentConfig?.primaryCta?.href || DEFAULT_HOME_HERO_CONTENT.primaryCta.href
      ),
    },
    secondaryCta: {
      label: String(
        homeHeroContentConfig?.secondaryCta?.label ||
          DEFAULT_HOME_HERO_CONTENT.secondaryCta.label
      ),
      href: String(
        homeHeroContentConfig?.secondaryCta?.href || DEFAULT_HOME_HERO_CONTENT.secondaryCta.href
      ),
    },
  };
  const [heroTitleLine1, setHeroTitleLine1] = useState(initialHeroText.titleLine1);
  const [heroTitleLine2, setHeroTitleLine2] = useState(initialHeroText.titleLine2);
  const [heroSubheading, setHeroSubheading] = useState(initialHeroText.subheading);
  const [heroLinkHref, setHeroLinkHref] = useState(initialHeroText.linkHref);
  const [heroTitleLine1Draft, setHeroTitleLine1Draft] = useState(initialHeroText.titleLine1);
  const [heroTitleLine2Draft, setHeroTitleLine2Draft] = useState(initialHeroText.titleLine2);
  const [heroSubheadingDraft, setHeroSubheadingDraft] = useState(initialHeroText.subheading);
  const [heroLinkHrefDraft, setHeroLinkHrefDraft] = useState(initialHeroText.linkHref);
  const [heroTextOverlayActive, setHeroTextOverlayActive] = useState(false);
  const [heroTextGlassVariant, setHeroTextGlassVariant] = useState(HERO_TEXT_GLASS_VARIANTS[0]);
  const [heroTextGlassCycle, setHeroTextGlassCycle] = useState(0);
  const [heroTextEditorPortalReady, setHeroTextEditorPortalReady] = useState(false);
  const [parkingMapLightboxOpen, setParkingMapLightboxOpen] = useState(false);
  const [travelTipsLightboxOpen, setTravelTipsLightboxOpen] = useState(false);
  const [homePanels, setHomePanels] = useState(initialHomePanels);
  const travelTipsPdfHref =
    homePanels.travel.ctaHref && homePanels.travel.ctaHref !== "/news-and-events"
      ? homePanels.travel.ctaHref
      : DEFAULT_TRAVEL_TIPS_PDF;
  const [homePanelsDraft, setHomePanelsDraft] = useState(initialHomePanels);
  const [homePanelsEditorOpen, setHomePanelsEditorOpen] = useState(false);
  const [homePanelsSaveBusy, setHomePanelsSaveBusy] = useState(false);
  const [homePanelsError, setHomePanelsError] = useState("");
  const [activeHomePanelKey, setActiveHomePanelKey] = useState("parking");
  const [heroContent, setHeroContent] = useState(initialHeroContent);
  const [heroContentDraft, setHeroContentDraft] = useState(initialHeroContent);
  const [heroContentEditorOpen, setHeroContentEditorOpen] = useState(false);
  const [heroContentSaveBusy, setHeroContentSaveBusy] = useState(false);
  const [heroContentError, setHeroContentError] = useState("");
  const [heroContentOverlayActive, setHeroContentOverlayActive] = useState(false);
  const [heroContentGlassVariant, setHeroContentGlassVariant] = useState(HERO_TEXT_GLASS_VARIANTS[0]);
  const [heroContentGlassCycle, setHeroContentGlassCycle] = useState(0);
  const [homeValueStrip, setHomeValueStrip] = useState(initialHomeValueStrip);
  const [homeValueStripDraft, setHomeValueStripDraft] = useState(initialHomeValueStrip);
  const [homeValueEditorOpen, setHomeValueEditorOpen] = useState(false);
  const [homeValueSaveBusy, setHomeValueSaveBusy] = useState(false);
  const [homeValueError, setHomeValueError] = useState("");
  const [activeHomeValueKey, setActiveHomeValueKey] = useState("advocacy");
  const [homeValueOverlayActive, setHomeValueOverlayActive] = useState({
    advocacy: false,
    protection: false,
    community: false,
    opportunity: false,
  });
  const [homeValueGlassVariant, setHomeValueGlassVariant] = useState({
    advocacy: HERO_TEXT_GLASS_VARIANTS[0],
    protection: HERO_TEXT_GLASS_VARIANTS[0],
    community: HERO_TEXT_GLASS_VARIANTS[0],
    opportunity: HERO_TEXT_GLASS_VARIANTS[0],
  });
  const [homeValueGlassCycle, setHomeValueGlassCycle] = useState({
    advocacy: 0,
    protection: 0,
    community: 0,
    opportunity: 0,
  });
  const [homePanelOverlayActive, setHomePanelOverlayActive] = useState({
    parking: false,
    travel: false,
  });
  const [homePanelGlassVariant, setHomePanelGlassVariant] = useState({
    parking: HERO_TEXT_GLASS_VARIANTS[0],
    travel: HERO_TEXT_GLASS_VARIANTS[0],
  });
  const [homePanelGlassCycle, setHomePanelGlassCycle] = useState({
    parking: 0,
    travel: 0,
  });
  const parkingBgUploadInputRef = useRef(null);
  const travelBgUploadInputRef = useRef(null);

  useEffect(() => {
    setHeroTextEditorPortalReady(true);
  }, []);

  useEffect(() => {
    if (
      !heroTextEditorOpen &&
      !homePanelsEditorOpen &&
      !heroContentEditorOpen &&
      !homeValueEditorOpen
    ) {
      return undefined;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [heroTextEditorOpen, homePanelsEditorOpen, heroContentEditorOpen, homeValueEditorOpen]);

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
          const msg = err.error || "Could not save hero settings.";
          setSaveError(msg);
          showDbToastError("Database update failed.");
          return;
        }
        lastSavedJsonRef.current = nextJson;
      } catch {
        setSaveError("Could not save hero settings.");
        showDbToastError("Database update failed.");
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
        showDbToastError("Database update failed.");
        return;
      }
      if (data.url) {
        setHeroImages((prev) => (prev.length >= 6 ? prev : [...prev, data.url]));
        showDbToastSuccess();
      }
    } catch {
      setSaveError("Upload failed.");
      showDbToastError("Database update failed.");
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
      setHeroLinkHref(String(data.linkHref || ""));
      setHeroTitleLine1Draft(String(data.titleLine1 || ""));
      setHeroTitleLine2Draft(String(data.titleLine2 || ""));
      setHeroSubheadingDraft(String(data.subheading || ""));
      setHeroLinkHrefDraft(String(data.linkHref || ""));
    } catch (err) {
      setHeroTextError(err instanceof Error ? err.message : "Could not load hero text.");
      setHeroTitleLine1Draft(heroTitleLine1);
      setHeroTitleLine2Draft(heroTitleLine2);
      setHeroSubheadingDraft(heroSubheading);
      setHeroLinkHrefDraft(heroLinkHref);
    } finally {
      setHeroTextEditorOpen(true);
    }
  }, [heroLinkHref, heroSubheading, heroTitleLine1, heroTitleLine2]);

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
            linkHref: heroLinkHrefDraft,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || "Could not save hero text.";
          showDbToastError(data.error || "Database update failed.");
          setHeroTextError(msg);
          return;
        }
        setHeroTitleLine1(String(data.titleLine1 || ""));
        setHeroTitleLine2(String(data.titleLine2 || ""));
        setHeroSubheading(String(data.subheading || ""));
        setHeroLinkHref(String(data.linkHref || ""));
        setHeroTextEditorOpen(false);
        showDbToastSuccess();
      } catch (err) {
        setHeroTextError(err instanceof Error ? err.message : "Could not save hero text.");
        showDbToastError("Database update failed.");
      } finally {
        setHeroTextSaveBusy(false);
      }
    },
    [heroLinkHrefDraft, heroSubheadingDraft, heroTitleLine1Draft, heroTitleLine2Draft]
  );

  const updateHomePanelDraft = useCallback((panelKey, field, value) => {
    setHomePanelsDraft((current) => ({
      ...current,
      [panelKey]: {
        ...current[panelKey],
        [field]: value,
      },
    }));
  }, []);

  const updateHomeValueDraft = useCallback((valueKey, field, value) => {
    setHomeValueStripDraft((current) => ({
      ...current,
      [valueKey]: {
        ...current[valueKey],
        [field]: value,
      },
    }));
  }, []);

  const updateHeroContentDraft = useCallback((field, value) => {
    setHeroContentDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const updateHeroContentCtaDraft = useCallback((ctaKey, field, value) => {
    setHeroContentDraft((current) => ({
      ...current,
      [ctaKey]: {
        ...current[ctaKey],
        [field]: value,
      },
    }));
  }, []);

  const uploadHomePanelBackground = useCallback(async (panelKey, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setHomePanelsSaveBusy(true);
    setHomePanelsError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/site-config/home-panels/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Could not upload homepage panel image.";
        setHomePanelsError(msg);
        showDbToastError("Database update failed.");
        return;
      }
      if (data?.url) {
        updateHomePanelDraft(panelKey, "backgroundImageSrc", String(data.url));
        showDbToastSuccess();
      }
    } catch (err) {
      setHomePanelsError(
        err instanceof Error ? err.message : "Could not upload homepage panel image."
      );
      showDbToastError("Database update failed.");
    } finally {
      setHomePanelsSaveBusy(false);
    }
  }, [updateHomePanelDraft]);

  const openHomePanelsEditor = useCallback(
    async (panelKey = "parking") => {
      setActiveHomePanelKey(panelKey);
      setHomePanelsError("");
      try {
        const res = await fetch("/api/site-config/home-panels", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not load homepage notice cards.");
        }
        const nextPanels = normalizeHomePanels(data);
        setHomePanels(nextPanels);
        setHomePanelsDraft(nextPanels);
      } catch (err) {
        setHomePanelsError(
          err instanceof Error ? err.message : "Could not load homepage notice cards."
        );
        setHomePanelsDraft(homePanels);
      } finally {
        setHomePanelsEditorOpen(true);
      }
    },
    [homePanels]
  );

  const openHeroContentEditor = useCallback(async () => {
    setHeroContentError("");
    try {
      const res = await fetch("/api/site-config/home-hero-content", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not load homepage hero content.");
      }
      setHeroContent(data);
      setHeroContentDraft(data);
    } catch (err) {
      setHeroContentError(
        err instanceof Error ? err.message : "Could not load homepage hero content."
      );
      setHeroContentDraft(heroContent);
    } finally {
      setHeroContentEditorOpen(true);
    }
  }, [heroContent]);

  const saveHeroContent = useCallback(
    async (event) => {
      event.preventDefault();
      setHeroContentSaveBusy(true);
      setHeroContentError("");
      try {
        const res = await fetch("/api/site-config/home-hero-content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(heroContentDraft),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || "Could not save homepage hero content.";
          setHeroContentError(msg);
          showDbToastError(data.error || "Database update failed.");
          return;
        }
        setHeroContent(data);
        setHeroContentDraft(data);
        setHeroContentEditorOpen(false);
        showDbToastSuccess();
      } catch (err) {
        setHeroContentError(
          err instanceof Error ? err.message : "Could not save homepage hero content."
        );
        showDbToastError("Database update failed.");
      } finally {
        setHeroContentSaveBusy(false);
      }
    },
    [heroContentDraft]
  );

  const saveHomePanels = useCallback(
    async (event) => {
      event.preventDefault();
      setHomePanelsSaveBusy(true);
      setHomePanelsError("");
      try {
        const res = await fetch("/api/site-config/home-panels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(homePanelsDraft),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || "Could not save homepage notice cards.";
          setHomePanelsError(msg);
          showDbToastError(data.error || "Database update failed.");
          return;
        }
        const nextPanels = normalizeHomePanels(data);
        setHomePanels(nextPanels);
        setHomePanelsDraft(nextPanels);
        setHomePanelsEditorOpen(false);
        showDbToastSuccess();
      } catch (err) {
        setHomePanelsError(
          err instanceof Error ? err.message : "Could not save homepage notice cards."
        );
        showDbToastError("Database update failed.");
      } finally {
        setHomePanelsSaveBusy(false);
      }
    },
    [homePanelsDraft]
  );

  const openHomeValueEditor = useCallback(
    async (valueKey = "advocacy") => {
      setActiveHomeValueKey(valueKey);
      setHomeValueError("");
      try {
        const res = await fetch("/api/site-config/home-value-strip", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not load homepage value card.");
        }
        const nextValues = normalizeHomeValueStrip(data);
        setHomeValueStrip(nextValues);
        setHomeValueStripDraft(nextValues);
      } catch (err) {
        setHomeValueError(
          err instanceof Error ? err.message : "Could not load homepage value card."
        );
        setHomeValueStripDraft(homeValueStrip);
      } finally {
        setHomeValueEditorOpen(true);
      }
    },
    [homeValueStrip]
  );

  const saveHomeValueStrip = useCallback(
    async (event) => {
      event.preventDefault();
      setHomeValueSaveBusy(true);
      setHomeValueError("");
      try {
        const res = await fetch("/api/site-config/home-value-strip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(homeValueStripDraft),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || "Could not save homepage value card.";
          setHomeValueError(msg);
          showDbToastError(data.error || "Database update failed.");
          return;
        }
        const nextValues = normalizeHomeValueStrip(data);
        setHomeValueStrip(nextValues);
        setHomeValueStripDraft(nextValues);
        setHomeValueEditorOpen(false);
        showDbToastSuccess();
      } catch (err) {
        setHomeValueError(
          err instanceof Error ? err.message : "Could not save homepage value card."
        );
        showDbToastError("Database update failed.");
      } finally {
        setHomeValueSaveBusy(false);
      }
    },
    [homeValueStripDraft]
  );

  const triggerHomePanelGlass = useCallback((panelKey) => {
    setHomePanelGlassVariant((current) => ({
      ...current,
      [panelKey]: pickRandomHeroTextGlassVariant(current[panelKey]),
    }));
    setHomePanelGlassCycle((current) => ({
      ...current,
      [panelKey]: current[panelKey] + 1,
    }));
  }, []);

  const triggerHomeValueGlass = useCallback((valueKey) => {
    setHomeValueGlassVariant((current) => ({
      ...current,
      [valueKey]: pickRandomHeroTextGlassVariant(current[valueKey]),
    }));
    setHomeValueGlassCycle((current) => ({
      ...current,
      [valueKey]: current[valueKey] + 1,
    }));
  }, []);

  const triggerHeroTextGlass = useCallback(() => {
    setHeroTextGlassVariant((current) => pickRandomHeroTextGlassVariant(current));
    setHeroTextGlassCycle((n) => n + 1);
  }, []);

  const triggerHeroContentGlass = useCallback(() => {
    setHeroContentGlassVariant((current) => pickRandomHeroTextGlassVariant(current));
    setHeroContentGlassCycle((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin || !heroTextOverlayActive) return undefined;
    triggerHeroTextGlass();
    const id = window.setInterval(triggerHeroTextGlass, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, heroTextOverlayActive, triggerHeroTextGlass]);

  useEffect(() => {
    if (!isAdmin || !heroContentOverlayActive) return undefined;
    triggerHeroContentGlass();
    const id = window.setInterval(triggerHeroContentGlass, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, heroContentOverlayActive, triggerHeroContentGlass]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const activeKeys = HOME_PANEL_KEYS.filter((key) => homePanelOverlayActive[key]);
    if (!activeKeys.length) return undefined;
    activeKeys.forEach((key) => triggerHomePanelGlass(key));
    const id = window.setInterval(() => {
      activeKeys.forEach((key) => triggerHomePanelGlass(key));
    }, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, homePanelOverlayActive, triggerHomePanelGlass]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const activeKeys = HOME_VALUE_KEYS.filter((key) => homeValueOverlayActive[key]);
    if (!activeKeys.length) return undefined;
    activeKeys.forEach((key) => triggerHomeValueGlass(key));
    const id = window.setInterval(() => {
      activeKeys.forEach((key) => triggerHomeValueGlass(key));
    }, 5000);
    return () => window.clearInterval(id);
  }, [isAdmin, homeValueOverlayActive, triggerHomeValueGlass]);

  useEffect(() => {
    if (!homePanelsEditorOpen || !activeHomePanelKey) return undefined;
    const id = window.requestAnimationFrame(() => {
      const section = document.querySelector(`[data-home-panel-key="${activeHomePanelKey}"]`);
      if (!(section instanceof HTMLElement)) return;
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const input = section.querySelector("input");
      if (input instanceof HTMLInputElement) {
        input.focus();
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeHomePanelKey, homePanelsEditorOpen]);

  useEffect(() => {
    if (!homeValueEditorOpen || !activeHomeValueKey) return undefined;
    const id = window.requestAnimationFrame(() => {
      const section = document.querySelector(`[data-home-value-key="${activeHomeValueKey}"]`);
      if (!(section instanceof HTMLElement)) return;
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const input = section.querySelector("input");
      if (input instanceof HTMLInputElement) {
        input.focus();
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeHomeValueKey, homeValueEditorOpen]);

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

  const renderMemberNotices = (variantClass = "") => (
    <div className={["hero-panels", variantClass].filter(Boolean).join(" ")}>
      <article
        className="hero-panel hero-panel--promo hero-panel--parking"
        style={heroPanelBackgroundStyle(
          homePanels.parking.backgroundImageSrc,
          DEFAULT_HOME_PANELS.parking.backgroundImageSrc,
          "right bottom"
        )}
      >
        <p className="panel-kicker">{homePanels.parking.kicker}</p>
        <h3 className="parking-panel-title">{homePanels.parking.title}</h3>
        <p className="parking-panel-copy">
          {homePanels.parking.body}
        </p>
        <button
          type="button"
          className="btn btn-primary parking-panel-cta"
          onClick={() => setParkingMapLightboxOpen(true)}
        >
          {homePanels.parking.ctaLabel}
        </button>
        {isAdmin ? (
          <button
            type="button"
            className="recording-page-edit-overlay"
            aria-label="Edit homepage parking card"
            data-active={homePanelOverlayActive.parking ? "true" : "false"}
            onClick={() => void openHomePanelsEditor("parking")}
            onMouseEnter={() =>
              setHomePanelOverlayActive((current) => ({ ...current, parking: true }))
            }
            onMouseLeave={() =>
              setHomePanelOverlayActive((current) => ({ ...current, parking: false }))
            }
            onFocus={() =>
              setHomePanelOverlayActive((current) => ({ ...current, parking: true }))
            }
            onBlur={() =>
              setHomePanelOverlayActive((current) => ({ ...current, parking: false }))
            }
          >
            <span className="recording-page-edit-overlay__wash" aria-hidden="true">
              {homePanelOverlayActive.parking ? (
                <span
                  key={`home-panel-parking-${homePanelGlassVariant.parking}-${homePanelGlassCycle.parking}`}
                  className={`recording-page-edit-overlay__glass recording-page-edit-overlay__glass--${homePanelGlassVariant.parking}`}
                />
              ) : null}
            </span>
          </button>
        ) : null}
      </article>
      <article
        className="hero-panel hero-panel--promo hero-panel--travel"
        style={heroPanelBackgroundStyle(
          homePanels.travel.backgroundImageSrc,
          DEFAULT_HOME_PANELS.travel.backgroundImageSrc,
          "center"
        )}
      >
        <p className="panel-kicker">{homePanels.travel.kicker}</p>
        <h3 className="parking-panel-title">{homePanels.travel.title}</h3>
        <p className="parking-panel-copy">{homePanels.travel.body}</p>
        <button
          type="button"
          className="btn btn-primary parking-panel-cta"
          onClick={() => setTravelTipsLightboxOpen(true)}
        >
          {homePanels.travel.ctaLabel}
        </button>
        {isAdmin ? (
          <button
            type="button"
            className="recording-page-edit-overlay"
            aria-label="Edit homepage travel card"
            data-active={homePanelOverlayActive.travel ? "true" : "false"}
            onClick={() => void openHomePanelsEditor("travel")}
            onMouseEnter={() =>
              setHomePanelOverlayActive((current) => ({ ...current, travel: true }))
            }
            onMouseLeave={() =>
              setHomePanelOverlayActive((current) => ({ ...current, travel: false }))
            }
            onFocus={() =>
              setHomePanelOverlayActive((current) => ({ ...current, travel: true }))
            }
            onBlur={() =>
              setHomePanelOverlayActive((current) => ({ ...current, travel: false }))
            }
          >
            <span className="recording-page-edit-overlay__wash" aria-hidden="true">
              {homePanelOverlayActive.travel ? (
                <span
                  key={`home-panel-travel-${homePanelGlassVariant.travel}-${homePanelGlassCycle.travel}`}
                  className={`recording-page-edit-overlay__glass recording-page-edit-overlay__glass--${homePanelGlassVariant.travel}`}
                />
              ) : null}
            </span>
          </button>
        ) : null}
      </article>
    </div>
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
          {!isAdmin && heroLinkHref ? (
            <HomePanelButton href={heroLinkHref} className="hero-image-link">
              <h1 className="hero-image-title">
                {heroTitleLine1}
                <span>{heroTitleLine2}</span>
              </h1>
              <p className="hero-image-sub">{heroSubheading}</p>
            </HomePanelButton>
          ) : (
            <>
              <h1 className="hero-image-title">
                {heroTitleLine1}
                <span>{heroTitleLine2}</span>
              </h1>
              <p className="hero-image-sub">{heroSubheading}</p>
            </>
          )}
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
              <p className="gigs-admin__eyebrow">Hero Image Admin</p>
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
              {saveError ? (
                <p className="hero-admin-error" role="alert">
                  {saveError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <ModalLightbox
        open={parkingMapLightboxOpen}
        onClose={() => setParkingMapLightboxOpen(false)}
        closeLabel="Close parking map"
      >
        <div className="parking-map-lightbox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/Parkingmap.png"
            alt="Downtown parking map for AFM Local 257 members"
            className="parking-map-lightbox__image"
          />
        </div>
      </ModalLightbox>

      <ModalLightbox
        open={travelTipsLightboxOpen}
        onClose={() => setTravelTipsLightboxOpen(false)}
        closeLabel="Close travel tips PDF"
        aspectRatio="pdf"
      >
        <iframe
          src={travelTipsPdfHref}
          title="Travel Tips for Musicians PDF"
        />
      </ModalLightbox>

      {heroTextEditorPortalReady && heroTextEditorOpen
        ? createPortal(
            <div className="page-header-editor-backdrop" role="presentation">
              <div
                className="page-header-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Edit homepage hero text"
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
                  <label>
                    Optional link
                    <input
                      type="text"
                      value={heroLinkHrefDraft}
                      onChange={(event) => setHeroLinkHrefDraft(event.target.value)}
                      maxLength={500}
                      placeholder="/find-an-artist-or-band or https://example.com"
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
            </div>,
            document.body
          )
        : null}

      {heroTextEditorPortalReady && homePanelsEditorOpen
        ? createPortal(
            <div className="page-header-editor-backdrop" role="presentation">
              <div
                className="page-header-editor-modal page-header-editor-modal--wide"
                role="dialog"
                aria-modal="true"
                aria-label="Edit homepage notice cards"
              >
                <div className="page-header-editor-modal__header">
                  <p className="gigs-admin__eyebrow">Admin</p>
                  <h3>Edit Homepage Notice Cards</h3>
                </div>
                <form className="page-header-editor-form" onSubmit={saveHomePanels}>
                  {(() => {
                    const panelKey = activeHomePanelKey;
                    const panel = homePanelsDraft[panelKey];
                    const heading = panelKey === "parking" ? "Parking Card" : "Travel Card";
                    const inputRef =
                      panelKey === "parking" ? parkingBgUploadInputRef : travelBgUploadInputRef;
                    return (
                      <section
                        className="home-panels-editor-card"
                        data-home-panel-key={panelKey}
                      >
                        <div className="home-panels-editor-card__header">
                          <p className="gigs-admin__eyebrow">{heading}</p>
                          <h4>{panel.title || heading}</h4>
                        </div>
                        <div className="home-panels-editor-grid">
                          <label>
                            Eyebrow
                            <input
                              type="text"
                              value={panel.kicker}
                              onChange={(event) =>
                                updateHomePanelDraft(panelKey, "kicker", event.target.value)
                              }
                              maxLength={80}
                              required
                            />
                          </label>
                          <label>
                            Title
                            <input
                              type="text"
                              value={panel.title}
                              onChange={(event) =>
                                updateHomePanelDraft(panelKey, "title", event.target.value)
                              }
                              maxLength={160}
                              required
                            />
                          </label>
                          <label className="home-panels-editor-grid__wide">
                            Body
                            <textarea
                              value={panel.body}
                              onChange={(event) =>
                                updateHomePanelDraft(panelKey, "body", event.target.value)
                              }
                              rows={4}
                              maxLength={320}
                              required
                            />
                          </label>
                          <label>
                            Button label
                            <input
                              type="text"
                              value={panel.ctaLabel}
                              onChange={(event) =>
                                updateHomePanelDraft(panelKey, "ctaLabel", event.target.value)
                              }
                              maxLength={120}
                              required
                            />
                          </label>
                          <label>
                            Button link
                            <input
                              type="text"
                              value={panel.ctaHref}
                              onChange={(event) =>
                                updateHomePanelDraft(panelKey, "ctaHref", event.target.value)
                              }
                              maxLength={500}
                              required
                            />
                          </label>
                          <div className="home-panels-editor-upload-row home-panels-editor-grid__wide">
                            <input
                              ref={inputRef}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              tabIndex={-1}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) {
                                  void uploadHomePanelBackground(panelKey, file);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => inputRef.current?.click()}
                              disabled={homePanelsSaveBusy}
                            >
                              Upload background image
                            </button>
                            <UploadFieldStatus
                              url={panel.backgroundImageSrc}
                              kind="image"
                              imageAlt={`${panel.title || panelKey} background preview`}
                              emptyLabel="No background image selected."
                            />
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() =>
                                updateHomePanelDraft(
                                  panelKey,
                                  "backgroundImageSrc",
                                  DEFAULT_HOME_PANELS[panelKey].backgroundImageSrc
                                )
                              }
                              disabled={homePanelsSaveBusy}
                            >
                              Reset default background
                            </button>
                          </div>
                        </div>
                      </section>
                    );
                  })()}
                  {homePanelsError ? <p className="hero-admin-error">{homePanelsError}</p> : null}
                  <div className="page-header-editor-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setHomePanelsEditorOpen(false)}
                      disabled={homePanelsSaveBusy}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={homePanelsSaveBusy}>
                      {homePanelsSaveBusy ? "Saving..." : "Save Notice Cards"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {heroTextEditorPortalReady && homeValueEditorOpen
        ? createPortal(
            <div className="page-header-editor-backdrop" role="presentation">
              <div
                className="page-header-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Edit homepage value card"
              >
                <div className="page-header-editor-modal__header">
                  <p className="gigs-admin__eyebrow">Admin</p>
                  <h3>Edit Homepage Value Card</h3>
                </div>
                <form className="page-header-editor-form" onSubmit={saveHomeValueStrip}>
                  {(() => {
                    const valueKey = activeHomeValueKey;
                    const item = homeValueStripDraft[valueKey];
                    return (
                      <section className="home-panels-editor-card" data-home-value-key={valueKey}>
                        <div className="home-panels-editor-card__header">
                          <p className="gigs-admin__eyebrow">Value Strip Card</p>
                          <h4>{item.label || "Homepage value card"}</h4>
                        </div>
                        <div className="home-panels-editor-grid">
                          <label>
                            Label
                            <input
                              type="text"
                              value={item.label}
                              onChange={(event) =>
                                updateHomeValueDraft(valueKey, "label", event.target.value)
                              }
                              maxLength={80}
                              required
                            />
                          </label>
                          <label className="home-panels-editor-grid__wide">
                            Headline
                            <input
                              type="text"
                              value={item.headline}
                              onChange={(event) =>
                                updateHomeValueDraft(valueKey, "headline", event.target.value)
                              }
                              maxLength={180}
                              required
                            />
                          </label>
                        </div>
                      </section>
                    );
                  })()}
                  {homeValueError ? <p className="hero-admin-error">{homeValueError}</p> : null}
                  <div className="page-header-editor-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setHomeValueEditorOpen(false)}
                      disabled={homeValueSaveBusy}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={homeValueSaveBusy}>
                      {homeValueSaveBusy ? "Saving..." : "Save Value Card"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {heroTextEditorPortalReady && heroContentEditorOpen
        ? createPortal(
            <div className="page-header-editor-backdrop" role="presentation">
              <div
                className="page-header-editor-modal page-header-editor-modal--wide"
                role="dialog"
                aria-modal="true"
                aria-label="Edit homepage hero content"
              >
                <div className="page-header-editor-modal__header">
                  <p className="gigs-admin__eyebrow">Admin</p>
                  <h3>Edit Homepage Hero Content</h3>
                </div>
                <form className="page-header-editor-form" onSubmit={saveHeroContent}>
                  <div className="home-panels-editor-list">
                    <section className="home-panels-editor-card">
                      <div className="home-panels-editor-card__header">
                        <p className="gigs-admin__eyebrow">Hero Copy</p>
                        <h4>Main home-page introduction</h4>
                      </div>
                      <div className="home-panels-editor-grid">
                        <label>
                          Eyebrow
                          <input
                            type="text"
                            value={heroContentDraft.eyebrow}
                            onChange={(event) => updateHeroContentDraft("eyebrow", event.target.value)}
                            maxLength={120}
                            required
                          />
                        </label>
                        <label>
                          Title line 1
                          <input
                            type="text"
                            value={heroContentDraft.titleLine1}
                            onChange={(event) =>
                              updateHeroContentDraft("titleLine1", event.target.value)
                            }
                            maxLength={180}
                            required
                          />
                        </label>
                        <label>
                          Title line 2
                          <input
                            type="text"
                            value={heroContentDraft.titleLine2}
                            onChange={(event) =>
                              updateHeroContentDraft("titleLine2", event.target.value)
                            }
                            maxLength={180}
                            required
                          />
                        </label>
                        <label className="home-panels-editor-grid__wide">
                          Body
                          <textarea
                            value={heroContentDraft.body}
                            onChange={(event) => updateHeroContentDraft("body", event.target.value)}
                            rows={4}
                            maxLength={360}
                            required
                          />
                        </label>
                        <label>
                          Primary button label
                          <input
                            type="text"
                            value={heroContentDraft.primaryCta.label}
                            onChange={(event) =>
                              updateHeroContentCtaDraft("primaryCta", "label", event.target.value)
                            }
                            maxLength={120}
                            required
                          />
                        </label>
                        <label>
                          Primary button link
                          <input
                            type="text"
                            value={heroContentDraft.primaryCta.href}
                            onChange={(event) =>
                              updateHeroContentCtaDraft("primaryCta", "href", event.target.value)
                            }
                            maxLength={500}
                            required
                          />
                        </label>
                        <label>
                          Secondary button label
                          <input
                            type="text"
                            value={heroContentDraft.secondaryCta.label}
                            onChange={(event) =>
                              updateHeroContentCtaDraft("secondaryCta", "label", event.target.value)
                            }
                            maxLength={120}
                            required
                          />
                        </label>
                        <label>
                          Secondary button link
                          <input
                            type="text"
                            value={heroContentDraft.secondaryCta.href}
                            onChange={(event) =>
                              updateHeroContentCtaDraft("secondaryCta", "href", event.target.value)
                            }
                            maxLength={500}
                            required
                          />
                        </label>
                      </div>
                    </section>
                  </div>
                  {heroContentError ? <p className="hero-admin-error">{heroContentError}</p> : null}
                  <div className="page-header-editor-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setHeroContentEditorOpen(false)}
                      disabled={heroContentSaveBusy}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={heroContentSaveBusy}>
                      {heroContentSaveBusy ? "Saving..." : "Save Hero Content"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      <section className="hero-block" data-reveal>
        <div className="hero-noise" aria-hidden />
        <div className="hero-glow hero-glow-a" aria-hidden />
        <div className="hero-glow hero-glow-b" aria-hidden />
        <div className="hero-gridline" aria-hidden />

        <div
          className={`hero-content${isAdmin ? " hero-content--admin-editable" : ""}`}
          role={isAdmin ? "button" : undefined}
          tabIndex={isAdmin ? 0 : undefined}
          aria-label={isAdmin ? "Edit homepage hero content" : undefined}
          onClick={isAdmin ? () => void openHeroContentEditor() : undefined}
          onKeyDown={
            isAdmin
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openHeroContentEditor();
                  }
                }
              : undefined
          }
          onMouseEnter={() => {
            if (isAdmin) setHeroContentOverlayActive(true);
          }}
          onMouseLeave={() => setHeroContentOverlayActive(false)}
          onFocusCapture={() => {
            if (isAdmin) setHeroContentOverlayActive(true);
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHeroContentOverlayActive(false);
            }
          }}
        >
          <p className="eyebrow">{heroContent.eyebrow}</p>
          <h1 className="hero-title">
            {heroContent.titleLine1}
            <span>{heroContent.titleLine2}</span>
          </h1>
          <p className="hero-text">{heroContent.body}</p>
          <div className="hero-actions">
            <HomePanelButton
              href={heroContent.primaryCta.href || joinHref}
              className="btn btn-primary"
            >
              {heroContent.primaryCta.label}
            </HomePanelButton>
            <HomePanelButton
              href={heroContent.secondaryCta.href || "/member-benefits"}
              className="btn btn-secondary"
            >
              {heroContent.secondaryCta.label}
            </HomePanelButton>
          </div>
          <div className="hero-tags">
            <span>Fair Pay</span>
            <span>Contract Support</span>
            <span>Local Community</span>
            <span>Professional Growth</span>
          </div>
          {isAdmin ? (
            <span
              className="hero-image-content__admin-overlay"
              aria-hidden="true"
              data-active={heroContentOverlayActive ? "true" : "false"}
            >
              <span className="hero-image-content__admin-overlay__wash">
                {heroContentOverlayActive ? (
                  <span
                    key={`hero-content-glass-${heroContentGlassVariant}-${heroContentGlassCycle}`}
                    className={`hero-image-content__admin-overlay__glass hero-image-content__admin-overlay__glass--${heroContentGlassVariant}`}
                  />
                ) : null}
              </span>
            </span>
          ) : null}
        </div>

        {renderMemberNotices("hero-panels--desktop")}
      </section>

      <section className="value-strip" data-reveal>
        {HOME_VALUE_KEYS.map((valueKey) => {
          const item = homeValueStrip[valueKey];
          return (
            <article key={valueKey}>
              <p>{item.label}</p>
              <h3>{item.headline}</h3>
              {isAdmin ? (
                <button
                  type="button"
                  className="recording-page-edit-overlay"
                  aria-label={`Edit homepage ${item.label || valueKey} value card`}
                  data-active={homeValueOverlayActive[valueKey] ? "true" : "false"}
                  onClick={() => void openHomeValueEditor(valueKey)}
                  onMouseEnter={() =>
                    setHomeValueOverlayActive((current) => ({ ...current, [valueKey]: true }))
                  }
                  onMouseLeave={() =>
                    setHomeValueOverlayActive((current) => ({ ...current, [valueKey]: false }))
                  }
                  onFocus={() =>
                    setHomeValueOverlayActive((current) => ({ ...current, [valueKey]: true }))
                  }
                  onBlur={() =>
                    setHomeValueOverlayActive((current) => ({ ...current, [valueKey]: false }))
                  }
                >
                  <span className="recording-page-edit-overlay__wash" aria-hidden="true">
                    {homeValueOverlayActive[valueKey] ? (
                      <span
                        key={`home-value-${valueKey}-${homeValueGlassVariant[valueKey]}-${homeValueGlassCycle[valueKey]}`}
                        className={`recording-page-edit-overlay__glass recording-page-edit-overlay__glass--${homeValueGlassVariant[valueKey]}`}
                      />
                    ) : null}
                  </span>
                </button>
              ) : null}
            </article>
          );
        })}
      </section>

      {renderMemberNotices("hero-panels--mobile-footer")}

    </div>
  );
}
