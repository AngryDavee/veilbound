// Veilbound fighters. 404 recipe Path B: import-free, a function of THREE that returns a Group,
// front +Z, feet at y=0. Keep the hierarchy (it moves): bones live in userData.bones.
//
// The body is never assembled from separate parts. Each character is sculpted as one signed
// distance field: rounded cones and ellipsoids smooth-blended together like clay, with cloth
// pleats, hems and openings carved into the same field. That field is polygonized into one
// continuous skin, and every vertex is weighted to the skeleton by how strongly each sculpted
// form contributes to it. Elbows, knees, the waist and shoulders bend as one surface.
export default function(THREE, which = 'haru') {
const V = THREE.MathUtils;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const smax = (a, b, k) => -smin(-a, -b, k);

// ---------- distance primitives ----------
const bound = (f, b) => (f.b = b, f);
function cone(a, b, r1, r2) { return bound(cone0(a, b, r1, r2), [Math.min(a[0] - r1, b[0] - r2), Math.min(a[1] - r1, b[1] - r2), Math.min(a[2] - r1, b[2] - r2), Math.max(a[0] + r1, b[0] + r2), Math.max(a[1] + r1, b[1] + r2), Math.max(a[2] + r1, b[2] + r2)]); }
function cone0(a, b, r1, r2) { // iq round cone
  const [ax, ay, az] = a, bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az, l2 = bax * bax + bay * bay + baz * baz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az, yy = px * bax + py * bay + pz * baz, zz = yy - l2;
    const qx = px * l2 - bax * yy, qy = py * l2 - bay * yy, qz = pz * l2 - baz * yy, x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
}
function ell(c, r, rot) { const R = Math.max(...r); return bound(ell0(c, r, rot), [c[0] - R, c[1] - R, c[2] - R, c[0] + R, c[1] + R, c[2] + R]); }
function ell0(c, r, rot) { // iq ellipsoid, optional XYZ euler rotation (radians)
  let m = null; if (rot) { m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)).invert().elements; }
  return (x, y, z) => {
    let px = x - c[0], py = y - c[1], pz = z - c[2];
    if (m) { const tx = m[0] * px + m[4] * py + m[8] * pz, ty = m[1] * px + m[5] * py + m[9] * pz, tz = m[2] * px + m[6] * py + m[10] * pz; px = tx; py = ty; pz = tz; }
    const k0 = Math.hypot(px / r[0], py / r[1], pz / r[2]), k1 = Math.hypot(px / (r[0] * r[0]), py / (r[1] * r[1]), pz / (r[2] * r[2]));
    return k1 < 1e-9 ? -Math.min(...r) : k0 * (k0 - 1) / k1;
  };
}
function rbox(c, h, r = .01, rot) { const R = rot ? Math.hypot(...h) : 0, e = rot ? [R, R, R] : h; return bound(rbox0(c, h, r, rot), [c[0] - e[0], c[1] - e[1], c[2] - e[2], c[0] + e[0], c[1] + e[1], c[2] + e[2]]); }
function rbox0(c, h, r = .01, rot) {
  let m = null; if (rot) { m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)).invert().elements; }
  return (x, y, z) => {
    let px = x - c[0], py = y - c[1], pz = z - c[2];
    if (m) { const tx = m[0] * px + m[4] * py + m[8] * pz, ty = m[1] * px + m[5] * py + m[9] * pz, tz = m[2] * px + m[6] * py + m[10] * pz; px = tx; py = ty; pz = tz; }
    const qx = Math.abs(px) - h[0] + r, qy = Math.abs(py) - h[1] + r, qz = Math.abs(pz) - h[2] + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
}
const mirror = f => { const g = (x, y, z) => f(Math.abs(x), y, z); if (f.b) { const X = Math.max(Math.abs(f.b[0]), Math.abs(f.b[3])); g.b = [-X, f.b[1], f.b[2], X, f.b[4], f.b[5]]; } return g; };
const boxDist = (b, x, y, z) => { const dx = Math.max(b[0] - x, 0, x - b[3]), dy = Math.max(b[1] - y, 0, y - b[4]), dz = Math.max(b[2] - z, 0, z - b[5]); return Math.sqrt(dx * dx + dy * dy + dz * dz); };

// ---------- designs ----------
const DESIGNS = {
  haru: {
    name: 'Haru', title: 'Apprentice Warden', s: 1, female: false,
    skin: 0xf3d4c0, blush: 'rgba(240,120,120,.22)', hair: [0x161a28, 0x1f6f78], eye: ['#0d3f4a', '#2fb7b0', '#d8f0c8'], lash: '#1a1418',
    uniform: 0x1d2440, hakama: 0x2b3352, belt: 0xe9e3d3, wrap: 0xece6da, sandal: 0x3a2e28, cord: 0xb9a26a,
    haori: 0x8cc4c8, haoriHem: 0x23606e, haoriEdge: 0xf2efe6, outline: 0x141823,
    trail: [0x6fe7ff, 0xe8fbff], blade: 0xcfdbe6, bladeEdge: 0x9fd8ff, tsuba: 0xb08a42, grip: 0x1e2a4a, saya: 0x14182a,
  },
  mitsuki: {
    name: 'Mitsuki', title: 'Bell Warden', s: 1.025, female: true,
    skin: 0xf6ddcf, blush: 'rgba(240,110,130,.25)', hair: [0xe6e8f0, 0xb3a3dc], eye: ['#5a1024', '#e0563a', '#ffe0a8'], lash: '#2a1620',
    uniform: 0x221f28, hakama: 0x3a2340, belt: 0xc9993a, wrap: 0xece6da, sandal: 0x2a2024, cord: 0xd0b060,
    haori: 0xa8243a, haoriHem: 0x1a1218, haoriEdge: 0xe0b04a, outline: 0x1d1016,
    trail: [0xff5a3c, 0xffe6b0], blade: 0xd8cfd2, bladeEdge: 0xff8a7a, tsuba: 0x1a1416, grip: 0x8a1e2c, saya: 0x5a1020,
  },
};
const D = DESIGNS[which] || DESIGNS.haru, S = D.s, F = D.female ? 1 : 0;
const P = (x, y, z) => [x * S, y * S, z * S];

