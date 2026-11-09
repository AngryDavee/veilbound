import * as THREE from 'three';
import { kit } from '../kit.js';
import { nightSky, precipitation } from '../atmosphere.js';
import { clues } from './story.js';
import { cityMaterials, makeTools, brickBlock, machiya, gasLamp, rickshaw, tramCar, cloudpiercer, glowField, streakField, wireField, signMaterial, rng, uvBox } from './citykit.js';

// Lamplight Avenue: a rain-washed Taisho shopping street. Main street runs along Z
// (spawn z=40 → exit z=-46); a cross street at z=-8 holds the tram crossing (future arena).
export async function create(root,renderer,progress,{camera}={}){
 progress(.1,'Walking under the gas lamps');const k=await kit(root,2203);const M=cityMaterials(k);const T=makeTools(k,M);const {bx,put,cyl,litPlane}=T;const r=rng(4407);
 const glows=glowField(root,renderer,{fogK:.0025}),streaks=streakField(root),wires=wireField(root,M.wire);
 const sky=nightSky(root,{top:0x050914,horizon:0x26304a,glow:0x5a6488,moonDir:[-.35,.42,-.84],moonSize:30,clouds:.6,cloudColor:0x161c2c,seed:22});
 const drizzle=precipitation(root,{count:1400,color:0x8ea0bc,size:.035,area:[50,26,50],speed:11,drift:.2,opacity:.35});
 const circles=[],boxes=[];const block=(x,z,w,d)=>boxes.push([x,z,w/2,d/2]);
 const place=(g,x,z,ry)=>{g.position.set(x,0,z);g.rotation.y=ry;k.batch.add(g);return g;};

 // Ground: granite setts in the carriageway, flagstone pavements, granite curbs and gutters.
 const roadZ=[-62,62];put(uvBox(14,.1,124,2),M.road,0,-.05,0);put(uvBox(110,.1,13,2),M.road,0,-.04,-8);
 for(const s of [-1,1]){put(uvBox(4,.25,124,1.6),M.sidewalk,s*9,.075,0);bx(.3,.28,124,s*7.15,.09,0,M.curb);bx(.25,.02,124,s*6.8,.005,0,M.iron);}
 for(const s of [-1,1]){put(uvBox(110,.25,3.5,1.6),M.sidewalk,0,.08,s>0?.25:-16.25);bx(110,.28,.3,0,.09,s>0?-1.45:-14.55,M.curb);}
 put(uvBox(600,.1,600,4),M.road,0,-.12,0).receiveShadow=true;
 // Drain grates along the gutters.
 for(let z=-56;z<56;z+=7)for(const s of [-1,1]){if(z>-19&&z<3)continue;for(let i=0;i<5;i++)bx(.06,.03,.5,s*6.75+(i-2)*.09,.02,z,M.iron);}
 // Double tram track inset in the setts, plus a branch along the cross street to the stalled car.
 for(const tx of [-2,2])for(const s of [-1,1])bx(.09,.04,124,tx+s*.53,.01,0,M.rail);
 for(const s of [-1,1])bx(52,.04,.09,30,.01,-8+s*.53,M.rail);
 // Puddles: glossy irregular pools that pick up lamp streaks.
 for(let i=0;i<46;i++){const x=(r()-.5)*13,z=(r()-.5)*110;if(r()<.3)continue;const geo=new THREE.CircleGeometry(1,18);const p=geo.attributes.position;for(let j=1;j<p.count;j++){const a=Math.atan2(p.getY(j),p.getX(j)),f=.7+.3*Math.sin(a*3+i)+.15*Math.sin(a*7+i*2);p.setXY(j,p.getX(j)*f,p.getY(j)*f);}const m=put(geo,M.puddle,x,.012,z);m.rotation.x=-Math.PI/2;m.scale.set(.6+r()*1.8,.5+r()*1.2,1);m.castShadow=false;}

 progress(.3,'Raising the brick arcades');
 // Street frontage. Each side alternates brick arcades and timber machiya with invented trade names.
 const brickShops=['白鷺珈琲店','綾瀬洋品店','雪輪寫眞館','東雲銀行','電氣館','月見堂書林','鶴亀時計舗','春陽堂藥局'];
 const noren=[['灯','#1d2a48'],['松','#3a2418'],['鶴','#20352c'],['菓','#4a1c1c'],['酒','#1d2a48'],['茶','#2c3a20']];const kanban=['御菓子司','呉服太物','生藥','牛鍋','御茶','金物'];
 const lampsOf=g=>{if(!g.userData.lamps)return;g.updateMatrixWorld(true);for(const p of g.userData.lamps){const v=g.localToWorld(new THREE.Vector3(...p));glows.add(v.x,v.y,v.z,1.3,0xff5a30,.8);glows.add(v.x,v.y,v.z,4.5,0xff4a20,.18);}};M.shrub=new THREE.MeshStandardMaterial({color:0x2c3a26,roughness:1,flatShading:true});
 let bi=0,mi=0;const mats=[M.brick,M.brickDark,M.brickLight];
 function frontage(side,z0,z1,seed){const rr=rng(seed);let z=z0;let n=0;while(z-6>z1){const brick=(n+seed)%3!==1;const w=brick?9+Math.round(rr()*4):6+Math.round(rr()*3);if(z-w<z1-1)break;const zc=z-w/2,d=brick?11:9;let g;
  if(brick){g=brickBlock(T,M,{w,d,floors:rr()<.3?3:2,seed:seed+n*7,mat:mats[(n+seed)%3],shop:brickShops[bi++%brickShops.length],awning:rr()<.35?M.canvasCloth:null,clock:false});}
  else{const nn=noren[mi%noren.length];g=machiya(T,M,k,{w,d,seed:seed+n*5,shop:nn[0],norenColor:nn[1],sign:kanban[mi%kanban.length],tall:rr()<.4,upperMat:rr()<.4?M.plasterOchre:M.plaster});mi++;}
  place(g,side*(11+d/2),zc,side<0?Math.PI/2:-Math.PI/2);block(side*(11+d/2),zc,d,w);lampsOf(g);
  if(!brick&&rr()<.8){const bz=zc+w/2-.7;cyl(.03,.03,2.6,side*10.4,1.3,bz,M.timber,6);const ban=put(new THREE.PlaneGeometry(.5,1.9),signMaterial(['大賣出','新茶','御休處','甘酒','名物'][n%5],{w:128,h:480,vertical:true,bg:['#b02a1c','#1f3a6a','#d8c48a','#2a5a3a','#7a1f4a'][n%5],fg:'#f4ead2',border:'#00000000'}),side*10.4,1.55,bz-.27);ban.rotation.y=side<0?Math.PI/2:-Math.PI/2;ban.castShadow=false;circles.push([side*10.4,bz,.25]);}
  if(rr()<.5){const px=side*10.55,pz=zc-w/2+.8;cyl(.28,.22,.5,px,.4,pz,M.granite,10);const bush=put(new THREE.IcosahedronGeometry(.45,1),M.shrub,px,1.0,pz);bush.scale.y=.85;circles.push([px,pz,.45]);}
  z-=w;n++;}}
 frontage(-1,62,3,11);frontage(1,62,3,23);frontage(-1,-32.2,-64,37);frontage(1,-19,-64,51);
 // Corner landmark: a three-storey bank with a clock over the crossing.
 const corner=brickBlock(T,M,{w:13,d:12,floors:3,seed:99,mat:M.brickLight,shop:'東雲銀行',clock:true});place(corner,-17,-25.5,Math.PI/2);block(-17,-25.5,12,13);
 // Cross-street frontages face the crossing.
 function crossFront(zFace,ry,x0,x1,seed){const rr=rng(seed);let x=x0;let n=0;while(x<x1-4.5){let w=8+Math.round(rr()*4);const d=10;if(x+w>x1)w=x1-x;const g=n%2?machiya(T,M,k,{w,d,seed:seed+n,shop:noren[n%6][0],norenColor:noren[n%6][1],sign:kanban[(n+2)%6]}):brickBlock(T,M,{w,d,floors:2+(rr()<.3?1:0),seed:seed+n*3,mat:mats[n%3],shop:brickShops[(n+seed)%8]});const zc=zFace+(ry===0?-d/2:d/2);place(g,x+w/2,zc,ry);block(x+w/2,zc,w,d);lampsOf(g);x+=w;n++;}}
 for(const sx of [-1,1]){const g=brickBlock(T,M,{w:18,d:12,floors:3,seed:300+sx,mat:sx>0?M.brickDark:M.brickLight,shop:sx>0?'帝都勸工場':'千燈館',clock:sx<0});place(g,sx*59,-8,sx>0?-Math.PI/2:Math.PI/2);block(sx*59,-8,12,18);lampsOf(g);}
 crossFront(-18,0,11,52,71);crossFront(-18,0,-52,-11,73);crossFront(2,Math.PI,11,52,75);crossFront(2,Math.PI,-52,-11,77);

 progress(.5,'Stringing the wires');
 // Gas lamps on both kerbs, staggered; the nearest few carry real point lights.
 const lampHeads=[];for(let z=50;z>-58;z-=9.5)for(const s of [-1,1]){const zz=z+(s>0?4.7:0);if(zz>-19.5&&zz<3.5)continue;const h=gasLamp(T,M,s*7.7,zz);lampHeads.push(h);circles.push([s*7.7,zz,.3]);glows.add(...h,2.6,0xffb868,.9);glows.add(h[0],h[1],h[2],9,0xff9a40,.22);streaks.add(h[0]-s*.3,h[2],.9,9,0xffaa55,.55);}
 for(const [x,z] of [[-7.7,4.4],[7.7,-20.2]]){const h=gasLamp(T,M,x,z,{h:4.2});glows.add(...h,2.8,0xffb868,.9);glows.add(...h,10,0xff9a40,.25);streaks.add(x*.9,z,1,10,0xffaa55,.5);circles.push([x,z,.3]);}
 // An arc lamp hangs over the crossing from four span wires.
 for(const [x,z] of [[-10.6,1.4],[10.6,1.4],[-10.6,-17.4],[10.6,-17.4]]){cyl(.1,.14,7.4,x,3.7,z,M.iron,8);circles.push([x,z,.25]);wires.add([x,7.2,z],[0,6.4,-8],.2,6);}cyl(.25,.12,.5,0,6.1,-8,M.iron,10);put(new THREE.SphereGeometry(.24,12,8),M.lampGlass,0,5.75,-8).castShadow=false;glows.add(0,5.75,-8,3.4,0xfff0d8,1);glows.add(0,5.75,-8,16,0xffe0b0,.2);const arc=new THREE.PointLight(0xffe2c0,40,26,1.6);arc.position.set(0,5.4,-8);root.add(arc);for(const [x,z] of [[0,-8]])streaks.add(x,z,1.2,10,0xffe8c8,.5);
 const lightAt=[[-7.7,40.5],[7.7,35.2],[-7.7,21.5],[7.7,16.2],[-7.7,-26],[7.7,-40.3]];for(const [x,z] of lightAt){const l=new THREE.PointLight(0xffa860,26,20,1.7);l.position.set(x,4.2,z);root.add(l);}
 // Tram-wire poles with span wires, and wooden telegraph poles with sagging bundles.
 for(let z=56;z>-62;z-=14){if(z>-19&&z<3)continue;for(const s of [-1,1]){cyl(.1,.14,7,s*7.35,3.5,z,M.iron,8);cyl(.16,.16,.3,s*7.35,7,z,M.iron,8);circles.push([s*7.35,z,.25]);}wires.add([-7.35,6.6,z],[7.35,6.6,z],.35,10);}
 for(const tx of [-2,2])wires.add([tx,6.2,62],[tx,6.2,-62],.0,2);for(const tx of [-2,2])for(let z=56;z>-62;z-=14)wires.add([tx,6.2,z],[tx,6.45,z],0,1);
 wires.add([11,6.2,-8],[52,6.2,-8],0,2);
 const tele=[];
 for(const s of [-1,1])for(let z=59;z>-64;z-=23.5){if(z>-21&&z<5)continue;const x=s*10.6;cyl(.13,.17,10,x,5,z,M.timberDark,7);circles.push([x,z,.3]);for(const yy of [8.6,9.4]){bx(.12,.12,2.4,x,yy,z,M.timber).rotation.y=Math.PI/2;for(let i=-2;i<=2;i++)cyl(.05,.06,.18,x+i*.5,yy+.15,z,M.cream,6);}tele.push([x,z]);}
 for(const s of [-1,1]){const pts=tele.filter(p=>Math.sign(p[0])===s);for(let i=0;i+1<pts.length;i++)for(const yy of [8.75,9.55])for(let j=-2;j<=2;j++)wires.add([pts[i][0]+j*.5,yy,pts[i][1]],[pts[i+1][0]+j*.5,yy,pts[i+1][1]],.9+.1*j,14);}
 // House service drops from the poles to the shopfront eaves.
 for(const [x,z] of tele)for(let i=0;i<3;i++){const dz=(i-1)*5;wires.add([x,8.7,z],[x+Math.sign(x)*1.5,6.2,z+dz],.4,8);}

 progress(.65,'Parking the last tram');
 // The stalled tram sits on the cross-street branch, east of the crossing (outside the arena).
 const tram=tramCar(T,M,'雷鐘前');place(tram,24,-8,Math.PI/2);block(24,-8,10.6,2.8);const tl=new THREE.PointLight(0xffb070,14,9,2);tl.position.set(24,2.6,-8);root.add(tl);glows.add(19,1.2,-8,1.2,0xfff0c0,1);glows.add(19,1.2,-8,6,0xffd090,.18);streaks.add(17,-8,1.1,14,0xffe0b0,.6);
 // Rickshaws, crates, a red pillar post box, fire buckets, a newspaper kiosk, benches.
 for(const [x,z,ry] of [[-9.6,30,.2],[9.4,-38,Math.PI-.2],[-30,-12.8,Math.PI/2+.1]]){place(rickshaw(T,M,0,0),x,z,ry);circles.push([x,z+.6,1.2]);}
 function crates(x,z){for(let i=0;i<4;i++){const s=.55+r()*.25;bx(s,s,s,x+(r()-.5)*1.2,s/2+(i===3?.55:0),z+(r()-.5)*1.2,M.timber,k.batch,.8).rotation.y=r();}circles.push([x,z,1.1]);}
 crates(9.8,26);crates(-9.9,-41);crates(-10,9);crates(32,-15.8);
 for(const [x,z] of [[9.6,44],[-9.7,-30]]){cyl(.3,.3,1.3,x,.8,z,M.red,16);cyl(.36,.3,.18,x,1.5,z,M.red,16);bx(.32,.05,.05,x+.28,1.15,z,M.black);circles.push([x,z,.45]);}
 for(const [x,z] of [[-9.8,46],[9.8,-50]]){for(let i=0;i<6;i++){const row=i<3?0:i<5?1:2,col=i<3?i:i<5?i-3:0;cyl(.2,.16,.35,x,.33+row*.34,z-(.42*col)+row*.21,M.red,10);}circles.push([x,z-.4,.8]);}
 // Kiosk with paste-up bills.
 bx(2.2,2.6,1.6,9.6,1.3,47,M.timberDark);const k1=put(new THREE.PlaneGeometry(1.8,1.2),signMaterial('號外',{w:256,h:170,bg:'#e8dcc0',fg:'#3a1010',border:'#4a3a28'}),8.48,1.6,47);k1.rotation.y=-Math.PI/2;circles.push([9.6,47,1.4]);
 // Clue props: a dropped lamp pass by the gutter, the portrait easel, a ticket on the tram island.
 bx(.14,.02,.09,-7.6,.17,18,M.brass);const easel=new THREE.Group();for(const s of [-1,1]){const leg=bx(.05,1.7,.05,s*.35,.85,0,M.timber,easel);leg.rotation.z=s*.12;}bx(.05,1.8,.05,0,.9,-.45,M.timber,easel).rotation.x=-.25;bx(.75,.95,.03,0,1.35,.08,M.cream,easel);bx(.8,.04,.1,0,.88,.1,M.timber,easel);place(easel,9.4,8,-Math.PI/2+.3);circles.push([9.4,8,.6]);
 const sketch=put(new THREE.PlaneGeometry(.6,.8),signMaterial('◉ ◉',{w:200,h:260,bg:'#ece2cc',fg:'#2a2a2a',border:'#c8baa0'}),9.36,1.36,8.06);sketch.rotation.y=-Math.PI/2+.3;
 bx(3,.3,1.4,-2,.15,-34,M.granite);bx(.08,2.6,.08,-3.2,1.3,-34,M.iron);const stop=put(new THREE.PlaneGeometry(.9,.45),signMaterial('雷鐘前 行',{w:256,h:128,bg:'#f3e8cc',fg:'#1c2a50',border:'#1c2a50',emissive:true}),-3.2,2.4,-33.96);stop.castShadow=false;bx(.12,.02,.07,-5.4,.03,-34,M.cream);
 // Exit marker: a tram-stop board pointing to the Thunderbell Precinct.
 k.sign(0,2.7,-49.5,'TO THE THUNDERBELL PRECINCT');
 progress(.78,'Lighting the far city');
 // The Cloudpiercer on the skyline, and a far city of roofs and lit windows.
 const tower=cloudpiercer(T,M,{glows,x:-34,z:-190});k.batch.add(tower);
 const far=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x14161c,roughness:1}),520);let fi=0;const mtx=new THREE.Matrix4();
 for(let i=0;i<520;i++){const a=r()*Math.PI*2,d=75+Math.pow(r(),.7)*260;const x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)<26&&Math.abs(z)<70)continue;if(Math.abs(z+8)<14&&Math.abs(x)<60)continue;const w=6+r()*14,h=5+r()*(d>200?24:12),dd=6+r()*12;mtx.compose(new THREE.Vector3(x,h/2,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),r()*.3),new THREE.Vector3(w,h,dd));far.setMatrixAt(fi++,mtx);const nw=1+((r()*5)|0);for(let j=0;j<nw;j++)glows.add(x+(r()-.5)*w,1.5+r()*(h-2),z+(r()-.5)*dd,.7+r()*.6,r()<.8?0xffb868:0xd8e0ff,.5);}
 far.count=fi;far.castShadow=false;far.receiveShadow=true;root.add(far);
 progress(.88,'Polishing the wet stones');
 glows.build();streaks.build();wires.build();k.finish();
 const inRect=(x,z,b)=>Math.abs(x-b[0])<b[2]+.35&&Math.abs(z-b[1])<b[3]+.35;
 const canWalk=(x,z)=>{const main=Math.abs(x)<10.65&&z>-51&&z<51;const cross=Math.abs(x)<46&&z>-17.7&&z<1.7;if(!main&&!cross)return false;if(boxes.some(b=>inRect(x,z,b)))return false;return true;};
 progress(.96,'The lamps flare');
 return {texturesLoaded:14,grassBlades:0,trunks:circles,discoveries:clues['city-avenue'],
  views:{arrival:{pos:[2.5,2,44],look:[-2,4,-20],name:'Lamplight Avenue',sub:'Gas lamps, tram rails and the Cloudpiercer on the skyline.'},crossing:{pos:[-8,2.4,4],look:[20,2.2,-9],name:'The tram crossing',sub:'A stalled streetcar and an open crossing — a future battle ground.'},bank:{pos:[6,2,-12],look:[-14,5,-26],name:'The bank corner',sub:'The clock over the crossing has stopped at the hour of the ox.'},kerb:{pos:[8.8,1.5,30],look:[0,1,0],name:'Wet kerbstones',sub:'Every lamp burns twice: once above, once in the rain.'}},
  canWalk,walkHeight:()=>0,
  locationAt(x,z){if(z<1.7&&z>-17.7)return Math.abs(x)>11?'The cross street':'The tram crossing';if(z<-36)return 'The tram island';return Math.abs(x)>7?'The arcade pavement':'Lamplight Avenue';},
  update(t,dt,cam){sky.update(t,cam);drizzle.update(t,cam);glows.update(t);streaks.update(t);},setEvening(){}};
}
