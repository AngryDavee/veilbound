// FX lab: every anime-fx effect on a timeline, or one effect frozen at a moment.
// ?fx=<name>&t=<seconds>   ?day=1 for a bright scene   (no params: loop the whole reel)
import * as THREE from 'three';
import makeFighter from '../assets/fighter.js';
import { animate } from '../fighter-moves.js';
import { createAnimeFX } from '../anime-fx.js';
const q = new URLSearchParams(location.search), day = q.has('day');
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.shadowMap.enabled = true;
renderer.domElement.id = 'world'; document.body.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(day ? 0xa9c4cf : 0x101a2a); scene.fog = new THREE.FogExp2(day ? 0xa9c4cf : 0x14203a, .045);
scene.add(new THREE.HemisphereLight(day ? 0xd8eaff : 0x6f86b8, day ? 0x6a6250 : 0x1c2018, day ? 1.6 : 1.1));
const sun = new THREE.DirectionalLight(day ? 0xffe6c0 : 0xb8c8ff, day ? 3 : 1.4); sun.position.set(-4, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: day ? 0x9a9478 : 0x2c3a38, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 9 + (i % 3) * 3; const t = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 9, 8), new THREE.MeshStandardMaterial({ color: day ? 0x5a4a3a : 0x1a2220 })); t.position.set(Math.cos(a) * r, 4.5, Math.sin(a) * r - 4); scene.add(t); }
const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .05, 200); cam.position.set(.4, 1.45, 5.4); cam.lookAt(0, 1.05, 0);
const haru = makeFighter(THREE, 'haru'), mitsuki = makeFighter(THREE, 'mitsuki'); scene.add(haru, mitsuki);
haru.position.set(-.85, 0, 0); haru.rotation.y = Math.PI / 2; mitsuki.position.set(.85, 0, 0); mitsuki.rotation.y = -Math.PI / 2;
const A = [animate(THREE, haru), animate(THREE, mitsuki)]; A.forEach(a => a.play('stance', 0)); haru.userData.setDrawn(true); mitsuki.userData.setDrawn(true);
for (let i = 0; i < 20; i++) A.forEach(a => a.update(1 / 60));
const fx = createAnimeFX(THREE, scene, { renderer, canvas: renderer.domElement });
fx.prewarm([haru, mitsuki]);
const mid = new THREE.Vector3(0, 1.25, 0), G = new THREE.Vector3(0, 0, 0);
const arcQ = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'));
const E = {
  sparks: () => fx.sparks(mid.clone(), { color: 0xffb04a, count: 40 }),
  hit: () => fx.hitBurst(new THREE.Vector3(.75, 1.25, 0), { color: 0x6fe7ff }),
  hitHeavy: () => fx.hitBurst(new THREE.Vector3(.75, 1.2, 0), { color: 0xff5a3c, heavy: true, size: 1.2 }),
  clash: () => fx.clashBurst(new THREE.Vector3(0, 1.35, .05)),
  dust: () => { fx.dust(new THREE.Vector3(-.85, 0, 0), { size: 1, dir: new THREE.Vector3(1, 0, 0), count: 10 }); fx.dust(new THREE.Vector3(.85, 0, 0), { size: .7, count: 6 }); },
  debris: () => fx.debris(new THREE.Vector3(.9, 0, -.2), { count: 18, power: 1.1 }),
  shockwave: () => fx.shockwave(new THREE.Vector3(0, 0, 0), { color: 0x9fe0ff, radius: 3.4 }),
  arcWater: () => { fx.slashArc({ center: new THREE.Vector3(-.4, 1.15, 0), quat: arcQ(0, 0, .5), radius: 1.35, arc: -Math.PI * 1.15, start: Math.PI * .95, color: [0x2bb8d8, 0xd8fbff], width: .85, life: .75, style: 'water' }); },
  arcEmber: () => { fx.slashArc({ center: new THREE.Vector3(.35, 1.1, 0), quat: arcQ(0, 0, -.6), radius: 1.3, arc: Math.PI * 1.2, start: -Math.PI * .1, color: [0xd0203a, 0xffa040], width: .85, life: .8, style: 'ember' }); fx.slashArc({ center: new THREE.Vector3(.35, 1.0, 0), quat: arcQ(0, 0, -.9), radius: 1.05, arc: Math.PI * 1.1, start: 0, color: [0xd0203a, 0xffc060], width: .45, life: .7, style: 'ember', layers: 2 }); },
  afterimage: () => { const x0 = haru.position.x; for (let i = 0; i < 4; i++) { haru.position.x = x0 - 1.4 + i * .35; haru.updateMatrixWorld(true); fx.afterimage(haru, { color: 0x6fe7ff, life: .6 }); } haru.position.x = x0; },
  speedRadial: () => fx.speedLines(1, { kind: 'radial', dur: .6 }),
  speedHorizontal: () => fx.speedLines(1, { kind: 'horizontal', color: '#ff6a8a', dur: .6 }),
  impactInk: () => fx.impactFrame('ink', .5),
  impactInvert: () => fx.impactFrame('invert', .5),
  flash: () => fx.flash('#ff3a5a', .5, .85),
  letterbox: () => fx.letterbox(true, .3),
  cutIn: () => fx.cutIn({ who: haru, side: 'left', art: 'Veil Art', name: 'Sky-Current Crescent', kanji: '天流', color: '#6fe7ff' }, 1.4),
  cutInR: () => fx.cutIn({ who: mitsuki, side: 'right', art: 'Bell Art', name: 'Ember Bell Descent', kanji: '燼鐘', color: '#ff6a4a' }, 1.4),
  vs: () => fx.vsSplash({ left: { who: haru, name: 'Haru', title: 'Apprentice Warden', kanji: '晴', color: '#6fe7ff' }, right: { who: mitsuki, name: 'Mitsuki', title: 'Bell Warden', kanji: '光月', color: '#ff6a4a' } }, 2.4),
  callout: () => fx.callout('Parry!', { sub: 'Counter window', color: '#6fe7ff' }),
  counter: () => { fx.hitCounter(3); setTimeout(() => fx.hitCounter(4), 0); },
};
const reel = Object.keys(E);
let clock = 0, frozen = false, last = performance.now(), reelT = 0, reelI = 0;
const one = q.get('fx'), stopAt = q.has('t') ? +q.get('t') : null;
if (one) { E[one](); }
function step(dt) { A.forEach(a => a.update(dt)); }
function tick(now) {
  requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (one && stopAt !== null) {
    if (!frozen) { // advance in fixed steps to exactly t, then freeze
      while (clock < stopAt - 1e-6) { const d = Math.min(1 / 60, stopAt - clock); clock += d; step(d); renderer.render(scene, cam); fx.update(d, d, cam); }
      frozen = true; window.__FX__.frozen = true;
    }
    renderer.render(scene, cam); return;
  }
  step(dt); renderer.render(scene, cam); fx.update(dt, dt, cam);
  if (!one) { reelT -= dt; if (reelT <= 0) { const n = reel[reelI++ % reel.length]; document.getElementById('info').textContent = n; E[n](); reelT = 1.3; } }
}
window.__FX__ = { ready: true, fx, E, frozen: false, cam, renderer, scene };
requestAnimationFrame(tick);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
