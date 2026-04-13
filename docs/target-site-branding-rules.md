# Target-Site Branding Rules

## Purpose

These notes define reusable build-time branding rules for any target site converted into this framework.

When a site is rebuilt or regenerated, the agent should preserve the target site's branding direction instead of falling back to the framework's placeholder styling.

Framework placeholder colors should not influence the finished design unless the live target site genuinely uses those same colors.

The visual reference is always the live target site being converted, not the framework defaults and not prior placeholder treatments from another project.

## Local Reference Capture Rule

At the beginning of a conversion, capture one or more screenshots from the live target site and save them under `docs/reference/`.

These reference captures are for the active project only.

Do not hardcode a specific site's screenshot path or visual tokens into shared documentation.

Instead, document the rule:

- capture the target site's reference images locally
- use those captures while implementing the design
- keep shared docs process-oriented rather than site-specific

## Color Rule

Color decisions must come from the target site.

That means:

- do not keep the framework palette just because it already exists
- do not reuse colors from a previous site conversion
- do not let neutral framework gray become the design language unless the target site itself is gray
- if the target site uses a dark palette, derive the dark palette from that site
- if the target site uses a light palette, derive the light palette from that site
- accent colors should be inspired by the target site's real interface cues, imagery, and repeated UI colors rather than by framework defaults

## Typography Rule

Font choices must also be inspired by the target site.

That means:

- choose display and body faces that reflect the target site's visual character
- do not keep the framework's previous font family just because it is already wired up
- if the target site feels geometric, condensed, industrial, editorial, or soft, the chosen type system should reflect that
- headings, navigation, and body copy should feel like they belong to the same target-site brand world
- document the typography source of truth in the layout or theme tokens so future rebuilds keep the intended type pairing

## Contrast Rule

Readable contrast is mandatory.

That means:

- text must maintain strong contrast against its actual rendered background, not just against the page base color
- secondary or muted copy must still be clearly readable
- labels, metadata, helper text, captions, and navigation text are not allowed to fade below usable contrast
- if a subtle color treatment reduces readability, increase contrast first and preserve the visual nuance second
- contrast must be checked across headers, hero overlays, cards, sidebars, dialogs, notices, admin overlays, and footers
- low-opacity text should be treated as suspect by default and raised unless it is still clearly readable
- contrast must be checked at the actual component surface level; fixing global text tokens alone is not enough if a component uses a different background

## Surface Pairing Rule

Surface color and text color must stay aligned with the target site's real component language.

That means:

- do not drop light or white cards into a dark target site unless the reference site actually uses them
- do not let dark-theme text inherit onto light cards or light-theme text inherit onto dark cards
- if a homepage section, promo block, or CTA band has a distinct surface treatment on the target site, reproduce that surface/text pairing explicitly
- when readability fails, inspect the specific component surface before assuming the global palette is the only issue

## Vertical Rhythm Rule

Main content spacing must feel intentional and balanced.

That means:

- leave clear space between the bottom of a hero/header region and the beginning of the main content
- leave a comparable amount of breathing room between the end of the main content and the footer
- do not allow major sections to visually collide just because default margins collapsed
- treat homepage spacing as a composition problem, not just a byproduct of generic page padding

## Header Rule

The header should be derived from the target site's branding, imagery, and contrast behavior.

At build time:

- define header colors from the target site's palette
- use gradients, overlays, imagery, or flat fills only if they match the target site's actual design language
- avoid generic fallback neutrals when the target site has stronger branding cues
- keep the visual source of truth explicit in the CSS variables or theme tokens that drive the header
- document that source of truth in the handoff

If the site already supports authentication or admin editing, the header must keep the relevant auth controls visible and reachable.

That means:

- expose the sign-in entry point in the header when the user is logged out
- expose sign-out in the header when the user is logged in
- do not hide existing auth controls behind unrelated navigation-data conditions

If the site uses server-side session reads, the build must also verify that auth/session failures degrade safely.

That means:

- test at least one real server-rendered page that reads the session before declaring the work complete
- if stale JWT cookies, changed secrets, or failed session decryption occur, page rendering must fall back to logged-out behavior instead of throwing

## Admin Overlay Rule

If the site includes inline admin edit surfaces, their overlay treatment must also be derived from the active target site's palette.

That means:

- do not leave legacy framework accent colors in edit overlays once the target site's palette is established
- derive the overlay glow, border, and edit-chip colors from shared theme tokens for the active site
- when extending editability to additional surfaces such as sidebars or notices, reuse the same hover/focus animation logic as the site's existing editable surface instead of inventing a second interaction model
- verify that the overlay is hidden at rest, animates over the content on hover or focus, and exits in the reverse direction on mouse leave or blur

## Rebuild Expectations

If a future agent updates layout or regenerates theme tokens, it should keep these outcomes:

- the target site's palette remains the source of truth
- the target site's typography remains the source of truth
- placeholder framework colors do not quietly return
- project-specific captures in `docs/reference/` are consulted before visual changes are made
- the shared docs stay general, while project-specific findings live in project handoff notes or local captures
- text contrast remains strong enough for normal reading across all major surfaces
- component surfaces and their text pairings still match the target site's overall light/dark direction
- main content spacing remains balanced relative to the hero/header above and the footer below

## Local Config Persistence Rule

If an admin control represents local project configuration rather than shared remote content, persist it to local SQLite.

Examples include:

- page background opacity
- hero slider timing and transition settings
- hero image configuration metadata
- route-level sidebar enable/disable state
- route-level notice/callout visibility state
- local layout width controls

Do not let these controls silently follow a remote database target when the intended storage is the local project database.

If a route-level notice or callout toggle enables a notice region, the system must also ensure that actual notice records exist for that region.

That means:

- do not treat a visibility flag as sufficient if the rendered notice list is empty
- if enabling notices on a route would otherwise produce an empty region, seed a generic editable starter notice or require the editor flow to create one immediately
- verify both layers before declaring the work complete: the route/global visibility state and the notice records that the page actually renders

## Final Push Rule

Before the final push for any site conversion, run:

```bash
npm install
```

This is required even if dependencies appear unchanged, so the working tree reflects a dependency-installed state before the final repository push.
