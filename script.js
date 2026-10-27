const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  navigation?.classList.toggle('is-open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  navigation.classList.remove('is-open');
}));

const year = document.querySelector('#current-year');
if (year) year.textContent = new Date().getFullYear();

document.body.classList.add('motion-ready');
const revealItems = document.querySelectorAll('.reveal');
const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersLessMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -32px 0px' });

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', String(Math.min(index % 3, 2) * 90) + 'ms');
    revealObserver.observe(item);
  });
}

const heroSection = document.querySelector('.hero-cinematic');
const heroImage = heroSection?.querySelector('.hero-image');
let parallaxFrame = 0;

function updateHeroParallax() {
  if (!heroSection || !heroImage || prefersLessMotion) return;
  const rect = heroSection.getBoundingClientRect();
  const shift = Math.max(-24, Math.min(96, -rect.top * 0.18));
  heroImage.style.setProperty('--hero-parallax', `${shift.toFixed(1)}px`);
  parallaxFrame = 0;
}

function scheduleHeroParallax() {
  if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateHeroParallax);
}

window.addEventListener('scroll', scheduleHeroParallax, { passive: true });
window.addEventListener('resize', scheduleHeroParallax, { passive: true });
updateHeroParallax();

let progressFrame = 0;
function updateScrollProgress() {
  const page = document.documentElement;
  const scrollableHeight = page.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;
  page.style.setProperty('--scroll-progress', String(progress));
  progressFrame = 0;
}

function scheduleScrollProgress() {
  if (!progressFrame) progressFrame = window.requestAnimationFrame(updateScrollProgress);
}

window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
window.addEventListener('resize', scheduleScrollProgress, { passive: true });
updateScrollProgress();
