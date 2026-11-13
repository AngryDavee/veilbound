// Veilbound anime FX: the 3D action effects and the "flying screen" overlays of a duel.
//
//   const fx = createAnimeFX(THREE, scene, { renderer, canvas });
//   each frame, AFTER renderer.render(scene, camera):  fx.update(rawDt, dt, camera);
//
// 3D effects live in the scene as a handful of pooled, batched meshes (one draw call for all
// additive particles, one for alpha particles, one for debris, plus whatever arcs/rings/ghosts are
// alive). Nothing allocates geometry or materials per hit. Screen effects are DOM/canvas overlays
// above the WebGL canvas; they are driven by update(), never by CSS transitions, so they pause and
// freeze with the game. The only thing that touches the world image is impactFrame(), a CSS filter
// that lasts a few frames.
//
// Portraits for cut-ins and the duel splash render the fighter alone (layer 30, own lights, no
// background) into a small render target and copy it into a 2D canvas.
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

export function createAnimeFX(THREE, scene, { renderer, canvas, overlayParent = document.body } = {}) {
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = { out3: t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), in2: t => clamp(t, 0, 1) ** 2, inOut: t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }, back: t => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
  const col = c => (c && c.isColor) ? c.clone() : new THREE.Color(c ?? 0xffffff);
  const root = new THREE.Group(); root.name = 'anime-fx'; scene.add(root);
  const PORTRAIT_LAYER = 30;

  // =====================================================================================
  // texture atlas: 4x4 cells of 256 px, drawn once in code
  // =====================================================================================
  const AT = document.createElement('canvas'); AT.width = AT.height = 1024;
  const ag = AT.getContext('2d');
  const CELL = { glow: 0, star: 1, beam: 2, streak: 3, puffA: 4, puffB: 5, shardA: 6, shardB: 7, ring: 8, smoke: 9, drop: 10, ember: 11, splat: 12, star2: 13 };
  function cellDraw(i, fn) { ag.save(); ag.translate((i % 4) * 256, Math.floor(i / 4) * 256); ag.beginPath(); ag.rect(0, 0, 256, 256); ag.clip(); fn(ag); ag.restore(); }
  cellDraw(CELL.glow, g => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 126); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.75)'); r.addColorStop(.5, 'rgba(255,255,255,.18)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
  function starShape(g, n, rIn, rOut, jitter, seed) {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + (rnd() - .5) * .12, ro = rOut * (1 - jitter * rnd()), w = .055 + rnd() * .05;
      g.lineTo(128 + Math.cos(a - w * 2.4) * rIn, 128 + Math.sin(a - w * 2.4) * rIn);
      g.lineTo(128 + Math.cos(a) * ro, 128 + Math.sin(a) * ro);
      g.lineTo(128 + Math.cos(a + w * 2.4) * rIn, 128 + Math.sin(a + w * 2.4) * rIn);
    }
    g.closePath();
  }
  cellDraw(CELL.star, g => { g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 14; g.fillStyle = '#fff'; starShape(g, 16, 30, 124, .55, 7); g.fill(); const r = g.createRadialGradient(128, 128, 0, 128, 128, 50); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.arc(128, 128, 50, 0, 7); g.fill(); });
  cellDraw(CELL.star2, g => { g.fillStyle = '#fff'; starShape(g, 11, 22, 126, .7, 91); g.fill(); });
  cellDraw(CELL.beam, g => { g.shadowColor = '#fff'; g.shadowBlur = 26; g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(1, 128); g.quadraticCurveTo(128, 128 - 30, 255, 128); g.quadraticCurveTo(128, 128 + 30, 1, 128); g.fill(); } });
  cellDraw(CELL.streak, g => { const lg = g.createLinearGradient(0, 0, 256, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.7, 'rgba(255,255,255,.8)'); lg.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = lg; g.shadowColor = '#fff'; g.shadowBlur = 18; g.beginPath(); g.moveTo(0, 128); g.lineTo(220, 128 - 26); g.arc(226, 128, 26, -Math.PI / 2, Math.PI / 2); g.lineTo(0, 128); g.fill(); });
  function puff(g, seed, soft) {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const blobs = []; for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, d = rnd() * 46; blobs.push([128 + Math.cos(a) * d, 132 + Math.sin(a) * d * .8, 38 + rnd() * 34]); }
    g.filter = `blur(${soft}px)`;
    g.fillStyle = '#c9c4bc'; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - r * .22, y - r * .26, r * .8, 0, 7); g.fill(); }
    g.filter = 'none';
  }
  cellDraw(CELL.puffA, g => puff(g, 11, 3)); cellDraw(CELL.puffB, g => puff(g, 37, 3));
  cellDraw(CELL.smoke, g => puff(g, 53, 14));
  function shard(g, seed) { let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; g.beginPath(); g.moveTo(2, 128 + (rnd() - .5) * 60); g.lineTo(46, 128 - 70 - rnd() * 30); g.lineTo(96, 128 - 34); g.lineTo(128, 128 - 52); g.lineTo(254, 128); g.lineTo(140, 128 + 40 + rnd() * 20); g.lineTo(92, 128 + 22); g.lineTo(40, 128 + 64); g.closePath(); g.fillStyle = '#fff'; g.fill(); }
  cellDraw(CELL.shardA, g => shard(g, 5)); cellDraw(CELL.shardB, g => { shard(g, 29); });
  cellDraw(CELL.ring, g => { let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 8; for (let i = 0; i < 26; i++) { const a0 = i / 26 * 6.283 + rnd() * .1, a1 = a0 + .12 + rnd() * .14, r0 = 92 + rnd() * 10, th = 3 + rnd() * 9; g.beginPath(); g.arc(128, 128, r0 + th, a0, a1); g.arc(128, 128, r0, a1, a0, true); g.fill(); g.beginPath(); const a = a0 + .05; g.moveTo(128 + Math.cos(a) * (r0 + th), 128 + Math.sin(a) * (r0 + th)); g.lineTo(128 + Math.cos(a + .02) * (r0 + th + 14 + rnd() * 18), 128 + Math.sin(a + .02) * (r0 + th + 14 + rnd() * 18)); g.lineTo(128 + Math.cos(a + .05) * (r0 + th), 128 + Math.sin(a + .05) * (r0 + th)); g.fill(); } });
  cellDraw(CELL.drop, g => { g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.moveTo(40, 128); g.quadraticCurveTo(150, 100, 200, 112); g.arc(200, 128, 16, -Math.PI / 2, Math.PI / 2); g.quadraticCurveTo(150, 156, 40, 128); g.fill(); });
  cellDraw(CELL.ember, g => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 90); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(128, 30); g.quadraticCurveTo(200, 120, 160, 190); g.quadraticCurveTo(128, 226, 96, 190); g.quadraticCurveTo(56, 120, 128, 30); g.fill(); });
  cellDraw(CELL.splat, g => { g.fillStyle = '#fff'; starShape(g, 9, 40, 120, .6, 13); g.fill(); g.beginPath(); g.arc(128, 128, 52, 0, 7); g.fill(); });
  const atlas = new THREE.CanvasTexture(AT); atlas.colorSpace = THREE.NoColorSpace; atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter;
  const cellUV = i => { const x = (i % 4) / 4, y = 1 - (Math.floor(i / 4) + 1) / 4; return [x + .002, y + .002, x + .25 - .002, y + .25 - .002]; };

  // =====================================================================================
  // pooled camera-facing quads (billboards, velocity-stretched streaks), one draw per pool
  // =====================================================================================
  function quadPool(cap, additive) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(cap * 12), uv = new Float32Array(cap * 8), c4 = new Float32Array(cap * 16), idx = new Uint32Array(cap * 6);
    for (let i = 0; i < cap; i++) { const v = i * 4; idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color4', new THREE.BufferAttribute(c4, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: atlas } }, transparent: true, depthWrite: false, toneMapped: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: 'attribute vec4 color4; varying vec4 vC; varying vec2 vUv; void main(){ vC=color4; vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC; varying vec2 vUv; void main(){ vec4 t=texture2D(map,vUv); gl_FragColor=vec4(t.rgb*vC.rgb, t.a*vC.a); if(gl_FragColor.a<.004) discard;\n#include <colorspace_fragment>\n}',
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = additive ? 9 : 8; mesh.visible = false; root.add(mesh);
    const P = []; for (let i = 0; i < cap; i++) P.push({ alive: false, p: V3(), v: V3(), c: new THREE.Color(), c2: new THREE.Color(), age: 0, life: 1 });
    let cursor = 0, hi = 0;
    function spawn(o) {
      let q = null; for (let k = 0; k < cap; k++) { const i = (cursor + k) % cap; if (!P[i].alive) { q = P[i]; cursor = i + 1; break; } }
      if (!q) { q = P[cursor % cap]; cursor++; }
      q.alive = true; q.age = 0; q.life = o.life ?? .5; q.p.copy(o.p); q.v.copy(o.v || V3()); q.g = o.g ?? 0; q.drag = o.drag ?? 0;
      q.s0 = o.s0 ?? .3; q.s1 = o.s1 ?? q.s0; q.rot = o.rot ?? 0; q.vr = o.vr ?? 0; q.cell = o.cell ?? CELL.glow; q.a = o.a ?? 1;
      q.c.copy(col(o.c)); q.c2.copy(o.c2 !== undefined ? col(o.c2) : q.c); q.stretch = o.stretch ?? 0; q.aspect = o.aspect ?? 1; q.fadeIn = o.fadeIn ?? .04; q.fadePow = o.fadePow ?? 1;
      q.floor = o.floor ?? -1e9; q.bounce = o.bounce ?? 0; q.minLen = o.minLen ?? 0;
      return q;
    }
    const right = V3(), up = V3(), fwd = V3(), d = V3(), side = V3(), tmp = V3(), camPos = V3();
    function update(dt, camera) {
      camera.updateMatrixWorld(); const e = camera.matrixWorld.elements;
      right.set(e[0], e[1], e[2]).normalize(); up.set(e[4], e[5], e[6]).normalize(); fwd.set(-e[8], -e[9], -e[10]).normalize(); camPos.setFromMatrixPosition(camera.matrixWorld);
      let last = -1;
      for (let i = 0; i < cap; i++) {
        const q = P[i]; const o = i * 12;
        if (q.alive) { q.age += dt; if (q.age >= q.life) q.alive = false; }
        if (!q.alive) { if (i < hi) pos.fill(0, o, o + 12); continue; }
        last = i; const k = q.age / q.life;
        q.v.y -= q.g * dt; if (q.drag) q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt)); q.p.addScaledVector(q.v, dt);
        if (q.p.y < q.floor) { q.p.y = q.floor; q.v.y = Math.abs(q.v.y) * q.bounce; q.v.x *= .6; q.v.z *= .6; }
        q.rot += q.vr * dt;
        const s = q.s0 + (q.s1 - q.s0) * ease.out3(k);
        const alpha = q.a * Math.min(1, q.age / Math.max(1e-4, q.fadeIn)) * Math.pow(1 - k, q.fadePow);
        let ax, ay, az, bx, by, bz; // half extents along the two quad axes
        if (q.stretch > 0 && q.v.lengthSq() > 1e-6) {
          d.copy(q.v).normalize(); tmp.copy(q.p).sub(camPos).normalize(); side.crossVectors(d, tmp); if (side.lengthSq() < 1e-6) side.copy(up); side.normalize();
          const len = Math.max(q.minLen, s * q.aspect + q.v.length() * q.stretch) * .5, w = s * .5;
          ax = d.x * len; ay = d.y * len; az = d.z * len; bx = side.x * w; by = side.y * w; bz = side.z * w;
          // head of the streak sits at p, the tail trails behind
          const cx = q.p.x - d.x * len, cy = q.p.y - d.y * len, cz = q.p.z - d.z * len;
          pos.set([cx - ax - bx, cy - ay - by, cz - az - bz, cx + ax - bx, cy + ay - by, cz + az - bz, cx + ax + bx, cy + ay + by, cz + az + bz, cx - ax + bx, cy - ay + by, cz - az + bz], o);
        } else {
          const c = Math.cos(q.rot), sn = Math.sin(q.rot), hw = s * .5 * q.aspect, hh = s * .5;
          ax = (right.x * c + up.x * sn) * hw; ay = (right.y * c + up.y * sn) * hw; az = (right.z * c + up.z * sn) * hw;
          bx = (-right.x * sn + up.x * c) * hh; by = (-right.y * sn + up.y * c) * hh; bz = (-right.z * sn + up.z * c) * hh;
          const p = q.p; pos.set([p.x - ax - bx, p.y - ay - by, p.z - az - bz, p.x + ax - bx, p.y + ay - by, p.z + az - bz, p.x + ax + bx, p.y + ay + by, p.z + az + bz, p.x - ax + bx, p.y - ay + by, p.z - az + bz], o);
        }
        const [u0, v0, u1, v1] = cellUV(q.cell); uv.set([u0, v0, u1, v0, u1, v1, u0, v1], i * 8);
        const r = q.c.r + (q.c2.r - q.c.r) * k, g = q.c.g + (q.c2.g - q.c.g) * k, b = q.c.b + (q.c2.b - q.c.b) * k;
        for (let j = 0; j < 4; j++) c4.set([r, g, b, alpha], i * 16 + j * 4);
      }
      hi = last + 1; geo.setDrawRange(0, hi * 6); mesh.visible = hi > 0;
      if (hi > 0) { geo.attributes.position.needsUpdate = geo.attributes.uv.needsUpdate = geo.attributes.color4.needsUpdate = true; }
    }
    function clear() { for (const q of P) q.alive = false; hi = 0; mesh.visible = false; pos.fill(0); }
    return { spawn, update, clear, mesh, geo, mat };
  }
  const ADD = quadPool(900, true), ALPHA = quadPool(420, false);

  // =====================================================================================
  // debris: instanced rock chunks with gravity and a bounce
  // =====================================================================================
  const DEB_CAP = 96;
  const debGeo = new THREE.DodecahedronGeometry(.1, 0);
  const debMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, flatShading: true });
  const debris3 = new THREE.InstancedMesh(debGeo, debMat, DEB_CAP); debris3.instanceMatrix.setUsage(THREE.DynamicDrawUsage); debris3.frustumCulled = false; debris3.castShadow = true; debris3.visible = false; root.add(debris3);
  const debCols = [0x6e5f4c, 0x857258, 0x5b5045, 0x9a8a70, 0x4c4a44]; for (let i = 0; i < DEB_CAP; i++) debris3.setColorAt(i, new THREE.Color(debCols[i % debCols.length]));
  const DB = []; for (let i = 0; i < DEB_CAP; i++) DB.push({ alive: false, p: V3(), v: V3(), q: new THREE.Quaternion(), w: V3(), s: V3(), age: 0, life: 1, floor: 0 });
  let dbi = 0; const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _zero = V3(), _ax = V3();
  function debrisStep(dt) {
    let any = false;
    for (let i = 0; i < DEB_CAP; i++) {
      const d = DB[i];
      if (d.alive) { d.age += dt; if (d.age > d.life) d.alive = false; }
      if (!d.alive) { _m4.makeScale(0, 0, 0); debris3.setMatrixAt(i, _m4); continue; }
      any = true; d.v.y -= 15 * dt; d.p.addScaledVector(d.v, dt);
      if (d.p.y < d.floor + d.s.y * .08) { d.p.y = d.floor + d.s.y * .08; if (d.v.y < 0) d.v.y = -d.v.y * .28; d.v.x *= .55; d.v.z *= .55; d.w.multiplyScalar(.6); }
      if (d.w.lengthSq() > 1e-6) { _ax.copy(d.w).normalize(); _q.setFromAxisAngle(_ax, d.w.length() * dt); d.q.premultiply(_q); }
      const shrink = 1 - clamp((d.age - d.life + .35) / .35, 0, 1);
      _m4.compose(d.p, d.q, _zero.copy(d.s).multiplyScalar(shrink)); debris3.setMatrixAt(i, _m4);
    }
    debris3.visible = any; debris3.instanceMatrix.needsUpdate = true;
  }

  // =====================================================================================
  // noise used by arcs and rings
  // =====================================================================================
  const NOISE = 'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);} float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);} float fbm(vec2 p){return .55*vnoise(p)+.3*vnoise(p*2.1+7.)+.15*vnoise(p*4.3+3.);}';

  // =====================================================================================
  // shockwave: ground ring + swirl band + translucent dome
  // =====================================================================================
  const ringGeo = new THREE.PlaneGeometry(2, 2); ringGeo.rotateX(-Math.PI / 2);
  const domeGeo = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const ringFrag = `uniform float uT; uniform vec3 uC; uniform float uKind; varying vec2 vUv; ${NOISE}
    void main(){ vec2 q=vUv*2.-1.; float d=length(q); float a=atan(q.y,q.x);
      float k=1.-uT; float w=mix(.16,.035,uT);
      float band=smoothstep(w,0.,abs(d-.93)) ; float inner=smoothstep(.95,.2,d)*.22*k;
      float n=fbm(vec2(a*3.,uT*4.));
      float alpha;
      if(uKind<.5){ alpha=(band*(.65+.6*n)+inner)*k*1.4; }
      else { float dash=smoothstep(.45,.6,fract(a*2.2/6.2832+uT*.6+n*.3)); alpha=smoothstep(.06,0.,abs(d-.9))*dash*k*1.6; }
      vec3 c=mix(uC,vec3(1.),band*.6); gl_FragColor=vec4(c,clamp(alpha,0.,1.)); if(gl_FragColor.a<.005) discard;
      #include <colorspace_fragment>
    }`;
  const RINGS = [];
  for (let i = 0; i < 3; i++) {
    const mk = (kind) => new THREE.ShaderMaterial({ uniforms: { uT: { value: 1 }, uC: { value: new THREE.Color() }, uKind: { value: kind } }, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: ringFrag });
    const ring = new THREE.Mesh(ringGeo, mk(0)), swirl = new THREE.Mesh(ringGeo, mk(1));
    const dome = new THREE.Mesh(domeGeo, new THREE.ShaderMaterial({
      uniforms: { uT: { value: 1 }, uC: { value: new THREE.Color() } }, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader: `uniform float uT; uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying vec3 vP; ${NOISE}
        void main(){ float f=pow(1.-abs(dot(vN,vV)),2.2); float k=1.-uT; float a=atan(vP.z,vP.x);
          float streak=.6+.4*fbm(vec2(a*5.,vP.y*3.-uT*3.)); float top=smoothstep(1.,.2,vP.y);
          float alpha=(f*1.1+.12)*streak*k*k*top*1.2; vec3 c=mix(uC,vec3(1.),f*.7); gl_FragColor=vec4(c,clamp(alpha,0.,1.)); if(gl_FragColor.a<.005) discard;
          #include <colorspace_fragment>
        }`,
    }));
    for (const m of [ring, swirl, dome]) { m.visible = false; m.frustumCulled = false; m.renderOrder = 7; root.add(m); }
    RINGS.push({ ring, swirl, dome, t: 1, dur: .7, r: 3, p: V3(), spin: 0 });
  }
  let rgi = 0;
  function ringStep(dt) {
    for (const R of RINGS) {
      if (R.t >= 1) { R.ring.visible = R.swirl.visible = R.dome.visible = false; continue; }
      R.t = Math.min(1, R.t + dt / R.dur); const t = R.t, e = ease.out3(t);
      R.ring.visible = R.swirl.visible = R.dome.visible = t < 1;
      R.ring.material.uniforms.uT.value = t; R.swirl.material.uniforms.uT.value = t; R.dome.material.uniforms.uT.value = Math.min(1, t * 1.15);
      R.ring.position.copy(R.p).y += .04; R.ring.scale.setScalar(R.r * (.15 + .95 * e));
      R.swirl.position.copy(R.p).y += .35 + .25 * e; R.swirl.scale.setScalar(R.r * (.12 + .78 * e)); R.swirl.rotation.y += dt * 5;
      R.dome.position.copy(R.p); R.dome.scale.set(R.r * (.1 + .72 * e), R.r * (.1 + .55 * e), R.r * (.1 + .72 * e));
    }
  }

  // =====================================================================================
  // slash arcs: painted crescents (water / ember), 3 layers each
  // =====================================================================================
  const ARC_SEG = 96, ARC_ACROSS = 6;
  const arcGeo = (() => {
    const g = new THREE.BufferGeometry(), uvw = [], idx = [], p = [];
    for (let i = 0; i <= ARC_SEG; i++) for (let j = 0; j <= ARC_ACROSS; j++) { uvw.push(i / ARC_SEG, j / ARC_ACROSS); p.push(0, 0, 0); }
    for (let i = 0; i < ARC_SEG; i++) for (let j = 0; j < ARC_ACROSS; j++) { const a = i * (ARC_ACROSS + 1) + j, b = a + ARC_ACROSS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uvw', new THREE.Float32BufferAttribute(uvw, 2)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(V3(), 10); return g;
  })();
  const arcVert = `attribute vec2 uvw; uniform float uArc; uniform float uStart; uniform float uRadius; uniform float uWidth; uniform float uT;
    varying float vU; varying float vV;
    void main(){ float u=uvw.x, v=uvw.y; vU=u; vV=v;
      float prof=pow(max(sin(3.14159*u),0.),.6)*(.45+.55*u);
      float grow=.75+.25*smoothstep(0.,.35,uT);
      float r=uRadius*grow+(v-.5)*uWidth*prof;
      float a=uStart+u*uArc; vec3 p=vec3(cos(a)*r, sin(a)*r, (v-.5)*uWidth*.08);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`;
  const arcFrag = `uniform float uT; uniform vec3 uC0; uniform vec3 uC1; uniform float uStyle; uniform float uSeed; uniform float uAlpha; uniform float uLayer;
    varying float vU; varying float vV; ${NOISE}
    void main(){
      float head=1.-pow(1.-clamp(uT/.26,0.,1.),3.);
      float tail=pow(clamp((uT-.18)/.8,0.,1.),1.3);
      if(vU>head||vU<tail) discard;
      float across=vV;
      float fresh=smoothstep(head-.4,head,vU);
      // one ragged painted stroke: noisy inner and outer boundaries, flowing filaments, torn gaps
      float nIn=fbm(vec2(vU*9.+uSeed,1.3)), nOut=fbm(vec2(vU*15.+uSeed*2.,4.1)), n2=vnoise(vec2(vU*80.+uSeed*3.,across*9.));
      float inner=.04+.34*nIn*(1.-.4*fresh);
      float outer=.985-(uStyle<.5?.1:.26)*nOut*(uStyle<.5?1.:(.6+.4*sin(vU*40.-uT*18.)));
      float body=smoothstep(inner,inner+.05,across)*smoothstep(outer,outer-.035,across);
      float fil=fbm(vec2(vU*4.5+uSeed-uT*1.5,across*8.));
      float tear=smoothstep(.3,.4,fil);
      body*=mix(1.,tear,smoothstep(.15,.55,across)*(.45+.55*(1.-sin(3.14159*vU))));
      float core=smoothstep(.35,.95,across);
      vec3 c;
      if(uStyle<.5){ // water: deep blue under-edge, teal body, cyan filaments, white crest and spray flecks
        c=mix(uC0*.38,uC0,smoothstep(.0,.55,across));
        c=mix(c,uC1,smoothstep(.45,.75,fil)*core);
        c=mix(c,vec3(1.),smoothstep(outer-.13,outer-.03,across)*.95+fresh*.2);
        c=mix(c,vec3(1.),step(.86,n2)*core*.8);
      } else { // ember: smoky crimson under-edge, red body, orange flame tongues, yellow-white crest
        c=mix(uC0*.32,uC0,smoothstep(.0,.5,across));
        c=mix(c,uC1,smoothstep(.4,.8,fil+.25*core)*(.6+.4*n2));
        c=mix(c,vec3(1.,.93,.7),smoothstep(outer-.12,outer-.02,across)*.9+fresh*.15);
      }
      float streak=.88+.12*fil;
      float breakT=clamp((uT-.5)/.5,0.,1.);
      float br=fbm(vec2(vU*24.+uSeed,vV*5.+uT*3.));
      if(br<breakT*1.05-.02) discard;
      float alpha=clamp(body*1.4,0.,1.)*streak*uAlpha*smoothstep(tail,tail+.14,vU)*smoothstep(head,head-.025-.03*nOut,vU)*(1.-breakT*.4);
      gl_FragColor=vec4(c,clamp(alpha,0.,1.)); if(gl_FragColor.a<.01) discard;
      #include <colorspace_fragment>
    }`;
  const ARCS = [];
  for (let i = 0; i < 5; i++) {
    const layers = [];
    for (let l = 0; l < 3; l++) {
      const m = new THREE.Mesh(arcGeo, new THREE.ShaderMaterial({
        uniforms: { uT: { value: 1 }, uArc: { value: 3 }, uStart: { value: 0 }, uRadius: { value: 1.4 }, uWidth: { value: .5 }, uC0: { value: new THREE.Color() }, uC1: { value: new THREE.Color() }, uStyle: { value: 0 }, uSeed: { value: 0 }, uAlpha: { value: 1 }, uLayer: { value: l } },
        vertexShader: arcVert, fragmentShader: arcFrag, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
        blending: l === 0 ? THREE.NormalBlending : THREE.AdditiveBlending,
      }));
      m.visible = false; m.frustumCulled = false; m.renderOrder = 6 + l; root.add(m); layers.push(m);
    }
    ARCS.push({ layers, t: 1, life: .5, o: null, emitAcc: 0 });
  }
  let arci = 0; const _hp = V3();
  function arcStep(dt) {
    for (const A of ARCS) {
      if (A.t >= 1) { for (const m of A.layers) m.visible = false; continue; }
      A.t = Math.min(1, A.t + dt / A.life);
      A.layers.forEach((m, l) => { const tl = clamp(A.t - l * .05, 0, 1); m.material.uniforms.uT.value = tl; m.visible = A.t < 1 && tl > 0 && l < A.n; });
      // flecks shed from the head of the arc while it sweeps
      const head = 1 - Math.pow(1 - clamp(A.t / .26, 0, 1), 3);
      if (A.t < .55) {
        A.emitAcc += dt * (A.o.style === 'ember' ? 110 : 90);
        const a = A.o.start + head * A.o.arc;
        while (A.emitAcc > 1) {
          A.emitAcc--;
          const r = A.o.radius * (1 + rand(-.25, .3) * A.o.width / A.o.radius);
          _hp.set(Math.cos(a) * r, Math.sin(a) * r, rand(-.05, .05)).applyMatrix4(A.layers[0].matrixWorld);
          const tan = V3(-Math.sin(a), Math.cos(a), 0).transformDirection(A.layers[0].matrixWorld).multiplyScalar(Math.sign(A.o.arc) * rand(1.5, 5));
          if (A.o.style === 'ember') ADD.spawn({ p: _hp, v: tan.add(V3(rand(-1, 1), rand(.5, 2.5), rand(-1, 1))), g: -1.2, drag: 1.5, life: rand(.35, .8), s0: rand(.05, .12), s1: .02, cell: CELL.ember, c: Math.random() < .5 ? 0xffd27a : A.o.c1, c2: A.o.c0, a: 1, stretch: .02 });
          else ADD.spawn({ p: _hp, v: tan.add(V3(rand(-1, 1), rand(0, 2), rand(-1, 1))), g: 7, drag: .6, life: rand(.3, .6), s0: rand(.04, .09), s1: .03, cell: CELL.drop, c: 0xffffff, c2: A.o.c1, a: .9, stretch: .035, aspect: 1.6 });
        }
      }
    }
  }

  // =====================================================================================
  // afterimages: pooled skinned ghosts per fighter
  // =====================================================================================
  const ghostVert = `#include <common>
    #include <skinning_pars_vertex>
    varying vec3 vN; varying vec3 vV;
    void main(){
      #include <beginnormal_vertex>
      #include <skinbase_vertex>
      #include <skinnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
      #include <skinning_vertex>
      #include <project_vertex>
      vN=normalize(transformedNormal); vV=normalize(-mvPosition.xyz);
    }`;
  const ghostFrag = `uniform vec3 uC; uniform float uA; varying vec3 vN; varying vec3 vV;
    void main(){ float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.6); gl_FragColor=vec4(uC*(.35+rim*1.5), uA*(.25+rim*.9));
      #include <colorspace_fragment>
    }`;
  const ghostSets = new Map();
  function ghostSet(fighter) {
    const src = fighter.userData?.mesh; if (!src) return null;
    let set = ghostSets.get(src.uuid); if (set) return set;
    set = { src, list: [], next: 0 };
    for (let i = 0; i < 6; i++) {
      const g = cloneSkinned(src);
      g.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) o.visible = false; });
      g.material = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, vertexShader: ghostVert, fragmentShader: ghostFrag, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
      g.matrixAutoUpdate = true; g.visible = false; g.frustumCulled = false; g.renderOrder = 5; g.castShadow = false; root.add(g);
      set.list.push({ mesh: g, t: 1, life: .35 });
    }
    ghostSets.set(src.uuid, set); return set;
  }
  function ghostStep(dt) {
    for (const set of ghostSets.values()) for (const G of set.list) {
      if (G.t >= 1) { G.mesh.visible = false; continue; }
      G.t = Math.min(1, G.t + dt / G.life); G.mesh.visible = G.t < 1; G.mesh.material.uniforms.uA.value = .9 * Math.pow(1 - G.t, 1.5);
    }
  }

  // =====================================================================================
  // screen overlay (DOM). Every animation is stepped by update(); nothing uses CSS transitions.
  // =====================================================================================
  const style = document.createElement('style'); style.textContent = `
  .vbfx{position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden;font-family:"Hiragino Sans","Yu Gothic",system-ui,sans-serif}
  .vbfx canvas{position:absolute;display:block}
  .vbfx .flash{position:absolute;inset:0;opacity:0}
  .vbfx .bar{position:absolute;left:0;right:0;height:12vh;background:#05060a}
  .vbfx .bar.t{top:0;transform:translateY(-100%)}.vbfx .bar.b{bottom:0;transform:translateY(100%)}
  .vbfx .panel{position:absolute;left:0;right:0;overflow:hidden;will-change:transform}
  .vbfx .txt{position:absolute;color:#fff;white-space:nowrap;font-weight:900;font-style:italic;letter-spacing:.02em}
  .vbfx .callout{position:absolute;left:0;right:0;top:24%;text-align:center}
  .vbfx .callout b{display:inline-block;font:900 italic clamp(40px,6.4vw,92px)/1 "Hiragino Sans","Arial Black",system-ui,sans-serif;letter-spacing:.03em;color:#fff;-webkit-text-stroke:3px #0b0d16;paint-order:stroke fill}
  .vbfx .callout small{display:block;margin-top:6px;font:700 clamp(12px,1.4vw,18px)/1 system-ui,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#fff;text-shadow:0 2px 4px #000}
  .vbfx .counter{position:absolute;right:4vw;top:34%;text-align:right;color:#fff}
  .vbfx .counter b{display:block;padding:0 .14em 0 .1em;font:900 italic clamp(54px,7vw,104px)/1.05 "Hiragino Sans","Arial Black",system-ui,sans-serif;-webkit-text-stroke:3px #0b0d16;paint-order:stroke fill;background:linear-gradient(180deg,#fff 30%,#ffd36a 75%,#ff9d3a);-webkit-background-clip:text;background-clip:text;color:transparent}
  .vbfx .counter span{display:block;margin-top:-.15em;padding-right:.3em;font:800 italic clamp(16px,1.8vw,26px)/1 system-ui,sans-serif;letter-spacing:.2em;text-shadow:0 2px 0 #0b0d16,0 0 10px rgba(0,0,0,.6)}`;
  document.head.append(style);
  const ov = document.createElement('div'); ov.className = 'vbfx'; overlayParent.append(ov);
  const lines = document.createElement('canvas'); lines.style.cssText = 'inset:0;width:100%;height:100%'; ov.append(lines); const lg = lines.getContext('2d');
  const flashEl = document.createElement('div'); flashEl.className = 'flash'; ov.append(flashEl);
  const barT = document.createElement('div'); barT.className = 'bar t'; const barB = document.createElement('div'); barB.className = 'bar b'; ov.append(barT, barB);
  const W = () => ov.clientWidth || innerWidth, H = () => ov.clientHeight || innerHeight;

  // ---------- brush calligraphy: a glyph layer revealed by animated brush strokes ----------
  const JP = '"Hiragino Mincho ProN","Hiragino Mincho Pro","Yu Mincho","YuMincho","Noto Serif JP","Noto Serif CJK JP","MS Mincho",serif';
  function brushText(text, { size = 160, vertical = true, ink = '#0b0f1c', rim = '#ffffff', glow = null, rimW = .1 } = {}) {
    const chars = [...text], n = chars.length, pad = size * .22;
    const cw = vertical ? size * 1.2 : size * 1.08 * n, ch = vertical ? size * 1.06 * n : size * 1.2;
    const out = document.createElement('canvas'); out.width = Math.ceil(cw + pad * 2); out.height = Math.ceil(ch + pad * 2);
    const glyph = document.createElement('canvas'); glyph.width = out.width; glyph.height = out.height; const gg = glyph.getContext('2d');
    const boxes = chars.map((c, i) => vertical ? [pad + (cw - size) / 2, pad + i * size * 1.06] : [pad + i * size * 1.08, pad + (ch - size) / 2]);
    gg.textBaseline = 'top'; gg.textAlign = 'left'; gg.font = `900 ${size}px ${JP}`;
    // white rim and colored glow first, ink on top
    gg.lineJoin = 'round'; gg.miterLimit = 2;
    if (glow) { gg.shadowColor = glow; gg.shadowBlur = size * .18; }
    gg.strokeStyle = rim; gg.lineWidth = size * rimW; chars.forEach((c, i) => gg.strokeText(c, boxes[i][0], boxes[i][1]));
    gg.shadowBlur = 0; gg.fillStyle = ink; chars.forEach((c, i) => gg.fillText(c, boxes[i][0], boxes[i][1]));
    // dry brush: streaks scraped out of the ink in the stroke direction
    let s = 77; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    gg.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 90 * n; k++) { const x = pad + rnd() * cw, y = pad + rnd() * ch, l = size * (.1 + rnd() * .35), a = vertical ? Math.PI / 2 + (rnd() - .5) * .5 : (rnd() - .5) * .5; gg.strokeStyle = `rgba(0,0,0,${.25 + rnd() * .5})`; gg.lineWidth = .6 + rnd() * 1.8; gg.beginPath(); gg.moveTo(x, y); gg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); gg.stroke(); }
    gg.globalCompositeOperation = 'source-over';
    // generic stroke plan per character (covers any glyph in a calligraphic order)
    const plan = [[.12, .2, .88, .17], [.24, .12, .2, .92], [.5, .06, .53, .95], [.1, .5, .9, .53], [.8, .1, .74, .93], [.08, .84, .93, .87], [.18, .32, .9, .95], [.85, .3, .15, .7]];
    const strokes = []; boxes.forEach(([bx, by]) => plan.forEach(([x0, y0, x1, y1]) => strokes.push([bx + x0 * size, by + y0 * size, bx + x1 * size, by + y1 * size])));
    const splats = strokes.map(([, , x1, y1]) => ({ x: x1 + (rnd() - .5) * size * .3, y: y1 + (rnd() - .5) * size * .3, r: size * (.012 + rnd() * .03), on: rnd() < .35 }));
    const mask = document.createElement('canvas'); mask.width = out.width; mask.height = out.height; const mg = mask.getContext('2d');
    const og = out.getContext('2d');
    function draw(p) {
      og.clearRect(0, 0, out.width, out.height);
      if (p >= 1) { og.drawImage(glyph, 0, 0); } else if (p > 0) {
        mg.clearRect(0, 0, mask.width, mask.height); mg.lineCap = 'round'; mg.strokeStyle = '#000';
        const per = 1 / strokes.length;
        strokes.forEach(([x0, y0, x1, y1], i) => {
          const k = clamp((p - i * per * .82) / (per * 1.7), 0, 1); if (k <= 0) return;
          const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
          for (let b = -3; b <= 3; b++) { const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, o = b * size * .07; mg.lineWidth = size * (b === 0 ? .42 : .16); mg.beginPath(); mg.moveTo(x0 + nx / nl * o, y0 + ny / nl * o); mg.lineTo(ex + nx / nl * o * (1 - .3 * k), ey + ny / nl * o * (1 - .3 * k)); mg.stroke(); }
        });
        og.drawImage(mask, 0, 0); og.globalCompositeOperation = 'source-in'; og.drawImage(glyph, 0, 0); og.globalCompositeOperation = 'source-over';
      }
      // ink spatter where strokes have finished
      og.fillStyle = ink; const per = 1 / strokes.length;
      splats.forEach((sp, i) => { if (!sp.on || p < (i + 1) * per * .82 + per) return; og.beginPath(); og.arc(sp.x, sp.y, sp.r, 0, 7); og.fill(); });
    }
    draw(0); return { canvas: out, draw, w: out.width, h: out.height };
  }

  // ---------- painted backgrounds ----------
  function seigaiha(w, h, r, { a = '#d9a640', b = '#6b4613', bg = '#1c1408' } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, w, h); grad.addColorStop(0, a); grad.addColorStop(.5, '#f6dc8a'); grad.addColorStop(1, a);
    for (let row = -1, y = h + r; y > -r * 2; row++, y -= r * .5) {
      const off = (row % 2) * r;
      for (let x = -r * 2 + off; x < w + r * 2; x += r * 2) {
        for (let k = 5; k >= 1; k--) { g.beginPath(); g.arc(x, y, r * k / 5, Math.PI, 0); g.closePath(); g.fillStyle = k % 2 ? grad : bg; g.fill(); }
        g.strokeStyle = b; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.stroke();
      }
    }
    return c;
  }
  function energy(w, h, color, { seed = 3, dir = 1 } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    let s = seed * 9301 + 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const base = g.createLinearGradient(0, 0, w, 0); base.addColorStop(0, '#05070d'); base.addColorStop(.5, color); base.addColorStop(1, '#05070d');
    g.fillStyle = '#0a0d16'; g.fillRect(0, 0, w, h); g.globalAlpha = .55; g.fillStyle = base; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) { const y = rnd() * h, len = w * (.2 + rnd() * .7), x = dir > 0 ? rnd() * w - len * .3 : w - rnd() * w + len * .3, th = 1 + rnd() * 6; const lg2 = g.createLinearGradient(x, 0, x + len * dir, 0); lg2.addColorStop(0, 'rgba(255,255,255,0)'); lg2.addColorStop(.8, i % 3 ? color : '#ffffff'); lg2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg2; g.globalAlpha = .25 + rnd() * .55; g.fillRect(Math.min(x, x + len * dir), y, len, th); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return c;
  }
  function inkSplatter(w, h, seed, color = '#0b0f1c') {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    let s = seed * 31 + 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; g.fillStyle = color;
    for (let i = 0; i < 4; i++) { const x = rnd() * w, y = rnd() * h, r = 8 + rnd() * 26; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); for (let k = 0; k < 14; k++) { const a = rnd() * 6.28, d = r * (1.2 + rnd() * 2.6), rr = 1 + rnd() * r * .25; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 7); g.fill(); } }
    return c;
  }
  function brushBand(w, h, color, seed = 1) { // a dry-brush stroke used under callouts and as panel edges
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    let s = seed * 131 + 17; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.fillStyle = color;
    for (let i = 0; i < 46; i++) { const y = h * (.18 + rnd() * .64), th = h * (.04 + rnd() * .12), x0 = w * rnd() * .08, x1 = w * (.86 + rnd() * .14); g.globalAlpha = .55 + rnd() * .45; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(w * .5, y - th * 1.5 * (rnd() - .5), x1, y + (rnd() - .5) * th); g.lineTo(x1, y + th); g.quadraticCurveTo(w * .5, y + th * (1 + rnd() * .4), x0 + w * .02, y + th * .7); g.fill(); }
    g.globalAlpha = 1; return c;
  }

  // ---------- live portraits ----------
  const portraitCam = new THREE.PerspectiveCamera(30, 1, .05, 30); portraitCam.layers.set(PORTRAIT_LAYER);
  const pKey = new THREE.DirectionalLight(0xffffff, 2.6), pRim = new THREE.DirectionalLight(0xffffff, 5), pFill = new THREE.HemisphereLight(0xdfe8ff, 0x302838, 1.25);
  for (const l of [pKey, pRim, pFill]) { l.layers.set(PORTRAIT_LAYER); root.add(l); } root.add(pKey.target, pRim.target);
  const RT = { W: 512, H: 384 };
  const portraitRT = renderer ? new THREE.WebGLRenderTarget(RT.W, RT.H, { samples: 4 }) : null;
  const pBuf = new Uint8Array(RT.W * RT.H * 4);
  const LUT = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) { const x = i / 255 * 1.08, a = (x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), v = a <= .0031308 ? a * 12.92 : 1.055 * Math.pow(a, 1 / 2.4) - .055; LUT[i] = Math.round(clamp(v, 0, 1) * 255); }
  const _clr = new THREE.Color(), _hd = V3(), _fw = V3(), _sd = V3(), _wq = new THREE.Quaternion();
  function setLayer(obj, on) { obj.traverse(o => on ? o.layers.enable(PORTRAIT_LAYER) : o.layers.disable(PORTRAIT_LAYER)); }
  // render a fighter's face into ctx (a 2D canvas context sized RT.W x RT.H)
  function renderPortrait(who, ctx, { rim = 0xffffff, side = 1, dist = .95, lift = .02, fov = 30, roll = 0 } = {}) {
    if (!renderer || !who?.userData?.bones?.head) return;
    who.updateMatrixWorld(true);
    who.userData.bones.head.getWorldPosition(_hd); who.getWorldQuaternion(_wq); _fw.set(0, 0, 1).applyQuaternion(_wq); _sd.set(1, 0, 0).applyQuaternion(_wq);
    portraitCam.fov = fov; portraitCam.aspect = RT.W / RT.H; portraitCam.updateProjectionMatrix();
    portraitCam.position.copy(_hd).addScaledVector(_fw, dist).addScaledVector(_sd, .3 * side * dist).add(V3(0, .07 + lift, 0));
    portraitCam.up.set(Math.sin(roll), Math.cos(roll), 0).applyQuaternion(_wq);
    portraitCam.lookAt(_hd.x, _hd.y + .045, _hd.z);
    pKey.position.copy(_hd).addScaledVector(_fw, 2).addScaledVector(_sd, 1.2 * side).add(V3(0, 1.5, 0)); pKey.target.position.copy(_hd);
    pRim.position.copy(_hd).addScaledVector(_fw, -2).addScaledVector(_sd, -1.5 * side).add(V3(0, .8, 0)); pRim.target.position.copy(_hd); pRim.color.set(rim);
    pKey.updateMatrixWorld(); pRim.updateMatrixWorld(); pKey.target.updateMatrixWorld(); pRim.target.updateMatrixWorld();
    const prevRT = renderer.getRenderTarget(), prevAuto = renderer.autoClear, prevAlpha = renderer.getClearAlpha(); renderer.getClearColor(_clr);
    const prevBg = scene.background, prevShadow = renderer.shadowMap.needsUpdate;
    setLayer(who, true); scene.background = null;
    renderer.setRenderTarget(portraitRT); renderer.setClearColor(0x000000, 0); renderer.autoClear = true; renderer.clear();
    renderer.render(scene, portraitCam);
    renderer.readRenderTargetPixels(portraitRT, 0, 0, RT.W, RT.H, pBuf);
    renderer.setRenderTarget(prevRT); renderer.setClearColor(_clr, prevAlpha); renderer.autoClear = prevAuto; scene.background = prevBg; renderer.shadowMap.needsUpdate = prevShadow;
    setLayer(who, false);
    const img = ctx.__img || (ctx.__img = ctx.createImageData(RT.W, RT.H)), d = img.data;
    for (let y = 0; y < RT.H; y++) { const src = (RT.H - 1 - y) * RT.W * 4, dst = y * RT.W * 4; for (let x = 0; x < RT.W * 4; x += 4) { const a = pBuf[src + x + 3]; d[dst + x + 3] = a; if (a) { const k = a < 255 ? 255 / a : 1; d[dst + x] = LUT[Math.min(255, pBuf[src + x] * k) | 0]; d[dst + x + 1] = LUT[Math.min(255, pBuf[src + x + 1] * k) | 0]; d[dst + x + 2] = LUT[Math.min(255, pBuf[src + x + 2] * k) | 0]; } } }
    ctx.putImageData(img, 0, 0);
  }

  // ---------- screen effect state ----------
  let linesDirty = false, speed = null, flashS = null, letter = { v: 0, target: 0, dur: .3 }, impact = null, cut = null, vs = null, call = null, counter = null;
  const savedFilter = canvas ? canvas.style.filter : '';

  function drawLines(dt) {
    const w = W(), h = H(); if (lines.width !== w || lines.height !== h) { lines.width = w; lines.height = h; }
    if (!speed) { if (linesDirty) { lg.clearRect(0, 0, w, h); linesDirty = false; } return; }
    lg.clearRect(0, 0, w, h); linesDirty = true;
    speed.t += dt; speed.tick -= dt; const k = 1 - speed.t / speed.dur; if (k <= 0) { speed = null; return; }
    if (speed.tick > 0 && speed.cache) { lg.drawImage(speed.cache, 0, 0); lines.style.opacity = Math.min(1, k * 1.6); return; }
    speed.tick = 1 / 30; // the lines "boil" at 30 fps like hand-drawn frames
    const c = speed.cache || (speed.cache = document.createElement('canvas')); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = speed.color; const S = speed.strength;
    if (speed.kind === 'radial') {
      const cx = speed.center[0] * w, cy = speed.center[1] * h, R = Math.hypot(w, h) * .75, n = Math.round(90 * S);
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r0 = R * (.32 + Math.random() * .3) * (1.1 - .25 * S), wd = (2 + Math.random() * 9) * (.6 + S * .5) / R; g.globalAlpha = .45 + Math.random() * .55; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a - wd) * R * 1.3, cy + Math.sin(a - wd) * R * 1.3); g.lineTo(cx + Math.cos(a + wd) * R * 1.3, cy + Math.sin(a + wd) * R * 1.3); g.fill(); }
    } else {
      const n = Math.round(46 * S);
      for (let i = 0; i < n; i++) { const y = Math.random() * h, len = w * (.25 + Math.random() * .6), x = Math.random() * w * 1.2 - len * .3, th = 1 + Math.random() * 7 * S; const gr = g.createLinearGradient(x, 0, x + len, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, speed.color); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.globalAlpha = .4 + Math.random() * .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y - th * .5); g.lineTo(x + len, y + th * .5); g.fill(); }
    }
    g.globalAlpha = 1; lg.drawImage(c, 0, 0); lines.style.opacity = Math.min(1, k * 1.6);
  }

  // cut-in panel: built once per call, animated per frame
  function buildPanel({ who, side, art, name, kanji, color, big = false }) {
    // laid out in screen terms: portrait on the near third, brush kanji in the middle, the art's
    // name on the far side. The panel is a little wider than the screen so the slant never shows an edge.
    const w = W(), h = H(), ph = Math.round(h * (big ? .5 : .44)), pw = Math.round(w * 1.16), ox = w * .08;
    const L = side === 'left', sx = x => x + ox; // screen x -> panel x
    const el = document.createElement('div'); el.className = 'panel'; el.style.height = ph + 'px'; el.style.left = (-ox) + 'px'; el.style.width = pw + 'px';
    el.style.clipPath = L ? 'polygon(0 12%,100% 0,100% 88%,0 100%)' : 'polygon(0 0,100% 12%,100% 100%,0 88%)';
    const bg = energy(Math.round(pw / 2), Math.round(ph / 2), color, { seed: L ? 3 : 8, dir: L ? 1 : -1 }); bg.style.cssText = 'left:0;top:0;width:100%;height:100%'; el.append(bg);
    const pat = seigaiha(Math.round(pw / 2), Math.round(ph / 2), Math.max(14, ph / 13), { bg: '#120d06' }); pat.style.cssText = `left:0;top:0;width:100%;height:100%;opacity:${big ? .6 : .3};mix-blend-mode:screen`; el.append(pat);
    const por = document.createElement('canvas'); por.width = RT.W; por.height = RT.H;
    const ph2 = ph * 1.16, pw2 = ph2 * RT.W / RT.H, px = L ? sx(w * .02) : sx(w * .98 - pw2);
    por.style.cssText = `top:${-ph * .08}px;height:${ph2}px;width:${pw2}px;left:${px}px;filter:drop-shadow(0 0 ${Math.round(ph * .025)}px ${color}) drop-shadow(0 0 2px #000)`;
    const n = [...(kanji || '')].length || 1;
    const kj = brushText(kanji || '', { size: Math.round(ph * (n > 1 ? .4 : .7)), vertical: true, glow: color });
    const kh = ph * (n > 1 ? .98 : .9), kw = kh * kj.w / kj.h, kx = L ? sx(w * .02) + pw2 * .92 : sx(w * .98 - pw2 * .92 - kw);
    kj.canvas.style.cssText = `top:${ph * .02}px;height:${kh}px;width:${kw}px;left:${kx}px`;
    const splat = inkSplatter(400, 220, L ? 2 : 9); splat.style.cssText = `top:${ph * .06}px;left:${L ? kx - kw * .3 : kx - kw * .5}px;width:${kw * 1.8}px;height:${ph * .7}px;opacity:.8`;
    el.append(splat, por, kj.canvas);
    const label = document.createElement('div'); label.className = 'txt';
    const avail = L ? w * .96 - (kx - ox + kw) - w * .03 : (kx - ox) - w * .08, chars = Math.max(6, (name || '').length);
    const fs = Math.round(Math.max(18, Math.min(ph * .15, w * .045, avail / (chars * .62))));
    label.innerHTML = `<div style="font:800 italic ${Math.round(fs * .42)}px/1 system-ui,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${color};text-shadow:0 2px 0 #000;margin-bottom:${fs * .12}px">${art || ''}</div><div style="font:900 italic ${fs}px/1.02 'Hiragino Sans','Arial Black',system-ui,sans-serif;-webkit-text-stroke:${Math.max(2, fs * .06)}px #0b0d16;paint-order:stroke fill;text-shadow:0 0 ${fs * .3}px ${color}">${name || ''}</div>`;
    label.style.cssText += `bottom:${ph * .16}px;` + (L ? `right:${pw - sx(w * .96)}px;text-align:right` : `left:${sx(w * .04)}px;text-align:left`);
    el.append(label);
    const edge = brushBand(1200, 60, '#ffffff', L ? 4 : 6); edge.style.cssText = `left:0;width:100%;height:${ph * .05}px;top:${L ? ph * .035 : ph * .885}px;opacity:.95;transform:skewY(${L ? -5.6 : 5.6}deg)`; el.append(edge);
    const ctx = por.getContext('2d');
    return { el, kj, label, ctx, por, ph, pw, L };
  }

  function cutStep(dt) {
    if (!cut) return; cut.t += dt; const t = cut.t, D = cut.dur, P = cut.p;
    const inK = ease.back(t / .2), outK = ease.in2((t - (D - .24)) / .24);
    const dir = P.L ? 1 : -1, x = (-1.05 * (1 - inK) + 1.1 * outK) * W() * dir;
    P.el.style.transform = `translateX(${x}px) skewY(${dir * -1.5}deg) scaleY(${.6 + .4 * ease.out3(t / .18)})`;
    P.el.style.opacity = t > D - .1 ? Math.max(0, (D - t) / .1) : 1;
    P.kj.draw(clamp((t - .12) / .7, 0, 1));
    const lk = ease.out3((t - .22) / .25); P.label.style.transform = `translateX(${(1 - lk) * 80 * -dir}px)`; P.label.style.opacity = lk;
    if (P.who && t < D && (t < .3 || (cut.frame = (cut.frame || 0) + 1) % 2)) renderPortrait(P.who, P.ctx, { rim: cut.rim, side: P.L ? 1 : -1, dist: .62 - .05 * ease.out3(t / D), roll: .12 * dir });
    if (t >= D) { P.el.remove(); cut = null; }
  }

  function vsStep(dt) {
    if (!vs) return; vs.t += dt; const t = vs.t, D = vs.dur;
    // a lens streak cuts diagonally across first
    const sk = vs.streak, st = clamp(t / .32, 0, 1);
    sk.style.opacity = st < 1 ? Math.sin(st * Math.PI) : 0; sk.style.transform = `rotate(-14deg) scaleX(${.1 + 2.2 * ease.out3(st)})`;
    const fr = vs.frame++;
    vs.panels.forEach((P, i) => {
      const dir = P.L ? 1 : -1, inK = ease.back((t - .18 - i * .06) / .26), outK = ease.in2((t - (D - .45)) / .35);
      const x = (-1.1 * (1 - inK) - 1.15 * outK) * W() * dir;
      P.el.style.transform = `translateX(${x}px) skewY(${dir * -2}deg)`;
      P.el.style.opacity = t < .18 + i * .06 ? 0 : 1;
      P.kj.draw(clamp((t - .4 - i * .1) / .85, 0, 1));
      const lk = ease.out3((t - .55 - i * .1) / .3); P.label.style.opacity = lk; P.label.style.transform = `translateX(${(1 - lk) * 60 * -dir}px)`;
      if (P.who && t < D - .1 && (fr % 2 === i || t < .6)) renderPortrait(P.who, P.ctx, { rim: P.rim, side: P.L ? 1 : -1, dist: .78, roll: .08 * dir });
    });
    const sl = vs.slash, sv = clamp((t - .5) / .25, 0, 1); sl.style.opacity = t < D - .4 ? ease.out3(sv) : Math.max(0, 1 - (t - (D - .4)) / .2); sl.style.transform = `translate(-50%,-50%) rotate(-62deg) scaleX(${ease.out3(sv)})`;
    if (t >= D - .45 && !vs.flashed) { vs.flashed = true; api.flash('#ffffff', .3, .9); }
    if (t >= D) { vs.root.remove(); vs = null; }
  }

  function calloutStep(dt) {
    if (!call) return; call.t += dt; const t = call.t, D = call.dur;
    const s = 1 + .7 * (1 - ease.out3(t / .16)), o = t < D - .2 ? 1 : Math.max(0, (D - t) / .2);
    call.b.style.transform = `scale(${s}) rotate(${-5 + 3 * ease.out3(t / .2)}deg) translateY(${t > D - .2 ? -(t - D + .2) * 120 : 0}px)`; call.el.style.opacity = o;
    call.under.style.transform = `translateX(-50%) scaleX(${ease.out3((t - .05) / .2)})`;
    if (t >= D) { call.el.remove(); call = null; }
  }
  function counterStep(dt) {
    if (!counter) return; counter.t += dt; counter.idle += dt;
    const bump = 1 + .45 * Math.max(0, 1 - counter.t / .14);
    counter.b.style.transform = `scale(${bump}) rotate(-4deg)`;
    const o = counter.idle < 1.4 ? 1 : Math.max(0, 1 - (counter.idle - 1.4) / .35); counter.el.style.opacity = o;
    counter.el.style.transform = `translateX(${(1 - ease.out3(counter.life / .15)) * 60}px)`; counter.life += dt;
    if (o <= 0) { counter.el.remove(); counter = null; }
  }

  // =====================================================================================
  // public API
  // =====================================================================================
  const api = {
    root, overlay: ov, layer: PORTRAIT_LAYER,
    update(rawDt, dt, camera) {
      rawDt = Math.min(rawDt, .1); dt = Math.min(dt, .1);
      if (camera) { ADD.update(dt, camera); ALPHA.update(dt, camera); }
      debrisStep(dt); ringStep(dt); arcStep(dt); ghostStep(dt);
      drawLines(rawDt);
      if (flashS) { flashS.t += rawDt; const k = flashS.t / flashS.dur; flashEl.style.opacity = k >= 1 ? 0 : flashS.op * (k < .12 ? k / .12 : Math.pow(1 - (k - .12) / .88, 1.4)); if (k >= 1) flashS = null; }
      if (letter.v !== letter.target) { const s = rawDt / letter.dur; letter.v = letter.target > letter.v ? Math.min(letter.target, letter.v + s) : Math.max(letter.target, letter.v - s); const e = ease.inOut(letter.v); barT.style.transform = `translateY(${-100 + 100 * e}%)`; barB.style.transform = `translateY(${100 - 100 * e}%)`; }
      if (impact) { impact.t += rawDt; if (impact.t >= impact.dur) { if (canvas) canvas.style.filter = savedFilter; impact.over?.remove(); impact = null; } }
      cutStep(rawDt); vsStep(rawDt); calloutStep(rawDt); counterStep(rawDt);
    },

    sparks(at, { color = 0xffd27a, count = 30, speed = 7, streak = true, up = 1.5, spread = 1, dir = null } = {}) {
      const c = col(color), hot = c.clone().lerp(new THREE.Color(1, 1, 1), .6);
      for (let i = 0; i < count; i++) {
        const v = V3(rand(-1, 1), rand(-.4, 1), rand(-1, 1)).normalize();
        if (dir) v.lerp(dir.clone().normalize(), .6).normalize();
        v.multiplyScalar(speed * rand(.35, 1.15) * spread); v.y += up * rand(.5, 1.3);
        ADD.spawn({ p: at, v, g: 13, drag: 1.2, life: rand(.25, .6), s0: rand(.045, .085), s1: .02, cell: CELL.streak, c: hot, c2: c.clone().multiplyScalar(.75), stretch: streak ? .06 : 0, aspect: streak ? 3.5 : 1, fadePow: .8, a: 1 });
      }
    },

    hitBurst(at, { color = 0x9fe8ff, size = 1, heavy = false } = {}) {
      const c = col(color), S = size * (heavy ? 1.45 : 1);
      ADD.spawn({ p: at, life: .2, s0: 1.6 * S, s1: 2.6 * S, cell: CELL.glow, c: 0xffffff, a: .9, fadeIn: .01 });
      ADD.spawn({ p: at, life: .22, s0: .6 * S, s1: 3.6 * S, cell: CELL.star, c: 0xffffff, c2: c, rot: rand(0, 6.28), a: 1, fadeIn: .005, fadePow: 1.6 });
      ADD.spawn({ p: at, life: .28, s0: .8 * S, s1: 2.8 * S, cell: CELL.star2, c, rot: rand(0, 6.28), a: .95, fadeIn: .02, fadePow: 1.2 });
      ADD.spawn({ p: at, life: .24, s0: .5 * S, s1: 2.6 * S, cell: CELL.ring, c, rot: rand(0, 6.28), a: .7, fadeIn: .01, fadePow: 1.4 });
      const n = heavy ? 16 : 10;
      for (let i = 0; i < n; i++) { // jagged white shards flying out (manga impact)
        const v = V3(rand(-1, 1), rand(-.6, 1), rand(-1, 1)).normalize().multiplyScalar(rand(5, 13) * S);
        ALPHA.spawn({ p: at.clone().addScaledVector(v, .02), v, g: 2, drag: 5, life: rand(.18, .32), s0: rand(.16, .3) * S, s1: .04, cell: Math.random() < .5 ? CELL.shardA : CELL.shardB, c: 0xffffff, a: 1, stretch: .035, aspect: 4, fadeIn: .005, fadePow: .6, minLen: .8 * S });
      }
      if (heavy) for (let i = 0; i < 8; i++) { // black ink shards over the white ones
        const v = V3(rand(-1, 1), rand(-.3, 1), rand(-1, 1)).normalize().multiplyScalar(rand(4, 9) * S);
        ALPHA.spawn({ p: at.clone().addScaledVector(v, .03), v, g: 3, drag: 5, life: rand(.2, .34), s0: rand(.12, .22) * S, s1: .03, cell: CELL.shardB, c: 0x0b0d14, a: 1, stretch: .03, aspect: 4, fadeIn: .005, fadePow: .5, minLen: .6 * S });
      }
      api.sparks(at, { color: c, count: heavy ? 34 : 18, speed: heavy ? 11 : 8, up: 1 });
    },

    clashBurst(at, { color = 0xffd27a } = {}) {
      const c = col(color);
      ADD.spawn({ p: at, life: .18, s0: 1.2, s1: 2.2, cell: CELL.glow, c: 0xffffff, a: 1, fadeIn: .005 });
      for (const r of [1, -1]) { ADD.spawn({ p: at, life: .32, s0: .12, s1: .42, cell: CELL.beam, c: 0xffffff, c2: c, rot: Math.PI / 2 + r * .36, aspect: 9, a: 1, fadeIn: .01, fadePow: 1.3 }); ADD.spawn({ p: at, life: .26, s0: .3, s1: .7, cell: CELL.beam, c, rot: Math.PI / 2 + r * .36, aspect: 6, a: .55, fadeIn: .01, fadePow: 1.3 }); }
      ADD.spawn({ p: at, life: .2, s0: .4, s1: 1.8, cell: CELL.star, c: 0xffffff, c2: c, rot: rand(0, 6), a: 1, fadeIn: .005 });
      for (let i = 0; i < 46; i++) { // the fountain: mostly upward, narrow
        const v = V3(rand(-.35, .35), rand(.7, 1), rand(-.35, .35)).normalize().multiplyScalar(rand(5, 13));
        ADD.spawn({ p: at, v, g: 14, drag: .8, life: rand(.3, .75), s0: rand(.04, .075), s1: .015, cell: CELL.streak, c: 0xfff4d0, c2: c.clone().lerp(new THREE.Color(0xff5a20), .5), stretch: .05, aspect: 3, fadePow: .7 });
      }
      api.sparks(at, { color: c, count: 22, speed: 9, up: .5 });
    },

    dust(at, { size = 1, dir = null, count = 8, color = 0xd8c8a8 } = {}) {
      const d = dir ? dir.clone().setY(0).normalize() : null;
      for (let i = 0; i < count; i++) {
        const a = rand(0, 6.28), v = V3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(rand(.6, 2.2) * size);
        if (d) v.addScaledVector(d, -rand(1, 2.5) * size);
        v.y = rand(.3, 1.2) * size;
        const p = at.clone().add(V3(rand(-.2, .2) * size, .12 * size, rand(-.2, .2) * size));
        ALPHA.spawn({ p, v, g: -.2, drag: 2.6, life: rand(.5, .95), s0: rand(.3, .55) * size, s1: rand(.9, 1.5) * size, cell: Math.random() < .5 ? CELL.puffA : CELL.puffB, c: color, c2: new THREE.Color(color).multiplyScalar(.8), rot: rand(0, 6.28), vr: rand(-1, 1), a: .92, fadeIn: .05, fadePow: 1.6 });
      }
    },

    debris(at, { count = 14, power = 1, color = 0xc8b48e } = {}) {
      for (let i = 0; i < count; i++) {
        const d = DB[dbi++ % DEB_CAP]; d.alive = true; d.age = 0; d.life = rand(1.1, 1.8); d.floor = at.y;
        d.p.copy(at).add(V3(rand(-.4, .4), .1, rand(-.4, .4)));
        d.v.set(rand(-1, 1) * 3.2, rand(5, 10), rand(-1, 1) * 3.2).multiplyScalar(power);
        d.q.setFromEuler(new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6))); d.w.set(rand(-12, 12), rand(-12, 12), rand(-12, 12));
        const s = rand(.5, 1.9) * Math.sqrt(power); d.s.set(s * rand(.8, 1.4), s * rand(.5, 1), s * rand(.8, 1.4));
      }
      // the earth column (beige, toon puffs pushed upward)
      for (let i = 0; i < 16; i++) {
        const p = at.clone().add(V3(rand(-.35, .35), rand(0, .3), rand(-.35, .35)));
        ALPHA.spawn({ p, v: V3(rand(-.6, .6), rand(2, 7.5) * power, rand(-.6, .6)), g: 4, drag: 2.2, life: rand(.6, 1.1), s0: rand(.5, .8) * power, s1: rand(1.1, 1.9) * power, cell: Math.random() < .5 ? CELL.puffA : CELL.puffB, c: color, c2: new THREE.Color(color).multiplyScalar(.72), rot: rand(0, 6.28), vr: rand(-1, 1), a: .95, fadeIn: .03, fadePow: 1.8 });
      }
      api.dust(at, { size: 1.2 * power, count: 8, color });
    },

    shockwave(at, { color = 0xffffff, radius = 3, dur = .7 } = {}) {
      const R = RINGS[rgi++ % RINGS.length]; R.p.copy(at); R.r = radius; R.t = 0; R.dur = dur;
      for (const m of [R.ring, R.swirl, R.dome]) m.material.uniforms.uC.value.set(color);
      ADD.spawn({ p: at.clone().add(V3(0, .6, 0)), life: .25, s0: radius * .6, s1: radius * 1.4, cell: CELL.glow, c: color, a: .85, fadeIn: .01 });
    },

    slashArc({ center, quat, radius = 1.4, arc = Math.PI * 1.1, start = 0, color = [0x6fe7ff, 0xe8fbff], width = .5, life = .5, style = 'water', layers = 3 } = {}) {
      const A = ARCS[arci++ % ARCS.length]; A.t = 0; A.life = life; A.n = clamp(layers, 1, 3); A.emitAcc = 0;
      width = Math.max(width, radius * .3); const [c0, c1] = Array.isArray(color) ? color : [color, 0xffffff];
      A.o = { radius, arc, start, width, style, c0: col(c0), c1: col(c1) };
      const seed = rand(0, 50);
      A.layers.forEach((m, l) => {
        m.position.copy(center || V3()); m.quaternion.copy(quat || new THREE.Quaternion()); m.updateMatrixWorld();
        const u = m.material.uniforms; u.uT.value = 0; u.uArc.value = arc; u.uStart.value = start + (l ? rand(-.08, .08) : 0);
        u.uRadius.value = radius * (1 + [0, .07, -.06][l]); u.uWidth.value = width * [1, .72, .55][l];
        u.uC0.value.copy(A.o.c0); u.uC1.value.copy(A.o.c1); u.uStyle.value = style === 'ember' ? 1 : 0; u.uSeed.value = seed + l * 13; u.uAlpha.value = [1, .38, .3][l];
      });
    },

    afterimage(fighter, { color = 0x9fe8ff, life = .35 } = {}) {
      const set = ghostSet(fighter); if (!set) return;
      const G = set.list[set.next++ % set.list.length], g = G.mesh, src = set.src;
      src.updateMatrixWorld(true);
      const sb = src.skeleton.bones, gb = g.skeleton.bones;
      for (let i = 0; i < sb.length; i++) { gb[i].position.copy(sb[i].position); gb[i].quaternion.copy(sb[i].quaternion); gb[i].scale.copy(sb[i].scale); }
      src.matrixWorld.decompose(g.position, g.quaternion, g.scale); g.updateMatrixWorld(true);
      g.material.uniforms.uC.value.set(color); G.t = 0; G.life = life; g.visible = true;
    },

    speedLines(strength = 1, { kind = 'radial', color = '#ffffff', center = [.5, .5], dur = .4 } = {}) { speed = { strength, kind, color, center, dur, t: 0, tick: 0, cache: speed?.cache }; },

    impactFrame(kind = 'ink', dur = .07) {
      if (!canvas) return;
      const f = kind === 'invert' ? 'invert(1) contrast(1.35) saturate(1.4)' : kind === 'white' ? 'brightness(2.6) saturate(.25) contrast(1.4)' : 'grayscale(1) contrast(9) invert(1)';
      canvas.style.filter = f; impact?.over?.remove();
      let over = null;
      if (kind === 'ink') { over = document.createElement('canvas'); over.width = 640; over.height = 360; over.style.cssText = 'inset:0;width:100%;height:100%'; const g = over.getContext('2d'); g.fillStyle = '#000'; for (let i = 0; i < 3; i++) { const y = 230 + Math.random() * 110, th = 4 + Math.random() * 9, x0 = -20 + Math.random() * 200, x1 = 420 + Math.random() * 240; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y - th * 1.4, x1, y + (Math.random() - .5) * 20); g.quadraticCurveTo((x0 + x1) / 2, y + th, x0 + 30, y + th * .6); g.fill(); } ov.append(over); }
      impact = { t: 0, dur, over };
    },

    flash(color = '#ffffff', dur = .25, opacity = .85) { flashEl.style.background = color; flashS = { t: 0, dur, op: opacity }; },

    letterbox(on, dur = .3) { letter.target = on ? 1 : 0; letter.dur = dur; },

    cutIn({ who, side = 'left', art = 'Veil Art', name = '', kanji = '', color = '#6fe7ff' } = {}, dur = 1.4) {
      if (cut) cut.p.el.remove();
      const p = buildPanel({ who, side, art, name, kanji, color }); p.who = who; p.el.style.top = (H() * .2) + 'px'; ov.append(p.el);
      cut = { t: 0, dur, p, rim: color };
      if (who) renderPortrait(who, p.ctx, { rim: color, side: p.L ? 1 : -1, dist: .62 });
      cutStep(0);
    },

    vsSplash({ left, right } = {}, dur = 2.4) {
      if (vs) vs.root.remove();
      const rootEl = document.createElement('div'); rootEl.style.cssText = 'position:absolute;inset:0'; ov.append(rootEl);
      const dim = document.createElement('div'); dim.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,.15),rgba(0,0,0,.55))'; rootEl.append(dim);
      const panels = [];
      [[left, 'left', .02], [right, 'right', .5]].forEach(([o, side, top]) => {
        if (!o) return;
        const P = buildPanel({ who: o.who, side, art: o.title || '', name: o.name || '', kanji: o.kanji || '', color: o.color || '#ffffff', big: true });
        P.el.style.top = (H() * top) + 'px'; P.who = o.who; P.rim = o.color || '#ffffff'; rootEl.append(P.el); panels.push(P);
        if (o.who) renderPortrait(o.who, P.ctx, { rim: P.rim, side: P.L ? 1 : -1, dist: .78 });
      });
      const streak = document.createElement('div'); streak.style.cssText = 'position:absolute;left:-10%;right:-10%;top:50%;height:6px;margin-top:-3px;background:linear-gradient(90deg,transparent,#9fd8ff 30%,#fff 50%,#9fd8ff 70%,transparent);box-shadow:0 0 30px 8px rgba(110,190,255,.85),0 0 90px 20px rgba(60,120,255,.5);transform-origin:50% 50%;opacity:0'; rootEl.append(streak);
      const slash = document.createElement('div'); slash.style.cssText = 'position:absolute;left:50%;top:50%;width:130vh;height:10px;background:linear-gradient(90deg,transparent,#fff 20%,#fff 80%,transparent);box-shadow:0 0 24px 6px rgba(255,255,255,.75);opacity:0;transform-origin:50% 50%'; rootEl.append(slash);
      vs = { t: 0, dur, panels, root: rootEl, streak, slash, frame: 0, flashed: false };
      vsStep(0);
    },

    callout(text, { sub = '', color = '#ffffff', dur = 1.0 } = {}) {
      call?.el.remove();
      const el = document.createElement('div'); el.className = 'callout';
      const b = document.createElement('b'); b.textContent = text; b.style.textShadow = `0 0 18px ${color},0 4px 0 #0b0d16`; b.style.color = color === '#ffffff' ? '#fff' : '#fff';
      const under = brushBand(600, 70, color, text.length); under.style.cssText = 'left:50%;top:78%;width:min(54vw,620px);height:clamp(22px,3vw,40px);transform-origin:0 50%;z-index:-1;opacity:.95';
      const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;display:inline-block'; wrap.append(under, b);
      el.append(wrap); if (sub) { const s = document.createElement('small'); s.textContent = sub; el.append(s); }
      ov.append(el); call = { el, b, under, t: 0, dur }; calloutStep(0);
    },

    hitCounter(n) {
      if (!n) { counter?.el.remove(); counter = null; return; }
      if (!counter) { const el = document.createElement('div'); el.className = 'counter'; el.innerHTML = '<b></b><span>Hits</span>'; ov.append(el); counter = { el, b: el.querySelector('b'), t: 0, idle: 0, life: 0 }; }
      counter.b.textContent = n; counter.t = 0; counter.idle = 0; counterStep(0);
    },

    clear() {
      ADD.clear(); ALPHA.clear(); for (const d of DB) d.alive = false; debris3.visible = false;
      for (const R of RINGS) R.t = 1; for (const A of ARCS) A.t = 1; for (const s of ghostSets.values()) for (const G of s.list) G.t = 1;
      ringStep(0); arcStep(0); ghostStep(0);
      speed = null; lg.clearRect(0, 0, lines.width, lines.height); flashS = null; flashEl.style.opacity = 0;
      letter.target = letter.v = 0; barT.style.transform = 'translateY(-100%)'; barB.style.transform = 'translateY(100%)';
      if (impact) { if (canvas) canvas.style.filter = savedFilter; impact.over?.remove(); impact = null; }
      cut?.p.el.remove(); cut = null; vs?.root.remove(); vs = null; call?.el.remove(); call = null; counter?.el.remove(); counter = null;
    },

    dispose() {
      api.clear(); scene.remove(root); ov.remove(); style.remove();
      for (const p of [ADD, ALPHA]) { p.geo.dispose(); p.mat.dispose(); }
      atlas.dispose(); debGeo.dispose(); debMat.dispose(); ringGeo.dispose(); domeGeo.dispose(); arcGeo.dispose();
      for (const R of RINGS) for (const m of [R.ring, R.swirl, R.dome]) m.material.dispose();
      for (const A of ARCS) for (const m of A.layers) m.material.dispose();
      for (const s of ghostSets.values()) for (const G of s.list) G.mesh.material.dispose();
      portraitRT?.dispose();
    },
    // warm the portrait shader variants (call once after the fighters exist, before the first cut-in)
    prewarm(fighters = []) { const c = document.createElement('canvas'); c.width = RT.W; c.height = RT.H; const g = c.getContext('2d'); for (const f of fighters) renderPortrait(f, g); },
  };
  return api;
}
