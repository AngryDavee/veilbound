// World V · Region 3 — The Burning Rooftops.
// A flat ridge-tiled roof terrace above the burning quarter, reached by drying decks. All around and
// below, teahouse roofs burn; smoke columns climb into a red sky. To the north, the scorched fire-watch
// tower stands on its deck with a paper counterfeit where its alarm bell should hang.
import * as THREE from 'three';
import { kit } from '../kit.js';
import { nightSky } from '../atmosphere.js';
import { clues } from './story.js';
import { VERTICAL, HORIZONTAL } from './gate.js';
import { collector, quarterMaterials, signAtlas, teahouse, chochin, glowPoints, fireTower, motes, rng, slope, flames, smokePuffs, streetProps } from './qkit.js';

const STREET=-9.5;
export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Climbing above the fire');
 const k=await kit(root,5303),M=quarterMaterials(k),S=signAtlas(VERTICAL,HORIZONTAL),C=collector(),glows=[],r=rng(5303),trunks=[];
 const sky=nightSky(root,{top:0x1e1230,horizon:0x6a2a1c,glow:0x5a2a22,moonDir:[-.5,.32,-.8],moonColor:0xffb890,moonSize:42,clouds:.6,cloudColor:0x1e1220,stars:500,starBrightness:.5});
 const charred=k.surface('cedar',0x1a1412,1,.95),scorch=k.surface('plaster',0x5a4438,2,.95),ember=new THREE.MeshStandardMaterial({color:0x3a0c04,emissive:0xff4a10,emissiveIntensity:1.4,roughness:1});

 // ---------- the roof terrace: a flat ridge-tiled plateau with slopes falling to the street ----------
 const deckTile=new THREE.PlaneGeometry(25,23);{const uv=deckTile.attributes.uv;for(let q=0;q<uv.count;q++)uv.setXY(q,uv.getX(q)*25/1.1,uv.getY(q)*23/.6);}C.geo(M.tile,deckTile,0,0,0,-Math.PI/2);
 for(let x=-12;x<=12;x+=2.4)C.box(M.ridge,.18,.08,23,x,.04,0);// copper ridge strips set in the tiles
 for(const s of [-1,1]){slope(C,M,{w:25.4,z0:s*11.5,y0:0,z1:s*15.5,y1:-1.9,sori:.1,corner:.2});C.with(0,0,0,Math.PI/2,()=>slope(C,M,{w:23.4,z0:s*12.5,y0:0,z1:s*16.5,y1:-1.9,sori:.1,corner:.2}));
  const hh=-1.9-STREET;C.box(scorch,26,hh,.4,0,STREET+hh/2,s*14.8);C.box(scorch,.4,hh,24,s*15.8,STREET+hh/2,0);for(let q=-2;q<=2;q++){C.box(M.shoji,1.6,1.4,.05,q*4.6,STREET+3.2,s*15.03);C.box(M.shoji,.05,1.4,1.6,s*16.03,STREET+3.2,q*4.4);}
  C.box(M.ridge,25.4,.32,.5,0,.1,s*11.6);C.box(M.ridge,.5,.32,23.2,s*12.6,.1,0);
  for(const t of [-1,1]){C.box(M.ridge,.6,.9,.6,s*12.6,.45,t*11.6);C.box(M.ridge,.3,.4,.7,s*12.65,1.05,t*11.6,0,0,s*.4);}}
 // ---------- drying decks (monohoshi) on posts ----------
 const deck=(x0,x1,z0,z1,rails=true)=>{for(let z=Math.min(z0,z1);z<Math.max(z0,z1);z+=.3)C.box(M.timber,x1-x0,.08,.28,(x0+x1)/2,-.04,z+.15);
  for(let x=x0+.2;x<x1;x+=Math.max(2,(x1-x0)/3))for(let z=Math.min(z0,z1)+.5;z<Math.max(z0,z1);z+=3.2){C.box(charred,.18,-STREET,.18,x,STREET/2,z);}
  for(const z of [z0,z1])C.box(charred,x1-x0,.2,.2,(x0+x1)/2,-.2,z);
  if(rails)for(const x of [x0,x1]){const len=Math.abs(z1-z0),zc=(z0+z1)/2;C.box(M.timber,.08,.08,len,x,1,zc);C.box(M.timber,.06,.06,len,x,.5,zc);for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z+=1.6)C.box(charred,.1,1.05,.1,x,.5,z);}};
 deck(-2.3,2.3,11.5,34);deck(-2.3,2.3,-19,-11.5);deck(-6.5,9.5,-36,-19,false);
 for(const x of [-6.5,9.5]){C.box(M.timber,.08,.08,17,x,1,-27.5);for(let z=-36;z<=-19;z+=1.7)C.box(charred,.1,1.05,.1,x,.5,z);}C.box(M.timber,16,.08,.08,1.5,1,-36);
 // drying poles with scorched cloth still hanging
 for(const z of [18,30]){C.box(charred,.08,2.4,.08,-2.1,1.2,z);C.box(charred,.08,2.4,.08,2.1,1.2,z);C.box(M.bamboo,4.4,.06,.06,0,2.35,z);for(const sx of [-1.65,1.65])C.geo(r()<.5?M.norenRed:M.noren,new THREE.PlaneGeometry(.55,.7),sx*1.05,1.95,z+.02);}

 progress(.3,'The quarter burns below');
 // ---------- surrounding teahouses at street level, many on fire ----------
 const fireList=[],smokeList=[],fireLights=[];let n=0;
 for(let gx=-66;gx<=66;gx+=11.5)for(let gz=-74;gz<=62;gz+=11){const x=gx+(r()-.5)*2,z=gz+(r()-.5)*2;
  if(Math.abs(x)<26&&Math.abs(z)<24)continue;if(Math.abs(x)<15&&z>4&&z<44)continue;if(x>-18&&x<22&&z<-8&&z>-48)continue;
  const floors=r()<.3?3:2,w=9+r()*1.5,ry=[0,Math.PI/2,Math.PI,-Math.PI/2][Math.floor(r()*4)],burning=r()<.55;
  C.with(0,STREET,0,0,()=>teahouse(C,M,S,glows,{x,z,ry,w,d:8.5,floors,seed:700+n,sign:burning?-1:n%16,latticeMat:burning?charred:M.lattice,wall:burning?scorch:[M.plaster,M.plasterOchre,M.boardWall][n%3]}));
  const top=STREET+.32+3.15+2.7+(floors>2?2.45:0)+1.2;
  if(burning){const cnt=2+Math.floor(r()*3);for(let q=0;q<cnt;q++)fireList.push({x:x+(r()-.5)*w*.8,y:top-1.5+r(),z:z+(r()-.5)*6,w:3.5+r()*3.5,h:5+r()*7,seed:r()});
   fireList.push({x:x+(r()-.5)*3,y:STREET+.5,z:z+(r()-.5)*3,w:5,h:4+r()*3,seed:r()});
   if(r()<.55)smokeList.push({x,y:top+1,z,size:6+r()*5,rise:26+r()*18});
   for(let q=0;q<4;q++)glows.push([x+(r()-.5)*w,top-1+r()*2,z+(r()-.5)*6,1,.45,.12,7+r()*5]);
   fireLights.push([x,top+1.5,z]);}
  n++;}
 // collapsed, charred house frames in the near ring
 for(const [x,z,ry] of [[-21,-6,.3],[21,4,-.2],[-8,21,1.2],[20,-18,.8]]){C.with(x,STREET,z,ry,()=>{for(let i=0;i<7;i++){const a=r()*6.28;C.beam(charred,[(r()-.5)*7,0,(r()-.5)*6],[(r()-.5)*7,4+r()*4,(r()-.5)*6],.2);}C.box(ember,6,.4,5,0,.2,0);});
  fireList.push({x,y:STREET+.3,z,w:7,h:6+r()*3,seed:r()});glows.push([x,STREET+2,z,1,.4,.1,12]);}
 // the far skyline of the quarter, burning against the hills, and the snowy peaks to the north
 for(let q=0;q<46;q++){const a=q/46*Math.PI*2,d=95+r()*30,x=Math.cos(a)*d,z=Math.sin(a)*d;fireList.push({x,y:STREET+3+r()*4,z,w:7+r()*6,h:8+r()*10,seed:r()});if(q%3===0)smokeList.push({x,y:STREET+8,z,size:12+r()*6,rise:45+r()*20});glows.push([x,STREET+6,z,1,.42,.12,14]);}
 for(let q=0;q<11;q++){const x=-300+q*60,z=-430-r()*60;const peak=new THREE.Mesh(new THREE.ConeGeometry(90+r()*50,110+r()*70,7),new THREE.MeshBasicMaterial({color:0x160c10,fog:false}));peak.position.set(x,-20,z);peak.scale.z=.5;root.add(peak);}

 progress(.55,'The tower without its bell');
 // ---------- fire-watch tower on its deck; a painted paper bell hangs where the bronze one was ----------
 fireTower(C,M,glows,5.5,-27.5,{h:13,scorched:true});trunks.push([5.5,-27.5,2.75]);
 chochin(C,M,glows,5.5,14.3,-27.5,{s:.5,kind:'white',cord:.15});
 // ladder down at the north end and a sign pointing to the mountains
 for(const s of [-1,1])C.box(charred,.08,7,.08,s*.4,STREET/2+.4,-36.3);for(let y=STREET;y<0;y+=.4)C.box(charred,.8,.05,.05,0,y,-36.3);
 C.box(charred,.12,2.2,.12,-3,1.1,-35.5);C.geo(S.vertical,S.vGeo(15,.5,1.4),-3,1.4,-35.43);
 // the Dancer's dropped mask on the tiles
 const porcelain=new THREE.MeshStandardMaterial({color:0xf2ece2,roughness:.3});for(const s of [-1,1])C.geo(porcelain,new THREE.SphereGeometry(.18,14,10,0,Math.PI),-10+s*.25,.05,4,-Math.PI/2,0,s*.5,1,.4,1.3);
 // fire buckets and spilt water on the south deck, outside the arena
 for(const t of streetProps(C,M,S,glows,[['buckets',-1.2,31.5,0],['barrel',1.4,13.6]],r))trunks.push(t);
 // glowing coals and scattered embers beyond the plateau edges
 for(let q=0;q<40;q++){const a=r()*6.28,d=13+r()*2.5;C.box(ember,.2+r()*.3,.06,.2+r()*.3,Math.cos(a)*d*1.05,-.4-r()*.8,Math.sin(a)*d);}

 progress(.8,'Embers on the wind');
 C.build(root,{skipShadow:[]});k.finish();
 const glow=glowPoints(root,glows,renderer);
 const fire=flames(root,fireList),smk=smokePuffs(root,smokeList,{color:[.08,.06,.1],under:[.8,.32,.12],opacity:.72,puffs:8});
 const embers=motes(root,renderer,{kind:'ember',rise:true,count:2200,area:[64,32,64],speed:1.8,size:.07,drift:2.2,base:STREET,fade:34,colorA:[1,.45,.1],colorB:[1,.8,.35],seed:55});
 fireLights.sort((a,b)=>Math.hypot(a[0],a[2])-Math.hypot(b[0],b[2]));
 const lights=fireLights.slice(0,6).map(([x,y,z])=>{const l=new THREE.PointLight(0xff6a20,140,60,1.6);l.position.set(x,y,z);root.add(l);return l;});
 for(const [x,y,z,p] of [[0,6,0,60],[5.5,10,-24,40]]){const l=new THREE.PointLight(0xff8a40,p,40,1.6);l.position.set(x,y,z);root.add(l);lights.push(l);}

 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 const canWalk=(x,z)=>{if(trunks.some(([a,b,rr])=>Math.hypot(x-a,z-b)<rr))return false;return inR(x,z,-12.3,12.3,-11.3,11.3)||inR(x,z,-2,2,11,33.6)||inR(x,z,-2,2,-19.5,-11)||inR(x,z,-6.1,9.1,-35.6,-19);};
 progress(.97,'The quarter is burning');
 return {texturesLoaded:14,grassBlades:0,trunks:[],discoveries:clues['quarter-rooftops'],
  views:{arrival:{pos:[0,2.1,31],look:[0,3,0],name:'The drying deck',sub:'Above the flames, the roofs become a road.'},plaza:{pos:[-9,2.6,9],look:[8,3,-8],name:'The ridge-tile plaza',sub:'A future battle ground in the firelight.'},tower:{pos:[-4.5,2.2,-13],look:[5.5,7,-27.5],name:'The empty fire tower',sub:'A paper bell hangs where the bronze one rang.'},burning:{pos:[11,2.4,-9],look:[40,-2,-30],name:'The quarter burning',sub:'No warning bell was ever rung.'}},
  canWalk,walkHeight:()=>0,
  locationAt(x,z){return z>11?'The drying deck':z<-18?'The fire-watch deck':'The ridge-tile plaza';},
  update(t,dt,cam){const c=cam||camera;sky.update(t,c);glow.update(t,c);fire.update(t);smk.update(t);embers.update(t,c);lights.forEach((l,i)=>{l.intensity=(i<6?140:i===6?60:40)*(.75+.25*Math.sin(t*(6+i)+i*1.7)*Math.sin(t*(2.3+i*.4)));});},
  setEvening(){}};
}
