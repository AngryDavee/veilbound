import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { nightSky, precipitation } from '../atmosphere.js';
import { springsMaterials, snowRoof, glowSprites, steamField, waterSurface, fallSheet, snowTrees, terrain, mountains, snowMounds, snowPatches, stoneLantern, snowBoulder, rng, fbm } from './common.js';
// Region VI·3 — The Steam Basin. A cedar-lined path descends to a flat stone shelf above an
// open-air hot spring ringed with black boulders. A waterfall feeds the pool; the last anchor
// bell sits half-submerged in it, and a lamplit sliding door glows beneath the water.
const PC=[0,-28],PR=[15.5,12.5];
const inPool=(x,z)=>((x-PC[0])/PR[0])**2+((z-PC[1])/PR[1])**2<1+.06*Math.sin(Math.atan2(z-PC[1],x-PC[0])*5)&&x<13.1&&z<-15.6;
function segDist(x,z){const t=THREE.MathUtils.clamp((z+14)/54,0,1),cz=-14+t*54;return Math.hypot(x,z-cz);}
function ground(x,z){if(inPool(x,z))return -3.2;const d=segDist(x,z);let h=THREE.MathUtils.smoothstep(d,17.5,58)*(26+22*fbm(x*.03,z*.03,4));if(z<-40.3)h=Math.max(h,15.5+THREE.MathUtils.smoothstep(-z,40.3,70)*30*(.6+.6*fbm(x*.04,z*.03,3))-Math.max(0,Math.abs(x)-12)*.0);if(z>-15.6&&Math.abs(x)<14&&z<8)h=Math.min(h,0);if(Math.abs(x)<3.5&&z>=7&&z<40)h=Math.min(h,0);if(x>12.8&&x<17.6&&z<-13&&z>-36)h=Math.min(h,0);return h+(d>16?fbm(x*.3,z*.3,2)*.7:0);}
export async function create(root,renderer,progress,{camera}={}){
 progress(.08,'Descending into the steam');
 const k=await kit(root,8181),M=springsMaterials(k),R=rng(8181),B=k.batch,trunks=[],lamps=[],mounds=[];
 const box=(w,h,d,x,y,z,m)=>k.box(w,h,d,x,y,z,m);
 const moonDir=[.22,.46,-.86];
 const sky=nightSky(root,{top:0x050914,horizon:0x2a364c,glow:0x5a6680,moonDir,moonSize:52,clouds:.42,cloudColor:0x222a3c,stars:2000,starBrightness:.85,seed:13});
 terrain(root,k,{size:300,seg:200,cx:0,cz:-10,height:ground,repeat:60,rockSlope:[.42,.78]});
 mountains(root,k,{r0:170,peak:300,seed:17});
 progress(.2,'Laying the stone shelf');
 // Shelf of large irregular flagstones over dark grout.
 box(28,.12,23.6,0,-.07,-4,M.grout);
 for(let z=7.6;z>-15.6;){const d=1.1+R()*.8;for(let x=-13.8;x<13.8;){const w=Math.min(1.2+R()*1.2,13.8-x);const s=box(w-.06,.16,d-.06,x+w/2,-.04,z-d/2,M.paving);s.rotation.y=(R()-.5)*.02;x+=w;}z-=d;}
 // Jetty slab reaching toward the bell, with stone steps down into the water.
 box(4.6,.5,3.2,0,-.2,-17,M.stone);for(let i=0;i<4;i++)box(3.6,.18,.5,0,-.35-i*.3,-18.85-i*.45,M.stone);
 // Approach path of stepping stones from the south.
 for(let z=7.6;z<38;){const d=.9+R()*.5;box(5-R()*.6,.16,d-.08,(R()-.5)*.3,-.04,z+d/2,M.paving);z+=d;}
 // East ledge: slabs laid over boulders along the pool, leading to the exit.
 for(let z=-14;z>-35.5;){const d=1+R()*.7;box(4.2+R()*.4,.3,d-.07,15.2+(R()-.5)*.3,-.1,z-d/2,M.stone);z-=d;}
 // Boulders: black volcanic rock ringing the pool, shelf and path, each wearing a snow cap.
 const boulder=(x,z,s,y=0)=>snowBoulder(k,M,B,x,y,z,s,R);
 for(let i=0;i<46;i++){const a=i/46*Math.PI*2,rr=1+.06*Math.sin(a*5);let x=PC[0]+Math.cos(a)*PR[0]*rr*1.02,z=PC[1]+Math.sin(a)*PR[1]*rr*1.02;if(z>-17.6&&Math.abs(x)<3)continue;if(x>12.4&&z>-36)continue;boulder(x,z,1.0+R()*1.4,-.6);}
 for(let i=0;i<14;i++){const s=R()<.5?-1:1;boulder(s*(14.6+R()*2.4),-14+R()*21,1.1+R()*1.6);}
 for(let i=0;i<24;i++){const s=R()<.5?-1:1;boulder(s*(3.4+R()*3),8+R()*30,.5+R()*1.3);}
 for(let i=0;i<10;i++)boulder(18.6+R()*2,-14-R()*22,1.2+R()*1.4);
 // Rocks standing out of the pool, and the cliff's fallen blocks around the waterfall.
 for(const [x,z,s] of [[-8,-24,1.3],[-11,-33,1.8],[7,-36,1.5],[-4,-37.5,2.0],[4,-39,1.6],[-9,-38.5,2.4],[10.5,-22,1.0]])boulder(x,z,s,-1.4);
 for(let i=0;i<16;i++){const x=-14+i*1.9+R(),y=2+R()*12;boulder(x,-41.5-R()*2,1.6+R()*1.8,y);}
 progress(.36,'Raising the gate and lanterns');
 // A weathered wooden gate over the path with a twisted rope and paper streamers.
 {const gz=16;for(const s of [-1,1]){box(.42,4.4,.42,s*2.6,2.2,gz,M.innDark);box(.7,.4,.7,s*2.6,.2,gz,M.stone);box(.5,.12,.5,s*2.6,4.46,gz,M.snow);}box(6.8,.36,.44,0,4.2,gz,M.innDark);box(7.2,.2,.6,0,4.48,gz,M.snow);box(5.6,.26,.3,0,3.5,gz,M.innDark);
  const pts=[];for(let i=0;i<=16;i++){const x=-2.4+i*.3;pts.push(new THREE.Vector3(x,3.15-.35*Math.sin(i/16*Math.PI),gz));}k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.09,6,false),M.rope);
  for(let i=1;i<16;i+=3){const p=pts[i];for(let j=0;j<3;j++)box(.16,.12,.02,p.x+(j%2?.04:-.04),p.y-.2-j*.12,gz,M.plaster);}}
 for(const [x,z] of [[-3.3,10],[3.3,10],[-3.3,24],[3.3,24],[-3.3,34],[3.3,34],[-12.9,6.6],[12.9,6.6],[-12.9,-14.6],[12.4,-14.6],[16.8,-35]]){lamps.push(stoneLantern(k,M,B,x,z,0,x>16?1.1:1));}
 // A small shelter where bathers once left their sandals: lean-to roof, shelf, wooden buckets.
 {const sx=-17.5,sz=-2;for(const [dx,dz] of [[-1.6,-2],[1.6,-2],[-1.6,2],[1.6,2]])box(.2,2.8,.2,sx+dx,1.4,sz+dz,M.innDark);snowRoof(k,M,B,{x:sx,y:2.8,z:sz,w:4.4,d:3.6,rise:.8,over:.6,side:.4,R,rotY:Math.PI/2});box(3,.08,.5,sx+.3,1.0,sz+1.6,M.innWood);for(let i=0;i<4;i++)k.cylinder(.2,.17,.3,sx-.9+i*.6,1.2,sz+1.6,M.innWood,10);box(.2,2.6,4.2,sx-1.6,1.3,sz,M.innWood);}
 progress(.48,'Setting the last bell');
 // The last anchor bell: a bonshō of aged bronze, hung in a heavy timber frame with a log striker.
 {const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#5e4a30';g.fillRect(0,0,512,256);
  for(let i=0;i<2600;i++){const x=Math.random()*512,y=Math.random()*256,r=Math.random()*3+1;g.fillStyle=Math.random()<.5?'rgba(40,30,20,.35)':'rgba(110,86,52,.25)';g.fillRect(x,y,r,r);}
  for(let i=0;i<120;i++){const x=Math.random()*512,y0=Math.random()*150,len=50+Math.random()*150,w=2+Math.random()*9;const gr=g.createLinearGradient(0,y0,0,y0+len);gr.addColorStop(0,'rgba(112,170,140,.9)');gr.addColorStop(1,'rgba(112,170,140,0)');g.fillStyle=gr;g.fillRect(x,y0,w,len);}
  for(let i=0;i<60;i++){g.fillStyle='rgba(96,150,120,.55)';g.beginPath();g.arc(Math.random()*512,Math.random()*90,6+Math.random()*16,0,7);g.fill();}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=THREE.RepeatWrapping;M.patina=new THREE.MeshStandardMaterial({map:tex,metalness:.78,roughness:.55,side:THREE.DoubleSide});}
 const BX=0,BZ=-25,BY=-.95;const bell=new THREE.Group();bell.position.set(BX,BY,BZ);bell.rotation.y=0;B.add(bell);
 {const prof=[[0,2.92],[1.06,2.72],[1.1,.3],[1.2,.03],[1.33,0],[1.32,.13],[1.25,.42],[1.2,1.0],[1.18,2.6],[1.13,2.86],[.97,3.03],[.62,3.13],[0,3.17]].reverse().map(([r,y])=>new THREE.Vector2(r,y));
  k.mesh(new THREE.LatheGeometry(prof,48),M.patina,0,0,0,bell);
  const rAt=y=>y<.42?1.25+(.42-y)*.18:y<1?1.25-(y-.42)/.58*.05:1.2-(y-1)/1.6*.02;
  for(const [y,tb] of [[.48,.06],[1.12,.05],[1.95,.06],[2.06,.035],[2.66,.06]]){const b=k.mesh(new THREE.TorusGeometry(rAt(y)+.015,tb,6,48),M.patina,0,y,0,bell);b.rotation.x=Math.PI/2;}
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;for(const d of [-.07,.07]){const v=k.box(.05,2.18,.06,0,0,0,M.patina,bell);v.position.set(Math.cos(a+d/1.2)*1.205,1.57,Math.sin(a+d/1.2)*1.205);v.rotation.y=-(a+d/1.2);}}
  for(let pnl=0;pnl<4;pnl++){const a0=pnl/4*Math.PI*2+Math.PI/4;for(let r=0;r<3;r++)for(let c2=0;c2<4;c2++){const a=a0+(c2+1)/5*Math.PI/2,y=2.18+r*.16;k.mesh(new THREE.SphereGeometry(.05,6,4),M.patina,Math.cos(a)*1.215,y,Math.sin(a)*1.215,bell);}}
  for(const a of [0,Math.PI]){const sx=Math.cos(a)*1.22,sz=Math.sin(a)*1.22;const seat=k.cylinder(.24,.26,.07,sx,1.72,sz,M.patina,18,bell);seat.rotation.z=Math.PI/2;const ring=k.mesh(new THREE.TorusGeometry(.26,.03,5,20),M.patina,sx*1.02,1.72,sz,bell);ring.rotation.y=Math.PI/2;for(let i=0;i<8;i++){const pa=i/8*Math.PI*2;k.mesh(new THREE.SphereGeometry(.045,5,4),M.patina,sx*1.04,1.72+Math.sin(pa)*.17,sz+Math.cos(pa)*.17,bell);}}
  for(const s of [-1,1]){k.mesh(new THREE.TorusGeometry(.34,.085,8,18,Math.PI),M.patina,0,3.18,s*.09,bell);k.box(.24,.2,.3,s*.36,3.2,0,M.patina,bell).rotation.z=s*.4;k.mesh(new THREE.SphereGeometry(.07,6,5),M.patina,s*.42,3.3,s*.11,bell);}
  k.box(.14,.16,.38,0,3.56,0,M.patina,bell);k.cylinder(.16,.2,.12,0,3.2,0,M.patina,10,bell);}
 {const P=[[-2.7,-2.2],[2.7,-2.2],[-2.7,2.2],[2.7,2.2]];for(const [dx,dz] of P){box(.46,8.4,.46,BX+dx,1.4,BZ+dz,M.innDark);box(.9,.5,.9,BX+dx,-.45,BZ+dz,M.stone);}
  for(const dz of [-2.2,2.2]){box(6.2,.42,.42,BX,5.4,BZ+dz,M.innDark);box(6.0,.26,.3,BX,3.9,BZ+dz,M.innDark);}for(const dx of [-2.7,2.7])box(.42,.42,5.2,BX+dx,5.4,BZ,M.innDark);
  box(.5,.5,5.4,BX,5.9,BZ,M.innDark);box(8.2,.34,.4,BX+.9,5.0,BZ,M.innDark);
  for(const [dx,dz] of P)for(const ax of ['x','z']){const tx=ax==='x'?BX+dx*.6:BX+dx,tz=ax==='z'?BZ+dz*.6:BZ+dz;k.beam([BX+dx,4.4,BZ+dz],[tx,5.25,tz],.09,M.innDark);}
  snowRoof(k,M,B,{x:BX,y:6.2,z:BZ,w:6.8,d:5.8,rise:1.5,over:.8,side:.55,R});
  k.cylinder(.06,.06,2.6,BX,4.55,BZ,M.iron,8);k.mesh(new THREE.TorusGeometry(.16,.045,6,14),M.iron,BX,3.2,BZ);
  const logY=BY+1.72+.02;const lg=k.cylinder(.21,.19,3.0,BX+3.05,logY,BZ,M.innWood,10);lg.rotation.z=Math.PI/2;k.cylinder(.22,.22,.08,BX+1.58,logY,BZ,M.innDark,10).rotation.z=Math.PI/2;
  for(const x of [2.2,3.9])for(const dz of [-.22,.22])k.beam([BX+x,logY+.18,BZ],[BX+x,4.85,BZ+dz],.022,M.rope);k.box(3,.08,.3,BX+3.05,logY+.24,BZ,M.snow);}
 // The lamplit sliding door lying open-faced on the pool floor.
 {const dg=new THREE.Group();dg.position.set(8.6,-1.5,-29);dg.rotation.set(-Math.PI/2+.12,0,.35);B.add(dg);k.box(2.3,3.2,.1,0,0,0,M.innDark,dg);k.box(2.0,2.9,.06,0,0,.05,M.window,dg);for(let i=-1;i<=1;i++)k.box(.05,2.9,.08,i*.66,0,.08,M.innDark,dg);for(let j=-2;j<=2;j++)k.box(2.0,.05,.08,0,j*.6,.08,M.innDark,dg);}
 // Waterfall: a rock lip and a falling sheet from the northern cliff into the pool.
 box(5,1.4,3,-3,15.6,-42,M.rock);box(4.4,.3,2.6,-3,16.4,-42.2,M.snow);
 const fallGeo=new THREE.PlaneGeometry(3.4,16.4,1,12);{const p=fallGeo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),t=(y+8.2)/16.4;p.setZ(i,(1-t)*(1-t)*1.6);p.setX(i,p.getX(i)*(1+(1-t)*.35));}fallGeo.translate(-3,7.7,-40.6);}
 const fall=fallSheet(root,fallGeo,{speed:2.2,opacity:.85,streaks:26});
 const fall2Geo=new THREE.PlaneGeometry(1.4,13,1,8);fall2Geo.translate(4.5,6.4,-41.2);const fall2=fallSheet(root,fall2Geo,{speed:1.7,opacity:.55,streaks:14});
 progress(.62,'Snow on the cedars');
 const trees=[];for(let i=0;i<620;i++){const a=R()*Math.PI*2,r=18+Math.pow(R(),1.3)*70,x=Math.cos(a)*r,z=-14+Math.sin(a)*r*1.1;const y=ground(x,z);if(y<.5||segDist(x,z)<17)continue;trees.push([x,y,z,.8+R()*1.0]);}
 for(let i=0;i<70;i++){const s=R()<.5?-1:1,x=s*(4.2+R()*9),z=8+R()*34;if(segDist(x,z)<4)continue;trees.push([x,ground(x,z),z,.7+R()*.7]);}
 await snowTrees(root,trees,{M,near:(x,z)=>segDist(x,z)<42});
 // Snow banks against boulders and along the shelf edge; soft patches on the flags.
 for(let i=0;i<40;i++){const s=R()<.5?-1:1;mounds.push([s*(13.8+R()*1.2),0,-15+R()*22,.8+R()*.8,.25+R()*.2,1+R()]);}
 for(let i=0;i<40;i++){const s=R()<.5?-1:1;mounds.push([s*(2.7+R()*.8),0,8+R()*30,.6+R()*.6,.2+R()*.15,.8+R()]);}
 snowMounds(root,M,mounds);
 const patches=[];for(let i=0;i<120;i++){const onPath=R()<.35;const x=onPath?(R()-.5)*4.6:(R()-.5)*27,z=onPath?8+R()*30:-15.4+R()*23;if(!onPath&&Math.abs(x)<11&&z<5&&z>-13&&R()<.7)continue;patches.push([x,.045,z,.3+R()*1.1,.3+R()*.8]);}
 for(let i=0;i<40;i++)patches.push([15.2+(R()-.5)*3.5,.24,-14-R()*21,.3+R()*.7,.3+R()*.6]);
 snowPatches(root,M,patches);
 // Water, steam, glows, snowfall and lights.
 const poolGeo=new THREE.PlaneGeometry(34,28,1,1);poolGeo.rotateX(-Math.PI/2);poolGeo.translate(0,-.5,-28);
 const water=waterSurface(root,poolGeo,{deep:0x0c1a20,sky:0x56667e,tint:0x3a6060,moonDir,opacity:.9,warm:0x0a0806,spot:[8.9,-28.6,3.4,.9],spot2:[0,-25,2.6,.32],spotColor:0xffa858});
 const steamPts=[];for(let i=0;i<90;i++){let x,z;do{x=(R()-.5)*30;z=-16-R()*25;}while(!inPool(x,z));steamPts.push([x,-.4,z]);}for(let i=0;i<8;i++)steamPts.push([-3+(R()-.5)*3,-.3,-39.8]);
 const steam=steamField(root,steamPts,{count:420,rise:9,life:12,size0:1.4,size1:7.5,opacity:.2,color:0xdfe6ee,wind:[.18,.25],jitter:[1.6,1.6]});
 const mist=steamField(root,[[-3,-.2,-39.5],[-2,-.2,-39],[-4,-.2,-38.8],[4.5,-.2,-40]],{count:70,rise:5,life:6,size0:1.5,size1:5,opacity:.3,color:0xeef2f8,wind:[0,.6],jitter:[3,1.5]});
 const glowItems=[...lamps.map(p=>[p.x,p.y,p.z,1.5,0xffb060]),...Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2;return [Math.cos(a)*1.35,-.42,-25+Math.sin(a)*1.35,1.6,0x7a3c18];}),[8.6,-1.6,-29,5.5,0xffa050]];
 const glows=glowSprites(root,glowItems,{intensity:1,flicker:.05});
 const snow=precipitation(root,{count:4800,color:0xf0f4ff,size:.075,area:[64,32,64],speed:1.1,drift:1.5,opacity:.88,seed:81});
 const bellLight=new THREE.PointLight(0xffa458,9,7,1.7);bellLight.position.set(0,-.1,-23);root.add(bellLight);
 const doorLight=new THREE.PointLight(0xffa050,26,10,1.6);doorLight.position.set(8.6,.3,-29);root.add(doorLight);
 for(const [x,y,z,i] of [[0,2.2,10,14],[0,2.2,30,14],[-12.9,2.2,-14.6,16],[12.4,2.2,-14.6,16],[16.8,2.3,-35,16]]){const l=new THREE.PointLight(0xffb06a,i,14,1.6);l.position.set(x,y,z);root.add(l);}
 k.finish();progress(.95,'Listening for the last bell');
 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 return {trunks,texturesLoaded:16,grassBlades:0,discoveries:clues['springs-basin'],
  views:{arrival:{pos:[0,2.0,33],look:[0,3,-14],name:'The cedar path',sub:'Stone lanterns lead down into the steam.'},shelf:{pos:[-6,2.4,4],look:[1,2,-28],name:'The steam shelf',sub:'Flat stone above the spring — room to stand.'},bell:{pos:[3.2,2.2,-17.6],look:[0,1.6,-25],name:'The last bell',sub:'Half-submerged, untouched by rust.'},door:{pos:[14.6,2.6,-25],look:[8.6,-2,-29.5],name:'The door in the water',sub:'It opens downward.'}},
  canWalk(x,z){return inR(x,z,-2.55,2.55,7,38.6)||inR(x,z,-13.6,13.6,-15.5,7.6)||inR(x,z,-2.1,2.1,-18.6,-15)||inR(x,z,13.2,17.3,-35.4,-14)||inR(x,z,12.8,13.8,-15.5,-13.6);},
  walkHeight(){return 0;},
  locationAt(x,z){return z>7.5?'The cedar path':x>13.1&&z<-15?'The east ledge':z<-15.5?'The bell jetty':'The steam shelf';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam);snow.update(t,cam);water.update(t);steam.update(t);mist.update(t);glows.update(t);fall.update(t);fall2.update(t);bellLight.intensity=8+2*Math.sin(t*.8);doorLight.intensity=24+4*Math.sin(t*1.3+1);},setEvening(){}};
}
