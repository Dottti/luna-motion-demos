// fog-cursor: a soft, brand-tinted fluid fog that trails the cursor (or finger).
// Compact port of Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, see LICENSE-fluid.txt): same solver steps
// (advect, curl, vorticity, divergence, pressure, gradient subtract), trimmed for a background effect.
//
// Use:   import { init } from './kit/fog-cursor.js';
//        const fx = init(document.body, { colors: ['#7c5cff', '#2ad1c9'], strength: 0.16 });
//        fx.setColors(['#ff7ab6', '#7c5cff']);   // new trails take the new palette
//        fx.destroy();
// Light pages: { mode: 'tint', gain: 6, maxAlpha: 0.35 } draws the fog as a tinted veil (normal blending).
// Adds one fixed full-screen <canvas> (pointer-events: none). Off under reduced motion. Low-power devices get a
// lighter grid; no WebGL = a CSS glow that follows the pointer.
import { motionOff, lowPower, webgl } from './util.js';

const VS = `precision highp float;
attribute vec2 aPosition; uniform vec2 texelSize;
varying vec2 vUv, vL, vR, vT, vB;
void main(){ vUv=aPosition*.5+.5; vL=vUv-vec2(texelSize.x,0.); vR=vUv+vec2(texelSize.x,0.);
 vT=vUv+vec2(0.,texelSize.y); vB=vUv-vec2(0.,texelSize.y); gl_Position=vec4(aPosition,0.,1.); }`;
