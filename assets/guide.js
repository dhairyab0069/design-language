/* Pure helpers for the style guide demos (no DOM), exported for node tests. The demos in demo-*.js call these. */
(function (root) {
  'use strict';
  /* Which themes match a search text and an optional sound palette? Matches id, title, summary and personality, case-insensitive. */
  function filterThemes(themes, q, palette) {
    q = String(q || '').trim().toLowerCase();
    return Object.keys(themes).filter(function (id) {
      var t = themes[id];
      if (palette && t.sound.palette !== palette) return false;
      if (!q) return true;
      return [id, t.title, t.summary, t.motion.personality, t.sound.palette, t.motion.transition].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  /* The camera follows the walker with frame-rate independent smoothing and never leaves the world. */
  function cameraTarget(walkerX, viewW, worldW) { return Math.max(0, Math.min(worldW - viewW, walkerX - viewW / 2)); }
  function smooth(cur, target, dt, k) { return target + (cur - target) * Math.exp(-k * dt); }
  /* The walker patrols one road: bounces at both ends. Returns {x, dir}. */
  function walk(x, dir, dt, speed, min, max) {
    x += dir * speed * dt;
    if (x >= max) { x = max; dir = -1; } else if (x <= min) { x = min; dir = 1; }
    return { x: x, dir: dir };
  }
  /* Resolve which colours a gallery sample shows: follow the page, or force light or dark. */
  function sampleMode(choice, pageTheme) { return choice === 'light' || choice === 'dark' ? choice : pageTheme === 'dark' ? 'dark' : 'light'; }
  function ratioClass(r, min) { return r >= min ? 'ok' : 'bad'; }
  var api = { filterThemes: filterThemes, cameraTarget: cameraTarget, smooth: smooth, walk: walk, sampleMode: sampleMode, ratioClass: ratioClass };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.DL = root.DL || {}; root.DL.pure = api;
})(typeof window !== 'undefined' ? window : globalThis);
