"use client";

import Script from "next/script";
import { useState } from "react";

type Consent = "accepted" | "rejected" | "managed" | null;

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<Consent>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("marcus-ellis-cookie-consent") as Consent;
  });
  const [manage, setManage] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const analyticsAllowed = consent === "accepted" || consent === "managed";

  function save(value: Exclude<Consent, null>) {
    localStorage.setItem("marcus-ellis-cookie-consent", value);
    setConsent(value);
  }

  return (
    <>
      {analyticsAllowed && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-consent" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {analyticsAllowed && metaPixelId ? (
        <Script id="meta-pixel-consent" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {consent ? null : (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-[2rem] border border-ivory/15 bg-charcoal/95 p-5 shadow-2xl backdrop-blur">
          <h2 className="font-serif text-2xl">Cookie preferences</h2>
          <p className="mt-2 text-sm leading-6 text-ivory/70">
            We use essential cookies for site preferences. Analytics or advertising scripts load only if you consent and IDs are configured.
          </p>
          {manage ? (
            <div className="mt-4 rounded-2xl bg-ivory/5 p-4 text-sm text-ivory/70">
              Non-essential analytics: <strong className="text-ivory">optional</strong>. You can accept or reject them now.
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="focus-ring rounded-full bg-gold-200 px-4 py-2 font-semibold text-forest-950" onClick={() => save("accepted")}>
              Accept all
            </button>
            <button className="focus-ring rounded-full border border-ivory/20 px-4 py-2" onClick={() => save("rejected")}>
              Reject non-essential
            </button>
            <button className="focus-ring rounded-full px-4 py-2 text-gold-200" onClick={() => setManage((value) => !value)}>
              Manage preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
}
