# Murmur: the design language for Dhairya Bhatia's pages

Version 1.0.0, 2026-11-04. Live style guide: https://dhairyab0069.github.io/design-language/

Murmur is the one design language behind the project pages on `dhairyab0069.github.io`: FocusLock, The Garage, the BIOT 6900 report, Abiogenesis, Calendar, Himawari, the ML town, macOS tools, Atlas Mobile, LucasCheck and Manifold. It was distilled from what those pages actually do (their tokens, timings, sounds, controls and copy), then written down so the next page starts from it and the existing pages can be checked against it.

The name says the idea: a page that murmurs is quietly alive (soft sound, slow motion, gentle transitions), and a murmur can always be hushed (one press on the moon).

How to read this document: part 1 is the why, parts 2 to 7 are the foundations, parts 8 to 10 are themes, engineering and the honest audit, parts 11 to 13 are how to use it. Every value below was read from the code of the pages or the kit; where a rule is a decision rather than an observation, it says so. The tokens in the tables are generated from the skill registry by `scripts/build.py`, so this document, `tokens/` and the skill stay in sync.

The source of truth for the tooling is the skill `~/.claude/skills/dynamic-web-design` (kit in `templates/kit`, themes in `registry/themes`). This repository adds the language, the exports and the style guide.

## 1. Principles
<!--id:principles-->
Seven principles. Each one has a test you can apply to a page in a minute.

### 1. Alive by default
Every page has sound, motion and transitions, even when it is only information. Nothing is static "because it is just a report".

*In practice:* each page ships an ambient layer (a few slow particles), scroll reveals, a section transition in the project's one metaphor (door, curtain, iris, wipe, slide, zoom, dither), and a short synthesized cue on press, hover, open, close, reveal. All of it starts on.

### 2. Hushable, always
Aliveness is only kind if it can be turned down in one press. Controls are symbols, always visible, never hidden in a menu.

*In practice:* four symbol buttons (Sound, Motion, Effects, and Quiet-everything, a circle with a bar) plus the Light/Dark/Auto selector sit in the header of every page. The system's reduced-motion setting wins over the Motion button. Nothing flashes. Sound never starts before a first gesture and never plays in a hidden tab.

### 3. Honest
What is illustrative says so. No invented numbers. Private work stays private.

*In practice:* a drawing that is not a screenshot is labelled as a drawing; placeholder values say "illustrative"; results come from the project's own files; private or under-review projects are not named on public pages; no lab, employer or supervisor names on research pages; a `.privacy-deny` list is checked by the audit script.

### 4. Plain
Short sentences, concrete nouns, one idea per section, one h1.

*In practice:* a visitor can read the whole page as text. A text version (`text.html`, built from the same data, or an in-page text view) always exists, and a no-JavaScript visitor sees real content, not a blank page.

### 5. One system, many materials
The page is made of one material (steel, paper, water, a one-bit desk) and a change of look is a change of tokens, not of components.

*In practice:* raw colours, sizes, durations and layers exist only in `tokens.css`. A theme is a JSON file with structural tokens, a designed light set, a designed dark set, a motion personality and a sound palette. Components read roles such as `--bg`, `--accent`, `--space-4`, `--dur-base`.

### 6. Two moods, one setting
Light and dark are both designed, and the choice is shared by every page.

*In practice:* one localStorage key, `theme`, with values light, dark or auto, read before first paint. Change it on any page and every other open page follows. Both sets pass contrast (4.5 to 1 for text). Part 3 is the full rule.

### 7. Self-contained and documented
No external requests, no libraries, no audio files. Content is data. The page explains itself.

*In practice:* system font stacks, plain HTML, CSS and vanilla JS, Web Audio synthesis, inline SVG icons. Content lives in `assets/data.js`, logic in small modules with pure helpers that are tested. Each repo has a README.md and a DESIGN.md that states decisions and trade-offs.

## 2. Foundations
<!--id:foundations-->
### Colour roles
<!--id:colour-roles-->
Colour is named by role, never by hue. A role means the same thing in every theme and in both modes. Pages may keep material aliases for their own drawings (FocusLock `--sage`, Garage `--yellow`, the report `--desk`), but components read roles.

| Role | Meaning |
|---|---|
| `--bg` | page background |
| `--surface`, `--surface-2` | cards and panels; wells, code, table heads |
| `--ink` | body text |
| `--muted` | secondary text |
| `--line` | borders and rules |
| `--accent` | fills, graphics, the brand colour |
| `--accent-text` | the accent when it must read as text (links, eyebrows); equals `--accent` unless the accent is too bright for light surfaces |
| `--accent-ink` | text on an accent fill |
| `--accent-soft`, `--accent-2` | tinted backgrounds; the second accent |
| `--focus` | focus ring (3 to 1 against the page) |
| `--overlay` | transition panels and scrims |
| `--glow-rgb` | the light that follows the pointer, as `r, g, b` |
| `--ok`, `--warn`, `--danger` | status, shared by all themes, always paired with a word or an icon |

Status colours, both modes:

<!--GEN:status-->
| Role | Light | Dark | Light on white | Dark on #14181b |
|---|---|---|---|---|
| `--ok` | `#2f7d4f` | `#6fd39a` | 5.04 | 9.74 |
| `--warn` | `#8a5a00` | `#f0c060` | 5.93 | 10.55 |
| `--danger` | `#a8362c` | `#ff8a7d` | 6.5 | 7.81 |
<!--/GEN:status-->

Every theme defines a full light set and a full dark set of the thirteen colour roles. The complete values are in the appendix, in `tokens/tokens.json` and in `tokens/tokens.css`. The contrast table below is computed from those values.

*Contrast:* every text pair needs at least 4.5 to 1 in both modes; the focus ring needs 3 to 1. A bright accent (yellow, volt green, cyan) cannot be text on a light surface, so it gets a separate darker `--accent-text`.