// ---------- skeleton (rest A-pose, identity rotations, metres) ----------
const sh = F ? .158 : .172, hipW = F ? .09 : .086;
const J = {
  hips: P(0, .96, 0), spine: P(0, 1.07, 0), chest: P(0, 1.22, 0), neck: P(0, 1.405, 0), head: P(0, 1.475, .005),
  clavL: P(.03, 1.385, 0), upperArmL: P(sh, 1.36, -.005), forearmL: P(sh + .148, 1.152, -.005), handL: P(sh + .27, .985, .01),
  thighL: P(hipW, .9, 0), shinL: P(hipW + .015, .5, .012), footL: P(hipW + .02, .085, -.01),
};
for (const k of Object.keys(J)) if (k.endsWith('L')) { const p = J[k]; J[k.slice(0, -1) + 'R'] = [-p[0], p[1], p[2]]; }
const parents = { hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', clavL: 'chest', upperArmL: 'clavL', forearmL: 'upperArmL', handL: 'forearmL', clavR: 'chest', upperArmR: 'clavR', forearmR: 'upperArmR', handR: 'forearmR', thighL: 'hips', shinL: 'thighL', footL: 'shinL', thighR: 'hips', shinR: 'thighR', footR: 'shinR' };
const tail = D.female ? ['tail0', 'tail1', 'tail2', 'tail3'] : [];
const tailPts = [P(0, 1.665, -.09), P(0, 1.56, -.17), P(0, 1.42, -.19), P(0, 1.27, -.19)];
tail.forEach((n, i) => { J[n] = tailPts[i]; parents[n] = i ? tail[i - 1] : 'head'; });
// hanging kimono-sleeve bags and the coat's back panel get their own spring bones
J.sleeveL = P(sh + .19, 1.07, -.01); parents.sleeveL = 'forearmL'; J.sleeveR = [-J.sleeveL[0], J.sleeveL[1], J.sleeveL[2]]; parents.sleeveR = 'forearmR';
J.coatB = P(0, .98, -.12); parents.coatB = 'hips';
const boneNames = Object.keys(parents), boneIndex = Object.fromEntries(boneNames.map((n, i) => [n, i]));
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------- sculpt ----------
// Each layer is one field. Parts are applied in order: add = smooth union, sub = smooth carve.
// A part's colour is a hex or {base, bands:[[field, hex]...]} where a band applies where field < 0.
// Colour borders are later cut exactly into the mesh, so they stay crisp at any resolution.
const parts = { body: [], head: [], hands: [] };
const add = (g, f, o) => parts[g].push({ f, op: 'add', k: .02, bias: 0, ...o });
const sub = (g, f, k = .01, o = {}) => parts[g].push({ f, op: 'sub', k, bias: 0, ...o });

// The haori comes first so its front opening, vent and cuffs can be carved before the clothes beneath are added.
const zig = (x, z, n, a) => a * Math.abs((((Math.atan2(x, z) * n / Math.PI) % 2) + 2) % 2 - 1);
// the open front is painted as crisp bands: a widening V of jacket, sash and hakama framed by lapels
const vee = y => (.026 + Math.max(0, 1.4 * S - y) * .075) * S, front = (x, y, z) => Math.max(Math.abs(x) - vee(y), -z);
const lapel = (x, y, z) => Math.max(Math.abs(x) - vee(y) - .017 * S, -z);
const haoriColor = {
  base: D.haori,
  bands: [
    [(x, y, z) => Math.max(front(x, y, z), y - 1.043 * S, .993 * S - y), D.belt],
    [(x, y, z) => Math.max(front(x, y, z), .993 * S - y), D.uniform],
    [front, D.hakama],
    [lapel, D.haoriEdge],
    [(x, y, z) => y - (.652 * S), D.haoriEdge], [(x, y, z) => y - (.67 * S + zig(x, z, 5, .045 * S)), D.haoriHem], [(x, y, z) => y - (.682 * S + zig(x, z, 5, .045 * S)), D.haoriEdge],
  ],
};
const aboveHem = (x, y, z) => y > .646 * S;
const coatBones = (x, y, z) => {
  if (y > 1.02 * S) { const u = sstep(1.02 * S, 1.22 * S, y); return { spine: 1 - u, chest: u }; }
  const t = sstep(1.0 * S, .68 * S, y), s = sstep(-.06, .06, x), back = sstep(-.02, -.12, z) * t;
  return { hips: 1 - t * .7, thighL: t * .7 * s * (1 - back), thighR: t * .7 * (1 - s) * (1 - back), coatB: t * .7 * back };
};
const chestR = F ? [.128, .122, .094] : [.14, .124, .096];
add('body', ell(P(0, 1.25, -.01), [chestR[0] + .016, chestR[1] + .018, chestR[2] + .016 + F * .022]), { k: .035, color: haoriColor, bones: { chest: 1 }, tag: 'haori', bias: .006, valid: aboveHem });
add('body', cone(P(0, 1.17, -.014), P(0, .64, -.03), (F ? .118 : .122) * S, (F ? .19 : .175) * S), { k: .045, color: haoriColor, bones: coatBones, tag: 'haori', bias: .006, valid: aboveHem });
for (const s of [1, -1]) {
  const L = s > 0 ? 'L' : 'R', A = J['upperArm' + L], E = J['forearm' + L], W = J['hand' + L];
  add('body', cone(lerp3(A, J['clav' + L], .25), E, .06 * S, .062 * S), { k: .045, color: haoriColor, bones: (x, y, z) => { const t = sstep(.1 * S, (sh + .02) * S, Math.abs(x)); return { chest: 1 - t, ['upperArm' + L]: t }; }, tag: 'haori', bias: .006, valid: aboveHem });
  add('body', cone(E, lerp3(E, W, .8), .062 * S, .058 * S), { k: .035, color: haoriColor, bones: { ['forearm' + L]: 1 }, tag: 'haori', bias: .006, valid: aboveHem });
  const bag = lerp3(E, W, .42);
  add('body', ell(add3(bag, [.004 * s * S, -.075 * S, -.004]), [.028 * S, .085 * S, .07 * S], [0, 0, s * -.6]), { k: .04, color: haoriColor, bones: { ['sleeve' + L]: .8, ['forearm' + L]: .2 }, tag: 'haori', bias: .006, valid: aboveHem });
  sub('body', cone(lerp3(E, W, .8), lerp3(E, W, 1.3), .045 * S, .06 * S), .008, { color: D.haoriEdge, tag: 'lining', bones: { ['forearm' + L]: 1 } });
}
// level hem and the neck opening
sub('body', rbox(P(0, .53, 0), [.5 * S, .11 * S, .5 * S], .005), .01, { color: D.haoriEdge, tag: 'lining', bones: coatBones });
sub('body', cone(P(0, 1.37, -.01), P(0, 1.5, -.01), .07 * S, .075 * S), .015, { color: D.haoriEdge, tag: 'lining', bones: { chest: 1 } });

// uniform jacket
add('body', ell(P(0, 1.25, -.005), chestR), { k: .045, color: D.uniform, bones: { chest: 1 }, tag: 'jacket' });
add('body', cone(P(0, 1.19, 0), P(0, 1.03, 0), (F ? .1 : .11) * S, (F ? .094 : .104) * S), { k: .045, color: D.uniform, bones: (x, y) => { const t = sstep(1.04 * S, 1.2 * S, y); return { spine: 1 - t * .5, chest: t * .5 }; }, tag: 'jacket' });
if (F) add('body', mirror(ell(P(.05, 1.262, .052), [.052 * S, .05 * S, .046 * S])), { k: .04, color: D.uniform, bones: { chest: 1 }, tag: 'jacket' });
add('body', cone(P(0, 1.36, -.008), P(0, 1.435, -.006), .06 * S, .048 * S), { k: .03, color: D.uniform, bones: (x, y) => ({ chest: 1 - sstep(1.4 * S, 1.45 * S, y) * .6, neck: sstep(1.4 * S, 1.45 * S, y) * .6 }), tag: 'collar' });
sub('body', cone(P(0, 1.42, -.009), P(0, 1.48, -.009), .037 * S, .037 * S), .004);
for (const s of [1, -1]) {
  const L = s > 0 ? 'L' : 'R';
  add('body', cone(add3(J['upperArm' + L], [-.02 * s, 0, 0]), J['forearm' + L], .048 * S, .041 * S), { k: .035, color: D.uniform, bones: (x, y, z) => { const t = sstep(.1 * S, sh * S, Math.abs(x)); return { chest: 1 - t, ['upperArm' + L]: t }; }, tag: 'sleeve' });
  add('body', cone(J['forearm' + L], lerp3(J['forearm' + L], J['hand' + L], .92), .041 * S, .033 * S), { k: .03, color: D.uniform, bones: { ['forearm' + L]: 1 }, tag: 'sleeve' });
}
// hakama: wide pleated trousers, one fluid flare per leg
add('body', ell(P(0, .955, -.005), [(F ? .132 : .124) * S, .095 * S, .088 * S]), { k: .045, color: D.hakama, bones: { hips: 1 }, tag: 'hakama' });
const pleat = (f, n, a) => { const g = (x, y, z) => { const lx = Math.abs(x) - hipW * S; return f(x, y, z) + a * Math.sin(Math.atan2(lx, z) * n) * sstep(.85 * S, .4 * S, y); }; g.b = f.b.map((v, i) => v + (i < 3 ? -a : a)); return g; };
for (const s of [1, -1]) {
  const L = s > 0 ? 'L' : 'R', knee = J['shin' + L], ankle = add3(J['foot' + L], [0, .085 * S, 0]);
  add('body', pleat(cone(add3(J['thigh' + L], [0, .03, 0]), knee, .09 * S, .08 * S), 7, .003), { k: .05, color: D.hakama, bones: (x, y) => { const t = sstep(.95 * S, .78 * S, y); return { hips: 1 - t, ['thigh' + L]: t }; }, tag: 'hakama' });
  add('body', pleat(cone(knee, ankle, .08 * S, .1 * S), 7, .0035), { k: .045, color: D.hakama, bones: (x, y) => { const t = sstep(.58 * S, .42 * S, y); return { ['thigh' + L]: 1 - t, ['shin' + L]: t }; }, tag: 'hakama' });
  sub('body', ell(add3(ankle, [0, -.065 * S, 0]), [.095 * S, .055 * S, .095 * S]), .016, { color: D.hakama, tag: 'hakama', bones: { ['shin' + L]: 1 } });
  add('body', cone(add3(ankle, [0, .06 * S, 0]), add3(J['foot' + L], [0, .005, 0]), .047 * S, .04 * S), { k: .02, color: D.wrap, bones: { ['shin' + L]: 1 }, tag: 'wrap' });
  const heel = add3(J['foot' + L], [0, -.035 * S, -.035 * S]), toe = add3(J['foot' + L], [0, -.05 * S, .115 * S]);
  add('body', cone(heel, toe, .041 * S, .032 * S), { k: .03, color: D.wrap, bones: { ['foot' + L]: 1 }, tag: 'foot' });
  add('body', rbox(add3(J['foot' + L], [0, -.077 * S, .04 * S]), [.046 * S, .009 * S, .122 * S], .008), { k: .005, color: D.sandal, bones: { ['foot' + L]: 1 }, tag: 'sandal', bias: .003 });
}
add('body', pleat(cone(P(0, .9, -.005), P(0, .3, -.005), .07 * S, .085 * S), 9, .003), { k: .07, color: D.hakama, bones: (x, y) => { const s = sstep(-.04, .04, x), t = sstep(.75 * S, .45 * S, y); return { hips: (1 - sstep(.95 * S, .75 * S, y)) * .6, thighL: s * (1 - t), thighR: (1 - s) * (1 - t), shinL: s * t, shinR: (1 - s) * t }; }, tag: 'hakama' });
// sash belt over the hakama waist
add('body', cone(P(0, 1.045, -.004), P(0, .99, -.004), (F ? .116 : .122) * S, (F ? .122 : .126) * S), { k: .008, color: D.belt, bones: { spine: .6, hips: .4 }, tag: 'belt', bias: .004 });

// Head: skull, cheeks, a small anime jaw and chin, nose, ears, neck and the hair cap
const hc = P(0, 1.585, 0);
add('head', ell(hc, [.086 * S, .097 * S, .092 * S]), { k: .03, color: D.skin, bones: { head: 1 }, tag: 'face' });
add('head', cone(P(0, 1.558, .012), P(0, 1.478, .054), .072 * S, .016 * S), { k: .045, color: D.skin, bones: { head: 1 }, tag: 'face' });
add('head', mirror(ell(P(.044, 1.527, .042), [.034 * S, .029 * S, .034 * S])), { k: .035, color: D.skin, bones: { head: 1 }, tag: 'face' });
add('head', cone(P(0, 1.55, .083), P(0, 1.524, .093), .0055 * S, .0075 * S), { k: .016, color: D.skin, bones: { head: 1 }, tag: 'face' });
add('head', mirror(ell(P(.084, 1.556, -.006), [.011 * S, .023 * S, .016 * S], [0, .3, 0])), { k: .012, color: D.skin, bones: { head: 1 }, tag: 'skin' });
add('head', cone(P(0, 1.37, -.01), P(0, 1.5, -.012), .035 * S, .034 * S), { k: .03, color: D.skin, bones: (x, y) => { const t = sstep(1.42 * S, 1.5 * S, y); return { neck: 1 - t, head: t }; }, tag: 'skin' });
sub('head', mirror(ell(P(.036, 1.567, .1), [.03 * S, .017 * S, .02 * S])), .02);
const capC = P(0, 1.6, -.012), capR = [.096 * S, .106 * S, .103 * S];
const hairCap = bound((x, y, z) => smax(ell(capC, capR)(x, y, z), -rbox(P(0, 1.52, .12), [.074 * S, .068 * S, .1 * S], .03)(x, y, z), .03), [-.11 * S, 1.48 * S, -.13 * S, .11 * S, 1.72 * S, .1 * S]);
add('head', hairCap, { k: .01, color: D.hair[0], bones: { head: 1 }, tag: 'hair', bias: .004 });

// Hands: a closed grip (right, holds the sword) and a loosely closed left hand.
for (const s of [1, -1]) {
  const L = s > 0 ? 'L' : 'R', w = J['hand' + L], f = J['forearm' + L], dir = [w[0] - f[0], w[1] - f[1], w[2] - f[2]], dl = Math.hypot(...dir), d = dir.map(v => v / dl);
  const at = (t, o = [0, 0, 0]) => [w[0] + d[0] * t + o[0], w[1] + d[1] * t + o[1], w[2] + d[2] * t + o[2]];
  const bones = (x, y, z) => { const t = ((x - w[0]) * d[0] + (y - w[1]) * d[1] + (z - w[2]) * d[2]); const u = sstep(-.03, .01, t); return { ['forearm' + L]: 1 - u, ['hand' + L]: u }; };
  add('hands', cone(at(-.045), at(.0), .029 * S, .025 * S), { k: .02, color: D.skin, bones, tag: 'skin' });
  add('hands', ell(at(.04 * S), [.025 * S, .043 * S, .035 * S], [0, 0, s * -.6]), { k: .02, color: D.skin, bones, tag: 'skin' });
  for (let i = 0; i < 4; i++) {
    const o = (i - 1.5) * .0175 * S, k1 = at(.071 * S, [0, 0, o]), k2 = at(.094 * S, [-s * .006, 0, o + .012 * (i === 3 ? .4 : 1)]), k3 = at(.08 * S, [-s * .024, -.004, o + .014]);
    add('hands', cone(k1, k2, .0102 * S, .0092 * S), { k: .008, color: D.skin, bones, tag: 'skin' });
    add('hands', cone(k2, k3, .0092 * S, .0082 * S), { k: .006, color: D.skin, bones, tag: 'skin' });
  }
  add('hands', cone(at(.025 * S, [-s * .02, 0, .03]), at(.068 * S, [-s * .03, -.01, .036]), .0118 * S, .0092 * S), { k: .012, color: D.skin, bones, tag: 'skin' });
}

// ---------- evaluate, polygonize, weight, cut colour borders ----------
function field(list) {
  return (x, y, z) => { let d = 1e9; for (const p of list) { const b = p.f.b; if (b && d < 1e8) { const lb = boxDist(b, x, y, z); if (p.op === 'add' ? lb > d + p.k : lb > p.k - d) continue; } const v = p.f(x, y, z); d = p.op === 'add' ? smin(d, v, p.k) : smax(d, -v, p.k); } return d; };
}
function surface(list, min, max, h) {
  const f = field(list), nx = Math.ceil((max[0] - min[0]) / h) + 1, ny = Math.ceil((max[1] - min[1]) / h) + 1, nz = Math.ceil((max[2] - min[2]) / h) + 1;
  const vals = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k), C = 4, near = C * h * 1.9;
  for (let bk = 0; bk < nz - 1; bk += C) for (let bj = 0; bj < ny - 1; bj += C) for (let bi = 0; bi < nx - 1; bi += C) {
    const ei = Math.min(bi + C, nx - 1), ej = Math.min(bj + C, ny - 1), ek = Math.min(bk + C, nz - 1);
    const d0 = f(min[0] + (bi + ei) * h / 2, min[1] + (bj + ej) * h / 2, min[2] + (bk + ek) * h / 2);
    if (Math.abs(d0) > near) { for (let k = bk; k <= ek; k++) for (let j = bj; j <= ej; j++) for (let i = bi; i <= ei; i++) vals[I(i, j, k)] = d0; continue; }
    for (let k = bk; k <= ek; k++) for (let j = bj; j <= ej; j++) for (let i = bi; i <= ei; i++) vals[I(i, j, k)] = f(min[0] + i * h, min[1] + j * h, min[2] + k * h);
  }
  const vid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), CI = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k), pos = [], idx = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let neg = 0; for (let c = 0; c < 8; c++) { const o = corners[c]; cv[c] = vals[I(i + o[0], j + o[1], k + o[2])]; if (cv[c] < 0) neg++; }
    if (neg === 0 || neg === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) { if ((cv[a] < 0) === (cv[b] < 0)) continue; const t = cv[a] / (cv[a] - cv[b]), A = corners[a], B = corners[b]; sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; n++; }
    vid[CI(i, j, k)] = pos.length / 3; pos.push(min[0] + (i + sx / n) * h, min[1] + (j + sy / n) * h, min[2] + (k + sz / n) * h);
  }
  function quad(a, b, c, d) { a = vid[a]; b = vid[b]; c = vid[c]; d = vid[d]; if (a < 0 || b < 0 || c < 0 || d < 0) return; idx.push(a, b, c, a, c, d); }
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = vals[I(i, j, k)] < 0;
    if (v0 !== (vals[I(i + 1, j, k)] < 0)) quad(CI(i, j - 1, k - 1), CI(i, j, k - 1), CI(i, j, k), CI(i, j - 1, k));
    if (v0 !== (vals[I(i, j + 1, k)] < 0)) quad(CI(i - 1, j, k - 1), CI(i - 1, j, k), CI(i, j, k), CI(i, j, k - 1));
    if (v0 !== (vals[I(i, j, k + 1)] < 0)) quad(CI(i - 1, j - 1, k), CI(i, j - 1, k), CI(i, j, k), CI(i - 1, j, k));
  }
  const nrm = new Float32Array(pos.length), e = h * .5;
  for (let v = 0; v < pos.length; v += 3) {
    let x = pos[v], y = pos[v + 1], z = pos[v + 2];
    const d = f(x, y, z), gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e), g = Math.hypot(gx, gy, gz) || 1;
    const step = clamp(d, -h, h); pos[v] = x - gx / g * step; pos[v + 1] = y - gy / g * step; pos[v + 2] = z - gz / g * step; nrm[v] = gx / g; nrm[v + 1] = gy / g; nrm[v + 2] = gz / g;
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
    if (fx * (nrm[a] + nrm[b] + nrm[c]) + fy * (nrm[a + 1] + nrm[b + 1] + nrm[c + 1]) + fz * (nrm[a + 2] + nrm[b + 2] + nrm[c + 2]) < 0) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
  }
  return { pos: Array.from(pos), nrm: Array.from(nrm), idx };
}
const col = new THREE.Color(), colLin = h => (col.setHex(h), [col.r, col.g, col.b]);
// colour candidates: every part that carries a colour (carves included: their walls show the lining)
function painter(list, blend, outlineW) {
  // a carve's wall only shows where the carve actually removed material and nothing added later covers it
  list.forEach((p, i) => { if (p.op === 'sub' && p.color !== undefined && !p.valid) { const pre = field(list.slice(0, i)), post = field(list.slice(i + 1).filter(q => q.op === 'add')); p.valid = (x, y, z) => pre(x, y, z) < .003 && post(x, y, z) > .004; } });
  const cands = list.filter(p => p.color !== undefined), adds = list.filter(p => p.op === 'add' || p.bones);
  const bandOf = (p, x, y, z) => { if (typeof p.color === 'number') return 7; for (let i = 0; i < p.color.bands.length; i++) if (p.color.bands[i][0](x, y, z) < 0) return i; return 7; };
  const hexOf = (p, b) => typeof p.color === 'number' ? p.color : b === 7 ? p.color.base : p.color.bands[b][1];
  const score = (p, x, y, z) => Math.abs(p.f(x, y, z)) - (p.bias || 0) + (p.valid && !p.valid(x, y, z) ? 1 : 0);
  function key(x, y, z) {
    let best = 0, bd = 1e9; for (let i = 0; i < cands.length; i++) { const p = cands[i], b = p.f.b; if (b && boxDist(b, x, y, z) > bd + .02) continue; const s = score(p, x, y, z); if (s < bd) { bd = s; best = i; } }
    return best * 8 + bandOf(cands[best], x, y, z);
  }
  // signed split field between two colour keys: negative on A's side
  function split(A, B, x, y, z) {
    const pa = cands[A >> 3], pb = cands[B >> 3], ba = A & 7, bb = B & 7;
    if (pa !== pb) return score(pa, x, y, z) - score(pb, x, y, z);
    const g = b => b === 7 ? -Math.min(...pa.color.bands.map(q => q[0](x, y, z))) : pa.color.bands[b][0](x, y, z);
    return g(ba) - g(bb);
  }
  function weights(x, y, z) {
    const ds = adds.map(p => { const b = p.f.b; return b && boxDist(b, x, y, z) > blend * 3 ? 1e9 : Math.abs(p.f(x, y, z)); }); const dmin = Math.min(...ds), acc = {};
    for (let i = 0; i < adds.length; i++) { const w = Math.max(0, 1 - (ds[i] - dmin) / blend); if (w <= 0) continue; const b = typeof adds[i].bones === 'function' ? adds[i].bones(x, y, z) : adds[i].bones; for (const k in b) if (b[k] > 0) acc[k] = (acc[k] || 0) + b[k] * w * w; }
    const top = Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4), sum = top.reduce((s, e) => s + e[1], 0) || 1;
    return top.map(([k, w]) => [boneIndex[k], w / sum]);
  }
  return {
    cands, key, split, weights,
    color: k => colLin(hexOf(cands[k >> 3], k & 7)), tag: k => cands[k >> 3].tag, outline: k => outlineW(cands[k >> 3].tag),
  };
}
// Build final vertex streams, cutting every triangle that straddles a colour border along that border.
function finish(m, pt, extra = () => ({})) {
  const n = m.pos.length / 3, keys = new Array(n);
  for (let v = 0; v < n; v++) keys[v] = pt.key(m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2]);
  const out = { pos: [], nrm: [], color: [], si: [], sw: [], ow: [], tag: [], idx: [] }, made = new Map();
  const emitV = (p, nn, k) => { const id = out.pos.length / 3; out.pos.push(...p); const l = Math.hypot(...nn) || 1; out.nrm.push(nn[0] / l, nn[1] / l, nn[2] / l); out.color.push(...pt.color(k)); out.tag.push(pt.tag(k)); out.ow.push(pt.outline(k)); const w = pt.weights(...p); for (let q = 0; q < 4; q++) { out.si.push(w[q] ? w[q][0] : 0); out.sw.push(w[q] ? w[q][1] : 0); } return id; };
  const P3 = v => [m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2]], N3 = v => [m.nrm[v * 3], m.nrm[v * 3 + 1], m.nrm[v * 3 + 2]];
  const orig = v => { const key = 'v' + v; if (!made.has(key)) made.set(key, emitV(P3(v), N3(v), keys[v])); return made.get(key); };
  const cut = (a, b, A, B, k) => { // point on edge a->b where colour A turns into B, emitted with colour k
    const key = (a < b ? a + '_' + b : b + '_' + a) + '_' + A + '_' + B + '_' + k; if (made.has(key)) return made.get(key);
    const pa = P3(a), pb = P3(b), sa = pt.split(A, B, ...pa), sb = pt.split(A, B, ...pb); let t = sa * sb < 0 ? sa / (sa - sb) : .5; t = clamp(t, .03, .97);
    // refine once against the true field so curved borders stay smooth
    const pm = lerp3(pa, pb, t), sm = pt.split(A, B, ...pm); if (sm * sa < 0) t = t * (sa / (sa - sm)); else if (sm * sb < 0) t = t + (1 - t) * (sm / (sm - sb)); t = clamp(t, .03, .97);
    const na = N3(a), nb = N3(b); const id = emitV(lerp3(pa, pb, t), lerp3(na, nb, t), k); made.set(key, id); return id;
  };
  for (let t = 0; t < m.idx.length; t += 3) {
    let [a, b, c] = [m.idx[t], m.idx[t + 1], m.idx[t + 2]], ka = keys[a], kb = keys[b], kc = keys[c];
    if (ka === kb && kb === kc) { out.idx.push(orig(a), orig(b), orig(c)); continue; }
    if (ka !== kb && kb !== kc && ka !== kc) { out.idx.push(orig(a), orig(b), orig(c)); continue; }
    // rotate so the odd vertex is last
    if (kb === kc) [a, b, c, ka, kb, kc] = [b, c, a, kb, kc, ka]; else if (ka === kc) [a, b, c, ka, kb, kc] = [c, a, b, kc, ka, kb];
    const A = ka, B = kc, ac1 = cut(a, c, A, B, A), bc1 = cut(b, c, A, B, A), ac2 = cut(a, c, A, B, B), bc2 = cut(b, c, A, B, B);
    out.idx.push(orig(a), orig(b), bc1, orig(a), bc1, ac1, ac2, bc2, orig(c));
  }
  return out;
}

