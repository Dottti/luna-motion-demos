// grain: a faint animated film-grain layer over the whole page, the cheap trick that makes flat colour feel filmed.
// Use:   import { init } from './kit/grain.js'; init({ opacity: 0.07, fps: 12 });
// One tiny 160x160 canvas, redrawn ~12 times a second and stretched by CSS. Reduced motion or low power:
// one still frame (texture without movement).
import { motionOff, lowPower } from './util.js';

export function init(opts = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  c.setAttribute('aria-hidden', 'true'); c.className = 'lmk-grain';
  c.style.cssText = `position:fixed;inset:-10%;width:120%;height:120%;pointer-events:none;z-index:${opts.zIndex ?? 60};
    opacity:${opts.opacity ?? 0.07};mix-blend-mode:${opts.blend || 'overlay'};image-rendering:pixelated`;
  document.body.appendChild(c);
  const ctx = c.getContext('2d'); const img = ctx.createImageData(160, 160); const d = img.data;
  const draw = () => { for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } ctx.putImageData(img, 0, 0);
    c.style.transform = `translate(${(Math.random() * 6 - 3).toFixed(1)}%,${(Math.random() * 6 - 3).toFixed(1)}%)`; };
  draw();
  if (motionOff() || lowPower()) return { destroy() { c.remove(); } };
  const iv = setInterval(() => { if (!document.hidden) draw(); }, 1000 / (opts.fps ?? 12));
  return { destroy() { clearInterval(iv); c.remove(); } };
}
