# Marcus Ellis Resource Site

A cinematic, image-driven Next.js App Router site for Marcus Ellis's personal story, educational resources, videos, articles, affiliations, donations, intake, and contact.

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
4. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to `.env.local` and to Netlify environment variables. `TURSO_API_TOKEN` is also supported when that is the token name provided.

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

Seed data in `src/db/content.ts` is bootstrap-only. Runtime content must live in Turso and be read through `src/db/queries.ts`; do not import `src/db/content.ts` from app routes or components. Rerunning the seed command may overwrite starter records with matching slugs or setting keys, so use it for initial setup or intentional reseeding rather than day-to-day content edits.

## Content Source of Truth

From here on out, any content or configurable data that can be stored in Turso must be stored in Turso. This includes articles, videos, products, donation links, navigation, page records, disclaimers, external URLs, and site settings.

When adding new content-driven behavior, add or extend a Turso-backed table or `site_settings` key, then expose it through `src/db/queries.ts`. Avoid hardcoded content arrays, JSON files, Markdown files, filesystem reads, or component-level copy that would need future content editing in code.

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
   - `TURSO_AUTH_TOKEN` or `TURSO_API_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_META_PIXEL_ID`

## Images

The site uses the image files currently stored at the public root:

- `/public/Cowboy Aqua at home.jpg`
- `/public/IncomingPictures 005.jpg`
- `/public/_GP_6081.jpg`
- `/public/Pix up close blonde guy!.jpg`
- `/public/STUDIO 1 Marcus_E-19 COWBOY (1).jpg`
- `/public/STUDIO 1 Marcus_E-20 COWBOY 2 BEST.jpg`

Shared image assignments live in `src/lib/assets.ts`. Existing legacy `/images/...` database values are mapped to these public files at render time.

## Video URLs

Update video URLs in Turso. For first-time setup only, update the bootstrap seed records in `src/db/content.ts`, then run:

```bash
npm run db:seed
```

## Donation Links

Donation providers live in the Turso `donation_links` table. For first-time setup only, update `seedDonationLinks` in `src/db/content.ts` and rerun the seed command.

## Disclaimers

Medical, legal, financial, affiliate, and external-link disclaimers live in Turso `site_settings` records and appear in the footer, resource pages, article detail pages, products, intake, and the dedicated disclaimer page. Keep all medical content educational and avoid cure, treatment, prevention, or anti-doctor claims.

## Cookie and Analytics Consent

`CookieConsentBanner` stores consent locally. Google Analytics and Meta Pixel scripts load only after consent and only when `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_META_PIXEL_ID` are configured.
