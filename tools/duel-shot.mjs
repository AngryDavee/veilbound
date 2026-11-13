// Plays a real duel with the new combat (?next) and captures frames plus a state log.
// node tools/duel-next-shot.mjs --port 4186 --region sanctuary --secs 14 --every .35 --out <dir> [--player 1]
import puppeteer from 'puppeteer'; import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4186'), region = arg('region', 'sanctuary'), secs = +arg('secs', 14), every = +arg('every', .35), out = arg('out', 'evidence/duel-next'), player = arg('player', '1') === '1';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: +arg('w', 1280), height: +arg('h', 720), deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
const pause = ms => new Promise(r => setTimeout(r, ms)); const log = [];
try {
  await page.goto(`http://127.0.0.1:${port}/?v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__READY__ || window.__LOAD_ERROR__, { timeout: 180000 });
  const le = await page.evaluate(() => window.__LOAD_ERROR__); if (le) throw Error(le);
  await page.evaluate(() => window.__START__()); await pause(1200);
  if (region !== 'sanctuary') { await page.evaluate(id => window.__GO__(id), region); await page.waitForFunction(id => window.__GAME__?.realm === id && !window.__GAME__.realmLoading, { timeout: 240000 }, region); await pause(1200); }
  await page.evaluate(() => { const a = window.__SCENE__.getRegion().arena, c = a.center, h = Math.min(...a.size) / 2, rv = window.__SCENE__.combat.rival.position; window.__PLACE__([c[0], 1.68 + rv.y, c[2] + h * .35], [rv.x, 1.4 + rv.y, rv.z]); });
  await pause(600); await page.evaluate(() => window.__DUEL__.start());
  const t0 = Date.now(); let i = 0, nextShot = 0;
  const script = player ? [[3.2, 'f'], [3.45, 'f'], [3.7, 'f'], [3.95, 'f'], [4.3, 'f'], [5.6, 'g'], [5.9, 'g'], [7.0, 's+f'], [7.4, 'c'], [7.7, 'f'], [9.0, 'auto']] : [[2.8, 'auto']];
  if (arg('script')) script.splice(0, script.length, ...arg('script').split(',').map(e => { const [t, w, x] = e.split(':'); return [+t, x ? 'force:' + w + ':' + x : w]; }));
  let si = 0;
  while ((Date.now() - t0) / 1000 < secs) {
    const t = (Date.now() - t0) / 1000;
    while (si < script.length && t >= script[si][0]) {
      const k = script[si][1]; si++;
      if (k === 'auto') await page.evaluate(() => window.__DUEL__.auto(true));
      else if (k.startsWith('force:')) { const [, w, x] = k.split(':'); await page.evaluate((w, x) => window.__DUEL__.force(w, x), w, x); }
      else if (k === 's+f') { await page.keyboard.down('s'); await page.keyboard.press('f'); await page.keyboard.up('s'); }
      else await page.keyboard.press(k);
    }
    if (t >= nextShot) { nextShot += every; const st = await page.evaluate(() => ({ d: window.__GAME__.duel, cam: window.__SCENE__.director?.mode, fps: Math.round(window.__GAME__.fps) })); log.push({ t: +t.toFixed(2), ...st }); await page.screenshot({ path: `${out}/f${String(i++).padStart(3, '0')}_${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 70 }); }
    else await pause(15);
  }
} catch (e) { errors.push('FAIL ' + e.message); }
fs.writeFileSync(`${out}/log.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify({ frames: log.length, errors: [...new Set(errors)].slice(0, 20), last: log.at(-1) }, null, 1)); await browser.close();
