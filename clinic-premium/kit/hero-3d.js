// hero-3d: one glossy, iridescent blob (procedural, no model files) that tilts toward the mouse and turns and
// melts as the visitor scrolls through its section.
//
// Needs an import map for three (see lab/index.html) and GSAP + ScrollTrigger loaded for the scroll part.
// Use:   import { init } from './kit/hero-3d.js';
//        const fx = await init(document.querySelector('#hero'), { tint: '#7c5cff', scrollTrigger: '#hero' });
// Options: tint, rim (colours), scrollTrigger (selector), zoom (camera distance x, >1 = smaller object),
//   material (MeshPhysicalMaterial overrides), morph / morphScroll (surface wobble at rest / added by scroll),
//   satellites (n small pearls orbiting), orbit (their orbit size x), exposure,
//   glass (true = iridescent glass shell with a glowing core, composited over the page; cheap fake, no transmission pass).
// Returns { group, destroy } — group holds the object (and pearls) so a page can move it with GSAP.
// The element gets a <canvas> filling it (position it yourself). Off under reduced motion or with no WebGL:
// a CSS gradient orb is shown instead. Low-power devices get fewer polygons; edges are always antialiased
// (pixel ratio capped at 2).
import { motionOff, lowPower, webgl, watchVisible } from './util.js';

