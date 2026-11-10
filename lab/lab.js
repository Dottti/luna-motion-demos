// Luna Motion Lab: wires every kit effect into the page. Each effect starts on its own, so one failure never
// takes down the rest; results are logged as "LMK ok <name>" / "LMK fail <name>" for QA.
import { motionOff } from '../kit/util.js';
import * as smooth from '../kit/smooth-scroll.js';
import * as grain from '../kit/grain.js';
import * as fog from '../kit/fog-cursor.js';
import * as hero from '../kit/hero-3d.js';
import * as split from '../kit/split-reveal.js';
import * as story from '../kit/pin-story.js';
import * as distort from '../kit/hover-distort.js';
import * as magnetic from '../kit/magnetic.js';
import * as transition from '../kit/page-transition.js';

const fx = {};
window.LMK = fx;

function start(name, fn) {
  try { const r = fn(); fx[name] = r; console.log('LMK ok', name); return r; }
  catch (e) { console.warn('LMK fail', name, e); return null; }
}

function whenReady(cb) {
  // classic <script defer> files (gsap, Lenis) run before module scripts that are also deferred, but be safe
  if (window.gsap && window.ScrollTrigger && window.SplitText && window.Lenis) cb();
  else window.addEventListener('DOMContentLoaded', cb, { once: true });
}

whenReady(async () => {
  if (window.gsap) window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
  // toggle (stores the choice; reduced-motion visitors start with effects off)
  const btn = document.querySelector('.fx-toggle');
  const off = motionOff();
  btn.setAttribute('aria-pressed', String(!off)); btn.textContent = off ? 'Effects off' : 'Effects on';
  btn.addEventListener('click', () => {
    try { localStorage.setItem('lmk-fx', off ? 'on' : 'off'); if (off) localStorage.removeItem('lmk-fx'); } catch (e) { /* ignore */ }
    location.reload();
  });

  const s = start('smooth-scroll', () => smooth.init({ duration: 1.15 }));
  if (s && s.lenis) fx.lenis = s.lenis;
  start('grain', () => grain.init({ opacity: 0.08 }));
  start('fog-cursor', () => fog.init(document.body, { colors: ['#7c5cff', '#2ad1c9', '#ff7ab6'], strength: 0.11, fade: 1.5 }));
  await document.fonts.ready; // split text after fonts load so line breaks are right
  start('split-reveal', () => split.init(document.querySelectorAll('[data-split]')));
  start('pin-story', () => story.init(document.querySelector('[data-pin-story]')));
  start('hover-distort', () => distort.init(document.querySelectorAll('[data-distort]')));
  start('magnetic', () => magnetic.init({ ring: true }));
  start('page-transition', () => transition.init({ color: '#ecebf5', label: 'Luna Motion Lab' }));
  // keep the 3D object clear of the headline: the canvas starts right of the widest headline line; when that
  // leaves too little room (mid widths) the hero stacks like on phones, object above, copy below
  const placeHero = () => {
    const stage = document.querySelector('.hero__stage'), gl = document.getElementById('hero-3d');
    const heroEl = document.getElementById('hero'), copy = document.querySelector('.hero__copy');
    if (!stage || !gl) return;
    gl.style.left = '';
    heroEl.classList.remove('hero--stack');
    if (innerWidth <= 760) return;
    const r = document.createRange(); let right = 0;
    copy.querySelectorAll('h1, .lede, .btn').forEach((el) => { r.selectNodeContents(el); right = Math.max(right, r.getBoundingClientRect().right); });
    const s = stage.getBoundingClientRect(); const left = right - s.left + 32; const avail = s.width - left;
    if (avail >= s.height * 0.62) gl.style.left = `${left}px`;
    else heroEl.classList.add('hero--stack');
  };
  placeHero();
  window.addEventListener('resize', placeHero);
  try {
    fx['hero-3d'] = await hero.init(document.getElementById('hero-3d'), { tint: '#7c5cff', rim: '#2ad1c9', scrollTrigger: '#hero' });
    console.log('LMK ok', 'hero-3d');
  } catch (e) { console.warn('LMK fail', 'hero-3d', e); }
  // hero leaves gracefully: copy and 3D fade and lift while the sticky stage scrolls away (no hard clip edge)
  if (window.gsap && !motionOff()) {
    window.gsap.to('.hero__gl, .hero__copy, .scroll-hint, .hero__glow', { autoAlpha: 0, y: -60, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: () => `top+=${innerHeight * 0.35} top`, end: () => `top+=${innerHeight * 0.85} top`, scrub: true } });
  }
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  document.documentElement.classList.add('lmk-ready');
});
