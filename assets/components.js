/* DW.ui: behaviour for the components (tabs, modal, toast, chart). Content is built with textContent only (no innerHTML from data). */
(function (root) {
  'use strict';
  var DW = root.DW = root.DW || {};
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text; return e;
  }
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }

  /* Pure: bar geometry for a chart of values in a w x h box. */
  function barLayout(values, w, h, pad) {
    var max = Math.max.apply(null, values.concat([1])), n = values.length, slot = (w - pad * 2) / Math.max(1, n), bw = slot * 0.62;
    return values.map(function (v, i) { var bh = (h - pad * 2) * (v / max); return { x: pad + slot * i + (slot - bw) / 2, y: h - pad - bh, w: bw, h: bh }; });
  }

  /* Tabs: roving tabindex, arrow/Home/End keys. root has [role=tablist] with [role=tab] and sibling [role=tabpanel]s (aria-controls). */
  function tabs(scope) {
    var list = scope.querySelector('[role="tablist"]'), tabsEls = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(t, focus) {
      tabsEls.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      if (focus) t.focus();
    }
    tabsEls.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabsEls.length - 1 }[e.key];
        if (j == null) return; e.preventDefault(); select(tabsEls[(j + tabsEls.length) % tabsEls.length], true);
      });
    });
    select(tabsEls.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabsEls[0], false);
  }

  /* Modal: a native <dialog class="dw-modal">; opener buttons carry data-modal="id". Plays open/close cues. */
  function modals() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-modal]'); if (b) { var d = document.getElementById(b.getAttribute('data-modal')); if (d && d.showModal) { d.showModal(); DW.sound && DW.sound.play('open'); } }
      var c = e.target.closest && e.target.closest('[data-close]'); if (c) { var m = c.closest('dialog'); if (m) { m.close(); DW.sound && DW.sound.play('close'); } }
    });
  }

  /* Toast: a short status line, announced politely, gone after 3.2 s. */
  function toast(msg, cue) {
    var old = document.querySelector('.dw-toast'); if (old) old.remove();
    var t = el('div', { class: 'dw-toast', role: 'status' }, msg); document.body.appendChild(t);
    DW.sound && DW.sound.play(cue || 'success'); setTimeout(function () { t.remove(); }, 3200);
  }

  /* Chart: bars in an SVG (role=img with a summary label) plus a real table inside <details> for everyone who needs the numbers. */
  function chart(host, data) {
    var W = 560, H = 240, pad = 28, vals = data.rows.map(function (r) { return r.value; }), L = barLayout(vals, W, H, pad);
    var fig = el('figure', { class: 'dw-chart', 'data-reveal': '' }), s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': data.summary || data.title });
    L.forEach(function (b, i) {
      var r = svg('rect', { class: 'bar', x: b.x.toFixed(1), y: b.y.toFixed(1), width: b.w.toFixed(1), height: Math.max(0, b.h).toFixed(1), rx: 3, style: '--i:' + i }); s.appendChild(r);
      var t = svg('text', { x: (b.x + b.w / 2).toFixed(1), y: H - 8, 'text-anchor': 'middle' }); t.textContent = data.rows[i].label; s.appendChild(t);
    });
    fig.appendChild(s);
    var cap = el('figcaption', { class: 'muted' }, data.title); fig.appendChild(cap);
    var det = el('details'), sum = el('summary', {}, 'Show the numbers as a table'), tb = el('table'), th = el('tr');
    [data.labelHead || 'Item', data.valueHead || 'Value'].forEach(function (h) { th.appendChild(el('th', { scope: 'col' }, h)); }); tb.appendChild(th);
    data.rows.forEach(function (r) { var tr = el('tr'); tr.appendChild(el('th', { scope: 'row' }, r.label)); tr.appendChild(el('td', {}, String(r.value) + (data.unit || ''))); tb.appendChild(tr); });
    det.appendChild(sum); det.appendChild(tb); fig.appendChild(det); host.appendChild(fig);
    if (DW.motion && 'IntersectionObserver' in root) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fig.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.3 }); io.observe(fig); } else fig.classList.add('is-in');
  }
  DW.ui = { el: el, tabs: tabs, modals: modals, toast: toast, chart: chart, barLayout: barLayout };
  if (typeof module !== 'undefined' && module.exports) module.exports = { barLayout: barLayout };
})(typeof window !== 'undefined' ? window : globalThis);
