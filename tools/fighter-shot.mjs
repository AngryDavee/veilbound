// Screenshots of the fighter lab. node tools/fighter-shot.mjs --port 4186 --cams front,side,face --q "clip=stance&t=.3" --out evidence/fighters --tag x
import puppeteer from 'puppeteer';import fs from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const port=arg('port','4186'),out=arg('out','evidence/fighters'),cams=arg('cams','front,side,back,face,face2').split(','),extra=arg('q',''),tag=arg('tag','');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage();await page.setViewport({width:+arg('width',1100),height:+arg('height',900),deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
const files=[];let info='';
for(const c of cams){await page.goto(`http://127.0.0.1:${port}/lab/index.html?cam=${c}&${extra}&v=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LAB__?.ready,{timeout:60000}).catch(e=>{console.log(errors);throw e});await new Promise(r=>setTimeout(r,+arg('wait',600)));info=await page.$eval('#info',e=>e.textContent);const f=`${out}/${c}${tag}.png`;await page.screenshot({path:f});files.push(f);}
console.log(JSON.stringify({info,files,errors},null,1));await browser.close();
