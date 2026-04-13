# DB-Driven System Reference

## Purpose

This document gives the building agent a concrete outline of the major DB-driven content systems already present in this repo.

The goal is not to force every target site into these exact shapes.

The goal is to help the builder answer two questions quickly:

- does the target site's dynamic content fit one of the existing systems
- if it does, where is that system rendered and how is it edited

These systems should remain available during the conversion unless there is a deliberate decision to replace them.

## Shared Rule

For each target site, the builder should compare dynamic or repeated content types against these systems before inventing a new data model.

If a target site's content fits one of these systems with reasonable mapping, reuse the system.

If it does not fit cleanly, document the mismatch and then decide whether to extend the system or add a new one.

## Member Pages

### Purpose

Public member profile directory plus individual member profile pages with member-editable content and media.

### Public Routes

- `/member-pages`
- `/users/[slug]`
- `/user/[slug]/contact`

### Data Model

- `member_pages`
- `member_profile_media`
- `auth_users` links members to login accounts

### Public Behavior

- searchable member directory
- list/grid style presentation
- individual profile pages
- media, summary, instruments, links, contact content, featured video

### Editing Surface

- member profile editing is available through the member profile routes and API
- upload/edit/delete support exists for member-owned profile content

### Key Code

- page listing: [app/member-pages/page.js](/Users/paularntz/Sites/site-model-one/app/member-pages/page.js:1)
- profile page: [app/users/[slug]/page.js](/Users/paularntz/Sites/site-model-one/app/users/[slug]/page.js:1)
- data layer: [lib/member-profiles.js](/Users/paularntz/Sites/site-model-one/lib/member-profiles.js:1)
- editor UI: [components/member-profile-editor.js](/Users/paularntz/Sites/site-model-one/components/member-profile-editor.js:1)
- API: [app/api/member-profiles/[slug]/route.js](/Users/paularntz/Sites/site-model-one/app/api/member-profiles/[slug]/route.js:1)
- uploads: [app/api/member-profiles/[slug]/upload/route.js](/Users/paularntz/Sites/site-model-one/app/api/member-profiles/[slug]/upload/route.js:1)

### Target-Site Fit

Good fit for:

- staff/member directories
- expert/provider directories
- public profile systems
- contributor bios with individual pages

## Photo And Video Gallery

### Purpose

Searchable mixed-media gallery with images, videos, descriptions, tags, and admin editing.

### Public Route

- `/photo-and-video-gallery`

### Data Model

- `photo_gallery_items`
- page-level intro/config in `site_config`

### Public Behavior

- mixed image and video feed
- gallery search and filtering behavior
- item-level metadata and descriptive content
- member tagging support through discovery metadata

### Editing Surface

- intro/header config editing
- item-level create/update/delete support
- upload support for gallery assets

### Key Code

- data layer: [lib/photo-gallery.mjs](/Users/paularntz/Sites/site-model-one/lib/photo-gallery.mjs:1)
- page integration: [components/mirrored-page.js](/Users/paularntz/Sites/site-model-one/components/mirrored-page.js:617)
- intro admin: [components/photo-gallery-intro-admin.js](/Users/paularntz/Sites/site-model-one/components/photo-gallery-intro-admin.js:1)
- item admin: [components/photo-gallery-item-admin.js](/Users/paularntz/Sites/site-model-one/components/photo-gallery-item-admin.js:1)
- API config: [app/api/site-config/photo-gallery/route.js](/Users/paularntz/Sites/site-model-one/app/api/site-config/photo-gallery/route.js:1)
- API items: [app/api/site-config/photo-gallery/items/[id]/route.js](/Users/paularntz/Sites/site-model-one/app/api/site-config/photo-gallery/items/[id]/route.js:1)

### Target-Site Fit

Good fit for:

- photo archives
- video libraries
- press/media galleries
- case-study or portfolio galleries with repeated media entries

## Nashville Musician Magazine

### Purpose

Magazine/archive style content system backed by stored structured issue metadata rather than freeform page HTML.

