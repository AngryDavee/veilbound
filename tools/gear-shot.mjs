// Scabbard stress test: every stress pose from several cameras, plus clip sweeps, with the true
// clearance between the saya (and sheathed hilt) and the skinned body.
// node tools/gear-shot.mjs --port 4193 [--poses rest,kneeChamber] [--cams three,front,back,left,top] [--clips walk,run] [--out evidence/gear] [--drawn 0|1|both]
import puppeteer from 'puppeteer'; import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4193'), out = arg('out', 'evidence/gear'); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: +arg('width', 1000), height: +arg('height', 760), deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/lab/gear.html?who=${arg('who', 'both')}&v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__GEAR__?.ready, { timeout: 90000 });
const allPoses = await page.evaluate(() => window.__GEAR__.poses);
const poses = arg('poses', 'all') === 'all' ? allPoses : arg('poses').split(',');
const cams = arg('cams', 'three').split(','), shots = arg('shots', '1') === '1';
const drawnModes = arg('drawn', 'both') === 'both' ? [false, true] : [arg('drawn') === '1'];
const table = [];
for (const drawn of drawnModes) for (const pose of poses) {
  const rep = await page.evaluate((pose, drawn) => window.__GEAR__.set({ pose, drawn, clip: null }), pose, drawn);
  for (const r of rep) table.push({ pose, drawn, ...r });
  if (shots) for (const c of cams) { await page.evaluate(c => window.__GEAR__.set({ cam: c }), c); await new Promise(r => setTimeout(r, 60)); await page.screenshot({ path: `${out}/${pose}${drawn ? '-drawn' : ''}-${c}.png` }); }
}
const clips = arg('clips', '').split(',').filter(Boolean), sweeps = [];
for (const clip of clips) for (const drawn of drawnModes) { await page.evaluate(d => window.__GEAR__.set({ drawn: d, clip: null, pose: 'rest' }), drawn); const r = await page.evaluate(c => window.__GEAR__.sweep(c, 1.6), clip); for (const x of r) if (x) sweeps.push({ drawn, ...x }); }
const fmt = v => v === null || v === undefined ? '  -  ' : (v * 100).toFixed(1).padStart(6);
console.log('pose'.padEnd(13), 'drawn', 'who'.padEnd(8), ' body cm', ' arms cm', ' grnd cm', '  a     b    worst');
for (const r of table) console.log(r.pose.padEnd(13), r.drawn ? '  y  ' : '  n  ', r.who.padEnd(8), fmt(r.body), '  ', fmt(r.arms), '  ', fmt(r.ground), String(r.a).padStart(6), String(r.b).padStart(6), String(r.c).padStart(6), r.worst?.part || '');
for (const r of sweeps) console.log('clip', r.clip.padEnd(9), r.drawn ? 'y' : 'n', r.who.padEnd(8), 'worst body', fmt(r.body), 'at t', r.t, 'arms', fmt(r.arms), 'a', r.a, 'b', r.b, r.worst?.part || '');
fs.writeFileSync(`${out}/clearance.json`, JSON.stringify({ table, sweeps, errors }, null, 1));
if (errors.length) console.log('ERRORS', errors.slice(0, 5));
await browser.close();
