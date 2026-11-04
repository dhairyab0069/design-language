/* DW.theme: light / dark / auto, one setting shared by every page on the same origin.
   Protocol: localStorage key "theme" ('light' | 'dark' | 'auto'; absent = auto). The inline script in <head> (theme-early.html)
   has already set data-theme-mode (the choice) and data-theme (what shows) on <html> before paint; this module wires the
   three-way radiogroup, persists changes, follows the system while in auto, follows other tabs and pages through the
   `storage` event, and dispatches `themechange` ({detail: {mode, theme}}) on window. Anything that caches colours
   (canvases, charts) must re-read its tokens on `themechange`. Changes animate with a View Transition circle reveal from the
   control (crossfade where unsupported) and a soft cue, and apply instantly when motion is off or reduced. */
(function (root) {
  'use strict';
  var KEY = 'theme', MODES = ['light', 'dark', 'auto'];
  function normalize(v) { return MODES.indexOf(v) >= 0 ? v : 'auto'; }
  function resolve(mode, systemDark) { return mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode; }
  /* Does choosing `next` change what is visible? (auto to light while the system is already light does not.) */
  function visibleChange(curTheme, next, systemDark) { return resolve(next, systemDark) !== curTheme; }
  var pure = { KEY: KEY, MODES: MODES, normalize: normalize, resolve: resolve, visibleChange: visibleChange };
  if (typeof module !== 'undefined' && module.exports) { module.exports = pure; return; }

  var DW = root.DW = root.DW || {}, html = document.documentElement;
  var mq = root.matchMedia ? root.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var mode = normalize(html.getAttribute('data-theme-mode')), theme = html.getAttribute('data-theme') || resolve(mode, mq.matches), sw = null;
  var DUR = 700;

  function paint() {
    html.setAttribute('data-theme-mode', mode); html.setAttribute('data-theme', theme); html.style.colorScheme = theme;
    if (sw) [].forEach.call(sw.querySelectorAll('[data-theme-mode]'), function (b) { var on = b.getAttribute('data-theme-mode') === mode; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    var m = document.querySelector('meta[name="theme-color"]'); var bg = getComputedStyle(html).getPropertyValue('--bg').trim(); if (m && bg) m.setAttribute('content', bg);
    root.dispatchEvent(new CustomEvent('themechange', { detail: { mode: mode, theme: theme } }));
  }
  function animated() { return !!(DW.motion && DW.motion.allowed()); }
  /* commit() changes the attributes; wrap it in the transition. */
  function transition(commit, origin) {
    if (!animated()) { commit(); return; }
    if (DW.sound) DW.sound.play('reveal');
    if (document.startViewTransition) {
      var r = (origin || sw || document.body).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, root.innerWidth - x), Math.max(y, root.innerHeight - y)) + 40;
      var vt = document.startViewTransition(commit);
      vt.ready.then(function () {
        html.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: DUR, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
      return;
    }
    html.classList.add('dw-theme-fade'); commit(); setTimeout(function () { html.classList.remove('dw-theme-fade'); }, DUR);
  }
  function setMode(next, origin, fromStorage) {
    next = normalize(next); if (next === mode) return;
    mode = next;
    if (!fromStorage) { try { localStorage.setItem('theme', mode); } catch (e) { /* storage blocked: still applies for this page */ } }
    var nt = resolve(mode, mq.matches);
    if (nt === theme) { paint(); return; }
    transition(function () { theme = nt; paint(); }, origin);
  }
  function init() {
    sw = document.querySelector('.dw-theme-switch'); paint(); setTimeout(function () { html.classList.add('dw-ready'); }, 60);   /* no fade-in of the first state */
    if (sw) {
      sw.addEventListener('click', function (e) { var b = e.target.closest('[data-theme-mode]'); if (b) setMode(b.getAttribute('data-theme-mode'), b); });
      sw.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!step) return;
        var all = [].slice.call(sw.querySelectorAll('[data-theme-mode]')), n = all[(all.indexOf(document.activeElement) + step + all.length) % all.length];
        e.preventDefault(); n.focus(); setMode(n.getAttribute('data-theme-mode'), n);
      });
    }
    /* In auto, follow the system. */
    var onSys = function () { if (mode !== 'auto') return; var nt = resolve('auto', mq.matches); if (nt !== theme) transition(function () { theme = nt; paint(); }, sw && sw.querySelector('[data-theme-mode="auto"]')); };
    if (mq.addEventListener) mq.addEventListener('change', onSys);
    /* Another page or tab on this origin changed the shared key. */
    root.addEventListener('storage', function (e) {
      if (e.key !== KEY && e.key !== null) return;
      var v = null; try { v = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
      var next = normalize(v); if (next === mode) return;
      mode = next; var nt = resolve(mode, mq.matches);
      if (nt === theme) paint(); else transition(function () { theme = nt; paint(); });
    });
  }
  DW.theme = { pure: pure, init: init, setMode: function (m) { setMode(m, null); }, get mode() { return mode; }, get theme() { return theme; } };
})(typeof window !== 'undefined' ? window : globalThis);
