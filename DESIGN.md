# DESIGN.md: the Murmur style guide site

## Purpose
Show the Murmur design language as something you can read, hear and touch, and audit the owner's live pages against it.

## Theme and why
Neutral base theme (`custom` in the skill registry: calm green accent, soft sound palette, iris transition, motes). A style guide should not compete with the twelve themes it shows, so its own look is the plain base, and the themes appear scoped inside the gallery.

## Tokens
`assets/tokens.css` is the kit's base (light and dark under `:root[data-theme]`, no-JS media fallback). `tokens/tokens.css` is generated and adds every theme as a scope: `[data-dl-theme="id"]` with optional `[data-dl-mode="light|dark"]`.

## Motion
Iris between sections (the kit's `data-transition`), scroll reveals, an ambient motes layer, small parallax (clamped to 24px), and demo stages that run the kit's own keyframes inside a box. One rAF loop (the kit's); the demo fields and the town use its tickers and pause off screen.

## Sound
Soft palette on the page; the sound section plays every cue of every palette with the same engine. Controls and demo buttons carry `data-snd="none"` where the demo plays its own cue.

## Interaction inventory
Theme selector (header, large copy in section 3, gallery mode), Sound, Motion, Effects, Quiet; duration race, transition stage, shared-element tiles, ambient fields, parallax, palette cue grid, theme gallery, component gallery (cards, tabs, modal, toast, chart with table, filters, town with Still mode).

## Accessibility
Skip link, landmarks, one h1, roving tabindex in radiogroups and tabs, native dialog, `aria-pressed` and `aria-checked` with state in the label, polite live region, 44px targets, reduced motion wins, no flashing, content readable with no JS (the page is static HTML, demos are enhancements) and a text version.

## Decisions and trade-offs
- The prose is written once (DESIGN-LANGUAGE.md) and the page is assembled from it, at the cost of an authoring-time Python build. Rejected: hand-maintaining two copies.
- Tables and tokens are generated from the skill registry so they cannot drift.
- Demos use scoped CSS variables instead of re-theming the whole page, so reading continues while you try a theme.
- The conformance audit is a set of heuristics that compare committed files with the working tree; it is a prompt to look, not a verdict. One result (BIOT 6900's Sound button) needed a manual override because that button is injected by script.
- Kit fix found while building: parallax offsets are clamped to 24px (the old formula moved a hero heading by tens of pixels in tall windows).

## How to extend
Add prose to DESIGN-LANGUAGE.md with an `<!--id:key-->` marker, place `{{md:key}}` in `src/index.tpl.html`, run `npm run build` and `npm test`.
