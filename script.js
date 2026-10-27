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