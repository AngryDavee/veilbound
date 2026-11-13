// Duel camera lab: two fighters run a scripted, looping spar that fires every camera cue.
// ?t=<seconds> jumps the timeline (deterministic re-simulation), ?pause=1 freezes after the jump.
// window.__CAM__ = { ready, mode, t, seek(t) }
import * as THREE from 'three';
import makeFighter from '../assets/fighter.js';
import { animate } from '../fighter-moves.js';
import { createDuelCamera } from '../duel-camera.js';

const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
const skyCol = new THREE.Color(0x26344a); scene.background = skyCol; scene.fog = new THREE.Fog(0x2c3a50, 14, 70);
// sky dome gradient
{ const g = new THREE.SphereGeometry(200, 32, 16), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {}, vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(vec3(.17,.22,.32),vec3(.05,.08,.15),smoothstep(0.,.6,h)); c=mix(vec3(.28,.33,.42),c,smoothstep(-.05,.12,h)); gl_FragColor=vec4(c,1.); }' }); scene.add(new THREE.Mesh(g, m)); }
scene.add(new THREE.HemisphereLight(0xa8bfe0, 0x3a3428, 1.3));
const sun = new THREE.DirectionalLight(0xdfe8ff, 2.4); sun.position.set(-8, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 }); scene.add(sun, sun.target);
// ground: procedural stone/grass checker so motion and parallax read
{
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 70 + ((x + y) % 2) * 14 + Math.random() * 10; g.fillStyle = `rgb(${v * .9},${v},${v * .8})`; g.fillRect(x * 64, y * 64, 64, 64); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${60 + Math.random() * 60},40,.35)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 5); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const rnd = (a => () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296)(7);
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x3a3026, roughness: .9 }), rockM = new THREE.MeshStandardMaterial({ color: 0x6b6f72, roughness: .95, flatShading: true }), lampM = new THREE.MeshStandardMaterial({ color: 0x8a8578, roughness: .8 });
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, r = 11 + rnd() * 30, h = 7 + rnd() * 8; const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, h, 8), trunkM); m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r); m.castShadow = true; scene.add(m); }
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 20, s = .3 + rnd() * .8; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM); m.position.set(Math.cos(a) * r, s * .4, Math.sin(a) * r); m.rotation.set(rnd() * 3, rnd() * 3, 0); m.castShadow = true; scene.add(m); }
  for (const [x, z] of [[-6, -5], [7, -6], [-7, 6], [8, 7], [0, -9], [14, 0]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 1.6, 6), lampM); m.position.set(x, .8, z); m.castShadow = true; scene.add(m); const top = new THREE.Mesh(new THREE.ConeGeometry(.45, .35, 6), lampM); top.position.set(x, 1.75, z); scene.add(top); }
}

const hero = makeFighter(THREE, 'haru'), rival = makeFighter(THREE, 'mitsuki'); scene.add(hero, rival);
const HA = animate(THREE, hero), RA = animate(THREE, rival);
const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .05, 600);
const wall = q.get('wall') === '1'; // block everything at z > 2.6 to test the side fallback
if (wall) { const m = new THREE.MeshStandardMaterial({ color: 0x8a4a3a }); for (let x = -16; x <= 16; x += 1.2) { const p = new THREE.Mesh(new THREE.BoxGeometry(1, 3.5, .5), m); p.position.set(x, 1.75, 2.9); scene.add(p); } }
const dc = createDuelCamera(THREE, cam, { canPlace: (x, z) => !(wall && z > 2.6), ground: () => 0 });

