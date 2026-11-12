// Drives a real spar: walks into a region's battle ground, starts the duel, lets both fighters
// fight on their own and also presses the player's controls. Saves frames to evidence/duel/.
// node tools/duel-test.mjs [--port 4186] [--regions sanctuary,city-avenue] [--dpr 1]
import puppeteer from 'puppeteer';import fs from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const port=arg('port','4186'),out=arg('out','evidence/duel'),regions=arg('regions','sanctuary').split(',');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage();await page.setViewport({width:1280,height:760,deviceScaleFactor:+arg('dpr',1)});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const pause=ms=>new Promise(r=>setTimeout(r,ms));const report={regions:[],errors};
try{
 await page.goto(`http://127.0.0.1:${port}/?v=${Date.now()}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__READY__||window.__LOAD_ERROR__,{timeout:180000});
 const le=await page.evaluate(()=>window.__LOAD_ERROR__);if(le)throw Error(le);
 await page.evaluate(()=>window.__START__());await pause(1500);
 for(const region of regions){
  const r={region,shots:[]};report.regions.push(r);
  if(region!=='sanctuary'){await page.evaluate(id=>window.__GO__(id),region);await page.waitForFunction(id=>window.__GAME__?.realm===id&&!window.__GAME__.realmLoading,{timeout:240000},region);await pause(1500);}
  // explore shot: walk a few steps so the follow camera settles behind Haru
  await page.keyboard.down('w');await pause(900);await page.keyboard.up('w');await pause(500);
  let f=`${out}/${region}-explore.png`;await page.screenshot({path:f});r.shots.push(f);
  // stand inside the battle ground facing Mitsuki
  await page.evaluate(()=>{const a=window.__SCENE__.getRegion().arena,c=a.center,h=Math.min(...a.size)/2,rv=window.__SCENE__.combat.rival.position;window.__PLACE__([c[0],1.68+rv.y,c[2]+h*.35],[rv.x,1.4+rv.y,rv.z]);});
  await pause(700);
  r.prompt=await page.$eval('#interact-text',e=>e.textContent).catch(()=>null);
  await page.keyboard.press('e');await pause(1800);
  f=`${out}/${region}-stance.png`;await page.screenshot({path:f});r.shots.push(f);
  r.started=await page.evaluate(()=>window.__DUEL__.state().active);
  // the player's own strikes: a 4-hit chain
  for(let i=0;i<4;i++){await page.keyboard.press('f');await pause(240);}
  await pause(120);f=`${out}/${region}-combo.png`;await page.screenshot({path:f});r.shots.push(f);
  await pause(900);
  // let them spar on their own and sample frames
  await page.evaluate(()=>window.__DUEL__.auto(true));
  const fps=[];for(let i=0;i<8;i++){await pause(650);f=`${out}/${region}-spar-${i}.png`;await page.screenshot({path:f});r.shots.push(f);fps.push(await page.evaluate(()=>Math.round(window.__GAME__.fps)));}
  r.fps=fps;r.state=await page.evaluate(()=>window.__DUEL__.state());
  await page.evaluate(()=>window.__DUEL__.stop());await pause(400);
 }
}catch(e){report.failure=e.message;}
finally{console.log(JSON.stringify(report,null,1));await browser.close();}
