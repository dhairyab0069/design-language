/* Theme gallery: pick one of the twelve themes and show it in light, dark or following the page. The sample re-themes through the generated
   tokens/tokens.css (data-dl-theme, data-dl-mode); nothing is painted by hand here. Both token sets are always shown side by side. */
(function (root) {
  'use strict';
  var DW = root.DW, DL = root.DL = root.DL || {}, el = DW.ui.el, D = root.DL_DATA, P = DL.pure;
  var cur = 'workshop', mode = 'page', sample, info, pair;
  var ROLES = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--accent', '--accent-text', '--accent-ink', '--accent-soft', '--accent-2', '--focus'];

  function strip(set) {
    var ul = el('ul', { class: 'strip' });
    ROLES.forEach(function (r) { if (!set[r]) return; var li = el('li', { title: r + ' ' + set[r] }); var s = el('i', { 'aria-hidden': 'true' }); s.style.background = set[r]; li.appendChild(s); li.appendChild(el('span', {}, r.slice(2))); ul.appendChild(li); });
    return ul;
  }
  function ratios(t, m) {
    var tb = el('table', { class: 'mini' }); tb.appendChild(el('caption', { class: 'sr-only' }, 'Contrast ratios, ' + m));
    t.contrast[m].forEach(function (r) { var tr = el('tr'); tr.appendChild(el('th', { scope: 'row' }, r.pair)); tr.appendChild(el('td', { class: P.ratioClass(r.ratio, r.min) }, r.ratio + ' to 1')); tb.appendChild(tr); });
    return tb;
  }
  function render() {
    var t = D.themes[cur], shown = P.sampleMode(mode, document.documentElement.getAttribute('data-theme'));
    sample.setAttribute('data-dl-theme', cur);
    if (mode === 'page') sample.removeAttribute('data-dl-mode'); else sample.setAttribute('data-dl-mode', mode);
    document.getElementById('s-title').textContent = t.title; document.getElementById('s-h').textContent = t.title + ', ' + shown;
    info.textContent = '';
    [['Feel', t.summary], ['Motion personality', t.motion.personality], ['Transition, reveal, ambient', t.motion.transition + ', ' + t.motion.reveal + ', ' + t.motion.ambient], ['Easing', t.motion.ease],
     ['Sound', D.sound.palettes[t.sound.palette].label + ', volume ' + t.sound.volume + (t.sound.pad ? ', with a pad' : '')], ['Signature', t.signature.join('; ')], ['Avoid', t.avoid.join('; ')], ['Designed first', t.designedFirst]].forEach(function (r) {
      var d = el('div'); d.appendChild(el('dt', {}, r[0])); d.appendChild(el('dd', {}, r[1])); info.appendChild(d);
    });
    pair.textContent = '';
    ['light', 'dark'].forEach(function (m) {
      var box = el('div', { class: 'pair-box' + (m === shown ? ' now' : '') }); box.appendChild(el('h5', {}, (m === 'light' ? 'Light' : 'Dark') + (m === shown ? ' (showing)' : ''))); box.appendChild(strip(t[m])); box.appendChild(ratios(t, m)); pair.appendChild(box);
    });
  }
  function radio(group, onPick) {
    group.addEventListener('click', function (e) { var b = e.target.closest('[role=radio]'); if (b) onPick(b); });
    group.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; var all = [].slice.call(group.querySelectorAll('[role=radio]')), i = all.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); var n = all[(i + d + all.length) % all.length]; n.focus(); onPick(n);
    });
  }
  function check(group, b) { [].forEach.call(group.querySelectorAll('[role=radio]'), function (x) { var on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; }); }
  function init() {
    sample = document.getElementById('tg-sample'); info = document.getElementById('tg-info'); pair = document.getElementById('tg-pair');
    var tg = document.getElementById('tg-themes'), md = document.getElementById('tg-mode');
    Object.keys(D.themes).forEach(function (id) { var b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(id === cur), tabindex: id === cur ? '0' : '-1', 'data-snd': 'none' }, id); tg.appendChild(b); });
    [].forEach.call(md.querySelectorAll('[role=radio]'), function (b) { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    radio(tg, function (b) { cur = b.textContent; check(tg, b); render(); if (DW.sound) DW.sound.play('click'); });
    radio(md, function (b) { mode = b.getAttribute('data-mode'); check(md, b); render(); if (DW.sound) DW.sound.play('reveal'); });
    root.addEventListener('themechange', render);
    document.getElementById('tg-cue').addEventListener('click', function () { var pal = D.themes[cur].sound.palette; ['click', 'open', 'success'].forEach(function (c, i) { setTimeout(function () { DL.playCue(pal, c); }, i * 450); }); });
    var stage = document.getElementById('tg-stage'), scene = document.getElementById('tg-scene'), busy = false;
    document.getElementById('tg-tx').addEventListener('click', function () {
      if (busy) return; busy = true; stage.setAttribute('data-dl-theme', cur); if (mode === 'page') stage.removeAttribute('data-dl-mode'); else stage.setAttribute('data-dl-mode', mode);
      DL.stageRun(stage, scene, D.themes[cur].motion.transition === 'stepped' ? 'dither' : D.themes[cur].motion.transition, function () { busy = false; });
    });
    render();
  }
  DL.initThemes = init;
})(window);
