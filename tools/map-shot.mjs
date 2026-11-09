// Screenshot the world map: node tools/map-shot.mjs --port 4190 --out evidence/worlds/world-map.png
import puppeteer from 'puppeteer';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const b=await puppeteer.launch({headless:true,args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:+arg('width',1440),height:+arg('height',900)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${arg('port','4186')}/`);await p.waitForFunction(()=>window.__READY__,{timeout:120000});await p.waitForSelector('#loading',{hidden:true});await p.click('#world-map-toggle');await new Promise(r=>setTimeout(r,500));
if(arg('scroll'))await p.$eval('#journey',(d,y)=>d.scrollTop=+y,arg('scroll'));await p.screenshot({path:arg('out','evidence/worlds/world-map.png')});console.log(JSON.stringify({errors:errs,regions:await p.$$eval('[data-world]',a=>a.length)}));await b.close();
