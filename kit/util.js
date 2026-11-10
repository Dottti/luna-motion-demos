// Luna Motion Kit: shared helpers. Every effect imports these so the on/off rules stay in one place.
//   motionOff()  true when the visitor asked for reduced motion OR turned effects off (localStorage "lmk-fx" = "off")
//   lowPower()   true on touch-first devices, small memory, or Save-Data; effects take their lighter path
//   webgl()      returns "webgl2", "webgl" or null

export function motionOff() {
  try { if (localStorage.getItem('lmk-fx') === 'off') return true; } catch (e) { /* storage blocked */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function lowPower() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 8;
  const save = navigator.connection && navigator.connection.saveData;
  return coarse || mem <= 4 || !!save;
}

let _gl;
export function webgl() {
  if (_gl !== undefined) return _gl;
  try {
    const c = document.createElement('canvas');
    _gl = c.getContext('webgl2') ? 'webgl2' : (c.getContext('webgl') ? 'webgl' : null);
  } catch (e) { _gl = null; }
  return _gl;
}

// Pause work while an element is off screen or the tab is hidden. cb(visible:boolean)
export function watchVisible(el, cb) {
  let inView = true;
  const io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; cb(inView && !document.hidden); });
  io.observe(el);
  const onVis = () => cb(inView && !document.hidden);
  document.addEventListener('visibilitychange', onVis);
  return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
}

export function need(name) {
  if (!window[name]) throw new Error(`Luna Motion Kit: ${name} is not loaded. Add its <script> before the kit.`);
  return window[name];
}
