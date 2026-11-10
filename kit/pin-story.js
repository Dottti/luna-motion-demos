// pin-story: the section holds still while 3-4 steps play out as the visitor scrolls (scrubbed, reversible).
// Markup:  <section data-pin-story> <div class="story-step">...</div> x3-4 <div class="story-bar"><i></i></div> </section>
// Needs: gsap + ScrollTrigger.
// Use:   import { init } from './kit/pin-story.js'; init(document.querySelector('[data-pin-story]'));
// Off under reduced motion and on low-power devices: steps simply stack and stay readable.
import { motionOff, lowPower, need } from './util.js';

export function init(el, opts = {}) {
  el.classList.add('lmk-story');
  if (motionOff() || lowPower()) { el.classList.add('lmk-story--static'); return { destroy() { el.classList.remove('lmk-story--static'); } }; }
  const gsap = need('gsap'); gsap.registerPlugin(need('ScrollTrigger'));
  const steps = [...el.querySelectorAll('.story-step')];
  const bar = el.querySelector('.story-bar i');
  el.classList.add('lmk-story--pinned');
  gsap.set(steps, { autoAlpha: 0, yPercent: 30 });
  gsap.set(steps[0], { autoAlpha: 1, yPercent: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut', duration: 1 },
    scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${innerHeight * (opts.perStep ?? 0.9) * steps.length}`,
      pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
  });
  steps.forEach((s, i) => {
    if (i === 0) return;
    // the old step clears out before the new one is half in, so two titles never sit on top of each other
    tl.to(steps[i - 1], { autoAlpha: 0, yPercent: -40, scale: 0.94, duration: 0.55, ease: 'power2.in' }, i)
      .to(s, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.7, ease: 'power2.out' }, i + 0.35);
  });
  if (bar) tl.fromTo(bar, { scaleX: 1 / steps.length }, { scaleX: 1, ease: 'none', duration: steps.length - 1 }, 0);
  return { destroy() { tl.scrollTrigger.kill(); tl.kill(); gsap.set(steps, { clearProps: 'all' }); el.classList.remove('lmk-story--pinned'); } };
}
