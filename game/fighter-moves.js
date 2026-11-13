// Fighter motion for Veilbound duels.
//
// Sword cuts are not keyframed poses blended in straight lines (that is what made the blade
// wander). Every cut is an ARC: the blade sweeps through one plane around a pivot in front of
// the chest, from a wind-up direction, through the strike, into a follow-through. The cutting
// edge always leads the motion (hasuji), the hands extend at the moment of impact and draw in
// on the follow-through, and the hips, chest, feet and face are driven by the same clock:
// anticipation, a hard accelerating strike, a decelerating follow-through, then recovery.
// Kicks, palm strikes, throws, rolls, flips, guards, parries, blade locks and every hit
// reaction are keyed body poses on top of the same two-bone IK rig.
//
// Pose space is the fighter's own root: metres (scaled by the design's size), feet at y=0,
// facing +Z, +X = the fighter's LEFT, -X = the fighter's RIGHT.
export function animate(THREE, fighter) {
  const U = fighter.userData, B = U.bones, J = U.restPositions, S = U.colors.s, female = U.colors.female;
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion();
  const haru = U.design !== 'mitsuki';
  const DEG = Math.PI / 180;
  const N3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const ease = t => t * t * (3 - 2 * t), clamp01 = t => Math.max(0, Math.min(1, t));
  const easeIn = (t, k = 2) => Math.pow(clamp01(t), k), easeOut = (t, k = 2) => 1 - Math.pow(1 - clamp01(t), k);

  // ---------- pose helpers ----------
  const swordQ = (b, e) => { const Y = V3(...b).normalize(), X = V3(...e); X.sub(Y.clone().multiplyScalar(X.dot(Y))); if (X.lengthSq() < 1e-6) X.set(1, 0, 0).sub(Y.clone().multiplyScalar(Y.x)); X.normalize(); const Z = V3().crossVectors(X, Y); return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); };
  const sw = (g, b, e) => ({ g, q: swordQ(b, e) });
  const NUM = ['hy', 'hx', 'hz', 'ry', 'flip', 'roll', 'ly', 'lh', 'lb', 'ls'], ARR = ['hr', 'sp', 'ch', 'hd', 'fl', 'fr', 'la', 'ra'];
  const base = () => ({ hy: 0, hx: 0, hz: 0, ry: 0, flip: 0, roll: 0, ly: 0, lh: 0, lb: 0, hr: [0, 0, 0], sp: [0, 0, 0], ch: [0, 0, 0], hd: [0, 0, 0], fl: [.11, .085, 0, 0], fr: [-.11, .085, 0, 0], sw: null, la: [.21, .9, .04], ra: [-.21, .9, .04], face: null });
  const P = o => Object.assign(base(), o);
  const W = (p, o) => Object.assign({}, p, o); // derive a pose from another
  const lerpA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function blend(a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    const o = {};
    for (const k of NUM) o[k] = (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * t;
    for (const k of ARR) o[k] = lerpA(a[k], b[k], t);
    if (a.sw && b.sw) o.sw = { g: lerpA(a.sw.g, b.sw.g, t), q: a.sw.q.clone().slerp(b.sw.q, t) }; else o.sw = t < .5 ? a.sw : b.sw;
    o.face = t < .5 ? a.face : b.face;
    return o;
  }
  function sampleKeys(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return blend(a, b, ease((t - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  const fierce = { brow: 'fierce', mouth: 'grit' }, shout = { brow: 'fierce', mouth: 'shout' }, calm = { brow: 'calm', mouth: 'calm' }, hurt = { brow: 'fierce', mouth: 'grit', blink: .7 };

  // ---------- stances ----------
  // Haru: chudan-no-kamae. Right foot leads, both hands on the hilt, the tip at the opponent's throat.
  // Mitsuki: a one-handed low guard. Left foot and open left palm lead, the blade trails low and behind.
  const stance = haru
    ? P({ hy: -.075, hr: [0, .22, 0], sp: [.06, -.08, 0], ch: [.04, -.1, 0], hd: [.02, -.06, 0], fr: [-.12, .085, .2, 0], fl: [.15, .085, -.22, .28], sw: sw([-.02, 1.07, .33], N3([0, .44, .9]), [0, -.9, .44]), lh: 1, la: [.2, 1.0, .25], face: { brow: 'fierce', mouth: 'calm' } })
    : P({ hy: -.09, hr: [0, -.38, 0], sp: [.08, .1, 0], ch: [.05, .12, 0], hd: [0, .2, 0], fl: [.15, .085, .22, 0], fr: [-.15, .085, -.2, .3], sw: sw([-.3, .98, .06], N3([-.5, -.3, -.8]), [0, -1, .3]), lh: 0, la: [.12, 1.28, .38], face: { brow: 'fierce', mouth: 'calm' } });
  const idle = P({ hy: -.005, ls: 1, la: [.16, .985, .14], ra: [-.205, .89, .03], hd: [.04, 0, 0], face: calm });

  // ---------- the cut: one blade arc driving the whole body ----------
  // o.u: blade direction at the wind-up. o.f: the direction it sweeps toward. o.a: [wind, impact, end]
  // angles (degrees) of the blade from u toward f. o.r: hand distance from the pivot at those three
  // moments. o.t: [wind-up done, impact, follow-through done, recovered]. o.W/I/E: body at those moments.
  function cutClip(o) {
    const u = N3(o.u); let f = N3(o.i || o.f || [0, 0, 1]); const d = dot3(f, u); f = N3([f[0] - d * u[0], f[1] - d * u[1], f[2] - d * u[2]]);
    // given the impact direction, the impact angle is exactly the angle from the wind-up to it
    if (o.i) { const ai = Math.acos(Math.max(-1, Math.min(1, d))) / DEG; o.a = [o.a0 ?? 6, ai, ai + (o.follow ?? 70)]; }
    const piv = o.piv || (o.one ? [-.17, 1.34, .08] : [-.02, 1.3, .12]);
    const [tw, ti, tf, te] = o.t, [aw, ai, ae] = o.a.map(v => v * DEG), [rw, ri, re] = o.r || (o.one ? [.3, .6, .44] : [.27, .5, .36]);
    const from = o.from || stance, Wp = W(from, o.W || {}), Ip = W(from, o.I || {}), Ep = W(from, o.E || {});
    const phiAt = t => t <= tw ? aw : t <= ti ? aw + (ai - aw) * easeIn((t - tw) / (ti - tw), 1.7) : t <= tf ? ai + (ae - ai) * easeOut((t - ti) / (tf - ti), 2.2) : ae;
    const bodyAt = t => t <= tw ? Wp : t <= ti ? blend(Wp, Ip, ease((t - tw) / (ti - tw))) : t <= tf ? blend(Ip, Ep, ease((t - ti) / (tf - ti))) : Ep;
    const rOf = ph => ph <= ai ? rw + (ri - rw) * Math.sin(clamp01((ph - aw) / Math.max(1e-3, ai - aw)) * Math.PI / 2) : ri + (re - ri) * clamp01((ph - ai) / Math.max(1e-3, ae - ai));
    const at = ph => { const c = Math.cos(ph), s = Math.sin(ph); return { b: [c * u[0] + s * f[0], c * u[1] + s * f[1], c * u[2] + s * f[2]], e: [-s * u[0] + c * f[0], -s * u[1] + c * f[1], -s * u[2] + c * f[2]] }; };
    const back = o.to || stance;
    const fn = t => {
      const ph = phiAt(t), { b, e } = at(ph), r = rOf(ph), g = [piv[0] + b[0] * r, piv[1] + b[1] * r, piv[2] + b[2] * r];
      let p = W(bodyAt(t), { sw: sw(g, b, e), lh: o.one ? 0 : 1 });
      if (o.spin) p.ry = o.spin(t);
      if (t > tf) p = blend(p, back, ease((t - tf) / (te - tf)));
      return p;
    };
    return { fn, dur: te, drawn: true, fadeIn: o.fadeIn ?? tw * .85, chain: o.chain ?? tf * .92, cancel: o.cancel ?? tf, active: [tw + (ti - tw) * .35, ti + (tf - ti) * .55], hits: o.hits || [], move: o.move || [], air: o.air, plane: { u, f }, kind: 'cut', events: o.events || [], arcFx: o.arcFx };
  }
  const keyClip = (keys, o = {}) => ({ keys, dur: keys[keys.length - 1][0], drawn: o.drawn ?? true, fadeIn: o.fadeIn ?? .08, hits: o.hits || [], move: o.move || [], air: o.air, chain: o.chain, cancel: o.cancel, loop: o.loop, hold: o.hold, events: o.events || [], kind: o.kind || 'body', active: o.active });
  // a clip assembled from other clips played back to back (special arts)
  function seqClip(parts, o = {}) {
    let t = 0; const segs = parts.map(p => { const s = { ...p, t0: t }; t += p.dur ?? p.clip.dur; s.t1 = t; return s; });
    const fn = tt => { const s = segs.find(s => tt <= s.t1) || segs[segs.length - 1], lt = Math.min(tt - s.t0, s.t1 - s.t0); let p = s.clip.fn ? s.clip.fn(lt) : sampleKeys(s.clip.keys, lt); p = W(p, { ry: (p.ry || 0) + (s.ry || 0) }); return p; };
    return { fn, dur: t, drawn: true, fadeIn: .08, hits: o.hits || [], move: o.move || [], air: o.air, chain: 99, cancel: 99, events: o.events || [], kind: 'art', segs };
  }
  // vertical leap: a parabola from t0 to t1 peaking at h
  const leap = (t0, t1, h) => t => t <= t0 || t >= t1 ? 0 : 4 * h * ((t - t0) / (t1 - t0)) * (1 - (t - t0) / (t1 - t0));

  // ---------- Haru: flowing two-handed cuts (each one winds up where the last one ended) ----------
  const H = {};
  H.kesa = cutClip({ // kesa-giri: right shoulder down through the left hip
    u: [-.52, .78, -.34], i: [.2, -.16, 1], follow: 72, t: [.12, .2, .32, .58],
    W: { hy: -.06, hr: [0, -.3, 0], sp: [-.04, -.18, 0], ch: [-.06, -.28, 0], hd: [0, .4, 0], fr: [-.12, .085, .2, 0], face: fierce },
    I: { hy: -.13, hr: [0, .32, 0], sp: [.16, .12, 0], ch: [.12, .22, 0], hd: [.02, -.48, 0], fr: [-.13, .085, .36, 0], fl: [.15, .085, -.2, .4], face: shout },
    E: { hy: -.15, hr: [0, .48, 0], sp: [.22, .18, 0], ch: [.16, .26, 0], hd: [.04, -.6, 0], fr: [-.13, .085, .38, 0], fl: [.15, .085, -.18, .45], face: shout },
    hits: [{ limb: 'blade', dmg: 7, kb: 2.8, type: 'light' }], move: [[.12, .3, 2.6]], arcFx: { width: .55 },
  });
  H.kiriage = cutClip({ // gyaku kiriage: rising back up from the left hip over the right shoulder
    u: [.5, -.78, .36], i: [-.16, .16, 1], follow: 76, t: [.1, .18, .3, .56],
    W: { hy: -.17, hr: [0, .45, 0], sp: [.24, .16, 0], ch: [.14, .2, 0], hd: [0, -.5, 0], fr: [-.13, .085, .34, 0], face: fierce },
    I: { hy: -.08, hr: [0, -.1, 0], sp: [.0, -.12, 0], ch: [-.06, -.16, 0], hd: [-.08, .12, 0], fr: [-.13, .085, .36, 0], fl: [.15, .085, -.12, .35], face: shout },
    E: { hy: -.03, hr: [0, -.34, 0], sp: [-.12, -.2, 0], ch: [-.14, -.24, 0], hd: [-.14, .3, 0], fr: [-.12, .085, .3, 0], fl: [.14, .12, -.1, .5], face: shout },
    hits: [{ limb: 'blade', dmg: 7, kb: 2.4, type: 'light' }], move: [[.08, .26, 2.2]], arcFx: { width: .55 },
  });
  H.yoko = cutClip({ // yoko-giri: a flat cut right to left at the ribs
    u: [-1, .1, -.28], i: [0, -.03, 1], follow: 82, a0: 10, t: [.12, .2, .33, .6], piv: [-.02, 1.2, .1], r: [.3, .54, .4],
    W: { hy: -.1, hr: [0, -.62, 0], sp: [.04, -.22, 0], ch: [0, -.4, 0], hd: [0, .85, 0], fr: [-.13, .085, .18, 0], face: fierce },
    I: { hy: -.15, hr: [0, .2, 0], sp: [.14, .1, 0], ch: [.08, .24, 0], hd: [0, -.36, 0], fr: [-.14, .085, .36, 0], fl: [.17, .085, -.24, .4], face: shout },
    E: { hy: -.16, hr: [0, .62, 0], sp: [.16, .2, 0], ch: [.1, .42, 0], hd: [0, -.86, 0], fr: [-.14, .085, .36, 0], fl: [.17, .085, -.22, .45], face: shout },
    hits: [{ limb: 'blade', dmg: 8, kb: 3.2, type: 'light' }], move: [[.1, .3, 2.4]], arcFx: { width: .6 },
  });
  H.tsuki = keyClip([ // morote-zuki: a lunging two-handed thrust
    [0, W(stance, { hy: -.12, hr: [0, .3, 0], sp: [.12, -.05, 0], sw: sw([-.04, 1.1, .12], N3([0, .18, 1]), [0, -1, .18]), lh: 1, fr: [-.12, .085, .16, 0], face: fierce })],
    [.13, W(stance, { hy: -.16, hr: [0, .38, 0], sp: [.14, -.06, 0], ch: [.06, -.1, 0], sw: sw([-.05, 1.08, .02], N3([0, .16, 1]), [0, -1, .16]), lh: 1, fr: [-.12, .085, .12, 0], fl: [.15, .085, -.28, .4], face: fierce })],
    [.21, W(stance, { hy: -.26, hr: [0, .18, 0], sp: [.3, 0, 0], ch: [.16, 0, 0], hd: [-.12, 0, 0], sw: sw([-.02, 1.24, .78], N3([0, .06, 1]), [0, -1, .06]), lh: 1, fr: [-.13, .085, .58, 0], fl: [.15, .085, -.42, .7], face: shout })],
    [.36, W(stance, { hy: -.25, hr: [0, .18, 0], sp: [.28, 0, 0], ch: [.15, 0, 0], hd: [-.1, 0, 0], sw: sw([-.02, 1.22, .76], N3([0, .06, 1]), [0, -1, .06]), lh: 1, fr: [-.13, .085, .56, 0], fl: [.15, .085, -.4, .7], face: shout })],
    [.62, stance],
  ], { hits: [{ limb: 'blade', dmg: 9, kb: 4.2, type: 'stagger' }], move: [[.12, .26, 6.5]], chain: .34, cancel: .36, active: [.15, .3], events: [{ t: .14, type: 'dash' }] });
  H.karatake = cutClip({ // karatake-wari: leap and split straight down the middle
    u: [0, .7, -.72], i: [0, -.14, 1], follow: 42, a0: 4, t: [.26, .38, .5, .9], piv: [-.02, 1.36, .1], r: [.24, .52, .42],
    W: { hy: .04, sp: [-.2, 0, 0], ch: [-.22, 0, 0], hd: [-.25, 0, 0], hr: [0, 0, 0], fr: [-.12, .5, .18, -.5], fl: [.12, .42, -.06, -.3], face: shout },
    I: { hy: -.26, sp: [.36, 0, 0], ch: [.2, 0, 0], hd: [-.08, 0, 0], hr: [0, 0, 0], fr: [-.13, .085, .4, 0], fl: [.15, .085, -.32, .6], face: shout },
    E: { hy: -.3, sp: [.42, 0, 0], ch: [.22, 0, 0], hd: [-.05, 0, 0], hr: [0, 0, 0], fr: [-.13, .085, .4, 0], fl: [.15, .085, -.32, .6], face: shout },
    hits: [{ limb: 'blade', dmg: 13, kb: 5.5, type: 'down', heavy: true }], move: [[.05, .36, 3.4]], air: leap(.04, .38, .95), arcFx: { width: .8, heavy: true },
    events: [{ t: .05, type: 'jump' }, { t: .38, type: 'land', heavy: true }], chain: .7, cancel: .62,
  });
  H.launcher = cutClip({ // a rising cut that throws the opponent into the air
    u: [.15, -.9, .3], i: [-.03, .22, 1], follow: 84, t: [.14, .22, .34, .64], r: [.26, .5, .4],
    W: { hy: -.26, hr: [0, .2, 0], sp: [.36, .05, 0], ch: [.2, .05, 0], hd: [-.2, 0, 0], fr: [-.13, .085, .3, 0], fl: [.15, .085, -.3, .6], face: fierce },
    I: { hy: -.02, hr: [0, -.1, 0], sp: [-.1, 0, 0], ch: [-.12, 0, 0], hd: [-.2, 0, 0], fr: [-.12, .2, .3, -.2], fl: [.13, .085, -.15, .5], face: shout },
    E: { hy: .06, hr: [0, -.16, 0], sp: [-.22, 0, 0], ch: [-.2, 0, 0], hd: [-.35, 0, 0], fr: [-.12, .35, .26, -.4], fl: [.13, .12, -.12, .5], face: shout },
    hits: [{ limb: 'blade', dmg: 9, kb: 1.2, up: 7.2, type: 'launch' }], move: [[.1, .26, 2.0]], air: leap(.2, .5, .35), arcFx: { width: .7 },
  });
  H.airCut = cutClip({ // in the air: a plunging overhead cut
    u: [0, .75, -.66], i: [0, -.42, 1], follow: 44, t: [.08, .16, .26, .46], piv: [-.02, 1.34, .12],
    W: { sp: [-.2, 0, 0], ch: [-.2, 0, 0], fr: [-.12, .52, .2, -.5], fl: [.12, .55, -.02, -.4], face: shout },
    I: { sp: [.4, 0, 0], ch: [.24, 0, 0], fr: [-.12, .38, .32, -.3], fl: [.12, .4, .05, -.3], face: shout },
    E: { sp: [.44, 0, 0], ch: [.26, 0, 0], fr: [-.12, .3, .3, -.2], fl: [.12, .32, .02, -.2], face: shout },
    hits: [{ limb: 'blade', dmg: 9, kb: 3.5, down: 9, type: 'spike' }], arcFx: { width: .6 }, chain: .4,
  });

  // ---------- Mitsuki: fast one-handed cuts, a spin, and her free hand ----------
  const M = {};
  M.crescent = cutClip({ one: true, // rising crescent from the trailing low guard
    u: [-.55, -.7, -.42], i: [.1, .14, 1], follow: 80, t: [.09, .16, .28, .52],
    W: { hy: -.13, hr: [0, -.5, 0], sp: [.16, .14, 0], ch: [.1, .2, 0], hd: [0, .4, 0], la: [.3, 1.2, .25], face: fierce },
    I: { hy: -.06, hr: [0, .1, 0], sp: [0, -.1, 0], ch: [-.04, -.2, 0], hd: [-.05, -.1, 0], fl: [.15, .085, .36, 0], la: [.38, 1.1, -.12], face: shout },
    E: { hy: -.02, hr: [0, .36, 0], sp: [-.08, -.2, 0], ch: [-.1, -.36, 0], hd: [-.1, -.3, 0], fl: [.15, .085, .36, 0], fr: [-.14, .12, -.18, .5], la: [.42, 1.05, -.22], face: shout },
    hits: [{ limb: 'blade', dmg: 6, kb: 2.2, type: 'light' }], move: [[.06, .24, 2.6]], arcFx: { width: .5 },
  });
  M.descend = cutClip({ one: true, // backhand: high left down to low right
    u: [.6, .74, -.3], i: [-.16, -.16, 1], follow: 76, t: [.08, .15, .27, .5],
    W: { hy: -.04, hr: [0, .45, 0], sp: [-.06, -.2, 0], ch: [-.08, -.34, 0], hd: [0, -.3, 0], la: [.36, 1.0, -.15], face: fierce },
    I: { hy: -.12, hr: [0, -.15, 0], sp: [.14, .1, 0], ch: [.1, .2, 0], hd: [0, .2, 0], fl: [.15, .085, .34, 0], la: [.32, 1.22, .3], face: shout },
    E: { hy: -.15, hr: [0, -.42, 0], sp: [.18, .16, 0], ch: [.12, .3, 0], hd: [0, .45, 0], fl: [.16, .085, .34, 0], la: [.3, 1.3, .34], face: shout },
    hits: [{ limb: 'blade', dmg: 6, kb: 2.4, type: 'light' }], move: [[.06, .24, 2.4]], arcFx: { width: .5 },
  });
  M.spin = cutClip({ one: true, // a full turn with the blade flat at the ribs
    u: [-.98, .08, -.2], f: [-.2, 0, -1], a: [0, 30, 60], t: [.08, .2, .42, .64], piv: [-.15, 1.22, .05], r: [.5, .6, .56],
    spin: t => -Math.PI * 2 * ease(clamp01((t - .06) / .4)),
    W: { hy: -.12, sp: [.1, 0, 0], la: [.4, 1.25, -.1], face: fierce },
    I: { hy: -.14, sp: [.1, 0, 0], la: [.45, 1.3, -.05], fl: [.16, .2, .1, -.2], face: shout },
    E: { hy: -.12, sp: [.1, 0, 0], la: [.42, 1.2, -.1], face: shout },
    hits: [{ limb: 'blade', dmg: 8, kb: 3.4, type: 'light' }], move: [[.08, .42, 1.6]], arcFx: { width: .55, spin: true }, chain: .5, cancel: .5,
  });
  M.palm = keyClip([ // shotei: an open-palm strike with the free hand, the sword held back
    [0, stance],
    [.1, W(stance, { hy: -.12, hr: [0, -.6, 0], sp: [.05, .3, 0], ch: [0, .4, 0], hd: [0, .5, 0], la: [.18, 1.2, .02], face: fierce })],
    [.18, W(stance, { hy: -.2, hr: [0, .3, 0], sp: [.22, -.2, 0], ch: [.1, -.35, 0], hd: [0, -.25, 0], la: [.04, 1.28, .82], fl: [.15, .085, .52, 0], fr: [-.15, .085, -.32, .6], sw: sw([-.35, 1.12, -.25], N3([-.3, .2, -1]), [0, -1, 0]), face: shout })],
    [.32, W(stance, { hy: -.2, hr: [0, .3, 0], sp: [.22, -.2, 0], ch: [.1, -.35, 0], hd: [0, -.25, 0], la: [.04, 1.27, .8], fl: [.15, .085, .5, 0], fr: [-.15, .085, -.3, .6], sw: sw([-.35, 1.12, -.25], N3([-.3, .2, -1]), [0, -1, 0]), face: shout })],
    [.56, stance],
  ], { hits: [{ limb: 'handL', dmg: 7, kb: 6.5, type: 'stagger', guardBreak: true }], move: [[.1, .2, 5]], chain: .3, cancel: .34, active: [.14, .26] });
  M.cleave = cutClip({ one: true, // a forward flip into a two-handed downward cleave, embers on the ground
    u: [0, .7, -.72], i: [0, -.16, 1], follow: 44, a0: 2, t: [.08, .46, .56, .92], piv: [-.02, 1.3, .1], r: [.4, .5, .42],
    W: { hy: -.2, sp: [.3, 0, 0], ch: [.1, 0, 0], fr: [-.13, .085, -.1, .4], fl: [.15, .085, .12, 0], face: fierce },
    I: { hy: -.28, sp: [.38, 0, 0], ch: [.2, 0, 0], fl: [.15, .085, .42, 0], fr: [-.15, .085, -.3, .6], face: shout },
    E: { hy: -.3, sp: [.42, 0, 0], ch: [.22, 0, 0], fl: [.15, .085, .42, 0], fr: [-.15, .085, -.3, .6], face: shout },
    hits: [{ limb: 'blade', dmg: 12, kb: 5.5, type: 'down', heavy: true }], move: [[.06, .44, 3.6]], air: leap(.08, .46, 1.05), arcFx: { width: .8, heavy: true },
    events: [{ t: .08, type: 'jump' }, { t: .46, type: 'land', heavy: true }], chain: .76, cancel: .7,
  });
  // the flip itself rides on top of the cut: the body turns once forward while airborne
  { const c = M.cleave, f0 = c.fn; c.fn = t => { const p = f0(t); p.flip = -Math.PI * 2 * ease(clamp01((t - .1) / .32)); p.ly = 0; if (t > .1 && t < .42) { p.fl = [.12, .55, .1, -.6]; p.fr = [-.12, .55, .1, -.6]; p.hy = .12; } return p; }; }
  M.launcher = cutClip({ one: true, u: [-.2, -.92, .2], i: [0, .22, 1], follow: 84, t: [.12, .2, .32, .6],
    W: { hy: -.26, hr: [0, -.3, 0], sp: [.34, 0, 0], ch: [.18, 0, 0], hd: [-.2, 0, 0], la: [.3, 1.0, .2], face: fierce },
    I: { hy: -.02, hr: [0, .1, 0], sp: [-.12, 0, 0], ch: [-.14, 0, 0], hd: [-.22, 0, 0], la: [.4, 1.1, -.15], fr: [-.13, .3, -.1, -.3], face: shout },
    E: { hy: .08, hr: [0, .15, 0], sp: [-.22, 0, 0], ch: [-.2, 0, 0], hd: [-.35, 0, 0], la: [.42, 1.15, -.2], fr: [-.13, .4, -.05, -.5], face: shout },
    hits: [{ limb: 'blade', dmg: 8, kb: 1.2, up: 7.2, type: 'launch' }], move: [[.1, .26, 2]], air: leap(.18, .48, .3), arcFx: { width: .6 } });
  M.airCut = cutClip({ one: true, u: [.4, .8, -.45], i: [-.16, -.42, 1], follow: 44, t: [.07, .14, .24, .44],
    W: { fr: [-.12, .5, .15, -.5], fl: [.12, .55, 0, -.4], la: [.35, 1.35, .1], face: shout },
    I: { sp: [.3, 0, 0], fr: [-.12, .4, .3, -.3], fl: [.12, .42, .05, -.3], la: [.4, 1.2, -.2], face: shout },
    E: { sp: [.36, 0, 0], fr: [-.12, .32, .3, -.2], fl: [.12, .34, .02, -.2], la: [.4, 1.15, -.25], face: shout },
    hits: [{ limb: 'blade', dmg: 8, kb: 3.5, down: 9, type: 'spike' }], arcFx: { width: .5 }, chain: .38 });

  // ---------- kicks and body blows ----------
  const kickFront = keyClip([ // mae-geri off the back leg: chamber the knee high, snap the foot to the chest
    [0, stance],
    [.1, W(stance, { hy: -.06, hr: [0, haru ? .1 : -.1, 0], sp: [-.08, 0, 0], fl: haru ? [.12, .5, .22, -.3] : stance.fl, fr: haru ? stance.fr : [-.12, .5, .22, -.3], face: fierce })],
    [.17, W(stance, { hy: -.02, hr: [0, 0, 0], sp: [-.26, 0, 0], ch: [-.12, 0, 0], hd: [.22, 0, 0], fl: haru ? [.11, .86, .7, -1.2] : [.14, .085, .05, 0], fr: haru ? [-.13, .085, .05, 0] : [-.11, .86, .7, -1.2], face: shout })],
    [.27, W(stance, { hy: -.02, hr: [0, 0, 0], sp: [-.24, 0, 0], ch: [-.1, 0, 0], hd: [.2, 0, 0], fl: haru ? [.11, .84, .66, -1.15] : [.14, .085, .05, 0], fr: haru ? [-.13, .085, .05, 0] : [-.11, .84, .66, -1.15], face: shout })],
    [.36, W(stance, { hy: -.06, sp: [-.05, 0, 0], fl: haru ? [.12, .45, .25, -.3] : stance.fl, fr: haru ? stance.fr : [-.12, .45, .25, -.3], face: fierce })],
    [.52, stance],
  ], { hits: [{ limb: haru ? 'footL' : 'footR', dmg: 6, kb: 5.5, type: 'stagger', guardBreak: true }], move: [[.06, .18, 2.2]], chain: .3, cancel: .34, active: [.13, .27], kind: 'kick' });
  const kickSpin = keyClip([ // ushiro-mawashi: turn the back to the opponent and whip the heel through
    [0, stance],
    [.12, W(stance, { ry: -Math.PI * .6, hy: -.08, sp: [.1, 0, 0], hd: [0, 1.0, 0], fr: [-.12, .085, .05, 0], fl: [.12, .3, -.05, -.2], face: fierce })],
    [.22, W(stance, { ry: -Math.PI * 1.15, hy: -.04, hr: [0, 0, -.4], sp: [.0, 0, -.45], ch: [0, 0, -.2], hd: [0, .5, .3], fr: [-.12, .085, .0, 0], fl: [.72, 1.12, .12, 0], face: shout })],
    [.3, W(stance, { ry: -Math.PI * 1.55, hy: -.04, hr: [0, 0, -.4], sp: [.0, 0, -.45], ch: [0, 0, -.2], hd: [0, .2, .3], fr: [-.12, .085, .0, 0], fl: [.7, 1.08, .25, 0], face: shout })],
    [.42, W(stance, { ry: -Math.PI * 1.9, hy: -.1, fr: stance.fr, fl: [.14, .3, -.1, -.2], face: fierce })],
    [.6, W(stance, { ry: -Math.PI * 2 })],
  ], { hits: [{ limb: 'footL', dmg: 10, kb: 7.5, type: 'down', heavy: true, guardBreak: true }], move: [[.05, .3, 1.6]], chain: 99, cancel: .5, active: [.17, .33], kind: 'kick' });
  const charge = keyClip([ // tai-atari: drive the shoulder and the hilt into the opponent's chest
    [0, stance],
    [.12, W(stance, { hy: -.2, hr: [0, -.55, 0], sp: [.3, .25, 0], ch: [.1, .3, 0], hd: [0, .45, 0], fr: [-.13, .085, .12, 0], fl: [.15, .085, -.32, .6], face: fierce })],
    [.2, W(stance, { hy: -.24, hr: [0, -.9, 0], sp: [.38, .3, 0], ch: [.14, .35, 0], hd: [0, .7, 0], sw: sw([.05, 1.18, .42], N3([.1, .9, -.4]), [0, .4, .9]), lh: 1, fr: [-.13, .085, .5, 0], fl: [.15, .085, -.45, .7], face: shout })],
    [.32, W(stance, { hy: -.24, hr: [0, -.9, 0], sp: [.38, .3, 0], ch: [.14, .35, 0], hd: [0, .7, 0], sw: sw([.05, 1.18, .42], N3([.1, .9, -.4]), [0, .4, .9]), lh: 1, fr: [-.13, .085, .48, 0], fl: [.15, .085, -.42, .7], face: shout })],
    [.55, stance],
  ], { hits: [{ limb: 'body', dmg: 8, kb: 8, type: 'down', heavy: true, guardBreak: true }], move: [[.1, .24, 7.5]], chain: 99, cancel: .5, active: [.15, .3], kind: 'kick' });
  const sweep = keyClip([ // ashi-barai: drop low and scythe the leg around
    [0, stance],
    [.1, W(stance, { hy: -.5, sp: [.4, 0, 0], ch: [.1, 0, 0], ry: -.6, fr: [-.2, .085, .05, 0], fl: [.25, .085, .1, 0], face: fierce })],
    [.22, W(stance, { hy: -.58, sp: [.35, 0, 0], ch: [.1, 0, 0], ry: -1.8, fr: [-.22, .085, .0, 0], fl: [.72, .12, .2, 0], face: shout })],
    [.32, W(stance, { hy: -.58, sp: [.35, 0, 0], ch: [.1, 0, 0], ry: -3.2, fr: [-.22, .085, .0, 0], fl: [.7, .12, .25, 0], face: shout })],
    [.5, W(stance, { ry: -Math.PI * 2 })],
  ], { hits: [{ limb: 'footL', dmg: 7, kb: 2.5, type: 'down', guardBreak: true, low: true }], chain: 99, cancel: .46, active: [.16, .32], kind: 'kick' });

  // ---------- grab and throw ----------
  const grab = keyClip([ // reach for the collar, turn in, and throw the opponent over the hip
    [0, stance],
    [.12, W(stance, { hy: -.12, sp: [.2, 0, 0], la: [.12, 1.35, .62], sw: sw([-.25, 1.25, .45], N3([-.1, .2, -1]), [0, -1, 0]), lh: 0, face: fierce })],
    [.3, W(stance, { ry: -Math.PI * .9, hy: -.32, sp: [.5, 0, 0], ch: [.2, 0, 0], hd: [0, -.5, 0], la: [.1, 1.25, .4], fr: [-.13, .085, .1, 0], fl: [.13, .085, .1, 0], sw: sw([-.25, 1.1, .4], N3([-.1, .1, -1]), [0, -1, 0]), lh: 0, face: shout })],
    [.6, W(stance, { ry: -Math.PI * 1.0, hy: -.4, sp: [.75, 0, 0], ch: [.3, 0, 0], hd: [-.3, -.3, 0], la: [.1, .7, .55], fr: [-.13, .085, .1, 0], fl: [.13, .085, .1, 0], sw: sw([-.3, .9, .2], N3([-.2, -.1, -1]), [0, -1, 0]), lh: 0, face: shout })],
    [.9, W(stance, { ry: -Math.PI })],
  ], { hits: [], chain: 99, cancel: .88, kind: 'grab' });
  const thrown = keyClip([ // the victim's side of the throw (the combat system carries the body on an arc)
    [0, P({ hy: -.05, sp: [-.2, 0, 0], hd: [-.3, 0, 0], la: [.3, 1.2, .3], face: hurt })],
    [.3, P({ flip: -Math.PI * .7, hy: -.1, sp: [-.4, 0, 0], fr: [-.15, .5, .3, -.5], fl: [.15, .55, .2, -.5], la: [.4, 1.4, 0], face: { ...hurt, mouth: 'shout' } })],
    [.6, P({ flip: -Math.PI * 1.45, hy: -.72, hr: [0, 0, 0], sp: [-.1, 0, 0], fr: [-.16, .3, .52, -.6], fl: [.14, .3, .42, -.4], la: [.4, .3, -.1], face: { blink: 1, mouth: 'grit' } })],
    [.9, P({ flip: -Math.PI * 1.5, hy: -.75, sp: [-.1, 0, 0], fr: [-.16, .12, .52, -.6], fl: [.14, .12, .42, -.4], la: [.4, .2, -.25], face: { blink: 1, mouth: 'grit' } })],
  ], { kind: 'react', hold: true });

  // ---------- defence ----------
  const guardMid = haru
    ? W(stance, { hy: -.12, sp: [.1, -.05, 0], hd: [.08, 0, 0], sw: sw([-.08, 1.16, .32], N3([.32, .92, .12]), [-.15, -.05, 1]), lh: 1, face: { brow: 'fierce', mouth: 'grit' } })
    : W(stance, { hy: -.13, hr: [0, -.1, 0], sp: [.1, 0, 0], hd: [.06, .1, 0], sw: sw([-.12, 1.12, .3], N3([.38, .9, .08]), [-.2, 0, 1]), lh: 0, lb: .32, face: { brow: 'fierce', mouth: 'grit' } });
  const guardHigh = W(stance, { hy: -.16, sp: [.06, 0, 0], hd: [-.12, 0, 0], sw: sw([-.24, 1.58, .22], N3([1, .12, .12]), [0, 1, .1]), lh: haru ? 1 : 0, lb: haru ? 0 : .45, la: [.3, 1.62, .25], face: { brow: 'fierce', mouth: 'grit' } });
  const parry = cutClip({ one: !haru, u: [.32, .92, .12], f: [-1, .15, .3], a: [0, 40, 62], t: [.03, .08, .16, .36], r: [.32, .44, .4], piv: haru ? [-.02, 1.2, .12] : [-.17, 1.25, .08],
    W: { hy: -.12, face: fierce }, I: { hy: -.14, hr: [0, -.3, 0], ch: [0, -.2, 0], face: shout }, E: { hy: -.12, hr: [0, -.35, 0], ch: [0, -.25, 0], face: fierce }, chain: .16, cancel: .16 });
  const deflected = keyClip([ // the parried attacker: blade flung up and back, body open
    [0, stance],
    [.08, W(stance, { hy: -.02, sp: [-.32, 0, 0], ch: [-.2, 0, 0], hd: [-.3, 0, 0], sw: sw([-.25, 1.58, -.05], N3([-.3, .6, -.75]), [0, .7, .6]), lh: haru ? 1 : 0, la: [.4, 1.3, .1], fr: [-.13, .1, .05, 0], face: hurt })],
    [.5, W(stance, { hy: -.08, sp: [-.2, 0, 0], ch: [-.12, 0, 0], hd: [-.15, 0, 0], sw: sw([-.25, 1.48, .05], N3([-.25, .7, -.65]), [0, .7, .6]), lh: haru ? 1 : 0, la: [.38, 1.2, .1], face: fierce })],
    [.72, stance],
  ], { kind: 'react' });
  const recoil = keyClip([ // blades met: both bounce back a step
    [0, stance],
    [.07, W(stance, { hy: -.1, sp: [-.15, 0, 0], ch: [-.1, 0, 0], hd: [-.1, 0, 0], sw: sw([-.12, 1.3, .18], N3([-.2, .8, .55]), [0, .55, -.8]), lh: haru ? 1 : 0, fr: [-.13, .085, .05, 0], face: fierce })],
    [.36, stance],
  ], { kind: 'react' });
  const lock = { fn: t => { // tsubazeriai: guards crossed at the hilt, faces close, pushing
    const s = Math.sin(t * 9) * .012, s2 = Math.sin(t * 13.7) * .01;
    return W(stance, { hy: -.16 + s, hr: [0, haru ? .08 : -.08, 0], sp: [.26, 0, 0], ch: [.1, 0, 0], hd: [.05, 0, 0], sw: sw([-.06, 1.34 + s2, .34], N3([.22, .9, .38]), [0, -.35, .94]), lh: 1, lb: 0, fr: [-.13, .085, .22, 0], fl: [.15, .085, -.32, .55], face: { brow: 'fierce', mouth: 'grit' } });
  }, loop: true, drawn: true, kind: 'lock', fadeIn: .06 };
  const guardBreak = keyClip([
    [0, guardMid],
    [.08, W(stance, { hy: -.06, sp: [-.35, 0, .1], ch: [-.25, .2, 0], hd: [-.3, .2, 0], sw: sw([-.4, 1.2, -.05], N3([-.8, .5, -.2]), [0, .3, 1]), lh: 0, la: [.45, 1.25, -.1], fr: [-.13, .1, .02, 0], face: { ...hurt, mouth: 'shout' } })],
    [.6, W(stance, { hy: -.12, sp: [-.2, 0, .05], ch: [-.12, .1, 0], hd: [-.12, .1, 0], sw: sw([-.38, 1.05, .05], N3([-.7, -.3, .3]), [0, 1, 0]), lh: 0, la: [.4, 1.1, -.05], face: fierce })],
    [.85, stance],
  ], { kind: 'react' });

  // ---------- evasion and movement ----------
  const stepSide = side => keyClip([ // a quick sidestep with a crouch
    [0, stance],
    [.06, W(stance, { hy: -.2, hr: [0, side * .2, side * .15], sp: [.15, 0, side * .1], fl: [.15 + side * .1, .14, -.05, .3], fr: [-.15 + side * .1, .14, .1, .3], face: fierce })],
    [.22, W(stance, { hy: -.16, hr: [0, side * .1, side * .05], sp: [.1, 0, 0], face: fierce })],
    [.32, stance],
  ], { kind: 'evade', cancel: .24 });
  const backstep = keyClip([
    [0, stance],
    [.06, W(stance, { hy: -.18, sp: [.25, 0, 0], fr: [-.13, .3, .1, -.2], fl: [.15, .3, -.2, -.2], face: fierce })],
    [.2, W(stance, { hy: -.2, sp: [.3, 0, 0], ch: [.1, 0, 0], fl: [.15, .085, -.32, .4], face: fierce })],
    [.34, stance],
  ], { kind: 'evade', cancel: .26, air: leap(.03, .2, .18) });
  const dashIn = keyClip([ // a low burst forward, blade trailing
    [0, stance],
    [.06, W(stance, { hy: -.24, sp: [.5, 0, 0], ch: [.15, 0, 0], hd: [-.35, 0, 0], sw: haru ? sw([-.28, .98, -.1], N3([-.35, -.25, -.9]), [0, -1, .25]) : stance.sw, lh: 0, la: [.3, 1.05, -.25], fr: [-.13, .2, .25, -.3], fl: [.15, .3, -.35, .4], face: fierce })],
    [.26, W(stance, { hy: -.22, sp: [.45, 0, 0], ch: [.12, 0, 0], hd: [-.3, 0, 0], sw: haru ? sw([-.28, .98, -.1], N3([-.35, -.25, -.9]), [0, -1, .25]) : stance.sw, lh: 0, la: [.3, 1.05, -.25], fr: [-.13, .085, .3, 0], fl: [.15, .25, -.38, .5], face: fierce })],
    [.4, stance],
  ], { kind: 'evade', cancel: .2, events: [{ t: .02, type: 'dash' }] });
  const roll = keyClip([ // forward roll (also the recovery from a throw or knockdown)
    [0, stance],
    [.08, W(stance, { hy: -.45, sp: [.6, 0, 0], ch: [.3, 0, 0], hd: [.4, 0, 0], fr: [-.12, .3, .1, -.3], fl: [.12, .3, -.05, -.3], face: fierce })],
    [.3, W(stance, { flip: Math.PI * 1.0, hy: -.5, sp: [.6, 0, 0], ch: [.3, 0, 0], hd: [.5, 0, 0], fr: [-.1, .55, .15, -.5], fl: [.1, .55, .1, -.5], face: fierce })],
    [.46, W(stance, { flip: Math.PI * 2, hy: -.38, sp: [.4, 0, 0], fr: [-.13, .085, .2, 0], fl: [.15, .085, -.15, .5], face: fierce })],
    [.58, W(stance, { flip: Math.PI * 2 })],
  ], { kind: 'evade', cancel: .5 });
  const backflip = keyClip([
    [0, stance],
    [.08, W(stance, { hy: -.25, sp: [.2, 0, 0], fr: [-.13, .085, .1, 0], fl: [.15, .085, -.1, 0], face: fierce })],
    [.24, W(stance, { flip: -Math.PI * .9, hy: .05, sp: [-.4, 0, 0], ch: [-.2, 0, 0], hd: [-.4, 0, 0], fr: [-.12, .55, .2, -.6], fl: [.12, .58, .15, -.6], la: [.4, 1.5, .1], face: shout })],
    [.42, W(stance, { flip: -Math.PI * 1.85, hy: -.15, sp: [.1, 0, 0], fr: [-.12, .3, .15, -.2], fl: [.12, .3, -.05, -.2], face: fierce })],
    [.54, W(stance, { flip: -Math.PI * 2, hy: -.22 })],
    [.68, W(stance, { flip: -Math.PI * 2 })],
  ], { kind: 'evade', cancel: .58, air: leap(.06, .5, 1.05), events: [{ t: .06, type: 'jump' }, { t: .5, type: 'land' }] });
  const jump = keyClip([[0, stance], [.08, W(stance, { hy: -.2, sp: [.2, 0, 0] })], [.2, W(stance, { hy: .06, sp: [-.05, 0, 0], fr: [-.12, .5, .2, -.5], fl: [.12, .55, -.02, -.4], face: fierce })], [.6, W(stance, { hy: .06, fr: [-.12, .48, .2, -.5], fl: [.12, .52, -.02, -.4], face: fierce })]], { kind: 'air', hold: true });
  const land = keyClip([[0, W(stance, { hy: -.32, sp: [.3, 0, 0], ch: [.12, 0, 0], fr: [-.14, .085, .2, 0], fl: [.16, .085, -.2, .4], face: fierce })], [.26, stance]], { kind: 'body', cancel: .08 });

  // ---------- getting hit ----------
  const hitHigh = keyClip([[0, stance], [.06, W(stance, { hy: -.06, sp: [-.3, .15, .1], ch: [-.2, .25, 0], hd: [-.45, .35, 0], lh: 0, la: [.35, 1.05, -.05], fr: [-.13, .1, .1, 0], face: hurt })], [.4, stance]], { kind: 'react' });
  const hitMid = keyClip([[0, stance], [.06, W(stance, { hy: -.16, sp: [.42, -.15, 0], ch: [.25, -.2, 0], hd: [.1, -.2, 0], lh: 0, la: [.25, 1.05, .25], face: { ...hurt, mouth: 'shout' } })], [.44, stance]], { kind: 'react' });
  const stagger = keyClip([
    [0, stance],
    [.07, W(stance, { hy: -.08, sp: [-.4, 0, .12], ch: [-.25, 0, 0], hd: [-.4, 0, 0], lh: 0, la: [.42, 1.15, -.15], fr: [-.13, .2, .05, -.2], face: { ...hurt, mouth: 'shout' } })],
    [.3, W(stance, { hy: -.2, sp: [.15, 0, .05], ch: [.1, 0, 0], hd: [0, 0, 0], lh: 0, la: [.35, 1.05, .1], fr: [-.13, .085, -.15, .3], fl: [.15, .085, -.42, .5], face: hurt })],
    [.7, stance],
  ], { kind: 'react' });
  const lying = P({ hy: -.74, hr: [-1.4, 0, 0], sp: [-.1, 0, 0], hd: [.5, 0, 0], fr: [-.18, .09, .55, -.6], fl: [.14, .12, .45, -.4], sw: sw([-.42, .14, .0], N3([-.95, .05, .25]), [0, 1, 0]), la: [.42, .16, -.25], face: { blink: 1, mouth: 'grit' } });
  const down = keyClip([
    [0, stance],
    [.1, W(stance, { hy: -.12, sp: [-.45, 0, .15], ch: [-.3, 0, 0], hd: [-.45, 0, 0], lh: 0, la: [.4, 1.1, -.1], face: { mouth: 'shout', brow: 'fierce', blink: .8 } })],
    [.38, lying], [1.0, lying],
    [1.25, P({ ...stance, hy: -.44, hr: [.2, .2, 0], sp: [.45, 0, 0], fr: [-.13, .085, .25, 0], fl: [.15, .3, -.25, .9], face: fierce })],
    [1.55, stance],
  ], { kind: 'react', move: [[0, .4, -2.2]] });
  const launched = { fn: t => { // tumbling backward through the air
    const a = -t * 7.5; return P({ flip: a, hy: -.05, sp: [-.25, 0, 0], ch: [-.15, 0, 0], hd: [-.35, 0, 0], fr: [-.16, .45 + .1 * Math.sin(t * 9), .32, -.5], fl: [.14, .62, .12, -.6], la: [.42, 1.5, -.1], sw: sw([-.42, 1.3, -.1], N3([-.6, .6, -.5]), [0, .3, 1]), face: { ...hurt, mouth: 'shout' } });
  }, loop: true, drawn: true, kind: 'react', fadeIn: .05 };
  const crash = keyClip([[0, W(lying, { hy: -.6, flip: 0 })], [.12, lying], [.9, lying], [1.15, P({ ...stance, hy: -.44, hr: [.2, .2, 0], sp: [.45, 0, 0], fr: [-.13, .085, .25, 0], fl: [.15, .3, -.25, .9], face: fierce })], [1.42, stance]], { kind: 'react' });
  const ko = keyClip([
    [0, stance],
    [.12, W(stance, { hy: -.1, sp: [-.4, 0, .1], ch: [-.25, 0, 0], hd: [-.5, 0, 0], lh: 0, face: { ...hurt, mouth: 'shout' } })],
    [.6, P({ hy: -.48, sp: [.55, 0, .1], ch: [.3, 0, 0], hd: [.5, 0, 0], fr: [-.15, .085, -.1, 1.2], fl: [.15, .085, -.25, 1.3], la: [.35, .4, .25], sw: sw([-.4, .4, .2], N3([-.5, -.7, .5]), [0, 0, 1]), face: { blink: 1, mouth: 'grit' } })],
    [1.3, lying],
  ], { kind: 'react', hold: true });

  // ---------- ceremony ----------
  // nukitsuke: hand to the hilt at the left hip, draw in one horizontal cut, settle into stance
  const drawCut = cutClip({ one: true, u: [.75, -.25, .6], i: [-.08, .04, 1], follow: 84, a0: 0, t: [.42, .5, .62, 1.0], r: [.3, .58, .46],
    W: { hy: -.2, hr: [0, .6, 0], sp: [.25, .3, 0], ch: [.1, .3, 0], hd: [0, -.5, 0], fr: [-.13, .085, .25, 0], fl: [.15, .085, -.25, .5], la: [.22, .98, .2], face: fierce },
    I: { hy: -.2, hr: [0, -.2, 0], sp: [.15, -.1, 0], ch: [.05, -.2, 0], hd: [0, .15, 0], fr: [-.14, .085, .38, 0], la: [.35, 1.0, -.1], face: shout },
    E: { hy: -.18, hr: [0, -.45, 0], sp: [.12, -.2, 0], ch: [.05, -.3, 0], hd: [0, .4, 0], fr: [-.14, .085, .38, 0], la: [.4, 1.05, -.15], face: fierce },
    events: [{ t: .4, type: 'draw' }] });
  const drawPre = keyClip([[0, idle], [.25, P({ hy: -.12, hr: [0, .5, 0], sp: [.2, .3, 0], ch: [.1, .25, 0], hd: [0, -.45, 0], fr: [-.13, .085, .22, 0], fl: [.15, .085, -.25, .5], ra: [.08, .98, .26], la: [.2, .96, .16], face: fierce })], [.4, P({ hy: -.2, hr: [0, .6, 0], sp: [.25, .3, 0], ch: [.1, .3, 0], hd: [0, -.5, 0], fr: [-.13, .085, .25, 0], fl: [.15, .085, -.25, .5], ra: [.1, .98, .3], la: [.2, .96, .18], face: fierce })]], { drawn: false });
  const draw = { fn: t => t < .4 ? sampleKeys(drawPre.keys, t) : drawCut.fn(t), dur: drawCut.dur, drawn: false, fadeIn: .2, events: [{ t: .4, type: 'draw' }], kind: 'ceremony', hits: [], move: [] };
  const win = keyClip([ // chiburi: flick the blade clean, then stand tall
    [0, stance],
    [.25, W(stance, { hy: -.1, hr: [0, -.3, 0], sw: sw([-.4, 1.4, .3], N3([-.6, .7, .2]), [.3, .3, -.9]), lh: 0, la: [.25, 1.0, .1], face: fierce })],
    [.4, W(stance, { hy: -.16, hr: [0, .1, 0], sw: sw([-.42, 1.0, .35], N3([-.5, -.75, .45]), [.5, -.5, -.7]), lh: 0, la: [.25, 1.0, .1], face: fierce })],
    [1.0, P({ hy: -.01, hd: [.1, 0, 0], sw: sw([-.24, .98, .12], N3([-.15, -.97, .18]), [0, .2, .98]), la: [.08, 1.18, .2], face: { brow: 'calm', mouth: 'smile' } })],
    [3, P({ hy: -.01, hd: [.1, 0, 0], sw: sw([-.24, .98, .12], N3([-.15, -.97, .18]), [0, .2, .98]), la: [.08, 1.18, .2], face: { brow: 'calm', mouth: 'smile' } })],
  ], { hold: true, kind: 'ceremony' });
  const bow = keyClip([[0, idle], [.5, P({ ...idle, sp: [.35, 0, 0], ch: [.15, 0, 0], hd: [.2, 0, 0], face: { blink: 1, mouth: 'calm' } })], [1.2, P({ ...idle, sp: [.35, 0, 0], ch: [.15, 0, 0], hd: [.2, 0, 0], face: { blink: 1, mouth: 'calm' } })], [1.6, idle]], { drawn: false, kind: 'ceremony' });

  // ---------- special arts ----------
  // Haru, Sky-Current Crescent: dash through with a flat cut, turn, launch, leap, and split downward.
  const artH = haru ? seqClip([
    { clip: keyClip([[0, stance], [.3, W(stance, { hy: -.32, hr: [0, .7, 0], sp: [.4, .3, 0], ch: [.12, .35, 0], hd: [-.2, -.7, 0], sw: sw([-.35, .95, -.25], N3([-.4, -.15, -.9]), [0, -1, .15]), lh: 0, la: [.28, 1.0, .2], fr: [-.14, .085, .3, 0], fl: [.16, .085, -.38, .6], face: fierce })], [.42, W(stance, { hy: -.34, hr: [0, .72, 0], sp: [.42, .3, 0], ch: [.12, .35, 0], hd: [-.2, -.7, 0], sw: sw([-.35, .95, -.25], N3([-.4, -.15, -.9]), [0, -1, .15]), lh: 0, la: [.28, 1.0, .2], fr: [-.14, .085, .3, 0], fl: [.16, .085, -.38, .6], face: shout })]]) },
    { clip: H.yoko, dur: .34 },
    { clip: H.kiriage, dur: .34, ry: Math.PI },
    { clip: H.karatake, dur: .62, ry: Math.PI },
  ], {
    hits: [{ limb: 'blade', t0: .46, t1: .72, dmg: 8, kb: 1.5, type: 'stagger', unblockable: true }, { limb: 'blade', t0: .82, t1: .98, dmg: 8, kb: .8, up: 6.5, type: 'launch', unblockable: true }, { limb: 'blade', t0: 1.28, t1: 1.42, dmg: 14, kb: 6, type: 'down', heavy: true, unblockable: true }],
    move: [[.42, .62, 15], [.76, .96, 1.5]], air: leap(1.08, 1.42, 1.3),
    events: [{ t: .05, type: 'artStart' }, { t: .44, type: 'dash' }, { t: .52, type: 'arc', n: 1 }, { t: .76, type: 'turn' }, { t: .86, type: 'arc', n: 2 }, { t: 1.08, type: 'jump' }, { t: 1.3, type: 'arc', n: 3, heavy: true }, { t: 1.42, type: 'land', heavy: true }],
  }) : null;
  // Mitsuki, Ember Bell Descent: rise in a spinning column, flip twice and crash down blade-first.
  const artM = !haru ? seqClip([
    { clip: keyClip([[0, stance], [.3, W(stance, { hy: -.36, sp: [.35, 0, 0], ch: [.1, 0, 0], hd: [-.25, 0, 0], sw: sw([-.3, 1.0, -.2], N3([-.3, -.2, -.93]), [0, -1, .2]), la: [.35, 1.0, .25], fr: [-.15, .085, -.15, .5], fl: [.16, .085, .2, 0], face: fierce })]]) },
    { clip: M.spin, dur: .5 },
    { clip: M.cleave, dur: .92 },
  ], {
    hits: [{ limb: 'blade', t0: .38, t1: .78, dmg: 7, kb: 1, up: 5.5, type: 'launch', unblockable: true }, { limb: 'blade', t0: 1.18, t1: 1.34, dmg: 15, kb: 6, type: 'down', heavy: true, unblockable: true }],
    move: [[.3, .6, 5.5], [.85, 1.25, 2.5]], air: t => leap(.3, .8, .8)(t) + leap(.86, 1.26, 1.7)(t),
    events: [{ t: .05, type: 'artStart' }, { t: .3, type: 'jump' }, { t: .4, type: 'arc', n: 1, spin: true }, { t: .86, type: 'jump' }, { t: 1.16, type: 'arc', n: 2, heavy: true }, { t: 1.26, type: 'land', heavy: true }],
  }) : null;

  // ---------- clip table ----------
  const clips = {
    idle: { loop: true, pose: () => idle, drawn: false },
    stance: { loop: true, pose: () => stance, drawn: true },
    walk: { loop: true, cycle: 'walk' }, run: { loop: true, cycle: 'run' }, battleRun: { loop: true, cycle: 'battle', drawn: true },
    guard: { loop: true, pose: () => guardMid, drawn: true, kind: 'guard' }, guardHigh: { loop: true, pose: () => guardHigh, drawn: true, kind: 'guard' },
    parry: { ...parry, kind: 'parry' }, deflected, recoil, lock, guardBreak,
    stepL: stepSide(1), stepR: stepSide(-1), backstep, dashIn, roll, backflip, jump, land,
    kick: kickFront, kick2: haru ? charge : kickSpin, sweep, grab, thrown,
    hit: hitHigh, hitHigh, hitMid, stagger, down, launched, crash, ko,
    draw, win, bow,
    ...(haru
      ? { c1: H.kesa, c2: H.kiriage, c3: H.yoko, c4: H.tsuki, c5: H.karatake, launcher: H.launcher, airCut: H.airCut, dashAttack: H.tsuki, art: artH }
      : { c1: M.crescent, c2: M.descend, c3: M.spin, c4: M.palm, c5: M.cleave, launcher: M.launcher, airCut: M.airCut, dashAttack: M.palm, art: artM }),
  };
  // names the older code and labs use
  Object.assign(clips, { slash1: clips.c1, slash2: clips.c2, slash3: clips.c3, finisher: clips.art, dodge: clips.backstep });
  for (const c of Object.values(clips)) { if (c.keys && !c.dur) c.dur = c.keys[c.keys.length - 1][0]; for (const h of c.hits || []) { if (h.t0 === undefined) { const a = c.active || [0, c.dur]; h.t0 = a[0]; h.t1 = a[1]; } } }
  const combos = { sword: ['c1', 'c2', 'c3', 'c4', 'c5'], kick: haru ? ['kick', 'kick2'] : ['kick', 'kick2'] };

  // ---------- locomotion cycles ----------
  function cycle(kind, phase, lean) {
    const run = kind !== 'walk', battle = kind === 'battle', s = Math.sin(phase), c = Math.cos(phase), A = run ? .3 : .2, lift = run ? .16 : .07;
    const foot = (sgn, ph) => { const z = A * Math.sin(ph), up = Math.max(0, Math.cos(ph)); return [sgn * .11, .085 + lift * Math.pow(up, 1.6), z, -.5 * up * (run ? 1 : .5) + .3 * Math.max(0, -Math.cos(ph)) * (run ? 1 : .3)]; };
    const p = P({
      hy: -(run ? .07 : .02) - (run ? .05 : .02) * Math.abs(c), hr: [0, (run ? .18 : .12) * s, 0], sp: [(run ? .22 : .04) + lean, -(run ? .1 : .06) * s, 0], ch: [run ? .05 : 0, -(run ? .14 : .08) * s, 0], hd: [run ? -.12 : 0, .1 * s, 0],
      fl: foot(1, phase), fr: foot(-1, phase + Math.PI),
      la: [.22, run ? 1.02 : .9, (run ? .05 : .02) - (run ? .26 : .14) * s], ra: [-.22, run ? 1.02 : .9, (run ? .05 : .02) + (run ? .26 : .14) * s],
      face: { brow: battle ? 'fierce' : 'calm', mouth: 'calm' },
    });
    if (battle) { p.sw = haru ? sw([-.24, 1.0, -.06], N3([-.35, -.28, -.9]), [0, -1, .3]) : sw([-.26, 1.02, -.04], N3([-.4, -.2, -.9]), [0, -1, .2]); p.lh = 0; p.la = [.24, 1.04, .05 - .3 * s]; }
    if (!run) { p.la = [.16, .985, .14]; p.ls = 1; } // walking: the left hand rests on the scabbard
    return p;
  }

  // ---------- rig: FK + two-bone IK ----------
  const rootQ = Q();
  const restDir = (a, b) => V3(J[b][0] - J[a][0], J[b][1] - J[a][1], J[b][2] - J[a][2]);
  const len = (a, b) => restDir(a, b).length();
  const chain = (a, b, c, ref) => ({ a, b, c, d1: restDir(a, b).normalize(), d2: restDir(b, c).normalize(), l1: len(a, b), l2: len(b, c), ref: V3(...ref) });
  const chains = { armL: chain('upperArmL', 'forearmL', 'handL', [0, 0, -1]), armR: chain('upperArmR', 'forearmR', 'handR', [0, 0, -1]), legL: chain('thighL', 'shinL', 'footL', [0, 0, 1]), legR: chain('thighR', 'shinR', 'footR', [0, 0, 1]) };
  function frame(dir, ref) { const X = dir.clone().normalize(), Z = ref.clone().sub(X.clone().multiplyScalar(ref.dot(X))); if (Z.lengthSq() < 1e-6) Z.set(0, 1, 0).sub(X.clone().multiplyScalar(X.y)); Z.normalize(); const Y = V3().crossVectors(Z, X); return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); }
  for (const c of Object.values(chains)) { c.rest1 = frame(c.d1, c.ref); c.rest2 = frame(c.d2, c.ref); }
  function setWorldQ(bone, wq) { const pq = bone.parent.getWorldQuaternion(Q()); bone.quaternion.copy(pq.invert().multiply(wq)); bone.updateMatrixWorld(true); }
  function solve(c, target, pole) {
    const A = B[c.a], Bm = B[c.b]; const pa = A.getWorldPosition(V3());
    const toT = target.clone().sub(pa); let d = toT.length(); const dmax = (c.l1 + c.l2) * .999; d = Math.min(Math.max(d, Math.abs(c.l1 - c.l2) + .01), dmax);
    const dir = toT.normalize(), cosA = (c.l1 * c.l1 + d * d - c.l2 * c.l2) / (2 * c.l1 * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    let pn = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))); if (pn.lengthSq() < 1e-8) pn = V3(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)); pn.normalize();
    const elbow = pa.clone().add(dir.clone().multiplyScalar(cosA * c.l1)).add(pn.clone().multiplyScalar(sinA * c.l1));
    const end = pa.clone().add(dir.clone().multiplyScalar(d));
    setWorldQ(A, frame(elbow.clone().sub(pa), pole).multiply(c.rest1.clone().invert()));
    setWorldQ(Bm, frame(end.clone().sub(elbow), pole).multiply(c.rest2.clone().invert()));
  }
  // body transform: spin (ry), flips (flip, about the body's own left-right axis), rolls, and lift,
  // all pivoting at the centre of mass so a flipping fighter turns around the waist, not the feet
  const C = V3(0, .9 * S, 0), bodyQ = Q(), tmpE = new THREE.Euler();
  let lift = 0;
  const bodyPt = (arr, out = V3()) => out.set(arr[0] * S, arr[1] * S, arr[2] * S).sub(C).applyQuaternion(bodyQ).add(C).add(V3(0, lift, 0)).applyMatrix4(fighter.matrixWorld);
  const bodyDir = (x, y, z) => V3(x, y, z).applyQuaternion(bodyQ).applyQuaternion(rootQ).normalize();
  const grip = B.handR.children.find(o => o.name === 'grip');
  const gripLocalQ = grip.quaternion.clone(), gripLocalP = grip.position.clone();
  const leftGripP = V3(-gripLocalP.x, gripLocalP.y, gripLocalP.z);
  const leftGripQ = Q().setFromUnitVectors(V3(0, 1, 0), V3(0, .25, 1).normalize());

  function apply(p) {
    fighter.updateMatrixWorld(true); fighter.getWorldQuaternion(rootQ);
    bodyQ.setFromEuler(tmpE.set(p.flip || 0, p.ry || 0, p.roll || 0, 'YXZ')); lift = (p.ly || 0) * S;
    const h = B.hips, hp = V3(J.hips[0] + p.hx * S, J.hips[1] + p.hy * S, J.hips[2] + p.hz * S).sub(C).applyQuaternion(bodyQ).add(C); hp.y += lift;
    h.position.copy(hp); h.quaternion.copy(bodyQ).multiply(Q().setFromEuler(tmpE.set(p.hr[0], p.hr[1], p.hr[2], 'YXZ')));
    B.spine.quaternion.setFromEuler(tmpE.set(...p.sp, 'YXZ')); B.chest.quaternion.setFromEuler(tmpE.set(...p.ch, 'YXZ'));
    B.neck.quaternion.setFromEuler(tmpE.set(p.hd[0] * .4, p.hd[1] * .4, p.hd[2] * .4, 'YXZ')); B.head.quaternion.setFromEuler(tmpE.set(p.hd[0] * .6, p.hd[1] * .6, p.hd[2] * .6, 'YXZ'));
    for (const n of ['clavL', 'clavR', 'handL', 'handR', 'footL', 'footR']) B[n].quaternion.identity();
    h.updateMatrixWorld(true);
    // legs: knees point along the hips' facing
    for (const [ch, f, sgn] of [['legL', p.fl, 1], ['legR', p.fr, -1]]) {
      const t = bodyPt(f), yaw = p.hr[1] * .6, pole = bodyDir(sgn * .15 * Math.cos(yaw) + Math.sin(yaw), 0, Math.cos(yaw) - sgn * .15 * Math.sin(yaw));
      solve(chains[ch], t, pole);
      const fq = rootQ.clone().multiply(bodyQ).multiply(Q().setFromEuler(tmpE.set(f[3], p.hr[1] * .5, 0, 'YXZ'))); setWorldQ(B[ch === 'legL' ? 'footL' : 'footR'], fq);
    }
    // arms: the sword leads, the hands follow it
    if (p.sw && U.drawn) {
      const sq = rootQ.clone().multiply(bodyQ).multiply(p.sw.q), hq = sq.clone().multiply(gripLocalQ.clone().invert());
      const g = bodyPt(p.sw.g), wristR = g.clone().sub(gripLocalP.clone().applyQuaternion(hq));
      const bladeDir = V3(0, 1, 0).applyQuaternion(sq);
      // the right elbow hangs below and outside the line of the blade
      solve(chains.armR, wristR, bodyDir(-.6, -.6, -.45)); setWorldQ(B.handR, hq);
      let wl;
      if (p.lb > 0) { // the left palm braces the back of the blade
        const spine = V3(-1, 0, 0).applyQuaternion(sq); wl = g.clone().addScaledVector(bladeDir, p.lb * S).addScaledVector(spine, .05 * S);
        solve(chains.armL, wl, bodyDir(.6, -.5, -.5)); setWorldQ(B.handL, sq.clone().multiply(Q().setFromAxisAngle(V3(0, 0, 1), Math.PI / 2)));
      } else {
        const gl = g.clone().sub(bladeDir.clone().multiplyScalar(.105 * S));
        const lq = sq.clone().multiply(leftGripQ.clone().invert()), wristLg = gl.clone().sub(leftGripP.clone().applyQuaternion(lq));
        wl = bodyPt(p.la).lerp(wristLg, p.lh || 0);
        solve(chains.armL, wl, bodyDir(.6, -.55, -.5));
        if ((p.lh || 0) > .5) setWorldQ(B.handL, lq);
      }
    } else {
      solve(chains.armR, bodyPt(p.ra), bodyDir(-.3, -.2, -1));
      let wl = bodyPt(p.la); if (p.ls > 0 && U.sayaPoint) { const k = U.sayaPoint('koiguchi', V3()); k.y -= .015 * S; wl.lerp(k, p.ls); } // the left hand rests on the scabbard's mouth
      solve(chains.armL, wl, bodyDir(.3, -.2, -1));
    }
  }

  // ---------- springs ----------
  const springs = [];
  const addSpring = (name, tip, k = 60, c = 9, g = 0) => { const b = B[name]; if (!b) return; springs.push({ b, tip: V3(...tip), k, c, g, p: null, v: V3() }); };
  if (female) { const t = ['tail0', 'tail1', 'tail2', 'tail3']; t.forEach((n, i) => { const nx = t[i + 1] ? J[t[i + 1]] : [J[n][0], J[n][1] - .16 * S, J[n][2]]; addSpring(n, [nx[0] - J[n][0], nx[1] - J[n][1], nx[2] - J[n][2]], 70 - i * 12, 8, -2); }); }
  addSpring('sleeveL', [0, -.1 * S, 0], 50, 7, -3); addSpring('sleeveR', [0, -.1 * S, 0], 50, 7, -3); addSpring('coatB', [0, -.3 * S, -.03], 80, 10, -2);
  function springsStep(dt) {
    for (const s of springs) {
      const b = s.b; b.quaternion.identity(); b.updateMatrixWorld(true);
      const o = b.getWorldPosition(V3()), pq = b.parent.getWorldQuaternion(Q()), target = s.tip.clone().applyQuaternion(pq).add(o), L = s.tip.length();
      if (!s.p || dt <= 0) { s.p = target.clone(); s.v.set(0, 0, 0); continue; }
      const a = target.clone().sub(s.p).multiplyScalar(s.k).sub(s.v.clone().multiplyScalar(s.c)); a.y += s.g;
      s.v.addScaledVector(a, dt); s.p.addScaledVector(s.v, dt);
      const d = s.p.clone().sub(o); if (d.lengthSq() < 1e-8) continue; d.setLength(L); s.p.copy(o).add(d);
      const local = d.clone().applyQuaternion(pq.clone().invert()).normalize(), rest = s.tip.clone().normalize();
      const rq = Q().setFromUnitVectors(rest, local); const ang = 2 * Math.acos(Math.min(1, Math.abs(rq.w))); if (ang > 1.2) rq.slerp(Q(), 1 - 1.2 / ang);
      b.quaternion.copy(rq); b.updateMatrixWorld(true);
    }
  }

  // ---------- playback ----------
  let cur = { name: 'idle', t: 0 }, prev = null, fade = 0, fadeDur = .1, phase = 0, lean = 0;
  let faceKey = '', blinkT = 2 + Math.random() * 2, blink = 0, flash = 0;
  const listeners = [];
  function poseOf(st) {
    const c = clips[st.name];
    if (c.cycle) return cycle(c.cycle, phase, lean);
    if (c.fn) return c.fn(c.loop ? st.t : Math.min(st.t, c.dur));
    if (c.keys) return sampleKeys(c.keys, Math.min(st.t, c.dur));
    const p = c.pose(); if (st.name === 'idle' || st.name === 'stance' || c.kind === 'guard') { const b = Math.sin(st.t * 2.1) * .006; return { ...p, hy: p.hy + b, ch: [p.ch[0] - b * 3, p.ch[1], p.ch[2]] }; } return p;
  }
  const api = {
    clips, combos, design: U.design, get name() { return cur.name; }, get time() { return cur.t; }, get clip() { return clips[cur.name]; },
    get done() { const c = clips[cur.name]; return !!(c.dur && !c.loop && !c.hold && cur.t >= c.dur); },
    get air() { const c = clips[cur.name]; return c.air ? c.air(Math.min(cur.t, c.dur || 9)) * S : 0; },
    play(name, f) { const c = clips[name]; if (!c) return; if (name === cur.name && c.loop) return; prev = { ...cur }; cur = { name, t: 0 }; f = f ?? c.fadeIn ?? .1; fade = f > 0 ? 1 : 0; fadeDur = f || .0001; if (c.drawn === true && !U.drawn) U.setDrawn(true); },
    restart(name, f) { const c = clips[name]; if (!c) return; prev = { ...cur }; cur = { name, t: 0 }; f = f ?? c.fadeIn ?? .1; fade = f > 0 ? 1 : 0; fadeDur = f || .0001; if (c.drawn === true && !U.drawn) U.setDrawn(true); },
    on(fn) { listeners.push(fn); },
    sheathe() { U.setDrawn(false); },
    setSpeed(v, kind) { const D = kind === 'walk' ? 1.25 : 2.1; this._v = v; this._D = D; },
    flash(v = 1) { flash = Math.max(flash, v); },
    // where the blade's edge is pointing and the plane it travels in (for guards and effects)
    cutPlane() { return clips[cur.name].plane || null; },
    update(dt) {
      const c = clips[cur.name], t0 = cur.t;
      cur.t += dt; if (prev) prev.t += dt;
      for (const e of c.events || []) if (e.t > t0 && e.t <= cur.t) { if (e.type === 'draw') U.setDrawn(true); for (const fn of listeners) fn(e, cur.name); }
      if (this._v) phase += dt * this._v / this._D * Math.PI * 2;
      lean += ((this._lean || 0) - lean) * Math.min(1, dt * 6);
      fade = Math.max(0, fade - dt / fadeDur);
      let p = poseOf(cur); if (prev && fade > 0) p = blend(p, poseOf(prev), ease(fade)); else prev = null;
      apply(p); springsStep(dt); U.updateGear?.(dt);
      blinkT -= dt; if (blinkT < 0) { blink = 1; blinkT = 2.5 + Math.random() * 3; } blink = Math.max(0, blink - dt * 8);
      const f = p.face || {}, b = Math.max(f.blink || 0, blink > .3 ? 1 : 0), key = (f.brow || 'calm') + (f.mouth || 'calm') + (b > .5 ? 1 : 0);
      if (key !== faceKey) { faceKey = key; U.face.draw({ blink: b > .5 ? 1 : 0, mouth: f.mouth || 'calm', brow: f.brow || 'calm' }); }
      flash = Math.max(0, flash - dt * 9); U.uniforms.flash.value = flash * .8;
    },
    seek(t) { cur.t = t; prev = null; const c = clips[cur.name]; if (c.events) for (const e of c.events) if (e.type === 'draw' && e.t <= t) U.setDrawn(true); apply(poseOf(cur)); springsStep(0); U.updateGear?.(0); },
  };
  apply(poseOf(cur)); springsStep(0);
  return api;
}
