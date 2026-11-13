// Gear lab: stress-test the scabbard against the sculpted body.
// ?who=haru|mitsuki|both  ?pose=<name>  ?cam=front|back|left|top|three|low  ?drawn=1  ?clip=<name>&t=<s>
// window.__GEAR__ = { ready, report, set(opts), sweep(clip, who), poses }
import * as THREE from 'three';
import makeFighter from '../assets/fighter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; document.body.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb4b8);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .5;
scene.add(new THREE.HemisphereLight(0xc8e0ea, 0x6a7258, 1.4)); const sun = new THREE.DirectionalLight(0xffe6c0, 3); sun.position.set(-3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshStandardMaterial({ color: 0x8a8a72, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .05, 100);

const ids = (q.get('who') || 'both') === 'both' ? ['haru', 'mitsuki'] : [q.get('who')];
const fighters = ids.map((id, i) => { const f = makeFighter(THREE, id); f.position.x = ids.length > 1 ? (i ? .7 : -.7) : 0; scene.add(f); return f; });
for (const f of fighters) { const U = f.userData; U.rest = {}; for (const n in U.bones) U.rest[n] = U.bones[n].position.clone(); }
let moves = null; try { moves = await import('../fighter-moves.js'); } catch (e) { console.warn(e); }
const mixers = fighters.map(f => moves ? moves.animate(THREE, f) : null);

// ---------- stress poses: Euler (x,y,z) per bone, plus a hips lift ----------
const E = (x = 0, y = 0, z = 0) => [x, y, z];
const poses = {
  rest: {},
  armsDown: { upperArmL: E(0, 0, -.75), upperArmR: E(0, 0, .75), forearmL: E(-.2), forearmR: E(-.2) },
  kneeChamber: { thighL: E(-1.75), shinL: E(2.1), footL: E(-.3), thighR: E(.08), _y: 0 },
  lungeLeft: { _y: -.24, thighL: E(-1.15), shinL: E(1.0), thighR: E(.55, 0, -.1), shinR: E(.55), spine: E(.15) },
  lungeRight: { _y: -.24, thighR: E(-1.15), shinR: E(1.0), thighL: E(.6, 0, .1), shinL: E(.55), spine: E(.15) },
  runA: { _y: -.06, thighL: E(-1.05), shinL: E(1.35), thighR: E(.55), shinR: E(1.0), spine: E(.22) },
  runB: { _y: -.06, thighR: E(-1.05), shinR: E(1.35), thighL: E(.6), shinL: E(1.1), spine: E(.22) },
  roundhouse: { hips: E(0, .5, -.25), thighL: E(-.7, 0, 1.45), shinL: E(.35), thighR: E(0, 0, .2), spine: E(0, 0, -.35), chest: E(0, .2, -.2) },
  backKick: { hips: E(.35), thighL: E(.95), shinL: E(.4), spine: E(.35), chest: E(.15) },
  tuck: { _y: .5, thighL: E(-1.95), shinL: E(2.3), thighR: E(-1.9), shinR: E(2.3), spine: E(.3) },
  splitSide: { _y: -.35, thighL: E(0, 0, 1.15), shinL: E(0), thighR: E(0, 0, -1.1), spine: E(.25) },
  sitDown: { _y: -.66, hips: E(-.25), thighL: E(-1.45, 0, .12), shinL: E(.15), thighR: E(-1.45, 0, -.12), shinR: E(.2), spine: E(.2) },
  lyingBack: { _y: -.74, hips: E(-1.5), thighL: E(-.35, 0, .1), shinL: E(.55), thighR: E(-.2), shinR: E(.3), spine: E(.05) },
  twistLeft: { spine: E(0, .55), chest: E(0, .5) },
  twistRight: { spine: E(0, -.55), chest: E(0, -.5) },
  hipTwistL: { hips: E(0, .75), thighL: E(0, -.75), thighR: E(0, -.75) },
  hipTwistR: { hips: E(0, -.75), thighL: E(0, .75), thighR: E(0, .75) },
  bow45: { spine: E(.45), chest: E(.4), neck: E(.2) },
  crouch: { _y: -.42, thighL: E(-1.3, 0, .25), shinL: E(1.9), thighR: E(-1.3, 0, -.25), shinR: E(1.9), spine: E(.45), footL: E(-.6), footR: E(-.6) },
};
function poseFighter(f, name) {
  const U = f.userData, B = U.bones, p = poses[name] || {};
  for (const n in B) { B[n].rotation.set(0, 0, 0); B[n].position.copy(U.rest[n]); }
  B.hips.position.y += (p._y || 0) * U.colors.s;
  for (const n in p) if (n[0] !== '_' && B[n]) B[n].rotation.set(...p[n], 'YXZ');
  f.updateMatrixWorld(true);
}

// ---------- true clearance: CPU-skin the mesh and test saya sample points against it ----------
const ARMS = /^(clav|upperArm|forearm|hand|sleeve)/;
function skinCache(f) {
  const U = f.userData, mesh = U.mesh, g = mesh.geometry, n = g.attributes.position.count;
  if (!U._sk) {
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, names = U.skeleton.bones.map(b => b.name); const arm = new Uint8Array(n);
    for (let i = 0; i < n; i++) { let wa = 0; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > 0 && ARMS.test(names[si.getComponent(i, k)])) wa += w; } arm[i] = wa > .3 ? 1 : 0; }
    U._sk = { pos: new Float32Array(n * 3), nor: new Float32Array(n * 3), arm, mats: [] };
  }
  const S = U._sk, sk = U.skeleton, P = g.attributes.position.array, N = g.attributes.normal.array, si = g.attributes.skinIndex.array, sw = g.attributes.skinWeight.array;
  f.updateMatrixWorld(true);
  const M = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i]).elements);
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
    let ox = 0, oy = 0, oz = 0, mx = 0, my = 0, mz = 0;
    for (let k = 0; k < 4; k++) { const w = sw[i * 4 + k]; if (!w) continue; const e = M[si[i * 4 + k]];
      ox += w * (e[0] * x + e[4] * y + e[8] * z + e[12]); oy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]); oz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
      mx += w * (e[0] * nx + e[4] * ny + e[8] * nz); my += w * (e[1] * nx + e[5] * ny + e[9] * nz); mz += w * (e[2] * nx + e[6] * ny + e[10] * nz); }
    S.pos[i * 3] = ox; S.pos[i * 3 + 1] = oy; S.pos[i * 3 + 2] = oz; const l = Math.hypot(mx, my, mz) || 1; S.nor[i * 3] = mx / l; S.nor[i * 3 + 1] = my / l; S.nor[i * 3 + 2] = mz / l;
  }
  // spatial hash
  const cell = .06, grid = new Map(); const key = (a, b, c) => a + ',' + b + ',' + c;
  for (let i = 0; i < n; i++) { const k = key(Math.floor(S.pos[i * 3] / cell), Math.floor(S.pos[i * 3 + 1] / cell), Math.floor(S.pos[i * 3 + 2] / cell)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
  S.grid = grid; S.cell = cell; S.key = key; return S;
}
function sayaSamples(f) {
  const U = f.userData, saya = U.saya; saya.updateWorldMatrix(true, true);
  const pts = [], curve = y => .022 * Math.pow(Math.max(0, y) / .74, 2);
  for (let y = .005; y <= .78; y += .01) pts.push({ p: new THREE.Vector3(curve(y), y, 0).applyMatrix4(saya.matrixWorld), r: .0185 - y / .78 * .003, part: 'saya' });
  if (!U.drawn) { // hilt sticking out of the mouth along -y, and the tsuba
    for (let y = -.005; y >= -.26; y -= .01) pts.push({ p: new THREE.Vector3(0, y, 0).applyMatrix4(saya.matrixWorld), r: .016, part: 'hilt' });
    for (let a = 0; a < 12; a++) pts.push({ p: new THREE.Vector3(Math.cos(a / 12 * Math.PI * 2) * .036, -.012, Math.sin(a / 12 * Math.PI * 2) * .036).applyMatrix4(saya.matrixWorld), r: .006, part: 'tsuba' });
  }
  return pts;
}
function boneOf(f, i) { const g = f.userData.mesh.geometry, names = f.userData.skeleton.bones.map(b => b.name); const o = []; for (let k = 0; k < 4; k++) { const w = g.attributes.skinWeight.getComponent(i, k); if (w > .05) o.push(names[g.attributes.skinIndex.getComponent(i, k)] + ':' + w.toFixed(2)); } return o.join(' '); }
function clearance(f) {
  const S = skinCache(f), pts = sayaSamples(f); let body = Infinity, arm = Infinity, worst = null;
  for (const s of pts) {
    const cx = Math.floor(s.p.x / S.cell), cy = Math.floor(s.p.y / S.cell), cz = Math.floor(s.p.z / S.cell);
    let bestB = Infinity, bestA = Infinity, iB = -1, iA = -1;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const L = S.grid.get(S.key(cx + a, cy + b, cz + c)); if (!L) continue;
      for (const i of L) { const d = Math.hypot(S.pos[i * 3] - s.p.x, S.pos[i * 3 + 1] - s.p.y, S.pos[i * 3 + 2] - s.p.z); if (S.arm[i]) { if (d < bestA) { bestA = d; iA = i; } } else if (d < bestB) { bestB = d; iB = i; } } }
    const signed = (i, d) => { if (i < 0) return Infinity; const dot = (s.p.x - S.pos[i * 3]) * S.nor[i * 3] + (s.p.y - S.pos[i * 3 + 1]) * S.nor[i * 3 + 1] + (s.p.z - S.pos[i * 3 + 2]) * S.nor[i * 3 + 2]; return (dot >= 0 ? d : -d) - s.r; };
    const cb = signed(iB, bestB), ca = signed(iA, bestA);
    if (cb < body) { body = cb; worst = { part: s.part, at: s.p.toArray().map(v => +v.toFixed(3)), v: iB >= 0 ? [S.pos[iB * 3], S.pos[iB * 3 + 1], S.pos[iB * 3 + 2]].map(v => +v.toFixed(3)) : null, n: iB >= 0 ? [S.nor[iB * 3], S.nor[iB * 3 + 1], S.nor[iB * 3 + 2]].map(v => +v.toFixed(2)) : null, bone: iB >= 0 ? boneOf(f, iB) : null }; } if (ca < arm) arm = ca;
  }
  // ground
  let gnd = Infinity; for (const s of pts) gnd = Math.min(gnd, s.p.y - s.r - f.position.y);
  const r3 = v => Number.isFinite(v) ? +v.toFixed(4) : null;
  return { body: r3(body), arms: r3(arm), ground: r3(gnd), worst, a: +f.userData.gear.a.toFixed(3), b: +f.userData.gear.b.toFixed(3), c: +f.userData.gear.c.toFixed(3), proxy: r3(f.userData.gear.contact) };
}

