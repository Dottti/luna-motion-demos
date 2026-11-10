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
import * as caustics from './kit/caustics.js';

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
  // micro-interactions: a soft pulse per keystroke, chips pop when picked, the button confirms (nothing is sent)
  document.querySelectorAll('.field input').forEach((inp) => {
    let t = 0; inp.addEventListener('input', () => { const f = inp.parentElement; f.classList.remove('is-typing'); void f.offsetWidth;
      f.classList.add('is-typing'); clearTimeout(t); t = setTimeout(() => f.classList.remove('is-typing'), 340); });
  });
  document.querySelectorAll('.chip input').forEach((inp) => inp.addEventListener('change', () => {
    const c = inp.closest('.chip'); c.classList.remove('is-picked'); void c.offsetWidth; c.classList.add('is-picked'); }));
  const form = document.querySelector('.bk-form'), btn = document.querySelector('.bk-submit'), toast = document.querySelector('.bk-toast');
  if (form && btn && toast) {
    btn.addEventListener('pointerdown', (e) => { const r = btn.getBoundingClientRect();
      btn.style.setProperty('--rx', `${e.clientX - r.left}px`); btn.style.setProperty('--ry', `${e.clientY - r.top}px`); });
    form.addEventListener('submit', (e) => { e.preventDefault(); btn.classList.add('is-sent'); toast.classList.remove('is-on'); void toast.offsetWidth;
      toast.classList.add('is-on'); setTimeout(() => btn.classList.remove('is-sent'), 60); });
  }
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
  if (page === 'home') {
    start('caustics', () => caustics.init(document.querySelector('.hero-stage'), { color: '#6fc4b2', alpha: 0.22, scale: 1 }));
    // calm intro: the pearl rises and its shadow settles first, the headline follows
    if (gsap && !still) {
      gsap.from('#pearl', { y: 140, autoAlpha: 0, duration: 2, ease: 'expo.out', delay: 0.1 });
      gsap.from('.pearl-shadow', { scaleX: 0.35, autoAlpha: 0, duration: 2, ease: 'expo.out', delay: 0.25 });
    }
  }
  await document.fonts.ready;
  // Arabic letters join, so splitting them one by one breaks the word: Arabic reveals by word instead
  if (lang === 'ar') document.querySelectorAll('[data-split="chars"]').forEach((el) => { el.dataset.split = 'words'; });
  const heroSplit = [...document.querySelectorAll('.hero [data-split]')];
  start('split-reveal', () => split.init([...document.querySelectorAll('[data-split]')].filter((el) => !heroSplit.includes(el))));
  if (heroSplit.length) {
    if (!still) await new Promise((r) => setTimeout(r, 450));
    start('split-reveal-hero', () => split.init(heroSplit));
  }
  document.documentElement.classList.add('lmk-split');
  if (page === 'home') start('pin-story', () => story.init(document.querySelector('[data-pin-story]'), { perStep: 0.8 }));
  start('magnetic', () => magnetic.init({ ring: true }));
  start('page-transition', () => transition.init({ color: '#e6f5f1', label: d.brand }));

  if (page === 'home') {
    try {
      fx['hero-3d'] = await hero.init(document.getElementById('pearl'), {
        tint: '#ece2d4', rim: '#7fcbbb', zoom: 1.05, morph: 0.006, morphScroll: 0.01, satellites: 3, orbit: 0.78, exposure: 1.0,
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
      gsap.from('.hero .eyebrow, .hero .cta-row', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.5 });
      // the hero only stays pinned on wide screens, so the exit fade and the pearl's journey run there only
      gsap.matchMedia().add('(min-width: 901px)', () => {
        const travel = travelPearl(gsap, lang === 'ar');
        gsap.to(travel ? '.hero-copy, .pearl-shadow, .scroll-hint' : '.hero-copy, .hero-art, .scroll-hint', { autoAlpha: 0, y: -50, ease: 'none',
          scrollTrigger: { trigger: '#top', start: () => `top+=${innerHeight * 0.3} top`, end: () => `top+=${innerHeight * 0.8} top`, scrub: true } });
        return () => { if (travel) travel.undo(); };
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

// The pearl leaves the hero and travels to the free side of the pinned service cards, smaller, then fades out
// when the doctor section arrives. It moves as one fixed layer (transforms only, no canvas resize).
function travelPearl(gsap, rtl) {
  const pearl = document.getElementById('pearl'), art = document.querySelector('.hero-art');
  const fx3d = window.LMK && window.LMK['hero-3d'];
  if (!pearl || !art || !fx3d || !fx3d.group || !window.ScrollTrigger) return null;
  const layer = document.createElement('div'); layer.className = 'pearl-layer'; layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer); layer.appendChild(pearl);
  const base = () => ({ x: art.offsetLeft, y: art.offsetTop, w: art.offsetWidth, h: art.offsetHeight });
  const place = () => { const b = base(); Object.assign(layer.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` }); };
  place();
  const target = () => {
    const b = base(), vw = innerWidth, vh = innerHeight;
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || Math.max(16, vw * 0.06);
    const cardW = Math.min(680, vw * 0.86), top = Math.min(330, Math.max(220, vh * 0.34));
    const free = vw - pad * 2 - cardW - 40;
    const cx = rtl ? pad + free / 2 : vw - pad - free / 2, cy = top + (vh - top - 70) / 2;
    const size = Math.max(0, Math.min(free * 0.95, 420, vh - top - 90));
    const s = size / Math.min(b.w, b.h);
    return { x: cx - (b.x + b.w / 2), y: cy - (b.y + b.h / 2), s, ok: free > 220 };
  };
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#services', start: 'top bottom', end: 'top top', scrub: 0.6, invalidateOnRefresh: true,
    onRefresh: place } });
  tl.to(layer, { x: () => target().x, y: () => target().y, scale: () => target().s, autoAlpha: () => (target().ok ? 1 : 0), ease: 'power2.inOut' });
  const out = gsap.to(layer, { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.doctor', start: 'top bottom', end: 'top 60%', scrub: true } });
  return { undo() { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); out.scrollTrigger && out.scrollTrigger.kill(); out.kill();
    gsap.set(layer, { clearProps: 'all' }); art.appendChild(pearl); layer.remove(); } };
}

export { T };
