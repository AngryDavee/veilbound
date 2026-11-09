// Walks the whole campaign chain: at every region, stand on the exit portal, press E and confirm the next region loads.
import puppeteer from 'puppeteer';import assert from 'node:assert/strict';
const b=await puppeteer.launch({headless:true,args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1280,height:800});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const pause=ms=>new Promise(r=>setTimeout(r,ms));const hops=[];
try{await p.goto('http://127.0.0.1:4186/');await p.waitForFunction(()=>window.__READY__,{timeout:120000});await p.waitForSelector('#loading',{hidden:true});await p.evaluate(()=>window.__START__());
 let id='sanctuary';for(let i=0;i<23;i++){const r=await p.evaluate(()=>{const r=window.__SCENE__.getRegion(),w=window.__SCENE__.getActiveWorld();return {id:r.id,next:r.next,exit:r.exit,h:w.walkHeight(r.exit[0],r.exit[2])};});
  await p.evaluate(r=>window.__PLACE__([r.exit[0],r.h+1.68,r.exit[2]],[r.exit[0],r.h+1.68,r.exit[2]-5]),r);await pause(400);let label=await p.$eval('#interact-text',e=>e.textContent);
  // An unread clue beside an exit takes priority; read it first, as a player would.
  for(let k=0;k<3&&!label.startsWith('Travel')&&!label.startsWith('Return');k++){await p.keyboard.press('e');await pause(200);if(await p.$eval('#discovery',d=>d.open))await p.click('#keep-note');await pause(400);label=await p.$eval('#interact-text',e=>e.textContent);}
  console.log(r.id,'→',r.next,'|',label);await p.keyboard.press('e');await p.waitForFunction(n=>window.__GAME__?.realm===n&&!window.__GAME__.realmLoading,{timeout:180000},r.next);await p.waitForSelector('#loading',{hidden:true});hops.push(`${r.id} → ${r.next} (${label})`);id=r.next;}
 assert.equal(id,'sanctuary','Chain returns home');assert.equal(errors.length,0,errors.join('\n'));console.log(hops.join('\n'));console.log('Passed: all 23 exits chain through seven worlds and back home.');}
finally{await b.close();}
