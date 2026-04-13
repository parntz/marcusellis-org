# Site Conversion Playbook

## Goal

Convert this repo from its current site-specific implementation into a reusable site-conversion framework that can:

- preserve the existing application capabilities already built here
- replace the current site's branding, design, navigation, editorial content, and assets with those of a target site
- store all appropriate site content in the database
- keep the editing capabilities and editing patterns already present in this repo
- produce a ready-to-deploy proof of concept that matches the target site's public-facing structure and content as closely as practical

This document is the working operating guide for the agent performing the conversion.

It is expected to evolve as the current site is dismantled and generalized one subsystem at a time.

## Terminology

In this repo, "playbook" may be used as shorthand for the builder-facing operating guide plus the structured handoff artifacts the gathering/harvesting agent prepares for the building agent.

That shorthand is acceptable as long as the meaning stays clear:

- the playbook defines the rules, defaults, and decision standards
- the handoff artifacts carry the concrete target-site findings and mapped replacement decisions
- together they should let the gathering/building agent rebuild the site quickly, accurately, and with minimal guesswork

## Non-Negotiables

- The finished public-facing site must match the target site's visible navigation, page hierarchy, page titles, and editorial content as closely as practical.
- The finished site must not visibly retain branding, colors, typography, copy, imagery, or navigation from the current source site unless that material is truly generic and intentionally reused.
- Existing advanced functionality should be preserved whenever it is still compatible with the target site's needs.
- Editing capabilities should remain and should reuse the current repo's editing approach whenever practical.
- All site content that is reasonably editable or structured should be stored in the database rather than hardcoded in source files.
- Database-derived content types should be imported as proof of concept with six representative examples per type unless fewer than six exist.
- The harvesting agent must collect only builder-relevant material and must not bulk-download the target site.

## Harvester Operating Principle

The harvester exists to make the builder fast, accurate, and predictable.

The harvester is not a general-purpose crawler and is not allowed to gather material with unclear purpose.

Before collecting any page, asset, or record, the harvester must be able to answer:

- what this item is for
- where it will be used in the rebuilt site
- whether it supports exact-match fidelity, proof-of-concept content, or design reconstruction
- what happens if it is omitted

If those answers are not clear, the item should be logged for review instead of downloaded by default.

## Builder-First Handoff Rule

The output of harvesting must be builder-ready.

That means:

- every collected item has a known purpose
- every collected page is classified
- every collected asset has a target destination and usage note
- every database-derived sample has a reason for selection
- every approximation or omission is documented
- every removed item or reset-to-default decision names the exact replacement default

The builder should never need to:

- sort through a raw asset dump
- infer why something was downloaded
- guess whether a page is static or DB-derived
- reverse-engineer which sample records matter
- decide whether an unclassified asset should be used
- guess what replaced a removed item

## Removal And Default Replacement Rule

When the agent removes source-specific content, configuration, UI text, styling, or behavior, or resets something to a default value, the replacement must be documented explicitly in the playbook-facing worklog and handoff artifacts.

Minimum documentation for each such decision:

- what was removed or reset
- what default or fallback replaced it
- where that replacement lives: DB seed, code default, framework behavior, or intentionally empty state
- why that default is the correct replacement
- whether the replacement is temporary, target-derived, framework-standard, or final

Do not describe a change only as "removed" or "set back to default."

The agent must name the resulting state concretely, for example:

- removed source-site sidebar promo and left the route sidebar disabled by default
- removed source-site notice copy and replaced it with the generic temporary notice seed
- removed branded hero text and fell back to the framework's empty hero state until target copy is imported

When the replacement is a framework default rather than target-derived content, the playbook-facing record should name that default literally.

Current framework-default examples that should be documented exactly when used:

- site title default: `Default Title`
- eyebrow/kicker default: `eyebrow`
- logo/brand mark default: plain white box

## Do Not Bulk Download

Do not mirror the target site indiscriminately.

Do not download:

- every image on the site
- full media libraries without mapped usage
- complete archives unless explicitly requested
- duplicate responsive image variants unless one is actually needed
- hidden/admin/internal pages
- orphaned pages with no role in navigation or proof of concept
- PDFs, documents, or downloads that are not required for kept pages or required workflows
- assets whose purpose is unknown

