// Veilbound duels: Haru (the player) and Mitsuki (the Bell Warden) spar in every region's battle ground.
//
// What decides a fight here is contact, not distance. A sword hit lands when the blade's swept
// segment actually passes through the opponent's body; a kick lands when the foot does. Two
// blades that meet in flight CLASH (both recoil, sparks at the exact point they met); clash
// twice in quick succession and the fighters lock blades (tsubazeriai) and shove for position.
// A guard turns the blade to meet the cut; a guard raised in the last instant before contact is
// a PARRY that throws the attacker's blade wide and opens them up. Kicks, the palm strike and
// the shoulder charge break guards; a throw ignores them. Rising cuts launch the opponent into
// the air for a jumping follow-up, and plunging air cuts spike them back down.
//
// This module owns the fighters, their AI, hit detection, the trail ribbons, the HUD and the
// fight's flow. The camera director (duel-camera.js) and the anime effects (anime-fx.js) are
// passed in and driven by cues; main.js owns player movement, world collision and rendering.
import makeFighter from './assets/fighter.js';
import { animate } from './fighter-moves.js';

export function createCombat(THREE, scene, { toast = () => {}, director = null, fx = null } = {}) {
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const hero = makeFighter(THREE, 'haru'), rival = makeFighter(THREE, 'mitsuki');
  scene.add(hero, rival);
  const mk = (g, name, ai) => ({ g, a: animate(THREE, g), name, hp: 100, art: 0, guardHp: 100, ai, vel: V3(), y: 0, vy: 0, air: false, hitDone: new Set(), queue: null, comboKind: null, comboIdx: 0, think: 0, cool: 1, plan: null, strafe: 1, guardPress: -9, guardHeld: false, invul: 0, wantCombo: 0, hits: 0, lastHitT: 0, react: null, prevTip: V3(), prevBase: V3(), hasPrev: false, carry: null });
  const F = [mk(hero, 'Haru', false), mk(rival, 'Mitsuki', true)];
  const [H, R] = F; H.foe = R; R.foe = H; H.side = 'hero'; R.side = 'rival';
  const colors = f => f.g.userData.colors.trail;

  // ---------- blob shadows ----------
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const g = sc.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const shadowTex = new THREE.CanvasTexture(sc);
  for (const f of F) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; scene.add(m); f.shadow = m; }

  // ---------- blade trails: a ribbon between the blade's base and an extended tip ----------
  const N = 26;
  const trailMat = c => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c0: { value: new THREE.Color(c[0]) }, c1: { value: new THREE.Color(c[1]) }, boost: { value: 1 } },
    vertexShader: 'attribute float age; attribute float side; varying float vAge; varying float vSide; void main(){ vAge=age; vSide=side; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 c0; uniform vec3 c1; uniform float boost; varying float vAge; varying float vSide; void main(){ float life=1.-vAge; float edge=smoothstep(.0,.45,vSide)*smoothstep(1.,.9,vSide); float core=smoothstep(.62,.97,vSide)*life; vec3 col=mix(c0,c1,core); float a=life*life*edge*1.5*boost; gl_FragColor=vec4(col*a,a); }',
  });
  for (const f of F) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 2 * 3), age = new Float32Array(N * 2), side = new Float32Array(N * 2), idx = [];
    for (let i = 0; i < N; i++) { side[i * 2] = 0; side[i * 2 + 1] = 1; if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('age', new THREE.BufferAttribute(age, 1)); geo.setAttribute('side', new THREE.BufferAttribute(side, 1)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, trailMat(colors(f))); m.frustumCulled = false; m.renderOrder = 5; scene.add(m);
    f.trail = { m, samples: [], tip: V3(), base: V3() };
  }
  const LIFE = .16;
  function trailStep(f, dt, active) {
    const t = f.trail; f.g.userData.bladePoints(t.tip, t.base);
    for (const s of t.samples) s.age += dt;
    if (active) { const tip = t.tip.clone().add(t.tip.clone().sub(t.base).multiplyScalar(.12)); t.samples.unshift({ tip, base: t.base.clone().lerp(t.tip, .3), age: 0 }); }
    while (t.samples.length > N || (t.samples.length && t.samples[t.samples.length - 1].age > LIFE)) t.samples.pop();
    const P = t.m.geometry.attributes.position, A = t.m.geometry.attributes.age;
    for (let i = 0; i < N; i++) { const s = t.samples[Math.min(i, t.samples.length - 1)]; if (!s) { A.array[i * 2] = A.array[i * 2 + 1] = 1; continue; } P.setXYZ(i * 2, s.base.x, s.base.y, s.base.z); P.setXYZ(i * 2 + 1, s.tip.x, s.tip.y, s.tip.z); A.array[i * 2] = A.array[i * 2 + 1] = Math.min(1, s.age / LIFE + (i >= t.samples.length ? 1 : 0)); }
    P.needsUpdate = A.needsUpdate = true; t.m.visible = t.samples.length > 1;
  }

  // ---------- HUD ----------
  const css = document.createElement('style'); css.textContent = `
  #duel{position:fixed;inset:0;pointer-events:none;z-index:6;font-family:inherit}#duel[hidden]{display:none}
  #duel .bars{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:min(980px,94vw);display:flex;gap:64px;justify-content:space-between}
  #duel .side{flex:1}#duel .side.r{text-align:right}
  #duel .nm{color:#f5efe2;font-size:15px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;text-shadow:0 1px 4px #000}
  #duel .nm small{opacity:.7;font-weight:400;letter-spacing:.08em;text-transform:none;margin:0 8px;font-size:12px}
  #duel .hp{height:16px;margin-top:6px;background:rgba(10,12,18,.7);border:1px solid rgba(255,255,255,.45);transform:skewX(-20deg);overflow:hidden;position:relative}
  #duel .hp i{display:block;height:100%;transition:width .12s;position:relative;z-index:1}#duel .hp b{position:absolute;top:0;height:100%;background:#fff6;transition:width .7s .25s}
  #duel .l .hp b{left:0}#duel .r .hp b{right:0}#duel .side.r .hp i{margin-left:auto}
  #duel .l .hp i{background:linear-gradient(90deg,#1f6f78,#7fe8ef)}#duel .r .hp i{background:linear-gradient(270deg,#7a1428,#ff6a4a)}
  #duel .gd{height:4px;margin-top:3px;width:62%;background:rgba(10,12,18,.55);transform:skewX(-20deg);overflow:hidden}#duel .r .gd{margin-left:auto}#duel .gd i{display:block;height:100%;background:#cfd8e0}#duel .r .gd i{margin-left:auto}
  #duel .art{height:7px;margin-top:4px;background:rgba(10,12,18,.6);transform:skewX(-20deg);overflow:hidden}#duel .r .art i{margin-left:auto}#duel .art i{display:block;height:100%;background:#f3e3a8}
  #duel .art.full i{background:linear-gradient(90deg,#fff6c8,#ffd36a);box-shadow:0 0 14px #ffd36a;animation:artp .6s infinite alternate}@keyframes artp{to{filter:brightness(1.5)}}
  #duel .round{position:absolute;top:22px;left:50%;transform:translateX(-50%);color:#fff;font-size:12px;letter-spacing:.3em;text-shadow:0 1px 3px #000}
  #duel .keys{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.85);font-size:12px;letter-spacing:.05em;text-shadow:0 1px 3px #000;white-space:nowrap}
  #duel .keys b{display:inline-block;min-width:16px;padding:1px 5px;margin:0 3px 0 10px;border:1px solid rgba(255,255,255,.55);border-radius:4px;font-weight:600}
  #duel .pads{position:absolute;right:18px;bottom:96px;display:none;gap:10px;pointer-events:auto;flex-wrap:wrap;width:220px;justify-content:flex-end}
  #duel .pads button{width:62px;height:62px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:rgba(10,14,20,.5);color:#fff;font:600 12px inherit}
  @media (pointer:coarse){#duel .pads{display:flex}#duel .keys{display:none}}
  body.dueling #destination-shortcuts,body.dueling #views-toggle,body.dueling #controls,body.dueling #location,body.dueling #objective,body.dueling #crosshair,body.dueling #compass,body.dueling #interact,body.dueling #arena-label,body.dueling #home,body.dueling #world-map-toggle,body.dueling #time-toggle,body.dueling #audio-toggle,body.dueling #journal-toggle{display:none!important}`;
  document.head.append(css);
  const hud = document.createElement('div'); hud.id = 'duel'; hud.hidden = true;
  hud.innerHTML = `<div class="bars"><div class="side l"><div class="nm">Haru<small>Apprentice Warden</small></div><div class="hp"><b id="hpd-l"></b><i id="hp-l"></i></div><div class="gd"><i id="gd-l"></i></div><div class="art" id="art-l"><i></i></div></div><div class="side r"><div class="nm"><small>Bell Warden</small>Mitsuki</div><div class="hp"><b id="hpd-r"></b><i id="hp-r"></i></div><div class="gd"><i id="gd-r"></i></div><div class="art" id="art-r"><i></i></div></div></div><div class="round" id="duel-round"></div><div class="keys"><b>F</b>sword <b>G</b>kick <b>E</b>throw <b>Q</b>guard · tap to parry <b>Space</b>dash <b>C</b>jump <b>R</b>art <b>S+F</b>launch <b>K</b>watch</div><div class="pads"><button data-pad="jump">Jump</button><button data-pad="kick">Kick</button><button data-pad="dodge">Dash</button><button data-pad="guard">Guard</button><button data-pad="attack">Strike</button><button data-pad="art">Art</button></div>`;
  document.body.append(hud);
  const $ = id => hud.querySelector('#' + id);
  function hudUpdate() {
    $('hp-l').style.width = H.hp + '%'; $('hp-r').style.width = R.hp + '%'; $('hpd-l').style.width = H.hp + '%'; $('hpd-r').style.width = R.hp + '%';
    $('gd-l').style.width = H.guardHp + '%'; $('gd-r').style.width = R.guardHp + '%';
    for (const [f, id] of [[H, 'art-l'], [R, 'art-r']]) { $(id).firstChild.style.width = Math.min(100, f.art) + '%'; $(id).classList.toggle('full', f.art >= 100); }
  }
  // without the effects module the fight still reads: a plain text banner
  const fallback = document.createElement('div'); fallback.style.cssText = 'position:fixed;top:38%;left:0;right:0;text-align:center;color:#fff;font-size:44px;font-weight:700;letter-spacing:.12em;text-shadow:0 3px 0 #000;pointer-events:none;z-index:7;opacity:0;transition:opacity .2s'; document.body.append(fallback);
  let fallbackT = 0;
  function callout(text, sub = '', color = '#fff') { if (fx?.callout) fx.callout(text, { sub, color }); else { fallback.innerHTML = text + (sub ? `<div style="font-size:14px;letter-spacing:.3em">${sub}</div>` : ''); fallback.style.opacity = 1; fallbackT = 1.2; } }

  // ---------- state ----------
  let active = false, auto = false, hitStop = 0, slow = 0, slowScale = 1, shake = 0, phase = 'off', phaseT = 0, round = 1, arena = null, place = { x: 0, z: 0, y: 0 }, clashChain = 0, clashT = -9, clock = 0, lockState = null;
  const input = { attack: false, kick: false, grab: false, guard: false, dodge: false, art: false, jump: false };
  const clipOf = f => f.a.clip, kind = f => f.a.clip.kind;
  const playing = f => !f.a.clip.loop && !f.a.done;
  const isAttack = f => ['cut', 'kick', 'art', 'body'].includes(kind(f)) && (clipOf(f).hits || []).length > 0 && playing(f);
  const busy = f => playing(f) && !['guard'].includes(kind(f));
  const reacting = f => kind(f) === 'react' && playing(f) || f.a.name === 'launched' || f.a.name === 'lock' || f.a.name === 'thrown' || f.carry;
  const down = f => ['down', 'crash', 'ko', 'thrown'].includes(f.a.name) && !f.a.done;
  const facing = f => f.g.rotation.y;
  const dirTo = (a, b) => Math.atan2(b.g.position.x - a.g.position.x, b.g.position.z - a.g.position.z);
  const dist = (a, b) => Math.hypot(b.g.position.x - a.g.position.x, b.g.position.z - a.g.position.z);
  const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const turn = (f, target, rate, dt) => { f.g.rotation.y += angDiff(f.g.rotation.y, target) * Math.min(1, rate * dt); };
  const fwd = f => V3(Math.sin(facing(f)), 0, Math.cos(facing(f)));
  const chest = (f, out = V3()) => f.g.userData.bones.chest.getWorldPosition(out);

  let boxOn = false;
  function play(f, name, fade) { if (name !== 'art') f.isArt = false; f.a.restart(name, fade); f.hitDone.clear(); f.hasPrev = false; }
  function startAttack(f, name) {
    if (!f.a.clips[name]) return false;
    play(f, name); f.queue = null;
    if (name === 'kick' && (f === H || Math.random() < .4)) director?.cue('kick', { who: f.side, at: chest(f) });
    if (name === 'art') {
      f.art = 0; f.isArt = true; const dur = f.a.clip.dur;
      { const m0 = f.a.clip.move?.[0]; const reach = m0 ? (m0[1] - m0[0]) * m0[2] : 3; f.artReach = Math.max(.35, Math.min(3, (dist(f, f.foe) - .4) / reach)); }
      director?.cue('art', { who: f.side, dur: Math.min(3.4, dur + 1.4) }); slow = .85; slowScale = .1;
      fx?.cutIn?.({ who: f.g, side: f === H ? 'left' : 'right', art: f === H ? 'Veil Art' : 'Bell Art', name: f === H ? 'Sky-Current Crescent' : 'Ember Bell Descent', kanji: f === H ? '天流' : '燼鐘', color: f === H ? '#6fe7ff' : '#ff6a4a' }, 1.3);
      fx?.flash?.(f === H ? '#bff6ff' : '#ffd0c0', .25, .6); fx?.speedLines?.(1.2, { kind: 'radial', dur: .6 });
    }
    return true;
  }

  // ---------- actions ----------
  function canAct(f) { return f.hp > 0 && phase === 'fight' && !reacting(f) && !down(f) && !f.carry; }
  function doSword(f) {
    if (!canAct(f)) return;
    if (f.air && !['airCut'].includes(f.a.name)) { startAttack(f, 'airCut'); return; }
    const n = f.a.name;
    if (n === 'dashIn' && playing(f)) { startAttack(f, 'dashAttack'); f.comboKind = 'sword'; f.comboIdx = 3; return; }
    if (isAttack(f)) { // queue the next cut in the chain
      const seq = f.a.combos[f.comboKind || 'sword'], i = seq.indexOf(n);
      if (f.comboKind === 'sword' && i >= 0 && i < seq.length - 1 && f.a.time >= (clipOf(f).chain ?? 0) * .45) f.queue = seq[i + 1];
      else if (f.comboKind === 'kick' && f.a.time > (clipOf(f).chain ?? 0) * .45) f.queue = 'c2';
      return;
    }
    if (busy(f) && !(f.a.time > (clipOf(f).cancel ?? 99))) return;
    if (f.launchIntent) { f.launchIntent = false; startAttack(f, 'launcher'); f.comboKind = 'sword'; f.comboIdx = 0; return; }
    startAttack(f, 'c1'); f.comboKind = 'sword';
  }
  function doKick(f) {
    if (!canAct(f) || f.air) return;
    const n = f.a.name;
    if (isAttack(f)) { const seq = f.a.combos.kick, i = seq.indexOf(n); if (f.comboKind === 'kick' && i >= 0 && i < seq.length - 1 && f.a.time >= (clipOf(f).chain ?? 0) * .45) f.queue = seq[i + 1]; else if (f.comboKind === 'sword' && f.a.time > (clipOf(f).chain ?? 0) * .5) f.queue = 'kick'; return; }
    if (busy(f) && !(f.a.time > (clipOf(f).cancel ?? 99))) return;
    startAttack(f, dist(f, f.foe) > 2.6 && f.ai ? 'sweep' : 'kick'); f.comboKind = 'kick';
  }
  function doGrab(f) {
    if (!canAct(f) || f.air || busy(f)) return;
    const o = f.foe; if (dist(f, o) > 1.55 || o.air || down(o) || o.carry || o.invul > 0 || Math.abs(angDiff(facing(f), dirTo(f, o))) > 1) { play(f, 'recoil'); f.whiff = true; return; }
    play(f, 'grab'); f.whiff = false; f.throwing = true;
    o.carry = { by: f, t: 0, from: o.g.position.clone(), dir: fwd(f) }; play(o, 'thrown', .05); o.queue = null; o.vel.set(0, 0, 0);
    callout('Throw', '', '#fff'); director?.cue('clash', { at: chest(o) });
  }
  function doDodge(f, dirAngle) {
    if (f.hp <= 0 || phase !== 'fight' || reacting(f) || down(f) || f.air) return;
    if (busy(f) && !(isAttack(f) && f.a.time > (clipOf(f).cancel ?? 9))) return;
    const rel = angDiff(facing(f), dirAngle ?? facing(f) + Math.PI);
    let name, speed;
    if (Math.abs(rel) < .7) { name = 'dashIn'; speed = 11; } else if (Math.abs(rel) > 2.4) { name = f.guardHeld ? 'backflip' : 'backstep'; speed = name === 'backflip' ? 5.5 : 7.5; } else { name = rel > 0 ? 'stepL' : 'stepR'; speed = 7.5; }
    play(f, name); f.invul = name === 'dashIn' ? .12 : .22;
    const a = name === 'dashIn' ? facing(f) : (dirAngle ?? facing(f) + Math.PI); f.vel.set(Math.sin(a) * speed, 0, Math.cos(a) * speed);
    fx?.dust?.(V3(f.g.position.x, f.g.position.y + .05, f.g.position.z), { size: .8, count: 6 });
    if (name !== 'dashIn' || Math.random() < .5) fx?.afterimage?.(f.g, { color: colors(f)[0], life: .3 });
    if (name === 'dashIn' && f === H && Math.random() < .35) director?.cue('dash', { who: f.side });
  }
  function doJump(f) { if (!canAct(f) || f.air || busy(f)) return; play(f, 'jump'); f.air = true; f.vy = 6.8; fx?.dust?.(V3(f.g.position.x, f.g.position.y + .05, f.g.position.z), { size: .7, count: 6 }); }
  function doArt(f) { if (f.art < 100 || !canAct(f) || f.air || (busy(f) && !isAttack(f))) return; startAttack(f, 'art'); f.comboKind = null; }

  // ---------- contact geometry ----------
  const tmp = { a: V3(), b: V3(), c: V3(), d: V3(), e: V3() };
  // closest points between segments p1-q1 and p2-q2; returns squared distance and the two points
  function segSeg(p1, q1, p2, q2, c1, c2) {
    const d1 = tmp.a.subVectors(q1, p1), d2 = tmp.b.subVectors(q2, p2), r = tmp.c.subVectors(p1, p2);
    const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r); let s, t;
    if (a <= 1e-9 && e <= 1e-9) { s = t = 0; }
    else if (a <= 1e-9) { s = 0; t = Math.min(1, Math.max(0, f / e)); }
    else { const c = d1.dot(r); if (e <= 1e-9) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else { const b = d1.dot(d2), den = a * e - b * b; s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
    c1.copy(p1).addScaledVector(d1, s); c2.copy(p2).addScaledVector(d2, t); return c1.distanceToSquared(c2);
  }
  // the body as two capsules: hips to the crown, and between the feet up to the hips
  function bodyCaps(f) {
    const B = f.g.userData.bones, hips = B.hips.getWorldPosition(V3()), head = B.head.getWorldPosition(V3()).add(V3(0, .12, 0));
    const fl = B.footL.getWorldPosition(V3()), fr = B.footR.getWorldPosition(V3()), feet = fl.clone().add(fr).multiplyScalar(.5);
    return [[hips, head, .24], [feet, hips, .19]];
  }
  function limbPoint(f, limb) {
    const B = f.g.userData.bones;
    if (limb === 'footL' || limb === 'footR') return [B[limb].getWorldPosition(V3()), .16];
    if (limb === 'handL') return [B.handL.getWorldPosition(V3()), .15];
    return [B.chest.getWorldPosition(V3()), .32];
  }
  // did this fighter's active hit connect this frame? returns the contact point or null
  function contact(f, h) {
    const caps = bodyCaps(f.foe), c1 = V3(), c2 = V3();
    if (h.limb === 'blade') {
      const tip = V3(), base = V3(); f.g.userData.bladePoints(tip, base);
      const pt = f.hasPrev ? f.prevTip : tip, pb = f.hasPrev ? f.prevBase : base;
      let best = null, bestD = 1e9;
      for (let k = 0; k <= 3; k++) { // the swept blade between last frame and this one
        const s = k / 3, A = pb.clone().lerp(base, s), Bp = pt.clone().lerp(tip, s);
        for (const [p, q, r] of caps) { const d = segSeg(A, Bp, p, q, c1, c2); if (d < r * r && d < bestD) { bestD = d; best = c1.clone().lerp(c2, .4); } }
      }
      return best;
    }
    const [p, r0] = limbPoint(f, h.limb);
    for (const [a, b, r] of caps) { const d = segSeg(p, p, a, b, c1, c2); if (d < (r + r0) * (r + r0)) return c2.clone().lerp(p, .5); }
    return null;
  }
  function bladeSeg(f) { const tip = V3(), base = V3(); f.g.userData.bladePoints(tip, base); return [base, tip]; }

  // ---------- resolving hits ----------
  function activeHits(f) { const c = clipOf(f), t = f.a.time; return (c.hits || []).map((h, i) => ({ h, i })).filter(({ h, i }) => t >= h.t0 && t <= h.t1 && !f.hitDone.has(i)); }
  function resolve(f) {
    const o = f.foe; if (o.hp <= 0 && phase !== 'fight') return;
    for (const { h, i } of activeHits(f)) {
      if (o.invul > 0 || o.carry || (down(o) && !o.air)) continue;
      // blades meeting in flight
      if (h.limb === 'blade' && isAttack(o) && activeHits(o).some(x => x.h.limb === 'blade')) {
        const [a1, b1] = bladeSeg(f), [a2, b2] = bladeSeg(o), p1 = V3(), p2 = V3();
        if (segSeg(a1, b1, a2, b2, p1, p2) < .09 * .09 && !f.isArt && !o.isArt) { clash(f, o, p1.lerp(p2, .5)); return; }
      }
      const at = contact(f, h); if (!at) continue;
      f.hitDone.add(i);
      land(f, o, h, at);
      if (o.hp <= 0) return;
    }
  }
  function clash(a, b, at) {
    for (const f of [a, b]) { play(f, 'recoil'); f.queue = null; f.vel.copy(fwd(f)).multiplyScalar(-3.2); f.art += 4; }
    hitStop = .12; shake = Math.max(shake, .2);
    fx?.clashBurst?.(at, {}); fx?.impactFrame?.('white', .05);
    const recent = clock - clashT < 1.6; clashChain = recent ? clashChain + 1 : 1; clashT = clock;
    if (clashChain >= 2 || Math.random() < .22) startLock(at);
    else { director?.cue('clash', { at }); callout('Clash', '', '#ffe2a0'); }
  }
  function startLock(at) {
    clashChain = 0;
    const mid = H.g.position.clone().add(R.g.position).multiplyScalar(.5), axis = R.g.position.clone().sub(H.g.position).setY(0).normalize();
    lockState = { t: 0, push: 0, dur: 2.4, at: at.clone(), mid, axis };
    for (const f of [H, R]) { play(f, 'lock', .05); f.queue = null; f.vel.set(0, 0, 0); }
    const heads = H.g.userData.bones.head.getWorldPosition(V3()).lerp(R.g.userData.bones.head.getWorldPosition(V3()), .5).add(V3(0, -.12, 0));
    director?.cue('lock', { at: heads, dur: 2.0 }); callout('Blade Lock', 'press F rapidly', '#ffe2a0');
    fx?.clashBurst?.(at, {}); fx?.speedLines?.(1, { kind: 'radial', dur: .8 });
  }
  function lockStep(dt, out) {
    const L = lockState; L.t += dt;
    // the AI pushes at a steady rate; the player pushes by pressing F
    L.push += (R.ai ? -1 : 0) * dt * 1.6 + (H.ai ? dt * 1.6 * (Math.random() < .5 ? 1 : .6) : 0);
    if (input.attack && !H.ai) L.push += .18;
    const off = Math.max(-.3, Math.min(.3, L.push * .1));
    const hp = L.mid.clone().addScaledVector(L.axis, -.56 + off); out.dx += hp.x - H.g.position.x; out.dz += hp.z - H.g.position.z; H.g.position.x = hp.x; H.g.position.z = hp.z;
    const rp = L.mid.clone().addScaledVector(L.axis, .56 + off); R.g.position.x = rp.x; R.g.position.z = rp.z;
    H.g.rotation.y = Math.atan2(L.axis.x, L.axis.z); R.g.rotation.y = H.g.rotation.y + Math.PI;
    if (Math.random() < dt * 14) fx?.sparks?.(L.at.clone().add(V3((Math.random() - .5) * .1, (Math.random() - .5) * .1, 0)), { count: 3, speed: 3 });
    if (L.t > L.dur || Math.abs(L.push) > 3) {
      const w = L.push >= 0 ? H : R, l = w.foe; lockState = null;
      play(w, 'parry'); play(l, 'guardBreak'); l.guardHp = 0; l.vel.copy(fwd(l)).multiplyScalar(-6); w.art += 15;
      hitStop = .1; fx?.clashBurst?.(L.at, {}); fx?.impactFrame?.('ink', .07); director?.cue('end');
      callout(w === H ? 'Haru breaks through' : 'Mitsuki breaks through', '', '#ffe2a0');
    }
  }
  function land(f, o, h0, at) {
    let h = h0;
    const blockable = !h.unblockable && !f.isArt;
    const facingAttacker = Math.abs(angDiff(facing(o), dirTo(o, f))) < 1.7;
    const guarding = (o.a.name === 'guard' || o.a.name === 'guardHigh' || o.a.name === 'parry') && facingAttacker && !o.air;
    const push = V3(o.g.position.x - f.g.position.x, 0, o.g.position.z - f.g.position.z).normalize();
    // a guard raised in the last instant is a parry
    if (blockable && facingAttacker && !o.air && h.limb === 'blade' && clock - o.guardPress < .2 && o.guardPress > 0) {
      play(o, 'parry'); play(f, 'deflected'); f.queue = null; f.vel.copy(push).multiplyScalar(-2.5); o.art += 18; o.guardPress = -9;
      hitStop = .08; slow = .45; slowScale = .25;
      fx?.clashBurst?.(at, {}); fx?.impactFrame?.('invert', .06); director?.cue('parry', { at, by: o.side }); callout('Parry', o === H ? 'Counter now' : '', '#bff6ff');
      return;
    }
    if (blockable && guarding) {
      if (h.guardBreak || o.guardHp <= 18) {
        play(o, 'guardBreak'); o.guardHp = 0; o.vel.copy(push).multiplyScalar(4); o.queue = null; hitStop = .1; shake = Math.max(shake, .2);
        fx?.hitBurst?.(at, { color: 0xffffff, size: 1.1 }); callout('Guard Break', '', '#ffb070'); director?.cue('clash', { at });
        return;
      }
      if (o.a.name !== 'guardHigh' && at.y > o.g.position.y + 1.45) play(o, 'guardHigh', .04);
      o.guardHp = Math.max(0, o.guardHp - (h.dmg * 1.8)); o.vel.copy(push).multiplyScalar(2.6 + (h.kb || 0) * .3); o.art += 4; f.art += 2;
      hitStop = .06; shake = Math.max(shake, .06);
      const [ga, gb] = bladeSeg(o), gp = V3(), ap = V3(); segSeg(ga, gb, at, at, gp, ap);
      fx?.sparks?.(gp, { count: 26, speed: 6 }); fx?.clashBurst && Math.random() < .3 && fx.clashBurst(gp, {});
      o.g.userData.mesh && o.a.flash(.25);
      return;
    }
    // a clean hit
    const heavy = !!h.heavy || h.type === 'down' && h.dmg >= 10;
    f.hits = clock - f.lastHitT < 1.4 ? f.hits + 1 : 1; f.lastHitT = clock; if (f === H && f.hits >= 2) fx?.hitCounter?.(f.hits);
    if (f.hits >= 5 && !['down', 'launch', 'spike'].includes(h.type) && !o.air) h = { ...h, type: 'down', kb: 5.5 };
    const dmg = h.dmg * (o.air ? .8 : 1) * Math.max(.5, 1 - .09 * (f.hits - 1)); o.hp = Math.max(0, o.hp - dmg); f.art += dmg * 1.5; o.art += dmg * .7; o.guardHp = Math.min(100, o.guardHp + 4);
    const col = colors(f)[0];
    fx?.hitBurst?.(at, { color: col, size: heavy ? 1.6 : 1, heavy }); fx?.sparks?.(at, { color: col, count: heavy ? 40 : 18, speed: heavy ? 10 : 7 });
    o.a.flash(heavy ? .65 : .45); hitStop = heavy ? .15 : .075; shake = Math.max(shake, heavy ? .32 : .12);
    if (heavy) { fx?.impactFrame?.('ink', .07); fx?.speedLines?.(1, { kind: 'radial', dur: .35 }); }
    director?.cue('hit', { at, heavy, attacker: f.side });
    o.queue = null; o.comboKind = null;
    if (o.hp <= 0) { ko(f, o, push); return; }
    const t = o.air && h.type !== 'spike' && h.type !== 'launch' ? 'juggle' : h.type;
    if (t === 'launch') { o.air = true; o.vy = h.up || 7; o.vel.copy(push).multiplyScalar(h.kb || 1); play(o, 'launched', .04); director?.cue('launch', { who: o.side }); fx?.dust?.(V3(o.g.position.x, o.g.position.y + .05, o.g.position.z), { size: 1, count: 8 }); callout('Launch', '', '#fff'); }
    else if (t === 'juggle') { o.vy = Math.max(o.vy, 3.2); o.vel.copy(push).multiplyScalar(1.5); play(o, 'launched', .03); }
    else if (t === 'spike') { if (o.air) { o.vy = -(h.down || 9); o.spiked = true; play(o, 'launched', .03); } else { play(o, 'down', .04); o.vel.copy(push).multiplyScalar(h.kb || 3); director?.cue('down', { who: o.side }); } }
    else if (t === 'down') { play(o, 'down', .04); o.vel.copy(push).multiplyScalar(h.kb || 5); o.invul = 1.2; director?.cue('down', { who: o.side }); if (heavy) fx?.shockwave?.(V3(o.g.position.x, o.g.position.y + .05, o.g.position.z), { color: col, radius: 2.6 }); }
    else if (t === 'stagger') { play(o, 'stagger', .04); o.vel.copy(push).multiplyScalar(h.kb || 4); }
    else { play(o, at.y > o.g.position.y + 1.3 ? 'hitHigh' : 'hitMid', .03); o.vel.copy(push).multiplyScalar(h.kb || 2.5); }
  }
  function ko(f, o, push) {
    play(o, 'ko', .04); o.vel.copy(push).multiplyScalar(4); o.air = false; o.vy = 0;
    phase = 'ko'; phaseT = 0; slow = 1.6; slowScale = .22; hitStop = .2;
    fx?.impactFrame?.('ink', .1); fx?.flash?.('#ffffff', .3, .7); fx?.speedLines?.(1.4, { kind: 'radial', dur: 1 }); fx?.hitCounter?.(0);
    director?.cue('ko', { winner: f.side, loser: o.side });
    callout(f === H ? 'Haru wins' : 'Mitsuki wins', f === H ? '“Good. Again, from the top.”' : '“Up. A Warden gets back up.”', f === H ? '#bff6ff' : '#ffc0b0');
  }

  // ---------- AI ----------
  const rnd = () => Math.random();
  function ai(f, dt) {
    const o = f.foe, d = dist(f, o); f.think -= dt; f.cool -= dt;
    if (!canAct(f)) return { move: 0 };
    // reading the opponent's attack: parry, guard, step aside, or meet it
    if (isAttack(o) && d < 3.2 && !isAttack(f) && f.react !== o.a.name + o.comboIdx + Math.round(o.a.time * 0) && o.a.time < (clipOf(o).hits?.[0]?.t0 ?? 0)) {
      f.react = o.a.name + o.comboIdx; const r = rnd(), lead = (clipOf(o).hits[0].t0 - o.a.time);
      if (o.isArt) { if (r < .18) doDodge(f, dirTo(o, f) + (rnd() < .5 ? 1.4 : -1.4)); else f.guardT = .9; }
      else if (r < .2 && lead < .16) { f.guardPress = clock; f.guardT = .35; }
      else if (r < .5) f.guardT = .5;
      else if (r < .65) doDodge(f, dirTo(o, f) + (rnd() < .5 ? 1.5 : -1.5));
      else if (r < .75 && kind(o) === 'cut') { startAttack(f, 'c1'); f.comboKind = 'sword'; } // meet the cut: likely a clash
    }
    if (!isAttack(o)) f.react = null;
    f.guardT = (f.guardT || 0) - dt;
    if (f.guardT > 0 && !isAttack(f)) { if (o.guardHeld && d < 1.6 && rnd() < dt * 2) { doGrab(f); } return { guard: true, move: 0 }; }
    if (isAttack(f)) { if (f.wantCombo > 0 && !f.queue && f.a.time >= (clipOf(f).chain ?? 0) * .7) { f.wantCombo--; if (f.comboKind === 'sword') doSword(f); else doKick(f); } return { move: 0 }; }
    if (busy(f)) return { move: 0 };
    // punish openings
    if (['deflected', 'guardBreak', 'stagger'].includes(o.a.name) && playing(o) && d < 2.6) { startAttack(f, rnd() < .5 ? 'c1' : 'launcher'); f.comboKind = 'sword'; f.wantCombo = 1 + Math.floor(rnd() * 3); return { move: 0 }; }
    if (o.air && o.a.name === 'launched' && d < 2.4 && o.y > .8 && !f.air && rnd() < dt * 5) { doJump(f); f.airChase = true; return { move: 0 }; }
    if (f.art >= 100 && d < 4 && !o.air && rnd() < dt * .9) { doArt(f); return { move: 0 }; }
    if (f.think <= 0) {
      f.think = .2 + rnd() * .3;
      if (d > 4.5) f.plan = rnd() < .45 ? 'dash' : 'close';
      else if (d > 2.3) f.plan = rnd() < .25 && f.cool <= 0 ? 'dashAttack' : 'close';
      else if (d < 1.0) f.plan = rnd() < .5 ? 'back' : 'attack';
      else if (f.cool <= 0 && rnd() < .72) f.plan = 'attack';
      else { f.plan = 'circle'; if (rnd() < .35) f.strafe *= -1; }
    }
    const a = dirTo(f, o);
    if (f.plan === 'attack') {
      f.plan = null; f.cool = .7 + rnd() * 1.2; const r = rnd();
      if (o.guardHeld || o.a.name === 'guard') { if (r < .45) doKick(f); else if (r < .7 && d < 1.5) doGrab(f); else { startAttack(f, 'c1'); f.comboKind = 'sword'; } }
      else if (r < .58) { startAttack(f, 'c1'); f.comboKind = 'sword'; }
      else if (r < .75) { startAttack(f, 'launcher'); f.comboKind = 'sword'; }
      else if (r < .9) doKick(f);
      else if (d < 1.5) doGrab(f); else { startAttack(f, 'c1'); f.comboKind = 'sword'; }
      f.wantCombo = Math.floor(rnd() * 3.2);
      return { move: 0 };
    }
    if (f.plan === 'dash') { f.plan = 'close'; doDodge(f, a); return { move: 0 }; }
    if (f.plan === 'dashAttack') { f.plan = null; f.cool = 1.2; doDodge(f, a); f.dashThen = true; return { move: 0 }; }
    if (f.plan === 'close') return { move: d > 4 ? 6 : 4.2, dir: a };
    if (f.plan === 'back') return { move: 2.6, dir: a + Math.PI };
    if (f.plan === 'circle') return { move: 1.8, dir: a + f.strafe * Math.PI / 2, slow: true };
    return { move: 0 };
  }

  // ---------- flow ----------
  function setRegion(ar, walkHeight) {
    arena = ar; const [cx, , cz] = ar.center, half = Math.min(ar.size[0], ar.size[1]) / 2;
    place = { x: cx, z: cz - half * .35, y: walkHeight ? walkHeight(cx, cz - half * .35) : 0 };
    stop(true); R.g.position.set(place.x, place.y, place.z); R.g.rotation.y = 0; R.a.play('idle', 0); R.g.userData.setDrawn(false);
  }
  function inArena(x, z) { if (!arena) return false; const [cx, , cz] = arena.center; return Math.abs(x - cx) < arena.size[0] / 2 && Math.abs(z - cz) < arena.size[1] / 2; }
  function resetFighters() {
    for (const f of F) { f.hp = 100; f.guardHp = 100; f.vel.set(0, 0, 0); f.y = 0; f.vy = 0; f.air = false; f.queue = null; f.isArt = false; f.carry = null; f.invul = 0; f.hits = 0; }
    lockState = null;
  }
  function start() {
    if (active) return; active = true; round = 1; resetFighters(); H.art = R.art = 0; hud.hidden = false; document.body.classList.add('dueling'); hudUpdate();
    phase = 'intro'; phaseT = 0; $('duel-round').textContent = 'ROUND 1';
    for (const f of F) { f.g.userData.setDrawn(false); play(f, 'draw', .2); f.g.rotation.y = dirTo(f, f.foe); }
    director?.reset(); director?.cue('intro');
    fx?.vsSplash?.({ left: { who: H.g, name: 'Haru', title: 'Apprentice Warden', kanji: '晴', color: '#6fe7ff' }, right: { who: R.g, name: 'Mitsuki', title: 'Bell Warden', kanji: '光月', color: '#ff6a4a' } }, 2.4);
    toast('Mitsuki draws her blade. “Show me what the valley taught you.”');
  }
  // fire one of every effect out of sight so the renderer can compile them during loading
  function warm() {
    if (fx) { const hide = V3(H.g.position.x, H.g.position.y - 40, H.g.position.z), q = new THREE.Quaternion();
      for (const f of F) { fx.afterimage?.(f.g, { color: colors(f)[0], life: .05 }); fx.slashArc?.({ center: hide, quat: q, color: colors(f), life: .05, style: f === H ? 'water' : 'ember' }); }
      fx.sparks?.(hide, { count: 2 }); fx.hitBurst?.(hide, { color: 0xffffff, size: .1 }); fx.clashBurst?.(hide, {}); fx.dust?.(hide, { count: 1 }); fx.debris?.(hide, { count: 1 }); fx.shockwave?.(hide, { radius: .1 }); }
    for (const f of F) { f.trail.m.visible = true; }
  }
  function stop(silent) {
    document.body.classList.remove('dueling'); fx?.clear?.(); fx?.letterbox?.(false); boxOn = false;
    if (!active && silent) { hud.hidden = true; return; }
    active = false; auto = false; hud.hidden = true; H.ai = false; phase = 'off'; lockState = null;
    for (const f of F) { f.a.play('idle', .3); f.a.sheathe(); f.queue = null; f.vel.set(0, 0, 0); f.isArt = false; f.carry = null; f.air = false; f.y = 0; f.vy = 0; }
    if (!silent) toast('The spar ends. Mitsuki sheathes her blade and waits by the battle ground.');
  }
  addEventListener('keydown', e => {
    if (!active || e.target.matches?.('input,textarea') || document.querySelector('dialog[open]')) return; const k = e.key.toLowerCase(); if (e.repeat) return;
    if (k === 'f') input.attack = true; if (k === 'g') input.kick = true; if (k === 'e') input.grab = true; if (k === ' ') input.dodge = true; if (k === 'c') input.jump = true; if (k === 'r') input.art = true;
    if (k === 'q') H.guardPress = clock;
    if (k === 'k') { auto = !auto; H.ai = auto; toast(auto ? 'Watching: Haru and Mitsuki spar on their own. Press K to take over.' : 'You have Haru again.'); }
  });
  const held = new Set(); addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k === 'q' || k === 's' || k === 'arrowdown') held.add(k); }); addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
  let downAt = null; const canvas = document.querySelector('#world');
  canvas?.addEventListener('pointerdown', e => { if (!active) return; if (e.button === 2) { held.add('rmb'); H.guardPress = clock; return; } downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas?.addEventListener('pointerup', e => { if (e.button === 2) { held.delete('rmb'); return; } if (active && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && performance.now() - downAt.t < 350) input.attack = true; downAt = null; });
  canvas?.addEventListener('contextmenu', e => { if (active) e.preventDefault(); });
  hud.querySelectorAll('[data-pad]').forEach(b => { b.addEventListener('pointerdown', e => { e.preventDefault(); const p = b.dataset.pad; if (p === 'guard') { held.add('pad'); H.guardPress = clock; } else input[p] = true; }); b.addEventListener('pointerup', () => { if (b.dataset.pad === 'guard') held.delete('pad'); }); });

  // effects tied to the animation clock (leaps, landings, dashes, art crescents)
  for (const f of F) f.a.on((e, clip) => {
    if (!active) return;
    const p = V3(f.g.position.x, f.g.position.y + .05, f.g.position.z);
    if (e.type === 'jump') fx?.dust?.(p, { size: .8, count: 6 });
    if (e.type === 'land') { fx?.dust?.(p, { size: e.heavy ? 1.6 : .9, count: e.heavy ? 12 : 6 }); if (e.heavy) { fx?.debris?.(p, { count: 14, power: 1 }); fx?.shockwave?.(p, { color: colors(f)[0], radius: 3 }); shake = Math.max(shake, .25); } }
    if (e.type === 'dash') { fx?.afterimage?.(f.g, { color: colors(f)[0], life: .35 }); fx?.dust?.(p, { size: 1, count: 8 }); if (f.isArt) fx?.speedLines?.(1, { kind: 'horizontal', dur: .35 }); }
    if (e.type === 'arc') arcFx(f, e);
  });
  function arcFx(f, e) {
    if (!fx?.slashArc) return;
    const c = clipOf(f), seg = c.segs ? c.segs.find(s => f.a.time <= s.t1) : null, plane = seg ? seg.clip.plane : c.plane; if (!plane) return;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facing(f) + (seg?.ry || 0), 0));
    const X = V3(...plane.u).applyQuaternion(q), Y = V3(...plane.f).applyQuaternion(q), Z = V3().crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
    const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    const center = chest(f).add(fwd(f).multiplyScalar(.25));
    fx.slashArc({ center, quat, radius: e.heavy ? 1.9 : 1.45, arc: Math.PI * (e.spin ? 2 : 1.15), color: colors(f), width: e.heavy ? .8 : .55, life: e.heavy ? .7 : .5, style: f === H ? 'water' : 'ember', layers: e.heavy ? 4 : 3 });
    if (e.heavy) { fx?.impactFrame?.('ink', .06); }
  }

  // ctx: { pos:{x,z}, ground(x,z), moveDir, moveSpeed, canWalk(x,z), visible }
  function update(rawDt, ctx) {
    clock += rawDt;
    let dt = rawDt; if (hitStop > 0) { hitStop -= rawDt; dt = rawDt * .04; } else if (slow > 0) { slow -= rawDt; dt = rawDt * slowScale; }
    const out = { dx: 0, dz: 0, lock: false, yaw: null, inArena: inArena(ctx.pos.x, ctx.pos.z), timeScale: dt / Math.max(rawDt, 1e-6) };
    // the hero's ground position follows the player's
    H.g.position.x = ctx.pos.x; H.g.position.z = ctx.pos.z;
    H.g.visible = H.shadow.visible = ctx.visible;
    if (active && !out.inArena && phase === 'fight' && !H.carry) stop(false);
    if (!active) {
      const gy = ctx.ground(ctx.pos.x, ctx.pos.z); H.g.position.y += (gy - H.g.position.y) * Math.min(1, rawDt * 14);
      if (ctx.moveSpeed > .2) { H.a.play(ctx.moveSpeed > 4.5 ? 'run' : 'walk', .18); H.a.setSpeed(ctx.moveSpeed, ctx.moveSpeed > 4.5 ? 'run' : 'walk'); H.a._lean = 0; turn(H, ctx.moveDir, 10, rawDt); }
      else { H.a.play('idle', .25); H.a.setSpeed(0); }
      const d = Math.hypot(H.g.position.x - R.g.position.x, H.g.position.z - R.g.position.z);
      turn(R, d < 12 ? dirTo(R, H) : 0, 3, rawDt);
      if (R.a.name === 'bow' && R.a.done) R.a.play('idle', .3);
      if (d < 5 && !R.greeted) { R.greeted = true; R.a.play('bow', .2); } if (d > 9) R.greeted = false;
      R.g.position.y = place.y;
    } else {
      phaseT += rawDt;
      if (phase === 'intro' && phaseT > 2.6) { phase = 'fight'; callout('Round ' + round, 'Fight', '#ffffff'); for (const f of F) if (f.a.name === 'draw') play(f, 'stance', .2); }
      if (phase === 'ko' && phaseT > 4.2) { round++; resetFighters(); phase = 'intro'; phaseT = 1.4; $('duel-round').textContent = 'ROUND ' + round; for (const f of F) play(f, 'stance', .3); fx?.letterbox?.(false); director?.cue('end'); }
      if (phase === 'ko' && phaseT > 1.2) { const w = H.hp > 0 ? H : R; if (w.a.name !== 'win' && !busy(w)) play(w, 'win', .3); }
      // moves that just finished hand back to stance before anyone acts this frame
      for (const f of F) if (f.a.done) {
        const n = f.a.name;
        if (n === 'art') director?.cue('end');
        if (n === 'grab') { if (!f.whiff) f.g.rotation.y += Math.PI; f.throwing = false; }
        if (f.hp > 0 && !f.air && n !== 'thrown' && n !== 'ko' && n !== 'win') play(f, 'stance', n === 'grab' ? 0 : .12);
      }
      { const want = H.isArt || R.isArt; if (want !== boxOn) { boxOn = want; fx?.letterbox?.(want); } }
      // player input
      const guarding = !H.ai && (held.has('q') || held.has('rmb') || held.has('pad'));
      H.guardHeld = guarding; if (H.ai) H.guardHeld = (H.guardT || 0) > 0;
      if (!H.ai && phase === 'fight') {
        H.launchIntent = held.has('s') || held.has('arrowdown');
        if (input.art) doArt(H);
        if (input.attack && !lockState) doSword(H);
        if (input.kick) doKick(H);
        if (input.grab) doGrab(H);
        if (input.jump) doJump(H);
        if (input.dodge) doDodge(H, ctx.moveSpeed > .2 ? ctx.moveDir : facing(H) + Math.PI);
        if (canAct(H) && !busy(H) && !H.air) {
          if (guarding) { if (H.a.name !== 'guard' && H.a.name !== 'guardHigh') play(H, 'guard', .06); turn(H, dirTo(H, R), 10, dt); }
          else if (ctx.moveSpeed > .2) { H.a.play('battleRun', .12); H.a.setSpeed(ctx.moveSpeed * 1.1, 'run'); turn(H, ctx.moveDir, 12, dt); }
          else { H.a.play('stance', .12); H.a.setSpeed(0); turn(H, dirTo(H, R), 10, dt); }
        }
        out.lock = busy(H) || guarding || H.air || !!lockState || !canAct(H);
      } else out.lock = true;
      if (phase !== 'fight') out.lock = true;
      if (lockState) lockStep(dt, out);
      for (const f of F) {
        f.invul = Math.max(0, f.invul - dt);
        const plan = f.ai && phase === 'fight' && !lockState ? ai(f, dt) : null;
        if (f.ai) f.guardHeld = (f.guardT || 0) > 0;
        if (plan && canAct(f) && !busy(f) && !f.air) {
          if (plan.guard) { if (f.a.name !== 'guard' && f.a.name !== 'guardHigh') play(f, 'guard', .06); turn(f, dirTo(f, f.foe), 10, dt); }
          else if (plan.move > 0) { f.a.play('battleRun', .12); f.a.setSpeed(plan.move, 'run'); turn(f, plan.slow ? dirTo(f, f.foe) : plan.dir, 10, dt); const sx = Math.sin(plan.dir) * plan.move * dt, sz = Math.cos(plan.dir) * plan.move * dt; move(f, sx, sz, ctx, out); }
          else { f.a.play('stance', .12); f.a.setSpeed(0); turn(f, dirTo(f, f.foe), 8, dt); }
        }
        if (f.dashThen && f.a.name === 'dashIn' && f.a.time > .1) { f.dashThen = false; startAttack(f, 'dashAttack'); f.comboKind = 'sword'; }
        if (f.airChase && f.air && f.vy < 2 && f.a.name === 'jump') { f.airChase = false; startAttack(f, 'airCut'); }
        // attacks track the opponent until they commit
        if (isAttack(f) && !f.isArt) { const h0 = clipOf(f).hits?.[0]?.t0 ?? 0; if (f.a.time < h0) turn(f, dirTo(f, f.foe), 9, dt); }
        if (f.isArt && f.a.time < .66) turn(f, dirTo(f, f.foe), 14, dt); // an art homes in through its opening dash
        // chains
        if (isAttack(f) && f.queue && f.a.time >= (clipOf(f).chain ?? clipOf(f).dur)) { const q = f.queue; f.queue = null; startAttack(f, q); f.comboIdx++; if (['kick', 'kick2'].includes(q)) f.comboKind = 'kick'; else if (q.startsWith('c')) f.comboKind = 'sword'; }
        // root motion
        const c = clipOf(f);
        for (const [mi, [t0, t1, sp0]] of (c.move || []).entries()) { const sp = sp0 * (f.isArt && mi === 0 ? f.artReach || 1 : 1); if (f.a.time >= t0 && f.a.time <= t1 && (f.hp > 0 || f.a.name === 'ko' || f.a.name === 'down')) {
          const a = facing(f) + (sp < 0 ? 0 : 0); const close = dist(f, f.foe) < 1.25 && sp > 0 && !f.isArt && !f.foe.air; if (close) continue;
          move(f, Math.sin(a) * sp * dt, Math.cos(a) * sp * dt, ctx, out);
        } }
        if (f.vel.lengthSq() > .001) { move(f, f.vel.x * dt, f.vel.z * dt, ctx, out); f.vel.multiplyScalar(Math.max(0, 1 - dt * (f.air ? 1.2 : ['dashIn', 'stepL', 'stepR', 'backstep', 'backflip'].includes(f.a.name) ? 3.5 : 7))); }
        // throws carry the victim over the thrower's hip
        if (f.carry) carryStep(f, dt, ctx, out);
        // vertical: scripted leaps, or ballistic flight
        const gy = ctx.ground(f.g.position.x, f.g.position.z);
        const sAir = c.air ? f.a.air : null;
        if (sAir !== null && !f.carry) { f.y = sAir; f.vy = 0; }
        else if (f.air && !f.carry) {
          f.vy -= (f.a.name === 'launched' ? 15 : 17) * dt; f.y += f.vy * dt;
          if (f.y <= 0) { // landing
            f.y = 0; f.air = false; const hard = f.a.name === 'launched';
            if (hard) { play(f, f.hp > 0 ? 'crash' : 'ko', .03); f.invul = 1.1; fx?.dust?.(V3(f.g.position.x, gy + .05, f.g.position.z), { size: 1.4, count: 10 }); if (f.spiked) { fx?.debris?.(V3(f.g.position.x, gy, f.g.position.z), { count: 12 }); shake = Math.max(shake, .25); f.spiked = false; } director?.cue('down', { who: f.side }); }
            else if (f.hp > 0) { play(f, 'land', .04); fx?.dust?.(V3(f.g.position.x, gy + .05, f.g.position.z), { size: .7, count: 5 }); }
          }
        } else if (!f.carry) f.y = 0;
        if (!f.carry) f.g.position.y += (gy + f.y - f.g.position.y) * Math.min(1, (f.y > 0 ? 40 : 14) * rawDt);
        if (phase === 'fight' && !lockState) resolve(f);
        if (lockState) f.hasPrev = false; else { f.g.userData.bladePoints(f.prevTip, f.prevBase); f.hasPrev = true; }
      }
      // fighters never stand inside each other
      const sep = dist(H, R), MIN = H.isArt || R.isArt || H.air || R.air ? .6 : 1.0; if (sep < MIN && !H.carry && !R.carry && !lockState) { const a = dirTo(H, R), k = Math.min(.08, (MIN - sep) / 2); move(R, Math.sin(a) * k, Math.cos(a) * k, ctx, out); out.dx -= Math.sin(a) * k; out.dz -= Math.cos(a) * k; }
      out.yaw = dirTo(H, R);
      for (const f of F) { f.art = Math.min(100, f.art); f.guardHp = Math.min(100, f.guardHp + (f.guardHeld ? 0 : 6) * dt); }
      hudUpdate();
    }
    input.attack = input.dodge = input.art = input.kick = input.grab = input.jump = false;
    for (const f of F) {
      f.a.update(dt);
      const c = clipOf(f), on = active && ((isAttack(f) && (c.hits || []).some(h => h.limb === 'blade' && f.a.time > h.t0 - .06 && f.a.time < h.t1 + .04)) || (f.isArt && f.a.time > .3));
      trailStep(f, dt, on); f.trail.m.material.uniforms.boost.value = f.isArt ? 1.6 : 1;
      const gy = ctx.ground(f.g.position.x, f.g.position.z); f.shadow.position.set(f.g.position.x, (Number.isFinite(gy) ? gy : f.g.position.y) + .02, f.g.position.z); f.shadow.scale.setScalar(Math.max(.45, 1 - f.y * .25));
    }
    if (fallbackT > 0) { fallbackT -= rawDt; if (fallbackT <= 0) fallback.style.opacity = 0; }
    shake = Math.max(0, shake - rawDt * 1.6); out.shake = shake;
    return out;
  }
  function move(f, dx, dz, ctx, out) {
    if (f === H) { out.dx += dx; out.dz += dz; return; }
    const x = f.g.position.x + dx, z = f.g.position.z + dz;
    if (ctx.canWalk(x, z) && inArena(x, z)) { f.g.position.x = x; f.g.position.z = z; }
    else if (ctx.canWalk(x, f.g.position.z) && inArena(x, f.g.position.z)) f.g.position.x = x;
    else if (ctx.canWalk(f.g.position.x, z) && inArena(f.g.position.x, z)) f.g.position.z = z;
  }
  function carryStep(o, dt, ctx, out) {
    const c = o.carry, t = (c.t += dt), by = c.by, D = .62, s = Math.min(1, Math.max(0, (t - .22) / .42));
    // from in front of the thrower, up over the hip, and down hard on the far side
    const start = by.g.position.clone().addScaledVector(c.dir, D), end = by.g.position.clone().addScaledVector(c.dir, -1.25);
    const p = start.lerp(end, s * s * (3 - 2 * s)); const gy = ctx.ground(p.x, p.z);
    if (o === H) { out.dx += p.x - o.g.position.x; out.dz += p.z - o.g.position.z; } else { o.g.position.x = p.x; o.g.position.z = p.z; }
    o.g.position.y = gy + Math.sin(s * Math.PI) * 1.35; o.g.rotation.y = Math.atan2(-c.dir.x, -c.dir.z);
    if (t > .64) {
      o.carry = null; o.hp = Math.max(0, o.hp - 12); by.art += 14; o.invul = 1.1; o.g.position.y = gy;
      const at = o.g.position.clone().add(V3(0, .3, 0));
      fx?.dust?.(V3(p.x, gy + .05, p.z), { size: 1.6, count: 12 }); fx?.debris?.(V3(p.x, gy, p.z), { count: 10, power: .8 }); fx?.hitBurst?.(at, { color: 0xffffff, size: 1.4, heavy: true }); fx?.impactFrame?.('ink', .06);
      hitStop = .14; shake = Math.max(shake, .3); director?.cue('down', { who: o.side });
      if (o.hp <= 0) ko(by, o, c.dir.clone().negate()); else play(o, 'crash', .02);
    }
  }
  // what the camera director needs each frame
  const qTmp = new THREE.Quaternion();
  function camState(timeScale = 1) {
    const s = f => ({ pos: f.g.position.clone(), yaw: facing(f), air: f.y, anim: f.a.name, head: f.g.userData.bones.head.getWorldPosition(V3()), face: V3(0, 0, 1).applyQuaternion(f.g.userData.bones.head.getWorldQuaternion(qTmp)) });
    return { hero: s(H), rival: s(R), timeScale };
  }
  return {
    hero, rival, fighters: F, update, setRegion, start, stop, inArena, camState, warm,
    force(who, what) { const f = who === 'rival' ? R : H; if (what === 'art') { f.art = 100; if (canAct(f)) { if (busy(f)) play(f, 'stance', 0); doArt(f); } } if (what === 'lock') startLock(chest(H).lerp(chest(R), .5)); if (what === 'clash') clash(H, R, chest(H).lerp(chest(R), .5)); if (what === 'parry') { f.foe.guardPress = clock + .1; startAttack(f, 'c1'); f.comboKind = 'sword'; } if (['c1', 'kick', 'kick2', 'launcher', 'c5', 'dashAttack'].includes(what)) { if (busy(f)) play(f, 'stance', 0); startAttack(f, what); } if (what === 'grab') doGrab(f); if (what === 'noai') f.ai = false; },
    get active() { return active; }, get auto() { return auto; }, get phase() { return phase; }, setAuto(v) { auto = !!v; H.ai = auto; },
    state: () => ({ active, auto, round, phase, lock: !!lockState, hero: { hp: H.hp, art: Math.round(H.art), guard: Math.round(H.guardHp), anim: H.a.name, air: +H.y.toFixed(2) }, rival: { hp: R.hp, art: Math.round(R.art), guard: Math.round(R.guardHp), anim: R.a.name, air: +R.y.toFixed(2), pos: [R.g.position.x, R.g.position.z] } }),
    input,
  };
}
