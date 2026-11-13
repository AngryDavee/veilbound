// Frozen frames of the anime FX lab. node tools/fx-shot.mjs --port 4191 --fx hit,clash --t .05,.15 --out evidence/fx [--day]
import puppeteer from 'puppeteer'; import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4191'), out = arg('out', 'evidence/fx'), list = arg('fx', 'hit').split(','), ts = arg('t', '.1').split(','), day = process.argv.includes('--day');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: +arg('width', 1280), height: +arg('height', 720), deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()); });
const files = [];
for (const fx of list) for (const t of ts) {
  await page.goto(`http://127.0.0.1:${port}/lab/fx.html?fx=${fx}&t=${t}${day ? '&day=1' : ''}&v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__FX__?.frozen, { timeout: 60000 }).catch(() => errors.push('timeout ' + fx));
  await new Promise(r => setTimeout(r, 150));
  const f = `${out}/${fx}-${t}${day ? '-day' : ''}.png`; await page.screenshot({ path: f }); files.push(f);
}
console.log(JSON.stringify({ files, errors: [...new Set(errors)] }, null, 1)); await browser.close();