When in doubt, prefer:

- classification before download
- mapping before collection
- selective harvesting over comprehensive dumping

## Product Features To Preserve

These are reusable platform capabilities and should be treated as durable unless a later decision says otherwise:

- authentication
- member accounts and member-facing workflows
- member profile pages and related editing
- artist/band or directory-style profile pages
- photo galleries
- video galleries
- file and media uploads
- contact and form workflows
- protected editing flows
- reusable admin/editor patterns already established in the app
- route-aware sidebar systems
- notice, callout, and page-header promo systems

These should be adapted to the target site, not discarded by default.

## Source-Site Elements To Replace

These are site-specific and should be treated as disposable unless explicitly preserved:

- logos, brand marks, favicon, and partner/promo branding
- color palette and theme tokens
- fonts and typographic expression
- page backgrounds and decorative visual system
- navigation labels, groupings, and information architecture
- footer content and footer promos
- homepage structure and homepage copy
- page headers, callouts, hero sections, promotional strips, and CTA language
- all page body content that belongs to the current site
- current site-specific assets and photography unless they are truly generic placeholders during migration

## Content Storage Policy

The default rule is: if content is site-specific and editable, it belongs in the database.

### Store In The Database

- page titles
- slugs and route definitions
- page body content
- SEO title/description where needed
- navigation labels, hierarchy, and destinations
- footer groups and footer links
- homepage sections
- hero slides and hero copy
- CTA blocks
- callouts, banners, and promos
- reusable content blocks
- sidebar content
- page-header overrides
- route-level sidebar visibility settings
- route-level notice or callout visibility settings
- gallery metadata
- member/profile content
- directory/profile content
- news, events, blog-style content
- staff/team entries
- any site-specific labels shown to editors or end users when those labels should vary by site

### Keep In Code

- layout structure
- rendering logic
- authentication and authorization logic
- validation rules
- upload and storage logic
- schema definitions and migrations
- reusable editor UI mechanics
- fallback defaults used only when DB content is absent

### Transitional Rule

Hardcoded content is acceptable only as a short-lived migration step. It should be considered incomplete until moved into the database.

## Target-Site Fidelity Rules

### Must Match Closely

- primary navigation
- utility navigation if visible
- footer navigation
- page titles
- route structure where practical
- homepage section order
- major CTA structure
- public page copy
- public images and branding where assets can be obtained legally and technically

### May Be Approximated

- exact font family when the target font is licensed or unavailable
- images that cannot be harvested at usable quality
- subtle animation and motion details
- dynamic listing depth beyond the proof-of-concept record count

### Must Be Explained If Approximated

If the output diverges materially from the target site, record:

- what differs
- why it differs
- whether the difference is temporary or permanent
- what would be required to close the gap

## Content Classification Rules

Every discovered page or route from the target site should be classified into one of these buckets:

- static page
- database-derived listing page
- database-derived detail page
- utility page
- external-link destination
- ignore/remove

### Static Page

Harvest fully.

This includes:

- page title
- route
- body content
- images/assets
- metadata where available

### Database-Derived Listing Page

Do not treat the listing as a one-off static page if it is clearly generated from repeated structured content.

Instead:

- identify the underlying content type
- map the listing structure to DB-backed rendering
- import six representative records by default

### Database-Derived Detail Page

Treat the detail page as a content model plus sample records.

Examples:

- member pages
- news posts
- events
- directory entries
- blog articles
- gallery items

### Utility Page

Map to this repo's reusable application behavior where possible.

Examples:

- sign in
- register
- password reset
- contact
- gated member pages

### External-Link Destination

Keep external if that matches the target site's behavior unless there is a strong reason to internalize it.

### Ignore/Remove

Use for:

- dead pages
- duplicate pages
- legacy remnants not reachable from current navigation
- thin archive scaffolding that is not useful for proof of concept

Ignored pages should still be documented briefly so the decision is auditable.

## Harvester Output Contract

For each target-site conversion, the harvester must produce a structured handoff for the builder.

Required outputs:

