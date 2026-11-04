/* Tests for real logic only: the kit's pure helpers, every palette having every cue, and the non-negotiables audit. Run: node tests/site.test.js */
const assert = require('assert'), path = require('path');
const root = path.join(__dirname, '..'), A = f => require(path.join(root, 'assets', f));
const M = A('motion.js'), Sd = A('sound.js'), Ctl = A('controls.js'), U = A('components.js'), Th = A('theme.js');

assert.strictEqual(M.motionAllowed({ enabled: true, reduced: false, hidden: false }), true);
assert.strictEqual(M.motionAllowed({ enabled: true, reduced: true, hidden: false }), false);   // the system wins
assert.strictEqual(M.motionAllowed({ enabled: false, reduced: false, hidden: false }), false);
assert.strictEqual(M.motionAllowed({ enabled: true, reduced: false, hidden: true }), false);
assert.ok(Math.abs(M.ease('outCubic', 1) - 1) < 1e-9 && M.ease('outCubic', 0) === 0);
const F = M.createField({ kind: 'embers', cap: 10, seed: 3 }); F.fill(400, 300, 99);
for (let i = 0; i < 600; i++) F.step(0.016, 400, 300, null);
assert.ok(F.list.length <= 10, 'particle cap holds');

assert.deepStrictEqual(Ctl.resolveDefaults({}, false), { sound: true, motion: true, fx: true });  // defaults ON
assert.strictEqual(Ctl.resolveDefaults({}, true).motion, false);                                  // reduced motion starts off
const q1 = Ctl.quietStep({ sound: true, motion: true, fx: true }, null, false);
assert.deepStrictEqual(q1.next, { sound: false, motion: false, fx: false });
assert.deepStrictEqual(Ctl.quietStep(q1.next, q1.prev, false).next, { sound: true, motion: true, fx: true });

Object.keys(Sd.PALETTES).forEach(name => Sd.CUES.forEach(cue => {
  const rec = [], S = Sd.derive({ tone: o => rec.push(o), hiss: o => rec.push(o), R: (a, b) => (a + b) / 2 });
  assert.ok(Sd.PALETTES[name].cues[cue], name + ' lacks cue ' + cue);
  Sd.PALETTES[name].cues[cue](S);
  assert.ok(rec.length >= 1 && rec.length <= 40, name + '.' + cue + ' voice count');
  rec.forEach(o => assert.ok((o.gain || 0.04) <= 0.08, name + '.' + cue + ' too loud'));
}));
assert.strictEqual(Th.normalize(null), 'auto'); assert.strictEqual(Th.normalize('purple'), 'auto');   // absent or junk means auto
assert.strictEqual(Th.resolve('auto', true), 'dark'); assert.strictEqual(Th.resolve('light', true), 'light');
assert.strictEqual(Th.visibleChange('light', 'auto', false), false);   // auto to light while the system is light: no transition
assert.strictEqual(U.barLayout([1, 2], 100, 100, 10).length, 2);

const { audit } = require('./audit.js'), r = audit(root);
r.results.filter(x => x.level !== 'pass').forEach(x => console.log(x.level.toUpperCase() + ': ' + x.msg));
assert.strictEqual(r.errors, 0, 'audit errors');
console.log('ok');
