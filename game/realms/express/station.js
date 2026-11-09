import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { nightSky } from '../atmosphere.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { materials, locomotive, tender, carriage, track, steam, glows, gasLamp, telegraphPole, brickTexture, clockTexture, signTexture, rand as r } from './rolling.js';

// Hollowmoor Station — a brick-and-timber Taisho station at one minute to midnight.
// Layout (metres, +Z toward the town): street and forecourt z 7..46 at y=0; the station hall
// x ±12, z ±5.5 at floor y=0.45; the platform x -6.3..5.4, z -6.6..-49 under a cast-iron
// canopy. Track 1 (x=-8.4) holds the waiting express; its engine breathes beyond the platform end.
const FLOOR=.45,RAIL=-.45,T1=-8.4,T2=7.6;
function hipRoof(W,D,H){const w=W/2,d=D/2,rx=Math.max(.01,w-d);const v=[[-w,0,d],[w,0,d],[rx,H,0],[-rx,H,0],[-w,0,-d],[w,0,-d]];const tri=[[0,1,2],[0,2,3],[5,4,3],[5,3,2],[1,5,2],[4,0,3]];const p=[];for(const t of tri)for(const i of t)p.push(...v[i]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const uv=[];for(let i=0;i<p.length;i+=3)uv.push(p[i]*.25,(p[i+2]+p[i+1])*.25);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}

export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Walking through the fog to Hollowmoor');
 const k=await kit(root,4404);const M=materials(k);const {box,cylinder,beam,mesh}=k;
 const sky=nightSky(root,{top:0x05070f,horizon:0x283244,glow:0x4a5068,moonDir:[.36,.4,-.84],moonSize:46,clouds:.45,cloudColor:0x1a2030});
 const brickMap=brickTexture(1,1);const brick=new THREE.MeshStandardMaterial({map:brickMap,color:0xc29a88,roughness:.88,bumpMap:brickMap,bumpScale:1.2});
 const brickBig=brick.clone();brickBig.map=brickMap.clone();brickBig.map.repeat.set(5,2.2);brickBig.bumpMap=brickBig.map;
 const stoneTrim=k.surface('plaster',0xd8d0bc,1,.8),slate=k.surface('stone',0x3b424b,4,.62),copper=new THREE.MeshStandardMaterial({color:0x5d8a7a,metalness:.45,roughness:.5});
 const timber=k.surface('cedar',0x5a4330,1,.8),boards=k.surface('cedar',0x8a6c4c,6,.75),plasterIn=k.surface('plaster',0xd9cdb0,3,.9),cobble=k.surface('stone',0x5f6264,26,.5),pave=k.surface('stone',0x87857c,10,.7);
 const lamps=[];const lampsAt=p=>{lamps.push(p);return p;};

 // ── Ground: street, forecourt, curbs, puddles, drains ──
 const settMap=settTexture();settMap.repeat.set(26,15);const setts=new THREE.MeshStandardMaterial({map:settMap,bumpMap:settMap,bumpScale:1.6,color:0x8a8a86,roughness:.62});
 k.floor(140,80,0,46,0,setts);
 // Wet setts: one low-resolution mirror, masked in the shader to puddles and damp patches that catch the lamps.
 const wet=new Reflector(new THREE.PlaneGeometry(48,38),{textureWidth:640,textureHeight:512,clipBias:.003,multisample:0,color:0xb8c0cc,shader:WET});wet.material.transparent=true;wet.material.depthWrite=false;wet.rotation.x=-Math.PI/2;wet.position.set(0,.014,27);root.add(wet);
 // Kerbs and gutters frame the forecourt.
 for(const s of [-1,1]){box(.35,.16,25,s*24.6,.08,20.8,stoneTrim);box(.5,.02,25,s*24.1,.01,20.8,M.black);}
 k.floor(60,14,0,40,.005,k.surface('earth',0x4d4a44,10,.95));
 for(const z of [33,47])box(60,.16,.35,0,.08,z,stoneTrim);
 for(const s of [-1,1])for(const z of [38.6,41.4])box(70,.03,.07,0,.02,z+s*.53,M.rail);
 for(const x of [-14,-6,6,14]){box(.6,.02,.9,x,.01,32.4,M.black);}
 // Forecourt plinth steps up to the station floor.
 for(let i=0;i<3;i++)box(10-i*.6,.15*(i+1),1.6-i*.5,0,.075*(i+1),7.4-i*.25+.45,stoneTrim);
 box(42,FLOOR,1.1,0,FLOOR/2,6.4,stoneTrim);

 progress(.22,'Raising the brick station');
 // ── Station building: two brick storeys with stone bands, hipped slate roofs, clock tower ──
 const front=6,back=-6;
 function wall(x0,x1,z,y0,y1,mat=brickBig){const w=Math.abs(x1-x0);const m=box(w,y1-y0,.5,(x0+x1)/2,(y0+y1)/2,z,mat);return m;}
 function arched(x,y,z,w,h,face=1,lit=true){const glass=lit?M.window:M.windowDim;box(w,h,.08,x,y+h/2,z+face*.2,glass);const a=mesh(new THREE.CircleGeometry(w/2,16,0,Math.PI),glass,x,y+h,z+face*.2);if(face<0)a.rotation.y=Math.PI;
  for(const s of [-1,1])box(.18,h+.3,.18,x+s*(w/2+.09),y+h/2,z+face*.3,stoneTrim);box(w+.6,.18,.3,x,y-.09,z+face*.32,stoneTrim);const key=box(.34,.5,.24,x,y+h+w/2,z+face*.32,stoneTrim);
  const arc=mesh(new THREE.TorusGeometry(w/2+.09,.09,4,14,Math.PI),stoneTrim,x,y+h,z+face*.3);if(face<0)arc.rotation.y=Math.PI;
  box(.05,h,.06,x,y+h/2,z+face*.26,M.oxDark);for(const yy of [y+h*.33,y+h*.66])box(w,.05,.06,x,yy,z+face*.26,M.oxDark);}
 for(const s of [-1,1]){
  // Wing facades (front and platform side), each 16.5 m long.
  for(const [z,face] of [[front,1],[back,-1]]){const xa=s*3.5,xb=s*20;
   if(face<0){wall(s*4.3,xb,z,FLOOR,6.2);}else wall(xa,xb,z,FLOOR,6.2);wall(xa,xb,z,6.2,10.4);
   for(let i=0;i<5;i++){const x=s*(6+i*3.1);if(face<0&&Math.abs(x)<4.6)continue;arched(x,FLOOR+1.1,z,1.3,2.5,face,(i+(s>0?1:0))%3!==1);arched(x,6.9,z,1,1.9,face,(i*7+(s>0?2:0))%4===0);for(const y of [FLOOR+.25,6.2,10.4])box(Math.abs(xb-xa)+.3,y===6.2?.3:.42,.7,(xa+xb)/2,y,z,stoneTrim);}
   for(let i=0;i<6;i++)box(.55,9.6,.62,s*(4+i*3.2),5.4,z,brickBig);}
  // End walls and roof.
  box(.5,10,12,s*20,5.4,0,brickBig);for(const z of [-3,3]){arched(s*20,FLOOR+1.1,z,1.2,2.4,1,false);}
  const roof=mesh(hipRoof(17.6,13.4,3.6),slate,s*11.75,10.6,0);box(17.4,.3,13.2,s*11.75,10.55,0,stoneTrim);
  for(const x of [8,15])box(.9,2.2,.9,s*x,12.6,-1.5,brickBig);
  for(let x=4;x<20;x+=1.2)box(.12,.12,13.6,s*x,10.42,0,timber);
 }
 // Clock tower, rising from the hall's centre bay above the entrance.
 wall(-3.5,-2,front+.15,FLOOR,6.2);wall(2,3.5,front+.15,FLOOR,6.2);box(4,1.6,.5,0,5.4,front+.15,brickBig);
 const archTop=mesh(new THREE.TorusGeometry(2.05,.16,6,20,Math.PI),stoneTrim,0,4.5,front+.45);
 for(const s of [-1,1])box(.3,4.2,.4,s*2.15,2.5,front+.42,stoneTrim);
 box(7,9,7,0,10.7,2.5,brickBig);for(const y of [6.3,10.5,15.1])box(7.5,.4,7.5,0,y,2.5,stoneTrim);for(const sx of [-1,1])for(const sz of [-1,1])box(.7,9.4,.7,sx*3.4,10.8,2.5+sz*3.4,stoneTrim);
 const clockMat=new THREE.MeshStandardMaterial({map:clockTexture(),emissive:0xffe2b0,emissiveMap:null,emissiveIntensity:.35,roughness:.5});clockMat.emissiveMap=clockMat.map;
 for(const [z,ry] of [[6.02,0],[-1.02,Math.PI]]){const c=mesh(new THREE.CircleGeometry(1.55,40),clockMat,0,12.8,z);c.rotation.y=ry;const ring=mesh(new THREE.TorusGeometry(1.6,.12,8,40),M.brass,0,12.8,z);}
 for(const x of [-3.52,3.52]){const c=mesh(new THREE.CircleGeometry(1.4,40),clockMat,x,12.8,2.5);c.rotation.y=x>0?Math.PI/2:-Math.PI/2;}
 const towerRoof=mesh(new THREE.ConeGeometry(5.3,4.6,4,1),copper,0,17.6,2.5);towerRoof.rotation.y=Math.PI/4;
 cylinder(.3,.4,1.2,0,20.4,2.5,copper,8);cylinder(.05,.05,2.4,0,22,2.5,M.black,6);for(const a of [0,Math.PI/2])box(1.2,.05,.05,0,21.6,2.5,M.black).rotation.y=a;
 for(const s of [-1,1])for(const sz of [-1,1]){const d=mesh(hipRoof(1.8,1.2,1.1),copper,s*2,15.6,2.5+sz*2.6);d.rotation.y=sz>0?0:Math.PI;}
 const nameTex=signTexture([{text:'HOLLOWMOOR',size:120,weight:'bold',y:110},{text:'STATION  ·  NIGHT LINE',size:46,y:200}],{bg:'#20160f',fg:'#e2c27a',border:'#b08a46'});
 mesh(new THREE.PlaneGeometry(6,1.5),new THREE.MeshStandardMaterial({map:nameTex,emissive:0xffc070,emissiveMap:nameTex,emissiveIntensity:.25,roughness:.6}),0,7.6,6.08);
 // Porte-cochère on cast-iron columns.
 for(const x of [-3.2,3.2]){cylinder(.13,.13,4,x,2,9.4,M.black,12);cylinder(.26,.3,.3,x,.15,9.4,M.black,12);cylinder(.24,.14,.35,x,3.9,9.4,M.black,12);beam([x,3.8,9.4],[x,4.3,7.6],.05,M.black);}
 box(7.6,.25,3.8,0,4.3,8.1,M.black);box(7.8,.1,4,0,4.5,8.1,slate);for(let x=-3.7;x<3.8;x+=.3)box(.18,.24,.03,x,4.05,10,M.black);
 lampsAt(gasLamp(k,M,0,3.2,8.4,.01));
 // Station hall interior: board floor, wainscot, coffered ceiling, ticket windows, benches, wickets.
 box(24,FLOOR,12,0,FLOOR/2,0,boards);box(24,.3,12,0,6.35,0,timber);for(let x=-11;x<=11;x+=2.2)box(.25,.35,12,x,6.05,0,timber);for(const z of [-3,0,3])box(24,.3,.25,0,6.05,z,timber);
 for(const s of [-1,1]){box(.3,5.8,12,s*12.1,3.3,0,plasterIn);box(.08,1.2,11.6,s*11.92,FLOOR+.6,0,timber);box(.1,.08,11.6,s*11.9,FLOOR+1.25,0,M.brass);}
 for(const z of [-5.9,5.9])box(24,1.2,.12,0,FLOOR+.6,z*.995,timber);
 // Ticket windows on the west wall, each with a brass grille and a lamp-lit clerk's room.
 for(const z of [-3,0,3]){box(.25,1.1,1.8,-11.85,FLOOR+1.4,z,M.window);box(.4,.14,2.1,-11.7,FLOOR+.85,z,timber);for(let i=-3;i<=3;i++)box(.04,1.1,.03,-11.68,FLOOR+1.4,z+i*.26,M.brass);box(.15,.45,2.2,-11.75,FLOOR+2.2,z,timber);}
 const fareTex=signTexture([{text:'TICKETS · FARES',size:70,weight:'bold',y:70},{text:'ALL DEPARTURES  11:59',size:60,y:170}],{bg:'#1d2a22',fg:'#e8dcb8',border:'#b08a46'});
 const fareBoard=mesh(new THREE.PlaneGeometry(6.2,1.5),new THREE.MeshStandardMaterial({map:fareTex,roughness:.7}),-11.9,FLOOR+3.4,0);fareBoard.rotation.y=Math.PI/2;
 const ttTex=signTexture([{text:'DEPARTURES',size:56,weight:'bold',y:46},{text:'NIGHT EXPRESS ........ 11:59',size:40,y:112},{text:'NIGHT EXPRESS ........ 11:59',size:40,y:162},{text:'NIGHT EXPRESS ........ 11:59',size:40,y:212}],{bg:'#121614',fg:'#f0e6c8',border:'#3a2e22',w:768,h:256});
 for(const s of [-1,1]){const tt=mesh(new THREE.PlaneGeometry(4,1.35),new THREE.MeshStandardMaterial({map:ttTex,emissive:0xffffff,emissiveMap:ttTex,emissiveIntensity:.18,roughness:.7}),s*8,FLOOR+3.7,-5.82);}
 const wallClock=mesh(new THREE.CircleGeometry(.55,30),clockMat,0,FLOOR+4.6,-5.8);
 for(const z of [-3.2,0,3.2]){box(3.4,.08,.55,9.4,FLOOR+.48,z,timber);box(3.4,.55,.08,9.4,FLOOR+.8,z+.25,timber);for(const x of [8,10.8])box(.08,.48,.5,x,FLOOR+.24,z,M.black);}
 cylinder(.38,.42,1.1,6.5,FLOOR+.55,4.2,M.black,14);cylinder(.08,.08,4.9,6.5,FLOOR+3.6,4.2,M.black,8);box(.1,.4,.3,6.5,FLOOR+.7,4.62,M.fire);
 for(const x of [-3,0,3]){box(.6,1.05,.9,x,FLOOR+.52,-4,timber);box(.7,.08,1,x,FLOOR+1.08,-4,M.brass);box(.06,.3,.8,x,FLOOR+1.25,-4,M.oxDark);}
 for(const x of [-6,6]){beam([x,6.2,0],[x,5,0],.02,M.black);mesh(new THREE.SphereGeometry(.28,14,10),M.lampGlass,x,4.8,0);lamps.push([x,4.8,0]);}
 // Back openings to the platform, with a deep timber surround.
 for(const s of [-1,1])box(.4,4.2,.7,s*4.5,FLOOR+2.1,back,timber);box(9.4,.5,.7,0,FLOOR+4.3,back,timber);

 progress(.42,'Laying the night line');
 // ── Platform, canopy, edge coping and furniture ──
 box(11.8,FLOOR+1,43,-.45,(FLOOR-1)/2,-27.6,pave);for(const x of [-6.35,5.45])box(.45,.08,43,x,FLOOR+.02,-27.6,stoneTrim);
 box(11.8,1.6,.4,-.45,-.3,-49.2,brickBig);
 for(const x of [-6.6,5.7])box(.3,1.1,43,x,-.3,-27.6,brickBig);
 track(k,M,T1,-8.2,-120,RAIL);track(k,M,T2,-8.2,-120,RAIL);
 for(const x of [T1,T2]){box(2.4,.5,.4,x,RAIL+.65,-8.6,M.red);for(const s of [-1,1]){hc(k,.12,.12,.45,x+s*.8,RAIL+.65,-9,M.steel);hc(k,.2,.2,.06,x+s*.8,RAIL+.65,-9.25,M.steel);beam([x+s*.8,RAIL+.4,-8.4],[x+s*.8,RAIL-.2,-7.6],.08,M.black);}box(2,.6,.6,x,RAIL+.1,-8.2,M.black);}track(k,M,T2+6,-30,-120,RAIL);
 for(let z=-8;z>=-47;z-=6){cylinder(.12,.15,3.6,-.4,FLOOR+1.8,z,M.black,12);cylinder(.24,.3,.35,-.4,FLOOR+.17,z,M.black,12);cylinder(.26,.12,.3,-.4,FLOOR+3.55,z,M.black,12);
  for(const s of [-1,1]){beam([-.4,FLOOR+3.1,z],[-.4+s*2.5,FLOOR+3.8,z],.05,M.black);beam([-.4,FLOOR+3.7,z],[-.4+s*5.8,FLOOR+3.25,z],.07,M.black);}
  if(z<-10){beam([-.4,FLOOR+3.65,z+3],[-.4,FLOOR+3.1,z+3],.015,M.black);mesh(new THREE.SphereGeometry(.2,12,8),M.lampGlass,-.4,FLOOR+2.95,z+3);lamps.push([-.4,FLOOR+2.95,z+3]);}}
 for(const s of [-1,1]){const pl=box(6.2,.08,41,-.4+s*3,FLOOR+3.55,-27.5,M.roofCanvas);pl.rotation.z=s*.075;for(let z=-7;z>-48;z-=.42)box(.05,.32,.22,-.4+s*6.1,FLOOR+3.15,z,M.black).rotation.y=0;box(.06,.1,41,-.4+s*6.1,FLOOR+3.3,-27.5,M.black);}
 box(.25,.25,41,-.4,FLOOR+3.8,-27.5,M.black);
 // Bench pairs, fire buckets, milk churns, a luggage barrow and the station name board.
 for(const z of [-11,-23,-35]){for(const s of [-1,1]){box(2.2,.07,.5,-.4+s*1.6,FLOOR+.47,z,timber);box(2.2,.5,.06,-.4+s*1.6,FLOOR+.78,z+s*.25*-1,timber);for(const dx of [-.9,.9])box(.06,.45,.45,-.4+s*1.6+dx,FLOOR+.23,z,M.black);}}
 for(let i=0;i<4;i++){cylinder(.17,.13,.32,3.8+i*.4,FLOOR+1.6,-18.6,M.red,10);}box(1.9,.08,.25,4.4,FLOOR+1.42,-18.6,M.black);for(const x of [3.6,5.2])box(.06,1.6,.06,x,FLOOR+.8,-18.6,M.black);
 for(let i=0;i<5;i++){const x=3.6+(i%3)*.5,z=-27+Math.floor(i/3)*.5;cylinder(.22,.25,.8,x,FLOOR+.4,z,M.steel,14);cylinder(.12,.22,.18,x,FLOOR+.89,z,M.steel,14);cylinder(.13,.13,.06,x,FLOOR+1.0,z,M.steel,14);}
 box(1.3,.1,2.4,-3.2,FLOOR+.62,-31.2,timber);for(const s of [-1,1])axleCyl(k,.3,.08,-3.2+s*.7,FLOOR+.3,-31.6,M.black);box(1.2,.5,.6,-3.2,FLOOR+.93,-30.7,M.oxDark);box(1,.7,.8,-3.2,FLOOR+1.03,-31.6,timber);box(.9,.4,.6,-3.2,FLOOR+1.6,-31.6,M.oxDark);for(const x of [-3.7,-2.7])beam([x,FLOOR+.62,-32.4],[x,FLOOR+1.3,-33.6],.03,timber);
 const boardTex=signTexture([{text:'HOLLOWMOOR',size:110,weight:'bold',y:100},{text:'←  NO PREVIOUS STOP        NEXT: MIDNIGHT  →',size:34,y:196}],{bg:'#efe8d6',fg:'#1d1b18',border:'#1d1b18'});
 for(const s of [-1,1]){const b=mesh(new THREE.PlaneGeometry(3.8,.95),new THREE.MeshStandardMaterial({map:boardTex,roughness:.7}),2.6,FLOOR+2.3,-20+s*.03);b.rotation.y=s>0?0:Math.PI;}box(3.95,1.05,.04,2.6,FLOOR+2.3,-20,M.black);for(const x of [.75,4.45])cylinder(.05,.05,2.8,x,FLOOR+1.4,-20,M.black,8);
 // Platform clock hanging from the canopy — the clue's landmark.
 beam([1.4,FLOOR+3.7,-16],[1.4,FLOOR+3.0,-16],.03,M.black);box(.95,.95,.25,1.4,FLOOR+2.55,-16,M.black);for(const zz of [-.13,.13]){const f=mesh(new THREE.CircleGeometry(.42,30),clockMat,1.4,FLOOR+2.55,-16+zz);f.rotation.y=zz<0?Math.PI:0;}

 progress(.58,'Coupling the carriages');
 // ── The waiting express on track 1 ──
 const trainG=new THREE.Group();trainG.position.set(T1,RAIL,0);k.batch.add(trainG);
 const carA=new THREE.Group();carA.position.z=-19;trainG.add(carA);carriage(k,M,carA,{label:'NIGHT  3'});
 const carB=new THREE.Group();carB.position.z=-37.4;trainG.add(carB);carriage(k,M,carB,{label:'NIGHT  2'});
 const tend=new THREE.Group();tend.position.z=-50.3;trainG.add(tend);tender(k,M,tend);
 const loco=new THREE.Group();loco.position.z=-59.8;trainG.add(loco);locomotive(k,M,loco);
 // A string of dark goods wagons on track 2 for depth.
 for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(T2+6,RAIL,-58-i*9.2);k.batch.add(g);box(2.6,2.3,8.4,0,2.3,0,k.surface('cedar',0x3a2c22,2,.9),g);box(2.7,.12,8.6,0,3.5,0,M.roofCanvas,g);box(2,.3,8.4,0,1,0,M.black,g);for(const z of [-2.8,2.8])for(const s of [-1,1])axleCyl(k,.42,.12,s*.62,.42,z,M.black,g);for(let z=-3.6;z<4;z+=1.2)box(2.72,2.2,.06,0,2.3,z,M.black,g);}

 progress(.68,'Lighting the yard');
 // ── Across the tracks: fence, goods shed, water tower, signals, poles ──
 for(let z=-6;z>-70;z-=2.4){box(.08,1.3,.08,10.8,.65,z,timber);}for(const y of [.4,1.1])box(.05,.1,64,10.8,y,-38,timber);
 const shed=new THREE.Group();k.batch.add(shed);box(10,5.5,30,18,2.75,-26,k.surface('cedar',0x4a3a2c,4,.9),shed);mesh(hipRoof(31.5,11.5,2.6),slate,18,5.5,-26,shed).rotation.y=Math.PI/2;
 for(let z=-38;z<-13;z+=4.2){box(.12,5.4,.18,12.95,2.7,z,M.black,shed);}for(const z of [-30,-20])box(.1,3.6,3.4,12.95,1.8,z,M.windowDim,shed);
 const shedSign=signTexture([{text:'GOODS  ·  HOLLOWMOOR',size:76,weight:'bold'}],{bg:'#2a1e16',fg:'#d8c08a',border:'#5a4430'});const ss=mesh(new THREE.PlaneGeometry(6,1.2),new THREE.MeshStandardMaterial({map:shedSign,roughness:.8}),12.92,4.6,-26);ss.rotation.y=-Math.PI/2;
 // Water tower: a riveted tank on a timber trestle, with a swinging spout.
 const wt=new THREE.Group();wt.position.set(16,0,-56);k.batch.add(wt);for(const sx of [-1,1])for(const sz of [-1,1]){beam([sx*2,0,sz*2],[sx*1.6,7,sz*1.6],.16,timber,wt);}for(const y of [2.5,5])for(const [a,b] of [[[-2,y,-2],[2,y,2]],[[2,y,-2],[-2,y,2]]])beam(a,b,.06,timber,wt);
 cylinder(2.7,2.7,3.6,0,8.9,0,M.black,24,wt);for(const y of [7.4,8.6,9.8])k.mesh(new THREE.TorusGeometry(2.72,.05,6,40),M.steel,0,y,0,wt).rotation.x=Math.PI/2;k.mesh(new THREE.ConeGeometry(2.9,1.3,24),M.soot,0,11.35,0,wt);beam([-2.4,8,0],[-6.5,6,0],.18,M.black,wt);beam([-6.5,6,0],[-6.5,4.6,0],.12,M.black,wt);
 // Semaphore signal gantry across the throat of the yard.
 const gz=-74;for(const x of [-12,11])cylinder(.18,.22,9,x,4.5,gz,M.black,10);box(23.4,.4,.5,-.5,8.8,gz,M.black);for(const x of [-8.4,7.6]){box(.2,1.8,.1,x,8.1,gz+.3,M.red);const lp=[x,9.7,gz+.35];mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshStandardMaterial({color:0xff4030,emissive:0xff2a10,emissiveIntensity:3}),...lp);}
 for(let z=12;z>-110;z-=26)telegraphPole(k,M,-13.5,z,8);
 // Shophouses framing the forecourt and the town beyond.
 warehouse(k,M,{brickBig,stoneTrim,slate,timber},lampsAt);inn(k,M,{timber,slate,stoneTrim},lampsAt);
 for(let i=0;i<8;i++)kanban(k,M,-36+i*10.2,58,Math.PI,i,lampsAt);
 for(const s of [-1,1])for(let i=0;i<4;i++)kanban(k,M,s*44,-14-i*12,s>0?-Math.PI/2:Math.PI/2,i+s+3,null);
 // Forecourt furniture kept outside the arena: gas lamps, a red post box, rickshaws, a notice board.
 for(const x of [-13.5,13.5])for(const z of [12,20,28])lampsAt(gasLamp(k,M,x,0,z,3.4));
 for(const x of [-4.8,4.8])lampsAt(gasLamp(k,M,x,FLOOR,-44,3.2));
 cylinder(.32,.32,1.3,15.5,.65,8.6,M.red,18);k.mesh(new THREE.SphereGeometry(.34,16,8,0,Math.PI*2,0,Math.PI/2),M.red,15.5,1.3,8.6);box(.35,.05,.1,15.5,1.05,8.92,M.black);
 for(const [x,z,a] of [[-18.5,10,.3],[-18,14,-.2],[-19,18.2,.1]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=a;k.batch.add(g);for(const s of [-1,1]){axleCyl(k,.62,.06,s*.62,.62,0,M.black,g);for(let i=0;i<10;i++){const sp=box(.03,.04,1.1,s*.62,.62,0,M.soot,g);sp.rotation.x=i/10*Math.PI;}}box(1.1,.08,.7,0,.95,-.1,M.oxDark,g);box(1.1,.6,.08,0,1.25,.25,M.oxDark,g);box(1.2,.04,.7,0,1.75,.05,M.roofCanvas,g).rotation.x=-.4;for(const s of [-1,1])beam([s*.45,.9,-.4],[s*.45,.15,-2.4],.035,timber,g);}
 for(const x of [-7.4,7.4]){box(1.6,.6,1.6,x,.3,7.6,stoneTrim);for(let i=0;i<5;i++){const t=mesh(new THREE.IcosahedronGeometry(.9-i*.12,1),new THREE.MeshStandardMaterial({color:0x2b3a2c,roughness:1,flatShading:true}),x+(r()-.5)*.3,1.2+i*.62,7.6+(r()-.5)*.3);t.scale.y=.55;}cylinder(.1,.14,2.6,x,1.6,7.6,timber,8);}
 const kiosk=new THREE.Group();kiosk.position.set(-17.5,0,26);kiosk.rotation.y=Math.PI/2;k.batch.add(kiosk);box(3,2.2,1.8,0,1.1,0,M.oxDark,kiosk);box(2.6,1,.1,0,1.5,.92,M.window,kiosk);box(3.6,.12,2.6,0,2.35,.3,M.roofCanvas,kiosk);for(let i=0;i<6;i++)box(.4,.5,.04,-1.1+i*.44,1.5,.98,new THREE.MeshStandardMaterial({color:[0xe8dcc0,0xd8c8a0,0xefe4cc][i%3],roughness:1}),kiosk);
 const kioskSign=signTexture([{text:'EVENING PAPERS',size:84,weight:'bold'}],{bg:'#1d1610',fg:'#f0d48a',border:'#b08a46'});const ksm=mesh(new THREE.PlaneGeometry(2.8,.6),new THREE.MeshStandardMaterial({map:kioskSign,emissive:0xffd080,emissiveMap:kioskSign,emissiveIntensity:.35}),0,2.75,1.0,kiosk);
 lamps.push([-17.5+1.2,1.7,26]);
 for(const x of [-9,9]){beam([x,6.2,6.3],[x,6.2,7.4],.03,M.black);const bn=mesh(new THREE.PlaneGeometry(.9,3),new THREE.MeshStandardMaterial({color:0x7a1e18,roughness:.9,side:THREE.DoubleSide}),x,4.6,7.4);bn.rotation.y=Math.PI/2;}
 box(2.6,1.6,.12,16.5,1.6,16,timber);const nb=signTexture([{text:'NOTICE',size:70,weight:'bold',y:60},{text:'Passengers must not sleep',size:40,y:140},{text:'on the night line.',size:40,y:196}],{bg:'#e3d6b4',fg:'#2a221a',border:'#4a3a2a',w:768,h:256});const nbm=mesh(new THREE.PlaneGeometry(2.4,1.0),new THREE.MeshStandardMaterial({map:nb,roughness:.9}),16.5,1.7,15.92);nbm.rotation.y=Math.PI;for(const x of [15.4,17.6])box(.1,2.4,.1,x,1.2,16,timber);
 // Horse trough and hitching rail, benches, luggage carts, a tram stop and a hand cart of sacks.
 box(2.6,.7,.9,21,.35,11.5,k.surface('stone',0x6e6e68,1,.8));box(2.3,.05,.6,21,.68,11.5,new THREE.MeshStandardMaterial({color:0x0a0c10,roughness:.05,metalness:.3}));for(const x of [19.2,22.8])cylinder(.07,.08,1.1,x,.55,13,timber,8);beam([19.2,1.05,13],[22.8,1.05,13],.05,timber);
 for(const [x,z,a] of [[-15.6,31,Math.PI/2],[15.6,33.5,-Math.PI/2]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=a;k.batch.add(g);box(2.2,.07,.5,0,.48,0,timber,g);box(2.2,.45,.06,0,.82,-.24,timber,g);for(const dx of [-.95,.95])box(.08,.5,.5,dx,.25,0,M.black,g);}
 for(const [x,z,a] of [[-21.5,21,.2],[19.5,30.5,-.3]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=a;k.batch.add(g);box(1.2,.08,2.2,0,.62,0,timber,g);for(const s of [-1,1]){const w=k.cylinder(.32,.32,.08,s*.66,.32,.3,M.black,18,g);w.rotation.z=Math.PI/2;}beam([0,.62,-1.1],[0,1.1,-2],.04,timber,g);box(1,.6,.7,0,.96,.4,M.oxDark,g);box(.9,.45,.6,0,1.48,.4,timber,g);box(.8,.35,.6,0,.84,-.5,k.surface('cedar',0x6b5236,1,.9),g);}
 cylinder(.05,.05,2.6,-8,1.3,35,M.black,8);const ts=signTexture([{text:'TRAM',size:120,weight:'bold'}],{bg:'#efe6cc',fg:'#7a1e18',border:'#7a1e18',w:256,h:256});for(const sg of [-1,1]){const t=mesh(new THREE.CircleGeometry(.32,24),new THREE.MeshStandardMaterial({map:ts,roughness:.7}),-8,2.5,35+sg*.03);t.rotation.y=sg>0?0:Math.PI;}
 {const g=new THREE.Group();g.position.set(-21.5,0,34);g.rotation.y=-.5;k.batch.add(g);box(1.1,.08,1.8,0,.55,0,timber,g);for(const s of [-1,1]){const w=k.cylinder(.5,.5,.06,s*.6,.5,0,M.black,18,g);w.rotation.z=Math.PI/2;}for(let i=0;i<5;i++){const m=mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshStandardMaterial({color:0x9a8a66,roughness:1}),(i%2-.5)*.45,.82+Math.floor(i/2)*.22,-.5+i*.25,g);m.scale.set(1,.6,1.3);}beam([0,.55,-.9],[0,.4,-2.2],.04,timber,g);}
 // Crates and trunks on the forecourt edge.
 for(let i=0;i<7;i++){const x=17+r()*3,z=22+r()*6,s=.5+r()*.5;box(s*1.2,s,s,x,s/2,z,i%2?timber:k.surface('cedar',0x6b5236,1,.9)).rotation.y=r();}

 // ── Lights: ≤ 8 point lights; everything else is emissive + additive halos ──
 const lights=[[0,4.2,8.6,0xffc27a,28,14],[-6,4.5,0,0xffbe72,22,13],[6,4.5,0,0xffbe72,22,13],[-.4,3.2,-15,0xffc27a,22,12],[-.4,3.2,-33,0xffc27a,22,12],[T1+3.6,3.8,-58,0xffa860,34,15],[-13.5,3.6,20,0xffc27a,18,11],[13.5,3.6,20,0xffc27a,18,11]];
 for(const [x,y,z,c,i,d] of lights){const l=new THREE.PointLight(c,i,d,1.6);l.position.set(x,y,z);root.add(l);}
 const halo=glows(root,lamps,{size:4.2});glows(root,[[T1,RAIL+3.4,-66.95]],{size:6,color:0xfff0c0});
 // ── Steam and fog: chimney plume, cylinder cocks, carriage heating leaks, low yard mist ──
 const plumes=[
  steam(root,{origin:[T1,RAIL+4.3,-65],count:110,rise:9,spread:2.2,size:5,life:7,wind:[.55,0,.35],color:0xb8bec6,opacity:.42,dark:.5}),
  steam(root,{origin:[T1+1.3,RAIL+1.1,-65],count:70,rise:1.6,spread:3.5,size:3.5,life:3.2,wind:[1.1,0,.4],color:0xeef2f6,opacity:.34}),
  steam(root,{origin:[T1-1.3,RAIL+1.1,-65],count:50,rise:1.4,spread:3,size:3.5,life:3.2,wind:[-.9,0,.4],color:0xeef2f6,opacity:.3}),
  steam(root,{origin:[T1+.4,RAIL+.6,-28.2],count:40,rise:2.2,spread:1.6,size:2.6,life:4.5,wind:[.5,0,.2],color:0xe6ebf0,opacity:.22}),
  steam(root,{origin:[T1+.4,RAIL+.6,-46.6],count:40,rise:2,spread:1.6,size:2.6,life:4.5,wind:[.5,0,.2],color:0xe6ebf0,opacity:.2}),
  steam(root,{origin:[0,0,-48],count:70,rise:1.2,spread:40,size:12,life:22,wind:[.5,0,1.2],color:0x8a96a6,opacity:.13}),
  steam(root,{origin:[0,0,22],count:90,rise:.6,spread:46,size:13,life:24,wind:[-.6,0,-.4],color:0x8a96a8,opacity:.16})];
 k.finish();progress(.95,'The clock reads 11:59');

 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 const blocked=(x,z)=>
  inR(x,z,-19.6,-15.5,8.4,19.8)||inR(x,z,-19.6,-15.4,24.2,27.8)||x<-23.2||x>23.8||inR(x,z,19.4,22.6,10.8,13.3)||inR(x,z,-16.1,-15.1,29.8,32.2)||inR(x,z,15.1,16.1,32.3,34.7)||inR(x,z,-22.6,-20.4,19.6,22.4)||inR(x,z,18.4,20.6,29.2,31.8)||Math.hypot(x+8,z-35)<.3||inR(x,z,-23,-20,32.5,35.5)||inR(x,z,15,18,7.8,9.4)||inR(x,z,15.2,17.8,15.6,16.5)||inR(x,z,16.4,20.6,21.6,28.6)||
  [[-13.5,12],[-13.5,20],[-13.5,28],[13.5,12],[13.5,20],[13.5,28],[-3.2,9.4],[3.2,9.4]].some(([a,b])=>Math.hypot(x-a,z-b)<.45)||
  inR(x,z,-3.4,-2.6,-4.5,-3.5)||inR(x,z,-.4,.4,-4.5,-3.5)||inR(x,z,2.6,3.4,-4.5,-3.5)||
  inR(x,z,7.6,11.2,-3.6,-2.6)||inR(x,z,7.6,11.2,-.4,.6)||inR(x,z,7.6,11.2,2.8,3.8)||Math.hypot(x-6.5,z-4.2)<.7||
  (x>-.75&&x<-.05&&((((-z-8)%6)+6)%6<.4||(((-z-8)%6)+6)%6>5.6)&&z<-7)||
  inR(x,z,-4.2,-.3,-11.5,-10.5)||inR(x,z,-.5,3.4,-11.5,-10.5)||inR(x,z,-4.2,-.3,-23.5,-22.5)||inR(x,z,-.5,3.4,-23.5,-22.5)||inR(x,z,-4.2,-.3,-35.5,-34.5)||inR(x,z,-.5,3.4,-35.5,-34.5)||
  inR(x,z,3.3,5.4,-27.4,-26)||inR(x,z,3.4,5.4,-18.9,-18.3)||inR(x,z,.6,4.6,-20.2,-19.8)||inR(x,z,-3.95,-2.45,-34,-30.3)||
  [[-4.8,-44],[4.8,-44]].some(([a,b])=>Math.hypot(x-a,z-b)<.4);
 function canWalk(x,z){
  if(z>=8.4&&z<46&&Math.abs(x)<25)return !blocked(x,z);
  if(z>=5.9&&z<8.4)return Math.abs(x)<(z>7?4.6:1.85);
  if(z>-5.5&&z<5.9)return Math.abs(x)<(z>5.2?1.85:11.4)&&!blocked(x,z);
  if(z>=-6.7&&z<=-5.5)return Math.abs(x)<4.1;
  if(z<-6.7&&z>-48.8&&x>-6.25&&x<5.3)return !blocked(x,z);
  return false;}
 function walkHeight(x,z){if(z>8.6)return 0;if(z>6.9)return (8.6-z)/1.7*FLOOR;return FLOOR;}
 return {texturesLoaded:14,grassBlades:0,discoveries:clues['express-station'],
  views:{forecourt:{pos:[9,2.4,27],look:[0,9,0],name:'Hollowmoor forecourt',sub:'The clock tower has read 11:59 for twenty years.'},
   hall:{pos:[7,2.3,3.8],look:[-11,2.4,-1],name:'The ticket hall',sub:'Every fare on the board is for the same departure.'},
   platform:{pos:[3.6,2.4,-9],look:[-6,2.2,-48],name:'Platform one',sub:'The express is breathing. Its passengers are already aboard.'},
   engine:{pos:[-3.5,2.3,-47.5],look:[T1,2.6,-66],name:'The waiting engine',sub:'Steam, brass and a bronze bell where no bell should be.'}},
  canWalk,walkHeight,
  locationAt(x,z){return z>8?'Hollowmoor forecourt':z>-6?'The ticket hall':z>-40?'Platform one':'The platform’s end';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam||camera);for(const p of plumes)p.update(t);halo.material.opacity=.78+Math.sin(t*7.3)*.04+Math.sin(t*3.1)*.04;},
  setEvening(){}};
}
function hc(k,r1,r2,len,x,y,z,mat){const m=k.cylinder(r1,r2,len,x,y,z,mat,16);m.rotation.x=Math.PI/2;return m;}
function axleCyl(k,r,w,x,y,z,mat,g){const m=k.cylinder(r,r,w,x,y,z,mat,24,g);m.rotation.z=Math.PI/2;return m;}

