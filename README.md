# Murmur: the design language for Dhairya Bhatia's pages

The canonical design language for the project pages on `dhairyab0069.github.io`, plus a live, interactive style guide.

- Live style guide: https://dhairyab0069.github.io/design-language/
- The document, readable on its own: [DESIGN-LANGUAGE.md](DESIGN-LANGUAGE.md)
- Design tokens for all twelve themes, light and dark: [tokens/tokens.json](tokens/tokens.json) and [tokens/tokens.css](tokens/tokens.css)
- The conformance audit of the live pages: [docs/conformance.json](docs/conformance.json)
- A plain reading copy with no scripts: [text.html](text.html)

Murmur in one breath: every page is alive (sound, motion, transitions), always hushable (four symbol controls and one shared Light, Dark and Auto setting), honest, plain, built from tokens, and self-contained.

## How it is made

The prose lives once, in `DESIGN-LANGUAGE.md`. The site template `src/index.tpl.html` pulls chunks of it (`{{md:key}}`) and wraps them with live demos, so the page and the document cannot disagree. Tables (scales, contrast, themes, cues, conformance) and the token exports are generated from the `dynamic-web-design` skill registry and kit, so the language and the skill stay in sync.

```
python3 scripts/audit_conformance.py   # read the live repos (read-only), write docs/conformance.json
python3 scripts/build.py               # tokens/, assets/dl-data.js, the generated blocks, index.html
node scripts/build_text.js             # text.html
npm test                               # kit tests, the audit, and the design language tests
```

## Structure

| Path | What |
|---|---|
| `DESIGN-LANGUAGE.md` | the canonical document (generated blocks are marked `<!--GEN:name-->`) |
| `src/` | the page template (`index.tpl.html`) |
| `index.html`, `text.html` | generated site and its text version |
| `assets/` | the kit (`motion.js`, `sound.js`, `transitions.js`, `controls.js`, `theme.js`, ...) and the guide (`guide.js`, `demo-*.js`, `app.js`, `guide.css`) |
| `tokens/` | `tokens.json`, `tokens.css` (generated) |
| `scripts/` | `build.py`, `site_md.py`, `audit_conformance.py`, `build_text.js` |
| `tests/` | `site.test.js` (kit and audit), `design-language.test.js` (tokens, modes, cues, symbols) |
| `docs/` | `conformance.json` |

## Using the tokens

```html
<link rel="stylesheet" href="https://dhairyab0069.github.io/design-language/tokens/tokens.css">
<section data-dl-theme="workshop">...</section>            <!-- follows the page's light or dark -->
<section data-dl-theme="workshop" data-dl-mode="dark">...</section>   <!-- forced mode -->
```

Real pages should copy the file rather than link it (no external requests); the scaffold in the skill does this for you.

## Privacy and rules

No external requests, no analytics, no libraries. Commits carry no attribution lines. Source repos of other projects are only read by the audit, never changed.
