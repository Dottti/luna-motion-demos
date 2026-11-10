// hover-distort: card images ripple around the cursor and split into a slight RGB shift on hover (WebGL).
// Markup: <figure data-distort><img src="..." alt="..."></figure>  (the <img> stays for SEO, screen readers and fallback)
// Needs: gsap (for the hover easing).
// Use:   import { init } from './kit/hover-distort.js'; init(document.querySelectorAll('[data-distort]'));
// Reduced motion, touch-only devices or no WebGL: the plain image stays, with a gentle CSS zoom on hover.
import { motionOff, webgl, watchVisible, need } from './util.js';

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*.5+.5; vUv.y = 1.-vUv.y; gl_Position = vec4(p,0.,1.); }`;
const FS = `precision mediump float; varying vec2 vUv; uniform sampler2D tex; uniform vec2 mouse; uniform float hover, time, aspect, imgAspect;
void main(){
  vec2 uv = vUv;
  // cover-fit the image into the card
  float r = aspect / imgAspect; if (r > 1.) uv.y = (uv.y - .5) / r + .5; else uv.x = (uv.x - .5) * r + .5;
  vec2 d = vUv - mouse; d.x *= aspect; float dist = length(d);
  float wave = sin(dist * 28. - time * 5.) * exp(-dist * 5.) * .018 * hover;
  vec2 dir = normalize(d + 1e-5); uv += dir * wave;
  uv = (uv - .5) * (1. - .06 * hover) + .5;
  float sh = .006 * hover * (1. + 4. * exp(-dist * 6.));
  vec3 c = vec3(texture2D(tex, uv + dir * sh).r, texture2D(tex, uv).g, texture2D(tex, uv - dir * sh).b);
  gl_FragColor = vec4(c, 1.);
}`;

export function init(els, opts = {}) {
  const list = els.length !== undefined ? [...els] : [els];
  list.forEach((f) => f.classList.add('lmk-distort'));
  if (motionOff() || !webgl() || !window.matchMedia('(hover: hover)').matches) return { destroy() {} };
  const gsap = need('gsap');
  const cleanups = list.map((fig) => {
    const img = fig.querySelector('img'); if (!img) return () => {};
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'lmk-distort__gl';
    fig.appendChild(canvas);
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) { canvas.remove(); return () => {}; }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
    const U = (n) => gl.getUniformLocation(pr, n);
    const u = { mouse: U('mouse'), hover: U('hover'), time: U('time'), aspect: U('aspect'), imgAspect: U('imgAspect') };
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((w) => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const st = { hover: 0, mx: 0.5, my: 0.5, ready: false };
    const upload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1f(u.imgAspect, img.naturalWidth / img.naturalHeight); st.ready = true; fig.classList.add('is-gl'); };
    if (img.complete && img.naturalWidth) upload(); else img.addEventListener('load', upload, { once: true });
    const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = fig.clientWidth * dpr; canvas.height = fig.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(u.aspect, canvas.width / canvas.height); };
    size(); const ro = new ResizeObserver(size); ro.observe(fig);
    const enter = () => gsap.to(st, { hover: 1, duration: 0.6, ease: 'power3.out' });
    const leave = () => gsap.to(st, { hover: 0, duration: 0.9, ease: 'power3.out' });
    const move = (e) => { const r = fig.getBoundingClientRect(); st.mx = (e.clientX - r.left) / r.width; st.my = (e.clientY - r.top) / r.height; };
    fig.addEventListener('pointerenter', enter); fig.addEventListener('pointerleave', leave); fig.addEventListener('pointermove', move);
    let raf = 0, on = false; const t0 = performance.now();
    const frame = () => {
      if (st.ready) { gl.uniform2f(u.mouse, st.mx, st.my); gl.uniform1f(u.hover, st.hover); gl.uniform1f(u.time, (performance.now() - t0) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
      raf = requestAnimationFrame(frame);
    };
    const unwatch = watchVisible(fig, (v) => { if (v && !on) { on = true; raf = requestAnimationFrame(frame); } if (!v && on) { on = false; cancelAnimationFrame(raf); } });
    return () => { cancelAnimationFrame(raf); unwatch(); ro.disconnect(); fig.removeEventListener('pointerenter', enter);
      fig.removeEventListener('pointerleave', leave); fig.removeEventListener('pointermove', move);
      const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); canvas.remove(); fig.classList.remove('is-gl'); };
  });
  return { destroy() { cleanups.forEach((c) => c()); } };
}
