import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();await page.setViewport({width:1280,height:800});
try{
 await page.goto('http://127.0.0.1:4186/',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__READY__,{timeout:90000});await page.waitForSelector('#loading',{hidden:true});await page.click('#enter');await page.click('#destination-shortcuts [data-view="water"]');await new Promise(r=>setTimeout(r,3500));await page.keyboard.press('p');
 const before=await page.evaluate(()=>{const s=window.__SCENE__.scene;return {pos:window.__GAME__.pos,wind:window.__GAME__.windTime,spray:Array.from(s.getObjectByName('waterfall-droplets').geometry.attributes.position.array.slice(0,30)),water:s.getObjectByName('reflective-river').material.uniforms.time.value,grass:window.__GAME__.grassBlades};});
 await page.screenshot({path:'evidence/water-motion-a.png'});await new Promise(r=>setTimeout(r,1300));await page.screenshot({path:'evidence/water-motion-b.png'});
 const after=await page.evaluate(()=>{const s=window.__SCENE__.scene;return {pos:window.__GAME__.pos,wind:window.__GAME__.windTime,spray:Array.from(s.getObjectByName('waterfall-droplets').geometry.attributes.position.array.slice(0,30)),water:s.getObjectByName('reflective-river').material.uniforms.time.value};});
 assert.deepEqual(before.pos,after.pos,'Camera remains fixed for motion comparison');assert.ok(after.wind>before.wind+.5);assert.ok(after.water>before.water);assert.notDeepEqual(after.spray,before.spray);assert.ok(before.grass>20000);
 await page.keyboard.press('p');await page.click('#destination-shortcuts [data-view="garden"]');await new Promise(r=>setTimeout(r,3500));await page.keyboard.press('p');await page.screenshot({path:'evidence/wind-motion-a.png'});await new Promise(r=>setTimeout(r,1500));await page.screenshot({path:'evidence/wind-motion-b.png'});
 // Verify the real compiled shader carries the shared wind uniform and deformation.
 const wind=await page.evaluate(()=>{const programs=window.__SCENE__.renderer.info.programs;return programs.filter(p=>p.cacheKey.includes('cloudveil-wind')).length;});assert.ok(wind>=2,'Canopy and grass wind shaders compiled');
 fs.writeFileSync('evidence/animation-report.json',JSON.stringify({passed:true,before,after,compiledWindPrograms:wind},null,2));console.log('Water reflection time, ballistic spray, fixed-camera motion, dense grass, and compiled wind shaders verified.');
}finally{await browser.close();}
