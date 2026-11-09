// World V · Region 2 — The Avenue of Blossoms.
// The quarter's main street: a fenced bed of cherry trees down the centre, lattice teahouses two and
// three storeys tall on both sides, lantern strings overhead, a cross street at the blossom crossing,
// and at the far end a red glow and smoke where the quarter has begun to burn.
import * as THREE from 'three';
import { kit } from '../kit.js';
import { nightSky } from '../atmosphere.js';
import { windMaterial } from '../../detail-world.js';
import { clues } from './story.js';
import { VERTICAL, HORIZONTAL } from './gate.js';
import { collector, quarterMaterials, signAtlas, teahouse, gableRoof, chochin, glowPoints, fireTower, motes, rng, cherry, blossomTexture, streetProps, smoke, flames } from './qkit.js';

export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Walking beneath the blossoms');
 const k=await kit(root,5202),M=quarterMaterials(k),S=signAtlas(VERTICAL,HORIZONTAL),C=collector(),glows=[],r=rng(5202),trunks=[];
 const sky=nightSky(root,{top:0x0c0618,horizon:0x4a2440,glow:0x8a5a80,moonDir:[-.35,.5,-.8],moonColor:0xf8e6dc,moonSize:48,clouds:.4,cloudColor:0x2c1c32,stars:1600});
 const blossom=windMaterial(new THREE.MeshStandardMaterial({map:blossomTexture(),alphaTest:.4,side:THREE.DoubleSide,roughness:.9,color:0xffffff,emissive:0x3a1822}),.08);

 // ---------- street surface, gutters, cherry bed ----------
 C.geo(M.paving,new THREE.PlaneGeometry(22,124),0,.01,0,-Math.PI/2);C.geo(M.paving,new THREE.PlaneGeometry(62,11.4),0,.012,0,-Math.PI/2);
 for(const s of [-1,1]){for(const zc of [31,-31]){C.box(M.stone,.22,.16,51,s*9.85,.08,zc);C.box(M.stone,.22,.16,51,s*10.35,.08,zc);C.geo(M.water,new THREE.PlaneGeometry(.3,51),s*10.1,.04,zc,-Math.PI/2);}
  for(const xc of [19.5,-19.5])if(Math.sign(xc)===s){C.box(M.stone,19,.16,.22,xc,.08,5.45);C.box(M.stone,19,.16,.22,xc,.08,-5.45);}}
 for(let i=0;i<110;i++){const x=(r()-.5)*18,z=(r()-.5)*112;C.box(M.stone,.6+r()*.5,.025,.4+r()*.4,x,.02,z,0,r()*3);}
 for(const [x,z,s] of [[-5,30,1.2],[6,18,1.5],[-4,-2,1.6],[5,-24,1.1],[-6,-40,1.4],[3,44,.9]]){const p=new THREE.Mesh(new THREE.CircleGeometry(s,20),M.puddle);p.rotation.x=-Math.PI/2;p.position.set(x,.03,z);p.scale.set(1,.6,1);root.add(p);}
 for(const [z0,z1] of [[14,44],[-46,-14]]){const zc=(z0+z1)/2,len=z1-z0;C.geo(M.moss,new THREE.PlaneGeometry(2.6,len),0,.06,zc,-Math.PI/2);C.box(M.stone,3.1,.22,len+.4,0,.03,zc);
  for(const s of [-1,1]){C.box(M.stone,.25,.3,len,s*1.42,.15,zc);C.box(M.bamboo,.06,.06,len,s*1.42,.75,zc);C.box(M.bamboo,.05,.05,len,s*1.42,.45,zc);for(let z=z0;z<=z1;z+=1.2)C.box(M.bamboo,.07,.85,.07,s*1.42,.42,z);}
  for(let z=z0+3;z<z1-1;z+=6.2)trunks.push(cherry(C,k,M,blossom,(r()-.5)*.5,z,{seed:Math.round(z*7),height:5+r()*1.4,spread:2.8+r()*.8,cards:24}));}
 // the great weeping cherry where petals refuse to fall
 const big=cherry(C,k,M,blossom,0,-17.5,{seed:777,height:7.5,spread:4.6,cards:46});trunks.push([0,-17.5,1.6]);
 for(let i=0;i<14;i++){const a=i/14*6.28;C.box(M.stone,.5,.35,.35,Math.cos(a)*2.2,.17,-17.5+Math.sin(a)*2.2,0,-a);}
 C.box(M.lacquer,.12,1.4,.12,1.9,.7,-14.4);C.box(new THREE.MeshStandardMaterial({color:0xf0e8d6,roughness:1}),.5,.9,.04,1.9,1.1,-14.32);// prayer board

 progress(.35,'Lighting the lattice fronts');
 // ---------- teahouses: main avenue (both sides) ----------
 let i=0;const walls=[M.plaster,M.plasterOchre,M.boardWall,M.plasterGrey];
 for(const side of [-1,1])for(const [zs,ze] of [[57,5.8],[-5.8,-60]]){let z=zs;while(z-7.5>ze-1){const corner=Math.abs(z-zs)<.1&&Math.abs(zs)<7;const w=corner?11.5:Math.min(7.8+r()*2.6,z-ze);if(w<5)break;teahouse(C,M,S,glows,{x:side*10.75,z:z-w/2,ry:side<0?Math.PI/2:-Math.PI/2,w,d:9.5,floors:corner||r()<.4?3:2,seed:300+i,sign:i%16,plaque:corner||i%4===0?1+(i%7):-1,wall:walls[i%4]});z-=w+.12;i++;}}
 // cross street houses facing into the crossing, and closing facades at its ends
 for(const s of [-1,1]){for(const sz of [-1,1]){let x=s*11;for(let j=0;j<2;j++){const w=8.5;teahouse(C,M,S,glows,{x:x+s*w/2+s*.1,z:sz*6.0,ry:sz<0?0:Math.PI,w,d:9,floors:2+(j%2),seed:400+j+s*3+sz*7,sign:(j+3)%16,wall:walls[(j+2)%4]});x+=s*(w+.2);}}
  teahouse(C,M,S,glows,{x:s*30.4,z:0,ry:s<0?Math.PI/2:-Math.PI/2,w:11,d:9,floors:3,seed:420+s,sign:6,plaque:3});}
 // back rank of roofs for the skyline
 for(const s of [-1,1])for(let j=0;j<12;j++)teahouse(C,M,S,glows,{x:s*24,z:52-j*9.6+(j>5?-2:0),ry:s<0?Math.PI/2:-Math.PI/2,w:9,d:8,floors:2+(j%3===0?1:0),seed:500+j+s,sign:-1});

 // ---------- overhead: lantern strings ----------
 for(const zz of [44,36,28,20,-22,-30,-38,-46]){C.beam(M.rope,[-10,5.6,zz],[0,5.0,zz],.03);C.beam(M.rope,[0,5.0,zz],[10,5.6,zz],.03);for(let q=-4;q<=4;q++)chochin(C,M,glows,q*2.1,4.8+Math.abs(q)*.09,zz,{s:.66,kind:(q+zz)%2?'red':'white',cord:.18});}
 for(const zz of [-8,8]){C.beam(M.rope,[-10,6.2,zz],[10,6.2,zz],.03);for(let q=-6;q<=6;q++)C.geo(q%2?M.norenRed:M.noren,new THREE.PlaneGeometry(.5,.7),q*1.45,5.75,zz);}// festival bunting at the crossing

 // ---------- street furniture outside the arena (crossing x±9, z±12) ----------
 const propList=[];for(const s of [-1,1])for(const [zz,kind] of [[48,'kanban'],[40,'buckets'],[33,'bench'],[25,'barrel'],[17,'kanban'],[-16,'pine'],[-21,'kanban'],[-28,'bench'],[-34,'buckets'],[-43,'kanban'],[-50,'barrel']])propList.push([kind,s*9.05,zz+(s>0?2:0),kind==='buckets'||kind==='bench'?s*-Math.PI/2:0]);
 for(const t of streetProps(C,M,S,glows,propList,r))trunks.push(t);
 // sparkling sake shop sugidama-like cedar balls and an iron fan wedged in a balcony rail (the clue)
 C.box(M.black,.04,.5,.04,9.3,4.1,-36);C.geo(M.bronze,new THREE.CircleGeometry(.45,12,0,Math.PI*.7),9.3,4.4,-36.2,0,-Math.PI/2,.6);

 progress(.55,'The far end of the avenue is burning');
 // ---------- the end of the avenue: kido gate, glow and smoke beyond ----------
 for(const s of [-1,1]){C.box(M.black,.38,4.8,.38,s*6,2.4,-57.5);C.box(M.stone,.7,.3,.7,s*6,.15,-57.5);}C.box(M.black,12.8,.34,.4,0,4.5,-57.5);C.geo(S.horizontal,S.hGeo(5,2.4,.6),0,3.95,-57.25);C.box(M.black,2.7,.75,.1,0,3.95,-57.32);gableRoof(C,M,{y:4.85,z:-57.5,w:13,d:1.2,rise:.7,over:.5,side:.3,ridgeH:.25,gable:false,rafters:false});
 for(let j=0;j<6;j++)teahouse(C,M,S,glows,{x:-27+j*11,z:-72,ry:0,w:10,d:8,floors:2+(j%2),seed:600+j,sign:-1,wall:M.boardWall});
 fireTower(C,M,glows,15,-76,{h:22});
 const fire=flames(root,Array.from({length:26},(_,q)=>({x:-30+q*2.4+(r()-.5)*2,y:7+r()*3,z:-74-r()*10,w:3+r()*3,h:5+r()*6,seed:r()})));
 const smk=smoke(root,Array.from({length:9},(_,q)=>({x:-28+q*7+(r()-.5)*4,y:8,z:-80-r()*20,w:14+r()*8,h:40+r()*20,seed:r()})),{opacity:.6});
 for(let q=0;q<30;q++)glows.push([-30+q*2+(r()-.5)*3,8+r()*4,-76-r()*8,1,.45,.15,6+r()*4]);

 progress(.8,'Scattering petals');
 C.build(root);k.finish();
 const glow=glowPoints(root,glows,renderer);
 const petals=motes(root,renderer,{count:2400,area:[44,16,44],speed:.45,size:.04,drift:1.6,base:0,seed:52});
 const frozen=motes(root,renderer,{count:500,area:[9,6.5,9],speed:0,size:.045,drift:.2,anchor:[0,.4,-17.5],fade:60,seed:53,colorA:[1,.8,.86],colorB:[1,.95,.97]});
 const lights=[[0,4.5,44,0xff9050,26],[0,4.5,26,0xff9050,26],[-6,4,10,0xffa060,30],[6,4,-4,0xffa060,30],[0,3,-17.5,0xffc0d0,22],[0,4.5,-30,0xff9050,26],[0,4.5,-46,0xff8040,26],[0,10,-70,0xff5a20,120]];
 const lamp=[];for(const [x,y,z,c,p] of lights){const l=new THREE.PointLight(c,p,z<-60?80:24,1.8);l.position.set(x,y,z);root.add(l);lamp.push(l);}
 const flick=lamp[7];

 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 const canWalk=(x,z)=>{if(trunks.some(([a,b,rr])=>Math.hypot(x-a,z-b)<rr))return false;if(Math.abs(x)<1.65&&((z>13.8&&z<44.2)||(z<-13.8&&z>-46.2)))return false;return inR(x,z,-9.6,9.6,-57,57)||inR(x,z,-28,28,-5,5);};
 progress(.97,'The lanterns are warm');
 return {texturesLoaded:14,grassBlades:0,trunks:[],discoveries:clues['quarter-avenue'],
  views:{arrival:{pos:[0,2.1,55],look:[0,5,0],name:'The Avenue of Blossoms',sub:'Cherry trees down the centre, lanterns on every eave.'},balconies:{pos:[-7.5,2.2,26],look:[6,5.2,10],name:'Empty balconies',sub:'Every room faces the fire-watch tower.'},crossing:{pos:[8,2.4,10],look:[-3,3,-15],name:'The blossom crossing',sub:'A future battle ground beneath the bunting.'},blossom:{pos:[4,1.9,-10],look:[0,4,-17.5],name:'The blossom that will not fall',sub:'Petals hang in the air, held by a stolen minute.'},firelight:{pos:[0,2.2,-46],look:[0,9,-80],name:'Firelight beyond the gate',sub:'The far end of the quarter is burning.'}},
  canWalk,walkHeight:()=>0,
  locationAt(x,z){return Math.abs(z)<12?'The blossom crossing':z>0?'The Avenue of Blossoms':z>-30?'Beneath the great cherry':'Toward the fire';},
  update(t,dt,cam){const c=cam||camera;sky.update(t,c);glow.update(t,c);petals.update(t,c);frozen.update(t,c);fire.update(t);smk.update(t);k.windTime.value=t;flick.intensity=120*(.8+.2*Math.sin(t*7)*Math.sin(t*3.1+1));},
  setEvening(){}};
}
