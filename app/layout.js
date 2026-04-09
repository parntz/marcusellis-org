import "./globals.css";
import "./admin-glass-overlay.css";
import "./callout-rotator.css";
import { Suspense } from "react";
import { Footer } from "../components/footer";
import { SiteHeader } from "../components/site-header";
import { MobileMemberNoticeDock } from "../components/mobile-member-notice-dock";
import { getSiteBackgroundConfig } from "../lib/site-config-site-background";
import { siteMeta } from "../lib/site-data";
import { Providers } from "./providers";

export const metadata = {
  title: siteMeta.title,
  description: siteMeta.kicker || siteMeta.title,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({ children }) {
  const backgroundConfig = await getSiteBackgroundConfig();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ "--site-page-wash-opacity": String(backgroundConfig.opacity) }}
    >
      <body suppressHydrationWarning>
        <Providers>
          <Suspense fallback={<header className="site-header" aria-hidden />}>
            <SiteHeader initialBackgroundOpacity={backgroundConfig.opacity} />
          </Suspense>
          <main className="page-shell">{children}</main>
          <div id="mobile-member-notice-slot">
            <MobileMemberNoticeDock />
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