- route map
- navigation map
- content map
- asset map
- design map
- proof-of-concept sample set
- mismatch log
- fallback log

### Route Map

The route map must include:

- route
- page title
- nav source
- classification
- status: keep, sample, adapt, ignore
- notes for builder

### Navigation Map

The navigation map must include:

- nav region: primary, utility, footer, mobile
- label
- destination
- parent grouping if applicable
- ordering
- notes on dropdown or interaction behavior

### Content Map

The content map must include:

- route
- content type
- static or DB-derived
- whether full harvest is required
- whether sample import is sufficient
- content dependencies
- builder notes

### Asset Map

The asset map must include:

- asset purpose
- source page or component
- source URL
- target local destination
- required format notes
- required size/aspect notes
- whether exact asset is required or a substitute is acceptable
- fallback instruction

### Design Map

The design map must include:

- palette summary
- typography roles
- spacing/layout notes
- page structure notes
- interaction notes
- screenshots or references tied to specific components

If the target site uses supporting rails, notices, banners, or route-specific page-header promos, the design map must also include:

- region placement rules
- spacing behavior relative to main content
- visual hierarchy relative to the page title and body content
- mobile behavior for those regions

### Proof-Of-Concept Sample Set

For each DB-derived content type, include:

- chosen sample entries
- why each was selected
- which fields/components it exercises
- whether it is representative, edge-case, or both

### Mismatch Log

The mismatch log must record:

- missing pages
- missing assets
- inaccessible assets
- unclear structures
- content that could not be classified confidently
- differences between target behavior and framework capability

### Fallback Log

The fallback log must record:

- what original item was unavailable
- what substitute was chosen
- why the substitute is appropriate
- whether the fallback is temporary or approved
- where the substitute/default is defined

## Naming And Destination Rules

The harvester must store collected files using names that make their purpose obvious to the builder.

Rules:

- name files by usage, not by opaque hash when possible
- group files by target feature or page area
- keep source references in the asset map rather than relying on filenames alone
- do not create folders full of miscellaneous unclassified media

Preferred organization:

- branding assets
- homepage assets
- page-specific assets
- gallery proof-of-concept assets
- directory/member proof-of-concept assets
- design-reference captures

## Collection Decision Rules

For each potential page or asset, apply these rules in order:

1. Is it needed to reproduce visible navigation or public structure
2. Is it needed to reproduce a kept static page
3. Is it needed as one of the six representative records for a DB-derived section
4. Is it needed to understand design behavior or UI composition
5. Is it needed for a preserved workflow such as auth, member editing, gallery management, or contact

If the answer to all five is no, do not collect it.

If the answer is uncertain, log it for review and do not download it by default.

## Stop Conditions For The Harvester

Harvesting is complete when all of the following are true:

- all visible nav destinations are classified
- all kept static pages are mapped
- all required design references are captured
- all required brand assets are mapped or logged as missing
- all DB-derived proof-of-concept types have selected samples
- all fallbacks are documented
- there are no unclassified downloaded assets

Harvesting is not complete just because the crawler found more pages or assets.

## Database-Derived Proof-Of-Concept Rules

Unless instructed otherwise, import up to six representative records for each database-driven content type.

Recommended defaults:

- member profiles: 6
- directory entries: 6
- news/blog posts: 6
- events: 6
- gallery photos: 6
- gallery videos: 6
- staff/team entries: 6

If fewer than six exist, import all available.

When selecting the sample set, prefer diversity:

- different layouts
- different image treatments
- different content lengths
- different categories or subtypes
- examples that exercise important fields

## Navigation Harvesting Rules

Navigation is authoritative.

Build the route plan from the target site's current visible navigation, not from guesses based on internal links alone.

Capture and document:

- primary navigation
- utility navigation
- footer navigation
- mobile navigation behavior
- dropdown structure
- repeated links appearing in multiple navigation zones

Rules:

- preserve nav labels exactly unless there is a clear technical reason not to
- preserve destination hierarchy where practical
- preserve dropdown grouping where practical
- preserve duplicate appearances of important links if the target site does so
- do not silently omit visible nav items

If a visible nav item is skipped, record:

- label
- source URL
- reason for omission

