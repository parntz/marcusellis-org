import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { getNavigationLinks } from "@/db/queries";
import { assets } from "@/lib/assets";
import { absoluteUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"),
  title: {
    default: "Marcus Ellis | Healing, Story, and Truth",
    template: "%s | Marcus Ellis"
  },
  description: "A cinematic educational resource site for personal story, interviews, articles, and carefully framed healing-related resources.",
  openGraph: {
    title: "Marcus Ellis | Healing, Story, and Truth",
    description: "Explore personal stories, research links, interviews, resources, and reflections gathered for people asking deeper questions.",
    url: absoluteUrl("/"),
    siteName: "Marcus Ellis",
    images: [{ url: assets.forestPathHero.src, width: 1200, height: 630 }],
    type: "website"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const links = await getNavigationLinks();

  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        <Header links={links} />
        <main>{children}</main>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
