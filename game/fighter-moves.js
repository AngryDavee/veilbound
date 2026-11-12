// Fighter motion: keyframed body poses, procedural walk/run cycles, two-bone IK for arms and legs,
// sword-led attacks (the blade's grip, direction and edge are keyed; the arms follow), spring bones
// for ponytail, sleeves and coat tail, blinking and expressions.
//
// Pose space is the fighter's own root: metres, feet at y=0, facing +Z, +X = the fighter's left.
export function animate(THREE, fighter) {
  const U = fighter.userData, B = U.bones, J = U.restPositions, S = U.colors.s, female = U.colors.female;
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion();
  const two = U.design === 'haru'; // Haru fights two-handed; Mitsuki one-handed with a free off hand
  const style = two ? { speed: 1, reach: 1 } : { speed: 1.12, reach: 1.05 };

  // ---------- pose helpers ----------
  const swordQ = (b, e) => { const Y = V3(...b).normalize(), X = V3(...e); X.sub(Y.clone().multiplyScalar(X.dot(Y))).normalize(); const Z = V3().crossVectors(X, Y); return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); };
  const sw = (g, b, e) => ({ g, q: swordQ(b, e) });
  const base = () => ({ hy: 0, hx: 0, hz: 0, ry: 0, hr: [0, 0, 0], sp: [0, 0, 0], ch: [0, 0, 0], hd: [0, 0, 0], fl: [.11 * S, .085 * S, 0, 0], fr: [-.11 * S, .085 * S, 0, 0], sw: null, lh: 0, la: [.21 * S, .9 * S, .04], ra: [-.21 * S, .9 * S, .04], face: null });
  const P = o => Object.assign(base(), o);
  const lerpA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function blend(a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    const o = {};
    for (const k of ['hy', 'hx', 'hz', 'ry', 'lh']) o[k] = a[k] + (b[k] - a[k]) * t;
    for (const k of ['hr', 'sp', 'ch', 'hd', 'fl', 'fr', 'la', 'ra']) o[k] = lerpA(a[k], b[k], t);
    if (a.sw && b.sw) o.sw = { g: lerpA(a.sw.g, b.sw.g, t), q: a.sw.q.clone().slerp(b.sw.q, t) }; else o.sw = t < .5 ? a.sw : b.sw;
    o.face = t < .5 ? a.face : b.face;
    return o;
  }
  const ease = t => t * t * (3 - 2 * t);

  // ---------- poses ----------
  const stanceSword = two ? sw([-.03, 1.08, .3], [0, .62, .78], [0, -.78, .62]) : sw([-.12, 1.1, .28], [.25, .55, .8], [.3, -.8, .5]);
  const stance = P({ hy: -.07, hr: [0, .32, 0], sp: [.06, -.12, 0], ch: [.06, -.12, 0], hd: [0, -.08, 0], fr: [-.12, .085, .2, 0], fl: [.16, .085, -.2, .2], sw: stanceSword, lh: two ? 1 : 0, la: [.26, 1.02, .12], face: { brow: 'fierce', mouth: 'calm' } });
  const idle = P({ hy: -.005, la: [.16, .985, .14], ra: [-.205, .89, .03], hd: [.04, 0, 0], face: { brow: 'calm', mouth: 'calm' } });
  const guard = P({ ...stance, hy: -.1, sp: [.12, -.05, 0], ch: [.05, -.05, 0], hd: [.08, 0, 0], sw: two ? sw([-.02, 1.3, .3], [.97, .2, .1], [.05, .2, .98]) : sw([-.1, 1.32, .3], [.95, .25, .2], [-.1, .3, .95]), lh: two ? 1 : .0, la: [.2, 1.25, .3], face: { brow: 'fierce', mouth: 'grit' } });
  const S1 = two ? [ // Haru: diagonal cut from the right shoulder to the left hip
    [0, stance],
    [.13, P({ ...stance, hy: -.05, hr: [0, .62, 0], sp: [0, -.2, 0], ch: [-.06, -.35, 0], fr: [-.12, .085, .24, 0], sw: sw([-.18, 1.5, .06], [-.15, .55, -.82], [.35, .75, .45]), face: { brow: 'fierce', mouth: 'grit' } })],
    [.22, P({ ...stance, hy: -.11, hr: [0, .05, 0], sp: [.12, .1, 0], ch: [.15, .25, 0], fr: [-.12, .085, .32, 0], fl: [.15, .085, -.24, .4], sw: sw([0, 1.22, .44], [.45, .12, .88], [.7, -.7, -.1]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.31, P({ ...stance, hy: -.14, hr: [0, -.25, 0], sp: [.2, .2, 0], ch: [.22, .3, 0], fr: [-.12, .085, .34, 0], fl: [.15, .085, -.26, .45], sw: sw([.2, .96, .32], [.75, -.45, .48], [.4, -.85, -.2]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.58, stance],
  ] : [ // Mitsuki: a one-handed rising crescent from the left
    [0, stance],
    [.12, P({ ...stance, hy: -.1, hr: [0, -.3, 0], ch: [0, .35, 0], sw: sw([.18, .95, .2], [.55, -.7, -.45], [-.2, .45, -.85]), la: [.3, 1.2, -.05], face: { brow: 'fierce', mouth: 'grit' } })],
    [.21, P({ ...stance, hy: -.08, hr: [0, .2, 0], ch: [.1, -.15, 0], fr: [-.12, .085, .32, 0], sw: sw([-.05, 1.3, .48], [-.1, .45, .89], [-.1, .88, -.45]), la: [.32, 1.15, -.1], face: { brow: 'fierce', mouth: 'shout' } })],
    [.3, P({ ...stance, hy: -.06, hr: [0, .55, 0], ch: [.05, -.4, 0], fr: [-.12, .085, .34, 0], sw: sw([-.3, 1.55, .25], [-.75, .62, -.2], [-.25, -.05, -.97]), la: [.34, 1.1, -.12], face: { brow: 'fierce', mouth: 'shout' } })],
    [.55, stance],
  ];
  const S2 = [ // horizontal reverse cut, left to right
    [0, stance],
    [.12, P({ ...stance, hy: -.08, hr: [0, -.5, 0], ch: [0, .3, 0], sw: sw([.22, 1.12, .05], [.75, .05, -.65], [-.65, 0, -.75]), face: { brow: 'fierce', mouth: 'grit' } })],
    [.21, P({ ...stance, hy: -.12, hr: [0, .15, 0], sp: [.1, 0, 0], ch: [.08, -.3, 0], fr: [-.13, .085, .3, 0], sw: sw([-.04, 1.13, .46], [-.2, .04, .98], [-.98, 0, -.2]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.3, P({ ...stance, hy: -.12, hr: [0, .6, 0], sp: [.1, 0, 0], ch: [.1, -.45, 0], fr: [-.13, .085, .3, 0], sw: sw([-.32, 1.1, .24], [-.9, 0, .3], [-.3, 0, -.95]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.55, stance],
  ];
  const S3 = [ // rising cut from low right to high left
    [0, stance],
    [.12, P({ ...stance, hy: -.17, hr: [0, .35, 0], sp: [.2, -.1, 0], ch: [.15, -.15, 0], sw: sw([-.22, .82, .22], [-.35, -.85, .3], [0, .4, .92]), face: { brow: 'fierce', mouth: 'grit' } })],
    [.21, P({ ...stance, hy: -.06, hr: [0, .05, 0], sp: [.0, .1, 0], ch: [-.05, .15, 0], fr: [-.12, .085, .3, 0], sw: sw([0, 1.25, .44], [.1, .6, .8], [0, .8, -.6]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.3, P({ ...stance, hy: -.02, hr: [0, -.2, 0], sp: [-.1, .2, 0], ch: [-.12, .3, 0], fr: [-.12, .085, .3, 0], sw: sw([.14, 1.58, .22], [.2, .95, -.1], [-.1, .1, -.99]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.56, stance],
  ];
  const spinSword = two ? sw([-.2, 1.15, .25], [-.95, .1, .2], [-.2, 0, -.98]) : sw([-.25, 1.2, .2], [-.95, .15, .1], [-.1, 0, -.99]);
  const FIN = [ // spinning leap into an overhead slam: the Veil art
    [0, stance],
    [.16, P({ ...stance, hy: -.2, sp: [.3, 0, 0], ch: [.1, -.2, 0], fr: [-.14, .085, .1, 0], fl: [.16, .085, -.25, .5], sw: sw([-.25, 1.0, -.08], [-.6, .2, -.75], [.1, .97, 0]), face: { brow: 'fierce', mouth: 'grit' } })],
    [.32, P({ ...stance, ry: -Math.PI, hy: .25, sp: [.05, 0, 0], fr: [-.12, .45, .1, -.4], fl: [.12, .35, -.1, -.3], sw: spinSword, face: { brow: 'fierce', mouth: 'shout' } })],
    [.46, P({ ...stance, ry: -Math.PI * 2, hy: .42, sp: [-.25, 0, 0], ch: [-.15, 0, 0], hd: [-.15, 0, 0], fr: [-.12, .55, .18, -.5], fl: [.12, .42, -.06, -.4], sw: sw([0, 1.9, -.02], [0, .35, -.94], [0, .94, .35]), lh: two ? 1 : 0, la: [.3, 1.6, .1], face: { brow: 'fierce', mouth: 'shout' } })],
    [.6, P({ ...stance, ry: -Math.PI * 2, hy: -.24, sp: [.4, 0, 0], ch: [.2, 0, 0], hd: [-.1, 0, 0], fr: [-.13, .085, .34, 0], fl: [.15, .085, -.32, .6], sw: sw([0, .82, .52], [0, -.5, .86], [0, -.86, -.5]), face: { brow: 'fierce', mouth: 'shout' } })],
    [.78, P({ ...stance, ry: -Math.PI * 2, hy: -.24, sp: [.4, 0, 0], ch: [.2, 0, 0], fr: [-.13, .085, .34, 0], fl: [.15, .085, -.32, .6], sw: sw([0, .8, .52], [0, -.52, .85], [0, -.85, -.52]), face: { brow: 'fierce', mouth: 'calm' } })],
    [1.0, P({ ...stance, ry: -Math.PI * 2 })],
  ];
  const HIT = [[0, stance], [.08, P({ ...stance, hy: -.06, sp: [-.32, .1, .1], ch: [-.2, .2, 0], hd: [-.35, .2, 0], sw: sw([-.28, 1.0, .18], [-.45, -.55, .7], [-.6, .6, .3]), lh: 0, la: [.32, 1.0, -.05], face: { brow: 'fierce', mouth: 'grit', blink: .6 } })], [.45, stance]];
  const DOWN = [[0, stance],
    [.12, P({ ...stance, hy: -.15, sp: [-.4, 0, .15], ch: [-.3, 0, 0], hd: [-.4, 0, 0], sw: sw([-.3, 1.0, .1], [-.6, -.3, .7], [0, 1, 0]), lh: 0, la: [.35, 1.05, -.1], face: { mouth: 'shout', brow: 'fierce', blink: .8 } })],
    [.42, P({ hy: -.72, hr: [-1.35, 0, 0], sp: [-.1, 0, 0], hd: [.5, 0, 0], fr: [-.16, .09, .52, -.6], fl: [.14, .12, .42, -.4], sw: sw([-.38, .16, -.05], [-.95, .05, .2], [0, 1, 0]), la: [.4, .2, -.25], face: { blink: 1, mouth: 'grit' } })],
    [1.0, P({ hy: -.72, hr: [-1.35, 0, 0], sp: [-.1, 0, 0], hd: [.5, 0, 0], fr: [-.16, .09, .52, -.6], fl: [.14, .12, .42, -.4], sw: sw([-.38, .16, -.05], [-.95, .05, .2], [0, 1, 0]), la: [.4, .2, -.25], face: { blink: 1, mouth: 'grit' } })],
    [1.35, P({ ...stance, hy: -.42, hr: [.2, .2, 0], sp: [.45, 0, 0], fr: [-.13, .085, .25, 0], fl: [.15, .3, -.25, .9], face: { brow: 'fierce', mouth: 'grit' } })],
    [1.7, stance]];
  const DODGE = [[0, stance], [.08, P({ ...stance, hy: -.2, sp: [.35, 0, 0], ch: [.1, 0, 0], fr: [-.2, .1, .15, 0], fl: [.2, .18, -.3, .6], face: { brow: 'fierce', mouth: 'grit' } })], [.3, P({ ...stance, hy: -.16, sp: [.3, 0, 0], fr: [-.18, .085, .2, 0], fl: [.18, .085, -.28, .4] })], [.45, stance]];
  const WIN = [[0, stance], [.35, P({ hy: -.01, hd: [.1, 0, 0], sw: sw([-.24, .98, .12], [-.15, -.97, .18], [0, .2, .98]), la: [.08, 1.18, .2], face: { brow: 'calm', mouth: 'smile' } })], [2, P({ hy: -.01, hd: [.1, 0, 0], sw: sw([-.24, .98, .12], [-.15, -.97, .18], [0, .2, .98]), la: [.08, 1.18, .2], face: { brow: 'calm', mouth: 'smile' } })]];
  const BOW = [[0, idle], [.5, P({ ...idle, sp: [.35, 0, 0], ch: [.15, 0, 0], hd: [.2, 0, 0], face: { blink: 1, mouth: 'calm' } })], [1.2, P({ ...idle, sp: [.35, 0, 0], ch: [.15, 0, 0], hd: [.2, 0, 0], face: { blink: 1, mouth: 'calm' } })], [1.6, idle]];

  // clip table. hit: [start, end, damage, reach, arc]. move: forward root speed over [t0, t1]. chain: when a queued attack may begin.
  const clips = {
    idle: { loop: true, pose: () => idle },
    stance: { loop: true, pose: () => stance, drawn: true },
    walk: { loop: true, cycle: 'walk' }, run: { loop: true, cycle: 'run' }, battleRun: { loop: true, cycle: 'battle', drawn: true },
    guard: { loop: true, pose: () => guard, drawn: true },
    slash1: { keys: S1, drawn: true, hit: [.17, .3, 8, 2.15, 1.6], move: [.1, .3, 2.2], chain: .26 },
    slash2: { keys: S2, drawn: true, hit: [.16, .3, 8, 2.2, 2.2], move: [.1, .28, 2], chain: .26 },
    slash3: { keys: S3, drawn: true, hit: [.16, .3, 10, 2.15, 1.6], move: [.1, .28, 1.8], chain: .3 },
    finisher: { keys: FIN, drawn: true, hit: [.56, .66, 22, 2.6, 3.2], spinHit: [.24, .44, 6, 2.2, 6.3], move: [.15, .6, 3.2], chain: 99, art: true },
    hit: { keys: HIT, drawn: true }, down: { keys: DOWN, drawn: true, move: [0, .42, -2.6] }, dodge: { keys: DODGE, drawn: true },
    win: { keys: WIN, drawn: true, hold: true }, bow: { keys: BOW },
  };
  for (const c of Object.values(clips)) if (c.keys) { c.dur = c.keys[c.keys.length - 1][0] / style.speed; c.keys = c.keys.map(([t, p]) => [t / style.speed, p]); for (const f of ['hit', 'spinHit', 'move']) if (c[f]) c[f] = [c[f][0] / style.speed, c[f][1] / style.speed, ...c[f].slice(2)]; if (c.chain) c.chain /= style.speed; }
  function sampleKeys(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return blend(a, b, ease((t - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // ---------- locomotion cycles ----------
  function cycle(kind, phase, lean) {
    const run = kind !== 'walk', battle = kind === 'battle', s = Math.sin(phase), c = Math.cos(phase), A = run ? .3 : .2, lift = run ? .16 : .07;
    const foot = (sgn, ph) => { const z = A * Math.sin(ph), up = Math.max(0, Math.cos(ph)); return [sgn * .11 * S, .085 * S + lift * Math.pow(up, 1.6), z, -.5 * up * (run ? 1 : .5) + .3 * Math.max(0, -Math.cos(ph)) * (run ? 1 : .3)]; };
    const p = P({
      hy: -(run ? .07 : .02) - (run ? .05 : .02) * Math.abs(c), hr: [0, (run ? .18 : .12) * s, 0], sp: [(run ? .22 : .04) + lean, -(run ? .1 : .06) * s, 0], ch: [run ? .05 : 0, -(run ? .14 : .08) * s, 0], hd: [run ? -.12 : 0, .1 * s, 0],
      fl: foot(1, phase), fr: foot(-1, phase + Math.PI),
      la: [.22 * S, (run ? 1.02 : .9) * S, (run ? .05 : .02) - (run ? .26 : .14) * s], ra: [-.22 * S, (run ? 1.02 : .9) * S, (run ? .05 : .02) + (run ? .26 : .14) * s],
      face: { brow: battle ? 'fierce' : 'calm', mouth: 'calm' },
    });
    if (battle) { p.sw = two ? sw([-.24, 1.0, -.06], [-.35, -.28, -.9], [0, -1, .3]) : sw([-.26, 1.02, -.04], [-.4, -.2, -.9], [0, -1, .2]); p.lh = 0; p.la = [.24, 1.04, .05 - .3 * s]; }
    if (!run) p.la = [.16, .985, .14]; // walking: the left hand rests on the scabbard
    return p;
  }

  // ---------- rig: FK + two-bone IK ----------
  const tmpM = new THREE.Matrix4(), q1 = Q(), q2 = Q(), v1 = V3(), v2 = V3(), v3 = V3();
  const rootQ = Q(), rootM = new THREE.Matrix4();
  const restDir = (a, b) => V3(J[b][0] - J[a][0], J[b][1] - J[a][1], J[b][2] - J[a][2]);
  const len = (a, b) => restDir(a, b).length();
  const chains = {
    armL: { a: 'upperArmL', b: 'forearmL', c: 'handL', d1: restDir('upperArmL', 'forearmL').normalize(), d2: restDir('forearmL', 'handL').normalize(), l1: len('upperArmL', 'forearmL'), l2: len('forearmL', 'handL'), ref: V3(0, 0, -1) },
    armR: { a: 'upperArmR', b: 'forearmR', c: 'handR', d1: restDir('upperArmR', 'forearmR').normalize(), d2: restDir('forearmR', 'handR').normalize(), l1: len('upperArmR', 'forearmR'), l2: len('forearmR', 'handR'), ref: V3(0, 0, -1) },
    legL: { a: 'thighL', b: 'shinL', c: 'footL', d1: restDir('thighL', 'shinL').normalize(), d2: restDir('shinL', 'footL').normalize(), l1: len('thighL', 'shinL'), l2: len('shinL', 'footL'), ref: V3(0, 0, 1) },
    legR: { a: 'thighR', b: 'shinR', c: 'footR', d1: restDir('thighR', 'shinR').normalize(), d2: restDir('shinR', 'footR').normalize(), l1: len('thighR', 'shinR'), l2: len('shinR', 'footR'), ref: V3(0, 0, 1) },
  };
  // a frame from a direction and a reference that is orthogonalized against it
  function frame(dir, ref) { const X = dir.clone().normalize(), Z = ref.clone().sub(X.clone().multiplyScalar(ref.dot(X))); if (Z.lengthSq() < 1e-6) Z.set(0, 1, 0).sub(X.clone().multiplyScalar(X.y)); Z.normalize(); const Y = V3().crossVectors(Z, X); return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); }
  for (const c of Object.values(chains)) { c.rest1 = frame(c.d1, c.ref); c.rest2 = frame(c.d2, c.ref); }
  const worldQ = (bone, out) => bone.getWorldQuaternion(out);
  function setWorldQ(bone, wq) { const pq = worldQ(bone.parent, Q()); bone.quaternion.copy(pq.invert().multiply(wq)); bone.updateMatrixWorld(true); }
  // solve so the end bone's origin reaches target (world); pole (world) is where the middle joint points
  function solve(c, target, pole) {
    const A = B[c.a], Bm = B[c.b]; const pa = A.getWorldPosition(V3());
    const toT = target.clone().sub(pa); let d = toT.length(); const dmax = (c.l1 + c.l2) * .999; d = Math.min(Math.max(d, Math.abs(c.l1 - c.l2) + .01), dmax);
    const dir = toT.normalize(), cosA = (c.l1 * c.l1 + d * d - c.l2 * c.l2) / (2 * c.l1 * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const pn = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const elbow = pa.clone().add(dir.clone().multiplyScalar(cosA * c.l1)).add(pn.clone().multiplyScalar(sinA * c.l1));
    const end = pa.clone().add(dir.clone().multiplyScalar(d));
    const u1 = elbow.clone().sub(pa), u2 = end.clone().sub(elbow);
    // the bend plane normal keeps upper and lower segments twisting together
    const ref1 = pole.clone(), ref2 = pole.clone();
    setWorldQ(A, frame(u1, ref1).multiply(c.rest1.clone().invert()));
    setWorldQ(Bm, frame(u2, ref2).multiply(c.rest2.clone().invert()));
  }
  const toWorld = (p, out = V3()) => out.set(p[0] * S, p[1] * S, p[2] * S).applyMatrix4(fighter.matrixWorld);
  const dirWorld = (x, y, z) => V3(x, y, z).applyQuaternion(rootQ).normalize();
  const grip = B.handR.children.find(o => o.name === 'grip');
  const gripLocalQ = grip.quaternion.clone(), gripLocalP = grip.position.clone();
  // the left fist wraps the handle 10 cm below the right one, mirrored
  const leftGripP = V3(-gripLocalP.x, gripLocalP.y, gripLocalP.z);
  const leftGripQ = Q().setFromUnitVectors(V3(0, 1, 0), V3(0, .25, 1).normalize());

  function apply(p) {
    fighter.updateMatrixWorld(true); fighter.getWorldQuaternion(rootQ);
    const h = B.hips; h.position.set(J.hips[0] + p.hx, J.hips[1] + p.hy * S, J.hips[2] + p.hz);
    h.quaternion.setFromEuler(new THREE.Euler(p.hr[0], p.hr[1] + p.ry, p.hr[2], 'YXZ'));
    B.spine.quaternion.setFromEuler(new THREE.Euler(...p.sp, 'YXZ')); B.chest.quaternion.setFromEuler(new THREE.Euler(...p.ch, 'YXZ'));
    B.neck.quaternion.setFromEuler(new THREE.Euler(p.hd[0] * .4, p.hd[1] * .4, p.hd[2] * .4, 'YXZ')); B.head.quaternion.setFromEuler(new THREE.Euler(p.hd[0] * .6, p.hd[1] * .6, p.hd[2] * .6, 'YXZ'));
    for (const n of ['clavL', 'clavR', 'handL', 'handR', 'footL', 'footR']) B[n].quaternion.identity();
    h.updateMatrixWorld(true);
    const yawQ = Q().setFromAxisAngle(V3(0, 1, 0), p.ry);
    const spinRoot = (arr) => { const v = V3(arr[0], arr[1], arr[2]).applyQuaternion(yawQ); return [v.x, v.y, v.z]; };
    // legs
    for (const [ch, f, sgn] of [['legL', p.fl, 1], ['legR', p.fr, -1]]) {
      const t = toWorld(spinRoot(f)); const pole = dirWorld(...V3(sgn * .15, 0, 1).applyQuaternion(Q().setFromEuler(new THREE.Euler(0, p.hr[1] * .6 + p.ry, 0))).toArray());
      solve(chains[ch], t, pole);
      const fq = rootQ.clone().multiply(Q().setFromEuler(new THREE.Euler(f[3], p.hr[1] * .5 + p.ry, 0, 'YXZ'))); setWorldQ(B[ch === 'legL' ? 'footL' : 'footR'], fq);
    }
    // arms
    if (p.sw && U.drawn) {
      const sq = rootQ.clone().multiply(yawQ).multiply(p.sw.q), hq = sq.clone().multiply(gripLocalQ.clone().invert());
      const g = toWorld(spinRoot(p.sw.g)), wristR = g.clone().sub(gripLocalP.clone().applyQuaternion(hq));
      solve(chains.armR, wristR, dirWorld(...V3(-.6, -.55, -.5).applyQuaternion(yawQ).toArray())); setWorldQ(B.handR, hq);
      const bladeDir = V3(0, 1, 0).applyQuaternion(sq), gl = g.clone().sub(bladeDir.clone().multiplyScalar(.105 * S));
      const lq = sq.clone().multiply(leftGripQ.clone().invert()), wristLg = gl.clone().sub(leftGripP.clone().applyQuaternion(lq));
      const wristLf = toWorld(spinRoot(p.la));
      const wl = wristLf.clone().lerp(wristLg, p.lh);
      solve(chains.armL, wl, dirWorld(...V3(.6, -.55, -.5).applyQuaternion(yawQ).toArray()));
      if (p.lh > .5) setWorldQ(B.handL, lq);
    } else {
      solve(chains.armR, toWorld(spinRoot(p.ra)), dirWorld(-.3, -.2, -1)); solve(chains.armL, toWorld(spinRoot(p.la)), dirWorld(.3, -.2, -1));
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
  let face = {}, faceKey = '', blinkT = 2 + Math.random() * 2, blink = 0, flash = 0;
  function poseOf(st) {
    const c = clips[st.name];
    if (c.cycle) return cycle(c.cycle, phase, lean);
    if (c.keys) return sampleKeys(c.keys, Math.min(st.t, c.dur));
    const p = c.pose(); if (st.name === 'idle' || st.name === 'stance') { const b = Math.sin(st.t * 2.1) * .006; return { ...p, hy: p.hy + b, ch: [p.ch[0] - b * 3, p.ch[1], p.ch[2]] }; } return p;
  }
  const api = {
    clips, get name() { return cur.name; }, get time() { return cur.t; }, get clip() { return clips[cur.name]; },
    get done() { const c = clips[cur.name]; return !!(c.keys && !c.hold && cur.t >= c.dur); },
    play(name, f = .1) { if (!clips[name]) return; if (name === cur.name && clips[name].loop) return; prev = { ...cur }; cur = { name, t: 0 }; fade = f > 0 ? 1 : 0; fadeDur = f || .0001; if (clips[name].drawn && !U.drawn) U.setDrawn(true); },
    sheathe() { U.setDrawn(false); },
    // speed in m/s drives the cycle phase so feet don't slide
    setSpeed(v, kind) { const D = kind === 'walk' ? 1.25 : 2.1; this._v = v; this._D = D; },
    flash(v = 1) { flash = Math.max(flash, v); },
    update(dt) {
      cur.t += dt; if (prev) prev.t += dt;
      if (this._v) phase += dt * this._v / this._D * Math.PI * 2;
      lean += ((this._lean || 0) - lean) * Math.min(1, dt * 6);
      fade = Math.max(0, fade - dt / fadeDur);
      let p = poseOf(cur); if (prev && fade > 0) p = blend(p, poseOf(prev), ease(fade)); else prev = null;
      apply(p); springsStep(dt);
      // face: expression from pose, plus blinking
      blinkT -= dt; if (blinkT < 0) { blink = 1; blinkT = 2.5 + Math.random() * 3; } blink = Math.max(0, blink - dt * 8);
      const f = p.face || {}, b = Math.max(f.blink || 0, blink > .3 ? 1 : 0), key = (f.brow || 'calm') + (f.mouth || 'calm') + (b > .5 ? 1 : 0);
      if (key !== faceKey) { faceKey = key; U.face.draw({ blink: b > .5 ? 1 : 0, mouth: f.mouth || 'calm', brow: f.brow || 'calm' }); }
      flash = Math.max(0, flash - dt * 6); U.uniforms.flash.value = flash * .85;
    },
    seek(t) { cur.t = t; prev = null; apply(poseOf(cur)); springsStep(0); },
  };
  apply(poseOf(cur)); springsStep(0);
  return api;
}