### Public Route

- `/nashville-musician-magazine`

### Data Model

- archive config stored in `site_config` under the magazine archive key

### Public Behavior

- issue/archive presentation
- structured issue list rather than arbitrary article bodies

### Editing Surface

- config is persisted through the archive config setter
- current editing is more config-driven than article-CMS-driven

### Key Code

- config layer: [lib/site-config-magazine-archive.mjs](/Users/paularntz/Sites/site-model-one/lib/site-config-magazine-archive.mjs:1)
- archive shaping: [lib/magazine-archive.mjs](/Users/paularntz/Sites/site-model-one/lib/magazine-archive.mjs:1)
- page integration: [components/mirrored-page.js](/Users/paularntz/Sites/site-model-one/components/mirrored-page.js:619)

### Target-Site Fit

Good fit for:

- issue archives
- publication libraries
- downloadable newsletter archives

Weak fit for:

- full article/blog CMS with rich per-post editing

## Member Site Links

### Purpose

Curated directory of outbound links with titles and subtitles, shown as a managed directory page.

### Public Route

- `/member-site-links`

### Data Model

- `member_site_links`
- hero/intro config in `site_config`

### Public Behavior

- searchable or browsable link directory
- repeated cards or entries pointing to external URLs

### Editing Surface

- create/update/delete link entries
- hero and intro editing

### Key Code

- data layer: [lib/member-site-links.js](/Users/paularntz/Sites/site-model-one/lib/member-site-links.js:1)
- page integration: [components/mirrored-page.js](/Users/paularntz/Sites/site-model-one/components/mirrored-page.js:615)
- directory UI: [components/member-site-links-directory.js](/Users/paularntz/Sites/site-model-one/components/member-site-links-directory.js:1)
- create button: [components/member-site-links-create-button.js](/Users/paularntz/Sites/site-model-one/components/member-site-links-create-button.js:1)
- hero admin: [components/member-site-links-hero-admin.js](/Users/paularntz/Sites/site-model-one/components/member-site-links-hero-admin.js:1)
- intro admin: [components/member-site-links-intro-admin.js](/Users/paularntz/Sites/site-model-one/components/member-site-links-intro-admin.js:1)
- API entries: [app/api/member-site-links/route.js](/Users/paularntz/Sites/site-model-one/app/api/member-site-links/route.js:1)
- API entry detail: [app/api/member-site-links/[id]/route.js](/Users/paularntz/Sites/site-model-one/app/api/member-site-links/[id]/route.js:1)

### Target-Site Fit

Good fit for:

- resource directories
- partner links
- member/vendor/service link hubs
- useful-links pages with repeated external destinations

## Gigs

### Purpose

Time-based event listing with detail pages, venue/location metadata, optional imagery, and full admin CRUD.

### Public Routes

- `/gigs`
- `/gigs/[id]`

### Data Model

- `gigs`

### Public Behavior

- upcoming event list
- search/filter by text and date
- detail pages
- location and artist/band information

### Editing Surface

- full admin create/update/delete support
- image upload support
- Google Maps/Place integration in the editor

### Key Code

- page: [app/gigs/page.js](/Users/paularntz/Sites/site-model-one/app/gigs/page.js:1)
- detail page: [app/gigs/[id]/page.js](/Users/paularntz/Sites/site-model-one/app/gigs/[id]/page.js:1)
- data layer: [lib/gigs.js](/Users/paularntz/Sites/site-model-one/lib/gigs.js:1)
- admin UI: [components/gigs-manager.js](/Users/paularntz/Sites/site-model-one/components/gigs-manager.js:1)
- listing UI: [components/gigs-list.js](/Users/paularntz/Sites/site-model-one/components/gigs-list.js:1)
- API list/create: [app/api/gigs/route.js](/Users/paularntz/Sites/site-model-one/app/api/gigs/route.js:1)
- API update/delete: [app/api/gigs/[id]/route.js](/Users/paularntz/Sites/site-model-one/app/api/gigs/[id]/route.js:1)
- API upload: [app/api/gigs/upload/route.js](/Users/paularntz/Sites/site-model-one/app/api/gigs/upload/route.js:1)

