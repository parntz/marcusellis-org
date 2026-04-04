import "./globals.css";
import { siteMeta } from "../lib/site-data";
import { Providers } from "./providers";

export const metadata = {
  title: siteMeta.title,
  description: siteMeta.kicker || siteMeta.title,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          "--bg": "#090b11",
          "--surface": "rgba(16, 19, 30, 0.78)",
          "--surface-strong": "rgba(19, 23, 38, 0.95)",
          "--ink": "#edf2ff",
          "--muted": "rgba(225, 233, 255, 0.72)",
          "--line": "rgba(160, 183, 255, 0.2)",
          "--accent": "#24d6ff",
          "--accent-dark": "#9cecff",
          "--accent-soft": "#2d8cff",
          "--shadow": "0 28px 72px rgba(0, 0, 0, 0.45)",
          "--display": '"Anton", Impact, "Arial Narrow", sans-serif',
          "--body": '"Lato", "Inter", "Segoe UI", Arial, sans-serif',
          "--page-background":
            "radial-gradient(100% 120% at 15% 0%, #0c1a33 0%, #07090e 56%, #06070c 100%)",
          "--brand-background":
            "linear-gradient(120deg, rgba(32, 58, 110, 0.42) 0%, rgba(15, 38, 82, 0.45) 52%, rgba(11, 14, 28, 0.88) 100%)",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
