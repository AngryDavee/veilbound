// Region inspection for builders: node tools/region-shot.mjs --port 4191 --region city-avenue [--out evidence/worlds/city] [--shots '[{"name":"x","pos":[0,2,0],"look":[0,2,-10]}]'] [--views] [--width 1440 --height 900]
// Requires a server: PORT=4191 node tools/serve.mjs
import puppeteer from 'puppeteer';import fs from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};const has=k=>process.argv.includes('--'+k);
const port=arg('port','4186'),region=arg('region'),out=arg('out','evidence/worlds/'+(region||'x').split('-')[0]),shots=JSON.parse(arg('shots','[]'));
if(!region)throw Error('--region required');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage();await page.setViewport({width:+arg('width',1440),height:+arg('height',900)});
const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url());});
const pause=ms=>new Promise(r=>setTimeout(r,ms));const report={region,shots:[],errors,missing};
try{
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__READY__||window.__LOAD_ERROR__,{timeout:180000});
 await page.evaluate(()=>window.__START__());const t0=Date.now();await page.evaluate(id=>window.__GO__(id),region);
 await page.waitForFunction(id=>window.__GAME__?.realm===id&&!window.__GAME__.realmLoading,{timeout:240000},region).catch(async e=>{throw Error('Region did not load: '+errors.join(' | ')+' '+e.message)});
 report.loadSeconds=(Date.now()-t0)/1000;await page.waitForSelector('#loading',{hidden:true});await pause(2500);
 const snap=async name=>{const f=`${out}/${region}-${name}.png`;await page.screenshot({path:f});const g=await page.evaluate(()=>window.__GAME__);report.shots.push({name,file:f,pos:g.pos,height:g.height,draws:g.draws,tris:g.tris,fps:Math.round(g.fps)});};
 await snap('spawn');
 const nav=await page.evaluate(()=>{const w=window.__SCENE__.getActiveWorld(),g=window.__GAME__;const r=window.__SCENE__.getRegion(),pt=p=>({at:p,walk:w.canWalk(p[0],p[2]),ground:w.walkHeight(p[0],p[2])});return {portals:{spawn:pt(r.spawn),exit:pt(r.exit),returnPoint:pt(r.returnPoint),arenaCenter:pt(r.arena.center)},views:Object.keys(w.views||{}),clues:(w.discoveries||[]).map(d=>({id:d.id,walk:w.canWalk(d.pos[0],d.pos[2]),ground:w.walkHeight(d.pos[0],d.pos[2]),y:d.pos[1]}))};});
 report.portals=nav.portals;report.views=nav.views;report.clues=nav.clues.map(c=>({...c,ok:c.walk&&Math.abs(c.ground+1.68-c.y)<3.5}));
 // Walk forward from spawn using real keys.
 const before=await page.evaluate(()=>window.__GAME__.pos);await page.keyboard.down('w');await pause(1500);await page.keyboard.up('w');const after=await page.evaluate(()=>window.__GAME__.pos);report.walkDistance=Math.hypot(after[0]-before[0],after[1]-before[1]);
 if(has('views'))for(const v of nav.views){await page.evaluate(n=>window.__VIEW__(n),v);await pause(2800);await snap('view-'+v);}
 for(const s of shots){await page.evaluate((p,l)=>window.__PLACE__(p,l),s.pos,s.look);await pause(900);await snap(s.name);}
}catch(e){report.failure=e.message;await page.screenshot({path:`${out}/${region}-failure.png`}).catch(()=>{});}
finally{fs.writeFileSync(`${out}/${region}-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,1));await browser.close();}