<!--GEN:contrast-->
| Theme | Mode | ink / bg | ink / surface | muted / bg | muted / surface | accent text / bg | accent text / surface | accent ink / accent | focus / bg |
|---|---|---|---|---|---|---|---|---|---|
| athletic-dark | light | 17.47 | 19.33 | 6.83 | 7.56 | 17.47 | 19.33 | 16.78 | 5.85 |
| athletic-dark | dark | 16.78 | 15.59 | 7.58 | 7.04 | 16.78 | 15.59 | 16.78 | 16.78 |
| blueprint-math | light | 15.46 | 17.23 | 6.35 | 7.07 | 5.48 | 6.1 | 6.1 | 5.22 |
| blueprint-math | dark | 14.62 | 12.75 | 8.17 | 7.12 | 7.88 | 6.87 | 8.42 | 11.95 |
| custom | light | 14.43 | 15.87 | 5.84 | 6.43 | 5.37 | 5.91 | 5.91 | 5.48 |
| custom | dark | 15.03 | 13.53 | 7.91 | 7.13 | 8.54 | 7.69 | 8.52 | 7.54 |
| healing-mindfulness | light | 11.7 | 12.64 | 5.46 | 5.9 | 4.98 | 5.37 | 5.63 | 5.52 |
| healing-mindfulness | dark | 14.39 | 12.87 | 7.99 | 7.14 | 8.54 | 7.64 | 8.64 | 8.0 |
| hi-fi-warm | light | 16.23 | 17.35 | 5.54 | 5.93 | 5.54 | 5.93 | 8.64 | 3.75 |
| hi-fi-warm | dark | 16.33 | 14.87 | 6.88 | 6.26 | 9.33 | 8.49 | 8.64 | 4.67 |
| living-lab | light | 13.66 | 15.07 | 5.69 | 6.28 | 5.77 | 6.36 | 6.36 | 4.97 |
| living-lab | dark | 18.14 | 16.81 | 10.75 | 9.96 | 11.97 | 11.09 | 11.63 | 12.77 |
| paper-report | light | 12.33 | 15.41 | 5.42 | 6.78 | 6.6 | 8.25 | 9.24 | 4.31 |
| paper-report | dark | 13.95 | 12.57 | 7.61 | 6.86 | 9.92 | 8.94 | 9.92 | 8.32 |
| retail | light | 14.68 | 16.6 | 5.31 | 6.0 | 4.55 | 5.15 | 5.36 | 10.9 |
| retail | dark | 15.02 | 13.56 | 8.08 | 7.3 | 6.91 | 6.24 | 6.91 | 12.23 |
| retro-desktop | light | 18.73 | 21.0 | 10.15 | 11.37 | 18.73 | 21.0 | 21.0 | 4.78 |
| retro-desktop | dark | 17.17 | 15.5 | 10.2 | 9.21 | 17.17 | 15.5 | 17.17 | 12.7 |
| town-diorama | light | 15.16 | 16.31 | 6.57 | 7.07 | 5.2 | 5.6 | 5.6 | 5.42 |
| town-diorama | dark | 15.36 | 13.66 | 8.64 | 7.68 | 6.45 | 5.74 | 6.45 | 8.18 |
| workbench | light | 14.93 | 16.82 | 5.23 | 5.89 | 5.52 | 6.22 | 6.22 | 5.52 |
| workbench | dark | 15.28 | 13.86 | 7.56 | 6.86 | 7.43 | 6.74 | 7.7 | 7.43 |
| workshop | light | 14.04 | 15.63 | 5.94 | 6.62 | 4.79 | 5.34 | 5.93 | 4.87 |
| workshop | dark | 11.82 | 10.29 | 5.97 | 5.19 | 8.04 | 6.99 | 9.55 | 8.04 |
<!--/GEN:contrast-->

### Type
<!--id:type-->
System fonts only: no web fonts, no font files. A theme may choose a different system stack (Impact for the workshop, Iowan Old Style or Georgia for the paper report, a monospace for the retro desktop) but never downloads one.

*Observed:* the pages use `ui-rounded, "SF Pro Rounded", system-ui` for friendly pages, an Impact stencil for the garage, serif for the report, and `ui-monospace` for code on all of them. Some pages still load web fonts or scripts from other origins; the conformance table in part 10 says which.

<!--GEN:scale-fonts-->
| Token | Value | Use |
|---|---|---|
| `--font-display` | `ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |  |
| `--font-body` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |  |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` |  |
| `--weight-display` | `750` |  |
| `--track-display` | `-.01em` |  |
<!--/GEN:scale-fonts-->

The scale is fluid (`clamp`), six steps from small print to hero:

<!--GEN:scale-type-->
| Token | Value | Use |
|---|---|---|
| `--step--1` | `clamp(.82rem, .8rem + .1vw, .9rem)` |  |
| `--step-0` | `clamp(1rem, .95rem + .25vw, 1.12rem)` |  |
| `--step-1` | `clamp(1.25rem, 1.1rem + .6vw, 1.6rem)` |  |
| `--step-2` | `clamp(1.6rem, 1.3rem + 1.2vw, 2.3rem)` |  |
| `--step-3` | `clamp(2.1rem, 1.5rem + 2.4vw, 3.4rem)` |  |
| `--step-4` | `clamp(2.8rem, 1.6rem + 4.6vw, 5.2rem)` |  |
| `--leading` | `1.6` |  |
| `--leading-tight` | `1.1` |  |
| `--measure` | `66ch` |  |
<!--/GEN:scale-type-->

One h1 per page, headings in order, a measure of 66 characters for paragraphs, line height 1.6 for body and 1.1 for headings.

### Spacing, radii, elevation, layers
<!--id:space-->
Spacing is a 4px-based scale with roughly 1.5 times steps. Sections repeat the same padding; staggers repeat the same step.

<!--GEN:scale-space-->
| Token | Value | Use |
|---|---|---|
| `--space-1` | `.25rem` |  |
| `--space-2` | `.5rem` |  |
| `--space-3` | `.75rem` |  |
| `--space-4` | `1rem` |  |
| `--space-5` | `1.5rem` |  |
| `--space-6` | `2.25rem` |  |
| `--space-7` | `3.5rem` |  |
| `--space-8` | `5.5rem` |  |
| `--gutter` | `clamp(1rem, 4vw, 2rem)` |  |
| `--wrap` | `72rem` |  |
<!--/GEN:scale-space-->

Radii: small for chips and code, medium for cards, large for panels and dialogs, pill for buttons and switches. Themes override them (the workshop is nearly square at 3, 6 and 10 pixels; the retro desktop is exactly 0 with a 2px border; FocusLock uses 22px).

<!--GEN:scale-radius-->
| Token | Value | Use |
|---|---|---|
| `--radius-s` | `6px` |  |
| `--radius-m` | `14px` |  |
| `--radius-l` | `24px` |  |
| `--radius-pill` | `999px` |  |
| `--border` | `1px solid var(--line)` |  |
<!--/GEN:scale-radius-->

Elevation is three soft shadows; dark themes use the same shapes with stronger opacity. Retro and paper themes avoid shadows or keep them flat.

<!--GEN:scale-shadow-->
| Token | Value | Use |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,.08), 0 1px 1px rgba(0,0,0,.05)` |  |
| `--shadow-2` | `0 6px 18px rgba(0,0,0,.12)` |  |
| `--shadow-3` | `0 18px 48px rgba(0,0,0,.2)` |  |
<!--/GEN:scale-shadow-->

Layers are a closed set. Never invent a z-index in a component.

<!--GEN:scale-z-->
| Token | Value | Use |
|---|---|---|
| `--z-base` | `0` |  |
| `--z-field` | `0` | ambient canvas |
| `--z-content` | `1` | page content |
| `--z-nav` | `50` | header |
| `--z-controls` | `60` | symbol controls and progress |
| `--z-modal` | `100` | dialogs |
| `--z-toast` | `120` | toasts and skip link |
| `--z-tx` | `200` | transition panels |
<!--/GEN:scale-z-->

### Breakpoints
<!--id:breakpoints-->
*Observed:* the pages use max-width queries at 480 to 560 (phone), 700 to 860 (tablet and header wrap) and 960 to 1100 (wide), with 560, 760 and 860 the most common. Murmur settles on three, and the kit's control size query is the one exception (640).

<!--GEN:breakpoints-->
| Name | Max width | What changes |
|---|---|---|
| phone | `560px` | single column, 44px controls, particles capped at 28 |
| narrow | `760px` | header wraps, nav scrolls sideways |
| wide | `1100px` | wide layouts, side-by-side demos |
<!--/GEN:breakpoints-->

Design phone first: single column, 44px targets, a 16px side gutter, no horizontal page scroll.

### Iconography
<!--id:icons-->
Icons are inline SVG, outline only, on a 24 by 24 grid with a 1.8 stroke, round caps and round joins, `fill="none"` and `stroke="currentColor"` so they follow the text colour in both modes. They are `aria-hidden="true"`; the button carries the label. A control that is on and a control that is off differ by shape as well as colour (see the symbol set in part 6: no two controls share a shape). Never an icon font, never an image sprite from elsewhere.

## 3. Light, dark and auto
<!--id:theme-->
One setting for every page. The pages all live on `https://dhairyab0069.github.io`, one origin, so one localStorage value is shared by all of them.

