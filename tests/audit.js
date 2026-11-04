#!/usr/bin/env node
/* Audit a static site against the owner's non-negotiables.
   Usage: node check_site.js <site-dir> [--deny word1,word2] [--deny-file path] [--strict]
   Exit 1 on any error (--strict also fails on warnings). Also exports audit(dir, opts) for use in a site's own tests.
   Heuristic by design: it catches the common regressions, it does not replace looking at the page. */
const fs = require('fs'), path = require('path');

function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'media-src', 'release'].includes(n)) continue;
    const p = path.join(dir, n), s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const read = f => fs.readFileSync(f, 'utf8');

function audit(dir, opts = {}) {
  const results = [], rel = f => path.relative(dir, f);
  const add = (level, msg) => results.push({ level, msg });
  const ok = (cond, level, pass, fail) => add(cond ? 'pass' : level, cond ? pass : fail);

  const files = walk(dir), isTest = f => /(^|\/)(tests?|scripts)\//.test(rel(f)) || /\.test\.js$/.test(f);
  const html = files.filter(f => /\.html$/.test(f) && !isTest(f)), css = files.filter(f => /\.css$/.test(f)), js = files.filter(f => /\.js$/.test(f) && !isTest(f));
  const src = [...html, ...css, ...js].map(f => ({ f, t: read(f) }));
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(index)) { add('error', 'no index.html'); return summarise(results); }
  const idx = read(index), jsAll = src.filter(s => s.f.endsWith('.js')).map(s => s.t).join('\n'), cssAll = src.filter(s => s.f.endsWith('.css')).map(s => s.t).join('\n');
  const inlineJs = [...idx.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const allJs = jsAll + '\n' + inlineJs, allCss = cssAll + '\n' + [...idx.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

  /* 1. no external requests */
  const ext = [];
  for (const { f, t } of src) {
    const text = f.endsWith('.js') ? t.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1') : t;
    const pats = [/<(?:script|img|iframe|source|video|audio|embed)\b[^>]*\bsrc=["'](?:https?:)?\/\/[^"']+/gi, /<link\b[^>]*\bhref=["'](?:https?:)?\/\/[^"']+["'][^>]*>/gi, /url\(\s*["']?(?:https?:)?\/\/[^)"']+/gi, /@import\s+(?:url\()?["']?(?:https?:)?\/\/[^"')]+/gi, /\b(?:fetch|import|XMLHttpRequest[^;]*open|WebSocket|EventSource|sendBeacon)\s*\(\s*[^)]*["'](?:https?:)?\/\/[^"']+/g];
    for (const re of pats) for (const m of text.matchAll(re)) {
      if (/rel=["'](?:canonical|alternate|me|author)["']/.test(m[0])) continue;                 // links, not requests
      if (/xmlns|w3\.org/.test(m[0])) continue;
      ext.push(rel(f) + ': ' + m[0].slice(0, 80));
    }
  }
  ok(!ext.length, 'error', 'no external requests (scripts, styles, fonts, images, fetch)', 'external requests found:\n    ' + ext.slice(0, 6).join('\n    '));

  /* 2. symbol controls: sound, motion, effects, quiet, as buttons with aria-pressed */
  const btns = [...idx.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].map(m => ({ attrs: m[1], inner: m[2] }));
  const ident = b => ((b.attrs.match(/\bid=["']([^"']*)/) || [])[1] || '') + ' ' + ((b.attrs.match(/aria-label=["']([^"']*)/) || [])[1] || '');
  const has = re => btns.some(b => /aria-pressed/.test(b.attrs) && re.test(ident(b)));
  const kinds = { sound: /sound|audio|speaker/i, motion: /motion|animation/i, effects: /effect|cursor|fx/i, quiet: /quiet|mute|calm/i };
  const missing = Object.keys(kinds).filter(k => !has(kinds[k]));
  ok(!missing.length, 'error', 'symbol controls present: Sound, Motion, Effects, Quiet', 'missing symbol controls (button with aria-pressed): ' + missing.join(', '));

  /* 3. defaults ON */
  const offDefault = ['sound', 'motion', 'effects'].filter(k => btns.some(b => kinds[k].test(ident(b)) && /aria-pressed=["']false/.test(b.attrs)));
  ok(!offDefault.length, 'error', 'sound, motion and effects default to ON in the markup', 'default is OFF for: ' + offDefault.join(', '));

  /* 4. versioned storage keys */
  const keys = [...allJs.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\(\s*(['"`])([^'"`]+)\1/g)].map(m => m[2]).filter(k => k !== 'dw-arrive' && k !== 'theme');
  const unversioned = keys.filter(k => !/\d/.test(k));
  const prefixed = /keyPrefix\s*[:=]\s*['"][^'"]*\d/.test(allJs);
  ok(!unversioned.length, 'error', `storage keys are versioned (${keys.length} literal${prefixed ? ' + prefix' : ''})`, 'unversioned storage keys (add a version digit, e.g. "site1-sound"): ' + unversioned.join(', '));

  /* 5. reduced-motion gate */
  ok(/prefers-reduced-motion/.test(allJs) && /prefers-reduced-motion/.test(allCss + idx), 'error', 'prefers-reduced-motion honoured in JS and CSS', 'prefers-reduced-motion missing in ' + (/prefers-reduced-motion/.test(allJs) ? 'CSS' : 'JS'));

  /* 6. sound unlock on first gesture, no audio files */
  ok(/pointerdown|keydown|touchstart/.test(allJs) && /\.resume\(/.test(allJs) && /AudioContext/.test(allJs), 'error', 'sound is Web Audio with a first-gesture unlock', 'no AudioContext + resume() on pointerdown/keydown/touchstart found');
  const audioFiles = files.filter(f => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f));
  ok(!audioFiles.length, 'error', 'no audio files (synthesized only)', 'audio files present: ' + audioFiles.map(rel).join(', '));

  /* 7. no autoplay */
  const autoplay = src.filter(s => /<(?:audio|video)\b[^>]*\bautoplay\b/i.test(s.t) || /new Audio\(/.test(s.t));
  ok(!autoplay.length, 'error', 'no autoplay media', 'autoplay media in: ' + autoplay.map(s => rel(s.f)).join(', '));

  /* 8. accessible names */
  const bad = [];
  for (const b of btns) { const txt = b.inner.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim(); if (!txt && !/aria-label(?:ledby)?=/.test(b.attrs)) bad.push('<button ' + b.attrs.trim().slice(0, 50) + '>'); }
  const imgs = [...idx.matchAll(/<img\b[^>]*>/gi)].filter(m => !/\balt=/.test(m[0])).map(m => m[0].slice(0, 60));
  ok(!bad.length && !imgs.length, 'error', 'buttons and images have accessible names', 'missing names: ' + bad.concat(imgs).join('; '));
  const jsBtn = [...allJs.matchAll(/el\(\s*['"]button['"]/g)].length;   // buttons built in JS: check controls text there is non-empty
  if (jsBtn) add('pass', `${jsBtn} JS-built button(s): verify each has text or aria-label`);
  ok(/<html[^>]*\blang=/.test(idx) && /name=["']viewport["']/.test(idx), 'error', 'html lang and viewport meta present', 'html lang or viewport meta missing');

  /* 9. one rAF loop */
  const raf = js.filter(f => /requestAnimationFrame\s*\(/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')) && !/dw-allow-raf/.test(read(f)));
  ok(raf.length <= 1 && (raf.length === 0 || (read(raf[0]).match(/requestAnimationFrame\s*\(/g) || []).length <= 2), 'error', `one requestAnimationFrame loop (${raf.map(rel).join(', ') || 'none'})`, 'rAF used in several files (use DW.motion.ticker): ' + raf.map(rel).join(', '));

  /* 10. no layout-property animation */
  const LAYOUT = /^(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|font-size|line-height|border-width|all)$/;
  const layoutHits = [];
  for (const m of allCss.matchAll(/transition(?:-property)?\s*:\s*([^;}]+)/g)) {
    const props = m[1].split(',').map(p => p.trim().split(/\s+/)[0]);
    props.filter(p => LAYOUT.test(p)).forEach(p => layoutHits.push('transition ' + p));
  }
  for (const m of allCss.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})+)\s*\}/g)) {
    for (const d of m[1].matchAll(/([\w-]+)\s*:/g)) if (LAYOUT.test(d[1])) layoutHits.push('keyframes ' + d[1]);
  }
  ok(!layoutHits.length, 'warn', 'only transform/opacity/clip-path animate (no layout properties)', 'layout-property animation (use transform): ' + [...new Set(layoutHits)].slice(0, 6).join(', '));

  /* 11. documentation, tests, hosting */
  ok(fs.existsSync(path.join(dir, 'README.md')), 'error', 'README.md present', 'README.md missing');
  ok(fs.existsSync(path.join(dir, 'DESIGN.md')), 'error', 'DESIGN.md present (design documentation)', 'DESIGN.md missing: document purpose, theme, tokens, motion, sound, decisions');
  ok(fs.existsSync(path.join(dir, '.nojekyll')), 'warn', '.nojekyll present', '.nojekyll missing (GitHub Pages)');
  ok(/rel=["']canonical["']/.test(idx) && /og:image/.test(idx), 'warn', 'canonical and Open Graph tags present', 'canonical or og:image tag missing');
  ok(fs.existsSync(path.join(dir, 'text.html')) || /noscript/i.test(idx), 'warn', 'text/no-JS fallback present', 'no text.html and no <noscript> fallback');
  ok(files.some(f => /favicon/.test(f)), 'warn', 'favicon present', 'favicon missing');

  /* 12. privacy denylist (optional) */
  let deny = (opts.deny || []).slice();
  const df = opts.denyFile || path.join(dir, '.privacy-deny');
  if (fs.existsSync(df)) deny = deny.concat(read(df).split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')));
  if (deny.length) {
    const hits = [];
    for (const f of files.filter(f => /\.(html|css|js|md|json|svg)$/.test(f) && !/\.privacy-deny$/.test(f))) { const t = read(f).toLowerCase(); deny.forEach(w => { if (t.includes(w.toLowerCase())) hits.push(`"${w}" in ${rel(f)}`); }); }
    ok(!hits.length, 'error', `privacy denylist clean (${deny.length} terms)`, 'denylist hits: ' + hits.slice(0, 8).join('; '));
  }

  /* 13. shared light / dark / auto theme (one localStorage key "theme" across every page on the origin) */
  ok(/localStorage\.getItem\(\s*['"]theme['"]/.test(allJs) && /localStorage\.setItem\(\s*['"]theme['"]/.test(allJs), 'error', 'shared theme key "theme" read and written', 'shared theme key missing: read and write localStorage "theme" (light|dark|auto)');
  const badKeys = [...new Set([...allJs.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\(\s*(['"`])([^'"`]*theme[^'"`]*)\1/gi)].map(m => m[2]).filter(k => k !== 'theme'))];
  ok(!badKeys.length, 'error', 'no per-page theme keys', 'per-page theme keys found (use the shared "theme" key only): ' + badKeys.join(', '));
  const headEnd = idx.search(/<link[^>]+rel=["']stylesheet["']/i), early = idx.slice(0, headEnd < 0 ? idx.length : headEnd);
  ok(/<script(?![^>]*src)[^>]*>[\s\S]*getItem\(\s*['"]theme['"][\s\S]*data-theme-mode[\s\S]*<\/script>/i.test(early) && /prefers-color-scheme/.test(early), 'error', 'early inline theme script runs before the stylesheets (no flash)', 'early inline script missing or after the stylesheets: it must read "theme", resolve auto and set data-theme-mode/data-theme');
  const hasLight = /\[data-theme=["']?light["']?\]/.test(allCss) || /:root\s*\{[^}]*--bg/.test(allCss), hasDark = /\[data-theme=["']?dark["']?\]/.test(allCss), hasFallback = /prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme\]\)/.test(allCss);
  ok(hasLight && hasDark && hasFallback, 'error', 'light and dark token sets plus the no-JS prefers-color-scheme fallback', 'tokens need :root[data-theme="light"], :root[data-theme="dark"] and @media (prefers-color-scheme: dark){:root:not([data-theme]){...}}');
  const grp = idx.match(/<[a-z]+[^>]*role=["']radiogroup["'][^>]*>([\s\S]*?)<\/div>/i), radios = grp ? [...grp[1].matchAll(/<button\b[^>]*role=["']radio["'][^>]*>/gi)].map(m => m[0]) : [];
  const okRadios = grp && /aria-label=["'][^"']*theme/i.test(grp[0].slice(0, 200)) && radios.length === 3 && ['light', 'dark', 'auto'].every(m => radios.some(r => new RegExp('data-theme-mode=["\']' + m).test(r))) && radios.every(r => /aria-checked=/.test(r) && /aria-label=/.test(r));
  ok(okRadios, 'error', 'three-way theme radiogroup (light, dark, auto) with aria-checked and aria-label', 'theme control missing: role="radiogroup" aria-label="Color theme" with 3 role="radio" buttons (data-theme-mode light|dark|auto, aria-checked, aria-label)');
  ok(/dispatchEvent\(\s*new CustomEvent\(\s*['"]themechange['"]/.test(allJs), 'error', 'themechange event dispatched', 'themechange CustomEvent is never dispatched');
  ok(/addEventListener\(\s*['"]themechange['"]/.test(allJs) || !/getContext\(/.test(allJs), 'warn', 'themechange handled by canvas/colour caches', 'canvases exist but nothing listens for themechange (re-read tokens there)');
  ok(/addEventListener\(\s*['"]storage['"]/.test(allJs), 'error', 'storage listener applies theme changes from other pages and tabs live', 'no storage event listener for the shared theme');
  return summarise(results);
}

function summarise(results) { return { results, errors: results.filter(r => r.level === 'error').length, warnings: results.filter(r => r.level === 'warn').length }; }

if (require.main === module) {
  const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--deny')) || '.';
  const opt = { deny: [] }, di = args.indexOf('--deny'); if (di >= 0) opt.deny = args[di + 1].split(',');
  const fi = args.indexOf('--deny-file'); if (fi >= 0) opt.denyFile = args[fi + 1];
  const r = audit(path.resolve(dir), opt);
  for (const x of r.results) console.log((x.level === 'pass' ? '  ok   ' : x.level === 'warn' ? '  WARN ' : '  FAIL ') + x.msg);
  console.log(`\n${r.errors} error(s), ${r.warnings} warning(s)`);
  process.exit(r.errors || (args.includes('--strict') && r.warnings) ? 1 : 0);
}
module.exports = { audit };