function settTexture(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#2a2a2a';g.fillRect(0,0,512,512);
 for(let row=0;row<16;row++){const h=32,off=(row%2)*24;for(let x=-48+off;x<512;x+=48){const w=44+(Math.random()-.5)*6,v=70+Math.random()*60,t=Math.random()*14;g.fillStyle=`rgb(${v+t|0},${v+t*.6|0},${v|0})`;const y=row*h+2;g.beginPath();g.roundRect?g.roundRect(x+2,y,w,h-4,6):g.rect(x+2,y,w,h-4);g.fill();g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x+5,y+3,w-10,5);if(Math.random()<.15){g.fillStyle='rgba(40,60,30,.35)';g.fillRect(x,y+h-6,w,4);}}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const WET={name:'WetSetts',uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},
 vertexShader:'uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform vec3 color;uniform sampler2D tDiffuse;varying vec4 vUv;varying vec3 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){float m=n(vW.xz*.16)*.6+n(vW.xz*.45)*.3+n(vW.xz*1.7)*.1;float puddle=smoothstep(.56,.6,m);float damp=smoothstep(.36,.56,m);
  vec2 rip=(vec2(n(vW.xz*4.),n(vW.xz*4.+9.))-.5)*.006;vec4 base=texture2DProj(tDiffuse,vec4(vUv.xy+rip*vUv.w,vUv.zw));
  float a=puddle*.9+damp*.22;vec3 c=mix(vec3(.02,.025,.035),base.rgb*color,.25+puddle*.75);gl_FragColor=vec4(c,a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`};
// Brick parcels warehouse on the west side of the forecourt, loading doors facing the square.
function warehouse(k,M,{brickBig,stoneTrim,slate,timber},lampsAt){const g=new THREE.Group();g.position.set(-31,0,24);k.batch.add(g);const {box,mesh}=k;
 box(12,7.5,32,0,3.75,0,brickBig,g);for(const y of [.3,3.9,7.4])box(12.3,.3,32.3,0,y,0,stoneTrim,g);for(const z of [-16,16])for(const x of [-6,6])box(.6,7.6,.6,x,3.8,z,stoneTrim,g);
 const gable=new THREE.BufferGeometry();const W=6.4,H=3.6,L=16.3;const v=[[-W,0,-L],[W,0,-L],[0,H,-L],[-W,0,L],[W,0,L],[0,H,L]];const tri=[[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4]];const pp=[];for(const t of tri)for(const i of t)pp.push(...v[i]);gable.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));const uv=[];for(let i=0;i<pp.length;i+=3)uv.push(pp[i]*.3,(pp[i+2]+pp[i+1])*.3);gable.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));gable.computeVertexNormals();mesh(gable,slate,0,7.5,0,g);
 for(const z of [-10,0,10]){for(const dz of [-2.1,2.1])box(.35,4.1,.4,6.1,2.05,z+dz,stoneTrim,g);const lit=z===0;box(.12,3.7,3.8,6.1,1.85,z,lit?M.window:k.surface('cedar',0x4a3626,1,.85),g);if(lit){box(.12,3.7,1.9,6.3,1.85,z+2.9,k.surface('cedar',0x4a3626,1,.85),g);}else{for(let i=-1;i<=1;i++)box(.06,3.7,.08,6.18,1.85,z+i*1.25,M.black,g);for(const y of [.9,2.8])box(.06,.08,3.8,6.18,y,z,M.black,g);}const a=mesh(new THREE.TorusGeometry(2.2,.16,6,16,Math.PI),stoneTrim,6.1,4.05,z,g);a.rotation.y=Math.PI/2;}
 for(const z of [-14,-5,5,14])for(const y of [5.2])box(.1,1.4,1,6.06,y,z,z===5?M.window:M.windowDim,g);
 box(1.8,.9,31,6.9,.45,0,stoneTrim,g);box(.15,.12,31,7.8,.95,0,timber,g);
 const sg=signTexture([{text:'NIGHT LINE PARCELS',size:72,weight:'bold'}],{bg:'#e8dcc0',fg:'#3a1a10',border:'#3a1a10',w:1024,h:160});const sm=mesh(new THREE.PlaneGeometry(9,1.4),new THREE.MeshStandardMaterial({map:sg,roughness:.8}),6.18,6.4,0,g);sm.rotation.y=Math.PI/2;
 for(const z of [-5,5]){k.beam([6.2,4.6,z],[7.2,4.6,z],.04,M.black,g);mesh(new THREE.SphereGeometry(.2,12,8),M.lampGlass,7.2,4.3,z,g);lampsAt([-31+7.2,4.3,24+z]);}
}
// Two-storey timber inn: lattice frontage, noren, a balcony of lit shoji and a deep tiled roof.
function inn(k,M,{timber,slate,stoneTrim},lampsAt){const g=new THREE.Group();g.position.set(31,0,23);k.batch.add(g);const {box,mesh}=k;const dark=k.surface('cedar',0x3a2a1e,1,.85),paper=new THREE.MeshStandardMaterial({color:0xf2dcb0,emissive:0xffb060,emissiveIntensity:.75,roughness:.9});
 box(10,.4,26,0,.2,0,stoneTrim,g);box(9.6,3.4,25.6,.2,2.1,0,dark,g);
 for(let z=-12.5;z<=12.5;z+=.12)box(.05,2.6,.05,-4.75,1.8,z,timber,g);box(.12,2.5,25,-4.7,1.8,0,paper,g);
 for(const z of [-4,6]){box(.08,1.2,2.2,-4.95,2.4,z,new THREE.MeshStandardMaterial({color:0x1f2a44,roughness:.9,side:THREE.DoubleSide}),g);for(let i=0;i<3;i++)box(.09,1.1,.03,-4.97,2.4,z-.7+i*.7,new THREE.MeshStandardMaterial({color:0xe8e0cc}),g);}
 box(10.6,.25,26.6,0,3.95,0,timber,g);box(1.2,.12,26,-5.4,4.1,0,timber,g);for(let z=-12.8;z<=12.8;z+=1.6)k.cylinder(.05,.05,1,-5.95,4.6,z,timber,6,g);k.beam([-5.95,5.1,-12.8],[-5.95,5.1,12.8],.05,timber,g);
 box(8.4,3,25.4,.6,5.5,0,dark,g);for(let z=-12;z<=12;z+=1)box(.1,2.4,.9,-3.62,5.4,z+.5,paper,g);for(let z=-12.5;z<=12.5;z+=1)box(.12,2.6,.08,-3.6,5.4,z,timber,g);
 {const rg=new THREE.Group();rg.position.x=.6;rg.rotation.y=Math.PI/2;g.add(rg);k.roof(0,7.0,0,27.5,9.6,rg);}
 const sign=(()=>{const c=document.createElement('canvas');c.width=128;c.height=512;const x=c.getContext('2d');x.fillStyle='#2a1a10';x.fillRect(0,0,128,512);x.strokeStyle='#b08a46';x.lineWidth=8;x.strokeRect(6,6,116,500);x.fillStyle='#f0d8a0';x.font='bold 56px Georgia';x.textAlign='center';'KIRIYA'.split('').forEach((ch,i)=>x.fillText(ch,64,90+i*72));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 const sm=mesh(new THREE.PlaneGeometry(.8,3.2),new THREE.MeshStandardMaterial({map:sign,roughness:.8}),-5.05,2.3,-9,g);sm.rotation.y=-Math.PI/2;
 for(const z of [-10.5,-1,8.5]){const lp=mesh(new THREE.SphereGeometry(.34,14,10),new THREE.MeshStandardMaterial({color:0xfff0d8,emissive:0xff5030,emissiveIntensity:1.2,roughness:.8}),-5.4,3.3,z,g);lp.scale.y=1.35;lampsAt([31-5.4,3.3,23+z]);}
}
// Taisho "signboard architecture": a flat mortar or copper façade hiding a tiled shop behind it.
function kanban(k,M,x,z,rot,v,lampsAt){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;k.batch.add(g);const {box,mesh}=k;
 const face=[k.surface('plaster',0x8fb0a0,1,.6),k.surface('plaster',0xd6cbb0,1,.8),k.surface('plaster',0x9a9a94,1,.8),k.surface('stone',0x5d7e72,1,.5)][v%4],tim=k.surface('cedar',0x3e2e22,1,.85);
 const w=9.4,h=7+((v*7)%3)*.8;box(w,h,7,0,h/2,-3.6,tim,g);box(w,h+.8,.4,0,(h+.8)/2,0,face,g);
 box(w+.4,.35,.6,0,h+.6,0,face,g);for(const dx of [-w/2+.3,w/2-.3])box(.5,h+.8,.55,dx,(h+.8)/2,0,face,g);
 for(let i=0;i<3;i++){box(1.8,1.5,.1,-3+i*3,h-2.4,.22,(v+i)%3?M.window:M.windowDim,g);box(2.1,.18,.3,-3+i*3,h-3.2,.25,face,g);box(.4,.25,.22,-3+i*3,h-1.55,.25,face,g);}
 box(w-1.2,2.6,.1,0,1.5,.22,v%2?M.window:M.windowDim,g);for(let i=-3;i<=3;i++)box(.07,2.6,.12,i*1.3,1.5,.26,tim,g);
 const aw=box(w-.6,.08,1.6,0,3.1,.9,new THREE.MeshStandardMaterial({color:[0x2a3a5a,0x6a2020,0x2a4a3a,0x5a4a2a][v%4],roughness:.9}),g);aw.rotation.x=.28;
 const names=['KOBAYASHI DRAPERY','MIDNIGHT TOBACCO','HASE CLOCKMAKER','OKUMA PHARMACY','SUZURI STATIONERY','TOMOE TEA','NAKAZAWA SHOES','KAGAMI PHOTO STUDIO'];
 const t=signTexture([{text:names[((v%8)+8)%8],size:70,weight:'bold'}],{bg:'#1d1610',fg:'#e8cc8a',border:'#b08a46',w:1024,h:150});mesh(new THREE.PlaneGeometry(w-1.6,1.1),new THREE.MeshStandardMaterial({map:t,roughness:.8}),0,3.75,.24,g);
 if(lampsAt&&v%2===0){const p=new THREE.Vector3(0,3.4,1.6).applyAxisAngle(new THREE.Vector3(0,1,0),rot);mesh(new THREE.SphereGeometry(.14,10,8),M.lampGlass,0,3.4,1.6,g);lampsAt([x+p.x,p.y,z+p.z]);}
}
