// The whole campaign: seven worlds, played in order. Each world owns its regions, clues and
// future battle grounds. Exits chain every region to the next, across world boundaries.
import { chapters as valleyChapters, realmClues as valleyClues } from './story.js';
import * as city from './city/story.js';
import * as ridge from './ridge/story.js';
import * as express from './express/story.js';
import * as quarter from './quarter/story.js';
import * as springs from './springs/story.js';
import * as keep from './keep/story.js';

const valley={
 world:{id:'valley',number:'I',name:'The Valley of Silent Bells',herald:'—',summary:'Your sibling, a Veil Warden, has vanished from the mountain sanctuary. Follow their trail through forest and river town to the Folded Court.',accent:'#d9c59b',card:'#20382e'},
 regions:{
  sanctuary:{...valleyChapters.sanctuary,module:null},
  cedar:{...valleyChapters.cedar,module:'./realms/forest.js',factory:'createForest'},
  reedwater:{...valleyChapters.reedwater,module:'./realms/village.js',factory:'createVillage'},
  folded:{...valleyChapters.folded,module:'./realms/castle.js',factory:'createCastle'}
 },
 clues:{cedar:valleyClues.cedar,reedwater:valleyClues.reedwater,folded:valleyClues.folded}
};

export const worlds=[valley,city,ridge,express,quarter,springs,keep].map(w=>({...w.world,regionIds:Object.keys(w.regions)}));
const sources=[valley,city,ridge,express,quarter,springs,keep];

const normSky=s=>s===true?'day':s===false?'none':(s||'day');
export const regions={};
export const regionOrder=[];
export const regionClues={};
for(const src of sources){const w=src.world;let i=0;for(const [id,r] of Object.entries(src.regions)){i++;regions[id]={...r,id,world:w.id,worldNumber:w.number,worldName:w.name,index:i,number:r.number||String(i),theme:{...r.theme,sky:normSky(r.theme.sky)}};regionOrder.push(id);regionClues[id]=src.clues?.[id]||[];}}
// Chain exits through the whole campaign; the final region leads home to the sanctuary.
regionOrder.forEach((id,i)=>{const r=regions[id];r.next=regionOrder[i+1]||'sanctuary';r.previous=i?regionOrder[i-1]:null;});
export const allClues=regionOrder.flatMap(id=>regionClues[id]);
export const worldOf=id=>worlds.find(w=>w.id===regions[id].world);
