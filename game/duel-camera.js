// Duel camera director: action cinematography for Veilbound spars.
//
// The default is a side-on 3/4 two-shot (hero screen-left, rival screen-right, both full body),
// driven by critically damped springs on the orbit angle, distance, height and midpoint, so it
// swings around the pair instead of cutting through them. Event cues cut to authored shots
// (clash close-ups, blade-lock two-shots, low launch angles, dash tracking, kick-into-lens,
// knockdown pull-backs, multi-shot special arts, a KO orbit) and blend back in ~0.28 s.
// Light hits never cut: they punch the FOV and nudge the camera toward the impact.
//
//   const dc = createDuelCamera(THREE, viewCam, { canPlace: (x,z)=>world.canWalk(x,z), ground: (x,z)=>world.walkHeight(x,z) });
//   dc.reset(); dc.cue('intro');
//   every frame: dc.update(rawDt, { hero:{pos,yaw,air,anim,head,face?}, rival:{...}, timeScale });
//   face (optional): world forward of the head bone; lets the art close-up stay on the face while the body spins.
export function createDuelCamera(THREE, cam, { canPlace = () => true, ground = () => 0 } = {}) {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const BASE_FOV = 50, TAU = Math.PI * 2;
  const PRIO = { gameplay: 0, hit: 1, dash: 2, clash: 3, parry: 3, kick: 3, launch: 4, down: 4, lock: 5, ko: 6, intro: 6.5, art: 7 };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3), easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

  // critically damped springs (stable at any dt)
  function springS(x, v, target, w, dt) { const f = 1 + 2 * dt * w, oo = w * w, hoo = dt * oo, hhoo = dt * hoo, d = 1 / (f + hhoo); return [(f * x + dt * v + hhoo * target) * d, (v + hoo * (target - x)) * d]; }
  function springV(x, v, target, w, dt) { for (const k of ['x', 'y', 'z']) { const r = springS(x[k], v[k], target[k], w, dt); x[k] = r[0]; v[k] = r[1]; } }

  // ---------- fighter helpers ----------
  const F = (s, who) => (who === 'rival' ? s.rival : s.hero);
  const other = who => (who === 'rival' ? 'hero' : 'rival');
  const fwd = f => V(Math.sin(f.yaw), 0, Math.cos(f.yaw));
  const headOf = f => (f.head ? f.head.clone() : f.pos.clone().add(V(0, 1.55, 0)));
  const feetY = f => f.pos.y - (f.air || 0);
  const placeable = p => { try { if (!canPlace(p.x, p.z)) return false; const g = ground(p.x, p.z); return !Number.isFinite(g) || g < p.y - .2; } catch { return true; } };
  const groundAt = (x, z, fb) => { try { const g = ground(x, z); return Number.isFinite(g) ? g : fb; } catch { return fb; } };
  // pull an event-shot position toward its subject until it is placeable
  function settle(p, subject) {
    if (placeable(p)) return p;
    for (let k = .15; k <= .75; k += .15) { const q = p.clone().lerp(subject, k); if (placeable(q)) return q; }
    return p;
  }

  // ---------- state ----------
  let snap = true, side = 1, shot = null, ret = null, sinceCut = 9, modeName = 'gameplay';
  let theta = 0, thetaV = 0, dist = 5, distV = 0, camH = 1.5, camHV = 0, aimY = 1.05, aimYV = 0;
  const mid = V(), midV = V();
  const shotPos = V(), shotVel = V(), shotAim = V(), shotAimV = V();
  let kickFov = 0, kickRoll = 0, shake = 0; const kickPush = V();
  const base = { pos: V(), aim: V(), roll: 0, fov: BASE_FOV };
  let curRoll = 0, curFovKick = 0;
  const gp = { pos: V(), aim: V(), roll: 0, fov: BASE_FOV, side: V(), axis: V(), theta: 0, mid: V() };

  // ---------- gameplay two-shot ----------
  const ANG = .52; // ~30 degrees toward behind the hero
  function offDir(ax, sd) { const c = V(-ax.z * sd, 0, ax.x * sd); return c.multiplyScalar(Math.cos(ANG)).addScaledVector(ax, -Math.sin(ANG)).normalize(); }
  function gameplay(s, dt) {
    const h = s.hero.pos, r = s.rival.pos, ax = V(r.x - h.x, 0, r.z - h.z); let sep = ax.length();
    if (sep < 1e-3) { ax.set(Math.sin(s.hero.yaw), 0, Math.cos(s.hero.yaw)); sep = .001; } else ax.divideScalar(sep);
    const baseY = (feetY(s.hero) + feetY(s.rival)) / 2, airMax = Math.max(s.hero.air || 0, s.rival.air || 0);
    const m = V((h.x + r.x) / 2, baseY, (h.z + r.z) / 2);
    // distance that keeps both bodies in frame, with the near fighter closer to the lens
    const aspect = cam.aspect || 16 / 9, tv = Math.tan(BASE_FOV * Math.PI / 360), th = tv * aspect;
    const span = sep * Math.cos(ANG) / 2 + .95, depth = sep * Math.sin(ANG) / 2;
    let D = Math.max(4.2, span / (th * .82) + depth, (1.2 + airMax * .65) / (tv * .85) + depth);
    // side choice with hysteresis: only switch after a crossover or when the spot is blocked
    const thOf = sd => { const o = offDir(ax, sd); return Math.atan2(o.x, o.z); };
    if (!snap) { const dA = Math.abs(angDiff(theta, thOf(side))), dB = Math.abs(angDiff(theta, thOf(-side))); if (dA > 1.9 && dB < dA - .6) side = -side; }
    const at = (sd, d) => { const o = offDir(ax, sd); return V(m.x + o.x * d, baseY + 1.5, m.z + o.z * d); };
    if (!placeable(at(side, D))) {
      if (placeable(at(-side, D))) side = -side;
      else { let d = D; while (d > 2.2 && !placeable(at(side, d))) d -= .3; D = d; }
    }
    const tTheta = thOf(side), tH = 1.33 + Math.min(.32, sep * .035) + airMax * .35, tAim = 1.02 + airMax * .55;
    if (snap || dt <= 0) { theta = tTheta; thetaV = 0; dist = D; distV = 0; camH = tH; camHV = 0; aimY = tAim; aimYV = 0; mid.copy(m); midV.set(0, 0, 0); }
    else {
      const tt = theta + angDiff(theta, tTheta); let r1 = springS(theta, thetaV, tt, 4.2, dt); theta = r1[0]; thetaV = r1[1];
      r1 = springS(dist, distV, D, 4.5, dt); dist = r1[0]; distV = r1[1];
      r1 = springS(camH, camHV, tH, 5, dt); camH = r1[0]; camHV = r1[1];
      r1 = springS(aimY, aimYV, tAim, 6, dt); aimY = r1[0]; aimYV = r1[1];
      springV(mid, midV, m, 7, dt);
    }
    gp.pos.set(mid.x + Math.sin(theta) * dist, mid.y + camH, mid.z + Math.cos(theta) * dist);
    const gy = groundAt(gp.pos.x, gp.pos.z, mid.y); gp.pos.y = Math.max(gp.pos.y, gy + .35);
    gp.aim.set(mid.x, mid.y + aimY, mid.z); gp.roll = 0; gp.fov = BASE_FOV;
    gp.axis.copy(ax); gp.side.set(-ax.z * side, 0, ax.x * side); gp.theta = theta; gp.mid.copy(m);
    return gp;
  }

  // ---------- event shots ----------
  // pose(s, t, k, shot) -> { pos, aim, roll, fov, sub?, w? (pos spring), wa? (aim spring) }
  const lateral = (f, sideVec) => { const l = V(f.z, 0, -f.x); return l.dot(sideVec) < 0 ? l.negate() : l; };
  const SHOTS = {
    intro: {
      dur: () => 2.4, min: () => 1.2, noBlend: true,
      pose(s, t, k, sh) {
        const r = s.rival, rf = fwd(r), rh = headOf(r), lat = lateral(rf, gp.side);
        const closePos = rh.clone().addScaledVector(rf, .95 + t * .08).add(V(0, -.32, 0)).addScaledVector(lat, .2), closeAim = rh.clone().add(V(0, -.06, 0));
        if (t < .85) return { pos: closePos, aim: closeAim, roll: .12 * side, fov: 36, sub: 0 };
        const u = easeInOut((t - .85) / 1.55), c = gp.aim;
        const pol = p => ({ a: Math.atan2(p.x - c.x, p.z - c.z), r: Math.hypot(p.x - c.x, p.z - c.z), y: p.y });
        const A = pol(closePos), B = pol(gp.pos), a = A.a + angDiff(A.a, B.a) * u, rr = A.r + (B.r - A.r) * u;
        const pos = V(c.x + Math.sin(a) * rr, A.y + (B.y - A.y) * u, c.z + Math.cos(a) * rr);
        return { pos, aim: closeAim.clone().lerp(gp.aim, u), roll: .12 * side * (1 - u), fov: 36 + 14 * u, sub: 0, w: 60, wa: 60 };
      },
    },
    clash: {
      dur: () => .55, min: () => .4,
      init(sh, s) { sh.at = sh.data.at ? sh.data.at.clone() : headOf(s.hero).lerp(headOf(s.rival), .5).add(V(0, -.25, 0)); sh.sv = gp.side.clone(); sh.ax = gp.axis.clone(); },
      pose(s, t, k, sh) {
        const pos = sh.at.clone().addScaledVector(sh.sv, 1.8 - .35 * easeOut(k)).addScaledVector(sh.ax, -.18).add(V(0, -.14, 0));
        return { pos, aim: sh.at.clone().add(V(0, -.04, 0)), roll: .09 * side, fov: 40 };
      },
    },
    lock: {
      dur: d => d.dur || 1.6, min: d => Math.min(.8, (d.dur || 1.6) * .6),
      init(sh) { sh.sv = gp.side.clone(); },
      pose(s, t, k, sh) {
        const hh = headOf(s.hero), rh = headOf(s.rival), m = hh.clone().lerp(rh, .5), sep = Math.hypot(rh.x - hh.x, rh.z - hh.z);
        const pos = m.clone().addScaledVector(sh.sv, Math.max(.95, sep * .9 + .45) - .22 * k).add(V(0, -.1, 0));
        return { pos, aim: m.clone().add(V(0, -.05, 0)), roll: .05 * side, fov: 33 - 4 * k, w: 30 };
      },
    },
    parry: {
      dur: () => .6, min: () => .45,
      init(sh) { sh.a0 = theta; sh.dir = side * (sh.data.by === 'rival' ? -1 : 1); },
      pose(s, t, k, sh) {
        const c = V((s.hero.pos.x + s.rival.pos.x) / 2, (feetY(s.hero) + feetY(s.rival)) / 2 + 1.0, (s.hero.pos.z + s.rival.pos.z) / 2);
        const a = sh.a0 + sh.dir * 1.22 * easeOut(k);
        return { pos: V(c.x + Math.sin(a) * 3.1, c.y - .42, c.z + Math.cos(a) * 3.1), aim: c.clone().add(V(0, .08, 0)), roll: -.06 * side * (1 - k), fov: 46, w: 40 };
      },
    },
    launch: {
      dur: () => 1.3, min: () => .7,
      init(sh, s) { const w = F(s, sh.data.who || 'rival'), o = F(s, other(sh.data.who || 'rival')), away = V(w.pos.x - o.pos.x, 0, w.pos.z - o.pos.z).normalize(); sh.anchor = V(w.pos.x, feetY(w) + .26, w.pos.z).addScaledVector(gp.side, 2.6).addScaledVector(away, .7); sh.anchor = settle(sh.anchor, w.pos); },
      pose(s, t, k, sh) { const w = F(s, sh.data.who || 'rival'); return { pos: sh.anchor.clone(), aim: w.pos.clone().add(V(0, .75, 0)), roll: .08 * side, fov: 60, wa: 14 }; },
    },
    down: {
      dur: () => 1.4, min: () => .8,
      init(sh, s) { const w = F(s, sh.data.who || 'rival'); sh.anchor = V(w.pos.x, feetY(w), w.pos.z); sh.sv = gp.side.clone(); sh.ax = gp.axis.clone(); },
      pose(s, t, k, sh) {
        const w = F(s, sh.data.who || 'rival'), e = easeOut(k), pos = sh.anchor.clone().addScaledVector(sh.sv, 3.6 + 2.8 * e).addScaledVector(sh.ax, (sh.data.who === 'hero' ? 1 : -1) * .8 * e).add(V(0, .5 + .55 * e, 0));
        return { pos: settle(pos, sh.anchor), aim: V(w.pos.x, feetY(w) + .5, w.pos.z), roll: .05 * side * (1 - e), fov: 50, w: 18, wa: 10 };
      },
    },
    dash: {
      dur: () => .45, min: () => .35,
      init(sh, s) { sh.lat = lateral(fwd(F(s, sh.data.who || 'hero')), gp.side); },
      pose(s, t, k, sh) {
        const w = F(s, sh.data.who || 'hero'), f = fwd(w);
        const pos = w.pos.clone().addScaledVector(f, -2.3).addScaledVector(sh.lat, .9).add(V(0, .62, 0));
        return { pos: settle(pos, w.pos), aim: w.pos.clone().addScaledVector(f, 3).add(V(0, .95, 0)), roll: .05 * side, fov: 60, w: 26 };
      },
    },
    kick: {
      dur: () => .55, min: () => .4,
      init(sh, s) {
        const w = F(s, sh.data.who || 'hero'), o = F(s, other(sh.data.who || 'hero')), f = V(o.pos.x - w.pos.x, 0, o.pos.z - w.pos.z); const d = Math.max(.6, f.length()); f.normalize();
        const lat = lateral(f, gp.side); sh.anchor = settle(V(w.pos.x, feetY(w) + .5, w.pos.z).addScaledVector(f, Math.min(d * 1.05, 1.5)).addScaledVector(lat, .62), w.pos); sh.f = f;
      },
      pose(s, t, k, sh) { const w = F(s, sh.data.who || 'hero'); return { pos: sh.anchor.clone().addScaledVector(sh.f, -.12 * k), aim: w.pos.clone().addScaledVector(sh.f, .25).add(V(0, .98, 0)), roll: -.08 * side, fov: 52, wa: 22 }; },
    },
    art: {
      dur: d => d.dur || 3, min: d => (d.dur || 3) * .85,
      init(sh, s) { const w = F(s, sh.data.who || 'hero'); sh.sv = gp.side.clone(); sh.a0 = w.yaw + Math.PI * .75 * side; sh.f0 = fwd(w); },
      pose(s, t, k, sh) {
        const who = sh.data.who || 'hero', w = F(s, who), v = F(s, other(who)), f = fwd(w), lat = lateral(f, sh.sv);
        if (k < .22) { // A: extreme close-up on the face, low and tilted
          const hd = headOf(w); let f0 = sh.f0;
          if (w.face) { const fh = V(w.face.x, 0, w.face.z); if (fh.lengthSq() > .04) { fh.normalize(); sh.fs = sh.fs ? sh.fs.lerp(fh, .35).normalize() : fh; f0 = sh.fs; } }
          const l0 = lateral(f0, sh.sv);
          return { pos: hd.clone().addScaledVector(f0, 1.0 + .12 * k / .22).addScaledVector(l0, .16).add(V(0, -.18, 0)), aim: hd.clone().add(V(0, .01, 0)), roll: .26 * side, fov: 34, sub: 0, w: 70, wa: 80 };
        }
        if (k < .62) { // B: low fast orbit following the fighter
          const kb = (k - .22) / .4, c = w.pos.clone().add(V(0, .85, 0)), a = sh.a0 + side * 2.7 * easeInOut(kb);
          return { pos: V(c.x + Math.sin(a) * 2.7, feetY(w) + .42 + (w.air || 0) * .5, c.z + Math.cos(a) * 2.7), aim: c.clone().add(V(0, .2, 0)), roll: .13 * side, fov: 56, sub: 1, w: 30 };
        }
        const kc = (k - .62) / .38, ax = V(v.pos.x - w.pos.x, 0, v.pos.z - w.pos.z); if (ax.lengthSq() < 1e-6) ax.copy(f); ax.normalize(); // C: wide side shot of the impact
        const sv = V(-ax.z, 0, ax.x); if (sv.dot(sh.sv) < 0) sv.negate();
        const m = w.pos.clone().lerp(v.pos, .68);
        return { pos: settle(m.clone().addScaledVector(sv, 6.3 - .7 * kc).add(V(0, 1.15, 0)), m), aim: V(m.x, feetY(v) + 1.0, m.z), roll: .03 * side * (1 - kc), fov: 48, sub: 2, w: 20 };
      },
    },
    ko: {
      dur: () => 3.2, min: () => 2.5,
      init(sh) { sh.a0 = theta; },
      pose(s, t, k, sh) {
        const w = F(s, sh.data.winner || 'hero'), c = V(w.pos.x, feetY(w) + 1.1, w.pos.z), a = sh.a0 + side * 3.49 * easeInOut(k);
        return { pos: V(c.x + Math.sin(a) * 3.3, c.y + .28, c.z + Math.cos(a) * 3.3), aim: c, roll: 0, fov: 44, w: 20 };
      },
    },
  };

  function endShot() {
    if (!shot) return;
    if (!SHOTS[shot.name].noBlend) ret = { pos: base.pos.clone(), aim: base.aim.clone(), roll: base.roll, fov: base.fov, t: 0, check: true };
    shot = null;
  }
  // does a straight camera move from a to b pass through a fighter's body?
  function crosses(a, b, s) {
    for (let i = 1; i < 10; i++) {
      const p = a.clone().lerp(b, i / 10);
      for (const f of [s.hero, s.rival]) if (Math.hypot(p.x - f.pos.x, p.z - f.pos.z) < .55 && p.y > feetY(f) - .1 && p.y < feetY(f) + 1.9) return true;
    }
    return false;
  }

  function cue(type, data = {}) {
    if (type === 'hit') {
      const heavy = !!data.heavy; kickFov = Math.min(kickFov, heavy ? -8.5 : -2.6);
      if (data.at) { const d = data.at.clone().sub(cam.position); const L = d.length(); if (L > 1e-3) kickPush.copy(d.multiplyScalar((heavy ? .5 : .13) / L)); }
      if (heavy) { kickRoll = (Math.random() < .5 ? -1 : 1) * .1; shake = Math.max(shake, .07); }
      return;
    }
    if (type === 'end') { endShot(); return; }
    const def = SHOTS[type]; if (!def) return;
    const p = PRIO[type];
    if (shot && !(p > shot.prio || (p === shot.prio && shot.t >= shot.min))) return;
    if (!shot && sinceCut < .15 && p < 4) return;
    shot = { name: type, prio: p, t: 0, data, dur: def.dur(data), min: def.min(data), sub: -1, first: true, inited: false };
    ret = null;
  }

  function update(rawDt, s) {
    const dt = clamp(rawDt || 0, 0, .05); sinceCut += dt;
    gameplay(s, snap ? 0 : dt);
    let pose = null;
    if (shot) { shot.t += dt; if (shot.t >= shot.dur) endShot(); }
    if (shot) {
      const def = SHOTS[shot.name];
      if (!shot.inited) { shot.inited = true; def.init?.(shot, s); }
      const p = def.pose(s, shot.t, clamp(shot.t / shot.dur), shot);
      p.pos.y = Math.max(p.pos.y, groundAt(p.pos.x, p.pos.z, p.pos.y - 1) + .35);
      const sub = p.sub ?? 0, cut = shot.first || sub !== shot.sub; shot.sub = sub; shot.first = false;
      if (cut) { shotPos.copy(p.pos); shotVel.set(0, 0, 0); shotAim.copy(p.aim); shotAimV.set(0, 0, 0); sinceCut = 0; }
      else { springV(shotPos, shotVel, p.pos, p.w || 24, dt); springV(shotAim, shotAimV, p.aim, p.wa || p.w || 30, dt); }
      pose = { pos: shotPos, aim: shotAim, roll: p.roll || 0, fov: p.fov || BASE_FOV };
      modeName = shot.name + (shot.name === 'art' ? '-' + 'ABC'[sub] : '');
    } else if (ret) {
      if (ret.check) { ret.check = false; if (crosses(ret.pos, gp.pos, s) || ret.pos.distanceTo(gp.pos) > 9) ret.t = 1; }
      ret.t += dt / .28; const k = easeOut(ret.t);
      pose = { pos: ret.pos.clone().lerp(gp.pos, k), aim: ret.aim.clone().lerp(gp.aim, k), roll: ret.roll * (1 - k), fov: ret.fov + (gp.fov - ret.fov) * k };
      modeName = 'return'; if (ret.t >= 1) ret = null;
    } else { pose = gp; modeName = 'gameplay'; }
    snap = false;
    base.pos.copy(pose.pos); base.aim.copy(pose.aim); base.roll = pose.roll; base.fov = pose.fov;

    // punches on top of every shot
    const e6 = Math.exp(-dt * 6);
    kickFov *= Math.exp(-dt * 7); kickPush.multiplyScalar(e6); kickRoll *= Math.exp(-dt * 5); shake *= Math.exp(-dt * 9);
    const P = pose.pos.clone().add(kickPush);
    if (shake > .002) P.add(V((Math.random() - .5) * shake, (Math.random() - .5) * shake, (Math.random() - .5) * shake));
    P.y = Math.max(P.y, groundAt(P.x, P.z, P.y - 1) + .35);
    cam.position.copy(P); cam.up.set(0, 1, 0); cam.lookAt(pose.aim);
    curRoll = pose.roll + kickRoll; if (curRoll) cam.rotateZ(curRoll);
    curFovKick = kickFov; const f = pose.fov + kickFov;
    if (Math.abs(cam.fov - f) > 1e-3) { cam.fov = f; cam.updateProjectionMatrix(); }
  }

  function reset() { snap = true; shot = null; ret = null; side = 1; kickFov = kickRoll = shake = 0; kickPush.set(0, 0, 0); sinceCut = 9; modeName = 'gameplay'; }

  return {
    reset, update, cue,
    get mode() { return modeName; },
    get roll() { return curRoll; },
    get fovKick() { return curFovKick; },
  };
}
