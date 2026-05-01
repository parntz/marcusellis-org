# Gabriel Resource Site

A cinematic, image-driven Next.js App Router site for Gabriel's personal story, educational resources, videos, articles, affiliations, donations, intake, and contact.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Configure Turso

1. Create a Turso database.
2. Copy the database URL.
3. Create a Turso auth token.
4. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to `.env.local` and to Netlify environment variables.

This project is designed around Turso/libSQL for production and intentionally rejects `file:` SQLite URLs.

## Database

Push or migrate schema:

```bash
npm run db:push
```

Seed starter content:

```bash
npm run db:seed
```

Seed data lives in `src/db/content.ts`. Update article, product, video, donation, navigation, and setting records there, then rerun the seed command.

## Build

```bash
npm run build
```

## Deploy to Netlify

1. Connect the repository in Netlify.
2. Use build command `npm run build`.
3. Use Netlify's Next.js support with `@netlify/plugin-nextjs`.
4. Add environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_META_PIXEL_ID`

## Images

Place final public images here:

- `/public/images/hero/forest-path.jpg`
- `/public/images/hero/iceland-water.jpg`
- `/public/images/portraits/client-main.jpg`
- `/public/images/portraits/client-speaking.jpg`
- `/public/images/business/business-1.jpg`
- `/public/images/business/business-2.jpg`
- `/public/images/videos/my-story-thumb.jpg`
- `/public/images/videos/red-pill-thumb.jpg`
- `/public/images/videos/healing-web-thumb.jpg`
- `/public/images/videos/keyboards-thumb.jpg`
- `/public/images/textures/grain.png`

If an expected image is missing, `PublicImage` falls back to local SVG placeholders in `/public/placeholders/`.

## Video URLs

Replace placeholder URLs in `src/db/content.ts`, then run:

```bash
npm run db:seed
```

## Donation Links

Donation providers are seeded from `seedDonationLinks` in `src/db/content.ts`. Add PayPal, Stripe Payment Link, Donorbox, GiveButter, or another approved URL there and rerun the seed command.

## Disclaimers

Medical, legal, financial, affiliate, and external-link disclaimers live in `src/db/content.ts` and appear in the footer, resource pages, article detail pages, products, intake, and the dedicated disclaimer page. Keep all medical content educational and avoid cure, treatment, prevention, or anti-doctor claims.

## Cookie and Analytics Consent

`CookieConsentBanner` stores consent locally. Google Analytics and Meta Pixel scripts load only after consent and only when `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_META_PIXEL_ID` are configured.