const meshes = [];
const bodyP = painter(parts.body, .045, t => t === 'haori' || t === 'lining' ? .0042 : .0035);
meshes.push(finish(surface(parts.body, [-.62 * S, -.005, -.36 * S], [.62 * S, 1.49 * S, .36 * S], .0105 * S), bodyP));
const headP = painter(parts.head, .03, t => t === 'face' ? .0016 : .0026);
const headM = finish(surface(parts.head, [-.13 * S, 1.33 * S, -.14 * S], [.13 * S, 1.73 * S, .14 * S], .0049 * S), headP);
// face shading: pull face normals toward a smooth sphere so anime shadows fall cleanly
for (let v = 0; v < headM.tag.length; v++) if (headM.tag[v] === 'face') { const x = headM.pos[v * 3] - hc[0], y = headM.pos[v * 3 + 1] - hc[1] + .02, z = headM.pos[v * 3 + 2] - hc[2], l = Math.hypot(x, y, z), o = [x / l, y / l, z / l]; let m = 0; for (let a = 0; a < 3; a++) { headM.nrm[v * 3 + a] = headM.nrm[v * 3 + a] * .35 + o[a] * .65; m += headM.nrm[v * 3 + a] ** 2; } m = Math.sqrt(m); for (let a = 0; a < 3; a++) headM.nrm[v * 3 + a] /= m; }
meshes.push(headM);
const handP = painter(parts.hands, .02, () => .002);
for (const s of [1, -1]) { const w = J[s > 0 ? 'handL' : 'handR']; meshes.push(finish(surface(parts.hands, [w[0] - .1 * S, w[1] - .12 * S, w[2] - .1 * S], [w[0] + .1 * S, w[1] + .07 * S, w[2] + .1 * S], .0039 * S), handP)); }