## Sidebar And Notice System Policy

The sidebar and notice systems should be preserved as reusable framework capabilities.

They are not source-site-specific features. They are layout and editorial-delivery systems that help the rebuilt site match target structure without hardcoding one-off page logic.

### Keep Intact

- route-aware sidebar assignment
- reusable sidebar box sets
- sidebar width and route-level sidebar enable or disable behavior
- notice or callout rotation and visibility controls
- page-header override and page-header promo patterns
- admin editing flows for these systems

### Replace

- all inherited sidebar content from the source site
- current site-specific notice or callout copy
- current site-specific labels and terminology
- current source-site visual styling and theme assumptions
- current default seeded content that only makes sense for the source site

### Generalize

- make labels generic rather than source-site branded
- make sidebar box types reusable across target sites
- make notice and callout usage configurable by route and region
- ensure all content for these systems is stored in the database
- treat source-site defaults as temporary until replaced by target-site or framework defaults

### Sidebar Content Rule

Do not preserve inherited sidebar content from the source site.

The sidebar system should survive, but its content should not.

That means:

- remove all source-site sidebar text, promos, CTAs, contact panels, and notices
- keep the route-aware sidebar functionality, storage, rendering, and editing support
- allow sidebar-capable routes to remain empty or disabled during early conversion
- do not invent placeholder sidebar content just to occupy the region
- when sidebar content is removed, document whether the resulting default is an empty sidebar assignment, a disabled sidebar route state, or a framework seed

### Sidebar Generation Rule

Only generate new sidebar content after the target site's main page content, navigation, and route structure have been imported.

Preferred order:

1. import target-site page content
2. map target-site routes and content into DB-backed page structures
3. derive sidebar content programmatically from the imported content where appropriate
4. enable sidebars only on routes where derived or explicitly mapped sidebar content is justified

If sidebar content cannot be derived confidently from the target-site content model, leave the sidebar disabled rather than fabricating filler.

### Notice Content Rule

Keep the member notice or header callout system intact during conversion.

Unlike inherited sidebar content, the notice system may remain visibly populated during migration, but the source-site notice content should be replaced with generic filler content immediately.

That means:

- remove inherited source-site notice text and links
- keep the notice rotation, visibility controls, rendering, and editing support intact
- replace the notice records with generic placeholder notices that are obviously temporary and site-agnostic
- use those placeholders only to preserve the live behavior of the system while the rest of the site is being converted
- document the exact placeholder/default notice set used so the replacement state is auditable

Later in the process:

- inspect the imported target-site content for obvious notice-worthy material
- map that material into the notice system where appropriate
- remove the generic placeholder notices once target-derived notices are ready

### Builder Rule

The builder should preserve the capability even if the target site uses it lightly.

Do not remove the sidebar or notice systems just because a single target site does not emphasize them.

Instead:

- disable them per route when unused
- leave the reusable framework intact
- keep the editor paths available for future sites

### Harvester Rule

The harvester must explicitly inspect whether the target site has any of the following:

- right-rail or left-rail supporting content
- inline promo panels adjacent to main content
- top-of-page notices
- rotating notices or banner promos
- route-specific page-header promos
- persistent informational panels tied to certain page families

If present, the harvester must capture:

- placement
- ordering
- content type
- styling role
- page or route scope
- whether the region appears globally, by section, or by page

If absent, the harvester must record that absence so the builder can intentionally disable the systems on the converted site rather than guessing.

### Mapping Rule

Map target-site supporting content into these framework systems whenever practical:

- target-side supporting rail content maps to sidebar box sets
- top-of-page notices or promo strips map to notice or callout systems
- page-family-specific promo or header regions map to page-header overrides or route-level callout configuration

If the target site has no explicit supporting rail content, the builder may later derive sidebar content from imported page content, but should not do so until the primary page content migration is complete.

Only create a new system if the target site's behavior cannot be represented cleanly by the existing sidebar and notice framework.

### Fallback Rule

If the target site has no meaningful sidebar or notice system:

- keep the framework capability intact
- disable the features by default on migrated routes
- do not invent new sidebar or notice content just to fill space

### Source Of Truth Rule

