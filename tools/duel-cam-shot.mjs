// Frames from the duel camera lab at chosen timeline times.
// node tools/duel-cam-shot.mjs [--port 4192] [--times 1,3.5,7.2] [--out evidence/duel-cam] [--tag r1-] [--width 1280 --height 720]
import puppeteer from 'puppeteer'; import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4192'), out = arg('out', 'evidence/duel-cam'), tag = arg('tag', '');
const times = arg('times', '0.4,1.6,4,5.2,5.62,7.3,8.4,11.5,12.7,13.5,14.35,14.9,16.4,19,20.3,20.9,21.6,22.6,26.0,29.5,31.5,32.6').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: +arg('width', 1280), height: +arg('height', 720), deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/lab/duel-cam.html?pause=1&${arg('q','')}&v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__CAM__?.ready, { timeout: 120000 });
const files = [];
for (const t of times) {
  const mode = await page.evaluate(t => window.__CAM__.seek(t), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const f = `${out}/${tag}t${t.toFixed(2).padStart(5, '0')}-${mode}.png`; await page.screenshot({ path: f }); files.push(f);
}
console.log(JSON.stringify({ files, errors }, null, 1)); await browser.close();