### Target-Site Fit

Good fit for:

- events calendars
- appearances or performances
- classes/workshops with schedule and location
- recurring public happenings with detail pages

## Find An Artist Or Band

### Purpose

Public directory of artist/band-style profiles distinct from member pages.

### Public Routes

- `/find-an-artist-or-band`
- `/find-an-artist-or-band/[slug]`

### Data Model

- `artist_band_profiles`

### Public Behavior

- public directory/listing
- detail pages
- profile copy, personnel, links, images, featured video

### Editing Surface

- profile editing and media upload support exist
- intended for admin-managed directory entries

### Key Code

- data layer: [lib/find-artist-directory.mjs](/Users/paularntz/Sites/site-model-one/lib/find-artist-directory.mjs:1)
- listing/gallery UI: [components/find-artist-gallery.js](/Users/paularntz/Sites/site-model-one/components/find-artist-gallery.js:1)
- detail page: [app/find-an-artist-or-band/[slug]/page.js](/Users/paularntz/Sites/site-model-one/app/find-an-artist-or-band/[slug]/page.js:1)
- editor UI: [components/artist-band-profile-editor.js](/Users/paularntz/Sites/site-model-one/components/artist-band-profile-editor.js:1)
- API entry: [app/api/artist-band-profiles/[slug]/route.js](/Users/paularntz/Sites/site-model-one/app/api/artist-band-profiles/[slug]/route.js:1)
- API upload: [app/api/artist-band-profiles/[slug]/upload/route.js](/Users/paularntz/Sites/site-model-one/app/api/artist-band-profiles/[slug]/upload/route.js:1)

### Target-Site Fit

Good fit for:

- vendor/provider directories
- band/artist/talent rosters
- team or service profiles that are more directory-like than member-owned

## News And Events

### Purpose

Hybrid listing/detail content system for dated or announcement-style content.

### Public Routes

- `/news-and-events`
- `/news-and-events/[...slug]`
- some detail content may also surface under `/event/...`

### Data Model

- `news_events_items`
- `news_event_pages`

### Public Behavior

- listing feed
- archive-style browsing
- detail pages
- search/filter behavior

### Editing Surface

- list/detail content is backed by DB tables
- current editing exists through page-header and feed-related admin surfaces rather than a full modern newsroom CMS

### Key Code

- page: [app/news-and-events/[[...slug]]/page.js](/Users/paularntz/Sites/site-model-one/app/news-and-events/[[...slug]]/page.js:1)
- data layer: [lib/news-events-items.js](/Users/paularntz/Sites/site-model-one/lib/news-events-items.js:1)
- feed UI: [components/news-events-feed.js](/Users/paularntz/Sites/site-model-one/components/news-events-feed.js:1)
- API feed: [app/api/news-events/route.js](/Users/paularntz/Sites/site-model-one/app/api/news-events/route.js:1)

### Target-Site Fit

Good fit for:

- news/blog hybrids
- announcements
- event/news combined feeds
- press release streams

## Availability Rule

All of the systems above should remain available to the builder during conversion, including their editing capabilities, unless a deliberate migration decision says otherwise.

That means:

- do not remove their routes until replacement routing is decided
- do not remove their DB tables until replacement models are decided
- do not remove their API surfaces until replacement edit flows are decided
- do not remove their editor UIs until replacement admin/member flows are verified

## Builder Decision Rule

When reviewing a target site's dynamic content, test fit in this order:

1. member-owned profiles
2. admin-managed profiles/directory entries
3. events/gigs
4. news/announcements
5. gallery/media archives
6. link/resource directories
7. publication/issue archives

If a target content type clearly fits one of these systems, reuse the system and document the field mapping.

If a target content type only partially fits, document:

- what maps cleanly
- what does not map
- whether extension is enough
- whether a new system is required
