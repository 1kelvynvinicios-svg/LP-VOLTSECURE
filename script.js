/* ==========================================================================
   VoltSecure — interações
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------- Menu mobile */
  var menuButton = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('#main-nav');

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      var isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      if (navigation) navigation.classList.toggle('is-open', !isOpen);
    });
  }
  if (navigation) {
    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (menuButton) {
          menuButton.setAttribute('aria-expanded', 'false');
          menuButton.setAttribute('aria-label', 'Abrir menu');
        }
        navigation.classList.remove('is-open');
      });
    });
  }

  /* ----------------------------------------------------------------- Ano no rodapé */
  var year = document.querySelector('#current-year');
  if (year) year.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------- Header: sólido ao rolar */
  var header = document.getElementById('site-header');
  function updateHeader() {
    if (header) header.classList.toggle('is-solid', window.scrollY > 60);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ----------------------------------------------------------------- Reveal no scroll */
  document.body.classList.add('motion-ready');
  var revealItems = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -32px 0px' });
    revealItems.forEach(function (item, index) {
      item.style.setProperty('--reveal-delay', String(Math.min(index % 3, 2) * 90) + 'ms');
      revealObserver.observe(item);
    });
  }

  /* ----------------------------------------------------------------- Barra de progresso */
  var progressFrame = 0;
  function updateScrollProgress() {
    var page = document.documentElement;
    var scrollable = page.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    page.style.setProperty('--scroll-progress', String(progress));
    progressFrame = 0;
  }
  function scheduleScrollProgress() {
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateScrollProgress);
  }
  window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
  window.addEventListener('resize', scheduleScrollProgress, { passive: true });
  updateScrollProgress();

  /* ----------------------------------------------------------------- Easings */
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var backOut = function (t, s) { s = s || 2.2; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ----------------------------------------------------------------- Montagem no scroll (SVG inline) */
  var stage = document.getElementById('hero-stage');
  var stageSvg = document.getElementById('stage-svg');

  // Janela de progresso (p), escala inicial, âncora (coords do viewBox 0..1000) e easing.
  var PIECES = [
    { id: 'g-camera',    start: 0.10, end: 0.40, sx: 0.40, sy: 0.40, ax: 300, ay: 430, rot: -8, ease: easeOutCubic },
    { id: 'g-sensor',    start: 0.20, end: 0.48, sx: 0.30, sy: 0.30, ax: 700, ay: 440, rot: 0,  ease: easeOutCubic },
    { id: 'g-fechadura', start: 0.30, end: 0.56, sx: 0.50, sy: 0.50, ax: 543, ay: 713, rot: 0,  ease: easeOutCubic },
    { id: 'g-alarme',    start: 0.38, end: 0.64, sx: 0.30, sy: 0.30, ax: 335, ay: 582, rot: 0,  ease: function (t) { return backOut(t, 2.4); } },
    { id: 'g-escudo',    start: 0.50, end: 0.80, sx: 0.85, sy: 0.85, ax: 500, ay: 528, rot: 0,  ease: easeInOutCubic }
  ];

  function setupMontage() {
    if (!stage || !stageSvg) return;

    var els = {};
    PIECES.forEach(function (cfg) { els[cfg.id] = document.getElementById(cfg.id); });

    var isStatic = prefersReduced || window.innerWidth <= 980;

    function renderStatic() {
      PIECES.forEach(function (cfg) {
        var el = els[cfg.id];
        if (el) { el.style.opacity = '1'; el.removeAttribute('transform'); }
      });
      stageSvg.style.transform = 'none';
      stage.classList.add('is-protected');
    }

    function render(p) {
      var e = easeInOutCubic(p);
      stageSvg.style.transform = 'scale(' + (1 + 0.2 * e) + ') translateY(' + (-3 * e) + '%)';

      PIECES.forEach(function (cfg) {
        var el = els[cfg.id];
        if (!el) return;
        var local = clamp01((p - cfg.start) / (cfg.end - cfg.start));
        el.style.opacity = String(clamp01(local / 0.08));   // surge rápido nos primeiros 8%
        var te = cfg.ease(local);
        var sxv = cfg.sx + (1 - cfg.sx) * te;
        var syv = cfg.sy + (1 - cfg.sy) * te;
        var rot = cfg.rot ? (cfg.rot * (1 - easeOutCubic(local))) : 0;
        el.setAttribute('transform',
          'translate(' + cfg.ax + ' ' + cfg.ay + ') scale(' + sxv + ' ' + syv + ') rotate(' + rot + ') translate(' + (-cfg.ax) + ' ' + (-cfg.ay) + ')');
      });

      stage.classList.toggle('is-protected', p > 0.78);
    }

    if (isStatic) { renderStatic(); return; }

    document.body.classList.add('js-montage');
    var target = 0, current = 0, raf = 0;

    function compute() {
      var vh = window.innerHeight;
      target = clamp01((window.scrollY - 0.05 * vh) / (0.65 * vh));
      if (!raf) raf = window.requestAnimationFrame(tick);
    }
    function tick() {
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.001) current = target;
      render(current);
      raf = (current !== target) ? window.requestAnimationFrame(tick) : 0;
    }

    render(0);
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 980) {
        document.body.classList.remove('js-montage');
        window.removeEventListener('scroll', compute);
        renderStatic();
      } else {
        compute();
      }
    }, { passive: true });
  }

  setupMontage();

  /* ----------------------------------------------------------------- Partículas de sinal */
  function setupSignalCanvas() {
    var canvas = document.querySelector('.signal-canvas');
    if (!canvas || prefersReduced) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dots = [], dpr = Math.min(window.devicePixelRatio || 1, 2), w = 0, h = 0, running = true, raf = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      dots = [];
      var count = Math.max(26, Math.round(w / 26));
      for (var i = 0; i < count; i++) {
        dots.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + 1, s: Math.random() * 0.3 + 0.12, a: Math.random() * 0.45 + 0.12 });
      }
    }
    function frame() {
      if (!running) { raf = 0; return; }
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.y -= d.s;
        if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52,211,107,' + d.a + ')';
        ctx.fill();
      }
      raf = window.requestAnimationFrame(frame);
    }
    function start() { running = true; if (!raf) raf = window.requestAnimationFrame(frame); }
    function stop() { running = false; }

    resize(); seed(); start();
    window.addEventListener('resize', function () { resize(); seed(); }, { passive: true });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }

  setupSignalCanvas();
})();
