// Duel frame-rate probe: no screenshots, samples fps/draws/state every 0.8 s, forces an art mid-way.
import puppeteer from 'puppeteer';
const b=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});const p=await b.newPage();await p.setViewport({width:1280,height:720});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4186/?v='+Date.now());await p.waitForFunction(()=>window.__READY__,{timeout:180000});await p.evaluate(()=>window.__START__());await new Promise(r=>setTimeout(r,1500));
await p.evaluate(()=>{const a=window.__SCENE__.getRegion().arena,c=a.center,h=Math.min(...a.size)/2,rv=window.__SCENE__.combat.rival.position;window.__PLACE__([c[0],1.68+rv.y,c[2]+h*.35],[rv.x,1.4+rv.y,rv.z]);});
await new Promise(r=>setTimeout(r,500));await p.evaluate(()=>window.__DUEL__.start());const out=[];
for(let i=0;i<14;i++){await new Promise(r=>setTimeout(r,800));if(i==4){await p.evaluate(()=>{window.__DUEL__.force('rival','noai');window.__DUEL__.force('hero','art');});}out.push(await p.evaluate(()=>[Math.round(window.__GAME__.fps),window.__GAME__.draws,window.__GAME__.duel.hero.anim,window.__GAME__.duel.rival.anim,Math.round(window.__GAME__.duel.rival.hp)]));}
console.log(JSON.stringify(out),errs);await b.close();