// ---------- hair: tapered, flattened locks that grow from a crown whorl and hug the skull ----------
const hairMeshes = [];
function lock(points, r, { flat = .45, bones = null, seg = 12, rad = 7, tip = D.hair[1], from = .55 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const frames = curve.computeFrenetFrames(seg, false), pos = [], nrm = [], idx = [], cl = [], si = [], sw = [], ow = [], tag = [];
  const c0 = colLin(D.hair[0]), c1 = colLin(tip);
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i], rr = r * S * Math.pow(1 - t, .8) * (1 - .2 * Math.sin(t * Math.PI)) + .0004;
    const tc = sstep(from, 1, t), rgb = [c0[0] + (c1[0] - c0[0]) * tc, c0[1] + (c1[1] - c0[1]) * tc, c0[2] + (c1[2] - c0[2]) * tc];
    const top = Object.entries(bones ? bones(t) : { head: 1 }).slice(0, 4);
    for (let j = 0; j <= rad; j++) {
      const a = j / rad * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(c.x + (N.x * ca + B.x * sa * flat) * rr, c.y + (N.y * ca + B.y * sa * flat) * rr, c.z + (N.z * ca + B.z * sa * flat) * rr);
      const nx = N.x * ca + B.x * sa / flat, ny = N.y * ca + B.y * sa / flat, nz = N.z * ca + B.z * sa / flat, nl = Math.hypot(nx, ny, nz); nrm.push(nx / nl, ny / nl, nz / nl);
      cl.push(...rgb); ow.push(.002 * (1 - t * .75)); tag.push('hair');
      for (let q = 0; q < 4; q++) { si.push(top[q] ? boneIndex[top[q][0]] : 0); sw.push(top[q] ? top[q][1] : 0); }
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  hairMeshes.push({ pos, nrm, idx, color: cl, si, sw, ow, tag });
}
// a point on the (slightly inflated) skull at azimuth az (0 = face, +x = character's left) and elevation el
const skull = (az, el, lift = 0) => { const d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], k = 1 / Math.hypot(d[0] / capR[0], d[1] / capR[1], d[2] / capR[2]) * (1 + lift); return [capC[0] + d[0] * k, capC[1] + d[1] * k, capC[2] + d[2] * k]; };
// a lock that follows the skull from (az0,el0) to (az1,el1), lifting off as it goes, then shoots past its end
function hug(az0, el0, az1, el1, r, { lift0 = .01, lift1 = .12, ext = .03, drop = 0, ...o } = {}) {
  const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(skull(az0 + (az1 - az0) * t, el0 + (el1 - el0) * t, lift0 + (lift1 - lift0) * t * t)); }
  const a = pts[3], b = pts[4], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d) || 1;
  pts.push([b[0] + d[0] / l * ext, b[1] + d[1] / l * ext - drop, b[2] + d[2] / l * ext]);
  lock(pts, r, o);
}
const rnd = (() => { let s = which === 'haru' ? 11 : 29; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
if (which === 'haru') {
  // windswept, spiky: rows of locks flow back and down from the crown and flick outward at the tips
  const rows = [[1.32, 6, .08, .1], [1.0, 9, .12, .22], [.66, 11, .13, .26], [.32, 12, .12, .24], [.0, 11, .1, .22]];
  for (const [el, n, len, lift] of rows) for (let i = 0; i < n; i++) {
    const az = Math.PI + (i / (n - 1) - .5) * (el > 1.2 ? 2.4 : el > .5 ? 3.9 : 3.5) + (rnd() - .5) * .15;
    if (Math.cos(az) > .45 && el < .8) continue; // keep the face clear (bangs handle it)
    const back = Math.cos(az) < 0 ? 1 : .6;
    hug(az, el, az + (az - Math.PI) * .12, el - .5 - len * 2.5 * back, .03 + rnd() * .006, { lift1: lift, ext: .035 + rnd() * .03, drop: .01, flat: .5 });
  }
  // bangs: seven locks fall over the forehead, the centre ones longer, tips parting over the eyes
  [[-.62, .05], [-.42, -.02], [-.21, -.1], [0, -.16], [.2, -.08], [.4, -.02], [.6, .05]].forEach(([az, el1], i) =>
    hug(az * .85, 1.05, az * 1.05 + (i % 2 ? .05 : -.05), el1, .03, { lift0: .02, lift1: .07, ext: .018, drop: .006, flat: .38, from: .8 }));
  for (const s of [1, -1]) { hug(s * 1.1, .6, s * 1.2, -.4, .03, { lift1: .06, ext: .03, flat: .4, from: .7 }); hug(s * 1.45, .5, s * 1.6, -.45, .032, { lift1: .12, ext: .04, flat: .45 }); }
  for (let i = 0; i < 5; i++) hug(Math.PI + (i - 2) * .3, 1.3, Math.PI + (i - 2) * .45, .6, .034, { lift0: .04, lift1: .32, ext: .05, flat: .5 }); // crown spikes
} else {
  // long side-swept bangs, face-framing locks and a high ponytail on a spring chain
  [[-.6, .0], [-.38, -.08], [-.16, -.14], [.06, -.16], [.28, -.1], [.5, -.02], [.7, .05]].forEach(([az, el1], i) =>
    hug(az * .7 - .1, 1.12, az + .22, el1, .03, { lift0: .02, lift1: .07, ext: .02, drop: .008, flat: .36, from: .75 }));
  for (const s of [1, -1]) {
    lock([skull(s * .95, .7, .02), skull(s * 1.05, .1, .07), skull(s * 1.05, -.45, .12), add3(skull(s * 1.0, -.6, .14), [0, -.12 * S, .02])], .028, { flat: .38, from: .55, seg: 16 });
    lock([skull(s * 1.25, .7, .02), skull(s * 1.4, .0, .08), add3(skull(s * 1.45, -.5, .12), [0, -.05 * S, 0])], .03, { flat: .42, from: .6 });
  }
  // the whole back of the head sweeps up into the tie
  const tie = add3(capC, [0, .064 * S, -.078 * S]);
  for (let i = 0; i < 6; i++) { const az = (i - 2.5) * .5 + Math.PI, a = skull(az, 1.1, .01); lock([a, skull(az + (Math.PI - az) * .6, .95, .04), tie], .034, { flat: .45, from: 1.1, seg: 8 }); }
  const tb = t => { if (t < .06) return { head: 1 }; const f = t * 3.2, i = Math.min(3, Math.floor(f)), u = f - i, b = { [tail[i]]: 1 - u * .5 }; if (i < 3) b[tail[i + 1]] = u * .5; return b; };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, o = [Math.cos(a) * .02, 0, Math.sin(a) * .014], sp = .5 + rnd() * .7;
    lock([add3(tie, [o[0], 0, o[2]]), P(o[0] * 3 * sp, 1.66, -.15 + o[2]), P(o[0] * 3.4 * sp, 1.5, -.19 + o[2]), P(o[0] * 2.8 * sp, 1.33, -.2 + o[2]), P(o[0] * 1.4 + (rnd() - .5) * .03, 1.14 - rnd() * .06, -.19)], .038, { flat: .55, bones: tb, seg: 22, from: .45 });
  }
  lock([add3(tie, [-.025, -.005, .02]), add3(tie, [0, .012, .0]), add3(tie, [.025, -.005, .02])], .016, { flat: .9, tip: 0xa8243a, from: 0 }); // the cord tie
  lock([add3(tie, [0, 0, -.005]), add3(tie, [-.04, -.03, -.03]), add3(tie, [-.05, -.08, -.03])], .018, { flat: .3, tip: 0xc23048, from: 0 });
}

// ---------- merge into one skinned geometry ----------
const all = [...meshes, ...hairMeshes];
let nV = 0, nI = 0; for (const m of all) { nV += m.pos.length / 3; nI += m.idx.length; }
const aP = new Float32Array(nV * 3), aN = new Float32Array(nV * 3), aC = new Float32Array(nV * 3), aSI = new Uint16Array(nV * 4), aSW = new Float32Array(nV * 4), aO = new Float32Array(nV), aUV = new Float32Array(nV * 2), aF = new Float32Array(nV), ix = new Uint32Array(nI);
let ov = 0, oi = 0;
const faceY = 1.55 * S, faceW = .2 * S;
for (const m of all) {
  const n = m.pos.length / 3;
  aP.set(m.pos, ov * 3); aN.set(m.nrm, ov * 3); aC.set(m.color, ov * 3); aSI.set(m.si, ov * 4); aSW.set(m.sw, ov * 4); aO.set(m.ow, ov);
  for (let v = 0; v < n; v++) {
    aUV[(ov + v) * 2] = .5 + m.pos[v * 3] / faceW; aUV[(ov + v) * 2 + 1] = .5 + (m.pos[v * 3 + 1] - faceY) / faceW;
    if (m.tag[v] === 'face') aF[ov + v] = sstep(.15, .45, m.nrm[v * 3 + 2]);
  }
  for (let i = 0; i < m.idx.length; i++) ix[oi + i] = m.idx[i] + ov;
  ov += n; oi += m.idx.length;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(aP, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(aN, 3)); geo.setAttribute('color', new THREE.BufferAttribute(aC, 3));
geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(aSI, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(aSW, 4));
geo.setAttribute('outlineW', new THREE.BufferAttribute(aO, 1)); geo.setAttribute('faceUv', new THREE.BufferAttribute(aUV, 2)); geo.setAttribute('faceMask', new THREE.BufferAttribute(aF, 1));
geo.setIndex(new THREE.BufferAttribute(ix, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox();

// ---------- face: painted on a canvas, redrawn for blinks and expressions ----------
const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null; const FS = 1024;
let faceTex = null;
const px = x => (.5 + x * S / faceW) * FS, py = y => (.5 - (y * S - faceY) / faceW) * FS;
function drawFace({ blink = 0, mouth = 'calm', brow = 'calm' } = {}) {
  if (!canvas) return; canvas.width = canvas.height = FS; const g = canvas.getContext('2d'); g.clearRect(0, 0, FS, FS);
  const eyeY = 1.566, eyeX = .037, ew = .025, eh = (D.female ? .021 : .019);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of [1, -1]) {
    const cx = px(s * eyeX), cy = py(eyeY), W = ew / faceW * FS * S, H = eh / faceW * FS * S;
    const open = 1 - blink, fierce = brow === 'fierce' ? 1 : 0;
    // blush
    g.fillStyle = D.blush; g.beginPath(); g.ellipse(px(s * .05), py(1.535), W * .9, H * .35, 0, 0, Math.PI * 2); g.fill();
    if (open > .15) {
      g.save(); g.translate(cx, cy); g.scale(s, 1);
      const top = -H * open * (1 - fierce * .18), bot = H * .78 * open;
      g.beginPath(); g.moveTo(-W, -H * .05); g.bezierCurveTo(-W * .55, top * 1.25, W * .5, top * 1.2, W * 1.02, top * .35 + H * .1 * fierce); g.bezierCurveTo(W * .9, bot * .6, -W * .4, bot * 1.1, -W, -H * .05); g.closePath();
      g.fillStyle = '#fbf6f2'; g.fill(); g.save(); g.clip();
      const ir = W * .62, iy = H * .12 * open; const grad = g.createLinearGradient(0, iy - ir * 1.2, 0, iy + ir * 1.2);
      grad.addColorStop(0, D.eye[0]); grad.addColorStop(.55, D.eye[1]); grad.addColorStop(1, D.eye[2]);
      g.fillStyle = grad; g.beginPath(); g.ellipse(-W * .02, iy, ir * .86, ir * 1.12, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = W * .07; g.strokeStyle = D.eye[0]; g.stroke();
      g.fillStyle = D.eye[0]; g.beginPath(); g.ellipse(-W * .02, iy + ir * .05, ir * .34, ir * (fierce ? .5 : .55), 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-W * 1.2, top * 1.3, W * 2.4, H * .5); // upper-lid shadow
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(W * .22, iy - ir * .45, ir * .26, ir * .2, -.5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(-W * .28, iy + ir * .5, ir * .1, ir * .08, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      // upper lash line: heavy, flicked at the outer corner
      g.beginPath(); g.moveTo(-W * 1.08, H * .02); g.bezierCurveTo(-W * .55, top * 1.32, W * .5, top * 1.28, W * 1.1, top * .3 + H * .1 * fierce); g.lineTo(W * 1.32, top * .55 + (D.female ? -H * .25 : 0));
      g.lineWidth = H * .26; g.strokeStyle = D.lash; g.stroke();
      g.beginPath(); g.moveTo(-W * .55, bot * 1.02); g.quadraticCurveTo(W * .3, bot * 1.08, W * .85, bot * .55); g.lineWidth = H * .07; g.strokeStyle = 'rgba(60,30,30,.6)'; g.stroke();
      g.restore();
    } else {
      g.save(); g.translate(cx, cy); g.scale(s, 1); g.beginPath(); g.moveTo(-W, 0); g.quadraticCurveTo(0, H * .45, W * 1.1, -H * .05); g.lineWidth = H * .2; g.strokeStyle = D.lash; g.stroke(); g.restore();
    }
    // brow
    g.save(); g.translate(px(s * .037), py(1.598)); g.scale(s, 1); g.rotate(fierce ? .32 : -.06);
    g.beginPath(); g.moveTo(-W * .9, fierce ? 0 : H * .1); g.quadraticCurveTo(0, -H * .32, W * 1.05, H * .1); g.lineWidth = H * (D.female ? .15 : .21); g.strokeStyle = D.female ? '#9a8ea8' : '#1a1820'; g.stroke(); g.restore();
  }
  // nose hint and mouth
  g.strokeStyle = 'rgba(150,80,70,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(px(.004), py(1.534)); g.lineTo(px(-.002), py(1.528)); g.stroke();
  const my = py(1.502), mw = .012 / faceW * FS * S;
  if (mouth === 'shout') { g.fillStyle = '#5a1a20'; g.beginPath(); g.ellipse(px(0), my + 6, mw * .9, mw * .62, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4ece6'; g.fillRect(px(0) - mw * .7, my - mw * .48, mw * 1.4, mw * .2); g.fillStyle = '#d8676a'; g.beginPath(); g.ellipse(px(0), my + mw * .38, mw * .5, mw * .18, 0, 0, Math.PI * 2); g.fill(); }
  else if (mouth === 'grit') { g.strokeStyle = '#4a2026'; g.lineWidth = 6; g.beginPath(); g.moveTo(px(-.011), my - 2); g.lineTo(px(.011), my + 2); g.stroke(); }
  else if (mouth === 'smile') { g.strokeStyle = '#6a2c30'; g.lineWidth = 5; g.beginPath(); g.moveTo(px(-.01), my - 4); g.quadraticCurveTo(px(0), my + 8, px(.01), my - 4); g.stroke(); }
  else { g.strokeStyle = '#6a2c30'; g.lineWidth = 5; g.beginPath(); g.moveTo(px(-.0075), my); g.quadraticCurveTo(px(0), my + 2, px(.0075), my - 1); g.stroke(); }
  if (faceTex) faceTex.needsUpdate = true;
}
if (canvas) { drawFace(); faceTex = new THREE.CanvasTexture(canvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 4; }

// ---------- materials: two-tone anime shading, rim light, ink hull ----------
const ramp = new THREE.DataTexture(new Uint8Array([150,150,150,255, 150,150,150,255, 150,150,150,255, 168,168,168,255, 250,250,250,255, 255,255,255,255, 255,255,255,255, 255,255,255,255]), 8, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.LinearFilter; ramp.needsUpdate = true;
const uniforms = { faceMap: { value: faceTex }, rimColor: { value: new THREE.Color(D.female ? 0xffd9c8 : 0xd8f4ff) }, rimStrength: { value: .35 }, flash: { value: 0 } };
const skinMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp });
skinMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, uniforms);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 faceUv; attribute float faceMask; varying vec2 vFaceUv; varying float vFaceMask;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceUv=faceUv; vFaceMask=faceMask;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D faceMap; uniform vec3 rimColor; uniform float rimStrength; uniform float flash; varying vec2 vFaceUv; varying float vFaceMask;')
    .replace('#include <color_fragment>', '#include <color_fragment>\nif(vFaceMask>0.){vec4 fc=texture2D(faceMap,vFaceUv);diffuseColor.rgb=mix(diffuseColor.rgb,fc.rgb,fc.a*vFaceMask);}')
    .replace('#include <opaque_fragment>', 'float rim=pow(1.-saturate(dot(normalize(normal),normalize(vViewPosition))),3.);outgoingLight+=rimColor*rim*rimStrength*(.4+.6*saturate(normal.y+.6));outgoingLight=mix(outgoingLight,vec3(1.,.97,.92),flash);\n#include <opaque_fragment>');
};
skinMat.customProgramCacheKey = () => 'veilbound-fighter';
const inkMat = new THREE.MeshBasicMaterial({ color: D.outline, side: THREE.BackSide });
inkMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float outlineW;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed+=normal*outlineW;'); };
inkMat.customProgramCacheKey = () => 'veilbound-ink';

// ---------- assemble ----------
const bones = {}; for (const n of boneNames) { const b = new THREE.Bone(); b.name = n; bones[n] = b; const p = parents[n]; const o = J[n], q = p ? J[p] : [0, 0, 0]; b.position.set(o[0] - q[0], o[1] - q[1], o[2] - q[2]); if (p) bones[p].add(b); }
const skeleton = new THREE.Skeleton(boneNames.map(n => bones[n]));
const mesh = new THREE.SkinnedMesh(geo, skinMat); mesh.name = 'fighter-' + which; mesh.add(bones.hips); mesh.bind(skeleton); mesh.castShadow = true; mesh.receiveShadow = false;
// animated poses stay within ~1.3 m of the hips (the finisher leaps), so cull against a generous fixed sphere

const ink = new THREE.SkinnedMesh(geo, inkMat); ink.name = 'fighter-ink'; ink.bind(skeleton, mesh.bindMatrix);
mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1 * S, 0), 1.9 * S); ink.boundingSphere = mesh.boundingSphere.clone();
const group = new THREE.Group(); group.name = 'fighter-' + which; group.add(mesh, ink);

// ---------- katana and scabbard (rigid, held in the right hand) ----------
const steel = new THREE.MeshStandardMaterial({ color: D.blade, metalness: .92, roughness: .18, envMapIntensity: 1.4 });
const edgeMat = new THREE.MeshStandardMaterial({ color: D.bladeEdge, emissive: D.bladeEdge, emissiveIntensity: .35, metalness: .7, roughness: .2 });
const brass = new THREE.MeshStandardMaterial({ color: D.tsuba, metalness: .8, roughness: .35 });
const wrap = new THREE.MeshToonMaterial({ color: D.grip, gradientMap: ramp });
const lacquer = new THREE.MeshStandardMaterial({ color: D.saya, metalness: .1, roughness: .28 });
const sword = new THREE.Group(); sword.name = 'katana';
{
  const L = .74, curve = .022, sec = (t, w) => { const y = t * L, x = curve * t * t; return [x, y, w]; };
  const pos = [], idx = []; const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N, taper = t > .92 ? (1 - (t - .92) / .08 * .85) : 1, w = .0155 * (1 - t * .25) * taper, th = .0035 * (1 - t * .3) * taper, [x, y] = sec(t, w);
    pos.push(x - w, y + (t > .92 ? (t - .92) * .15 * (1 - taper) : 0), 0, x - w * .1, y, th, x + w, y + (t > .92 ? -(t - .92) * .2 : 0), 0, x - w * .1, y, -th); // spine, ridge, edge, ridge
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const blade = new THREE.Mesh(g, steel); blade.position.y = .035; sword.add(blade);
  const eg = new THREE.BufferGeometry(), ep = []; for (let i = 0; i <= N; i++) { const t = i / N, w = .0155 * (1 - t * .25) * (t > .92 ? (1 - (t - .92) / .08 * .85) : 1), [x, y] = sec(t, w); ep.push(x + w * .45, y, .0012, x + w * 1.02, y + (t > .92 ? -(t - .92) * .2 : 0), 0, x + w * .45, y, -.0012); }
  const eix = []; for (let i = 0; i < N; i++) { const a = i * 3; eix.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
  eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eg.setIndex(eix); eg.computeVertexNormals(); const edge = new THREE.Mesh(eg, edgeMat); edge.position.y = .035; edge.material.side = THREE.DoubleSide; sword.add(edge);
  const habaki = new THREE.Mesh(new THREE.BoxGeometry(.036, .03, .011), brass); habaki.position.y = .03; sword.add(habaki);
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(D.female ? .044 : .04, D.female ? .044 : .04, .007, D.female ? 5 : 6), brass); tsuba.rotation.y = Math.PI / 6; tsuba.position.y = .012; sword.add(tsuba);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.0145, .0165, .25, 10), wrap); grip.position.y = -.12; grip.scale.z = .78; sword.add(grip);
  for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.OctahedronGeometry(.008), brass); d.scale.set(1, 1.6, .4); d.position.set(0, -.02 - i * .026, .0128); sword.add(d); }
  const kashira = new THREE.Mesh(new THREE.SphereGeometry(.017, 10, 6), brass); kashira.scale.set(1, .6, .8); kashira.position.y = -.248; sword.add(kashira);
  sword.traverse(o => { if (o.isMesh) o.castShadow = true; });
}
const saya = new THREE.Group(); saya.name = 'saya';
{ const s = new THREE.Mesh(new THREE.CylinderGeometry(.017, .021, .78, 10), lacquer); s.scale.z = .62; s.position.y = .39; saya.add(s); const k = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .03, 10), brass); k.scale.z = .62; k.position.y = .015; saya.add(k); const cord = new THREE.Mesh(new THREE.TorusGeometry(.03, .005, 6, 14), new THREE.MeshToonMaterial({ color: D.cord, gradientMap: ramp })); cord.position.set(0, .12, .02); saya.add(cord); }
// scabbard rides the left hip, mouth forward, edge up
saya.position.set(.15 * S - J.hips[0], .99 * S - J.hips[1], .11 * S); saya.rotation.set(-1.95, 0, .2); bones.hips.add(saya);
// grip pose: the sword's handle axis runs through the right fist
const gripAnchor = new THREE.Object3D(); gripAnchor.name = 'grip';
{ const w = J.handR, f = J.forearmR, d = new THREE.Vector3(w[0] - f[0], w[1] - f[1], w[2] - f[2]).normalize(); gripAnchor.position.copy(d.clone().multiplyScalar(.072 * S)).add(new THREE.Vector3(-.006, 0, .01)); gripAnchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, .25, 1).normalize()); bones.handR.add(gripAnchor); }
const sheathAnchor = new THREE.Object3D(); sheathAnchor.name = 'sheathed'; sheathAnchor.position.set(0, .012, 0); saya.add(sheathAnchor);
let drawn = false;
function setDrawn(on) { drawn = !!on; (drawn ? gripAnchor : sheathAnchor).add(sword); sword.position.set(0, drawn ? .06 : 0, 0); sword.rotation.set(0, 0, 0); }
setDrawn(false);
const tipLocal = new THREE.Vector3(.022, .775, 0), baseLocal = new THREE.Vector3(0, .07, 0);

group.userData = {
  design: which, name: D.name, title: D.title, colors: D, bones, skeleton, mesh, ink, sword, saya, uniforms,
  face: { draw: drawFace, texture: faceTex }, setDrawn, get drawn() { return drawn; },
  bladePoints(tip, base) { sword.updateWorldMatrix(true, false); tip.copy(tipLocal).applyMatrix4(sword.matrixWorld); base.copy(baseLocal).applyMatrix4(sword.matrixWorld); },
  breakdown: all.map(m => m.idx.length / 3), restPositions: J, height: 1.7 * S, triangles: ix.length / 3, nativeSize: [1.2 * S, 1.72 * S, .6 * S],
};
return group;
}
