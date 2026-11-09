// World V · Region 1 — The Willow Gate.
// An embankment road between moonlit paddies, a weeping willow hung with fortunes, a stone-walled
// moat, an arched lacquer bridge and a great timber gate in the quarter's plaster wall.
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { kit } from '../kit.js';
import { nightSky } from '../atmosphere.js';
import { clues } from './story.js';
import { streetProps, collector, quarterMaterials, signAtlas, teahouse, gableRoof, chochin, andonPost, wallRun, glowPoints, willow, fireTower, motes, rng, slope } from './qkit.js';

export const VERTICAL=['花月楼','夜桜屋','柳屋','鈴音','月見楼','扇屋','玉菊','浮舟','千鳥','朧屋','松葉','紅梅','雪洞','春霞','白藤','宵待'];
export const HORIZONTAL=['浮世門','桜通','花月','鈴音楼','扇屋','月見','千鳥','宵待'];
const bridgeH=z=>z<9.5||z>21.5?0:1.1*Math.sin(Math.PI*(z-9.5)/12);

export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Crossing the embankment toward the lanterns');
 const k=await kit(root,5101),M=quarterMaterials(k),S=signAtlas(VERTICAL,HORIZONTAL),C=collector(),glows=[],r=rng(5101),trunks=[];
 const sky=nightSky(root,{top:0x0a0616,horizon:0x3c2444,glow:0x7a5a88,moonDir:[.28,.4,-.87],moonColor:0xf7e8d4,moonSize:55,clouds:.45,cloudColor:0x2a1e34,stars:1800});

 // ---------- ground: embankment, paddies, quarter paving ----------
 const outside=new THREE.PlaneGeometry(260,120,130,60);outside.rotateX(-Math.PI/2);outside.translate(0,0,81);const op=outside.attributes.position;
 for(let i=0;i<op.count;i++){const x=op.getX(i),z=op.getZ(i),ax=Math.abs(x);const drop=-2.3*THREE.MathUtils.smoothstep(ax,12.5,19)*THREE.MathUtils.smoothstep(z,22,27);op.setY(i,drop+(ax>19?Math.sin(x*.21)*Math.cos(z*.17)*.12:0));}outside.computeVertexNormals();
 const embank=new THREE.Mesh(outside,k.surface('earth',0x4a4038,30,.95));embank.receiveShadow=true;root.add(embank);
 C.geo(M.earth,new THREE.PlaneGeometry(14,28),0,.015,36,-Math.PI/2);
 for(let i=0;i<46;i++)C.box(M.stone,.55+r()*.4,.06,.35+r()*.3,(r()<.5?-1:1)*(6.6+r()*.5),.03,23+r()*27,0,r()*3);// curbs
 const tuft=new THREE.MeshStandardMaterial({color:0x4a5a34,roughness:1,side:THREE.DoubleSide});for(let q=0;q<520;q++){const s=r()<.5?-1:1,x=s*(7+r()*5.2),zz=22.5+r()*28;if(Math.abs(zz-40)<1.5&&Math.abs(x)>8.5)continue;for(let b=0;b<3;b++)C.geo(tuft,new THREE.PlaneGeometry(.05,.25+r()*.35),x+(r()-.5)*.25,.15,zz+(r()-.5)*.25,(r()-.5)*.6,r()*3,(r()-.5)*.5);}
 for(let q=0;q<180;q++)C.box(M.stone,.08+r()*.14,.05,.08+r()*.12,(r()-.5)*13,.02,22.5+r()*28,0,r()*3);
 for(const s of [-1,1])C.geo(M.rut,new THREE.PlaneGeometry(.45,27),s*1.1,.02,36,-Math.PI/2);
 // moonlit paddies with raised earth paths
 for(const s of [-1,1])for(let i=0;i<5;i++)for(let j=0;j<4;j++){const cx=s*(26+i*17),cz=30+j*15;C.geo(M.puddle,new THREE.PlaneGeometry(15.4,13.4),cx,-2.15,cz,-Math.PI/2);C.box(M.earth,16,.4,.9,cx,-2.1,cz+7);C.box(M.earth,.9,.4,14,cx+8,-2.1,cz);
  for(let q=0;q<26;q++)C.box(M.moss,.05,.35,.05,cx+(r()-.5)*14,-1.95,cz+(r()-.5)*12);}
 // inner paving and gutters
 C.geo(M.paving,new THREE.PlaneGeometry(26,60),0,.01,-22,-Math.PI/2);C.geo(M.paving,new THREE.PlaneGeometry(8,3.4),0,.012,8,-Math.PI/2);
 for(const s of [-1,1]){C.box(M.stone,.22,.16,58,s*11.55,.08,-22);C.box(M.stone,.22,.16,58,s*12.05,.08,-22);C.geo(M.water,new THREE.PlaneGeometry(.3,58),s*11.8,.04,-22,-Math.PI/2);}
 for(let i=0;i<70;i++){const x=(r()-.5)*20,z=-48+r()*54;C.box(M.stone,.6+r()*.5,.025,.4+r()*.4,x,.02,z,0,r()*3);}
 for(const [x,z,s] of [[-4,-6,1.1],[5,-16,1.4],[-6,-31,1.2],[2.5,-39,.9],[2,30,1.1]]){const p=new THREE.Mesh(new THREE.CircleGeometry(s,20),M.puddle);p.rotation.x=-Math.PI/2;p.position.set(x,.03,z);p.scale.set(1,.6,1);root.add(p);}

 progress(.3,'Filling the moat');
 // ---------- moat with stone-block retaining walls (ishigaki) ----------
 for(const [zw,dir] of [[11,1],[20,-1]])for(let row=0;row<5;row++){let x=-95;while(x<95){const w=.7+r()*.9,y=-2.3+row*.48;if(Math.abs(x)>2.7||row<1)C.box(M.ishigaki,w-.04,.44,.6,x+w/2,y,zw+dir*(.3+row*.06),r()*.04,0,r()*.05);x+=w;}C.box(M.stone,190,.18,.8,0,.0,zw+dir*.4-dir*.1);}
 const water=new Water(new THREE.PlaneGeometry(190,9.4),{textureWidth:512,textureHeight:512,waterNormals:k.maps.rock[1],waterColor:0x10091a,sunColor:0xffd2a0,sunDirection:new THREE.Vector3(.28,.4,-.87).normalize(),distortionScale:.35,fog:true});
 water.rotation.x=-Math.PI/2;water.position.set(0,-1.45,15.5);water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.12;');root.add(water);
 for(let i=0;i<40;i++){const x=(r()-.5)*170;if(Math.abs(x)<4)continue;C.box(M.moss,.05,.6+r()*.6,.05,x,-1.2,11.6+r()*.5);C.box(M.moss,.05,.5+r()*.6,.05,x+.3,-1.2,19.5-r()*.5);}// reeds at the waterline

 // ---------- arched lacquer bridge ----------
 for(let z=9.4;z<=21.6;z+=.32){const y=bridgeH(z),y2=bridgeH(z+.32),a=Math.atan2(y2-y,.32);C.box(M.timber,4.9,.12,.31,0,y-.06,z+.16,-a);}
 for(const s of [-1,1]){C.box(M.black,.24,.3,12.4,s*2.35,.0,15.5);for(let i=0;i<=12;i++){const z=9.5+i,y=bridgeH(z);C.box(M.lacquer,.16,1.05,.16,s*2.4,y+.5,z);if(i%3===0){C.geo(M.bronze,new THREE.SphereGeometry(.14,10,8),s*2.4,y+1.1,z,0,0,0,1,1.4,1);C.geo(M.bronze,new THREE.ConeGeometry(.05,.18,8),s*2.4,y+1.33,z);}
   if(i<12){const y2=bridgeH(z+1);C.beam(M.lacquer,[s*2.4,y+.95,z],[s*2.4,y2+.95,z+1],.11);C.beam(M.lacquer,[s*2.4,y+.45,z],[s*2.4,y2+.45,z+1],.07);}}
  for(let z=11;z<=20;z+=3)C.box(M.black,.35,2.6,.35,s*1.6,-1.6+bridgeH(z)/2,z);}
 for(let z=10.5;z<21;z+=.8)C.box(M.black,4.2,.2,.24,0,bridgeH(z)-.28,z);

 progress(.45,'Raising the great gate');
 // ---------- the quarter wall and the great gate ----------
 wallRun(C,M,-95,-4.6,8,{h:3.4});wallRun(C,M,4.6,95,8,{h:3.4});
 for(const s of [-1,1]){C.box(M.black,.7,6.6,.7,s*3.45,3.3,8);C.box(M.black,.42,5.2,.42,s*3.45,2.6,6.2);C.box(M.stone,1.1,.35,1.1,s*3.45,.17,8);C.box(M.stone,.8,.3,.8,s*3.45,.15,6.2);
  C.box(M.black,.5,4.6,.5,s*4.5,2.3,8);C.box(M.timber,1.0,2.8,.1,s*4.0,1.6,7.4,0,0,0);// side wicket
  // great door leaves, swung inward, with iron studs
  C.with(s*3.05,0,7.7,s*1.25,()=>{C.box(M.timber,-.0+3,4.8,.18,-s*1.5,2.6,0);for(let yy=.6;yy<5;yy+=.75)C.box(M.black,3,.1,.24,-s*1.5,yy,0);for(let yy=.6;yy<5;yy+=.75)for(let xx=.3;xx<3;xx+=.5)C.box(M.bronze,.08,.08,.28,-s*xx,yy,0);});
  C.beam(M.black,[s*3.45,4.9,8],[s*3.45,4.9,6.2],.32);}
 C.box(M.black,9.2,.55,.6,0,5.25,8);C.box(M.black,8.4,.36,.45,0,4.5,8);C.box(M.black,8.2,.4,.4,0,5.0,6.2);
 C.geo(S.horizontal,S.hGeo(0,3.2,.8),0,5.95,8.42);C.box(M.black,3.5,1.05,.12,0,5.95,8.34);
 gableRoof(C,M,{y:6.55,z:7.1,w:9.6,d:4.4,rise:2.3,over:1.7,side:.9,ridgeH:.5});
 for(const s of [-1,1]){chochin(C,M,glows,s*2.1,4.05,8.9,{s:1.9,kind:'red',cord:.35});}
 chochin(C,M,glows,0,3.8,6.0,{s:1.4,kind:'white',cord:.5});
 // gatehouse (bansho) just inside, its lit window facing the passage
 C.box(M.stone,4.6,.3,6.6,9.3,.15,3.2);C.box(M.plaster,4.2,2.8,6.2,9.3,1.7,3.2);for(const zz of [.1,6.3])for(const xx of [7.2,11.4])C.box(M.black,.2,2.9,.2,xx,1.75,zz);
 C.box(M.shoji,.05,1.3,2.2,7.17,1.75,3);C.box(M.timber,.6,.08,2.4,6.95,1.05,3);C.box(M.black,.08,1.5,.08,7.15,1.75,1.85);C.box(M.black,.08,1.5,.08,7.15,1.75,4.15);
 C.box(M.timber,.4,.06,.5,6.95,1.1,3.6);C.box(new THREE.MeshStandardMaterial({color:0xe8dcc0,roughness:1}),.3,.04,.42,6.95,1.15,3.6);// the gatekeeper's book
 gableRoof(C,M,{x:9.3,y:3.1,z:3.2,ry:Math.PI/2,w:6.4,d:4.2,rise:1.3,over:.7,side:.35,ridgeH:.3});
 chochin(C,M,glows,6.8,2.55,1.2,{s:.8,kind:'white',cord:.2});

 progress(.6,'Lighting the teahouses beyond the wall');
 // ---------- teahouses lining the inner plaza and the road toward the avenue ----------
 let z=5,i=0;for(const side of [-1,1]){z=side<0?5:-1.6;i=side<0?0:5;while(z>-60){const w=7.8+r()*2.4,floors=r()<.35?3:2;teahouse(C,M,S,glows,{x:side*12.6,z:z-w/2,ry:side<0?Math.PI/2:-Math.PI/2,w,d:9,floors,seed:i*7+side,sign:i%16,plaque:i%5===0?1+(i%7):-1,wall:[M.plaster,M.plasterOchre,M.boardWall,M.plasterGrey][i%4]});z-=w+.15;i++;}}
 // second rank of roofs beyond the street for a dense skyline
 for(const side of [-1,1])for(let j=0;j<7;j++)teahouse(C,M,S,glows,{x:side*27,z:-2-j*9.5,ry:side<0?Math.PI/2:-Math.PI/2,w:9,d:8,floors:2+(j%2),seed:90+j+side,sign:-1});
 for(let j=0;j<6;j++)teahouse(C,M,S,glows,{x:-28+j*11,z:-72,ry:0,w:10,d:8,floors:2+(j%3===0?1:0),seed:200+j,sign:-1});
 // street furniture outside the arena footprint
 for(const t of streetProps(C,M,S,glows,[['buckets',-10.6,-3,Math.PI/2],['kanban',-10.7,-9.5],['bench',10.4,-7,-Math.PI/2],['barrel',10.7,-9.8],['kanban',10.7,-30.5],['pine',-10.7,-31],['buckets',10.6,-36,-Math.PI/2],['kanban',-10.7,-38.5],['bench',-10.4,-44,Math.PI/2],['barrel',10.7,-44],['pine',10.7,-1.5],['kanban',-3.6,6.6],['kanban',3.6,6.6]],r))trunks.push(t);
 // strings of lanterns across the street
 for(const zz of [-34,-40,-46]){C.beam(M.rope,[-11.6,5.4,zz],[0,4.9,zz],.03);C.beam(M.rope,[0,4.9,zz],[11.6,5.4,zz],.03);for(let q=-4;q<=4;q++)chochin(C,M,glows,q*2.4,4.7+Math.abs(q)*.08,zz,{s:.7,kind:(q+zz)%2?'red':'white',cord:.18});}
 // kido gate to the avenue
 for(const s of [-1,1]){C.box(M.black,.38,4.6,.38,s*5.5,2.3,-49);C.box(M.stone,.7,.3,.7,s*5.5,.15,-49);}C.box(M.black,11.8,.34,.4,0,4.3,-49);C.geo(S.horizontal,S.hGeo(1,2.6,.66),0,3.75,-48.75);C.box(M.black,2.9,.8,.1,0,3.75,-48.82);gableRoof(C,M,{y:4.65,z:-49,w:12,d:1.2,rise:.7,over:.5,side:.3,ridgeH:.25,gable:false,rafters:false});
 fireTower(C,M,glows,18,-66,{h:21});
 // split mask on the avenue stones
 const porcelain=new THREE.MeshStandardMaterial({color:0xf2ece2,roughness:.35});for(const s of [-1,1])C.geo(porcelain,new THREE.SphereGeometry(.18,14,10,0,Math.PI),s*.22,.04,-40,-Math.PI/2,0,s*.4,1,.45,1.3);

 progress(.72,'Tying fortunes to the willow');
 // ---------- approach: lantern posts, tea stalls, willow and fortune rack ----------
 for(let zz=24;zz<=48;zz+=5)for(const s of [-1,1]){andonPost(C,M,glows,s*6.4,zz);trunks.push([s*6.4,zz,.35]);}
 for(const s of [-1,1]){const x=s*10.2,zz=40;C.box(M.timber,3.6,.1,2.6,x,.85,zz);for(const a of [-1,1])for(const b of [-1,1])C.box(M.black,.1,2.4,.1,x+a*1.7,1.2,zz+b*1.2);
  for(let q=0;q<26;q++)C.box(M.bamboo,.05,2.1,.05,x+s*1.75,1.15,zz-1.25+q*.1);slope(C,M,{w:4,x,z0:zz-1.4,y0:2.6,z1:zz+1.9,y1:2.05,sori:0,corner:0,rafters:false});C.box(M.norenRed,.9,.04,.6,x-s*.6,.92,zz);
  chochin(C,M,glows,x-s*1.8,1.95,zz+1.5,{s:.7,kind:'red',cord:.1});}
 const wil=willow(root,k,M,{x:-9.6,z:27,seed:41,height:8.8,strands:330,fortunes:150});trunks.push(wil.trunk);
 C.box(M.timber,2.6,.08,.08,-7.4,1.5,23.3);C.box(M.timber,2.6,.08,.08,-7.4,1.0,23.3);for(const s of [-1,1])C.box(M.black,.1,1.7,.1,-7.4+s*1.3,.85,23.3);for(let q=0;q<38;q++)C.box(new THREE.MeshStandardMaterial({color:0xf0e8d6,roughness:1}),.05,.16,.03,-8.6+q*.065,(q%2?1.42:.92),23.32);trunks.push([-7.4,23.3,.2]);
 // distant hills and the faint lights of the city across the fields
 for(let q=0;q<26;q++){const a=q/26*Math.PI*2,d=300+r()*90;const hill=new THREE.Mesh(new THREE.ConeGeometry(70+r()*60,40+r()*50,6),new THREE.MeshBasicMaterial({color:0x1a1222,fog:false}));hill.position.set(Math.cos(a)*d,-12,Math.sin(a)*d);hill.scale.y=.6;root.add(hill);}
 for(let q=0;q<160;q++){const a=Math.PI*(.15+r()*.7),d=140+r()*160;glows.push([Math.cos(a)*d*(r()<.5?-1:1),-1+r()*3,Math.sin(a)*d,1,.7,.4,1.5+r()*1.5]);}

 progress(.86,'Kindling the lamps');
 C.build(root);k.finish();
 const glow=glowPoints(root,glows,renderer);
 const petals=motes(root,renderer,{count:420,area:[50,14,50],speed:.35,size:.035,drift:1.2,base:0,seed:51});
 const lights=[[ -2.4,4.2,10.2,0xff7a3a,26],[2.4,4.2,10.2,0xff7a3a,26],[0,3.2,16,0xffa060,14],[-7,3,27,0xffb070,16],[4,3,40,0xffa060,14],[-8,4.5,-8,0xff9050,30],[8,4.5,-22,0xff9050,30],[-3,5.5,-40,0xffa060,30]];
 for(const [x,y,zz,c,p] of lights){const l=new THREE.PointLight(c,p,24,1.8);l.position.set(x,y,zz);root.add(l);}

 const inRect=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 const canWalk=(x,z)=>{if(trunks.some(([a,b,rr])=>Math.hypot(x-a,z-b)<rr))return false;return inRect(x,z,-7,7,22.3,50)||inRect(x,z,-2.25,2.25,9.2,22.6)||inRect(x,z,-3,3,6.5,9.4)||(inRect(x,z,-11.4,11.4,-48,6.8)&&!(x>6.6&&z>-.4));};
 const walkHeight=(x,z)=>Math.abs(x)<2.6?bridgeH(z):0;
 progress(.97,'The willow sways');
 return {texturesLoaded:14,grassBlades:0,trunks:[],discoveries:clues['quarter-gate'],
  views:{arrival:{pos:[0,2.2,46],look:[0,5,4],name:'The embankment road',sub:'Lanterns lead across the paddies to a single gate.'},willow:{pos:[-2.5,1.9,32],look:[-9.6,4.2,26],name:'The looking-back willow',sub:'Guests glance back here when they leave. Most never do.'},moat:{pos:[6,2.8,24.5],look:[-10,-.5,13],name:'Lanterns on the moat',sub:'Black water, red reflections.'},plaza:{pos:[0,2.4,3],look:[0,4,-40],name:'Inside the Willow Gate',sub:'A future battle ground before the avenue.'}},
  canWalk,walkHeight,
  locationAt(x,z){return z>22.3?'The embankment road':z>9.4?'The moat bridge':z>6?'The Willow Gate':z>-30?'The gate plaza':'Toward the Avenue of Blossoms';},
  update(t,dt,cam){sky.update(t,cam);glow.update(t,cam||camera);petals.update(t,cam||camera);wil.update(t);k.windTime.value=t;water.material.uniforms.time.value=t*.35;},
  setEvening(){}};
}