Sidebar content, callout content, page-header promo content, and route-level visibility settings should all be treated as database-backed site content, not hardcoded layout content.

## Asset Harvesting Rules

Attempt to harvest target-site assets in this order:

- logo
- favicon
- homepage hero media
- homepage section imagery
- page banner/hero images
- background textures/patterns
- icons or visual glyphs
- supporting editorial images

For every harvested asset, record:

- source URL
- intended usage
- local destination path
- whether it is original, transformed, or substituted

Do not harvest an asset unless its intended usage is known.

### Asset Quality Rules

- preserve transparency where required
- preserve aspect ratio
- prefer original or highest-usable resolution
- optimize format only after capture
- do not upscale weak assets unless no alternative exists

### Fallback Rules

If an asset cannot be obtained cleanly:

1. Use an equivalent asset from another location on the target site.
2. Use a mission-relevant substitute consistent with the target site's geography, industry, and tone.
3. Use a neutral but stylistically compatible placeholder.

Examples:

- If there is no usable hero rotator imagery, source city/state imagery or mission-relevant local imagery.
- If the logo file is unavailable, recreate a text-based lockup using the closest available typography and color treatment.
- If icons are inaccessible, replace them with a coherent icon set that matches the target style.

Every fallback must be logged as temporary unless the user explicitly approves it as final.

## Design Extraction Rules

Before building the new presentation layer, extract the target site's design language.

Capture:

- primary and secondary palette
- neutrals and background palette
- accent usage
- typography roles
- spacing density
- border radius style
- border style
- shadow style
- image treatment
- button style
- card style
- section rhythm
- page-header patterns
- footer composition
- desktop nav behavior
- mobile nav behavior

Produce a design summary with:

- design tokens
- component style notes
- layout behavior notes
- key screenshots or references
- a list of what must be matched versus what may be approximated

### Color Capture Rule

The harvester must explicitly gather the target site's color system rather than allowing the framework's current fallback colors to persist by default.

At minimum, capture:

- page background color(s)
- header background color(s)
- surface/card color(s)
- primary text color
- muted/supporting text color
- border/divider color
- primary accent color
- dark accent or emphasis color
- soft accent/tint color
- shadow treatment if color-driven
- gradient usage, including where gradients are used and where they are not

If the target site uses different colors by region or page family, record that scope explicitly.

### Current Framework Color Defaults

These are temporary framework defaults and should be treated as placeholders unless the target site genuinely matches them:

- background: `#f5f5f3`
- surface: `#ffffff`
- strong surface: `rgba(255, 255, 255, 0.95)`
- ink/text: `#1f2328`
- muted text: `#6b7280`
- line/border: `rgba(31, 35, 40, 0.16)`
- accent: `#6aa7d8`
- accent dark: `#2f5f87`
- accent soft: `#dbeaf6`
- page background default: `linear-gradient(180deg, #f5f5f3 0%, #dbeaf6 100%)`
- header brand background default: `#757575`

When any of these defaults remain in use, the playbook/handoff should say so explicitly and note that the builder must replace them with target-site colors once those are gathered.

Current implementation note:

- the live header band background is controlled by `--brand-background` in [app/globals.css](/Users/paularntz/Sites/site-model-one/app/globals.css:28)
- the visible header row uses that variable in `.brand-band` in [app/globals.css](/Users/paularntz/Sites/site-model-one/app/globals.css:433)
- if the header appearance changes, the playbook/handoff should name this source of truth explicitly so the builder knows whether the change came from framework CSS variables, DB-backed content, or page-level styling

## Database Model Guidance

Because this framework is intended to work for many sites, prefer a generalized content model for broad editorial content, with specialized tables only where complexity justifies them.

### Preferred Direction

Use a flexible CMS-like database structure for:

- pages
- sections
- navigation
- footer groups
- reusable content blocks
- promos/callouts
- hero slides

Use specialized tables for:

- auth users
- member pages
- member media
- directory/artist-band profiles
- gallery items
- events if they require dedicated behavior
- other content types with real schema complexity

### General Rule

Map target content into reusable DB-backed structures rather than continuing to spread site-specific content across many narrowly scoped hardcoded modules.

