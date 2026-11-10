// smooth-scroll: Lenis inertia scrolling, kept in step with GSAP ScrollTrigger.
// Needs: lenis.min.js (+ lenis.css), gsap.min.js, ScrollTrigger.min.js loaded as classic <script>s.
// Use:   import { init } from './kit/smooth-scroll.js'; const fx = init({ duration: 1.1 }); fx.lenis.scrollTo('#id');
// Off under reduced motion and on touch / low-power devices (native scrolling feels better there).
import { motionOff, lowPower, need } from './util.js';

export function init(opts = {}) {
  if (motionOff() || lowPower()) return { lenis: null, destroy() {} };
  const Lenis = need('Lenis'), gsap = need('gsap'), ST = need('ScrollTrigger');
  const lenis = new Lenis({ duration: opts.duration ?? 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ST.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
  // anchor links glide instead of jumping
  const onClick = (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = document.querySelector(id); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: opts.offset ?? 0 });
  };
  document.addEventListener('click', onClick);
  return { lenis, destroy() { document.removeEventListener('click', onClick); gsap.ticker.remove(tick); lenis.destroy(); } };
}