// ---------- views ----------
const views = { front: [[0, 1.0, 5.4], [0, .9, 0]], back: [[0, 1.1, -5.4], [0, .9, 0]], left: [[5.4, 1.0, 0], [0, .9, 0]], top: [[0, 5.8, .01], [0, .8, 0]], three: [[3.6, 1.6, -3.6], [0, .9, 0]], low: [[3.4, .35, 2.4], [0, .8, 0]], frontleft: [[3.6, 1.3, 3.6], [0, .9, 0]], hip: [[1.5, 1.05, .9], [.15, .9, -.05]], hipback: [[1.3, 1.2, -1.3], [.15, .9, -.1]], hipfront: [[.9, 1.25, 1.4], [.12, .95, .1]] };
function setCam(name, focus) { const v = views[name] || views.three; const fx = focus ? focus.position.x : 0; cam.position.set(v[0][0] + fx, v[0][1], v[0][2]); cam.lookAt(v[1][0] + fx, v[1][1], v[1][2]); }

// settle the spring at a static pose: run updateGear for a while
function settle(f, steps = 90) { for (let i = 0; i < steps; i++) f.userData.updateGear(1 / 60); }
let state = { pose: q.get('pose') || 'rest', cam: q.get('cam') || 'three', drawn: q.get('drawn') === '1', clip: q.get('clip'), t: q.get('t') };
function apply() {
  fighters.forEach((f, i) => { f.userData.setDrawn(state.drawn); f.userData.resetGear(); if (state.clip && mixers[i]) { mixers[i].play(state.clip, 0); const dt = 1 / 60, T = +(state.t || 0); for (let t = 0; t <= T; t += dt) { mixers[i].update(dt); f.userData.updateGear(dt); } } else { poseFighter(f, state.pose); settle(f); } });
  setCam(state.cam, fighters.length === 1 ? fighters[0] : null);
  const rep = fighters.map(f => ({ who: f.userData.design, ...clearance(f) }));
  document.getElementById('info').textContent = (state.clip ? 'clip ' + state.clip + ' t=' + state.t : 'pose ' + state.pose) + (state.drawn ? ' (drawn)' : '') + '\n' + rep.map(r => `${r.who}: body ${(r.body * 100).toFixed(1)}cm  arms ${(r.arms * 100).toFixed(1)}cm  ground ${(r.ground * 100).toFixed(1)}cm  swing a ${r.a} b ${r.b} c ${r.c}`).join('\n');
  return rep;
}
// run a clip through time with the spring live, return the worst clearance per fighter
function sweep(clip, dur = 1.2) {
  return fighters.map((f, i) => { const m = mixers[i]; if (!m) return null; f.userData.resetGear(); m.play(clip, 0); let worst = { body: Infinity }; const dt = 1 / 60;
    for (let t = 0; t <= dur; t += dt) { m.update(dt); f.userData.updateGear(dt); if (Math.round(t / dt) % 3 === 0) { const c = clearance(f); if (c.body < worst.body) worst = { ...c, t: +t.toFixed(2) }; } }
    return { who: f.userData.design, clip, ...worst }; });
}
function render() { renderer.render(scene, cam); }
const rep = apply(); render();
let live = q.get('live') === '1', last = performance.now();
function tick(now) { requestAnimationFrame(tick); if (live && state.clip) { const dt = Math.min(.05, (now - last) / 1000); mixers.forEach((m, i) => { m.update(dt); fighters[i].userData.updateGear(dt); }); } last = now; render(); }
requestAnimationFrame(tick);
window.__GEAR__ = { ready: true, report: rep, poses: Object.keys(poses), fighters, set(o) { Object.assign(state, o); const r = apply(); render(); this.report = r; return r; }, sweep, render };
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
