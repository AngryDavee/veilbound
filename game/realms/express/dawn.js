import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { windMaterial } from '../../detail-world.js';
import { mergeGeometries as mergeGeos } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials, locomotive, tender, carriage, track, steam, glows, telegraphPole, signTexture, rand as r } from './rolling.js';

// The Dawn Plain — the express has halted on an embankment in a sea of silver susuki grass.
// Ground is flat at y=0 inside the walkable plain (x -6.4..40, z -50..44). The main line runs
// along Z at x=-13 on a 1.3 m embankment; a ground-level branch curves north-east toward the
// Floating Quarter. Low sun from the north-west backlights the grass plumes and the engine's steam.
const TX=-13,RT=1.55;
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
const smooth=t=>t*t*(3-2*t);
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
function groundH(x,z){const dx=Math.max(0,-8-x,x-46),dz=Math.max(0,-56-z,z-52),d=Math.hypot(dx,dz);const rise=smooth(Math.min(1,d/60));const emb=(x>-18.5&&x<-7.5)?0:0;return emb+rise*(6+noise(x*.03,z*.03)*14)+noise(x*.08,z*.08)*.6*Math.min(1,d/8);}
const PATH=[[0,46],[1,30],[4,17],[8,6],[8,-6],[4,-18],[1,-30],[0,-46]];
function pathDist(x,z){let best=1e9;for(let i=0;i<PATH.length-1;i++){const [ax,az]=PATH[i],[bx,bz]=PATH[i+1];const vx=bx-ax,vz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));best=Math.min(best,Math.hypot(x-ax-vx*t,z-az-vz*t));}return best;}
const ARENA={x0:-5,x1:21,z0:-12,z1:12};const inArena=(x,z,m=0)=>x>ARENA.x0-m&&x<ARENA.x1+m&&z>ARENA.z0-m&&z<ARENA.z1+m;

