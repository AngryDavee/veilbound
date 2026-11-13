// Frame-rate probe: exploration vs duel vs duel with parts switched off. node tools/perf-probe.mjs
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] }); const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); const w = ms => new Promise(r => setTimeout(r, ms));
const fps = async label => { await w(2200); const v = await p.evaluate(() => [Math.round(window.__GAME__.fps), window.__GAME__.draws, window.__GAME__.tris]); console.log(label.padEnd(28), v.join('  ')); };
await p.goto('http://127.0.0.1:4186/?v=' + Date.now()); await p.waitForFunction(() => window.__READY__, { timeout: 180000 }); await p.evaluate(() => window.__START__());
await fps('explore');
await p.evaluate(() => { const a = window.__SCENE__.getRegion().arena, c = a.center, h = Math.min(...a.size) / 2, rv = window.__SCENE__.combat.rival.position; window.__PLACE__([c[0], 1.68 + rv.y, c[2] + h * .35], [rv.x, 1.4 + rv.y, rv.z]); });
await fps('explore at arena');
await p.evaluate(() => { window.__DUEL__.start(); }); await w(3500); await p.evaluate(() => { window.__DUEL__.force('rival', 'noai'); });
await fps('duel idle');
await p.evaluate(() => { window.__SCENE__.fx.overlay.style.display = 'none'; }); await fps('duel, fx overlay hidden');
await p.evaluate(() => { window.__SCENE__.fx.overlay.style.display = ''; document.querySelector('#duel').hidden = true; }); await fps('duel, HUD hidden');
await p.evaluate(() => { document.querySelector('#duel').hidden = false; window.__SCENE__.combat.fighters.forEach(f => f.trail.m.visible = false); }); await fps('duel, trails off');
await p.evaluate(() => { window.__DUEL__.stop(); }); await fps('after duel');
console.log(errs); await b.close();
