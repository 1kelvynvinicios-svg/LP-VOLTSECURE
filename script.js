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

  /* ----------------------------------------------------------------- Hero: ativação no scroll + parallax */
  var stage = document.getElementById('hero-stage');
  var photoWrap = document.getElementById('hero-photo-wrap');
  var pulses = Array.prototype.slice.call(document.querySelectorAll('.pulse'));
  // limiar de scroll (p, 0..1) em que cada dispositivo acende, por data-d:
  // 0 câmera · 1 sensor · 2 alarme · 3 fechadura · 4 escudo
  var DEVICE_AT = [0.10, 0.24, 0.38, 0.52, 0.66];

  function activateAll() {
    pulses.forEach(function (el) { el.classList.add('on'); });
    if (stage) stage.classList.add('is-protected');
    if (photoWrap) photoWrap.style.transform = 'none';
  }

  function setupHero() {
    if (!stage) return;

    if (prefersReduced || window.innerWidth <= 980) { activateAll(); return; }

    var target = 0, current = 0, raf = 0;

    function render(p) {
      var e = easeInOutCubic(clamp01(p));
      if (photoWrap) photoWrap.style.transform = 'scale(' + (1 + 0.07 * e) + ') translateY(' + (-2.4 * e) + '%)';
      pulses.forEach(function (el) {
        var d = parseInt(el.getAttribute('data-d'), 10) || 0;
        el.classList.toggle('on', p >= DEVICE_AT[d]);
      });
      stage.classList.toggle('is-protected', p > 0.6);
    }
    function compute() {
      var vh = window.innerHeight;
      target = clamp01((window.scrollY - 0.04 * vh) / (0.62 * vh));
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
      if (window.innerWidth <= 980) { window.removeEventListener('scroll', compute); activateAll(); }
      else { compute(); }
    }, { passive: true });
  }

  setupHero();

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

  /* ----------------------------------------------------------------- Liquid Glass: brilho segue o ponteiro */
  Array.prototype.forEach.call(document.querySelectorAll('.glass'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      el.style.setProperty('--glass-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--glass-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () {
      el.style.removeProperty('--glass-x');
      el.style.removeProperty('--glass-y');
    });
  });

  /* ----------------------------------------------------------------- Menu: cápsula de vidro deslizante */
  (function () {
    var nav = document.getElementById('main-nav');
    var cap = nav && nav.querySelector('.nav-capsule');
    if (!cap) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a:not(.button)'));
    function moveTo(a) {
      var jump = !nav.classList.contains('cap-on');
      if (jump) cap.style.transition = 'none';
      nav.style.setProperty('--cap-left', a.offsetLeft + 'px');
      nav.style.setProperty('--cap-width', a.offsetWidth + 'px');
      if (jump) { void cap.offsetWidth; cap.style.transition = ''; }
      nav.classList.add('cap-on');
    }
    function hide() { nav.classList.remove('cap-on'); }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveTo(a); });
      a.addEventListener('focus', function () { moveTo(a); });
      a.addEventListener('blur', function () { if (!nav.matches(':hover')) hide(); });
    });
    nav.addEventListener('mouseleave', function () {
      if (links.indexOf(document.activeElement) === -1) hide();
    });
  })();

  /* ----------------------------------------------------------------- Carrossel de produtos */
  (function () {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;
    var track = root.querySelector('.car-track');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.car-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.car-dot'));
    var prev = root.querySelector('[data-dir="-1"]');
    var next = root.querySelector('[data-dir="1"]');
    var counter = root.querySelector('.car-count-now');
    var live = root.querySelector('.car-live');
    var idx = -1, ticking = 0, lockUntil = 0;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function setActive(i, announce) {
      if (i === idx) return;
      idx = i;
      slides.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        Array.prototype.forEach.call(s.querySelectorAll('a'), function (a) { a.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === i);
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      if (counter) counter.textContent = pad(i + 1);
      if (announce && live) {
        var h = slides[i].querySelector('h3');
        live.textContent = 'Produto ' + (i + 1) + ' de ' + slides.length + ': ' + (h ? h.textContent : '');
      }
    }
    function current() {
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    }
    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      lockUntil = Date.now() + 750;
      track.scrollTo({ left: i * track.clientWidth, behavior: prefersReduced ? 'auto' : 'smooth' });
      setActive(i, true);
    }

    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = window.requestAnimationFrame(function () {
        ticking = 0;
        if (Date.now() < lockUntil) return;
        setActive(current(), true);
      });
    }, { passive: true });

    if (prev) prev.addEventListener('click', function () { goTo(idx - 1); });
    if (next) next.addEventListener('click', function () { goTo(idx + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { goTo(k); }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1); }
    });
    window.addEventListener('resize', function () {
      track.scrollLeft = idx * track.clientWidth;
    }, { passive: true });

    setActive(0, false);
  })();
})();
