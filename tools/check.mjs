import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../game');let count=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='vendor')walk(p);}else if(p.endsWith('.js')){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status)throw Error(r.stderr);count++;}}}
walk(root);
for(const name of ['earth','cedar','stone','rock','tatami','moss','plaster'])for(const map of ['basecolor','normal','roughness']){const p=path.join(root,'textures',`${name}-${map}.png`);if(fs.statSync(p).size<100)throw Error(`Empty texture ${p}`);}
const provenance=JSON.parse(fs.readFileSync(new URL('./recipe-provenance.json',import.meta.url),'utf8'));
for(const [helper,expected] of Object.entries(provenance.sha256)){const actual=createHash('sha256').update(fs.readFileSync(path.join(root,helper))).digest('hex');if(actual!==expected)throw Error(`${helper} differs from pinned recipe ${provenance.commit}`);}
console.log(`${count} modules parse. 21 Atlas PBR maps present. Stock 404 helpers unchanged.`);
