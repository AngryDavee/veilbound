import * as THREE from 'three';
import { kit } from '../kit.js';
import { bakeStatic } from '../../assetlib.js';
import { clues } from './story.js';
import { nightSky, precipitation } from '../atmosphere.js';
import { springsMaterials, snowRoof, inn, smithy, gasLamp, glowSprites, steamField, fallSheet, snowTrees, terrain, mountains, snowMounds, snowPatches, stoneLantern, rng, fbm } from './common.js';
// Region VI·2 — The Forge Terraces. A smiths' lane opens onto a flat casting floor; the tatara
// shed and its waterwheel stand to the west, casting pits to the east, and smithies climb two
// stone terraces to the master's forge.
const T1=2.5,T2=5;
function ground(x,z){const ax=Math.abs(x);let h=z>-22.6?0:z>-35.3?T1:T2;if(z<-47)h=T2+THREE.MathUtils.smoothstep(-z,47,80)*42*(.6+.6*fbm(x*.03,z*.03,4));const side=THREE.MathUtils.smoothstep(ax,27,70)*(34+30*fbm(x*.025+3,z*.03,4));const lower=z>-22.5&&ax>25.6?THREE.MathUtils.smoothstep(ax,25.6,34)*6:0;return Math.max(h,side,lower)+(ax>20||z<-50?fbm(x*.25,z*.25,2)*.8:0);}
export async function create(root,renderer,progress,{camera}={}){
 progress(.08,'Climbing to the cold forges');
 const k=await kit(root,7171),M=springsMaterials(k),R=rng(7171),B=k.batch,trunks=[],lamps=[],glowsList=[],mounds=[],vents=[],hearths=[];
 const box=(w,h,d,x,y,z,m)=>k.box(w,h,d,x,y,z,m);
 const moonDir=[.3,.42,-.86];
 const sky=nightSky(root,{top:0x060a16,horizon:0x2c3850,glow:0x55607a,moonDir,moonSize:40,clouds:.55,cloudColor:0x262d40,stars:1600,starBrightness:.75,seed:9});
 terrain(root,k,{size:340,seg:170,cx:0,cz:-10,height:ground,repeat:70,rockSlope:[.45,.8]});
 mountains(root,k,{r0:190,peak:300,seed:11});
 const scorch=new THREE.MeshStandardMaterial({color:0x2a2420,roughness:1});
 progress(.2,'Setting the terrace stones');
 // Ground surfaces: a packed-earth lane and casting floor, terrace decks of stone flags.
 const earth=k.surface('earth',0x5f5650,8,.95);box(10.2,.14,42,0,-.05,26,earth);box(33,.14,28.4,0,-.05,-8.6,earth);box(13,.14,15.6,-18.3,-.05,-6.8,earth);box(7,.14,16.6,15.6,-.05,-5,earth);
 for(let z=-22.6;z>-30.2;z-=1.05)for(let x=-16;x<16;x+=1.3){box(1.25,.12,1.0,x+.65,T1-.04,z-.5,M.paving);}
 for(let z=-35.2;z>-47;z-=1.05)for(let x=-10;x<10;x+=1.3){box(1.25,.12,1.0,x+.65,T2-.04,z-.5,M.paving);}
 // Casting-floor inlays (flat): a ring of iron plates and scorched sand where bells were poured.
 {const ring=new THREE.Mesh(new THREE.RingGeometry(6.5,7.1,64),M.stone);ring.rotation.x=-Math.PI/2;ring.position.set(0,.035,-6);B.add(ring);const ring2=new THREE.Mesh(new THREE.RingGeometry(2.6,2.9,40),M.bronze);ring2.rotation.x=-Math.PI/2;ring2.position.set(0,.036,-6);B.add(ring2);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const p=box(3.6,.03,.22,Math.cos(a)*4.75,.035,-6+Math.sin(a)*4.75,M.stone);p.rotation.y=-a;}}
 // Retaining walls with snow on their copings, and the two central stairs.
 const wall=(x0,x1,z,y0,y1)=>{const L=x1-x0;for(let x=x0;x<x1-.01;x+=1.6){const w=Math.min(1.6,x1-x);box(w-.04,y1-y0,.8,x+w/2,(y0+y1)/2,z,M.stone);}box(L,.16,.95,(x0+x1)/2,y1+.08,z,M.stone);box(L-.1,.2,.8,(x0+x1)/2,y1+.24,z,M.snow);};
 wall(-16.5,-1.9,-22.95,-.1,T1);wall(1.9,16.5,-22.95,-.1,T1);wall(-3.4,-1.9,-35.4,T1-.1,T2);wall(1.9,3.4,-35.4,T1-.1,T2);for(const s of [-1,1]){box(.5,T1+.1,5.2,s*2.15,T1/2-.05,-20.1,M.stone);box(.6,.2,5.2,s*2.15,T1+.1,-20.1,M.snow);}
 for(const [z0,y0] of [[-17.5,0],[-30,T1]])for(let i=0;i<10;i++){const z=z0-.25-i*.5,y=y0+(i+1)*.25;box(3.6,.25,.52,0,y-.125,z,M.stone);box(3.5,.06,.3,0,y+.02,z+.08,M.snow);}
 for(const s of [-1,1]){for(const [z0,y0] of [[-17.5,0],[-30,T1]]){const pts=[];for(let i=0;i<=10;i++)pts.push(new THREE.Vector3(s*1.85,y0+1+i*.25,z0-i*.5));k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.05,6,false),M.innDark);for(let i=0;i<=10;i+=2)k.box(.1,1,.1,s*1.85,y0+.5+i*.25,z0-i*.5,M.innDark);}}
 // Terrace sides close against the valley rock.
 for(const s of [-1,1]){box(2,T2+3,20,s*17.4,(T2+3)/2-.5,-28,M.rock);box(2,T2+5,14,s*11,(T2+5)/2-.5,-42,M.rock);}
 progress(.32,'Raising the smithies');
 // Lane smithies, open toward the lane. East faces -X, west faces +X.
 let seed=31;for(const s of [-1,1])for(const zc of [37,28]){const r=smithy(k,M,{x:s*5.3,z:zc,rot:-s*Math.PI/2,W:8,D:7.4,parent:B,seed:seed++,rust:.25+R()*.4,sign:seed%8});hearths.push(r.hearth);vents.push(r.vent);}
 // Low charcoal bales and timber stacks where the lane opens, keeping the view to the tatara and gantry.
 for(let i=0;i<14;i++){const x=-6.2-(i%4)*.9-R()*.2,z=16+Math.floor(i/4)*1.6+R()*.3,y=.35+(i%7>4?.7:0);const c=k.cylinder(.38,.42,.75,x,y,z,M.rope,8);c.rotation.x=Math.PI/2;}box(4,.4,6.2,-7.6,1.45,18.5,M.snow);trunks.push([-7.5,18.5,3.4]);
 for(let i=0;i<5;i++){const c=k.cylinder(.16,.16,4.2,7.5,.2+i*.3,16+(i%2)*.2,M.innWood,8);c.rotation.x=Math.PI/2;c.position.z=19;c.position.x=6.4+i*.34;}box(2.2,.25,4.4,7.1,1.75,19,M.snow);for(const z of [16.8,21.2])box(.18,1.8,.18,8.4,.9,z,M.innDark);trunks.push([7.2,19,2.6]);
 // Terrace smithies face south toward the casting floor.
 for(const x of [-15.6,-7.2,7.2,15.6]){const r=smithy(k,M,{x,z:-30.3,rot:0,W:8,D:6.4,parent:B,seed:seed++,rust:.5,sign:Math.abs(x)<8?seed%8:-1});r.group.position.y=T1;r.group.updateMatrixWorld(true);hearths.push(r.hearth.clone().setY(r.hearth.y+T1));vents.push(r.vent.clone().setY(r.vent.y+T1));}
 // The master's forge: a wide two-storey hall closing the upper terrace.
 {const r=smithy(k,M,{x:0,z:-47,rot:0,W:15,D:9,parent:B,seed:91,rust:.8,sign:2,H:5.4,rise:3.4});k.lantern(-4,T2+4.6,-46.6,.7);k.lantern(4,T2+4.6,-46.6,.7);lamps.push(new THREE.Vector3(-4,T2+4.6,-46.6),new THREE.Vector3(4,T2+4.6,-46.6));r.group.position.y=T2;r.group.updateMatrixWorld(true);hearths.push(r.hearth.clone().setY(r.hearth.y+T2));vents.push(r.vent.clone().setY(r.vent.y+T2));}
 // Lanterns along the terrace fronts.
 for(const x of [-12,-6,6,12]){k.lantern(x,T1+3.1,-30.0,.55);lamps.push(new THREE.Vector3(x,T1+3.1,-30.0));}
 // Lane entry: gas lamps, stone lanterns, a snowed-in handcart.
 for(const [x,z] of [[4.3,44],[-4.3,44],[4.3,7],[-4.3,7],[4.4,24],[-4.4,32]]){glowsList.push(gasLamp(k,M,B,x,z));trunks.push([x,z,.3]);mounds.push([x,0,z,.5,.2,.5]);}
 for(const [x,z] of [[-11.8,4.6],[11.8,4.6],[-6,-21.6],[6,-21.6]]){glowsList.push(stoneLantern(k,M,B,x,z,0,1));trunks.push([x,z,.5]);}
 {const g=new THREE.Group();g.position.set(-3,0,10.5);g.rotation.y=.3;B.add(g);k.box(1.2,.12,2.2,0,.55,0,M.innWood,g);for(const s of [-1,1]){const w=k.cylinder(.48,.48,.08,s*.68,.48,.3,M.innWood,14,g);w.rotation.z=Math.PI/2;}k.beam([0,.6,1.1],[0,.75,2.4],.04,M.innWood,g);k.box(1.1,.3,2,0,.78,0,M.snow,g);k.box(.8,.4,.6,0,.85,-.4,M.rope,g);trunks.push([-3,10.5,1.3]);}
 progress(.45,'Banking the tatara');
 // Tatara shed: four great posts, a deep snow roof with a ridge vent, and the tall clay furnace.
 const TX=-18.6,TZ=-6.8;
 {for(const sx of [-1,1])for(const sz of [-1,1]){box(.6,8.6,.6,TX+sx*5.6,4.3,TZ+sz*7.4,M.innDark);box(1,.4,1,TX+sx*5.6,.2,TZ+sz*7.4,M.stone);}
  for(const sx of [-1,1]){box(.45,.5,15.6,TX+sx*5.6,8.4,TZ,M.innDark);box(.2,3.6,15,TX-5.7,1.8,TZ,M.innWood);}
  for(const sz of [-1,1])box(11.8,.5,.45,TX,8.4,TZ+sz*7.4,M.innDark);for(let i=-6;i<=6;i+=2)box(11.2,.3,.3,TX,8.9,TZ+i,M.innDark);
  box(.2,3.2,15,TX-5.75,1.6,TZ,M.innWood);for(let z=-7;z<7.4;z+=.55)box(.08,3.2,.08,TX-5.6,1.6,TZ+z,M.innDark);
  snowRoof(k,M,B,{x:TX,y:8.6,z:TZ,w:16.2,d:12.4,rise:4.4,over:1.2,side:.8,R,rotY:Math.PI/2});
  // Tatara: a long, low clay box furnace on a raised earthen bed, burning along its open top.
  const fg=new THREE.Group();fg.position.set(TX,0,TZ);B.add(fg);const kiln=k.surface('earth',0x7a5a44,1,.97),slag=new THREE.MeshStandardMaterial({color:0x1c1816,roughness:.35,metalness:.2});
  k.box(3.6,.32,5.2,0,.16,0,k.surface('earth',0x4a3c34,2,1),fg);
  for(let i=0;i<5;i++){const w=1.55-i*.13,l=3.3-i*.07;k.box(w,.25,l,0,.32+.125+i*.25,0,kiln,fg);}
  for(let i=0;i<7;i++){const z=-1.4+i*.47;k.box(.02,.9,.03,(i%2?.71:-.71)-(i%2?.02:-.02)*0,.85,z+.1,M.innDark,fg);}
  k.box(.62,.08,2.9,0,1.58,0,M.ember,fg);for(let i=0;i<9;i++)k.rock((R()-.5)*.4,1.62,-1.3+i*.33,.14,M.charcoal,fg);
  // Tuyere holes along both long sides, each fed by a bamboo pipe from the bellows trough.
  const ports=[];for(const s of [-1,1])for(let i=0;i<10;i++){const z=-1.4+i*.31;k.box(.06,.1,.1,s*.78,.6,z,M.ember,fg);k.beam([s*.82,.62,z],[s*1.55,.82,z*.9],.035,M.innWood,fg);ports.push([s*.85,.6,z]);}
  // Box bellows (one per side) with see-saw treadle boards and pivot posts.
  for(const s of [-1,1]){const bx=s*2.15;k.box(1.1,.6,3.6,bx,.3,0,M.innWood,fg);k.box(1.14,.06,3.64,bx,.62,0,M.innDark,fg);for(const h of [-1,1]){const b=k.box(.9,.07,1.7,bx,.78+h*.05,h*.88,M.innWood,fg);b.rotation.x=h*.08;}k.box(.18,.5,.18,bx,.9,0,M.innDark,fg);k.box(.2,1.9,.2,bx+s*.55,.95,-1.9,M.innDark,fg);k.box(.2,1.9,.2,bx+s*.55,.95,1.9,M.innDark,fg);k.box(.12,.12,3.9,bx+s*.55,1.8,0,M.innDark,fg);}
  // Slag runoff: glowing channels from both ends of the furnace into shallow pits, with dark slag cakes.
  for(const s of [-1,1]){for(let i=0;i<5;i++){const c=k.box(.18,.04,.5,(i%2?.06:-.06),.34,s*(1.85+i*.42),M.ember,fg);c.rotation.y=(i%2?.2:-.2);}k.box(1.2,.06,1.0,0,.33,s*3.9,slag,fg);k.box(.6,.05,.5,.1,.36,s*3.8,M.ember,fg);for(let i=0;i<5;i++)k.rock((R()-.5)*1.6,.38,s*(4.4+R()*.5),.22+R()*.15,slag,fg);}
  // Line shaft from the waterwheel to the bellows cranks.
  k.beam([2.2,4.4,7.4],[2.2,4.4,0],.12,M.innDark,fg);k.beam([2.2,4.4,0],[-2.2,4.4,0],.12,M.innDark,fg);for(const s of [-1,1])k.beam([s*2.2,4.4,0],[s*2.15,1.0,0],.05,M.iron,fg);
  trunks.push([TX,TZ-1.1,1.05],[TX,TZ,1.05],[TX,TZ+1.1,1.05],[TX+2.15,TZ-1.2,.75],[TX+2.15,TZ+1.2,.75],[TX-2.15,TZ-1.2,.75],[TX-2.15,TZ+1.2,.75],[TX,TZ+3.9,.6],[TX,TZ-3.9,.6]);
  // Charcoal and iron-sand heaps along the hall's back wall and corners.
  const heap=(x,z,s,mat)=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=1+.1*Math.sin(a*9+c*7)+.05*Math.sin(b*13);p.setXYZ(i,a*f,Math.max(b,0)*f,c*f);}g.computeVertexNormals();const m=k.mesh(g,mat,x,0,z);m.scale.set(s,s*.45,s*1.2);};
  const sand=new THREE.MeshStandardMaterial({color:0x2e2e33,roughness:1});heap(TX-4.1,TZ-4.4,1.6,M.charcoal);heap(TX-4.1,TZ-.6,1.4,sand);heap(TX-4.1,TZ+3.4,1.5,M.charcoal);heap(TX+4.0,TZ-5.6,1.1,sand);for(const z of [-4.4,-.6,3.4])trunks.push([TX-4.1,TZ+z,1.6]);trunks.push([TX+4,TZ-5.6,1.2]);
  for(let i=0;i<6;i++){const c=k.cylinder(.3,.25,.45,TX+3.8,.23,TZ+2+i*.7,M.rope,10);}
  globalThis.__tataraPorts=ports.map(([x,y,z])=>[TX+x,y,TZ+z]);}
 // Waterwheel: overshot wheel turning on a timber axle beside the shed, fed by a trestle flume.
 const WX=-16.3,WY=4.1,WZ=7.6,WR=3.7;const wheel=new THREE.Group();
 {for(const s of [-1,1]){const rim=new THREE.Mesh(new THREE.TorusGeometry(WR,.13,6,40),M.innWood);rim.position.z=s*.62;wheel.add(rim);const hub=new THREE.Mesh(new THREE.TorusGeometry(WR*.35,.09,5,20),M.innDark);hub.position.z=s*.62;wheel.add(hub);}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;for(const s of [-1,1]){const sp=new THREE.Mesh(new THREE.BoxGeometry(.12,WR*2-.1,.12),M.innDark);sp.rotation.z=a;sp.position.z=s*.62;if(i<6)wheel.add(sp);}
   const b=new THREE.Mesh(new THREE.BoxGeometry(.9,.08,1.3),M.innWood);b.position.set(Math.cos(a)*(WR-.4),Math.sin(a)*(WR-.4),0);b.rotation.z=a+.6;wheel.add(b);const sn=new THREE.Mesh(new THREE.BoxGeometry(.7,.05,1.2),M.ice);sn.position.set(Math.cos(a)*(WR-.36),Math.sin(a)*(WR-.36)+.05,0);sn.rotation.z=a+.6;wheel.add(sn);}
  const ax=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,2.2,10),M.innDark);ax.rotation.x=Math.PI/2;wheel.add(ax);}
 const wheelBaked=bakeStatic(wheel);wheelBaked.position.set(WX,WY,WZ);root.add(wheelBaked);
 for(const s of [-1,1]){box(.5,WY+.3,.5,WX,WY/2-.1,WZ+s*1.1,M.innDark);box(.8,.4,.8,WX,.2,WZ+s*1.1,M.stone);}
 k.beam([WX,WY,WZ],[TX+2,6.2,TZ+7.6],.14,M.innDark);
 // Wheel pit and tailrace, a stone channel running away west.
 box(9,1.2,3.0,WX,-.2,WZ,M.stone);box(8,.1,2.2,WX,.36,WZ,new THREE.MeshStandardMaterial({color:0x0c161c,roughness:.1,metalness:.3}));box(30,.8,2.2,WX-19,.0,WZ,M.stone);box(30,.08,1.5,WX-19,.38,WZ,new THREE.MeshStandardMaterial({color:0x0c161c,roughness:.1,metalness:.3}));
 // Flume on trestles from the western slope, ending above the wheel crown.
 {const fy=WY+WR+.5;for(let x=WX-.3;x>-48;x-=2.6){box(2.62,.12,1.0,x-1.3,fy+(WX-x)*.03,WZ,M.innWood);for(const s of [-1,1])box(2.62,.4,.08,x-1.3,fy+.2+(WX-x)*.03,WZ+s*.48,M.innWood);box(2.5,.08,.9,x-1.3,fy+.42+(WX-x)*.03,WZ,M.snow);
   if(Math.round(x)%5===0||x===WX-.3)for(const s of [-1,1]){const gy=Math.max(0,ground(x-1.3,WZ+s*.6));const h=fy+(WX-x)*.03-gy;box(.18,h,.18,x-1.3,gy+h/2,WZ+s*.5,M.innDark);k.beam([x-1.3,gy+h*.3,WZ+s*.5],[x-1.3,gy+h*.8,WZ-s*.5],.05,M.innDark);}}}
 const fallGeo=new THREE.PlaneGeometry(.9,WR*1.1,1,6);fallGeo.translate(0,WR*.55,0);const fallG=new THREE.Group();fallG.position.set(WX-.6,WY,WZ);fallG.rotation.y=Math.PI/2;root.add(fallG);const fall=fallSheet(fallG,fallGeo,{speed:2.4,opacity:.7,streaks:10});
 trunks.push([WX,WZ,4.2]);
 progress(.58,'Opening the casting pits');
 // Casting pits east of the floor: a timber gantry with chain hoist over a sand pit and the split bell mould.
 {const CX=15.8,CZ=-6;box(5.4,.1,5.4,CX,.02,CZ,new THREE.MeshStandardMaterial({color:0x3a3028,roughness:1}));for(const s of [-1,1]){box(5.8,.4,.4,CX,.2,CZ+s*2.9,M.stone);box(.4,.4,5.8,CX+s*2.9,.2,CZ,M.stone);}
  for(const s of [-1,1]){k.beam([CX-2.7,0,CZ+s*2.6],[CX,7.4,CZ+s*.2],.16,M.innDark);k.beam([CX+2.7,0,CZ+s*2.6],[CX,7.4,CZ+s*.2],.16,M.innDark);}box(.4,.4,1.2,CX,7.4,CZ,M.innDark);box(.5,.2,1.4,CX,7.65,CZ,M.snow);
  for(let i=0;i<14;i++)k.mesh(new THREE.TorusGeometry(.06,.018,4,8),M.iron,CX,7.1-i*.15,CZ).rotation.y=i%2*Math.PI/2;k.box(.3,.15,.3,CX,4.9,CZ,M.iron);
  // The empty bell mould, split in two halves.
  for(const s of [-1,1]){const half=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.25,2.2,20,1,true,s>0?0:Math.PI,Math.PI),M.clay);half.material.side=THREE.DoubleSide;half.position.set(CX+s*.7,1.1,CZ+.4);half.rotation.z=s*.35;half.castShadow=true;B.add(half);}
  k.cylinder(1.4,1.5,.3,CX,.15,CZ+.4,M.clay,20);trunks.push([CX,CZ+.4,2.0]);
  // Crucible, ladle and cooling rack.
  k.cylinder(.5,.38,.7,CX-1.6,.35,CZ-2.0,M.clay,12);k.beam([CX-1.6,.7,CZ-2.0],[CX-3.1,1.0,CZ-2.4],.04,M.iron);trunks.push([CX-1.6,CZ-2.0,.7]);
  for(let i=0;i<3;i++){box(.12,1.6,.12,CX+2.4,.8,CZ-3+i*1.2,M.innDark);}box(.12,.12,2.6,CX+2.4,1.5,CZ-1.8,M.innDark);for(let i=0;i<3;i++)k.mesh(new THREE.TorusGeometry(.25,.05,5,12),M.bronze,CX+2.4,1.2,CZ-2.6+i*.8);
  // A small bell-cast shed roof over the pit corner.
  for(const sx of [-1,1])box(.22,3.8,.22,CX+3.4,1.9,CZ+sx*3.2,M.innDark);snowRoof(k,M,B,{x:CX+4.5,y:3.8,z:CZ,w:2.4,d:7,rise:.9,over:.6,side:.3,R,rotY:Math.PI/2});}
 // Master's hammer left on the top step.
 {box(.12,.12,.36,.6,T2+.12,-35.6,M.iron);const h=k.cylinder(.03,.03,.8,.6,T2+.1,-35.2,M.innWood,6);h.rotation.x=Math.PI/2;h.position.z=-35.2;k.mesh(new THREE.TorusGeometry(.05,.015,4,8),new THREE.MeshStandardMaterial({color:0xa2242a,roughness:.9}),.6,T2+.12,-35.0);}
 // Snow dressing everywhere outside the casting rectangle.
 for(let i=0;i<70;i++){const z=6+R()*40,s=R()<.5?-1:1;mounds.push([s*(4.5+R()*.4),0,z,.4+R()*.5,.15+R()*.15,.6+R()]);}
 for(let i=0;i<30;i++){const x=(R()-.5)*30,z=-22.8-R()*7;if(Math.abs(x)<2.2)continue;mounds.push([x,T1,z,.3+R()*.5,.12,.4+R()*.6]);}
 for(const s of [-1,1])for(let z=-16;z<4;z+=2.2)mounds.push([s*12.4,0,z,.5+R()*.4,.25,1.0]);
 const patches=[],slush=[];for(let i=0;i<140;i++){const lane=R()<.5;const x=lane?(R()<.5?-1:1)*(3.6+R()*1.1):(R()<.5?-1:1)*(10.6+R()*1.6),z=lane?5+R()*40:-17+R()*22;patches.push([x,.04,z,.25+R()*.5,.3+R()*.8]);}for(let z=6;z<46;z+=1.5)slush.push([(R()-.5)*2.4,.035,z,.8+R()*.5,1.3+R()*.7]);for(let i=0;i<60;i++){patches.push([(R()-.5)*30,T1+.05,-22.6-R()*7.2,.3+R()*.8,.3+R()*.6]);patches.push([(R()-.5)*18,T2+.05,-35.4-R()*11,.3+R()*.8,.3+R()*.6]);}
 progress(.7,'Snow on the valley cedars');
 const trees=[];for(let i=0;i<460;i++){const s=R()<.5?-1:1,x=s*(26+Math.pow(R(),1.4)*70),z=-120+R()*200,y=ground(x,z);trees.push([x,y,z,.8+R()*.9]);}
 for(let i=0;i<160;i++){const x=(R()-.5)*120,z=-52-R()*60;trees.push([x,ground(x,z),z,.8+R()*.8]);}
 for(let i=0;i<40;i++){const s=R()<.5?-1:1,x=s*(13+R()*7),z=14+R()*35;trees.push([x,ground(x,z),z,.6+R()*.5]);}
 await snowTrees(root,trees,{M,near:(x,z)=>Math.abs(x)<46&&z>-85&&z<60});snowMounds(root,M,mounds);snowPatches(root,M,patches);snowPatches(root,M,slush,{color:0x3e3a38,opacity:.5,roughness:.35});
 // Glows, smoke, sparks and snowfall.
 const tPorts=globalThis.__tataraPorts||[];delete globalThis.__tataraPorts;
 const glowItems=[...glowsList.map(p=>[p.x,p.y,p.z,2.1,0xffb862]),...lamps.map(p=>[p.x,p.y,p.z,1.4,0xff9d4a]),...hearths.map(p=>[p.x,p.y,p.z,3.2,0xff6a20]),...[-1.1,-.4,.3,1.0].map(dz=>[TX,1.85,TZ+dz,2.4,0xff7a2a]),...tPorts.map(([x,y,z])=>[x,y,z,.5,0xff6018]),[TX,.5,TZ+3.9,1.6,0xff5010],[TX,.5,TZ-3.9,1.6,0xff5010]];
 const glows=glowSprites(root,glowItems,{intensity:1.05,flicker:.18});
 const smoke=steamField(root,[...vents.map(v=>[v.x,v.y,v.z]),[TX,13.5,TZ],[TX,13.5,TZ]],{count:240,rise:16,life:14,size0:1.2,size1:7,opacity:.24,color:0x4a4e56,wind:[.5,.15],jitter:[.6,.6]});
 const tSteam=steamField(root,[[WX-.6,.4,WZ],[WX+1,.4,WZ],[WX-3,.4,WZ]],{count:40,rise:4,life:6,size0:.6,size1:3,opacity:.18,color:0xd8e2ec,wind:[-.2,0],jitter:[2,1.5]});
 const sparks=steamField(root,[[TX,1.7,TZ-1],[TX,1.7,TZ],[TX,1.7,TZ+1],[TX,1.7,TZ+.5],...hearths.map(h=>[h.x,h.y,h.z])],{count:180,rise:9,life:3.2,size0:.1,size1:.04,opacity:1,color:0xffa448,wind:[.4,.1],jitter:[.8,.6]});
 const snow=precipitation(root,{count:4600,color:0xf0f4ff,size:.075,area:[64,32,64],speed:1.2,drift:1.4,opacity:.88,seed:71});
 const lights=[];for(const [x,y,z,i,c] of [[TX+1.4,1.7,TZ,46,0xff6a24],[TX-1.2,3.2,TZ+.5,40,0xff8a3a],...[hearths[0],hearths[1],hearths[2]].map(h=>[h.x,h.y+.6,h.z,28,0xff7a30]),[hearths[5].x,hearths[5].y+.6,hearths[5].z,30,0xff7a30],[0,T2+3,-44,34,0xff8a40],[0,3.6,40,18,0xffb06a]]){const l=new THREE.PointLight(c,i,20,1.6);l.position.set(x,y,z);l.userData.base=i;root.add(l);lights.push(l);}
 k.finish();progress(.95,'Raking the coals');
 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 return {trunks,texturesLoaded:16,grassBlades:0,discoveries:clues['springs-forge'],
  views:{arrival:{pos:[0,2.1,41],look:[0,6,-10],name:'The smiths’ lane',sub:'Cold forges, and one coal still glowing.'},casting:{pos:[6,2.4,3],look:[-2,4,-24],name:'The casting floor',sub:'Where every anchor bell was poured.'},tatara:{pos:[-7.4,3.6,3.2],look:[-19,1.6,-7.5],name:'The tatara shed',sub:'The bellows still move with the waterwheel.'},terraces:{pos:[2,T2+6.5,-45.5],look:[-3,1,0],name:'The master’s terrace',sub:'The whole forge village below.'}},
  canWalk(x,z){const ax=Math.abs(x);if(z<-17.4&&z>-22.7&&ax>1.68&&ax<2.5)return false;return (ax<4.75&&z>5&&z<46.5)||inR(x,z,-12.3,12.4,-17.2,5.3)||inR(x,z,-16,16,-22.4,-17)||inR(x,z,-24,-12,-14.2,.4)||inR(x,z,12,18.6,-13,3)||(ax<1.7&&z<=-17.1&&z>-22.7)||inR(x,z,-16,16,-29.7,-22.5)||(ax<1.7&&z<=-29.6&&z>-35.3)||inR(x,z,-9.5,9.5,-46.4,-35.1);},
  walkHeight(x,z){if(z>-17.5)return 0;if(z>-22.5)return Math.abs(x)<1.8?Math.min(T1,(-17.5-z)/5*T1):0;if(z>-30)return T1;if(z>-35)return T1+Math.min(T2-T1,(-30-z)/5*(T2-T1));return T2;},
  locationAt(x,z){return z>5.3?'The smiths’ lane':z>-22.5?(x<-12.3?'The tatara shed':x>12.4?'The casting pits':'The casting floor'):z>-30?'The lower terrace':'The master’s forge';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam);snow.update(t,cam);glows.update(t);smoke.update(t);tSteam.update(t);sparks.update(t);fall.update(t);wheelBaked.rotation.z=-t*.55;lights.forEach((l,i)=>{l.intensity=l.userData.base*(.82+.18*Math.sin(t*7.3+i*2.1)*Math.sin(t*3.1+i));});},setEvening(){}};
}
