/* Motion demos: duration and easing race, the transition stage, the shared-element move, ambient fields. All animate transform, opacity
   or clip-path, run on the kit's loop where they need one, and respect the gate (DW.motion.allowed()). */
(function (root) {
  'use strict';
  var DW = root.DW, DL = root.DL = root.DL || {}, el = DW.ui.el;
  var DURS = [['--dur-instant', 'instant 80'], ['--dur-fast', 'fast 160'], ['--dur-base', 'base 280'], ['--dur-slow', 'slow 520'], ['--dur-scene', 'scene 900']];

  function race() {
    var ul = document.getElementById('race'), pick = document.getElementById('ease-pick'), go = document.getElementById('race-go'), lanes = [], on = false;
    DURS.forEach(function (d) {
      var li = el('li'), dot = el('i', { 'aria-hidden': 'true' }); li.appendChild(el('span', { class: 'lane-l' }, d[1] + ' ms')); var track = el('span', { class: 'track' }); track.appendChild(dot); li.appendChild(track); ul.appendChild(li); lanes.push({ dot: dot, v: d[0] });
    });
    function run() {
      on = !on; var e = pick.value.charAt(0) === '-' ? 'var(' + pick.value + ')' : pick.value;
      lanes.forEach(function (l) { l.dot.style.transition = 'transform var(' + l.v + ') ' + e; l.dot.style.transform = on ? 'translate3d(var(--run, 280px),0,0)' : 'translate3d(0,0,0)'; });
      if (DW.sound) DW.sound.play('click');
    }
    ul.style.setProperty('--run', '0px');
    function size() { var w = ul.querySelector('.track').clientWidth - 22; ul.style.setProperty('--run', Math.max(40, w) + 'px'); }
    size(); root.addEventListener('resize', size, { passive: true });
    go.addEventListener('click', run); pick.addEventListener('change', run);
  }

  /* The stage reuses the kit's keyframes (DW.transitions._KINDS) inside a box instead of over the whole screen. */
  function stageRun(stage, scene, kind, done) {
    var K = DW.transitions._KINDS[kind]; if (!K) return;
    var allowed = DW.motion.allowed() && Element.prototype.animate, n = +scene.getAttribute('data-n') + 1;
    function swap() { scene.setAttribute('data-n', n); scene.firstChild.textContent = 'Scene ' + String.fromCharCode(65 + n % 26); scene.lastChild.textContent = 'after ' + kind + ' (' + n + ')'; }
    if (!allowed) { swap(); if (done) done(); return; }
    var r = stage.getBoundingClientRect(), cfg = { x: r.width / 2, y: r.height / 2 }, panels = [];
    for (var i = 0; i < K.panels; i++) { var p = el('div', { class: 'tx-panel' + (K.cls ? ' ' + K.cls : ''), 'aria-hidden': 'true' }); if (K.panels === 2) p.style.inset = i === 0 ? '0 50% 0 0' : '0 0 0 50%'; stage.appendChild(p); panels.push(p); }
    var half = 380, ease = K.stepped ? 'steps(5, end)' : 'cubic-bezier(.2,.7,.2,1)';
    function play(frames) { return Promise.all(panels.map(function (p, j) { return p.animate(frames[j], { duration: half, easing: ease, fill: 'forwards' }).finished.catch(function () {}); })); }
    if (DW.sound) DW.sound.play('whoosh');
    play(K.cover(cfg)).then(function () { swap(); if (DW.sound) DW.sound.play('reveal'); return play(K.uncover(cfg)); }).then(function () { panels.forEach(function (p) { p.remove(); }); if (done) done(); });
  }
  DL.stageRun = stageRun;

  function transitions() {
    var host = document.getElementById('tx-buttons'), stage = document.getElementById('tx-stage'), scene = document.getElementById('tx-scene'), busy = false;
    DL_DATA.transitions.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'dw-btn ghost', 'data-snd': 'none' }, k);
      b.addEventListener('click', function () { if (busy) return; busy = true; stageRun(stage, scene, k, function () { busy = false; }); });
      host.appendChild(b);
    });
  }

  function flip() {
    var box = document.getElementById('flip'), open = null;
    box.addEventListener('click', function (e) {
      var t = e.target.closest('.flip-tile'); if (!t) return;
      var was = box.classList.contains('open');
      DW.transitions.flip(t, function () { box.classList.toggle('open', !was); t.classList.toggle('big', !was); [].forEach.call(box.children, function (c) { if (c !== t) c.hidden = !was; }); t.textContent = was ? 'Tile ' + ['one', 'two', 'three'][+t.getAttribute('data-i')] : 'Detail view. Press again to go back.'; });
      if (DW.sound) DW.sound.play(was ? 'close' : 'open');
    });
  }

  function fields() {
    var host = document.getElementById('fields'), small = root.innerWidth < 700;
    Object.keys(DW.motion.pure.KINDS).forEach(function (kind) {
      var wrap = el('figure', { class: 'field-fig' }), cv = el('canvas', { 'aria-hidden': 'true' }), cap = el('figcaption', {}, kind);
      wrap.appendChild(cv); wrap.appendChild(cap); host.appendChild(wrap);
      var F = DW.motion.pure.createField({ kind: kind, cap: small ? 14 : 28, seed: 11 }), ctx = cv.getContext('2d'), w = 0, h = 0, p = { x: 0, y: 0, on: false }, color = '#888';
      function size() { var dpr = Math.min(root.devicePixelRatio || 1, 1.5); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); F.fill(w, h); }
      function paint() { var v = getComputedStyle(document.documentElement).getPropertyValue(F.K.color).trim(); if (v) color = v; }
      size(); paint(); root.addEventListener('resize', size, { passive: true }); root.addEventListener('themechange', paint);
      cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top; p.on = true; DW.motion.wake(); });
      cv.addEventListener('pointerleave', function () { p.on = false; });
      DW.motion.ticker({ name: 'demo-field', el: cv, fx: true, fn: function (dt) {
        F.step(dt, w, h, p); ctx.clearRect(0, 0, w, h); ctx.fillStyle = color;
        F.list.forEach(function (q) { ctx.globalAlpha = F.alpha(q); ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 1.4, 0, 6.2832); ctx.fill(); }); ctx.globalAlpha = 1;
      } });
    });
  }

  DL.initMotion = function () { race(); transitions(); flip(); fields(); };
  var DL_DATA = root.DL_DATA;
})(window);