// ---------- the timeline ----------
const LOOP = 34;
// position keys [t, x, z, y]
const HK = [[0, -1.3, 0, 0], [2.6, -1.3, 0, 0], [3.8, -1.0, -.9, 0], [5.0, -1.2, .2, 0], [5.45, .2, .1, 0], [6.9, .35, .1, 0], [7.8, .4, .1, 0], [9.4, .4, .1, 0], [10.0, -.6, .1, 0], [12.9, -.6, .1, 0], [14.6, -.55, .1, 0], [15.8, -.4, .1, 0], [18.5, .6, .4, 0], [20.0, .2, .3, 0], [20.6, .5, .35, 0], [21.2, 1.2, .5, 1.3], [21.9, 2.0, .55, 0], [23.4, 2.1, .55, 0], [24.0, 3.5, .7, 0], [24.3, 3.5, .7, 0], [24.9, 2.6, .7, 0], [27.4, 2.6, .7, 0], [28.3, 1.0, .6, 0], [32.4, 1.0, .6, 0], [33.8, 3.6, .1, 0]];
const RK = [[0, 1.3, 0, 0], [2.6, 1.3, 0, 0], [3.8, 1.1, 1.0, 0], [5.0, 1.3, .2, 0], [5.6, 1.3, .2, 0], [5.9, 1.65, .2, 0], [6.9, 1.5, .2, 0], [7.8, 1.2, .1, 0], [9.4, 1.2, .1, 0], [10.0, 2.4, .1, 0], [12.4, 7.4, .3, 0], [12.5, 7.4, .3, 0], [12.95, .4, .1, 0], [14.45, .4, .1, 0], [14.6, .6, .1, .3], [15.15, 1.6, .1, 2.1], [15.8, 2.6, .1, 0], [17.0, 4.6, .1, 0], [18.5, 4.6, .1, 0], [19.6, 2.6, .6, 0], [22.0, 2.6, .6, 0], [23.0, 5.0, .8, 0], [24.0, 5.0, .8, 0], [24.3, 4.3, .8, 0], [25.5, 4.3, .8, 0], [26.6, 3.6, .75, 1.4], [27.4, 3.0, .7, 0], [32.4, 3.0, .7, 0], [33.8, -.5, .25, 0]];
const ss = t => t * t * (3 - 2 * t);
function K(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], u = (t - a[0]) / (b[0] - a[0] || 1); const e = ss(u); return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, a[3] + (b[3] - a[3]) * e]; }
  return keys[keys.length - 1].slice(1);
}
// facing: 'run' windows face the motion, everything else faces the opponent
const RUN = { hero: [[5.0, 5.45], [18.5, 19.6], [23.4, 24.0], [32.4, 33.8]], rival: [[10.0, 12.4], [12.5, 12.95], [18.5, 19.6], [32.4, 33.8]] };
const inRun = (who, t) => RUN[who].some(([a, b]) => t >= a && t < b);
// animation and camera events
const EV = [
  [0, 'cue', 'intro'], [0, 'h', 'stance'], [0, 'r', 'stance'],
  [5.0, 'h', 'battleRun'], [5.0, 'cue', 'dash', { who: 'hero' }], [5.45, 'h', 'slash1'], [5.6, 'cue', 'hit', { heavy: false, attacker: 'hero', atR: 1.2 }], [5.6, 'r', 'hit'],
  [6.15, 'h', 'slash2'], [6.35, 'cue', 'hit', { heavy: false, attacker: 'hero', atR: 1.2 }], [6.35, 'r', 'hit'],
  [6.95, 'h', 'slash3'], [6.95, 'r', 'slash2'], [7.15, 'cue', 'clash', { atMid: 1.3 }],
  [7.8, 'h', 'guard'], [7.8, 'r', 'guard'], [7.8, 'cue', 'lock', { atMid: 1.45, dur: 1.6 }],
  [9.6, 'h', 'dodge'], [9.6, 'r', 'dodge'], [10.0, 'h', 'stance'], [10.0, 'r', 'battleRun'], [12.4, 'r', 'stance'],
  [12.5, 'r', 'battleRun'], [12.5, 'cue', 'dash', { who: 'rival' }], [12.95, 'r', 'slash3'], [13.15, 'h', 'guard'], [13.3, 'cue', 'parry', { by: 'hero', atMid: 1.2 }],
  [13.8, 'h', 'stance'], [13.8, 'r', 'stance'],
  [14.2, 'h', 'slash3'], [14.2, 'cue', 'kick', { who: 'hero' }], [14.45, 'cue', 'hit', { heavy: true, attacker: 'hero', atR: 1.1 }], [14.45, 'r', 'hit'], [14.55, 'cue', 'launch', { who: 'rival' }],
  [15.8, 'r', 'down'], [15.8, 'cue', 'down', { who: 'rival' }], [17.6, 'r', 'stance'],
  [18.5, 'h', 'battleRun'], [18.5, 'r', 'battleRun'], [19.6, 'h', 'stance'], [19.6, 'r', 'stance'],
  [20.0, 'h', 'finisher'], [20.0, 'cue', 'art', { who: 'hero', dur: 3.0 }], [22.0, 'cue', 'hit', { heavy: true, attacker: 'hero', atR: 1.0 }], [22.0, 'r', 'down'],
  [23.4, 'r', 'stance'], [23.4, 'h', 'battleRun'], [24.0, 'h', 'stance'],
  [24.0, 'r', 'slash1'], [24.3, 'cue', 'hit', { heavy: true, attacker: 'rival', atH: 1.2 }], [24.3, 'h', 'down'],
  [25.5, 'h', 'stance'], [25.5, 'r', 'finisher'], [25.5, 'cue', 'art', { who: 'rival', dur: 2.8 }], [27.5, 'cue', 'hit', { heavy: true, attacker: 'rival', atH: 1.0 }], [27.5, 'h', 'down'],
  [29.0, 'r', 'win'], [29.0, 'cue', 'ko', { winner: 'rival', loser: 'hero' }],
  [32.4, 'cue', 'end'], [32.4, 'h', 'battleRun'], [32.4, 'r', 'battleRun'], [33.8, 'h', 'stance'], [33.8, 'r', 'stance'],
];