## Editing And Admin Rules

Editing capabilities must be retained.

Rules:

- preserve the current repo's editing approach whenever practical
- prefer changing labels, defaults, templates, and storage models over inventing a new editor system
- avoid creating one-off admin systems for a single target site
- when a content type becomes DB-backed, provide or adapt an editor path for it using existing patterns where possible
- do not remove editor infrastructure until replacement storage and editing flows are verified
- preserve sidebar and notice editing paths as reusable framework editors
- when a setting, label, field, or seeded value is removed from the editor experience, document the new default editor-visible state explicitly

### Editor Compatibility Goal

The agent should aim for:

- site-specific content lives in the DB
- editors operate against DB-backed content
- render components consume DB-backed content
- current editing workflows remain coherent for admins and members

## SQLite Migration Rules

The current repo is Turso-only. The target architecture is repo-hosted SQLite.

Migration objectives:

- remove hard requirements for Turso-specific URLs and auth tokens
- support local SQLite as the primary DB for the converted framework
- preserve current schema and behaviors where practical
- update scripts, bootstrap logic, and runtime access accordingly

### SQLite Constraints

This architecture is appropriate for:

- local development
- proof-of-concept builds
- single-instance deployments
- container or VM deployments with persistent disk

This architecture may be unsuitable without further changes for:

- horizontally scaled deployments
- ephemeral serverless write-heavy deployments
- environments without persistent writable storage

If deployment limitations create conflict, document them explicitly rather than hiding them.

## Rendering Rules

Code should own structure and behavior, not site-specific content.

Preferred pattern:

- layouts are generic
- components are generic
- route handlers are generic
- site-specific values come from DB-backed content
- specialized data models drive specialized pages

Avoid:

- embedding page copy directly in components
- hardcoding navigation into layout files
- tying brand colors directly to a single site's identity
- building one-off templates that cannot generalize

## Page Layout Framework

The builder should not lay out each page from scratch.

The builder should compose pages inside a shared page layout framework that already supports optional regions such as sidebars and member notices.

### Core Rule

Every page should be rendered through reusable page shells and composition modes rather than one-off page templates wherever practical.

The builder should begin with layout primitives, then place imported content into those primitives.

### Required Layout Primitives

The framework should support:

- site shell
- page header shell
- main content container
- optional notice or callout band
- optional sidebar rail
- full-width section support
- listing page support
- detail page support
- utility page support

### Optional Region Rule

Sidebar and notice regions must remain optional and route-configurable.

That means:

- a page may render with neither region
- a page may render with notice only
- a page may render with sidebar only
- a page may render with both

The builder should not assume every page needs a sidebar or notice region.

### Composition Modes

The framework should support at least these composition modes:

- standard
- with_sidebar
- with_notice
- with_sidebar_and_notice
- full_width
- utility
- listing
- detail

These modes may be represented however the implementation chooses, but the choice of mode should be data-driven where practical.

### Builder Workflow

Preferred order:

1. establish the shared page shell and layout primitives
2. ensure sidebar and notice regions are supported as optional containers
3. render imported page content into those containers
4. enable sidebar and notice regions only where route config or target-site structure justifies them
5. refine visual treatment after structure and content placement are working

### Data-Driven Layout Rule

Page layout selection should come from route or content configuration whenever practical, not from hardcoded per-page decisions.

Examples of layout-driving data:

- route family
- content type
- page template key
- sidebar enabled or disabled
- notice enabled or disabled
- listing versus detail mode

### Sidebar And Notice Compatibility Rule

The shared page shell must be compatible with the preserved sidebar and notice systems from the start.

The builder should not defer compatibility until later page-specific work.

This avoids:

- rebuilding page layouts when sidebars are added
- rebuilding page headers when notices are enabled
- duplicating layout logic across pages

### Anti-Pattern

Do not let the builder solve early pages by creating bespoke layouts that bypass the shared shell.

If a page seems unique, first ask whether it can still be expressed as:

- a shared page shell
- a different composition mode
- a different section set
- a different content structure

Only introduce a truly custom layout when the target site's behavior cannot be represented cleanly within the framework.

## Migration Strategy

Work one subsystem at a time.

