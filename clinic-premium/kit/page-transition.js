// page-transition: a coloured curtain sweeps up over the page on leave and lifts off the next page on arrival.
// Markup: add data-transition to same-site links that should use it.
// Needs: gsap. Works across normal multi-page sites (no router): the arriving page reads a sessionStorage flag.
// Use:   import { init } from './kit/page-transition.js'; init({ color: '#7c5cff', label: 'Luna' });
// Reduced motion: links navigate normally, no curtain.
import { motionOff, need } from './util.js';

const KEY = 'lmk-curtain';

export function init(opts = {}) {
  if (motionOff()) { try { sessionStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } return { destroy() {} }; }
  const gsap = need('gsap');
  const cur = document.createElement('div'); cur.className = 'lmk-curtain'; cur.setAttribute('aria-hidden', 'true');
  cur.style.background = opts.color || '#7c5cff';
  if (opts.label) { const s = document.createElement('span'); s.textContent = opts.label; cur.appendChild(s); }
  document.body.appendChild(cur);
  let arriving = false; try { arriving = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  if (arriving) {
    gsap.set(cur, { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.to(cur, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut', delay: 0.1 });
  } else gsap.set(cur, { clipPath: 'inset(100% 0% 0% 0%)' });
  const onClick = (e) => {
    const a = e.target.closest('a[data-transition]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault();
    try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* ignore */ }
    gsap.fromTo(cur, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut',
      onComplete: () => { location.href = a.href; } });
  };
  document.addEventListener('click', onClick);
  // back/forward cache: never come back to a covered page
  const onShow = (e) => { if (e.persisted) gsap.set(cur, { clipPath: 'inset(100% 0% 0% 0%)' }); };
  window.addEventListener('pageshow', onShow);
  return { destroy() { document.removeEventListener('click', onClick); window.removeEventListener('pageshow', onShow); cur.remove(); } };
}