function cssOrb(el, tint) {
  const o = document.createElement('div');
  o.className = 'lmk-orb'; o.setAttribute('aria-hidden', 'true');
  o.style.cssText = `position:absolute;left:50%;top:50%;width:min(60vmin,520px);aspect-ratio:1;transform:translate(-50%,-50%);
    border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0%, ${tint} 30%, #1b1240 70%, transparent 72%);
    filter:saturate(1.2);opacity:.9`;
  el.appendChild(o);
  return { destroy() { o.remove(); } };
}

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float disp(vec3 p){ return snoise(p*1.4+vec3(0.,uTime*.25,0.))*uMorph + snoise(p*3.1-uTime*.15)*uMorph*.35; }
`;

export async function init(el, opts = {}) {
  const tint = opts.tint || '#7c5cff';
  if (motionOff() || !webgl()) return cssOrb(el, tint);
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const light = lowPower();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  // desktops render at 2x even on 1x screens (cheap supersampling for one object: clean silhouettes); capped at 2
  renderer.setPixelRatio(light ? Math.min(window.devicePixelRatio || 1, 2) : 2);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'lmk-hero3d';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50); camera.position.set(0, 0, 6);

  const geo = new THREE.IcosahedronGeometry(1.25, light ? 48 : 96);
  const m = opts.material || {};
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tint), metalness: 0.15, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 820], sheen: 0.4, sheenColor: new THREE.Color('#ffffff'),
    ...m, ...(m.sheenColor ? { sheenColor: new THREE.Color(m.sheenColor) } : {}),
  });
  if (opts.exposure) renderer.toneMappingExposure = opts.exposure;
  const group = new THREE.Group(); scene.add(group);
  const morph0 = opts.morph ?? 0.18, morphS = opts.morphScroll ?? 0.45;
  const uni = { uTime: { value: 0 }, uMorph: { value: morph0 } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uni.uTime; sh.uniforms.uMorph = uni.uMorph;
    sh.vertexShader = 'uniform float uTime; uniform float uMorph;\n' + NOISE + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        // bend the normal with the displacement so light follows the new shape
        vec3 t1 = normalize(cross(normal, vec3(0.,1.,0.)) + vec3(1e-4)); vec3 t2 = normalize(cross(normal, t1));
        float e = .01; vec3 pA = position + normal*disp(position); vec3 pB = position + t1*e; pB += normal*disp(pB);
        vec3 pC = position + t2*e; pC += normal*disp(pC); objectNormal = normalize(cross(pB - pA, pC - pA));
        if (dot(objectNormal, normal) < 0.) objectNormal = -objectNormal;`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * disp(position);');
  };
  const mesh = new THREE.Mesh(geo, mat); group.add(mesh);
  // glass: front shell is see-through in the middle and bright at the rim (fresnel), a tinted back shell gives
  // depth, and a small glowing core sits inside. All normal alpha blending, so it sits over the page cleanly.
  const extra = [];
  if (opts.glass) {
    const rimC = new THREE.Color(opts.rim || '#2ad1c9');
    mat.transparent = true; mat.depthWrite = false; mat.color.set('#ffffff'); mat.roughness = 0.03; mat.metalness = 0;
    mat.clearcoat = 1; mat.clearcoatRoughness = 0.02; mat.iridescence = 1; mat.iridescenceIOR = 1.6;
    mat.iridescenceThicknessRange = [120, 900]; mat.envMapIntensity = 2.2; mat.sheen = 0; mat.specularIntensity = 1;
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh) => {
      prev(sh); sh.uniforms.uRim = { value: rimC };
      sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float fr = pow(1. - abs(dot(normal, normalize(vViewPosition))), 2.2);
        gl_FragColor.rgb += uRim * fr * .55;
        gl_FragColor.a = clamp(mix(.04, 1., fr) + max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b) * .18, 0., 1.);`);
    };
    const back = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(tint), roughness: 0.2, metalness: 0, transparent: true,
      opacity: 0.16, side: THREE.BackSide, depthWrite: false, iridescence: 1, iridescenceIOR: 1.3, envMapIntensity: 1.2 });
    back.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uni.uTime; sh.uniforms.uMorph = uni.uMorph;
      sh.vertexShader = 'uniform float uTime; uniform float uMorph;\n' + NOISE + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * disp(position) - normal * .06;');
    };
    const backMesh = new THREE.Mesh(geo, back); backMesh.renderOrder = 0; mesh.renderOrder = 2; mesh.add(backMesh);
    // glowing core: a soft radial sprite (additive), so it reads as light inside the glass, not a solid ball
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d');
    const gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const tc = new THREE.Color(tint).lerp(new THREE.Color('#ffffff'), 0.35);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.25, `rgba(${tc.r * 255 | 0},${tc.g * 255 | 0},${tc.b * 255 | 0},0.55)`);
    gr.addColorStop(0.6, `rgba(${rimC.r * 255 | 0},${rimC.g * 255 | 0},${rimC.b * 255 | 0},0.12)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    const gtex = new THREE.CanvasTexture(gc); gtex.colorSpace = THREE.SRGBColorSpace;
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    core.scale.setScalar(1.5); core.renderOrder = 1; mesh.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.25 }));
    halo.scale.setScalar(3.4); halo.renderOrder = 0; mesh.add(halo);
    extra.push(back, gtex, core.material, halo.material);
    extra.core = core; extra.halo = halo;
  }
  // optional small pearls on slow tilted orbits (same material, no wobble)
  const sats = [];
  if (opts.satellites) {
    const sg = new THREE.SphereGeometry(1, light ? 24 : 48, light ? 16 : 32);
    const sm = new THREE.MeshPhysicalMaterial({ color: mat.color.clone(), roughness: mat.roughness, metalness: mat.metalness,
      clearcoat: 1, iridescence: mat.iridescence, iridescenceIOR: 1.3, iridescenceThicknessRange: mat.iridescenceThicknessRange,
      sheen: mat.sheen, sheenColor: mat.sheenColor.clone() });
    for (let i = 0; i < opts.satellites; i++) {
      const s = new THREE.Mesh(sg, sm); const r = 0.13 + (i % 3) * 0.05; s.scale.setScalar(r); group.add(s);
      sats.push({ s, a: (i / opts.satellites) * Math.PI * 2, rad: (1.9 + (i % 2) * 0.35) * (opts.orbit ?? 1), sp: 0.18 + i * 0.04, tilt: 0.5 + i * 0.3 });
    }
    sats.dispose = () => { sg.dispose(); sm.dispose(); };
  }
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(opts.rim || '#2ad1c9', 3); rim.position.set(-4, -1, -3); scene.add(rim);

  function resize() {
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = (w < h ? 8 : 6) * (opts.zoom || 1); camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(el);

  // mouse tilt
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const onMove = (e) => { target.x = (e.clientY / innerHeight - 0.5) * 0.6; target.y = (e.clientX / innerWidth - 0.5) * 0.8; };
  window.addEventListener('pointermove', onMove, { passive: true });

  // scroll: turn, melt, sink
  const scroll = { p: 0 };
  let st = null;
  if (window.gsap && window.ScrollTrigger) {
    st = window.ScrollTrigger.create({
      trigger: opts.scrollTrigger || el, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (s) => { scroll.p = s.progress; },
    });
  }

  let raf = 0, running = true; const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    uni.uTime.value = t;
    uni.uMorph.value = morph0 + scroll.p * morphS;
    sats.forEach((o) => { const a = o.a + t * o.sp + scroll.p * 2; o.s.position.set(Math.cos(a) * o.rad,
      Math.sin(a) * o.rad * Math.sin(o.tilt) * 0.55 + mesh.position.y, Math.sin(a) * o.rad * Math.cos(o.tilt) * 0.6); });
    cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06;
    mesh.rotation.x = cur.x + t * 0.05; mesh.rotation.y = cur.y + t * 0.08 + scroll.p * Math.PI * 1.2;
    mesh.position.y = scroll.p * 0.5 + Math.sin(t * 0.6) * 0.06;
    mesh.scale.setScalar(1 - scroll.p * 0.25);
    if (extra.core) { extra.core.scale.setScalar(1.5 * (1 + Math.sin(t * 1.3) * 0.06)); extra.halo.scale.setScalar(3.4 * (1 + Math.sin(t * 0.9 + 1) * 0.08)); }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  const unwatch = watchVisible(el, (v) => {
    if (v && !running) { running = true; raf = requestAnimationFrame(frame); }
    if (!v && running) { running = false; cancelAnimationFrame(raf); }
  });
  raf = requestAnimationFrame(frame);

  return {
    group, camera,
    destroy() {
      cancelAnimationFrame(raf); unwatch(); ro.disconnect(); window.removeEventListener('pointermove', onMove);
      if (st) st.kill(); if (sats.dispose) sats.dispose(); geo.dispose(); mat.dispose(); extra.forEach((x) => x.dispose && x.dispose()); pmrem.dispose(); renderer.dispose(); canvas.remove();
    },
  };
}
