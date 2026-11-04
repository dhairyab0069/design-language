/* DW.transitions: section and page transitions drawn as full-screen cover panels animated with the Web Animations API
   (transform, opacity and clip-path only). Kinds: fade, wipe, iris, slide, zoom, door, curtain, dither.
   Every kind has an instant fallback: if motion is not allowed (control off, reduced motion, hidden tab) or WAAPI is missing,
   the swap runs immediately with no overlay. The swap callback is the only thing that changes the page, so behaviour is identical either way.
   A transition is: cover -> swap() -> uncover. Cues: whoosh at the start, reveal at the end. */
(function (root) {
  'use strict';
  var DW = root.DW = root.DW || {};
  var CLEAR = 'inset(0 0 0 0)';
  /* Each kind: panels (count) and keyframes for cover and uncover, per panel index. x,y in px for the iris centre. */
  var KINDS = {
    fade:    { panels: 1, cover: function () { return [[{ opacity: 0 }, { opacity: 1 }]]; }, uncover: function () { return [[{ opacity: 1 }, { opacity: 0 }]]; } },
    wipe:    { panels: 1, cover: function () { return [[{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: CLEAR }]]; }, uncover: function () { return [[{ clipPath: CLEAR }, { clipPath: 'inset(0 0 0 100%)' }]]; } },
    iris:    { panels: 1, cover: function (o) { return [[{ clipPath: 'circle(0% at ' + o.x + 'px ' + o.y + 'px)' }, { clipPath: 'circle(150% at ' + o.x + 'px ' + o.y + 'px)' }]]; },
               uncover: function (o) { return [[{ clipPath: 'circle(150% at ' + o.x + 'px ' + o.y + 'px)' }, { clipPath: 'circle(0% at ' + o.x + 'px ' + o.y + 'px)' }]]; } },
    slide:   { panels: 1, cover: function () { return [[{ transform: 'translate3d(100%,0,0)' }, { transform: 'translate3d(0,0,0)' }]]; }, uncover: function () { return [[{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-100%,0,0)' }]]; } },
    zoom:    { panels: 1, cover: function () { return [[{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }]]; }, uncover: function () { return [[{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.4)' }]]; } },
    door:    { panels: 2, cover: function () { return [[{ transform: 'translate3d(-100%,0,0)' }, { transform: 'translate3d(0,0,0)' }], [{ transform: 'translate3d(100%,0,0)' }, { transform: 'translate3d(0,0,0)' }]]; },
               uncover: function () { return [[{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-100%,0,0)' }], [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(100%,0,0)' }]]; } },
    curtain: { panels: 1, cover: function () { return [[{ transform: 'translate3d(0,-100%,0)' }, { transform: 'translate3d(0,0,0)' }]]; }, uncover: function () { return [[{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }]]; } },
    dither:  { panels: 1, stepped: true, cls: 'dw-tx-dither', cover: function () { return [[{ opacity: 0 }, { opacity: 1 }]]; }, uncover: function () { return [[{ opacity: 1 }, { opacity: 0 }]]; } }
  };
  var busy = false;

  function canAnimate() { return DW.motion && DW.motion.allowed() && typeof Element !== 'undefined' && !!Element.prototype.animate; }
  function cssVar(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }
  function play(panels, frames, dur, easing) {
    return Promise.all(panels.map(function (p, i) {
      var a = p.animate(frames[i], { duration: dur, easing: easing, fill: 'forwards' });
      return a.finished.catch(function () { /* cancelled */ });
    }));
  }
  function makePanels(K) {
    return Array.from({ length: K.panels }, function (_, i) {
      var d = document.createElement('div'); d.className = 'dw-tx' + (K.cls ? ' ' + K.cls : ''); d.setAttribute('aria-hidden', 'true');
      if (K.panels === 2) { d.style.inset = i === 0 ? '0 50% 0 0' : '0 0 0 50%'; }
      d.style.visibility = 'hidden'; document.body.appendChild(d); return d;
    });
  }

  /* run(kind, {swap, x, y, half, cover}): resolves after the swap and the uncover. Never rejects; a failing swap still uncovers. */
  function run(kind, o) {
    o = o || {}; var swap = o.swap || function () {}, K = KINDS[kind] || KINDS.fade;
    if (busy || !canAnimate() || kind === 'none') { try { swap(); } catch (e) { return Promise.reject(e); } return Promise.resolve(); }
    busy = true;
    var half = o.half || Math.round(parseFloat(cssVar('--dur-scene', '900')) / 2 || 380), easing = K.stepped ? 'steps(5, end)' : cssVar('--ease-standard', 'ease');
    var cfg = { x: o.x == null ? root.innerWidth / 2 : o.x, y: o.y == null ? root.innerHeight / 2 : o.y };
    var panels = makePanels(K);
    panels.forEach(function (p) { p.style.visibility = 'visible'; });
    if (DW.sound) DW.sound.play('whoosh');
    var err = null;
    return play(panels, K.cover(cfg), o.cover == null ? half : o.cover, easing)
      .then(function () { try { return swap(); } catch (e) { err = e; } })
      .then(function () { if (DW.sound) DW.sound.play('reveal'); return play(panels, K.uncover(cfg), half, easing); })
      .then(function () { panels.forEach(function (p) { p.remove(); }); busy = false; if (err) throw err; },
            function (e) { panels.forEach(function (p) { p.remove(); }); busy = false; throw e; });
  }

  /* go(id, kind, evt): section transition to #id, then move focus there so keyboard and screen-reader users arrive too. */
  function go(id, kind, evt) {
    var t = document.getElementById(id); if (!t) return Promise.resolve();
    return run(kind || document.documentElement.getAttribute('data-transition') || 'fade', {
      x: evt && evt.clientX, y: evt && evt.clientY,
      swap: function () {
        var smooth = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = 'auto';
        t.scrollIntoView({ block: 'start' }); document.documentElement.style.scrollBehavior = smooth;
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
        if (history.replaceState) history.replaceState(null, '', '#' + id);
      }
    });
  }

  /* flip(el, change): shared-element helper. Measures el, runs change() (which moves or resizes it), then animates from the old rect. */
  function flip(el, change) {
    var a = el.getBoundingClientRect(); change(); if (!canAnimate()) return Promise.resolve();
    var b = el.getBoundingClientRect(); if (!b.width || !b.height) return Promise.resolve();
    var dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
    return el.animate([{ transformOrigin: '0 0', transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ')' }, { transformOrigin: '0 0', transform: 'none' }],
      { duration: parseFloat(cssVar('--dur-slow', '520')) || 520, easing: cssVar('--ease-standard', 'ease') }).finished.catch(function () {});
  }

  /* Arrival half of a page transition: if the previous page covered the screen, uncover now. */
  var FLAG = 'dw-arrive';
  function arrive() {
    var kind = null; try { kind = sessionStorage.getItem(FLAG); sessionStorage.removeItem(FLAG); } catch (e) { /* no storage */ }
    if (kind && canAnimate()) run(kind, { swap: function () {}, cover: 1 }); /* instant cover, then the normal uncover */
  }
  function navigate(href, kind, evt) {
    if (!canAnimate()) { root.location.href = href; return; }
    run(kind || 'fade', { x: evt && evt.clientX, y: evt && evt.clientY, swap: function () { try { sessionStorage.setItem(FLAG, kind || 'fade'); } catch (e) { /* ignore */ } root.location.href = href; } }).catch(function () {});
  }

  /* autowire: a[data-go] and nav links (#id) get section transitions; a[data-page] gets a page transition. */
  function autowire() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var a = e.target.closest && e.target.closest('a[data-go], a[data-page], .dw-nav a[href^="#"]'); if (!a) return;
      var kind = a.getAttribute('data-tx') || undefined;
      if (a.hasAttribute('data-page')) { e.preventDefault(); navigate(a.href, kind, e); return; }
      var id = (a.getAttribute('href') || '').replace(/^#/, ''); if (!id || !document.getElementById(id)) return;
      e.preventDefault(); go(id, kind, e).catch(function () {});
    });
    arrive();
  }

  DW.transitions = { kinds: Object.keys(KINDS), run: run, go: go, flip: flip, navigate: navigate, autowire: autowire, _KINDS: KINDS };
})(typeof window !== 'undefined' ? window : globalThis);