// One susuki clump prototype: arching leaf blades plus flowering stalks with feathery plumes.
// Returns separate leaf and plume geometries so the plumes can carry their own backlit glow.
function clumpGeometry(seedOffset,{blades=9,stalks=3,height=1,tuft=false,segs=3,strands=7}={}){
 let s=9137+seedOffset*7919;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
 const mk=()=>({P:[],N:[],U:[],B:[],C:[]});const leaf=mk(),plume=mk();
 const leafA=new THREE.Color(0x4e5230),leafB=new THREE.Color(0xb0a66c),plA=new THREE.Color(0xc8b4ac),plB=new THREE.Color(0xfff2e6);
 const push=(T,v,t,u,c)=>{T.P.push(...v);T.N.push(0,1,0);T.U.push(u,t);T.B.push(t);T.C.push(c.r,c.g,c.b);};
 const strip=(T,pts,widths,cs)=>{const sx=pts[0][4],sz=pts[0][5];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],wa=widths[i],wb=widths[i+1],ca=cs[i],cb=cs[i+1],ta=a[3],tb=b[3];
  const A=[a[0]-sx*wa,a[1],a[2]-sz*wa],Bv=[a[0]+sx*wa,a[1],a[2]+sz*wa],Cv=[b[0]-sx*wb,b[1],b[2]-sz*wb],D=[b[0]+sx*wb,b[1],b[2]+sz*wb];
  push(T,A,ta,0,ca);push(T,Bv,ta,1,ca);push(T,Cv,tb,0,cb);push(T,Bv,ta,1,ca);push(T,D,tb,1,cb);push(T,Cv,tb,0,cb);}};
 const H=height*(tuft?.38:1);
 for(let i=0;i<blades;i++){const a=rnd()*Math.PI*2,lean=.25+rnd()*.7,h=H*(.65+rnd()*.7),w=tuft?.014:.02;const dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;const pts=[],ws=[],cs=[];
  for(let j=0;j<=segs;j++){const t=j/segs;pts.push([dx*lean*h*t*t+dx*.03,h*t*(1-.25*t*lean),dz*lean*h*t*t+dz*.03,t,sx,sz]);ws.push(w*(1-t*.85));cs.push(leafA.clone().lerp(leafB,t*.85+rnd()*.15));}
  strip(leaf,pts,ws,cs);}
 if(!tuft)for(let i=0;i<stalks;i++){const a=rnd()*Math.PI*2,lean=.06+rnd()*.12,h=H*(1.55+rnd()*.7),dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;
  const top=[dx*lean*h,h,dz*lean*h];strip(leaf,[[dx*.02,0,dz*.02,0,sx,sz],[top[0]*.7,h*.75,top[2]*.7,.75,sx,sz]],[.007,.005],[leafA,leafB]);
  for(let f=0;f<strands;f++){const fa=a+(f-(strands-1)/2)*.32+(rnd()-.5)*.2,ca=Math.cos(fa),sa=Math.sin(fa),len=.28+rnd()*.22,droop=.05+rnd()*.14;const base=[top[0]*.7,h*(.72+f*.03),top[2]*.7];const pts=[],ws=[],cs=[],n=segs;for(let j=0;j<=n;j++){const t=j/n;pts.push([base[0]+ca*len*t*.55,base[1]+len*t*.8-droop*t*t,base[2]+sa*len*t*.55,.75+t*.25,-sa,ca]);ws.push(t<.01?.003:t>.99?.002:.008);cs.push(plA.clone().lerp(plB,t*.9));}strip(plume,pts,ws,cs);}}
 const build=T=>{const g=new THREE.BufferGeometry();for(const [n,a,sz] of [['position',T.P,3],['normal',T.N,3],['uv',T.U,2],['bend',T.B,1],['color',T.C,3]])g.setAttribute(n,new THREE.Float32BufferAttribute(a,sz));g.computeBoundingSphere();return g;};
 return {leaf:build(leaf),plume:plume.P.length?build(plume):null};
}
// A wide alpha card painted with dozens of blades and plumes: the cheap far layer of the grass sea.
function grassCardTexture(){const c=document.createElement('canvas');c.width=1024;c.height=320;const g=c.getContext('2d');let s=77;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
 for(let i=0;i<340;i++){const x=rnd()*1024,h=90+rnd()*170,l=(rnd()-.5)*90,w=2+rnd()*3;const v=60+rnd()*90;g.fillStyle=`rgb(${v+30|0},${v+22|0},${v*.55|0})`;g.beginPath();g.moveTo(x-w,320);g.quadraticCurveTo(x+l*.3,320-h*.6,x+l,320-h);g.quadraticCurveTo(x+l*.3+w*.3,320-h*.6,x+w,320);g.fill();}
 for(let i=0;i<110;i++){const x=20+rnd()*984,h=200+rnd()*100,l=(rnd()-.5)*30;g.strokeStyle='rgba(150,130,90,.9)';g.lineWidth=1.6;g.beginPath();g.moveTo(x,320);g.quadraticCurveTo(x+l*.5,320-h*.5,x+l,320-h);g.stroke();
  for(let f=0;f<9;f++){const a=-Math.PI/2+(f-4)*.22+(rnd()-.5)*.2,len=22+rnd()*20;g.strokeStyle=`rgba(${235+rnd()*20|0},${215+rnd()*20|0},${205+rnd()*20|0},.92)`;g.lineWidth=2.4;g.beginPath();g.moveTo(x+l,320-h+12);g.quadraticCurveTo(x+l+Math.cos(a)*len*.6,320-h+12+Math.sin(a)*len*.6,x+l+Math.cos(a)*len+(rnd()-.5)*6,320-h+12+Math.sin(a)*len*.7+len*.35);g.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}

export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Stepping down into the grass at first light');
 const k=await kit(root,8808);const M=materials(k);const {box,cylinder,beam,mesh}=k;
 const earth=k.surface('earth',0x4a4630,70,.95),embGrass=k.surface('moss',0x7a7550,10,1),timber=k.surface('cedar',0x5a4634,1,.85);
 // ── Terrain: flat walkable plain rolling into hills ──
 const ground=new THREE.PlaneGeometry(700,700,140,140);ground.rotateX(-Math.PI/2);const gp=ground.attributes.position;for(let i=0;i<gp.count;i++)gp.setY(i,groundH(gp.getX(i),gp.getZ(i)-60)-.02);ground.computeVertexNormals();const gm=mesh(ground,earth,0,0,-60);gm.castShadow=false;
 // Trampled path: a lighter earth ribbon through the grass.
 for(let i=0;i<PATH.length-1;i++){const [ax,az]=PATH[i],[bx,bz]=PATH[i+1],len=Math.hypot(bx-ax,bz-az);const p=mesh(new THREE.PlaneGeometry(1.3,len+1.2),k.surface('earth',0x7a6a4c,4,1),(ax+bx)/2,.012,(az+bz)/2);p.rotation.x=-Math.PI/2;p.rotation.z=Math.atan2(bx-ax,bz-az);p.castShadow=false;}
 // ── Embankment and main line ──
 box(9,1.2,300,TX,.6,10,embGrass);for(const s of [-1,1]){const sl=box(2.6,.15,300,TX+s*5.4,.55,10,embGrass);sl.rotation.z=-s*.5;}
 track(k,M,TX,150,-150,RT);
 progress(.3,'Finding the halted express');
 const trainG=new THREE.Group();trainG.position.set(TX,RT,0);k.batch.add(trainG);
 const loco=new THREE.Group();loco.position.z=-1;trainG.add(loco);locomotive(k,M,loco);
 const tend=new THREE.Group();tend.position.z=8.7;trainG.add(tend);tender(k,M,tend);
 ['NIGHT  2','NIGHT  3','DINING','SLEEPER'].forEach((label,i)=>{const g=new THREE.Group();g.position.z=21.2+i*18.4;trainG.add(g);carriage(k,M,g,{label,lit:i%2===0});});
 {const g=new THREE.Group();g.position.z=21.2+4*18.4-.5;trainG.add(g);box(2.6,2.4,16,0,2.3,0,k.surface('cedar',0x3e2a20,2,.9),g);box(2.7,.14,16.2,0,3.55,0,M.roofCanvas,g);box(2,.3,16,0,1,0,M.black,g);for(const z of [-5.5,5.5])for(const s of [-1,1])for(const zz of [-.9,.9]){const w=k.cylinder(.43,.43,.12,s*.62,.43,z+zz,M.black,20,g);w.rotation.z=Math.PI/2;}box(.05,2,2.4,1.33,2.1,-3,M.oxDark,g);}
 // ── Branch line curving toward the Floating Quarter ──
 const branch=new THREE.CatmullRomCurve3([[-7,0,-26],[-3,0,-36],[0,0,-46],[8,0,-64],[24,0,-88],[50,0,-120],[90,0,-160]].map(p=>new THREE.Vector3(...p)));
 const sl=k.surface('cedar',0x4a3c2e,1,.95),bl=k.surface('rock',0x7a7064,1,.95);
 {const n=Math.floor(branch.getLength()/.65),inst=new THREE.InstancedMesh(new THREE.BoxGeometry(2.1,.14,.24),sl,n),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();for(let i=0;i<n;i++){const t=i/n,p=branch.getPointAt(t),d=branch.getTangentAt(t);e.set(0,Math.atan2(d.x,d.z),0);q.setFromEuler(e);m.compose(new THREE.Vector3(p.x,.07,p.z),q,new THREE.Vector3(1,1,1));inst.setMatrixAt(i,m);}k.batch.add(inst);
  for(const off of [-.535,.535]){const pts=[];for(let i=0;i<=160;i++){const t=i/160,p=branch.getPointAt(t),d=branch.getTangentAt(t);pts.push(new THREE.Vector3(p.x+d.z*off,.2,p.z-d.x*off));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),320,.05,4,false),M.rail);}
  const bal=[];for(let i=0;i<=120;i++){const t=i/120,p=branch.getPointAt(t);bal.push(new THREE.Vector3(p.x,.02,p.z));}const bm=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bal),240,1.4,6,false),bl);bm.scale.y=.08;bm.castShadow=false;}
 // Junction lever, semaphore and milepost at the fork.
 box(.4,.6,.6,-4.6,.3,-29,M.black);beam([-4.6,.5,-29],[-4.2,1.4,-29.4],.04,M.steel);cylinder(.08,.1,6,-5.6,3,-34,M.black,8);box(.15,1.4,.08,-5.2,5.2,-34,M.red);box(1.4,.14,.08,-4.7,5.6,-34,M.red);box(.24,.24,.12,-5.6,5.1,-33.9,M.lampGlass);
 const ms=signTexture([{text:'FLOATING QUARTER  12 km  →',size:64,weight:'bold',y:80},{text:'←  HOLLOWMOOR  41 km',size:52,y:176}],{bg:'#e8dcc0',fg:'#2a221a',border:'#3a2e22',w:1024,h:256});for(const sgn of [-1,1]){const sp=mesh(new THREE.PlaneGeometry(2,.5),new THREE.MeshStandardMaterial({map:ms,roughness:.9}),3.2,1.7,-41.5+sgn*.03);sp.rotation.y=sgn>0?-.5:-.5+Math.PI;}box(.1,2.1,.1,3.2,1.05,-41.5,timber);box(2.1,.6,.05,3.2,1.7,-41.5,timber).rotation.y=-.5;
 progress(.45,'Planting a sea of silver grass');
 // ── Susuki: three layers. Near clumps (full detail), mid clumps (lite), and painted alpha cards to the hills ──
 const leafMat=windMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide,emissive:0x1a1408,emissiveIntensity:.3}),.42,true);
 const plumeMat=windMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide,emissive:0xffb8a0,emissiveIntensity:.42}),.42,true);
 const near=[0,1,2,3].map(i=>clumpGeometry(i,{blades:8+i%3,stalks:2+i%2,height:1.05+i*.07}));
 const lite=[0,1].map(i=>clumpGeometry(20+i,{blades:5,stalks:2,height:1.15,segs:2,strands:4}));
 const tufts=[0,1].map(i=>clumpGeometry(10+i,{blades:7,tuft:true,segs:2}));
 const nearP=near.map(()=>[]),liteP=lite.map(()=>[]),tuftP=tufts.map(()=>[]),cardP=[];
 const bpts=[];for(let i=0;i<=200;i++)bpts.push(branch.getPointAt(i/200));const branchDist=(x,z)=>{let b=1e9;for(const p of bpts)b=Math.min(b,(p.x-x)**2+(p.z-z)**2);return Math.sqrt(b);};
 const onEmb=x=>x>-19.6&&x<-6.6,hutD=(x,z)=>Math.hypot(x-26,z+24);
 // Near field: the whole walkable plain plus a 25 m margin, about one clump per 0.75 m².
 for(let i=0;i<9000;i++){const x=-6.4+r()*72,z=-75+r()*145;if(onEmb(x)||hutD(x,z)<4)continue;const pd=pathDist(x,z),nb=z<-20&&branchDist(x,z)<2.2;
  if(inArena(x,z)||pd<1.0||nb){if(!nb&&pd>.55)tuftP[i%2].push([x,groundH(x,z),z,.8+r()*.6]);continue;}
  nearP[i%4].push([x,groundH(x,z),z,(pd<2.2?.7:1)*(.85+r()*.45)]);}
 for(let i=0;i<6500;i++){const x=-6.4+r()*72,z=-75+r()*145;if(onEmb(x)||hutD(x,z)<4||inArena(x,z)||pathDist(x,z)<.6||(z<-20&&branchDist(x,z)<1.6))continue;tuftP[i%2].push([x,groundH(x,z),z,.9+r()*.7]);}
 for(let i=0;i<2400;i++){const x=ARENA.x0+r()*(ARENA.x1-ARENA.x0),z=ARENA.z0+r()*(ARENA.z1-ARENA.z0);tuftP[i%2].push([x,0,z,.7+r()*.8]);}
 for(let i=0;i<2600;i++){const t=r(),p=PATH[Math.floor(t*(PATH.length-1))],q=PATH[Math.floor(t*(PATH.length-1))+1],u=r();const x=p[0]+(q[0]-p[0])*u+(r()-.5)*2.4,z=p[1]+(q[1]-p[1])*u+(r()-.5)*2.4;if(pathDist(x,z)<.5)continue;tuftP[i%2].push([x,0,z,.6+r()*.6]);}
 // Embankment shoulders.
 for(let i=0;i<1600;i++){const s=r()<.5?-1:1,u=r(),x=TX+s*(4.3+u*2.4),z=-140+r()*290;const y=Math.max(0,1.15*(1-u));(r()<.4?tuftP[i%2]:liteP[i%2]).push([x,y,z,.6+r()*.5]);}
 // Mid field out to ~110 m: lite clumps over painted cards.
 for(let i=0;i<9000;i++){const x=-110+r()*230,z=-170+r()*260;if(x>-7&&x<66&&z>-76&&z<71)continue;if(onEmb(x))continue;const d=Math.hypot(x-10,z+10);if(d>125)continue;liteP[i%2].push([x,groundH(x,z),z,.9+r()*.5]);}
 for(let i=0;i<14000;i++){const x=-320+r()*640,z=-330+r()*480;if(x>-6&&x<60&&z>-70&&z<66)continue;if(onEmb(x)&&z>-150&&z<150)continue;cardP.push([x,groundH(x,z),z]);}
 const tmp=new THREE.Object3D(),tint=new THREE.Color();let grassBlades=0;
 const instance=(pair,list,{plumes=true}={})=>{if(!list.length)return;const mats=[];for(const [geo,mat] of [[pair.leaf,leafMat],[plumes?pair.plume:null,plumeMat]]){if(!geo)continue;const im=new THREE.InstancedMesh(geo,mat,list.length);mats.push(im);root.add(im);im.receiveShadow=true;im.castShadow=false;im.frustumCulled=false;}
  list.forEach(([x,y,z,sc],i)=>{tmp.position.set(x,y-.02,z);tmp.rotation.set((r()-.5)*.08,r()*Math.PI*2,(r()-.5)*.08);tmp.scale.setScalar(sc);tmp.updateMatrix();tint.setHSL(.09+r()*.04,.2+r()*.15,.5+r()*.32);for(const im of mats){im.setMatrixAt(i,tmp.matrix);im.setColorAt(i,tint);}});
  grassBlades+=list.length*(pair.leaf.attributes.position.count/6);};
 near.forEach((g,i)=>instance(g,nearP[i]));lite.forEach((g,i)=>instance(g,liteP[i]));tufts.forEach((g,i)=>instance(g,tuftP[i]));
 {const cardTex=grassCardTexture();const cardMat=windMaterial(new THREE.MeshStandardMaterial({map:cardTex,alphaTest:.42,side:THREE.DoubleSide,color:0xd8ccb0,roughness:.95,emissive:0x2a1810,emissiveIntensity:.35}),.25);
  const a=new THREE.PlaneGeometry(1,1);a.translate(0,.5,0);const b=a.clone();b.rotateY(Math.PI/2);const card=mergeGeos([a,b]);const im=new THREE.InstancedMesh(card,cardMat,cardP.length);
  cardP.forEach(([x,y,z],i)=>{const d=Math.hypot(x-10,z+10);tmp.position.set(x,y-.15,z);tmp.rotation.set(0,r()*Math.PI,0);tmp.scale.set(5+r()*3+d*.01,1.5+r()*.6+d*.003,5+r()*3);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});im.frustumCulled=false;root.add(im);}
 progress(.62,'Raising the far ridges');
 // ── Layered ridgelines dissolve into the peach haze ──
 const ridge=(z0,amp,base,color,side=0)=>{const P=[],idx=[];const n=220;for(let i=0;i<=n;i++){const t=i/n,u=-1100+t*2200;const ridged=Math.pow(1-Math.abs(noise(u*.007+z0*.01,z0)*2-1),1.6);const hh=base+amp*(ridged*.7+noise(u*.022,z0*2)*.26+noise(u*.07,z0)*.04);const [x,z]=side?[side*Math.abs(z0),u]:[u,z0];P.push(x,-5,z,x,hh,z);if(i<n){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(idx);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,fog:false}));root.add(m);};
 ridge(-520,240,40,0xc8a2a4);ridge(-380,160,30,0xa88a9a);ridge(-260,90,18,0x7e6e86);ridge(-190,45,10,0x5c5470);
 ridge(-300,70,6,0x9a8494,-1);ridge(-210,30,4,0x6a5e76,-1);ridge(-320,110,20,0x8c7c90,1);ridge(-230,55,10,0x645a74,1);ridge(260,60,10,0x7a6c84);
 // ── Lineside dressing: platelayers' hut with smoking chimney, telegraph lines, wayside Jizo ──
 {const g=new THREE.Group();g.position.set(26,0,-24);g.rotation.y=-.4;k.batch.add(g);box(4.2,2.6,3.2,0,1.3,0,k.surface('cedar',0x5c4634,2,.9),g);const ro=box(4.8,.12,4,0,2.9,0,M.roofCanvas,g);ro.rotation.x=.12;box(1,1.1,.06,-.8,1.4,1.62,M.windowDim,g);box(.8,1.9,.06,1.1,.95,1.62,M.oxDark,g);box(.4,1.4,.4,1.4,3.3,-.6,k.surface('stone',0x6a6058,1,.9),g);for(let i=0;i<5;i++)box(.6+r()*.4,.3,.6,-2.6,.15+i*.3,-1+r()*.4,timber,g);for(let i=0;i<6;i++)box(2,.12,.24,2.9,.06+i*.13,0,sl,g);}
 const pole=new THREE.Group();k.batch.add(pole);const wire=[];for(let z=-140;z<=140;z+=40){const g=new THREE.Group();g.position.set(TX-6,0,z);pole.add(g);telegraphPole(k,M,0,0,8,g,timber);if(z<140)for(const dx of [-.75,-.3,.3,.75])for(let j=0;j<8;j++){const a=j/8,b=(j+1)/8,sag=t=>-1.1*4*t*(1-t);wire.push(TX-6+dx,7.71+sag(a),z+a*40,TX-6+dx,7.71+sag(b),z+b*40);}}
 for(let i=0;i<5;i++){const t=.15+i*.17,p=branch.getPointAt(t),g=new THREE.Group();g.position.set(p.x+5,0,p.z+1);k.batch.add(g);telegraphPole(k,M,0,0,7,g,timber);}
 {const g=new THREE.Group();g.position.set(-3.6,0,24);g.rotation.y=.5;k.batch.add(g);box(1.8,.3,1,0,.15,0,k.surface('stone',0x8a8478,1,.9),g);for(const x of [-.5,0,.5]){const st=k.surface('stone',0x9a968a,1,.9);k.cylinder(.13,.17,.5,x,.55,0,st,10,g);k.mesh(new THREE.SphereGeometry(.13,12,10),st,x,.92,0,g);k.mesh(new THREE.ConeGeometry(.17,.18,10,1,true),new THREE.MeshStandardMaterial({color:0xb02a1e,roughness:.9,side:THREE.DoubleSide}),x,.72,0,g);}for(const x of [-.85,.85])k.cylinder(.04,.04,1.6,x,.8,-.3,timber,6,g);const rf=box(2.1,.06,1,0,1.62,-.1,timber,g);rf.rotation.x=.2;}
 // Distant walled quarter, its lanterns still burning in daylight.
 const qlamps=[];for(let i=0;i<14;i++){const x=70+i*9+r()*4,z=-140-r()*14,h=5+r()*6,y0=groundH(x,z)-1;box(8,h,8,x,y0+h/2,z,new THREE.MeshBasicMaterial({color:0x5a4650}));const c=mesh(new THREE.ConeGeometry(6.4,3.4,4),new THREE.MeshBasicMaterial({color:0x4a3a44}),x,y0+h+1.7,z);c.rotation.y=Math.PI/4;qlamps.push([x-2,y0+h*.6,z+4.2],[x+2,y0+h*.5,z+4.2]);}
 box(140,4,2,130,groundH(130,-134)+1,-134,new THREE.MeshBasicMaterial({color:0x5a4a52}));
 const qg=glows(root,qlamps,{size:3.6,color:0xff6a40});qg.material.fog=false;
 // ── Dawn sky: warm gold at the horizon round a low sun, cooling to blue-violet overhead ──
 const SUN=new THREE.Vector3(-.75,.12,-.55).normalize();
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sun:{value:SUN},time:{value:0},hor:{value:new THREE.Color(0xf6b27e)},mid:{value:new THREE.Color(0xdba2a8)},zen:{value:new THREE.Color(0x6b78b4)},glow:{value:new THREE.Color(0xffa860)},cloud:{value:new THREE.Color(0xd8909a)}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:`uniform vec3 sun,hor,mid,zen,glow,cloud;uniform float time;varying vec3 vDir;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
  void main(){vec3 d=normalize(vDir);float y=d.y;float m=max(dot(d,sun),0.);
   float side=pow(max(dot(normalize(vec3(d.x,0.,d.z)+1e-4),normalize(vec3(sun.x,0.,sun.z))),0.)*.5+.5,2.);
   vec3 c=mix(hor*mix(.7,1.15,side),mid,smoothstep(0.,.22,y));c=mix(c,zen,smoothstep(.15,.8,y));
   c+=glow*(pow(m,6.)*.55+pow(m,40.)*.9);c=mix(c,vec3(1.,.95,.84)*3.,smoothstep(.99955,.9998,m));
   vec2 uv=d.xz/(y+.1)*vec2(.5,1.6);float cl=smoothstep(.5,.78,fbm(uv*.9+vec2(time*.004,0.)))*smoothstep(.02,.09,y)*(1.-smoothstep(.22,.45,y));
   c=mix(c,mix(cloud,glow*1.2,pow(m,4.)),cl*.7);if(y<0.)c=hor*.9;gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`}));sky.frustumCulled=false;sky.renderOrder=-10;root.add(sky);
 // Ground mist: long soft bands that fade near the eye and catch the low light.
 const mistMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},color:{value:new THREE.Color(0xffd6bc)}},
  vertexShader:'varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float time;uniform vec3 color;varying vec2 vUv;varying float vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){float k=n(vec2(vUv.x*9.+time*.03,vUv.y*2.))*.6+n(vec2(vUv.x*23.-time*.05,vUv.y*4.))*.4;float a=smoothstep(.25,.75,k)*pow(sin(vUv.y*3.14159),1.6)*smoothstep(8.,30.,vD)*.42;gl_FragColor=vec4(color,a);}'});
 for(let i=0;i<14;i++){const z=-150+i*15+r()*8,w=160+r()*120,hgt=3+r()*4;const m=mesh(new THREE.PlaneGeometry(w,hgt),mistMat,-20+(r()-.5)*60,groundH(0,z)+hgt*.35,z);m.rotation.y=(r()-.5)*.3;m.castShadow=false;m.receiveShadow=false;m.renderOrder=2;}
 // ── Light, steam and mist ──
 const fire=new THREE.PointLight(0xff8a40,18,10,1.6);fire.position.set(TX,RT+2.4,3.6);root.add(fire);
 const gl=glows(root,[[TX,RT+3.4,-8.15]],{size:3.2,color:0xfff4d8});
 const plumes=[steam(root,{origin:[TX,RT+4.3,-6.2],count:130,rise:11,spread:2.4,size:5.5,life:9,wind:[1.4,0,1.0],color:0xfff0e4,opacity:.4}),
  steam(root,{origin:[TX+1.4,RT+1.1,-6.3],count:60,rise:1.4,spread:3,size:3.6,life:3,wind:[1.5,0,.6],color:0xfff6ee,opacity:.32}),
  steam(root,{origin:[TX+1.2,RT+.5,20],count:40,rise:1.6,spread:1.4,size:2.5,life:4,wind:[.9,0,.4],color:0xfff6ee,opacity:.2}),
  steam(root,{origin:[26.8,3.8,-24.6],count:40,rise:4,spread:.8,size:2.2,life:6,wind:[.8,0,.5],color:0xb0a8a0,opacity:.28,dark:.4}),
  steam(root,{origin:[20,-.2,-30],count:110,rise:.6,spread:110,size:16,life:30,wind:[.5,0,.3],color:0xffe2cc,opacity:.12}),
  steam(root,{origin:[10,-.2,40],count:70,rise:.5,spread:80,size:14,life:30,wind:[.4,0,-.2],color:0xffe6d4,opacity:.1})];
 const birds=(()=>{const n=22,p=new Float32Array(n*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:0x2a2228,size:.32,sizeAttenuation:true}));pts.frustumCulled=false;root.add(pts);const seeds=[...Array(n)].map(()=>[r(),r(),r()]);return t=>{seeds.forEach(([a,b,c],i)=>{const ang=t*.12+a*6.28;p[i*3]=40+Math.cos(ang)*(20+b*14)+Math.sin(t*.5+i)*2;p[i*3+1]=26+c*8+Math.sin(t*1.3+i)*1.2;p[i*3+2]=-110+Math.sin(ang)*(16+b*10);});g.attributes.position.needsUpdate=true;};})();
 const wl=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(wire,3)),new THREE.LineBasicMaterial({color:0x3a3036}));root.add(wl);
 k.finish();progress(.95,'The minute ends');

 const blocked=(x,z)=>Math.hypot(x-26,z+24)<3.2||Math.hypot(x+3.6,z-24)<1.3||Math.hypot(x-3.2,z+41.5)<.5||Math.hypot(x+4.6,z+29)<.6||Math.hypot(x+5.6,z+34)<.4;
 return {texturesLoaded:14,grassBlades:Math.round(grassBlades),discoveries:clues['express-dawn'],
  views:{plain:{pos:[3,1.8,40],look:[-8,4,-8],name:'The dawn plain',sub:'Silver grass to the horizon. The express has finally stopped.'},
   engine:{pos:[-3,2.1,-14],look:[TX,4,0],name:'The halted engine',sub:'A bronze bell rides above the boiler.'},
   clearing:{pos:[18,2.2,10],look:[0,2,-6],name:'The grass clearing',sub:'Trampled flat beside the engine — room enough for a fight.'},
   branch:{pos:[-1.5,2.4,-38],look:[40,4,-110],name:'Toward the Quarter',sub:'A branch line curves toward lanterns that are still burning.'}},
  canWalk(x,z){return x>-6.4&&x<40&&z>-50&&z<45&&!blocked(x,z);},walkHeight:()=>0,
  locationAt(x,z){return inArena(x,z)?'The grass clearing':z<-26?'The branch line':x<-2&&z<14?'Beside the engine':'The dawn plain';},
  update(t,dt,cam){k.windTime.value=t;sky.material.uniforms.time.value=t;mistMat.uniforms.time.value=t;if(cam)sky.position.copy(cam.position);for(const p of plumes)p.update(t);birds(t);gl.material.opacity=.7;fire.intensity=16+Math.sin(t*11)*1.5+Math.sin(t*7.3)*1.2;},
  setEvening(){}};
}
