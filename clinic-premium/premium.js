// Nurvale Dental Studio premium demo: language first, then every Luna Motion Kit effect, each started on its own so
// one failure never stops the rest. QA reads "LMK ok <name>" / "LMK fail <name>" from the console.
import { T, currentLang, applyLang } from './i18n.js';
import { motionOff } from './kit/util.js';
import * as smooth from './kit/smooth-scroll.js';
import * as fog from './kit/fog-cursor.js';
import * as hero from './kit/hero-3d.js';
import * as split from './kit/split-reveal.js';
import * as story from './kit/pin-story.js';
import * as magnetic from './kit/magnetic.js';
import * as transition from './kit/page-transition.js';

const lang = currentLang();
const d = applyLang(lang);
const page = document.body.dataset.page;
const fx = {}; window.LMK = fx;

if (page === 'book') {
  const box = document.getElementById('bkDays');
  d.days.forEach((n, i) => {
    const l = document.createElement('label'); l.className = 'chip';
    l.innerHTML = `<input type="radio" name="day"${i === 0 ? ' checked' : ''}><span></span>`;
    l.querySelector('span').textContent = n; box.appendChild(l);
  });
}

function start(name, fn) {
  try { const r = fn(); fx[name] = r; console.log('LMK ok', name); return r; }
  catch (e) { console.warn('LMK fail', name, e); return null; }
}

function whenReady(cb) {
  if (window.gsap && window.ScrollTrigger && window.SplitText) cb();
  else window.addEventListener('DOMContentLoaded', cb, { once: true });
}

whenReady(async () => {
  const gsap = window.gsap;
  if (gsap) gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
  const still = motionOff();

  if (page === 'home') {
    const s = start('smooth-scroll', () => smooth.init({ duration: 1.1, offset: -70 }));
    if (s && s.lenis) fx.lenis = s.lenis;
  }
  // grain left out on purpose: on this pale palette the stretched noise read as dirt, not film (QA 2026-11-10)
  start('fog-cursor', () => fog.init(document.body, { mode: 'tint', colors: ['#9fd8cc', '#b9e7dd', '#c4ebe2'],
    strength: 0.1, gain: 4, maxAlpha: 0.2, fade: 1.9, radius: 0.28, zIndex: 1 }));
  await document.fonts.ready;
  // Arabic letters join, so splitting them one by one breaks the word: Arabic reveals by word instead
  if (lang === 'ar') document.querySelectorAll('[data-split="chars"]').forEach((el) => { el.dataset.split = 'words'; });
  start('split-reveal', () => split.init(document.querySelectorAll('[data-split]')));
  if (page === 'home') start('pin-story', () => story.init(document.querySelector('[data-pin-story]'), { perStep: 0.8 }));
  start('magnetic', () => magnetic.init({ ring: true }));
  start('page-transition', () => transition.init({ color: '#e6f5f1', label: d.brand }));

  if (page === 'home') {
    try {
      fx['hero-3d'] = await hero.init(document.getElementById('pearl'), {
        tint: '#ece2d4', rim: '#7fcbbb', zoom: 1.05, morph: 0.008, morphScroll: 0.05, satellites: 3, orbit: 0.78, exposure: 1.0,
        scrollTrigger: '#top',
        material: { metalness: 0.0, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 1,
          iridescenceIOR: 1.38, iridescenceThicknessRange: [300, 820], sheen: 0.35, sheenColor: '#dff4ee', envMapIntensity: 1.4 },
      });
      console.log('LMK ok', 'hero-3d');
    } catch (e) { console.warn('LMK fail', 'hero-3d', e); }
  }

  if (gsap && !still) {
    const rtl = lang === 'ar';
    if (page === 'home') {
      // hero intro and graceful exit
      gsap.from('.hero .eyebrow, .hero .cta-row', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
      gsap.from('.hero-art', { scale: 0.85, autoAlpha: 0, duration: 1.6, ease: 'expo.out', delay: 0.1 });
      // the hero only stays pinned on wide screens, so the exit fade runs there only
      gsap.matchMedia().add('(min-width: 901px)', () => {
        gsap.to('.hero-copy, .hero-art, .scroll-hint', { autoAlpha: 0, y: -50, ease: 'none',
          scrollTrigger: { trigger: '#top', start: () => `top+=${innerHeight * 0.3} top`, end: () => `top+=${innerHeight * 0.8} top`, scrub: true } });
      });
      // doctor card rises, counters count up
      gsap.from('.doc-card', { y: 80, rotate: rtl ? 3 : -3, autoAlpha: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.doctor', start: 'top 70%' } });
      gsap.to('.doc-card', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.doctor', start: 'top bottom', end: 'bottom top', scrub: true } });
      document.querySelectorAll('.count').forEach((el) => {
        const to = +el.dataset.to, o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' },
          onUpdate: () => { el.textContent = Math.round(o.v); } });
      });
      // map: roads draw, pin drops, hours slide in from the reading side
      document.querySelectorAll('.road').forEach((p) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut',
          scrollTrigger: { trigger: '.map', start: 'top 80%' },
          onComplete: () => { if (p.closest('.thin')) { p.style.strokeDasharray = '10 10'; p.style.strokeDashoffset = 0; } } });
      });
      gsap.from('.pin', { y: -120, autoAlpha: 0, duration: 1, ease: 'bounce.out', delay: 0.8, scrollTrigger: { trigger: '.map', start: 'top 80%' } });
      gsap.from('.hours-list div', { x: rtl ? 30 : -30, autoAlpha: 0, stagger: 0.08, duration: 0.7, scrollTrigger: { trigger: '.hours-list', start: 'top 88%' } });
      gsap.from('.book .btn-big', { scale: 0.85, autoAlpha: 0, duration: 0.9, ease: 'back.out(2)', scrollTrigger: { trigger: '.book .btn-big', start: 'top 92%' } });
    } else {
      gsap.from('.bk-lead, .bk-group, .bk-note, .bookpage .cta-row', { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', delay: 0.35 });
    }
  }
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  document.documentElement.classList.add('lmk-ready');
});

export { T };