const tmp = new THREE.Vector3();
const headW = g => g.userData.bones.head.getWorldPosition(new THREE.Vector3());
let T = 0, ev = 0, heroFreeze = null;
const prevP = { hero: new THREE.Vector3(), rival: new THREE.Vector3() };
const faceW = g => new THREE.Vector3(0, 0, 1).applyQuaternion(g.userData.bones.head.getWorldQuaternion(new THREE.Quaternion()));
function stateOf(g, a, air) { return { pos: g.position.clone(), yaw: g.rotation.y, air, anim: a.name, head: headW(g), face: faceW(g) }; }
function turnTo(g, target, rate, dt) { let d = (target - g.rotation.y) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; g.rotation.y += d * Math.min(1, rate * dt); }
function step(dt) {
  T += dt; const t = T % LOOP;
  if (t < dt * 1.5 && T > dt * 2) { ev = 0; } // loop restart
  while (ev < EV.length && EV[ev][0] <= t) {
    const [, kind, name, data] = EV[ev++];
    if (kind === 'h') { HA.play(name, .08); if (name === 'battleRun') HA.setSpeed(6.5, 'run'); }
    else if (kind === 'r') { RA.play(name, .08); if (name === 'battleRun') RA.setSpeed(6.5, 'run'); }
    else {
      const d = { ...(data || {}) };
      if (d.atMid) { d.at = hero.position.clone().lerp(rival.position, .5).setY(d.atMid); delete d.atMid; }
      if (d.atR) { d.at = rival.position.clone().setY(rival.position.y + d.atR); delete d.atR; }
      if (d.atH) { d.at = hero.position.clone().setY(hero.position.y + d.atH); delete d.atH; }
      dc.cue(name, d);
    }
  }
  const h = K(HK, t), r = K(RK, t);
  prevP.hero.copy(hero.position); prevP.rival.copy(rival.position);
  hero.position.set(h[0], h[2], h[1]); rival.position.set(r[0], r[2], r[1]);
  for (const [who, g, o] of [['hero', hero, rival], ['rival', rival, hero]]) {
    const v = tmp.copy(g.position).sub(prevP[who]); v.y = 0;
    const face = inRun(who, t) && v.length() > dt * .8 ? Math.atan2(v.x, v.z) : Math.atan2(o.position.x - g.position.x, o.position.z - g.position.z);
    turnTo(g, face, 12, dt);
  }
  // hold Haru's lying pose through the KO
  if (t >= 28.4 && t < 32.4) { HA.seek(1.0); } else HA.update(dt);
  RA.update(dt);
  dc.update(dt, { hero: stateOf(hero, HA, h[2]), rival: stateOf(rival, RA, r[2]), timeScale: 1 });
}
function seek(t) {
  T = 0; ev = 0; hero.position.set(-1.3, 0, 0); rival.position.set(1.3, 0, 0); hero.rotation.y = Math.PI / 2; rival.rotation.y = -Math.PI / 2;
  HA.play('stance', 0); RA.play('stance', 0); dc.reset();
  const n = Math.round(t * 60); for (let i = 0; i < n; i++) step(1 / 60);
}
const hud = document.getElementById('hud');
const paused = q.get('pause') === '1';
seek(+(q.get('t') || 0));
let last = performance.now();
function tick(now) {
  requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!paused && !window.__CAM__.hold) step(dt);
  sun.position.set(hero.position.x - 8, 14, hero.position.z + 6); sun.target.position.copy(hero.position);
  hud.textContent = `t ${(T % LOOP).toFixed(2)} · camera: ${dc.mode} · fov ${cam.fov.toFixed(1)} · roll ${dc.roll.toFixed(2)}`;
  window.__CAM__.mode = dc.mode; window.__CAM__.t = T % LOOP;
  renderer.render(scene, cam);
}
window.__CAM__ = { ready: true, mode: dc.mode, t: 0, hold: paused, seek: t => { seek(t); window.__CAM__.mode = dc.mode; renderer.render(scene, cam); return dc.mode; } };
requestAnimationFrame(tick);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
