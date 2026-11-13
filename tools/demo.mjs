// Live gameplay demo in a visible Chrome window: a tour of several worlds with a full duel in each —
// sword combos, kicks, a launch and air chase, a throw, a blade lock, special arts, then both fighters on AI.
// The window stays open afterwards with the game playable; closing it ends this script.
// node tools/demo.mjs [--port 4186] [--regions sanctuary,city-avenue,...] [--auto 9]
import puppeteer from 'puppeteer';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4186'), regions = arg('regions', 'sanctuary,city-avenue,quarter-rooftops,springs-forge,keep-meridian').split(','), autoSecs = +arg('auto', 9);
const pause = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: false, defaultViewport: null,
  args: ['--window-size=1440,900', '--start-maximized', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist'], ignoreDefaultArgs: ['--enable-automation'] });
browser.on('disconnected', () => process.exit(0));
const [page] = await browser.pages();
page.on('pageerror', e => console.log('page error:', e.message));
const tap = async (k, hold = 70) => { await page.keyboard.down(k); await pause(hold); await page.keyboard.up(k); };
const force = (w, x) => page.evaluate((w, x) => window.__DUEL__.force(w, x), w, x);
const caption = t => page.evaluate(t => { let el = document.getElementById('demo-caption'); if (!el) { el = document.createElement('div'); el.id = 'demo-caption';
  el.style.cssText = 'position:fixed;left:50%;bottom:52px;transform:translateX(-50%);z-index:9999;padding:9px 20px;border-radius:999px;background:rgba(10,12,18,.72);color:#f3e7cf;font:600 14px/1.2 system-ui,sans-serif;letter-spacing:.06em;pointer-events:none;transition:opacity .4s'; document.body.appendChild(el); }
  el.textContent = t; el.style.opacity = t ? 1 : 0; }, t);
const phase = () => page.evaluate(() => window.__DUEL__ && window.__SCENE__.combat.phase);
try {
  await page.goto(`http://127.0.0.1:${port}/?v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__READY__ || window.__LOAD_ERROR__, { timeout: 180000 });
  await pause(1000); await page.evaluate(() => window.__START__()); await pause(1400);
  for (const [n, region] of regions.entries()) {
    if (region !== 'sanctuary') { await caption('Travelling…'); await page.evaluate(id => window.__GO__(id), region);
      await page.waitForFunction(id => window.__GAME__?.realm === id && !window.__GAME__.realmLoading, { timeout: 240000 }, region); await pause(1000); }
    const name = await page.evaluate(() => window.__SCENE__.getRegion()?.name || ''); await caption(name);
    await page.keyboard.down('w'); await pause(1200); await page.keyboard.up('w'); await pause(400);
    await page.evaluate(() => { const a = window.__SCENE__.getRegion().arena, c = a.center, h = Math.min(...a.size) / 2, rv = window.__SCENE__.combat.rival.position; window.__PLACE__([c[0], 1.68 + rv.y, c[2] + h * .35], [rv.x, 1.4 + rv.y, rv.z]); });
    await pause(500); await page.evaluate(() => window.__DUEL__.start()); await caption('');
    for (let i = 0; i < 60 && await phase() !== 'fight'; i++) await pause(100);
    await pause(300);
    // Haru closes the distance with a dash, then a five-cut sword chain
    await page.keyboard.down('w'); await tap(' '); await page.keyboard.up('w'); await pause(260);
    for (let i = 0; i < 5; i++) { await tap('f'); await pause(230); }
    await pause(700);
    // kick into the shoulder charge
    await tap('g'); await pause(320); await tap('g'); await pause(900);
    // rising launcher, jump after them, plunging air cut
    await page.keyboard.down('s'); await tap('f'); await page.keyboard.up('s'); await pause(330); await tap('c'); await pause(260); await tap('f'); await pause(1300);
    // set pieces: a blade lock, or a special art, alternating by world
    if (n % 3 === 1) { await force('x', 'lock'); for (let i = 0; i < 16; i++) { await tap('f', 40); await pause(90); } await pause(900); }
    else if (n % 3 === 0) { await force('hero', 'art'); await pause(3400); }
    else { await force('rival', 'art'); await pause(3400); }
    await force('hero', 'grab'); await pause(1600);
    // then both fighters on their own
    await page.evaluate(() => window.__DUEL__.auto(true)); await caption(name + ' · both fighters on AI');
    if (n === regions.length - 1) { await pause(3000); await force('hero', 'art'); }
    await pause(autoSecs * 1000);
    await page.evaluate(() => window.__DUEL__.stop()); await caption(''); await pause(800);
  }
  await page.evaluate(() => window.__GO__('sanctuary'));
  await page.waitForFunction(() => window.__GAME__?.realm === 'sanctuary' && !window.__GAME__.realmLoading, { timeout: 240000 });
  await caption('Your turn: walk onto the battle ground and press E · F sword · G kick · E throw · Q guard/parry · Space dash · C jump · R art'); await pause(9000); await caption('');
  console.log('demo finished; window left open and playable');
} catch (e) { console.log('demo failed:', e.message); }
