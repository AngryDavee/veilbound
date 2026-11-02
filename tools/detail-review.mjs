import puppeteer from 'puppeteer';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{await page.goto('http://127.0.0.1:4186/',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__READY__||window.__LOAD_ERROR__,{timeout:90000});if(await page.evaluate(()=>window.__LOAD_ERROR__))throw Error(await page.evaluate(()=>window.__LOAD_ERROR__));await new Promise(r=>setTimeout(r,2000));await page.screenshot({path:'evidence/detail-title.png'});await page.click('#enter');const reports=[];
for(const view of ['interior','water','garden','shrine','arrival']){await page.keyboard.press('v');await page.click(`#views [data-view="${view}"]`);await new Promise(r=>setTimeout(r,3000));await page.screenshot({path:`evidence/detail-${view}.png`});reports.push({view,...await page.evaluate(()=>window.__GAME__)});}
console.log(JSON.stringify({errors,reports},null,2));fs.writeFileSync('evidence/detail-review.json',JSON.stringify({errors,reports},null,2));assert.equal(errors.length,0,errors.join('\n'));}finally{await browser.close();}