Recommended order:

1. Inventory current reusable systems versus current site-specific systems.
2. Extract and replace branding/theme tokens.
3. Remove hardcoded navigation and move navigation into the DB.
4. Move editorial page content into DB-backed structures.
5. Move homepage sections and reusable blocks into the DB.
6. Replace public assets with target-site or fallback assets.
7. Preserve and rebind member/auth/gallery/admin functionality.
8. Replace Turso with SQLite.
9. Remove remaining source-site remnants.
10. Verify build, editing, and deploy behavior.

## Current DB Cleanup Rule

For this conversion stage, the current source-site navigation and current source-site DB-backed pages should be treated as disposable unless explicitly retained for framework reasons.

Current retention exception:

- `/` home page
- `/about-us`
- `/sign-in`

All other current source-site navigation items and current source-site DB-backed page rows should be removed or considered queued for removal unless they are being kept as a reusable application capability with a clear target-site mapping.

When a current DB-backed page or nav item is retained temporarily for framework reasons, the playbook/handoff must say:

- which route or nav item is being retained
- why it is being retained
- whether it is a framework capability, migration scaffold, or target-mapped page
- what must happen before it can be replaced or removed

Do not leave old DB-backed pages or navigation in place just because they already exist in the repo.

## DB-Backed Page Creation Path

If the builder needs to add a new standard content page, it should follow the existing DB-backed path rather than creating a one-off route implementation.

Use this path unless the page clearly belongs to a specialized system such as auth, member profiles, directory entries, gallery items, gigs/events, or another dedicated content model.

### Standard Page Route Path

The standard dynamic page route is:

- catch-all route: [app/[...slug]/page.js](/Users/paularntz/Sites/site-model-one/app/[...slug]/page.js:1)
- page lookup/data access: [lib/site-pages.js](/Users/paularntz/Sites/site-model-one/lib/site-pages.js:1)
- page rendering shell: [components/mirrored-page.js](/Users/paularntz/Sites/site-model-one/components/mirrored-page.js:1)

That means the correct default way to add a normal page is:

1. create a `site_pages` row for the route
2. supply `route`, `title`, `summary`, `meta_description`, and `body_html`
3. let the catch-all route load that row and render it through the shared page shell

Do not create a bespoke `app/.../page.js` file for a normal editorial page if the `site_pages` path can represent it cleanly.

### Navigation Creation Path

Navigation should be created through DB-backed navigation structures, not hardcoded layout arrays, for any target-site navigation that is meant to survive the conversion.

If temporary hardcoded navigation remains during transition, it must be logged as temporary and scheduled for DB replacement.

### Header Creation Path

Page header text should come from the DB-backed page record or header override path, not from hardcoded component props for normal content pages.

Relevant implementation:

- header editing/override logic: [lib/page-header-editor.js](/Users/paularntz/Sites/site-model-one/lib/page-header-editor.js:1)
- header shell: [components/page-header-with-callout.js](/Users/paularntz/Sites/site-model-one/components/page-header-with-callout.js:1)

Preferred rule:

- default header title/summary comes from `site_pages`
- use `page_header_overrides` only when an override is actually needed

Editor interaction for headers should follow the existing admin-overlay path:

- use the header shell and click-target overlay pattern rather than adding standalone edit buttons inline
- let admins select the editable header area visually, then edit that grouped header content in one form

Relevant implementation:

- header admin overlay/editor: [components/page-header-text-admin.js](/Users/paularntz/Sites/site-model-one/components/page-header-text-admin.js:1)

### Sidebar Creation Path

If a new page should support a sidebar, the builder must wire it through the existing route-sidebar and sidebar-box systems rather than inventing page-local sidebar logic.

Relevant implementation:

- route-level sidebar enable/disable: [lib/site-config-route-sidebar.js](/Users/paularntz/Sites/site-model-one/lib/site-config-route-sidebar.js:1)
- sidebar set and box storage: [lib/site-config-sidebar.mjs](/Users/paularntz/Sites/site-model-one/lib/site-config-sidebar.mjs:1)
- sidebar resolution in page rendering: [components/mirrored-page.js](/Users/paularntz/Sites/site-model-one/components/mirrored-page.js:1)