### The shared key
<!--id:theme-key-->
- *Key:* `theme`, with the values `light`, `dark` or `auto`. An absent key means auto. It is never a per-page key (`mysite-theme` is an error in the audit; the ML town's old `mlp-theme` is the cautionary example).
- *Attributes on `<html>`:* `data-theme-mode` is the choice (light, dark, auto); `data-theme` is what is showing (light or dark). `color-scheme` follows `data-theme`.
- *Early script:* a tiny inline script in `<head>`, before the stylesheets, reads the key, resolves auto through `matchMedia('(prefers-color-scheme: dark)')` and sets both attributes before first paint. No flash of the wrong theme.
- *Tokens:* colour roles live under `:root, :root[data-theme="light"]` and `:root[data-theme="dark"]`. Structural tokens (type, spacing, motion) are shared in plain `:root`.
- *No-JS fallback:* `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ...dark set... } }`, so a visitor without JavaScript still gets the system's mood.

```
(function () {
  var d = document.documentElement, m = 'auto';
  try { var s = localStorage.getItem('theme'); if (s === 'light' || s === 'dark' || s === 'auto') m = s; } catch (e) {}
  var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches, t = m === 'auto' ? (dark ? 'dark' : 'light') : m;
  d.setAttribute('data-theme-mode', m); d.setAttribute('data-theme', t); d.style.colorScheme = t;
})();
```

### The selector
<!--id:theme-selector-->
A three-way segmented control in the header, next to the symbol controls.

- *Markup:* `role="radiogroup" aria-label="Color theme"` containing three icon-only `role="radio"` buttons: sun for Light, moon for Dark, a half-filled circle for Auto. Each has `aria-checked`, an `aria-label` ("Light theme", "Dark theme", "Match system theme") and a tooltip.
- *Size:* 44 by 44 pixels per target at every screen size; on phones only the gaps tighten.
- *Keyboard:* roving tabindex (the checked radio is the one tab stop); arrow keys move and select; Space and Enter select.
- *Look:* a pill outlined in `--line`; the checked radio is filled with `--accent` and its icon turns to `--accent-ink`, so state is never colour alone (the checked state also has `aria-checked`). Pages may add a sliding thumb, which moves with a transform, never with left or width.

### Behaviour
<!--id:theme-behaviour-->
- Choosing writes `theme`, updates the two attributes, and dispatches `themechange` on `window` with `detail: { mode, theme }`.
- Anything that caches colours (a canvas, a chart, a WebGL clear colour) re-reads its tokens on `themechange`.
- *Cross-page and cross-tab:* a `storage` listener applies a change made on any other page or tab live. Open FocusLock in one tab and this style guide in another and they change together.
- *In auto*, the page follows the system's own light and dark switch live.
- *Transition:* where `document.startViewTransition` exists, the new theme is revealed by a circle that grows from the control (700 ms, `cubic-bezier(.4,0,.2,1)`) with a soft `reveal` cue. Elsewhere it is a short crossfade. It is instant when Motion is off or the system asks for reduced motion, and instant when the visible theme does not change (auto to light while the system is already light).
- *Storage blocked:* the choice still applies to the current page; nothing throws.

### Designing both modes
<!--id:theme-design-->
Never invert. A dark-first theme (workshop, athletic-dark, living-lab, blueprint-math) needs a designed light set: lighter surfaces from the same hue family, a darker accent that reads as text on light, softer shadows. A light-first theme needs a designed dark set: tinted surfaces rather than pure black, a lighter accent, slightly desaturated colour. Check each text pair at 4.5 to 1 (the table in part 2 does). Images that are drawn for one mode (a white-background figure) get their own background in the other.

## 4. Motion
<!--id:motion-->
Purpose first: feedback (it heard you), orientation (where did that come from), delight (the page is alive). A movement that does none of the three is removed.

### Durations and easings
<!--id:motion-scale-->
*Observed:* across eleven pages, press and hover cluster at 0.08 to 0.2 s, state changes at 0.22 to 0.35 s, reveals and chart bars at 0.4 to 0.6 s, scene changes at 0.7 to 0.9 s, and ambient loops run 5 to 20 s per cycle. The scale names those clusters.

<!--GEN:scale-motion-->
| Token | Value | Use |
|---|---|---|
| `--dur-instant` | `80ms` | press feedback |
| `--dur-fast` | `160ms` | hover, small state change |
| `--dur-base` | `280ms` | cards, tabs, tooltips, toast |
| `--dur-slow` | `520ms` | reveals, chart bars |
| `--dur-scene` | `900ms` | section and page transitions (two halves) |
| `--ease-standard` | `cubic-bezier(.2, .7, .2, 1)` | default: arrives fast, settles |
| `--ease-in` | `cubic-bezier(.5, 0, .9, .4)` | leaving |
| `--ease-out` | `cubic-bezier(.1, .7, .2, 1)` | exits and reveals |
| `--ease-spring` | `cubic-bezier(.34, 1.4, .64, 1)` | small overshoot, physical metaphors only |
| `--reveal-distance` | `22px` |  |
| `--reveal-stagger` | `70ms` |  |
<!--/GEN:scale-motion-->

Nothing animates longer than `--dur-scene` except ambient loops. *Observed easings:* `cubic-bezier(.2,.7,.2,1)` (FocusLock, macOS tools, the default), `(.33,1,.68,1)` (the report), `(.2,.8,.2,1)` (Atlas), `(.3,.7,.3,1)` (workshop and workbench), a small spring `(.3,1.4,.5,1)` only where the metaphor is physical, and `steps(6, end)` for the retro desktop. Prefer decelerating curves: things arrive fast and settle.

### Choreography
<!--id:choreography-->
1. One hero motion per view; everything else supports it.
2. Stagger siblings by 70 ms and cap the stagger at 8 items.
3. Enter from where attention is (the clicked link, the pointer); leave toward where it goes.
4. Animate `transform`, `opacity` and `clip-path` only. Never width, height, top, left or margin.
5. Interruptible: a second click during a transition does not queue another; the engine drops it and swaps instantly.
6. Everything has an instant fallback: motion off or reduced means the final state at once. Content is never hidden behind an animation that did not run (reveal styles apply only when JavaScript has set `html.fx`).
7. Between pages: the leaving page covers the screen, stores the transition name in `sessionStorage`, and the arriving page uncovers it.
8. Hover and press: lift on cards, a magnet pull on the primary button (fine pointers only), scale down on press, all transform.

### Transition catalogue
<!--id:transitions-->
Each project chooses one metaphor and uses it everywhere. All are drawn as full-screen cover panels in the order cover, swap, uncover. Whoosh plays at the start and reveal at the end.

<!--GEN:transitions-->
| Transition | Panels | Used by |
|---|---|---|
| `fade` | 1 | default, calm pages |
| `wipe` | 1 | reports and documentation (paper-report, blueprint-math) |
| `iris` | 1 | research and lab pages, and the theme change (circle reveal) |
| `slide` | 1 | app and shop pages |
| `zoom` | 1 | entering a building in the town |
| `door` | 2 | workbench tools (two panels part) |
| `curtain` | 1 | the garage roller door |
| `dither` | 1 | the one-bit desktop (stepped) |
<!--/GEN:transitions-->

Also in use: the shared-element move (`flip`: measure, change, animate from the old rectangle), the circle reveal for theme changes, and in the town the camera move (a walker on one path, a camera that eases toward it with a frame-rate-independent smoothing, buildings entered with `zoom`).

### Ambient motion
<!--id:ambient-->
- *Particle field:* five kinds on one canvas behind the content: motes (calm), embers (energy), dust (workshop), snow, stars (maths). Capped at 56 particles, 28 on small screens.
- *Pointer field:* particles part around the pointer and drift back; the lantern (a soft light) follows the pointer; the hero parallaxes a few pixels.
- *Parallax:* small and slow (no full-screen zoom loops, no large offsets), at most 12 elements.
- *Progress:* a 3px scroll hairline at the top.

### Performance
<!--id:performance-->
- One `requestAnimationFrame` loop that sleeps when idle, when the tab is hidden, and when its element is off screen.
- Transform, opacity and clip-path only; canvas pixel ratio capped at 1.5; particles capped; no layout reads in the loop except the capped parallax and magnet lists.
- Page weight under about 300 KB excluding media; no long tasks on load.

### Reduced motion and flashing
<!--id:reduced-->
- *The gate:* motion runs only when the control is on, the system has not asked for reduced motion, and the tab is visible. One function decides it.
- *Reduced motion:* Motion starts off and the button cannot turn it on (its tooltip says why). CSS also collapses durations and removes scroll smoothing.
- *Flashing:* nothing flashes. Ambient cycles are slow, and any custom work stays under three flashes a second.

## 5. Sound
<!--id:sound-->
Sound is on by default and always controllable. Every sound is synthesized with the Web Audio API (oscillators and filtered noise): no files, no requests.

### Rules
<!--id:sound-rules-->
- *Unlock on first gesture:* the audio context is created and resumed at the first pointer, key or touch. There is never an autoplay warning.
- *Loudness ceiling:* master gain 0.3 through a compressor (the pages use 0.2 to 0.3); a single partial is at most 0.08 and typically 0.01 to 0.05; hover cues are about 0.01. Anything tonal has a 5 to 30 ms attack.
- *Rate limits:* each cue has a minimum gap (table below), and at most 14 cues play per second.
- *Voice cap:* 24 voices at once (the pages use 20 to 90; the kit's 24 is the rule).
- *Hover:* only on fine pointers. One cue per gesture; a transition plays whoosh at the start and reveal at the end, never a cue per frame.
- *Never alone:* every cue accompanies a visual or text change.
- *Tone:* errors are low and short, never harsh. Success rises and is short. The ambient pad (palettes that have one) is at most 0.005 gain and stops on mute or when the tab is hidden.
- *Hidden tab:* nothing plays.

### The cue vocabulary
<!--id:cues-->
Ten fixed names, implemented by every palette, so any component can call any palette. The theme change plays `reveal`.

<!--GEN:cue-vocab-->
| Cue | Minimum gap | Plays when |
|---|---|---|
| `click` | 40 ms | any press on a link, button or tab |
| `hover` | 70 ms | pointer enters a control or card (fine pointers only) |
| `open` | 120 ms | a panel, dialog or drawer opens |
| `close` | 120 ms | it closes |
| `success` | 250 ms | an action completed |
| `error` | 250 ms | an action failed (low and short, never harsh) |
| `whoosh` | 300 ms | start of a section or page transition |
| `reveal` | 350 ms | end of a transition, a section arriving, and the theme change |
| `on` | 120 ms | a switch turns on |
| `off` | 120 ms | a switch turns off |
<!--/GEN:cue-vocab-->

A page may add its own cues (the garage has `door`, `lights`, `ratchet`; FocusLock has `rake` and `chime`) as page-specific extras on top of the ten.

### Palettes
<!--id:palettes-->
The palette matches the material of the page: paper for reports, metal for workshops and tools, nature for calm and wellbeing, digital for labs and dashboards, retro for one-bit desktops, soft for ordinary interface. Loudest partial per cue, from the engine:

<!--GEN:sound-peaks-->
| Palette | click | hover | open | close | success | error | whoosh | reveal | on | off |
|---|---|---|---|---|---|---|---|---|---|---|
| Paper (`paper`) | 0.050 | 0.012 | 0.060 | 0.050 | 0.070 | 0.050 | 0.050 | 0.020 | 0.030 | 0.025 |
| Metal and workshop (`metal`) | 0.050 | 0.010 | 0.080 | 0.070 | 0.050 | 0.060 | 0.070 | 0.015 | 0.050 | 0.050 |
| Nature and zen (`nature`) | 0.045 | 0.010 | 0.030 | 0.025 | 0.025 | 0.050 | 0.030 | 0.025 | 0.030 | 0.025 |
| Digital and lab (`digital`) | 0.020 | 0.008 | 0.030 | 0.030 | 0.035 | 0.030 | 0.020 | 0.015 | 0.030 | 0.030 |
| Retro and one-bit (`retro`) | 0.025 | 0.008 | 0.025 | 0.025 | 0.030 | 0.030 | 0.015 | 0.015 | 0.030 | 0.030 |
| Soft UI (`soft`) | 0.030 | 0.008 | 0.030 | 0.030 | 0.030 | 0.040 | 0.020 | 0.010 | 0.030 | 0.025 |
<!--/GEN:sound-peaks-->

## 6. Controls
<!--id:controls-->
The global controls are symbol buttons in the header of every page, in this order: theme selector, Sound, Motion, Effects, Quiet-everything.

| Control | Icon | Default | Behaviour |
|---|---|---|---|
| Sound | speaker (waves on, diagonal slash off) | on | mutes every cue and the pad |
| Motion | flowing waves (pause bars when off) | on, off if the system asks for reduced motion | the gate for reveals, transitions, tweens and the loop |
| Effects | sparkle: a four-point star with two small sparkles (the star with a diagonal slash when off) | on | ambient particles, lantern, parallax, magnets |
| Quiet everything | a circle with a horizontal bar (do not disturb) | off | turns sound, motion and effects off together; a second press restores what was on before |
| Theme | sun (Light), moon (Dark), half-filled circle (Auto) | auto | part 3 |

*No two controls share a shape.* The moon means Dark, so Quiet is not a moon; the sun means Light, so Effects is a sparkle and never a sun or rays; pause bars mean Motion off, so Quiet never uses them. A state is shown by glyph as well as fill (waves or slash, waves or bars, sparkles or slash). Exact SVG (24 by 24 viewBox, stroke `currentColor` 1.8, round caps and joins) is in the kit's `controls.html` and in the specimens below.

- *Size and focus:* 44 by 44 pixels at every screen size, a 3px focus ring in `--focus` with a 2px offset, visible on keyboard focus.
- *Accessibility:* toggles use `aria-pressed`; the `aria-label` states the current state ("Sound on"); the tooltip says what pressing does; a polite live region announces the change.
- *Storage:* three per-page keys with a versioned prefix (`mysite1-sound`, `-motion`, `-fx`, values `on` or `off`) and the one shared `theme`. Every access is in try/catch. Bumping the prefix digit resets everyone's saved choices.
- *Cue:* a toggle plays `on` or `off` (when sound stays on).
- *Defaults:* if no choice is stored, all three are on. A stored `off` is respected. The Motion button refuses to turn on under reduced motion.

## 7. Components and patterns
<!--id:components-->
The gallery in the style guide shows each of these live. They all live in `components.css` and `components.js` of the kit and read only tokens.

- *Header and nav:* brand, section links (current one marked `aria-current`), then the controls. Wraps on narrow screens.
- *Hero:* eyebrow, h1 (with a slight parallax), one plain lede, one primary action with a magnet pull and one ghost action.
- *Section reveal:* `data-reveal` on cards, timeline items and figures; staggered by sibling index.
- *Cards:* a tag, a title, two sentences. Lift on hover (fine pointers).
- *Timeline:* date, title, text, in a vertical list that reveals item by item.
- *Chart with table fallback:* an SVG with `role="img"` and a summary label, plus a real `<table>` inside `<details>`. Bars grow in when scrolled to. Illustrative data says so.
- *Tabs:* roving tabindex, arrow keys, Home and End.
- *Modal:* the native `<dialog>`; focus is trapped; Escape closes; `open` and `close` cues.
- *Toast:* a polite status line that disappears after 3.2 seconds, with a `success` cue.
- *Filters and search:* controls above a list; the list updates in place and announces the count.
- *Detail expand:* a card grows into its detail by a shared-element move.
- *Diorama or world:* a data-driven scene with a walker, a camera and buildings you enter, a Still mode that freezes it, keyboard movement, and a full text version listing everything.
- *Project-page anatomy:* hero, what it is, how it works, the playable part, limits (honestly), links, footer with the text version.

## 8. Themes
<!--id:themes-->
A theme is a JSON file in `registry/themes/`: structural tokens, a light set, a dark set, a motion personality, a sound palette, signature interactions and things to avoid. There are twelve, and every one defines both modes.

<!--GEN:themes-table-->
| Theme | Feel | Designed first | Transition / reveal / ambient | Sound |
|---|---|---|---|---|
| athletic-dark | Near-black iron with a volt-green accent and heat orange; punchy, fast, set-by-set rhythm. | dark | slide / rise / embers | digital |
| blueprint-math | A blueprint-blue field with fine grid lines, white construction strokes and pentatonic tones that never clash. | dark | wipe / fade / stars | soft |
| custom | Start here when none of the themes fit. Fill the checklist in references/recipes.md, write the result to registry/themes/<id>.json, and document each choice in DESIGN.md. | light | fade / rise / motes | soft |
| healing-mindfulness | Sage, sand and soft light for calm products; slow breathing motion, a lantern that follows the pointer, water and chime sounds. | light | fade / fade / motes | nature |
| hi-fi-warm | Cream paper with a sunflower accent and glowing VFD cyan details; playable decks, knobs and cassette-era hardware. | light | slide / rise / dust | soft |
| living-lab | A dark teal instrument-panel look for simulations and research: glowing cyan, gold focus, living canvas hero, pointer lens. | dark | iris / rise / motes | digital |
| paper-report | A manila folder and printed report on a desk: serif type, lab-style tables, flags; sound is paper and pen. | light | wipe / fade / none | paper |
| retail | Kraft paper, price-tag red and sunny yellow: a friendly shop with cart and checkout motion. | light | slide / scale / none | soft |
| retro-desktop | A one-bit 1980s office desktop: windows, a menu bar, stepped (non-eased) effects and square-wave beeps. | light | dither / stepped / none | retro |
| town-diorama | A walkable map-like world: a walker on a road, buildings you enter for each project, camera that follows, text version for access. | light | zoom / rise / none | soft |
| workbench | Warm off-white bench with a dark bezel for app mock-ups: latches, drawers, ratchets and screws for sound. | light | door / rise / none | metal |
| workshop | A dark garage wall with pegboard, steel and a yellow stencil accent; things are lifted, opened and slammed shut. | dark | curtain / rise / dust | metal |
<!--/GEN:themes-table-->

### Choosing a theme
<!--id:theme-choice-->
Start from the project's type, try the first theme, and change only tokens.

<!--GEN:types-->
| Project type | Themes to try first | Motion | Sound |
|---|---|---|---|
| App landing page | healing-mindfulness, hi-fi-warm, athletic-dark, retail, workbench | hero ambient layer + staggered feature reveal | soft cues on demo actions; palette matches the app material |
| Research or ML project | living-lab, blueprint-math, paper-report, town-diorama | figures draw in; one live hero | digital or soft; sound tied to real events |
| Course or report | paper-report, blueprint-math | quiet: wipes and fades; ambient layer off | paper palette |
| Tool or utility | workbench, workshop, retro-desktop, healing-mindfulness | mechanical, short | metal or retro |
| Game or simulation | living-lab, retro-desktop, town-diorama | the game IS the motion; keep chrome still | event-driven cues |
| Portfolio or hub | workshop, town-diorama, hi-fi-warm, retro-desktop | one strong transition metaphor | material-matched palette |
| Dashboard | living-lab, athletic-dark, blueprint-math | tween values; avoid constant motion | soft/digital, very sparing |
| Documentation | paper-report, blueprint-math, workbench | reading comes first: ambient off, subtle reveals only | soft; hover cues off |
<!--/GEN:types-->

### Making a new theme
<!--id:theme-new-->
1. Name the material and mood in three words ("warm, tactile, quiet") and pick the closest project type.
2. Copy `registry/themes/custom.json`. Set the structural tokens: system font stacks, radii, border, easing and duration overrides.
3. Design two colour sets, light and dark, with every role (never an inversion). Add `--accent-text` when the accent cannot be text.
4. Write the motion personality (three adjectives, transition, reveal style, ambient kind, easing) and choose the sound palette, volume and whether it has a pad.
5. Name one or two signature interactions and an avoid list.
6. `python3 scripts/registry.py save-theme my-theme.json` rejects any text pair under 4.5 to 1; add the theme to its type in `project_types.json`; run `registry.py validate`; scaffold a throwaway page, look at both modes, delete it, log it.

## 9. Engineering conventions
<!--id:engineering-->
- *Layout:* `index.html`, `text.html`, `assets/` (kit files, `data.js`, `app.js`, per-feature modules), `tests/`, `scripts/`, `README.md`, `DESIGN.md`, `favicon-64.png`, `assets/og-image.png`, `.nojekyll`, `.privacy-deny`.
- *Hosting:* static GitHub Pages from `main` root, with canonical and Open Graph tags.
- *Data-driven:* content in `assets/data.js`; rendering sets text with `textContent`, never `innerHTML` from data; the text version is built from the same data.
- *Small modules:* pure logic apart from the DOM and exported for tests; one responsibility per file; no file over about 350 lines; one global namespace (`DW`).
- *Tests:* only real logic (pure helpers, data shape, the audit script, anything computed). No "it renders" or snapshot tests.
- *Docs:* README.md (run, structure, test) and DESIGN.md (purpose, tokens, motion, sound, interaction inventory, accessibility, decisions and trade-offs) in every repo. Write them as you go.
- *Storage keys:* versioned (`mysite1-sound`); the only unversioned key is the shared `theme`.
- *Git:* small commits with plain-language messages; no attribution lines (no Co-Authored-By, no "Generated with"); pull requests rather than merging the owner's source repositories; never commit temp files, `.bak` files, node_modules or screenshots of private chats.
- *Verification:* look at screenshots. Headless Firefox on a fresh profile, window-sized (never full screen), in light and dark and at 390 pixels, delete the temp files afterwards.
- *Privacy on public pages:* no private or under-review projects, no lab or employer names on research pages, a `.privacy-deny` list checked by `check_site.js`, no trackers or analytics.

## 10. Conformance audit
<!--id:conformance-->
A real audit, read from the live repositories by `scripts/audit_conformance.py` on the date in the caption. Each check is evaluated twice, on the committed files and on the working tree: "yes" means committed, "in progress" means it exists only in uncommitted edits (a retrofit under way), "missing" means absent. The checks are heuristics over the code; the notes below say what needed a human eye.

<!--GEN:conformance-->
| Page | Sound symbol control | Motion symbol control | Effects symbol control | Quiet-everything control | Sound on by default | Shared theme key | Light/Dark/Auto selector | Early theme script in head | Reduced-motion gate | Text or no-JS fallback | README.md | DESIGN.md | Tests | No external requests | Follows shared theme | State |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Himawari | yes | missing | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | missing | missing | yes | committed (86941a3, 2026-11-04) |
| Calendar | yes | yes | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (6ea421d, 2026-11-04) |
| Abiogenesis | yes | yes | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (b87017c, 2026-11-04) |
| BIOT 6900 | yes | missing | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | missing | yes | committed (1cd5eb4, 2026-11-04) |
| The Garage | yes | missing | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (5cbac11, 2026-11-04) |
| FocusLock | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (31fc1cd, 2026-11-04) |
| Atlas Mobile | yes | missing | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (bb62036, 2026-11-04) |
| LucasCheck | yes | missing | missing | missing | missing | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (5413bfe, 2026-11-04) |
| ML projects town | yes | yes | yes | missing | missing | missing | missing | missing | yes | yes | yes | missing | yes | yes | no | committed (06c0cd2, 2026-11-04) |
| macOS tools | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | missing | yes | yes | yes | committed (685c1ba, 2026-11-04) |
| Manifold | yes | yes | yes | yes | yes | missing | missing | missing | yes | yes | yes | missing | yes | yes | no | committed (855273d, 2026-11-04) |
<!--/GEN:conformance-->

<!--GEN:conformance-summary-->
- Sound symbol control: 11 of 11 have it.
- Motion symbol control: 6 of 11 have it; missing: Himawari, BIOT 6900, The Garage, Atlas Mobile, LucasCheck.
- Effects symbol control: 4 of 11 have it; missing: Himawari, Calendar, Abiogenesis, BIOT 6900, The Garage, Atlas Mobile, LucasCheck.
- Quiet-everything control: 3 of 11 have it; missing: Himawari, Calendar, Abiogenesis, BIOT 6900, The Garage, Atlas Mobile, LucasCheck, ML projects town.
- Sound on by default: 3 of 11 have it; missing: Himawari, Calendar, Abiogenesis, BIOT 6900, The Garage, Atlas Mobile, LucasCheck, ML projects town.
- Shared theme key: 9 of 11 have it; missing: ML projects town, Manifold.
- Light/Dark/Auto selector: 9 of 11 have it; missing: ML projects town, Manifold.
- Early theme script in head: 9 of 11 have it; missing: ML projects town, Manifold.
- Reduced-motion gate: 11 of 11 have it.
- Text or no-JS fallback: 11 of 11 have it.
- README.md: 11 of 11 have it.
- DESIGN.md: 0 of 11 have it; missing: Himawari, Calendar, Abiogenesis, BIOT 6900, The Garage, FocusLock, Atlas Mobile, LucasCheck, ML projects town, macOS tools, Manifold.
- Tests: 10 of 11 have it; missing: Himawari.
- No external requests: 9 of 11 have it; missing: Himawari, BIOT 6900.
- What a visitor without JavaScript gets (checked in code): Himawari (static content), Calendar (noscript), Abiogenesis (noscript), BIOT 6900 (static content), The Garage (noscript), FocusLock (noscript), Atlas Mobile (static content), LucasCheck (static content), ML projects town (text version), macOS tools (static content), Manifold (noscript).
- Seen by reading Calendar: retro desktop with stepped motion by design (steps, no easing curves).
- Seen by reading BIOT 6900: the Sound button is injected by sound.js (so the markup search misses it) and is off until pressed; the page loads Literata from Google Fonts and 3Dmol from cdnjs.
- Seen by reading ML projects town: its theme is a single cycle button with its own key (mlp-theme), not the shared theme key.
<!--/GEN:conformance-summary-->

Re-run it any time: `python3 scripts/audit_conformance.py && python3 scripts/build.py`.

## 11. Apply Murmur to a new project in five steps
<!--id:apply-->
1. *Read and choose.* Read `registry/preferences.md` and run `python3 ~/.claude/skills/dynamic-web-design/scripts/registry.py show`. Pick the project type and a theme from part 8.
2. *Scaffold.* `python3 ~/.claude/skills/dynamic-web-design/scripts/new_site.py <dir> --name "Name" --type <type> --theme <theme> --tagline "..." [--palette ...] [--transition ...] [--ambient ...] --url https://dhairyab0069.github.io/<slug>/`. You get the kit, the four symbol controls, the theme selector, a text version, tests, README, DESIGN.md, favicon and og-image, registered in the skill.
3. *Fill.* Edit `assets/data.js` for content, `assets/tokens.css` for look, `assets/site.config.js` for palette and volume. Add components from the recipes. Write each decision into DESIGN.md as you go.
4. *Verify.* `node scripts/build_text.js && node tests/site.test.js`, then look at screenshots in light, dark and at 390 pixels, motion on and off.
5. *Document and write back.* Update README.md and DESIGN.md, then `registry.py update-project`, `registry.py log`, and run `registry.py validate`. Publish from `main` root and confirm the live URL.

## 12. Changelog
<!--id:changelog-->
- 1.0.0, 2026-11-04: first publication. Seven principles; tokens exported for twelve themes in both modes; the motion, sound and controls language; the shared light, dark and auto setting; the conformance audit; the style guide site.

## 13. Decisions and trade-offs
<!--id:decisions-->
- *Name:* Murmur, because the whole idea is quiet aliveness that can be hushed. Alternatives rejected: names tied to one project (Himawari), or generic ones (Pulse).
- *Observed first, then prescribed:* where pages disagree (voice caps of 20 to 90, master gains of 0.2 to 0.3, five easing curves) the language picks the safest value and says what the pages do. Where a rule is a decision (sound on by default), it is marked as one.
- *Roles over names:* Murmur names colours by role and lets pages keep material aliases. Renaming every page's variables would be churn with no visible gain.
- *Sound on by default:* a deliberate choice by the owner, balanced by the always-visible controls, the hidden-tab rule, the loudness ceiling and the first-gesture unlock. The cost is that some visitors will hear something they did not ask for; the moon is one press away.
- *Generated, not copied:* tokens and tables are generated from the skill registry, so the document cannot drift from the kit. The cost is a small authoring-time Python script; the site itself has no build step at runtime.
- *Contained demos:* the style guide runs transitions inside a stage rather than over the whole screen, so reading is never interrupted. It uses the kit's own keyframes, so what you see is what pages do.
- *One metaphor per project:* twelve themes each have one transition. Mixing metaphors on a page was rejected because the transition is the page's signature.
- *Honest audit:* the conformance table shows the pages that diverge instead of hiding them. Heuristics can mislead, so the table is a prompt to look, not a verdict.
- *Light, dark and auto as first-class:* both sets are designed and tested for every theme, because inverting a dark page rarely gives a good light page.
- *Some themes are proposed:* the blueprint-math theme was chosen before its page existed; it is exported like the rest and marked in the registry.

## Appendix: all theme tokens
<!--id:appendix-->
Generated from the registry. The same values, with contrast ratios, are in `tokens/tokens.json`.

<!--GEN:theme-tables-->
#### Athletic dark (`athletic-dark`)

Near-black iron with a volt-green accent and heat orange; punchy, fast, set-by-set rhythm.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f3f4ee` | `#0c0e11` |
| `--surface` | `#ffffff` | `#14171c` |
| `--surface-2` | `#e6e8dd` | `#1d2128` |
| `--ink` | `#0c0e11` | `#f1efe6` |
| `--muted` | `#4b5563` | `#9aa3af` |
| `--line` | `#cfd3c4` | `#2a303a` |
| `--accent` | `#0c0e11` | `#d6ff3d` |
| `--accent-text` | `#0c0e11` | `#d6ff3d` |
| `--accent-ink` | `#d6ff3d` | `#0c0e11` |
| `--accent-soft` | `#e4f59a` | `#2c3510` |
| `--accent-2` | `#c23a1b` | `#ff5a36` |
| `--focus` | `#2457c5` | `#d6ff3d` |
| `--overlay` | `#0c0e11` | `#0c0e11` |
| `--glow-rgb` | `214, 255, 61` | `214, 255, 61` |

Structural overrides: `--font-display: "Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif`, `--weight-display: 800`, `--radius-m: 10px`, `--dur-base: 220ms`, `--dur-slow: 420ms`

#### Blueprint and math (`blueprint-math`)

A blueprint-blue field with fine grid lines, white construction strokes and pentatonic tones that never clash.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#eef3fb` | `#0b1b33` |
| `--surface` | `#ffffff` | `#10264a` |
| `--surface-2` | `#dfe8f6` | `#15305c` |
| `--ink` | `#0b1b33` | `#e3edff` |
| `--muted` | `#46597a` | `#9db4d8` |
| `--line` | `#b4c4de` | `#2a4a7c` |
| `--accent` | `#1d5fbf` | `#6cb4ff` |
| `--accent-text` | `#1d5fbf` | `#6cb4ff` |
| `--accent-ink` | `#ffffff` | `#06142a` |
| `--accent-soft` | `#d5e4fa` | `#173a6b` |
| `--accent-2` | `#8a5c00` | `#ffd166` |
| `--focus` | `#8a5c00` | `#ffd166` |
| `--overlay` | `#0b1b33` | `#0b1b33` |
| `--glow-rgb` | `29, 95, 191` | `108, 180, 255` |

Structural overrides: `--font-display: "Avenir Next", system-ui, sans-serif`, `--weight-display: 700`, `--radius-m: 8px`

#### Custom (guided) (`custom`)

Start here when none of the themes fit. Fill the checklist in references/recipes.md, write the result to registry/themes/<id>.json, and document each choice in DESIGN.md.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f6f4ee` | `#14181b` |
| `--surface` | `#ffffff` | `#1c2226` |
| `--surface-2` | `#ece9df` | `#242c31` |
| `--ink` | `#1d2328` | `#e8ecef` |
| `--muted` | `#55606a` | `#a4aeb6` |
| `--line` | `#d6d2c4` | `#34414a` |
| `--accent` | `#2f6f5e` | `#6fc3a8` |
| `--accent-text` | `#2f6f5e` | `#6fc3a8` |
| `--accent-ink` | `#ffffff` | `#0f1a16` |
| `--accent-soft` | `#dcebe5` | `#1f3a32` |
| `--accent-2` | `#b5731f` | `#e0a85a` |
| `--focus` | `#1d5fc4` | `#7aa8ff` |
| `--overlay` | `#1d2328` | `#0b0f11` |
| `--glow-rgb` | `255, 214, 130` | `255, 214, 130` |

No structural overrides (uses the base scale).

#### Healing and mindfulness (`healing-mindfulness`)

Sage, sand and soft light for calm products; slow breathing motion, a lantern that follows the pointer, water and chime sounds.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#eef2ec` | `#141c1d` |
| `--surface` | `#f9faf6` | `#1c2628` |
| `--surface-2` | `#e6ebe2` | `#232f31` |
| `--ink` | `#22323a` | `#e4ece8` |
| `--muted` | `#52646b` | `#a2b4b0` |
| `--line` | `#d3dccf` | `#33423f` |
| `--accent` | `#37725d` | `#7fc4a8` |
| `--accent-text` | `#37725d` | `#7fc4a8` |
| `--accent-ink` | `#ffffff` | `#0f1c18` |
| `--accent-soft` | `#d7e8df` | `#25403a` |
| `--accent-2` | `#84642b` | `#84642b` |
| `--focus` | `#2a5fb0` | `#7fb2ff` |
| `--overlay` | `#dfe8df` | `#141c1d` |
| `--glow-rgb` | `255, 214, 130` | `255, 214, 130` |

Structural overrides: `--font-display: ui-rounded, "SF Pro Rounded", system-ui, sans-serif`, `--radius-m: 16px`, `--radius-l: 22px`, `--dur-slow: 700ms`, `--dur-scene: 1200ms`

#### Hi-fi warm (`hi-fi-warm`)

Cream paper with a sunflower accent and glowing VFD cyan details; playable decks, knobs and cassette-era hardware.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#fbf7ee` | `#111214` |
| `--surface` | `#ffffff` | `#1a1c20` |
| `--surface-2` | `#f1eadb` | `#22252a` |
| `--ink` | `#1d1a14` | `#f3efe6` |
| `--muted` | `#6b6356` | `#a39c8f` |
| `--line` | `#e8e0cf` | `#33363c` |
| `--accent` | `#f2a900` | `#f2a900` |
| `--accent-text` | `#8a5a00` | `#f2a900` |
| `--accent-ink` | `#1d1a14` | `#1d1a14` |
| `--accent-soft` | `#fbe9bd` | `#4a3a10` |
| `--accent-2` | `#3d7fd9` | `#3d7fd9` |
| `--focus` | `#3d7fd9` | `#3d7fd9` |
| `--overlay` | `#1d1a14` | `#111214` |
| `--glow-rgb` | `95, 240, 255` | `95, 240, 255` |

Structural overrides: `--font-display: ui-rounded, "SF Pro Rounded", system-ui, sans-serif`

#### Living lab (`living-lab`)

A dark teal instrument-panel look for simulations and research: glowing cyan, gold focus, living canvas hero, pointer lens.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#eaf6f8` | `#020b10` |
| `--surface` | `#ffffff` | `#07161d` |
| `--surface-2` | `#d8edf1` | `#0b2029` |
| `--ink` | `#0b2a33` | `#d9fbff` |
| `--muted` | `#3f6670` | `#9cc6cd` |
| `--line` | `#a9cfd6` | `#1b4a55` |
| `--accent` | `#00697a` | `#29dded` |
| `--accent-text` | `#00697a` | `#29dded` |
| `--accent-ink` | `#ffffff` | `#021016` |
| `--accent-soft` | `#cdeaef` | `#0d3a42` |
| `--accent-2` | `#a0237f` | `#e648c8` |
| `--focus` | `#8a6200` | `#fbc934` |
| `--overlay` | `#0b2a33` | `#020b10` |
| `--glow-rgb` | `0, 150, 170` | `41, 221, 237` |

Structural overrides: `--font-display: "Avenir Next", ui-rounded, "SF Pro Rounded", system-ui, sans-serif`, `--weight-display: 800`

#### Paper report (`paper-report`)

A manila folder and printed report on a desk: serif type, lab-style tables, flags; sound is paper and pen.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#dcdad3` | `#1c1a16` |
| `--surface` | `#f4f2ec` | `#26231d` |
| `--surface-2` | `#e1ded6` | `#2f2b23` |
| `--ink` | `#1b1b19` | `#ece6d6` |
| `--muted` | `#55544f` | `#b3ab98` |
| `--line` | `#b9b6ad` | `#4a4436` |
| `--accent` | `#5a4416` | `#e0c07a` |
| `--accent-text` | `#5a4416` | `#e0c07a` |
| `--accent-ink` | `#ffffff` | `#1c1a16` |
| `--accent-soft` | `#e9dbb8` | `#3d3520` |
| `--accent-2` | `#b42318` | `#ff8b7d` |
| `--focus` | `#1d5fc4` | `#8ab4ff` |
| `--overlay` | `#c7ab73` | `#3a3326` |
| `--glow-rgb` | `255, 244, 214` | `255, 236, 190` |

Structural overrides: `--font-display: "Iowan Old Style", "Palatino Linotype", Georgia, serif`, `--font-body: Georgia, "Times New Roman", serif`, `--weight-display: 700`, `--track-display: 0`, `--radius-s: 2px`, `--radius-m: 3px`, `--radius-l: 4px`

#### Retail (`retail`)

Kraft paper, price-tag red and sunny yellow: a friendly shop with cart and checkout motion.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f4ecda` | `#1c1812` |
| `--surface` | `#fffaf0` | `#272118` |
| `--surface-2` | `#ece1c8` | `#31291d` |
| `--ink` | `#1f1a14` | `#f4ecda` |
| `--muted` | `#6a5f4f` | `#bcae92` |
| `--line` | `#d8caa9` | `#4b4130` |
| `--accent` | `#c9301a` | `#ff7a63` |
| `--accent-text` | `#c9301a` | `#ff7a63` |
| `--accent-ink` | `#ffffff` | `#1c1812` |
| `--accent-soft` | `#f6d9d2` | `#4a2a22` |
| `--accent-2` | `#176b47` | `#4fc08d` |
| `--focus` | `#24324d` | `#ffd23f` |
| `--overlay` | `#24324d` | `#0f0d09` |
| `--glow-rgb` | `255, 210, 63` | `255, 210, 63` |

Structural overrides: `--font-display: "Avenir Next", ui-rounded, system-ui, sans-serif`, `--weight-display: 800`, `--radius-m: 12px`

#### Retro desktop (`retro-desktop`)

A one-bit 1980s office desktop: windows, a menu bar, stepped (non-eased) effects and square-wave beeps.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f2f2f0` | `#0e0e0c` |
| `--surface` | `#ffffff` | `#1a1a17` |
| `--surface-2` | `#d8d8d4` | `#2c2c28` |
| `--ink` | `#000000` | `#f2f2ea` |
| `--muted` | `#3a3a3a` | `#bdbdb2` |
| `--line` | `#000000` | `#f2f2ea` |
| `--accent` | `#000000` | `#f2f2ea` |
| `--accent-text` | `#000000` | `#f2f2ea` |
| `--accent-ink` | `#ffffff` | `#0e0e0c` |
| `--accent-soft` | `#d8d8d4` | `#2c2c28` |
| `--accent-2` | `#00777a` | `#6fe3e6` |
| `--focus` | `#00777a` | `#6fe3e6` |
| `--overlay` | `#000000` | `#f2f2ea` |
| `--glow-rgb` | `255, 255, 255` | `242, 242, 234` |

Structural overrides: `--font-display: ui-monospace, "Monaco", "Courier New", monospace`, `--font-body: ui-monospace, "Monaco", "Courier New", monospace`, `--weight-display: 700`, `--track-display: 0`, `--radius-s: 0`, `--radius-m: 0`, `--radius-l: 0`, `--radius-pill: 0`, `--border: 2px solid var(--line)`, `--ease-standard: steps(6, end)`, `--ease-out: steps(6, end)`, `--ease-spring: steps(6, end)`

#### Town diorama (`town-diorama`)

A walkable map-like world: a walker on a road, buildings you enter for each project, camera that follows, text version for access.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f5f7f6` | `#0f1a1f` |
| `--surface` | `#ffffff` | `#16252c` |
| `--surface-2` | `#eef2f1` | `#1d313a` |
| `--ink` | `#11222b` | `#e6f1f3` |
| `--muted` | `#4a5b64` | `#a3b9c0` |
| `--line` | `#d3dcdb` | `#2c444e` |
| `--accent` | `#c42a40` | `#ff6b80` |
| `--accent-text` | `#c42a40` | `#ff6b80` |
| `--accent-ink` | `#ffffff` | `#0f1a1f` |
| `--accent-soft` | `#f6dde1` | `#3d2229` |
| `--accent-2` | `#9a5f06` | `#f2b01e` |
| `--focus` | `#1b5fd1` | `#7fb2ff` |
| `--overlay` | `#a9d0e2` | `#1d3a4a` |
| `--glow-rgb` | `255, 214, 107` | `255, 214, 107` |

Structural overrides: `--font-display: ui-rounded, "SF Pro Rounded", system-ui, sans-serif`

#### Workbench (`workbench`)

Warm off-white bench with a dark bezel for app mock-ups: latches, drawers, ratchets and screws for sound.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#f4f1ec` | `#17181c` |
| `--surface` | `#ffffff` | `#1f2127` |
| `--surface-2` | `#ebe6dd` | `#272a31` |
| `--ink` | `#1c1d22` | `#eceef3` |
| `--muted` | `#62646d` | `#a6a9b4` |
| `--line` | `#ded9cf` | `#363944` |
| `--accent` | `#3a57c8` | `#8fa4f5` |
| `--accent-text` | `#3a57c8` | `#8fa4f5` |
| `--accent-ink` | `#ffffff` | `#12141c` |
| `--accent-soft` | `#dfe5f8` | `#2a3260` |
| `--accent-2` | `#6a5cff` | `#a79cff` |
| `--focus` | `#3a57c8` | `#8fa4f5` |
| `--overlay` | `#1b1d24` | `#0b0c10` |
| `--glow-rgb` | `106, 92, 255` | `143, 164, 245` |

Structural overrides: `--font-display: ui-rounded, "SF Pro Rounded", system-ui, sans-serif`, `--radius-m: 12px`

#### Workshop (`workshop`)

A dark garage wall with pegboard, steel and a yellow stencil accent; things are lifted, opened and slammed shut.

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#ece7d8` | `#26292d` |
| `--surface` | `#f7f3e6` | `#2f3338` |
| `--surface-2` | `#ddd6c2` | `#17181a` |
| `--ink` | `#1d1a14` | `#ece7d8` |
| `--muted` | `#5a5648` | `#a8a699` |
| `--line` | `#b9b29c` | `#444b51` |
| `--accent` | `#8a5a00` | `#f2b705` |
| `--accent-text` | `#8a5a00` | `#f2b705` |
| `--accent-ink` | `#ffffff` | `#1d1a14` |
| `--accent-soft` | `#f1dfa8` | `#4a4220` |
| `--accent-2` | `#b3400a` | `#e8590c` |
| `--focus` | `#1d5fc4` | `#f2b705` |
| `--overlay` | `#444b51` | `#17181a` |
| `--glow-rgb` | `255, 241, 196` | `255, 241, 196` |

Structural overrides: `--font-display: Impact, "Arial Narrow Bold", "Haettenschweiler", "Helvetica Neue", Arial, sans-serif`, `--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`, `--weight-display: 400`, `--track-display: .02em`, `--radius-s: 3px`, `--radius-m: 6px`, `--radius-l: 10px`
<!--/GEN:theme-tables-->

## Appendix: page-specific scales
<!--id:appendix-scales-->
The shared scales in part 2 come from the kit's `tokens.css`. Full lists: `tokens/tokens.css` (structural tokens in `:root`, each theme scoped by `[data-dl-theme="id"]` with an optional `[data-dl-mode="light|dark"]`).
