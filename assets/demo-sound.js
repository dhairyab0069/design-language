/* Sound demo: every cue of every palette is playable with the same engine the pages use (DW.sound). The page's own palette is restored after each cue.
   Demo buttons carry data-snd="none" so the page's automatic click cue does not double up. */
(function (root) {
  'use strict';
  var DW = root.DW, DL = root.DL = root.DL || {}, el = DW.ui.el, D = root.DL_DATA, home = (root.DW_CONFIG || {}).palette || 'soft';
  var status;
  function say(t) { if (status) status.textContent = t; }
  /* Play one cue of one palette. The context is created on the first gesture; if it is not running yet, retry once. */
  function play(pal, cue) {
    if (!DW.sound.enabled) { say('Sound is off. Press the speaker in the header to turn it on, then try again.'); return false; }
    DW.sound.unlock();
    var go = function () { DW.sound.setPalette(pal); DW.sound.play(cue); DW.sound.setPalette(home); };
    if (DW.sound.unlocked) go(); else setTimeout(go, 90);
    say('Playing ' + pal + ' ' + cue + '.');
    return true;
  }
  function init() {
    status = document.getElementById('snd-status'); var host = document.getElementById('palettes');
    Object.keys(D.sound.palettes).forEach(function (pal) {
      var box = el('div', { class: 'pal' }), head = el('h4', {}, D.sound.palettes[pal].label + (D.sound.palettes[pal].pad ? ' (has a quiet pad)' : '')), row = el('div', { class: 'cues', role: 'group', 'aria-label': D.sound.palettes[pal].label + ' cues' });
      D.sound.cues.forEach(function (c) { var b = el('button', { type: 'button', class: 'cue', 'data-snd': 'none' }, c); b.addEventListener('click', function () { play(pal, c); }); row.appendChild(b); });
      box.appendChild(head); box.appendChild(row); host.appendChild(box);
    });
    function seq(list, gap) { var i = 0; (function next() { if (i >= list.length) return; var it = list[i++]; if (!play(it[0], it[1])) return; setTimeout(next, gap); })(); }
    document.getElementById('play-all').addEventListener('click', function () { seq(D.sound.cues.map(function (c) { return [home, c]; }), 520); });
    document.getElementById('compare').addEventListener('click', function () { seq(Object.keys(D.sound.palettes).map(function (p) { return [p, 'click']; }), 520); });
    DL.playCue = play;
  }
  DL.initSound = init;
})(window);
