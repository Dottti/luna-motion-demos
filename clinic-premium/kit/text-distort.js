// text-distort: a big headline drawn in WebGL that ripples, melts and splits into colour under the cursor.
// The real HTML heading stays in the page (screen readers, search, copy-paste); when WebGL runs, its text is
// hidden visually and the canvas draws the same lines in the same font on top.
//
// Use:   import { init } from './kit/text-distort.js';
//        const fx = init(document.querySelector('[data-text-distort]'), { color: '#ecebf5', strength: 1 });
//        fx.destroy();
// Markup: <h2 data-text-distort>Touch<br>the type.</h2>  (lines come from <br>; font, size, weight and line height are
// read from the heading's computed style, so style the h2 as usual).
// Off under reduced motion, without WebGL, and on touch-first devices (the CSS fallback is the plain heading,
// with a soft hover skew from kit.css .lmk-td-fallback).
import { motionOff, lowPower, webgl, watchVisible } from './util.js';

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision highp float;
varying vec2 vUv; uniform sampler2D uTex; uniform vec2 uMouse; uniform vec2 uVel; uniform float uTime, uAmt, uAspect;
uniform vec3 uInk, uA, uB;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 uv = vUv; vec2 d = uv - uMouse; d.x *= uAspect; float dist = length(d);
  float f = smoothstep(.42, 0., dist) * uAmt;
  vec2 dir = d / max(dist, 1e-4); dir.x /= uAspect;
  float wave = sin(dist * 46. - uTime * 7.) * .5 + .5;
  vec2 off = dir * wave * .03 * f + uVel * f * 1.4;
  off.y += (noise(vec2(uv.x * 9., uTime * .7)) - .5) * .07 * f;         // melt: soft vertical drip
  float r = texture2D(uTex, uv - off * 1.35).a;
  float g = texture2D(uTex, uv - off).a;
  float b = texture2D(uTex, uv - off * .65).a;
  float a = max(max(r, g), b);
  vec3 split = vec3(r, g, b);
  vec3 col = mix(uInk * a, uInk * .25 * a + uA * (r - g) * 1.6 + uB * (b - g) * 1.6 + uInk * min(min(r, g), b) * .75, clamp(f * 1.6, 0., 1.));
  gl_FragColor = vec4(col, a);
}`;

function hex(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

export function init(el, opts = {}) {
  if (!el) return { destroy() {} };
  if (motionOff() || !webgl() || lowPower()) { el.classList.add('lmk-td-fallback'); return { destroy() { el.classList.remove('lmk-td-fallback'); } }; }
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((s) => { const t = document.createElement('div'); t.innerHTML = s; return t.textContent.trim(); });
  const wrap = el.parentElement; if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'lmk-td-canvas';
  canvas.style.cssText = 'position:absolute;pointer-events:none;display:block';
  wrap.appendChild(canvas);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { canvas.remove(); el.classList.add('lmk-td-fallback'); return { destroy() {} }; }

  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uTex', 'uMouse', 'uVel', 'uTime', 'uAmt', 'uAspect', 'uInk', 'uA', 'uB'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform3fv(U.uInk, hex(opts.color || '#ecebf5'));
  gl.uniform3fv(U.uA, hex(opts.a || '#ff5c8a')); gl.uniform3fv(U.uB, hex(opts.b || '#2ad1c9'));
  const pad = 0.12; // extra room around the text so ripples are not clipped
  let W = 0, H = 0, dpr = 1;

  function draw() {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(), pr = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = r.width * pad, py = r.height * pad;
    W = r.width + px * 2; H = r.height + py * 2;
    canvas.style.left = `${r.left - pr.left - px}px`; canvas.style.top = `${r.top - pr.top - py}px`;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const fs = parseFloat(cs.fontSize); const lh = cs.lineHeight === 'normal' ? fs * 1.1 : parseFloat(cs.lineHeight);
    x.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    x.textBaseline = 'alphabetic'; x.fillStyle = '#fff';
    if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing;
    const align = cs.textAlign; const rtl = cs.direction === 'rtl';
    lines.forEach((t, i) => {
      const m = x.measureText(t); let tx = px;
      if (align === 'center') tx = px + (r.width - m.width) / 2; else if (align === 'right' || align === 'end' || (rtl && align !== 'left')) tx = px + r.width - m.width;
      const ty = py + i * lh + (lh - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)) / 2 + m.actualBoundingBoxAscent;
      x.fillText(t, tx, ty);
    });
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(U.uAspect, W / H);
  }

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 }; let amt = 0, target = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width, ny = 1 - (e.clientY - r.top) / r.height;
    const inside = nx > -0.1 && nx < 1.1 && ny > -0.3 && ny < 1.3; target = inside ? (opts.strength ?? 1) : 0;
    mouse.tx = nx; mouse.ty = ny;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0, running = false; const t0 = performance.now();
  function frame(now) {
    const px = mouse.x, py = mouse.y;
    mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.vx += ((mouse.x - px) - mouse.vx) * 0.25; mouse.vy += ((mouse.y - py) - mouse.vy) * 0.25;
    amt += (target - amt) * 0.06;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y); gl.uniform2f(U.uVel, -mouse.vx * 2, -mouse.vy * 2);
    gl.uniform1f(U.uTime, (now - t0) / 1000); gl.uniform1f(U.uAmt, amt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  const ready = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    draw(); el.classList.add('lmk-td-on');
  });
  const ro = new ResizeObserver(() => ready.then(draw)); ro.observe(el);
  const unwatch = watchVisible(wrap, (v) => {
    if (v && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!v && running) { running = false; cancelAnimationFrame(raf); }
  });

  return {
    canvas,
    destroy() {
      cancelAnimationFrame(raf); running = false; unwatch(); ro.disconnect();
      window.removeEventListener('pointermove', onMove); el.classList.remove('lmk-td-on');
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); canvas.remove();
    },
  };
}
