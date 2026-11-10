// split-reveal: headlines and paragraphs that rise in by line, word or character as they scroll into view.
// Needs: gsap, ScrollTrigger, SplitText (GSAP 3.13+, free for commercial use).
// Use:   import { init } from './kit/split-reveal.js';
//        init(document.querySelectorAll('[data-split]'));   // data-split="chars" | "words" | "lines" | "light"
// "light" = words start dim and light up one by one while scrubbing (good for a big statement paragraph).
// Screen readers still get the plain text (SplitText adds aria-label). Off under reduced motion: text stays as is.
import { motionOff, need } from './util.js';

export function init(els, opts = {}) {
  if (motionOff()) return { destroy() {} };
  const gsap = need('gsap'); need('ScrollTrigger'); const SplitText = need('SplitText');
  gsap.registerPlugin(window.ScrollTrigger, SplitText);
  const list = typeof els === 'string' ? document.querySelectorAll(els) : (els.length !== undefined ? els : [els]);
  const made = [];
  list.forEach((el) => {
    let mode = el.dataset.split || opts.mode || 'words';
    // joined scripts (Arabic, Persian, Urdu) break when split into letters: fall back to words
    if (mode === 'chars' && /[\u0600-\u06FF\u0750-\u077F]/.test(el.textContent)) mode = 'words';
    if (mode === 'light') {
      const s = SplitText.create(el, { type: 'words' });
      gsap.set(s.words, { opacity: 0.18 });
      const tw = gsap.to(s.words, { opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 40%', scrub: true } });
      made.push({ s, tw });
      return;
    }
    const type = mode === 'chars' ? 'lines,words,chars' : mode === 'lines' ? 'lines' : 'lines,words';
    const s = SplitText.create(el, { type, mask: 'lines', linesClass: 'lmk-line' });
    const targets = s[mode] || s.words;
    const tw = gsap.from(targets, {
      yPercent: 115, rotate: mode === 'chars' ? 6 : 2, opacity: 0, duration: mode === 'chars' ? 0.9 : 1.1,
      ease: 'expo.out', stagger: mode === 'chars' ? 0.018 : mode === 'lines' ? 0.12 : 0.035,
      scrollTrigger: { trigger: el, start: opts.start || 'top 85%', once: true },
    });
    made.push({ s, tw });
  });
  return { destroy() { made.forEach(({ s, tw }) => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); s.revert(); }); } };
}
