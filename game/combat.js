// Haru (the player) and Mitsuki (the Bell Warden) spar in every region's battle ground.
// Owns the fighters, their AI, hit detection, slash trails, sparks, impact bursts, hit-stop,
// camera shake, blob shadows and the duel HUD. main.js owns movement, collision and the camera.
import makeFighter from './assets/fighter.js';
import { animate } from './fighter-moves.js';

export function createCombat(THREE, scene, { toast = () => {} } = {}) {
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const hero = makeFighter(THREE, 'haru'), rival = makeFighter(THREE, 'mitsuki');
  scene.add(hero, rival);
  const F = [
    { g: hero, a: animate(THREE, hero), name: 'Haru', hp: 100, art: 0, ai: false, vel: V3(), hitDone: new Set(), queue: null, combo: 0, think: 0, guardT: 0, cool: 0, plan: null, strafe: 1 },
    { g: rival, a: animate(THREE, rival), name: 'Mitsuki', hp: 100, art: 0, ai: true, vel: V3(), hitDone: new Set(), queue: null, combo: 0, think: 0, guardT: 0, cool: 1, plan: null, strafe: 1 },
  ];
  const [H, R] = F; H.foe = R; R.foe = H;

  // ---------- blob shadows ----------
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const g = sc.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const shadowTex = new THREE.CanvasTexture(sc);
  for (const f of F) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; scene.add(m); f.shadow = m; }

  // ---------- slash trails: a ribbon between blade base and tip, recent samples only ----------
  const N = 22;
  const trailMat = c => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c0: { value: new THREE.Color(c[0]) }, c1: { value: new THREE.Color(c[1]) } },
    vertexShader: 'attribute float age; attribute float side; varying float vAge; varying float vSide; void main(){ vAge=age; vSide=side; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 c0; uniform vec3 c1; varying float vAge; varying float vSide; void main(){ float life=1.-vAge; float edge=smoothstep(.0,.35,vSide)*smoothstep(1.,.86,vSide); float core=smoothstep(.55,.95,vSide)*life; vec3 col=mix(c0,c1,core); float a=life*life*edge*1.6; gl_FragColor=vec4(col*a,a); }',
  });
  for (const f of F) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 2 * 3), age = new Float32Array(N * 2), side = new Float32Array(N * 2), idx = [];
    for (let i = 0; i < N; i++) { side[i * 2] = 0; side[i * 2 + 1] = 1; if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('age', new THREE.BufferAttribute(age, 1)); geo.setAttribute('side', new THREE.BufferAttribute(side, 1)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, trailMat(f.g.userData.colors.trail)); m.frustumCulled = false; m.renderOrder = 5; scene.add(m);
    f.trail = { m, samples: [], tip: V3(), base: V3() };
  }
  function trailStep(f, dt, active) {
    const t = f.trail; f.g.userData.bladePoints(t.tip, t.base);
    for (const s of t.samples) s.age += dt;
    if (active) { // extend the ribbon past the tip a little for an anime arc
      const tip = t.tip.clone().add(t.tip.clone().sub(t.base).multiplyScalar(.18));
      t.samples.unshift({ tip, base: t.base.clone().lerp(t.tip, .2), age: 0 });
    }
    while (t.samples.length > N || (t.samples.length && t.samples[t.samples.length - 1].age > .2)) t.samples.pop();
    const P = t.m.geometry.attributes.position, A = t.m.geometry.attributes.age;
    for (let i = 0; i < N; i++) { const s = t.samples[Math.min(i, t.samples.length - 1)]; if (!s) { A.array[i * 2] = A.array[i * 2 + 1] = 1; continue; } P.setXYZ(i * 2, s.base.x, s.base.y, s.base.z); P.setXYZ(i * 2 + 1, s.tip.x, s.tip.y, s.tip.z); A.array[i * 2] = A.array[i * 2 + 1] = Math.min(1, s.age / .2 + (i >= t.samples.length ? 1 : 0)); }
    P.needsUpdate = A.needsUpdate = true; t.m.visible = t.samples.length > 1;
  }

  // ---------- sparks and impact bursts ----------
  const sp = document.createElement('canvas'); sp.width = sp.height = 64; { const g = sp.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,240,200,.8)'); r.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const sparkTex = new THREE.CanvasTexture(sp), MAXS = 260;
  const sGeo = new THREE.BufferGeometry(), sPos = new Float32Array(MAXS * 3), sCol = new Float32Array(MAXS * 3);
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const sparks = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: .07, map: sparkTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.frustumCulled = false; sparks.renderOrder = 6; scene.add(sparks);
  const sp0 = []; for (let i = 0; i < MAXS; i++) sp0.push({ p: V3(), v: V3(), life: 0, c: new THREE.Color() });
  let spi = 0;
  function burst(at, n, color, speed = 6, up = 2) { const c = new THREE.Color(color); for (let i = 0; i < n; i++) { const s = sp0[spi++ % MAXS]; s.p.copy(at); s.v.set(Math.random() - .5, Math.random() * .8 - .2, Math.random() - .5).normalize().multiplyScalar(speed * (.4 + Math.random() * .8)); s.v.y += up; s.life = .25 + Math.random() * .35; s.c.copy(c).lerp(new THREE.Color(0xffffff), Math.random() * .6); } }
  // a hand-drawn style impact star that flashes and expands
  const star = document.createElement('canvas'); star.width = star.height = 256; { const g = star.getContext('2d'); g.translate(128, 128); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + (i % 2) * .1, r1 = i % 2 ? 70 : 124; g.beginPath(); g.moveTo(Math.cos(a - .09) * 12, Math.sin(a - .09) * 12); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a + .09) * 12, Math.sin(a + .09) * 12); g.closePath(); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill(); } const r = g.createRadialGradient(0, 0, 0, 0, 0, 60); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 60, 0, Math.PI * 2); g.fill(); }
  const starTex = new THREE.CanvasTexture(star), stars = [];
  for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); s.visible = false; s.renderOrder = 7; scene.add(s); stars.push({ s, t: 1 }); }
  let sti = 0; function impact(at, color, size = 1) { const o = stars[sti++ % stars.length]; o.s.position.copy(at); o.s.material.color.set(color); o.t = 0; o.size = size; o.s.material.rotation = Math.random() * Math.PI; o.s.visible = true; }
  // ground shock ring
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.85, 1, 48), ringMat); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring); let ringT = 1;

  // ---------- HUD ----------
  const css = document.createElement('style'); css.textContent = `
  #duel{position:fixed;inset:0;pointer-events:none;z-index:6;font-family:inherit}#duel[hidden]{display:none}
  #duel .bars{position:absolute;top:78px;left:50%;transform:translateX(-50%);width:min(860px,92vw);display:flex;gap:48px;justify-content:space-between}
  #duel .side{flex:1}#duel .side.r{text-align:right}
  #duel .nm{color:#f5efe2;font-size:13px;letter-spacing:.18em;text-transform:uppercase;text-shadow:0 1px 4px #000}
  #duel .nm small{opacity:.65;letter-spacing:.08em;text-transform:none;margin-left:8px}
  #duel .hp{height:12px;margin-top:6px;background:rgba(10,12,18,.65);border:1px solid rgba(255,255,255,.35);transform:skewX(-18deg);overflow:hidden}
  #duel .hp i{display:block;height:100%;transition:width .18s}#duel .side.r .hp i{margin-left:auto}
  #duel .l .hp i{background:linear-gradient(90deg,#1f6f78,#7fe8ef)}#duel .r .hp i{background:linear-gradient(270deg,#7a1428,#ff6a4a)}
  #duel .art{height:5px;margin-top:4px;background:rgba(10,12,18,.55);transform:skewX(-18deg);overflow:hidden}#duel .art i{display:block;height:100%;background:#f3e3a8}
  #duel .art.full i{background:linear-gradient(90deg,#fff6c8,#ffd36a);box-shadow:0 0 12px #ffd36a}
  #duel .banner{position:absolute;top:38%;left:0;right:0;text-align:center;color:#fff;font-size:clamp(34px,7vw,84px);font-weight:700;letter-spacing:.12em;text-shadow:0 0 18px rgba(0,0,0,.65),0 3px 0 #000;opacity:0;transition:opacity .25s,transform .25s;transform:scale(1.15)}
  #duel .banner.on{opacity:1;transform:scale(1)}#duel .banner small{display:block;font-size:.28em;letter-spacing:.3em;font-weight:500;opacity:.8}
  #duel .keys{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.82);font-size:12px;letter-spacing:.06em;text-shadow:0 1px 3px #000;white-space:nowrap}
  #duel .pads{position:absolute;right:18px;bottom:96px;display:none;gap:10px;pointer-events:auto}
  #duel .pads button{width:62px;height:62px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:rgba(10,14,20,.5);color:#fff;font:600 12px inherit}
  @media (pointer:coarse){#duel .pads{display:flex}#duel .keys{display:none}}
  body.dueling #destination-shortcuts,body.dueling #views-toggle,body.dueling #controls,body.dueling #location,body.dueling #objective,body.dueling #crosshair,body.dueling #compass{display:none!important}`;
  document.head.append(css);
  const hud = document.createElement('div'); hud.id = 'duel'; hud.hidden = true;
  hud.innerHTML = `<div class="bars"><div class="side l"><div class="nm">Haru<small>Apprentice Warden</small></div><div class="hp"><i id="hp-l"></i></div><div class="art" id="art-l"><i></i></div></div><div class="side r"><div class="nm"><small>Bell Warden</small>Mitsuki</div><div class="hp"><i id="hp-r"></i></div><div class="art" id="art-r"><i></i></div></div></div><div class="banner" id="duel-banner"></div><div class="keys">F or click: strike (press again to chain) · Q or right-click: guard · Space: dash · R: Veil art when the gauge glows · K: watch them spar · leave the ground to stop</div><div class="pads"><button data-pad="dodge">Dash</button><button data-pad="guard">Guard</button><button data-pad="attack">Strike</button><button data-pad="art">Art</button></div>`;
  document.body.append(hud);
  const $ = id => hud.querySelector('#' + id);
  let bannerT = 0; function banner(text, sub = '', t = 1.6) { $('duel-banner').innerHTML = text + (sub ? `<small>${sub}</small>` : ''); $('duel-banner').classList.add('on'); bannerT = t; }
  function hudUpdate() { $('hp-l').style.width = H.hp + '%'; $('hp-r').style.width = R.hp + '%'; for (const [f, id] of [[H, 'art-l'], [R, 'art-r']]) { $(id).firstChild.style.width = Math.min(100, f.art) + '%'; $(id).classList.toggle('full', f.art >= 100); } }

  // ---------- state ----------
  let active = false, auto = false, hitStop = 0, shake = 0, ended = 0, round = 1, arena = null, place = { x: 0, z: 0, y: 0 };
  const input = { attack: false, guard: false, dodge: false, art: false };
  const busy = f => { const c = f.a.clip; return !!c.keys && !f.a.done && !['win'].includes(f.a.name); };
  const attacking = f => ['slash1', 'slash2', 'slash3', 'finisher'].includes(f.a.name) && !f.a.done;
  const facing = f => f.g.rotation.y;
  const dirTo = (a, b) => Math.atan2(b.g.position.x - a.g.position.x, b.g.position.z - a.g.position.z);
  const dist = (a, b) => Math.hypot(b.g.position.x - a.g.position.x, b.g.position.z - a.g.position.z);
  const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const turn = (f, target, rate, dt) => { f.g.rotation.y += angDiff(f.g.rotation.y, target) * Math.min(1, rate * dt); };
  function strike(f, name) { f.a.play(name, .06); f.hitDone.clear(); f.queue = null; }
  function nextIn(name) { return { slash1: 'slash2', slash2: 'slash3', slash3: 'finisher' }[name]; }
  function doAttack(f) {
    if (f.hp <= 0 || ['hit', 'down', 'dodge'].includes(f.a.name) && !f.a.done) return;
    if (attacking(f)) { if (f.a.name !== 'finisher' && f.a.time >= f.a.clip.chain * .6) f.queue = nextIn(f.a.name); return; }
    strike(f, 'slash1');
  }
  function doArt(f) { if (f.art < 100 || f.hp <= 0 || (busy(f) && !attacking(f))) return; f.art = 0; strike(f, 'finisher'); f.isArt = true; f.a.flash(.8); banner(f === H ? 'Veil Art' : 'Bell Art', f === H ? 'Haru · Sky-Current Crescent' : 'Mitsuki · Ember Bell Descent', 1.1); }
  function doDodge(f, dir) { if (f.hp <= 0 || (busy(f) && !(attacking(f) && f.a.time > f.a.clip.chain))) return; f.a.play('dodge', .05); const a = dir ?? (facing(f) + Math.PI); f.vel.set(Math.sin(a) * 7.5, 0, Math.cos(a) * 7.5); f.dodgeT = .26; burst(V3(f.g.position.x, f.g.position.y + .1, f.g.position.z), 10, 0xd8d0c0, 2, .6); }

  // ---------- hits ----------
  const tip = V3(), base = V3();
  function resolve(f, dt) {
    const c = f.a.clip, t = f.a.time;
    for (const key of ['hit', 'spinHit']) {
      const w = c[key]; if (!w || t < w[0] || t > w[1] || f.hitDone.has(key)) continue;
      const o = f.foe, d = dist(f, o), off = Math.abs(angDiff(facing(f), dirTo(f, o)));
      if (d > w[3] * (f.isArt && key === 'hit' ? 1.35 : 1) || off > w[4] / 2) continue;
      f.hitDone.add(key);
      f.g.userData.bladePoints(tip, base); const at = tip.clone().lerp(base, .35); at.y = Math.max(at.y, o.g.position.y + .9);
      const blocked = o.a.name === 'guard' && Math.abs(angDiff(facing(o), dirTo(o, f))) < 1.4 && !(f.isArt && key === 'hit');
      const evaded = o.a.name === 'dodge' && o.a.time < .3;
      if (evaded) { burst(at, 6, 0xffffff, 3, .5); continue; }
      const push = V3(Math.sin(dirTo(f, o)), 0, Math.cos(dirTo(f, o)));
      if (blocked) {
        burst(at, 28, 0xffd27a, 7, 1.5); impact(at, 0xfff0c0, .7); hitStop = .06; shake = Math.max(shake, .08);
        o.vel.addScaledVector(push, 3.5); o.art += 6; o.a.flash(.3); continue;
      }
      const dmg = w[2] * (f.isArt && key === 'hit' ? 1.6 : 1); o.hp = Math.max(0, o.hp - dmg); f.art += dmg * 1.6; o.art += dmg * .8;
      const heavy = key === 'hit' && c === f.a.clips.finisher;
      const col = f.g.userData.colors.trail[0];
      burst(at, heavy ? 70 : 36, col, heavy ? 11 : 7, 2); burst(at, heavy ? 30 : 14, 0xffffff, heavy ? 9 : 5, 1);
      impact(at, col, heavy ? 2.2 : 1.1); o.a.flash(1);
      hitStop = heavy ? .16 : .075; shake = Math.max(shake, heavy ? .3 : .12);
      if (heavy) { ring.position.set(o.g.position.x, o.g.position.y + .03, o.g.position.z); ring.material.color.set(col); ringT = 0; ring.visible = true; }
      if (o.hp <= 0 || heavy) { o.a.play('down', .05); o.vel.copy(push).multiplyScalar(heavy ? 6 : 4.5); o.queue = null; }
      else { o.a.play('hit', .04); o.vel.copy(push).multiplyScalar(3.2); o.queue = null; o.guardT = 0; }
    }
  }

  // ---------- AI ----------
  const rnd = () => Math.random();
  function ai(f, dt) {
    const o = f.foe, d = dist(f, o); f.think -= dt; f.cool -= dt; f.guardT -= dt;
    if (f.hp <= 0 || ['hit', 'down'].includes(f.a.name) && !f.a.done) { f.plan = null; return { move: 0 }; }
    // react to the opponent's swing
    if (attacking(o) && d < 2.8 && o.a.time < (o.a.clip.hit?.[0] ?? 0) && !attacking(f) && f.react !== o.a.name + o.combo) {
      f.react = o.a.name + o.combo; const r = rnd();
      if (r < .42) { f.guardT = .55; } else if (r < .62) { doDodge(f, dirTo(o, f) + (rnd() < .5 ? 1 : -1) * .9); return { move: 0 }; }
    }
    if (!attacking(o)) f.react = null;
    if (f.guardT > 0 && !attacking(f)) return { guard: true, move: 0 };
    if (attacking(f)) { if (f.wantCombo > 0 && f.a.time >= f.a.clip.chain * .7 && !f.queue) { f.queue = nextIn(f.a.name); f.wantCombo--; } return { move: 0 }; }
    if (f.art >= 100 && d < 2.6 && rnd() < .02) { doArt(f); return { move: 0 }; }
    if (f.think <= 0) {
      f.think = .25 + rnd() * .35;
      if (d > 2.3) f.plan = 'close'; else if (d < 1.1) f.plan = 'back'; else if (f.cool <= 0 && rnd() < .7) { f.plan = null; f.cool = .9 + rnd() * 1.4; f.wantCombo = Math.floor(rnd() * 3.2); strike(f, 'slash1'); return { move: 0 }; } else { f.plan = 'circle'; if (rnd() < .3) f.strafe *= -1; }
    }
    const a = dirTo(f, o);
    if (f.plan === 'close') return { move: d > 4 ? 6 : 4.2, dir: a };
    if (f.plan === 'back') return { move: 2.4, dir: a + Math.PI };
    if (f.plan === 'circle') return { move: 1.6, dir: a + f.strafe * Math.PI / 2, slow: true };
    return { move: 0 };
  }

  // ---------- public ----------
  function setRegion(ar, walkHeight) {
    arena = ar; const [cx, , cz] = ar.center, half = Math.min(ar.size[0], ar.size[1]) / 2;
    place = { x: cx, z: cz - half * .35, y: walkHeight ? walkHeight(cx, cz - half * .35) : 0 };
    stop(true); R.g.position.set(place.x, place.y, place.z); R.g.rotation.y = 0; R.a.play('idle', 0); R.g.userData.setDrawn(false);
  }
  function inArena(x, z) { if (!arena) return false; const [cx, , cz] = arena.center; return Math.abs(x - cx) < arena.size[0] / 2 && Math.abs(z - cz) < arena.size[1] / 2; }
  function start() {
    if (active) return; active = true; ended = 0; round = 1; H.hp = R.hp = 100; H.art = R.art = 0; hud.hidden = false; document.body.classList.add('dueling'); hudUpdate();
    for (const f of F) { f.g.userData.setDrawn(true); f.a.play('stance', .2); f.queue = null; f.vel.set(0, 0, 0); }
    banner('Spar', 'Mitsuki, the Bell Warden', 1.6); toast('Mitsuki draws her blade. “Show me what the valley taught you.”');
  }
  function stop(silent) {
    document.body.classList.remove('dueling');
    if (!active && silent) { hud.hidden = true; return; }
    active = false; auto = false; hud.hidden = true; H.ai = false;
    for (const f of F) { f.a.play('idle', .3); f.a.sheathe(); f.queue = null; f.vel.set(0, 0, 0); f.isArt = false; }
    if (!silent) toast('The spar ends. Mitsuki sheathes her blade and waits by the battle ground.');
  }
  addEventListener('keydown', e => { if (!active || e.target.matches?.('input,textarea') || document.querySelector('dialog[open]')) return; const k = e.key.toLowerCase(); if (e.repeat) return; if (k === 'f') input.attack = true; if (k === ' ') input.dodge = true; if (k === 'r') input.art = true; if (k === 'k') { auto = !auto; H.ai = auto; toast(auto ? 'Watching: Haru and Mitsuki spar on their own. Press K to take over.' : 'You have Haru again.'); } });
  const held = new Set(); addEventListener('keydown', e => { if (e.key.toLowerCase() === 'q') held.add('q'); }); addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
  let down = null; const canvas = document.querySelector('#world');
  canvas?.addEventListener('pointerdown', e => { if (!active) return; if (e.button === 2) { held.add('rmb'); return; } down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas?.addEventListener('pointerup', e => { if (e.button === 2) { held.delete('rmb'); return; } if (active && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 350) input.attack = true; down = null; });
  canvas?.addEventListener('contextmenu', e => { if (active) e.preventDefault(); });
  hud.querySelectorAll('[data-pad]').forEach(b => { b.addEventListener('pointerdown', e => { e.preventDefault(); const p = b.dataset.pad; if (p === 'guard') held.add('pad'); else input[p] = true; }); b.addEventListener('pointerup', () => { if (b.dataset.pad === 'guard') held.delete('pad'); }); });

  // ctx: { pos:{x,z}, ground(x,z), moveDir (radians or null), moveSpeed, running, canWalk(x,z) } -> returns { lock, dx, dz, face }
  function update(rawDt, ctx) {
    let dt = rawDt; if (hitStop > 0) { hitStop -= rawDt; dt = rawDt * .04; }
    const out = { dx: 0, dz: 0, lock: false, yaw: null, inArena: inArena(ctx.pos.x, ctx.pos.z) };
    // hero follows the player's position
    H.g.position.x = ctx.pos.x; H.g.position.z = ctx.pos.z; H.g.position.y += (ctx.ground(ctx.pos.x, ctx.pos.z) - H.g.position.y) * Math.min(1, rawDt * 14);
    H.g.visible = H.shadow.visible = ctx.visible;
    if (active && !out.inArena) stop(false);
    if (!active) {
      // exploration: Haru walks and runs with the sword sheathed; Mitsuki waits at her ground
      if (ctx.moveSpeed > .2) { H.a.play(ctx.moveSpeed > 4.5 ? 'run' : 'walk', .18); H.a.setSpeed(ctx.moveSpeed, ctx.moveSpeed > 4.5 ? 'run' : 'walk'); H.a._lean = 0; turn(H, ctx.moveDir, 10, rawDt); }
      else { H.a.play('idle', .25); H.a.setSpeed(0); }
      const d = Math.hypot(H.g.position.x - R.g.position.x, H.g.position.z - R.g.position.z);
      turn(R, d < 12 ? dirTo(R, H) : 0, 3, rawDt);
      if (R.a.name === 'bow' && R.a.done) R.a.play('idle', .3);
      if (d < 5 && !R.greeted) { R.greeted = true; R.a.play('bow', .2); } if (d > 9) R.greeted = false;
      R.g.position.y = place.y;
    } else {
      const hu = H.ai ? ai(H, dt) : null;
      // player input
      if (!H.ai) {
        if (input.art) doArt(H); if (input.attack) doAttack(H); if (input.dodge) doDodge(H, ctx.moveSpeed > .2 ? ctx.moveDir : facing(H) + Math.PI);
        const guarding = held.has('q') || held.has('rmb') || held.has('pad');
        if (!busy(H) && H.hp > 0) {
          if (guarding) H.a.play('guard', .08);
          else if (ctx.moveSpeed > .2) { H.a.play('battleRun', .12); H.a.setSpeed(ctx.moveSpeed * 1.1, 'run'); turn(H, ctx.moveDir, 12, dt); }
          else { H.a.play('stance', .12); H.a.setSpeed(0); turn(H, dirTo(H, R), 10, dt); }
        } else if (attacking(H)) turn(H, dirTo(H, R), 6, dt);
        out.lock = busy(H) || guarding;
      }
      for (const f of F) {
        const plan = f.ai ? (f === H ? hu : ai(f, dt)) : null;
        if (plan) {
          if (!busy(f) && f.hp > 0) {
            if (plan.guard) f.a.play('guard', .08);
            else if (plan.move > 0) { f.a.play('battleRun', .12); f.a.setSpeed(plan.move, 'run'); turn(f, plan.slow ? dirTo(f, f.foe) : plan.dir, 10, dt); const sx = Math.sin(plan.dir) * plan.move * dt, sz = Math.cos(plan.dir) * plan.move * dt; if (f === H) { out.dx += sx; out.dz += sz; } else if (ctx.canWalk(f.g.position.x + sx, f.g.position.z + sz) && inArena(f.g.position.x + sx, f.g.position.z + sz)) { f.g.position.x += sx; f.g.position.z += sz; } }
            else { f.a.play('stance', .12); f.a.setSpeed(0); turn(f, dirTo(f, f.foe), 8, dt); }
          } else if (attacking(f)) turn(f, dirTo(f, f.foe), 6, dt);
          if (f === H) out.lock = true;
        }
        // chained attacks and returning to stance
        if (attacking(f) && f.queue && f.a.time >= f.a.clip.chain) { const q = f.queue; strike(f, q); f.combo++; }
        if (f.a.done) { if (f.a.name === 'finisher') f.isArt = false; if (f.hp > 0) f.a.play('stance', .12); }
        // root motion: lunges, knockback and dashes
        const c = f.a.clip, m = c.move;
        if (m && f.a.time >= m[0] && f.a.time <= m[1] && f.hp > 0 || m && f.a.name === 'down') { const a = facing(f), dd = (m[2] < 0 ? 0 : m[2]) * dt; if (dist(f, f.foe) > .95 || m[2] < 0) { const mx = Math.sin(a) * dd, mz = Math.cos(a) * dd; if (f === H) { out.dx += mx; out.dz += mz; } else if (ctx.canWalk(f.g.position.x + mx, f.g.position.z + mz)) { f.g.position.x += mx; f.g.position.z += mz; } } }
        if (f.vel.lengthSq() > .001) { const mx = f.vel.x * dt, mz = f.vel.z * dt; if (f === H) { out.dx += mx; out.dz += mz; } else if (ctx.canWalk(f.g.position.x + mx, f.g.position.z + mz)) { f.g.position.x += mx; f.g.position.z += mz; } f.vel.multiplyScalar(Math.max(0, 1 - dt * (f.a.name === 'dodge' ? 4 : 7))); }
        resolve(f, dt);
      }
      R.g.position.y += (ctx.ground(R.g.position.x, R.g.position.z) - R.g.position.y) * Math.min(1, rawDt * 14);
      // round over
      if (!ended && (H.hp <= 0 || R.hp <= 0)) { ended = 3.2; const w = H.hp > 0 ? H : R; banner(w === H ? 'Haru wins' : 'Mitsuki wins', w === H ? '“Good. Again, from the top.”' : '“Up. A Warden gets back up.”', 2.4); }
      if (ended > 0) { ended -= rawDt; const w = H.hp > 0 ? H : R; if (w.a.name !== 'win' && !busy(w)) w.a.play('win', .3); if (ended <= 0) { round++; H.hp = R.hp = 100; for (const f of F) { f.a.play('stance', .3); f.vel.set(0, 0, 0); } banner('Round ' + round, '', 1.1); } }
      out.yaw = Math.atan2(R.g.position.x - H.g.position.x, R.g.position.z - H.g.position.z);
      for (const f of F) f.art = Math.min(100, f.art);
      hudUpdate();
    }
    input.attack = input.dodge = input.art = false;
    for (const f of F) { f.a.update(dt); trailStep(f, dt, active && attacking(f) && f.a.time > f.a.clip.hit[0] - .07 && f.a.time < f.a.clip.hit[1] + .05 || (f.a.name === 'finisher' && f.a.time > .22)); f.shadow.position.set(f.g.position.x, f.g.position.y + .02, f.g.position.z); }
    // particles
    for (let i = 0; i < MAXS; i++) { const s = sp0[i]; if (s.life > 0) { s.life -= dt; s.v.y -= 9 * dt; s.p.addScaledVector(s.v, dt); } const k = Math.max(0, Math.min(1, s.life * 3)); sPos[i * 3] = s.p.x; sPos[i * 3 + 1] = s.life > 0 ? s.p.y : -999; sPos[i * 3 + 2] = s.p.z; sCol[i * 3] = s.c.r * k; sCol[i * 3 + 1] = s.c.g * k; sCol[i * 3 + 2] = s.c.b * k; }
    sGeo.attributes.position.needsUpdate = sGeo.attributes.color.needsUpdate = true;
    for (const o of stars) { if (o.t >= 1) { o.s.visible = false; continue; } o.t += rawDt * 4.5; const k = Math.sin(Math.min(1, o.t) * Math.PI); o.s.scale.setScalar((.4 + o.t * 1.4) * o.size); o.s.material.opacity = k; }
    if (ringT < 1) { ringT += rawDt * 2.5; ring.scale.setScalar(.3 + ringT * 3.2); ring.material.opacity = 1 - ringT; ring.visible = ringT < 1; }
    if (bannerT > 0) { bannerT -= rawDt; if (bannerT <= 0) $('duel-banner').classList.remove('on'); }
    shake = Math.max(0, shake - rawDt * 1.6);
    out.shake = shake; out.timeScale = dt / Math.max(rawDt, 1e-6);
    return out;
  }
  return {
    hero, rival, fighters: F, update, setRegion, start, stop, inArena,
    get active() { return active; }, get auto() { return auto; }, setAuto(v) { auto = !!v; H.ai = auto; },
    state: () => ({ active, auto, round, hero: { hp: H.hp, art: Math.round(H.art), anim: H.a.name }, rival: { hp: R.hp, art: Math.round(R.art), anim: R.a.name, pos: [R.g.position.x, R.g.position.z] } }),
    input,
  };
}
