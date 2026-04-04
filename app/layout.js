import "./globals.css";
import "./callout-rotator.css";
import { Footer } from "../components/footer";
import { SiteHeader } from "../components/site-header";
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <SiteHeader />
          <main className="page-shell">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
