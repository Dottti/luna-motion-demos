// magnetic: buttons and links that lean toward the cursor, plus a soft cursor ring that grows over them.
// Markup: add data-magnetic (optional value = strength, default 0.35) to any button or link.
// Needs: gsap.
// Use:   import { init } from './kit/magnetic.js'; init({ ring: true });
// Touch devices and reduced motion: nothing changes (the real cursor stays, no ring).
import { motionOff, need } from './util.js';

export function init(opts = {}) {
  if (motionOff() || !window.matchMedia('(pointer: fine)').matches) return { destroy() {} };
  const gsap = need('gsap');
  const offs = [];
  let ring = null, rx, ry;
  if (opts.ring !== false) {
    ring = document.createElement('div'); ring.className = 'lmk-ring'; ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.documentElement.classList.add('lmk-has-ring');
    rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' }); ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    const mv = (e) => { if (!ring.classList.contains('is-on')) { gsap.set(ring, { x: e.clientX, y: e.clientY }); ring.classList.add('is-on'); } rx(e.clientX); ry(e.clientY); };
    const over = (e) => { ring.classList.toggle('is-hover', !!e.target.closest('a,button,[data-magnetic]')); };
    window.addEventListener('pointermove', mv, { passive: true }); document.addEventListener('pointerover', over);
    offs.push(() => { window.removeEventListener('pointermove', mv); document.removeEventListener('pointerover', over); ring.remove();
      document.documentElement.classList.remove('lmk-has-ring'); });
  }
  document.querySelectorAll(opts.selector || '[data-magnetic]').forEach((el) => {
    const k = parseFloat(el.dataset.magnetic) || 0.35;
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const move = (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * k); qy((e.clientY - r.top - r.height / 2) * k); };
    const leave = () => { qx(0); qy(0); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.set(el, { clearProps: 'transform' }); });
  });
  return { destroy() { offs.forEach((f) => f()); } };
}
