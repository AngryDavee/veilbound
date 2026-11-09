import * as THREE from 'three';
import { kit } from '../kit.js';
import { nightSky } from '../atmosphere.js';
import { clues } from './story.js';
import { cityMaterials, makeTools, glowField, streakField, wireField, signMaterial, rng, uvBox, canvasTexture, gasLamp } from './citykit.js';
import { roofTileMaterial, hipRoof } from './temple.js';

// The Cloudpiercer: the octagonal roof terrace of the twelve-storey observation tower,
// 52 m above a capital of lights. Terrace at y=0; the city floor is at y=-52.
const AP=18,CITY=-52;
export async function create(root,renderer,progress,{camera}={}){
 progress(.1,'Climbing twelve storeys');const k=await kit(root,5501);const M=cityMaterials(k);const T=makeTools(k,M);const {bx,put,cyl,litPlane}=T;const r=rng(777);
 const glows=glowField(root,renderer,{fogK:.0012}),streaks=streakField(root,{y:.07}),wires=wireField(root,M.wire);
 const sky=nightSky(root,{top:0x040a20,horizon:0x4a3848,glow:0x7a88b8,moonDir:[-.42,.36,-.83],moonSize:44,clouds:.62,cloudColor:0x1a2238,seed:77,stars:3000});
 const roofMat=roofTileMaterial(),soffit=new THREE.MeshStandardMaterial({color:0x22140f,roughness:.8,side:THREE.DoubleSide});
 const circles=[],boxes=[];const block=(x,z,w,d)=>boxes.push([x,z,w/2,d/2]);const grp=(x,y,z,ry=0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;k.batch.add(g);return g;};
 const octR=AP/Math.cos(Math.PI/8);

 // Terrace floor: wet terracotta tiles on an octagon, with puddles.
 const tileTex=canvasTexture(512,512,(c,w,h)=>{c.fillStyle='#2a2420';c.fillRect(0,0,w,h);const q=rng(2);const n=8,s=w/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=(q()-.5)*30;c.fillStyle=`rgb(${120+v|0},${70+v*.7|0},${52+v*.5|0})`;c.fillRect(x*s+3,y*s+3,s-6,s-6);c.fillStyle='rgba(0,0,0,.15)';c.fillRect(x*s+3,y*s+s-8,s-6,5);}});
 const floorMat=new THREE.MeshStandardMaterial({map:tileTex,roughness:.38,metalness:.08});
 const oct=new THREE.CylinderGeometry(octR,octR,.4,8);oct.rotateY(Math.PI/8);const uv=oct.attributes.uv,pp=oct.attributes.position;for(let i=0;i<pp.count;i++)uv.setXY(i,pp.getX(i)/4,pp.getZ(i)/4);put(oct,floorMat,0,-.2,0);
 const pud=new THREE.MeshStandardMaterial({color:0x080b10,roughness:.03,metalness:.85,envMapIntensity:.25});for(let i=0;i<14;i++){const a=r()*6.28,d=r()*14;const g=new THREE.CircleGeometry(1,16);const p=g.attributes.position;for(let j=1;j<p.count;j++){const an=Math.atan2(p.getY(j),p.getX(j)),f=.7+.3*Math.sin(an*3+i);p.setXY(j,p.getX(j)*f,p.getY(j)*f);}const m=put(g,pud,Math.cos(a)*d,.012,Math.sin(a)*d);m.rotation.x=-Math.PI/2;m.scale.set(.8+r()*1.6,.6+r(),1);m.castShadow=false;}
 // Parapet: low brick wall, stone coping, iron railing; a lamp at each of the eight corners.
 const lampPos=[];for(let f=0;f<8;f++){const a=f*Math.PI/4;const g=grp(Math.sin(a)*(AP+.25),0,Math.cos(a)*(AP+.25),a);const side=2*AP*Math.tan(Math.PI/8);bx(side+.3,.55,.5,0,.27,0,M.brick,g);bx(side+.5,.12,.7,0,.6,0,M.trim,g);bx(side+.3,.05,.05,0,1.15,0,M.iron,g);bx(side+.3,.04,.04,0,.85,0,M.iron,g);for(let x=-side/2;x<=side/2;x+=.18)bx(.025,.5,.025,x,.9,0,M.iron,g);for(let x=-side/2;x<=side/2;x+=.6){const sc=put(new THREE.TorusGeometry(.12,.012,4,10),M.iron,x+.3,.97,0,g);sc.castShadow=false;}
  const ca=a+Math.PI/8;const cx=Math.sin(ca)*(octR-.1),cz=Math.cos(ca)*(octR-.1);const h=gasLamp(T,M,cx,cz,{h:3.4});cyl(.05,.05,2.6,cx,4.9,cz,M.iron,6);lampPos.push(h);glows.add(...h,2.5,0xffb868,.95);glows.add(...h,9,0xff9a40,.22);streaks.add(cx*.94,cz*.94,1,8,0xffaa55,.5);circles.push([cx,cz,.35]);}
 // The deck overhang and the octagonal brick shaft dropping to the city, with lit windows.
 {const deck=new THREE.CylinderGeometry(octR+1.2,octR+.4,1.2,8);deck.rotateY(Math.PI/8);put(deck,M.trim,0,-.9,0);for(let f=0;f<16;f++){const a=f*Math.PI/8;bx(.5,1.6,1.4,Math.sin(a)*(AP-.2),-2,Math.cos(a)*(AP-.2),M.trim).rotation.y=a;}
  const shaft=new THREE.CylinderGeometry(octR-.6,octR+.4,-CITY,8,1,true);shaft.rotateY(Math.PI/8);const u2=shaft.attributes.uv;for(let i=0;i<u2.count;i++)u2.setXY(i,u2.getX(i)*AP*3.3/2,u2.getY(i)*-CITY/2);put(shaft,M.brick,0,CITY/2-1.2,0);
  for(let s=0;s<11;s++){const y=-3.5-s*4.4;const ring=new THREE.CylinderGeometry(octR+.1-s*.03,octR+.1-s*.03,.3,8);ring.rotateY(Math.PI/8);put(ring,M.trim,0,y,0);for(let f=0;f<8;f++){const a=f*Math.PI/4;for(const off of [-3,0,3]){const rad=(AP-.5+s*.04);const x=Math.sin(a)*rad+Math.cos(a)*off,z=Math.cos(a)*rad-Math.sin(a)*off;const on=r()<.45;const p=litPlane(1,1.9,x,y-2.2,z,on?new THREE.Color(0xffc070).multiplyScalar(.5+r()*.5):new THREE.Color(0x0e1218),k.batch);p.rotation.y=a;}}}}

 progress(.3,'Opening the lift cage');
 // North: lift house with an octagonal spire and red beacon (the exit). South: stair house (return).
 {const g=grp(0,0,-17.2);bx(6,4.2,3.6,0,2.1,0,M.brickLight,g);bx(6.4,.35,4,0,4.3,0,M.trim,g);const sp=new THREE.ConeGeometry(2.2,6,8);sp.rotateY(Math.PI/8);put(sp,M.tileDark,0,7.6,0,g);cyl(1.9,1.9,.9,0,4.9,0,M.cream,8,g);for(let f=0;f<8;f++){const a=f*Math.PI/4;const p=litPlane(.6,.55,Math.sin(a)*1.92,4.9,Math.cos(a)*1.92,new THREE.Color(0xffd090).multiplyScalar(.8),g);p.rotation.y=a;}cyl(.05,.05,3,0,12,0,M.brass,6,g);
  litPlane(2.6,3,0,1.6,1.82,new THREE.Color(0xffd8a0).multiplyScalar(.85),g);for(let x=-1.3;x<=1.31;x+=.16)bx(.03,3,.04,x,1.6,1.86,M.iron,g);for(let i=0;i<9;i++){const d=bx(.03,3.6,.03,-1.3+i*.33,1.6,1.9,M.brass,g);d.rotation.z=(i%2?.4:-.4);}bx(2.9,.2,.1,0,3.15,1.86,M.brass,g);
  const sg=put(new THREE.PlaneGeometry(2.2,.5),signMaterial('昇降機',{w:420,h:96,bg:'#14181c',fg:'#e9cf8f',border:'#9c7a45',emissive:true}),0,3.7,1.85,g);sg.castShadow=false;
  glows.add(0,15.6,-17.2,2.2,0xff3020,1);glows.add(0,15.6,-17.2,8,0xff2010,.3);glows.add(0,1.6,-15.2,4,0xffd8a0,.35);block(0,-17.2,6.2,3.8);const l=new THREE.PointLight(0xffd0a0,20,11,1.7);l.position.set(0,2.4,-14.4);root.add(l);}
 {const g=grp(0,0,17.2,Math.PI);bx(5,3.8,3.4,0,1.9,0,M.brickLight,g);bx(5.4,.35,3.8,0,3.9,0,M.trim,g);bx(5.6,.6,4,0,4.35,0,M.tileDark,g);const p=litPlane(1.6,2.4,0,1.2,1.72,new THREE.Color(0xffc27a).multiplyScalar(.6),g);
  const sg=put(new THREE.PlaneGeometry(1.6,.42),signMaterial('階段',{w:300,h:80,bg:'#14181c',fg:'#e9cf8f',border:'#9c7a45',emissive:true}),0,3.3,1.75,g);sg.castShadow=false;block(0,17.2,5.2,3.6);glows.add(0,1.4,15.3,3,0xffc27a,.3);}
 // East: an octagonal kiosk with the coin telescope pointed north. West: a water tank and the lamplighter's can.
 {const g=grp(14.2,0,-3.4);for(let f=0;f<8;f++){const a=f*Math.PI/4;cyl(.09,.09,2.8,Math.sin(a)*1.9,1.4,Math.cos(a)*1.9,M.iron,6,g);}const kr=hipRoof(4.6,4.6,1.4,{R:0,mat:roofMat,edgeMat:soffit,up:.4,thick:.12,seg:8});kr.position.y=2.9;g.add(kr);
  cyl(.25,.35,1.1,0,.55,0,M.iron,10,g);const tel=cyl(.13,.1,1.3,0,1.35,-.3,M.brass,12,g);tel.rotation.x=Math.PI/2-.25;cyl(.16,.16,.12,0,1.48,-.95,M.brass,12,g).rotation.x=Math.PI/2-.25;bx(.3,.4,.25,0,1.2,.15,M.brass,g);circles.push([14.2,-3.4,.5]);for(let f=0;f<8;f++){const a=f*Math.PI/4;if(f===4||f===5)continue;circles.push([14.2+Math.sin(a)*1.9,-3.4+Math.cos(a)*1.9,.2]);}glows.add(14.2,2.6,-3.4,1.6,0xffd090,.5);const l=new THREE.PointLight(0xffc080,12,9,1.8);l.position.set(14.2,2.5,-3.4);root.add(l);}
 {const g=grp(-14.6,0,-4);for(const sx of [-1,1])for(const sz of [-1,1])cyl(.08,.08,3.2,sx*1.1,1.6,sz*1.1,M.iron,6,g);const tank=cyl(1.5,1.5,2.2,0,4.3,0,M.timberDark,16,g);for(const y of [3.5,4.3,5.1])cyl(1.53,1.53,.08,0,y,0,M.iron,16,g);put(new THREE.ConeGeometry(1.6,.6,16),M.tileDark,0,5.7,0,g);const lad=grp(-12.9,0,-4);for(const z of [-.25,.25])bx(.05,5.5,.05,0,2.75,z,M.iron,lad);for(let y=.3;y<5.4;y+=.35)bx(.05,.04,.5,0,y,0,M.iron,lad);block(-14.6,-4,2.8,2.8);}
 {const g=grp(-14.4,0,5.4);cyl(.22,.25,.55,0,.28,0,M.brass,12,g);bx(.05,.4,.05,0,.75,0,M.brass,g);const sp=cyl(.02,.03,.55,.18,.6,0,M.brass,6,g);sp.rotation.z=-.9;const pole=bx(.05,2.8,.05,-.6,1.4,.3,M.timber,g);pole.rotation.z=.25;glows.add(-14.4,.6,5.4,.6,0xffa040,.6);}
 // Benches and potted palms along the parapet; a flagpole with lantern lines over the deck.
 for(const [x,z,ry] of [[-10,13,0],[10,13,0],[-15.5,-9,Math.PI/2],[15.6,7,-Math.PI/2],[9.5,-14.5,Math.PI],[-9.5,-14.5,Math.PI]]){const g=grp(x,0,z,ry);bx(2.2,.08,.5,0,.48,0,M.timber,g);bx(2.2,.5,.06,0,.78,-.24,M.timber,g);for(const sx of [-1,1])bx(.06,.48,.5,sx*1,.24,0,M.iron,g);boxes.push([x,z,1.3,1.3]);}
 for(const [x,z] of [[-5.5,15],[5.5,15],[-5.5,-15.4],[5.5,-15.4]]){cyl(.42,.32,.7,x,.35,z,M.granite,10);for(let i=0;i<7;i++){const a=i/7*6.28;const fr=put(new THREE.ConeGeometry(.12,1.6,4),new THREE.MeshStandardMaterial({color:0x2c4026,roughness:1,flatShading:true}),x+Math.cos(a)*.35,1.3,z+Math.sin(a)*.35);fr.rotation.set(Math.sin(a)*.8,0,-Math.cos(a)*.8);}circles.push([x,z,.55]);}
 const lanternLines=[];for(let f=0;f<8;f++){const a=f*Math.PI/4+Math.PI/8;lanternLines.push([Math.sin(a)*(octR-.2),6.2,Math.cos(a)*(octR-.2)]);}
 for(let i=0;i<8;i++){const A=lanternLines[i],B=lanternLines[(i+3)%8];wires.add(A,B,1.3,16);for(let j=1;j<8;j++){const t=j/8;const x=A[0]+(B[0]-A[0])*t,z=A[2]+(B[2]-A[2])*t,y=A[1]+(B[1]-A[1])*t-1.3*4*t*(1-t)-.3;if(j%2)continue;const ch=put(new THREE.SphereGeometry(.2,10,8),i%2?M.chochin:M.chochinWhite,x,y,z);ch.scale.y=1.3;ch.castShadow=false;glows.add(x,y,z,1,i%2?0xff5a30:0xffc070,.7);}}
 // Letter pinned by a knife to a post near the lift.
 {cyl(.1,.12,1.6,-4.6,.8,-14.6,M.timberDark,8);const lt=put(new THREE.PlaneGeometry(.3,.4),M.cream,-4.6,1.2,-14.48);lt.castShadow=false;bx(.03,.03,.25,-4.6,1.25,-14.4,M.iron);circles.push([-4.6,-14.6,.3]);}
 const ll=[[-12.6,12.6],[12.6,12.6],[-12.6,-12.6],[12.6,-12.6]];for(const [x,z] of ll){const l=new THREE.PointLight(0xffa860,20,16,1.7);l.position.set(x*1.1,3.6,z*1.1);root.add(l);}

 progress(.5,'Spreading the capital beneath you');
 // The capital below: a Taisho city of low timber houses under grey tile, packed along narrow lanes.
 // Brick blocks only line the main avenues; temple roofs and pagodas rise here and there. Density thins with
 // distance and dissolves into warm haze, then layered mountains close the horizon.
 const haze=new THREE.Color(0x2c2638);
 const ground=put(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:0x14121a,roughness:1}),0,CITY,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 const riverZ=x=>{const t=(x+900)/1800;return -120+Math.sin(t*5)*90+t*200;};
 const ART=156,artX=x=>Math.abs(((x%ART)+ART)%ART-ART/2)>ART/2-5,onArt=(x,z)=>artX(x)||artX(z);
 const temples=[[150,170],[-260,-180],[320,-260],[-420,260],[60,-420],[-120,520],[520,120]];
 const nearTemple=(x,z)=>temples.some(([a,b])=>Math.hypot(x-a,z-b)<34);
 const hipGeo=(()=>{const A=[-.5,0,-.5],B=[.5,0,-.5],C=[.5,0,.5],D=[-.5,0,.5],R1=[-.22,1,0],R2=[.22,1,0];const tri=[D,C,R2,D,R2,R1,B,A,R1,B,R1,R2,A,D,R1,C,B,R2];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(tri.flat(),3));g.computeVertexNormals();return g;})();
 const NH=12000;const houseBody=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),NH);const houseRoof=new THREE.InstancedMesh(hipGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.62,metalness:.25}),NH);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),col=new THREE.Color();let n=0;
 const bodyTones=[0x2a221c,0x332a22,0x5c564c,0x4a443c,0x241e1a],roofTones=[0x2a3038,0x323840,0x252a31,0x3a3f46];
 for(let x=-1150;x<1150&&n<NH;x+=9.5)for(let z=-1150;z<1150&&n<NH;z+=10.5){const jx=x+(r()-.5)*2,jz=z+(r()-.5)*2;const d=Math.hypot(jx,jz);if(d<44)continue;
  const keep=d<380?.97:d<1240?Math.max(0,.97-Math.pow((d-380)/860,.8)):0;if(r()>keep)continue;if(onArt(jx,jz)||Math.abs(jz-riverZ(jx))<30||nearTemple(jx,jz))continue;if(((Math.floor(z/52))%1===0)&&Math.abs(((z%52)+52)%52-26)<2.2)continue;
  const w=6+r()*3,dd=6.5+r()*3,h=d<500?(r()<.22?5.6:3)+r()*1.2:3.4;const ry=r()<.5?0:Math.PI/2;q.setFromAxisAngle(up,ry+(r()-.5)*.06);
  m4.compose(new THREE.Vector3(jx,CITY+h/2,jz),q,new THREE.Vector3(w,h,dd));houseBody.setMatrixAt(n,m4);houseBody.setColorAt(n,col.setHex(bodyTones[(r()*5)|0]));
  m4.compose(new THREE.Vector3(jx,CITY+h,jz),q,new THREE.Vector3(w+1.4,1.8+r()*.8,dd+1.4));houseRoof.setMatrixAt(n,m4);houseRoof.setColorAt(n,col.setHex(roofTones[(r()*4)|0]));n++;
  if(r()<(d<300?.32:d<700?.2:.12))glows.add(jx+(r()-.5)*w,CITY+1.3,jz+(r()<.5?-1:1)*(dd/2+.3),d<300?1.5:d<700?2.6:4,r()<.9?0xffb060:0xffd8a0,d<300?.5:.42);}
 houseBody.count=houseRoof.count=n;houseBody.receiveShadow=houseRoof.receiveShadow=true;root.add(houseBody,houseRoof);
 // Brick blocks of two to four storeys only along the main avenues, with sparse lit windows.
 const winTex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);const qq=rng(31);for(let y=0;y<4;y++)for(let x=0;x<6;x++){if(qq()<.38){c.fillStyle=`rgb(255,${160+qq()*60|0},${80+qq()*40|0})`;c.globalAlpha=.55+qq()*.45;c.fillRect(x*42+12,y*64+18,16,30);}}c.globalAlpha=1;});
 const NB=700;const brick=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x6a3a2c,roughness:.95,emissive:0xffffff,emissiveMap:winTex,emissiveIntensity:.9}),NB);let nb=0;
 for(let a=-7;a<=7&&nb<NB;a++){const line=a*ART+ART/2;for(let t=-1050;t<1050&&nb<NB;t+=14){for(const axis of [0,1])for(const s of [-1,1]){const x=axis?line+s*12:t,z=axis?t:line+s*12;const d=Math.hypot(x,z);if(d<50||d>900||r()>(d<400?.75:.4)||Math.abs(z-riverZ(x))<32||nearTemple(x,z))continue;const h=7+r()*9,w=11+r()*3;m4.compose(new THREE.Vector3(x,CITY+h/2,z),q.identity(),new THREE.Vector3(axis?9:w,h,axis?w:9));brick.setMatrixAt(nb++,m4);if(nb>=NB)break;}}}
 brick.count=nb;brick.receiveShadow=true;root.add(brick);
 // Arterial avenues and tram lines: continuous double rows of lamps that give the plain its structure.
 const artLamp=(x,z,d,a=.85)=>glows.add(x,CITY+4.5,z,d<300?3.2:d<700?5:7,0xffb868,a*Math.max(.35,1-d/1300));
 for(let a=-7;a<=7;a++){const line=a*ART+ART/2;for(let t=-1150;t<1150;t+=11){for(const s of [-1,1]){for(const [x,z] of [[t,line+s*5],[line+s*5,t]]){const d=Math.hypot(x,z);if(d<50||d>1150||Math.abs(z-riverZ(x))<26)continue;artLamp(x,z,d);}}}}
 for(const line of [-ART/2,ART*1.5]){for(let t=-1100;t<1100;t+=7){const x=line,z=t,d=Math.hypot(x,z);if(d<60||Math.abs(z-riverZ(x))<26)continue;glows.add(x,CITY+6.5,z,d<300?1.6:3,0xcfe2ff,.5*Math.max(.3,1-d/1200));}}
 // The avenue you walked: a straight tram street of paired lamps south-west, ending at its crossing.
 for(let t=0;t<40;t++){const x=-70-t*4.2,z=40+t*5.4;for(const s of [-1,1])glows.add(x+s*4.5,CITY+4.5,z+s*3.5,5,0xffc878,1);}glows.add(-150,CITY+7,145,12,0xffe0b0,.6);
 // Temples among the houses: big grey roofs, two lit pagodas and the vermilion precinct gate.
 temples.forEach(([tx,tz],i)=>{const g=grp(tx,CITY,tz,i*.4);if(i===0){const ver=M.vermilion;for(let j=0;j<5;j++){const b=6-j*.55;bx(b,2.8,b,0,4+j*4.4,0,ver,g);const rf=hipRoof(b+4,b+4,1.6,{R:0,mat:roofMat,edgeMat:soffit,up:.7,seg:6});rf.position.y=5.5+j*4.4;g.add(rf);glows.add(tx+b/2+1.8,CITY+5.8+j*4.4,tz,1.6,0xffd27a,.8);}cyl(.15,.15,8,0,30,0,M.brass,6,g);glows.add(tx,CITY+34,tz,2,0xffc070,.7);const gate=grp(130,CITY,205);bx(12,6,5,0,3,0,ver,gate);const gr=hipRoof(16,8,2.6,{R:9,mat:roofMat,edgeMat:soffit,seg:6});gr.position.y=6.4;gate.add(gr);glows.add(130,CITY+3,208,9,0xff3a20,.9);glows.add(130,CITY+3,208,22,0xff4020,.25);return;}
  bx(20,6,14,0,3,0,M.vermilionDark,g);const hr=hipRoof(28,20,6,{R:12,mat:roofMat,edgeMat:soffit,up:1.2,seg:8});hr.position.y=6.4;g.add(hr);glows.add(tx,CITY+3,tz+8,6,0xffb060,.5);
  if(i===3||i===5){const p=grp(tx+26,CITY,tz);for(let j=0;j<5;j++){const b=5.4-j*.5;bx(b,2.6,b,0,3.6+j*4,0,M.vermilionDark,p);const rf=hipRoof(b+3.6,b+3.6,1.4,{R:0,mat:roofMat,edgeMat:soffit,up:.6,seg:6});rf.position.y=5+j*4;p.add(rf);}glows.add(tx+26,CITY+12,tz,10,0xffc070,.25);}});
 // The river, with lamp-lit embankments, bridges, and long reflections on the water.
 {const pts=[];for(let i=0;i<=60;i++){const t=i/60;const x=-1500+t*3000;pts.push(new THREE.Vector3(x,0,riverZ(x)));}const geo=new THREE.BufferGeometry();const pos=[],idx=[];for(let i=0;i<pts.length;i++){const p=pts[i],nx=pts[Math.min(i+1,pts.length-1)].clone().sub(pts[Math.max(i-1,0)]).normalize();const side=new THREE.Vector3(-nx.z,0,nx.x).multiplyScalar(22);pos.push(p.x+side.x,CITY+.3,p.z+side.z,p.x-side.x,CITY+.3,p.z-side.z);if(i)idx.push((i-1)*2,(i-1)*2+1,i*2,(i-1)*2+1,i*2+1,i*2);}geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const river=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x080c16,roughness:.08,metalness:.8}));root.add(river);
  const rs=streakField(root,{y:CITY+.4,fade:.0016});for(let x=-1100;x<1100;x+=16){const z=riverZ(x),d=Math.hypot(x,z);if(d>1150)continue;for(const s of [-1,1]){glows.add(x,CITY+3,z+s*24,d<400?2.6:4.5,0xffc070,.75);rs.add(x,z+s*19,d<400?2.2:4,40,0xffa850,.7);}}
  for(const bxp of [-ART/2,ART*1.5,-ART*2.5,ART*3.5]){const z=riverZ(bxp);const b=new THREE.Mesh(new THREE.BoxGeometry(10,1.2,52),new THREE.MeshStandardMaterial({color:0x1a1614,roughness:1}));b.position.set(bxp,CITY+1.4,z);root.add(b);for(let j=-2;j<=2;j++)for(const s of [-1,1])glows.add(bxp+s*5,CITY+3.5,z+j*10,2.4,0xffd090,.8);}
  rs.build();root.userData.riverStreaks=rs;}
 // Mountains to the north, and the glowing threads of Mistweave Ridge strung across them.
 {const geo=new THREE.BufferGeometry(),pos=[],idx=[];const W=120;for(let i=0;i<=W;i++){const t=i/W,x=-3000+t*6000;const h=180+Math.sin(t*9)*70+Math.sin(t*23+1)*35+Math.sin(t*51)*12+(Math.abs(t-.42)<.12?120*(1-Math.abs(t-.42)/.12):0);pos.push(x,CITY,-1300,x,CITY+h,-1300-Math.sin(t*7)*80);if(i)idx.push((i-1)*2,i*2,(i-1)*2+1,(i-1)*2+1,i*2,i*2+1);}geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);
  {const col=[];const pa=geo.attributes.position;for(let i=0;i<pa.count;i++){const top=i%2===1;col.push(...(top?[.035,.045,.085]:[.012,.014,.024]));}geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));}
  const mtn=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));mtn.renderOrder=-5;
  const geo2=geo.clone();const p2=geo2.attributes.position;for(let i=0;i<p2.count;i++){p2.setX(i,p2.getX(i)*1.1+300);p2.setZ(i,-1100);if(i%2)p2.setY(i,CITY+(p2.getY(i)-CITY)*.6);}{const c2=geo2.attributes.color;for(let i=0;i<c2.count;i++)c2.setXYZ(i,...(i%2?[.02,.026,.05]:[.006,.008,.014]));}const near=new THREE.Mesh(geo2,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));near.renderOrder=-4;
  const th=[];const ridgeX=-3000+.42*6000;for(let i=0;i<20;i++){const x0=ridgeX-380+i*30+r()*40,x1=x0+160+r()*220,y0=CITY+190+r()*90,y1=CITY+170+r()*100;const sag=30+r()*40;for(let j=0;j<16;j++){const t0=j/16,t1=(j+1)/16;th.push(x0+(x1-x0)*t0,y0+(y1-y0)*t0-sag*4*t0*(1-t0),-1290,x0+(x1-x0)*t1,y0+(y1-y0)*t1-sag*4*t1*(1-t1),-1290);}}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(th,3));const threads=new THREE.LineSegments(tg,new THREE.LineBasicMaterial({color:0x9ec8ff,transparent:true,opacity:.4,fog:false,blending:THREE.AdditiveBlending,depthWrite:false}));threads.renderOrder=-3;root.add(threads);for(let i=0;i<60;i++)glows.add(ridgeX-300+r()*560,CITY+130+r()*170,-1285,14+r()*26,0x9ec8ff,.22);
  const mist=new THREE.Mesh(new THREE.PlaneGeometry(2600,140),new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;void main(){float a=sin(v.y*3.14159)*(.6+.4*sin(v.x*17.))*.16;gl_FragColor=vec4(vec3(.45,.55,.75)*a,1.);}'}));
  root.userData.threads=threads;}

 // Layered mountain rings around the whole horizon: nearer layers darker, all bases dissolving into the haze.
 for(let L=0;L<3;L++){const R=1350+L*450,S=200,pos=[],cols=[],idx=[];const topC=new THREE.Color([0x0d1020,0x161a2e,0x231f36][L]),baseC=haze.clone().lerp(new THREE.Color(0x3a2e40),.3);
  for(let i=0;i<=S;i++){const a=i/S*Math.PI*2;const north=Math.max(0,Math.cos(a-Math.PI))*1;let h=(L===0?120:L===1?200:300)+Math.sin(a*7+L)*50+Math.sin(a*17+L*2)*28+Math.sin(a*41)*9;if(L===1)h+=Math.pow(Math.max(0,Math.cos(a-Math.PI-.38)),18)*190;const x=Math.sin(a)*R,z=Math.cos(a)*R;pos.push(x,CITY-10,z,x,CITY+h,z);cols.push(...baseC.toArray(),...topC.toArray());if(i)idx.push((i-1)*2,i*2,(i-1)*2+1,(i-1)*2+1,i*2,i*2+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setIndex(idx);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));m.renderOrder=-6+L*-1;m.frustumCulled=false;root.add(m);}
 // A warm haze band over the city edge hides where the houses thin out.
 {const hz=new THREE.Mesh(new THREE.CylinderGeometry(1050,1050,140,64,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.BackSide,uniforms:{c:{value:haze.clone().lerp(new THREE.Color(0x6a4a50),.25)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c;varying vec2 v;void main(){float a=pow(1.-v.y,2.2)*.7;gl_FragColor=vec4(c,a);}'}));hz.position.y=CITY+66;hz.renderOrder=-1;root.add(hz);}
 glows.build();streaks.build();wires.build();k.finish();

 const inOct=(x,z,a=AP-.85)=>Math.abs(x)<a&&Math.abs(z)<a&&(Math.abs(x)+Math.abs(z))<a*Math.SQRT2*1.0;
 const canWalk=(x,z)=>inOct(x,z)&&!boxes.some(b=>Math.abs(x-b[0])<b[2]+.3&&Math.abs(z-b[1])<b[3]+.3);
 progress(.96,'The wind at the top');
 return {texturesLoaded:14,grassBlades:0,trunks:circles,discoveries:clues['city-tower'],
  views:{terrace:{pos:[0,2,11],look:[0,5,-30],name:'The roof terrace',sub:'Twelve storeys up, the lantern lines sway over an open deck.'},north:{pos:[-8,1.9,-14.2],look:[-480,-20,-1300],name:'The northern parapet',sub:'Far beyond the city, threads of light shimmer on a dark ridge.'},city:{pos:[-12,1.9,11.5],look:[-200,-40,120],name:'A thousand lamps',sub:'The avenue and the precinct, tiny beneath you.'},moon:{pos:[-14,1.9,-6],look:[-700,-30,-900],name:'Moon over the ridge',sub:'A city of tiled roofs runs out to the mountains.'},precinct:{pos:[12,1.9,11.5],look:[150,-40,170],name:'The precinct below',sub:'The Thunderbell is ringing again.'}},
  canWalk,walkHeight:()=>0,
  locationAt(x,z){if(z<-12)return 'The lift cage';if(x>11)return 'The telescope kiosk';if(x<-11)return 'The water tower';if(z>12)return 'The stair head';return 'The roof terrace';},
  update(t,dt,cam){sky.update(t,cam);glows.update(t);streaks.update(t);root.userData.riverStreaks?.update(t);const th=root.userData.threads;if(th)th.material.opacity=.3+.15*Math.sin(t*1.3);},setEvening(){}};
}
