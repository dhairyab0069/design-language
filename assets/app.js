/* Style guide start-up. The page is static HTML (generated from DESIGN-LANGUAGE.md and the tokens), so it reads with no script;
   this file only starts the kit and the live demos. Order: demos first (so reveal finds their elements), then motion, sound, transitions, controls, theme. */
(function (root) {
  'use strict';
  var DW = root.DW, DL = root.DL, C = root.DW_CONFIG || {};
  try {
    DL.initComponents(); DL.initMotion(); DL.initSound(); DL.initThemes();
    DW.motion.init();
    [].forEach.call(document.querySelectorAll('main .prose h3, main .demo, main table'), function (e) { if (!e.hasAttribute('data-reveal')) e.setAttribute('data-reveal', ''); });
    DW.motion.reveal();
    var links = [].slice.call(document.querySelectorAll('#dw-nav a'));
    if ('IntersectionObserver' in root) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
      [].forEach.call(document.querySelectorAll('main section[id]'), function (s) { io.observe(s); });
    }
    if (DW.sound) { DW.sound.setPalette(C.palette || 'soft'); DW.sound.setVolume(C.volume == null ? 1 : C.volume); DW.sound.setPad(!!C.pad); DW.sound.autowire(); }
    DW.transitions.autowire(); DW.ui.modals(); DW.controls.init(); DW.theme.init();
  } catch (e) {
    var m = document.getElementById('main'); var p = document.createElement('p'); p.className = 'wrap section'; p.textContent = 'Something went wrong starting the live demos. The page and the text version still work.'; m.insertBefore(p, m.firstChild);
    if (root.console) console.error(e);
  }
})(window);
