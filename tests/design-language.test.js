/* Focused tests for the design language itself: tokens, both modes for every theme, the cue vocabulary, the guide's pure helpers, and that the
   generated files agree with each other. Run: node tests/design-language.test.js */
const assert = require('assert'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const T = JSON.parse(read('tokens/tokens.json')), doc = read('DESIGN-LANGUAGE.md'), page = read('index.html');
const Sd = require('../assets/sound.js'), G = require('../assets/guide.js');

// contrast, recomputed here from the raw hex values (not read from the stored ratios)
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ROLES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--accent', '--accent-text', '--accent-ink', '--accent-soft', '--accent-2', '--focus', '--overlay', '--glow-rgb'];
const ids = Object.keys(T.themes);
assert.strictEqual(ids.length, 12, 'twelve themes');
for (const id of ids) for (const mode of ['light', 'dark']) {
  const c = T.themes[id][mode];
  ROLES.forEach(r => assert.ok(c[r], `${id} ${mode} lacks ${r}`));
  [['--ink', '--bg'], ['--ink', '--surface'], ['--muted', '--bg'], ['--muted', '--surface'], ['--accent-text', '--bg'], ['--accent-text', '--surface'], ['--accent-ink', '--accent']]
    .forEach(([a, b]) => assert.ok(ratio(c[a], c[b]) >= 4.5, `${id} ${mode} ${a} on ${b} is ${ratio(c[a], c[b]).toFixed(2)}`));
  assert.ok(ratio(c['--focus'], c['--bg']) >= 3, `${id} ${mode} focus ring`);
}
ids.forEach(id => assert.notDeepStrictEqual(T.themes[id].light, T.themes[id].dark, id + ': light and dark must be designed separately'));

// the css export has both modes for every theme, and the doc and page list every theme
const css = read('tokens/tokens.css');
ids.forEach(id => {
  assert.ok(css.includes(`[data-dl-theme="${id}"] {`), id + ' light scope in tokens.css');
  assert.ok(new RegExp(`:root\\[data-theme="dark"\\] \\[data-dl-theme="${id}"\\]:not\\(\\[data-dl-mode\\]\\)`).test(css), id + ' dark scope in tokens.css');
  assert.ok(css.includes(`:root:not([data-theme]) [data-dl-theme="${id}"]:not([data-dl-mode])`), id + ' no-JS dark fallback');
  assert.ok(doc.includes('`' + id + '`') && page.includes(id), id + ' named in the document and the page');
});
assert.strictEqual(fs.readdirSync(path.join(process.env.HOME, '.claude/skills/dynamic-web-design/registry/themes')).filter(f => f.endsWith('.json')).length, ids.length, 'tokens cover every registry theme (run scripts/build.py)');

// the cue vocabulary named in the document is exactly what the sound engine implements, in every palette
const named = [...doc.matchAll(/^\| `([a-z]+)` \| \d+ ms \|/gm)].map(m => m[1]);
assert.deepStrictEqual(named.sort(), [...Sd.CUES].sort(), 'cue vocabulary in the document matches the engine');
Object.keys(Sd.PALETTES).forEach(p => Sd.CUES.forEach(c => assert.strictEqual(typeof Sd.PALETTES[p].cues[c], 'function', p + ' lacks ' + c)));
assert.deepStrictEqual(Object.keys(Sd.PALETTES).sort(), Object.keys(T.sound.palettes).sort());

// the shared theme setting is documented with its key and attributes
['localStorage', '`theme`', 'data-theme-mode', 'themechange', 'startViewTransition', 'prefers-color-scheme'].forEach(s => assert.ok(doc.includes(s) || s === 'startViewTransition' && doc.includes('document.startViewTransition'), 'doc mentions ' + s));
assert.deepStrictEqual(T.sharedThemeKey.values, ['light', 'dark', 'auto']);

// the control symbols: no two controls share a shape
const svgOf = id => (page.match(new RegExp('id="dw-' + id + '"[\\s\\S]*?</svg>')) || [''])[0];
assert.ok(!/M19\.5 14\.5A8/.test(svgOf('quiet')), 'Quiet is not a moon');
assert.ok(/M8 12h8/.test(svgOf('quiet')) && /M4 20 20 4/.test(svgOf('fx')) && /M4 20 20 4/.test(svgOf('sound')), 'quiet bar, effects slash, sound slash');
assert.ok(!/<circle[^>]*r="3\.2"/.test(svgOf('fx')), 'Effects is not a sun');

// guide helpers
const th = { a: { title: 'Alpha', summary: 'warm paper', motion: { personality: 'calm', transition: 'wipe' }, sound: { palette: 'paper' } }, b: { title: 'Beta', summary: 'steel', motion: { personality: 'heavy', transition: 'door' }, sound: { palette: 'metal' } } };
assert.deepStrictEqual(G.filterThemes(th, 'PAPER'), ['a']); assert.deepStrictEqual(G.filterThemes(th, '', 'metal'), ['b']); assert.deepStrictEqual(G.filterThemes(th, 'zzz'), []);
assert.strictEqual(G.cameraTarget(10, 640, 1280), 0); assert.strictEqual(G.cameraTarget(1270, 640, 1280), 640);
const w = G.walk(1279, 1, 1, 10, 30, 1250); assert.deepStrictEqual(w, { x: 1250, dir: -1 });
assert.strictEqual(G.sampleMode('page', 'dark'), 'dark'); assert.strictEqual(G.sampleMode('light', 'dark'), 'light');

// the conformance audit covers every page and is embedded in the document
const conf = JSON.parse(read('docs/conformance.json'));
assert.strictEqual(conf.pages.length, 11);
conf.pages.forEach(p => { assert.ok(doc.includes('| ' + p.name + ' |'), p.name + ' row in the document'); assert.ok(['yes', 'wip', 'no'].includes(p.status.themeKey)); });
console.log('ok: design language');
