// caustics: a faint, slowly moving pool-light pattern (like sun through water) for light hero backgrounds.
// Use:   import { init } from './kit/caustics.js';
//        const fx = init(document.querySelector('.hero-stage'), { color: '#7fcbbb', alpha: 0.16, scale: 1 });
//        fx.destroy();
// Adds one absolutely positioned canvas as the element's first child (z-index 0, pointer-events none); give the
// element position: relative and put its content above (z-index 1+). Renders at half resolution, pauses off screen.
// Off under reduced motion, on low-power devices and without WebGL (the page keeps its normal background).
import { motionOff, lowPower, webgl, watchVisible } from './util.js';

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float;
varying vec2 vUv; uniform float uTime, uAspect, uScale, uAlpha; uniform vec3 uCol;
// own pattern: two drifting, domain-warped value-noise fields; the thin bright ridges where their sum crosses
// whole numbers read as pool light. Written for this kit (no third-party shader code).
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float layer(vec2 uv, float t){
  float a = vn(uv * 2.6 + vec2(t * .21, t * .13));
  float b = vn(uv * 2.6 + vec2(-t * .17, t * .19) + a * 1.7);
  float r = 1. - abs(sin((a + b) * 6.28318));
  return pow(r, 4.); }
float caustic(vec2 uv, float t){ return layer(uv, t) * .65 + layer(uv * 1.9 + 7.3, t * 1.3) * .45; }
void main(){
  vec2 uv = vUv; uv.x *= uAspect; uv *= .55 * uScale;
  float c = caustic(uv, uTime * .6 + 11.) * .8;
  float fade = smoothstep(0., .35, vUv.y) * smoothstep(1.05, .55, vUv.y);   // soft at the top and bottom edges
  float a = clamp(c, 0., 1.) * uAlpha * fade;
  gl_FragColor = vec4(uCol * a, a);
}`;

function hex(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

export function init(el, opts = {}) {
  if (!el || motionOff() || lowPower() || !webgl()) return { destroy() {} };
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'lmk-caustics';
  canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;
    mix-blend-mode:${opts.blend || 'normal'};opacity:0;transition:opacity 1.6s ease`;
  el.prepend(canvas);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { canvas.remove(); return { destroy() {} }; }
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uTime', 'uAspect', 'uScale', 'uAlpha', 'uCol'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform3fv(U.uCol, hex(opts.color || '#7fcbbb')); gl.uniform1f(U.uAlpha, opts.alpha ?? 0.16); gl.uniform1f(U.uScale, opts.scale ?? 1);

  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * 0.5)), h = Math.max(1, Math.round(canvas.clientHeight * 0.5));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform1f(U.uAspect, w / h); }
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  let raf = 0, running = false; const t0 = performance.now();
  function frame(now) {
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uTime, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  const unwatch = watchVisible(el, (v) => {
    if (v && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!v && running) { running = false; cancelAnimationFrame(raf); }
  });
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  return {
    canvas,
    destroy() { cancelAnimationFrame(raf); running = false; unwatch(); ro.disconnect();
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); canvas.remove(); },
  };
}