Correct sequence for a new sidebar-capable page:

1. create the `site_pages` row
2. decide whether the route should render with sidebar enabled
3. save route sidebar state through the route-sidebar config path
4. create or duplicate a sidebar box set for that route only if the route actually needs sidebar content
5. leave the route sidebar disabled if no justified sidebar content exists yet

Do not add sidebar markup directly to an individual page implementation.

### Main Body Creation Path

For standard DB-backed pages, the main page content should be edited as a grouped body region, not as many scattered per-paragraph fields.

Preferred rule:

- keep related body copy together in one editable form for that page region
- use rich-text/body editing for the page body where the current editor path supports it
- only split content into multiple editors when the page is truly composed of separate managed systems or reusable sections

Relevant implementation:

- editable body storage/update path: [lib/site-page-body.js](/Users/paularntz/Sites/site-model-one/lib/site-page-body.js:1)
- grouped body editor overlay/modal: [components/signatory-body-admin.js](/Users/paularntz/Sites/site-model-one/components/signatory-body-admin.js:1)

### Editable Area Selection Rule

When a page is created or adapted for admin editing, the builder should preserve the existing pattern where admins visually select editable areas through the overlay/click-target treatment and then edit the chosen region in the corresponding grouped form.

That means:

- header content should use the header overlay/click-target editor pattern
- main content regions should use the page-body overlay/editor pattern where supported
- the builder should not replace this with ad hoc raw textarea fields scattered around the page
- the builder should not require admins to guess which DOM fragment maps to which stored content field

The playbook-facing goal is that page creation includes both storage wiring and editor affordances:

- the page route exists
- the DB-backed content exists
- the editable region is visually discoverable
- related text is grouped into the correct form
- saving updates the intended DB-backed content source

### Correct Way To Add A New Standard Page

Use this checklist:

1. confirm the page is not better represented by an existing specialized DB-driven system
2. create a normalized route and `site_pages` row
3. add or map the navigation entry through the DB-backed navigation plan
4. verify the page renders correctly through the shared catch-all page shell
5. decide whether the route needs a page-header override or whether `site_pages` title/summary is sufficient
6. make sure header and body editing use the supported grouped-form and editable-area overlay patterns
7. decide whether the route needs callouts or notices
8. decide whether the route needs sidebar support; if yes, use the route-sidebar and sidebar-box systems
9. leave optional regions disabled rather than fabricating filler content
10. document the resulting default state in the playbook/handoff

If the page cannot be created cleanly through this path, the builder must document why before introducing a dedicated route or new storage model.

This order may shift if infrastructure changes block content migration, but the principle remains:

- separate reusable platform logic from site-specific content before attempting full fidelity conversion

## Deliverables Required From The Agent

For each target-site conversion, produce:

- route inventory
- navigation map
- content classification map
- asset inventory
- design extraction summary
- DB model mapping summary
- proof-of-concept record imports
- mismatch log
- fallback log
- deployment notes

The deliverables must be structured for the builder, not as raw crawl output.

Use [docs/db-driven-system-reference.md](/Users/paularntz/Sites/site-model-one/docs/db-driven-system-reference.md:1) when deciding whether target-site dynamic content should map into an existing system such as member pages, galleries, gigs, directories, links, magazine archives, or news/events.

## Acceptance Criteria

The conversion is not complete until all of the following are true:

- public-facing branding no longer reflects the source site
- target primary and footer navigation are implemented
- homepage structure and copy reflect the target site
- static pages are represented accurately
- database-derived sections show representative proof-of-concept content
- editable site content is stored in the database
- editing workflows still function
- auth/member/gallery functionality still works
- build succeeds
- deployment path is documented

## Open Working Rules

This playbook is expected to change during the conversion.

As the current site is dismantled, update this document when:

- a new subsystem is generalized
- a storage rule changes
- a better fallback rule is discovered
- a target-site mismatch reveals a gap in the process
- a one-off pattern should be banned from future conversions

When in doubt, prefer:

- reusable architecture
- DB-backed content
- preservation of existing advanced features
- high target-site fidelity
- explicit documentation of compromises
