// Filmstrips of fighter clips from the lab, one labelled contact sheet per clip.
// node tools/clip-strip.mjs --port 4186 --who haru --clips c1,c2 --cams three,side --n 8 [--moves next] [--out evidence/strips]
import puppeteer from 'puppeteer'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4186'), who = arg('who', 'haru'), clips = arg('clips', 'c1').split(','), cams = arg('cams', 'three').split(','), n = +arg('n', 8), moves = arg('moves', ''), out = arg('out', 'evidence/strips');
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'strip-')); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: +arg('w', 420), height: +arg('h', 520), deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const sheets = [];
for (const clip of clips) for (const cam of cams) {
  await page.goto(`http://127.0.0.1:${port}/lab/index.html?who=${who}&cam=${cam}&clip=${clip}&t=0${moves ? '&moves=' + moves : ''}&v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__LAB__?.ready, { timeout: 60000 });
  const dur = await page.evaluate(() => { const m = window.__LAB__.mixers[0]; return m.clip.dur || 1; });
  const frames = [];
  for (let i = 0; i < n; i++) {
    const t = dur * i / (n - 1);
    await page.evaluate(t => window.__LAB__.setT(t), t); await new Promise(r => setTimeout(r, 120));
    const f = path.join(tmp, `${clip}-${cam}-${String(i).padStart(2, '0')}_${t.toFixed(2)}.png`); await page.screenshot({ path: f }); frames.push(f);
  }
  const sheet = path.join(out, `${who}-${clip}-${cam}.jpg`);
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=min(len(ims),${n <= 8 ? n : 8}); rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*h),'black'); d=ImageDraw.Draw(S)
for i,(im,f) in enumerate(zip(ims,fs)):
  x,y=(i%cols)*w,(i//cols)*h; S.paste(im,(x,y)); d.rectangle([x,y,x+70,y+16],fill='black'); d.text((x+3,y+2),f.split('_')[-1][:-4]+'s',fill='yellow')
S.save(out,quality=85)`, sheet, ...frames]);
  sheets.push(sheet);
}
console.log(JSON.stringify({ sheets, errors }, null, 1)); await browser.close(); fs.rmSync(tmp, { recursive: true, force: true });