const FS = {
  clear: `precision mediump float; varying vec2 vUv; uniform sampler2D uTexture; uniform float value;
    void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`,
  splat: `precision highp float; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
    uniform vec3 color; uniform vec2 point; uniform float radius;
    void main(){ vec2 p=vUv-point; p.x*=aspectRatio; vec3 s=exp(-dot(p,p)/radius)*color;
      gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.); }`,
  advection: `precision highp float; varying vec2 vUv; uniform sampler2D uVelocity, uSource; uniform vec2 texelSize;
    uniform float dt, dissipation;
    void main(){ vec2 c=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize; gl_FragColor=texture2D(uSource,c)/(1.+dissipation*dt); }`,
  divergence: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
    void main(){ float L=texture2D(uVelocity,vL).x, R=texture2D(uVelocity,vR).x, T=texture2D(uVelocity,vT).y, B=texture2D(uVelocity,vB).y;
      vec2 C=texture2D(uVelocity,vUv).xy; if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
      gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
  curl: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
    void main(){ float L=texture2D(uVelocity,vL).y, R=texture2D(uVelocity,vR).y, T=texture2D(uVelocity,vT).x, B=texture2D(uVelocity,vB).x;
      gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
  vorticity: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main(){ float L=texture2D(uCurl,vL).x, R=texture2D(uCurl,vR).x, T=texture2D(uCurl,vT).x, B=texture2D(uCurl,vB).x, C=texture2D(uCurl,vUv).x;
      vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+.0001; f*=curl*C; f.y*=-1.;
      vec2 v=texture2D(uVelocity,vUv).xy+f*dt; gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.); }`,
  pressure: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uDivergence;
    void main(){ float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x, T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
      gl_FragColor=vec4((L+R+B+T-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
  gradient: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uVelocity;
    void main(){ float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x, T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
      vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B); gl_FragColor=vec4(v,0.,1.); }`,
  display: `precision highp float; varying vec2 vUv; uniform sampler2D uTexture;
    void main(){ vec3 c=texture2D(uTexture,vUv).rgb; float a=clamp(max(c.r,max(c.g,c.b)),0.,1.);
      gl_FragColor=vec4(c,a); }`,
  // light pages: keep the hue, use the amount as opacity, so the mist reads as a soft tinted veil on pale colours
  displayTint: `precision highp float; varying vec2 vUv; uniform sampler2D uTexture; uniform float uGain, uMax;
    void main(){ vec3 c=texture2D(uTexture,vUv).rgb; float m=max(c.r,max(c.g,c.b)); vec3 hue=c/max(m,1e-4);
      float a=min(m*uGain,uMax); gl_FragColor=vec4(hue*a,a); }`,
};

function hex(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

function cssFallback(root, colors) {
  const g = document.createElement('div');
  g.setAttribute('aria-hidden', 'true');
  g.style.cssText = `position:fixed;left:0;top:0;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;
    pointer-events:none;z-index:1;opacity:.35;filter:blur(40px);mix-blend-mode:screen;
    background:radial-gradient(circle, ${colors[0]} 0%, transparent 70%);transition:transform .6s cubic-bezier(.2,.8,.2,1)`;
  root.appendChild(g);
  const move = (e) => { g.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; };
  window.addEventListener('pointermove', move, { passive: true });
  return { destroy() { window.removeEventListener('pointermove', move); g.remove(); } };
}

export function init(root = document.body, opts = {}) {
  const colors = opts.colors || ['#7c5cff', '#2ad1c9', '#ff7ab6'];
  if (motionOff()) return { destroy() {} };
  const kind = webgl();
  if (!kind) return cssFallback(root, colors);
  const light = lowPower();
  const cfg = {
    sim: light ? 64 : 128, dye: light ? 256 : 512, pressureIters: light ? 10 : 20,
    curl: opts.curl ?? 18, velDiss: 0.25, dyeDiss: opts.fade ?? 1.5, radius: (opts.radius ?? 0.22) / 100,
    force: 5200, strength: opts.strength ?? 0.11,
  };

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'lmk-fog';
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:${opts.zIndex ?? 1};
    mix-blend-mode:${opts.blend || (opts.mode === 'tint' ? 'normal' : 'screen')}`;
  root.appendChild(canvas);
  const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  const gl = canvas.getContext(kind, params);
  const isGL2 = kind === 'webgl2';
  let fmt;
  if (isGL2) {
    gl.getExtension('EXT_color_buffer_float');
    fmt = { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };
  } else {
    const hf = gl.getExtension('OES_texture_half_float');
    gl.getExtension('OES_texture_half_float_linear');
    if (!hf) { canvas.remove(); return cssFallback(root, colors); }
    fmt = { internal: gl.RGBA, format: gl.RGBA, type: hf.HALF_FLOAT_OES };
  }

  function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const vs = shader(gl.VERTEX_SHADER, VS);
  const progs = {};
  for (const [k, src] of Object.entries(FS)) {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    progs[k] = { p, u };
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);

  function fbo(w, h) {
    gl.activeTexture(gl.TEXTURE0);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, fmt.type, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, f, w, h, tx: 1 / w, ty: 1 / h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, t); return id; } };
  }
  function dbl(w, h) { let a = fbo(w, h), b = fbo(w, h);
    return { get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; }, w, h, tx: 1 / w, ty: 1 / h }; }
  function size(res) { const ar = gl.drawingBufferWidth / gl.drawingBufferHeight; const min = Math.round(res), max = Math.round(res * (ar < 1 ? 1 / ar : ar));
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? [max, min] : [min, max]; }

  let vel, dye, div, curlT, pres;
  function alloc() {
    const [sw, sh] = size(cfg.sim), [dw, dh] = size(cfg.dye);
    vel = dbl(sw, sh); dye = dbl(dw, dh); div = fbo(sw, sh); curlT = fbo(sw, sh); pres = dbl(sw, sh);
  }
  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, light ? 1 : 1.5);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; alloc(); }
  }

  const tints = colors.map(hex);
  function splat(x, y, dx, dy, c) {
    const s = progs.splat; gl.useProgram(s.p);
    gl.uniform1i(s.u.uTarget, vel.read.attach(0)); gl.uniform1f(s.u.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(s.u.point, x, y); gl.uniform3f(s.u.color, dx, dy, 0);
    gl.uniform1f(s.u.radius, cfg.radius * (canvas.width > canvas.height ? canvas.width / canvas.height : 1));
    blit(vel.write); vel.swap();
    gl.uniform1i(s.u.uTarget, dye.read.attach(0)); gl.uniform3f(s.u.color, c[0], c[1], c[2]);
    blit(dye.write); dye.swap();
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    let p = progs.curl; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0)); blit(curlT);
    p = progs.vorticity; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0)); gl.uniform1i(p.u.uCurl, curlT.attach(1));
    gl.uniform1f(p.u.curl, cfg.curl); gl.uniform1f(p.u.dt, dt); blit(vel.write); vel.swap();
    p = progs.divergence; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0)); blit(div);
    p = progs.clear; gl.useProgram(p.p); gl.uniform1i(p.u.uTexture, pres.read.attach(0)); gl.uniform1f(p.u.value, 0.8);
    blit(pres.write); pres.swap();
    p = progs.pressure; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty); gl.uniform1i(p.u.uDivergence, div.attach(0));
    for (let i = 0; i < cfg.pressureIters; i++) { gl.uniform1i(p.u.uPressure, pres.read.attach(1)); blit(pres.write); pres.swap(); }
    p = progs.gradient; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uPressure, pres.read.attach(0)); gl.uniform1i(p.u.uVelocity, vel.read.attach(1)); blit(vel.write); vel.swap();
    p = progs.advection; gl.useProgram(p.p); gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    const v = vel.read.attach(0); gl.uniform1i(p.u.uVelocity, v); gl.uniform1i(p.u.uSource, v);
    gl.uniform1f(p.u.dt, dt); gl.uniform1f(p.u.dissipation, cfg.velDiss); blit(vel.write); vel.swap();
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0)); gl.uniform1i(p.u.uSource, dye.read.attach(1));
    gl.uniform1f(p.u.dissipation, cfg.dyeDiss); blit(dye.write); dye.swap();
  }
  function render() {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
    const p = opts.mode === 'tint' ? progs.displayTint : progs.display; gl.useProgram(p.p);
    if (opts.mode === 'tint') { gl.uniform1f(p.u.uGain, opts.gain ?? 6); gl.uniform1f(p.u.uMax, opts.maxAlpha ?? 0.35); }
    gl.uniform1i(p.u.uTexture, dye.read.attach(0)); blit(null);
  }

  // pointer input
  let last = null, hue = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (last) {
      const dx = (x - last.x) * cfg.force, dy = (y - last.y) * cfg.force;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) {
        hue = (hue + 0.02) % tints.length; const c = tints[Math.floor(hue)];
        splat(x, y, dx, dy, c.map((v) => v * cfg.strength));
      }
    }
    last = { x, y };
  };
  const onLeave = () => { last = null; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave);
  document.addEventListener('pointerleave', onLeave);

  let raf = 0, prev = performance.now(), running = true;
  resize();
  function frame(now) {
    const dt = Math.min((now - prev) / 1000, 1 / 60); prev = now;
    resize(); step(dt); render();
    raf = requestAnimationFrame(frame);
  }
  const vis = () => {
    const on = !document.hidden;
    if (on && !running) { running = true; prev = performance.now(); raf = requestAnimationFrame(frame); }
    if (!on && running) { running = false; cancelAnimationFrame(raf); }
  };
  document.addEventListener('visibilitychange', vis);
  raf = requestAnimationFrame(frame);

  return {
    canvas,
    splat: (x, y, dx, dy) => splat(x, y, dx, dy, tints[0].map((v) => v * cfg.strength)),
    // swap the palette (e.g. per section); old fog keeps its colour and fades, new trails use the new colours
    setColors(cs) { if (!cs || !cs.length) return; tints.length = 0; cs.map(hex).forEach((t) => tints.push(t)); hue = 0; },
    destroy() {
      cancelAnimationFrame(raf); running = false;
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', vis);
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      canvas.remove();
    },
  };
}
