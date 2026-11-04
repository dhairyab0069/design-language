/* Component gallery demos and the small live readouts (colour roles, theme state, control state). Content is set with textContent only. */
(function (root) {
  'use strict';
  var DW = root.DW, DL = root.DL = root.DL || {}, el = DW.ui.el, D = root.DL_DATA, P = DL.pure, html = document.documentElement;
  var ROLES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--accent', '--accent-text', '--accent-ink', '--accent-soft', '--accent-2', '--focus', '--ok', '--warn', '--danger'];

  function swatches() {
    var ul = document.getElementById('swatches');
    ROLES.forEach(function (r) { var li = el('li'), i = el('i', { 'aria-hidden': 'true' }), s = el('span'), c = el('code'); i.style.background = 'var(' + r + ')'; li.appendChild(i); s.textContent = r; li.appendChild(s); li.appendChild(c); ul.appendChild(li); });
    function paint() { var cs = getComputedStyle(html); [].forEach.call(ul.children, function (li, k) { li.lastChild.textContent = cs.getPropertyValue(ROLES[k]).trim(); }); }
    paint(); root.addEventListener('themechange', paint);
  }

  function themeReadout() {
    var box = document.getElementById('theme-readout'), n = 0, mq = root.matchMedia('(prefers-color-scheme: dark)');
    function set(k, v) { box.querySelector('[data-r=' + k + ']').textContent = v; }
    function paint() { var v = null; try { v = localStorage.getItem('theme'); } catch (e) { v = 'blocked'; } set('key', v === null ? 'absent (means auto)' : v); set('mode', html.getAttribute('data-theme-mode')); set('theme', html.getAttribute('data-theme')); set('sys', mq.matches ? 'dark' : 'light'); set('events', String(n)); }
    root.addEventListener('themechange', function () { n++; paint(); }); root.addEventListener('storage', function () { setTimeout(paint, 30); }); paint();
    var big = document.getElementById('theme-big');
    function mark() { [].forEach.call(big.children, function (b) { var on = b.getAttribute('data-m') === html.getAttribute('data-theme-mode'); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }); }
    big.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) { DW.theme.setMode(b.getAttribute('data-m')); setTimeout(mark, 0); } });
    big.addEventListener('keydown', function (e) { var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault(); var all = [].slice.call(big.children), n2 = all[(all.indexOf(document.activeElement) + d + 3) % 3]; n2.focus(); DW.theme.setMode(n2.getAttribute('data-m')); setTimeout(mark, 0); });
    root.addEventListener('themechange', mark); mark();
  }

  var SPEC = {
    sound: ['<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/>', '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>', '<path d="M4 20 20 4"/>', 'Sound', 'speaker: waves on, slash off'],
    motion: ['', '<path d="M2.5 9c2-2.6 3.5-2.6 5.5 0s3.5 2.6 5.5 0 3.5-2.6 5.5 0M2.5 15c2-2.6 3.5-2.6 5.5 0s3.5 2.6 5.5 0 3.5-2.6 5.5 0"/>', '<path d="M8.5 6.5v11M15.5 6.5v11"/>', 'Motion', 'flowing waves: pause bars off'],
    effects: ['<path d="M11 3.5l1.8 5.1L18 10.4l-5.2 1.8L11 17.3l-1.8-5.1L4 10.4l5.2-1.8z"/>', '<path d="M18.5 15.5v4M16.5 17.5h4M19 3.5v2.5M17.75 4.75h2.5"/>', '<path d="M4 20 20 4"/>', 'Effects', 'sparkle: star with sparkles on, slash off'],
    quiet: ['<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>', '', '', 'Quiet everything', 'circle with a bar (do not disturb)']
  };
  function specimens() {
    var host = document.getElementById('ctl-spec'), rd = document.getElementById('ctl-readout');
    Object.keys(SPEC).forEach(function (k) {
      var S = SPEC[k], row = el('figure', { class: 'spec-row' });
      [['on', true], ['off', false]].forEach(function (st) {
        if (k === 'quiet' && !st[1]) return;
        var b = el('span', { class: 'dw-ico spec', 'data-state': st[0] }); b.setAttribute('aria-hidden', 'true'); b.setAttribute('data-pressed', String(st[1]));
        var inner = S[0] + (st[1] ? S[1] : S[2]);
        b.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';  /* static, trusted strings above */
        row.appendChild(b);
      });
      row.appendChild(el('figcaption', {}, S[3] + ': ' + S[4])); host.appendChild(row);
    });
    var row2 = el('figure', { class: 'spec-row' });
    [['sun', '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>'], ['moon', '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'], ['half', '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>']].forEach(function (x) {
      var b = el('span', { class: 'dw-ico spec', 'data-pressed': 'false' }); b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + x[1] + '</svg>'; row2.appendChild(b);
    });
    row2.appendChild(el('figcaption', {}, 'Theme selector: sun is Light, moon is Dark, half circle is Auto')); host.appendChild(row2);
    host.appendChild(el('p', { class: 'rule' }, 'Rule: no two controls share a shape. The moon is only for Dark and the sun is only for Light, so Quiet is a circle with a bar and Effects is a sparkle.'));
    function paint() { [].forEach.call(rd.querySelectorAll('[data-c]'), function (d) { var b = document.getElementById(d.getAttribute('data-c')); d.textContent = b ? b.getAttribute('aria-label') + ' (aria-pressed ' + b.getAttribute('aria-pressed') + ')' : ''; }); }
    document.querySelector('.dw-controls').addEventListener('click', function () { setTimeout(paint, 20); }); paint();
  }

  function components() {
    DW.ui.chart(document.getElementById('chart-host'), { title: 'Illustrative values, not measurements', summary: 'Bar chart of five illustrative values rising and then falling.', unit: '', illustrative: true, labelHead: 'Step', valueHead: 'Value', rows: [{ label: 'A', value: 3 }, { label: 'B', value: 6 }, { label: 'C', value: 9 }, { label: 'D', value: 7 }, { label: 'E', value: 4 }] });
    DW.ui.tabs(document.getElementById('tabs-demo'));
    document.getElementById('toast-go').addEventListener('click', function () { DW.ui.toast('Saved. This is a toast with the success cue.', 'success'); });
    document.getElementById('error-go').addEventListener('click', function () { DW.ui.toast('Something did not work. Errors are low and short.', 'error'); });
    document.getElementById('cards-replay').addEventListener('click', function () {
      var cs = [].slice.call(document.querySelectorAll('#cards-demo [data-reveal]')); cs.forEach(function (c) { c.classList.remove('is-in'); }); setTimeout(function () { cs.forEach(function (c) { c.classList.add('is-in'); }); if (DW.sound) DW.sound.play('reveal'); }, 40);
    });
    document.getElementById('stagger-go').addEventListener('click', function () { document.getElementById('cards-replay').click(); var cs = [].slice.call(document.querySelectorAll('#stagger [data-reveal]')); cs.forEach(function (c) { c.classList.remove('is-in'); }); setTimeout(function () { cs.forEach(function (c) { c.classList.add('is-in'); }); }, 40); });
  }

  function filters() {
    var q = document.getElementById('q'), chips = document.getElementById('chips'), list = document.getElementById('filter-list'), count = document.getElementById('q-count'), pal = '';
    var all = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', 'data-p': '', 'data-snd': 'none' }, 'all'); chips.appendChild(all);
    Object.keys(D.sound.palettes).forEach(function (p) { chips.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', 'data-p': p, 'data-snd': 'none' }, p)); });
    function draw() {
      var ids = P.filterThemes(D.themes, q.value, pal); list.textContent = '';
      ids.forEach(function (id) { var li = el('li'); li.appendChild(el('b', {}, id)); li.appendChild(el('span', {}, ' ' + D.themes[id].sound.palette + ', ' + D.themes[id].motion.transition + '. ' + D.themes[id].summary)); list.appendChild(li); });
      count.textContent = ids.length + ' of ' + Object.keys(D.themes).length + ' themes';
    }
    q.addEventListener('input', draw);
    chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; pal = b.getAttribute('data-p'); [].forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); }); draw(); if (DW.sound) DW.sound.play('click'); });
    draw();
  }

  function town() {
    var view = document.getElementById('town'), world = document.getElementById('town-world'), walker = document.getElementById('walker'), still = document.getElementById('town-still');
    var W = 1280, VW = 640, wx = 60, dir = 1, cam = 0, stillOn = false, held = 0, last = 0;
    root.addEventListener('keydown', function (e) { if (document.activeElement !== view) return; if (e.key === 'ArrowRight') { held = 1; e.preventDefault(); } if (e.key === 'ArrowLeft') { held = -1; e.preventDefault(); } });
    root.addEventListener('keyup', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') held = 0; });
    still.addEventListener('click', function () { stillOn = !stillOn; still.setAttribute('aria-pressed', String(stillOn)); still.textContent = 'Still: ' + (stillOn ? 'on' : 'off'); });
    DW.motion.ticker({ name: 'demo-town', el: view, fx: true, fn: function (dt) {
      if (stillOn) return; var s = held ? P.walk(wx, held, dt, 90, 30, W - 30) : P.walk(wx, dir, dt, 40, 30, W - 30); wx = s.x; if (!held) dir = s.dir;
      cam = P.smooth(cam, P.cameraTarget(wx, VW, W), dt, 3);
      walker.setAttribute('cx', wx.toFixed(1)); world.style.transform = 'translate3d(' + (-cam).toFixed(1) + 'px,0,0)';
    } });
  }

  DL.initComponents = function () { swatches(); themeReadout(); specimens(); components(); filters(); town(); };
})(window);
