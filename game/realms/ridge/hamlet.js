// III·1 The Silkfarm Hamlet — steep thatched farmhouses above stone-walled terraces, full moon.
import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { nightSky } from '../atmosphere.js';
import * as R from './common.js';

const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const T0=26,STEP=7,DROP=1.5;
const wallX=(i,z)=>T0+i*STEP-2.5*Math.sin(z*.05+1);
export function ground(x,z){return 1.2*ss(-28,-48,z);}
function H(x,z){let y=ground(x,z);
 const w=-x-27+2*Math.sin(z*.07);if(w>0)y+=Math.pow(w,1.2)*.42+Math.sin(x*.21+z*.13)*.8*ss(0,8,w);
 const e=x-T0+2.5*Math.sin(z*.05+1);if(e>0){const f=e/STEP,i=Math.floor(f),fr=f-i;if(i<10)y+=-DROP*(i+ss(0,.05,fr));else y+=-DROP*10-(e-70)*.9;}
 if(z<-50)y+=Math.min(34,Math.pow(-z-50,1.15)*.5)+Math.sin(x*.17)*1.2*ss(-50,-60,z);
 if(z>52)y-=(z-52)*.15;return y;}
const pathX=z=>1.2*Math.sin(z*.08)-3*ss(-18,-30,z);

export async function create(root,renderer,progress,{camera}={}){
 progress(.08,'Climbing to the silk hamlet');const k=await kit(root,3301);const r=k.random;const {box,beam,cylinder,mesh,rock,stone,dark,wood,moss}=k;
 const sky=nightSky(root,{top:0x050912,horizon:0x26324a,glow:0x5a6888,moonDir:R.MOON,moonSize:48,clouds:.3,cloudColor:0x2c3754,stars:2600});
 const turf=k.surface('moss',0x5d6a5c,60,1),earth=k.surface('earth',0x8a7f6c,14,.95),yardMat=k.surface('earth',0x7f7868,10,.95),wallStone=k.surface('rock',0x7c8486,3,.9);
 R.terrain(k,H,{w:340,d:300,seg:300,x:30,z:0,mat:turf});
 // Earthen path with stepping stones, and the packed threshing yard.
 {const pts=[],uv=[],ix=[];let n=0;for(let z=50;z>=-49;z-=1){const x=pathX(z),w=1.7+.3*Math.sin(z*.3);for(const s of [-1,1]){pts.push(x+s*w,ground(x+s*w,z)+.03,z);uv.push(s>0?1:0,z*.25);}if(n){const a=(n-1)*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}n++;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,earth);}
 k.floor(24,22,0,0,.035,yardMat);for(let i=0;i<60;i++){const z=48-i*1.6;if(Math.abs(z)<11)continue;const s=box(.9+r()*.4,.08,.6+r()*.3,pathX(z)+(r()-.5)*.8,ground(0,z)+.05,z,k.surface('stone',0x8d9290));s.rotation.y=(r()-.5)*.6;}
 // Yard dressing: scattered straw, wheel ruts, a stone drain along its edge.
 {const strawBits=new THREE.MeshStandardMaterial({color:0x9a8a62,roughness:1});const g=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.012,.025),strawBits,900),d=new THREE.Object3D();for(let i=0;i<900;i++){const a=r()*6.28,rr=Math.sqrt(r())*12;d.position.set(Math.cos(a)*rr*1.05,.05,Math.sin(a)*rr*.95);d.rotation.set(0,r()*6.28,0);d.updateMatrix();g.setMatrixAt(i,d.matrix);}g.receiveShadow=true;root.add(g);
  const rut=new THREE.MeshStandardMaterial({color:0x4d4a40,roughness:1});for(const xo of [-.8,.8])for(let z=-11;z<11;z+=.5){const m=mesh(new THREE.PlaneGeometry(.22,.55),rut,xo+Math.sin(z*.2)*1.5+5,.04,z);m.rotation.x=-Math.PI/2;m.castShadow=false;}
  for(let z=-11;z<11;z+=.62){box(.6,.12,.6,-12.2,.06,z,k.surface('stone',0x7b8080));}}
 // Low dry-stone walls and bamboo fencing along the hamlet road.
 {const bam=k.surface('moss',0x8d905c,1,.8);for(const sd of [-1,1])for(let z=46;z>14;z-=.9){const x=pathX(z)+sd*3.2;rock(x,.05,z,.42+r()*.18,r()<.35?moss:stone);}
  for(const sd of [-1,1]){const x0=sd*7.5;for(let z=44;z>16;z-=1.8){beam([x0,0,z],[x0,1.2,z],.035,bam);}for(const y of [.4,.8,1.15])beam([x0,y,44],[x0,y,16],.022,bam);}}
 // Puddles holding the moon.
 const puddle=R.moonWater({ripple:.25});const waters=[puddle];for(const [x,z,s]of [[1.5,30,1.4],[-1,18,1],[4,-4,1.8],[-6,6,1.2],[-2,-20,1.3],[-3.5,-36,1],[-7,-6,.9],[8,7,1.1],[2.5,9,.7]]){const p=mesh(new THREE.CircleGeometry(s,20),puddle,x,ground(x,z)+.045,z);p.rotation.x=-Math.PI/2;p.scale.y=.6;p.receiveShadow=true;p.castShadow=false;}
 progress(.2,'Raising the thatch');
 // Farmhouses. Footprints feed collision.
 const houses=[
  [-19,0,24,{length:15,seed:2,lit:[true,false,false]}],[-19,0,3,{length:16,seed:3,lit:[true,true,false]}],[-20,0,-20,{length:14,seed:4,lit:[false,true,false]}],
  [19,0,22,{length:14,seed:5,lit:[true,true,false],rot:Math.PI}],[19,0,-14,{length:16,seed:6,lit:[true,false,true]}],
  [7,ground(7,-33),-33,{length:14,span:12,seed:7,lit:[true,true,true]}]];
 const prints=houses.map(([x,y,z,o])=>R.gasshoHouse(k,x,y,z,o));
 // A lower hamlet on the terraces and two houses on the far slope, for depth.
 for(const [i,z,s,rot]of [[3,-30,.9,0],[5,8,.85,.3],[4,40,.9,-.2],[7,-12,.8,.1],[8,26,.75,0]]){const x=wallX(i,z)+STEP*.5+1;R.gasshoHouse(k,x,-DROP*(i+1),z,{span:10,length:13,scale:s,rot,seed:20+i,frontProps:false,lit:[r()<.7,r()<.5,false]});}
 for(const [x,z,rot]of [[-48,-30,.4],[-40,40,-.3]])R.gasshoHouse(k,x,H(x,z),z,{span:10,length:13,rot,seed:40+x,frontProps:false,lit:[true,false,false]});
 progress(.36,'Stacking the terrace walls');
 // Stone-walled rice terraces stepping down to the valley.
 for(let i=0;i<10;i++){const pts=[],uv=[],ix=[];let n=0;for(let z=-90;z<=90;z+=1.5){const x=wallX(i,z),top=-DROP*i+.12,bot=-DROP*(i+1)-.4,bulge=.12*Math.sin(z*1.7+i)+.08*Math.sin(z*4.1);pts.push(x-.15+bulge,top,z,x+.25+bulge,bot,z);uv.push(z*.35,0,z*.35,DROP*.7);if(n){const a=(n-1)*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}n++;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const wm=mesh(g,wallStone);wm.material.side=THREE.DoubleSide;
  for(let z=-70;z<=70;z+=2.2+r()*2)rock(wallX(i,z)-.2,-DROP*i+.05,z,.28+r()*.3,r()<.4?moss:stone);}
 // Flooded paddies catch the moonlight; mulberry rows and drying racks stand on the others.
 const paddy=R.moonWater({ripple:.35});waters.push(paddy);for(let i=0;i<9;i++){if(i===1||i===4||i===7)continue;const pts=[],ix=[];let n=0;const z0=-60+r()*20,z1=40+r()*30;for(let z=z0;z<=z1;z+=2){pts.push(wallX(i,z)+.5,-DROP*(i+1)+.06,z,wallX(i+1,z)-.6,-DROP*(i+1)+.06,z);if(n){const a=(n-1)*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}n++;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(ix);g.computeVertexNormals();const p=new THREE.Mesh(g,paddy);p.receiveShadow=true;root.add(p);}
 const leaf=k.surface('moss',0x5b7040,1),leafCards=new THREE.MeshStandardMaterial({map:R.leafTexture('#3f5530'),alphaTest:.45,side:THREE.DoubleSide,roughness:.9});
 const mulberry=new THREE.Group();cylinder(.07,.11,1.1,0,.55,0,dark,6,mulberry);for(let j=0;j<4;j++){const a=j*1.6;beam([0,.9,0],[Math.cos(a)*.6,1.6,Math.sin(a)*.6],.035,dark,mulberry);}for(let j=0;j<3;j++){const c=mesh(new THREE.PlaneGeometry(1.9,1.5),leafCards,0,1.55,0,mulberry);c.rotation.y=j*Math.PI/3;}
 const mt=[];for(const i of [1,4,7])for(let z=-55;z<55;z+=2.2+r()*.6){mt.push([wallX(i,z)+2.2+(r()-.5)*.4,-DROP*(i+1),z,.85+r()*.35,r()*6]);mt.push([wallX(i,z)+4.6+(r()-.5)*.4,-DROP*(i+1),z+1,.85+r()*.35,r()*6]);}
 R.instanceProto(root,mulberry,mt);
 // Rice-drying racks (hasa) with straw bundles on the first terrace.
 const straw=k.surface('plaster',0xa08a5a,.6,1);for(const [i,z0]of [[0,-40],[0,10],[2,-15],[3,30]]){const x=wallX(i,z0)+3.5,y=-DROP*(i+1);for(let j=0;j<5;j++)beam([x,y,z0+j*3],[x,y+2.3,z0+j*3],.06,wood);for(const yy of [1.2,1.9])beam([x,y+yy,z0],[x,y+yy,z0+12],.04,wood);for(let j=0;j<34;j++){const b=box(.32,.9,.22,x+(j%2?.1:-.1),y+1.25+(j%3===0?.7:0),z0+.3+j*.34,straw);b.rotation.x=(r()-.5)*.15;}}
 progress(.5,'Planting the cedars on the hill');
 // Cedar forest climbing the western hill and the northern ridge.
 const trunks=[];for(let i=0;i<48;i++){let x,z;if(i<30){x=-30-r()*45;z=-60+r()*120;}else{x=-30+r()*55;z=-54-r()*30;}if(Math.abs(x-pathX(z))<6&&z<-46)continue;const g=new THREE.Group();g.position.y=H(x,z)-.2;k.batch.add(g);k.cedar(x,z,16+r()*14,.45+r()*.4,g);}
 for(const [x,z,h]of [[-26,36,24],[-27,-4,26],[-25,-34,22],[-12,-45,25],[14,-47,23]]){const g=new THREE.Group();g.position.y=H(x,z)-.15;k.batch.add(g);trunks.push(k.cedar(x,z,h,.75,g));}
 const far=[];for(let i=0;i<2600;i++){const a=r()*6.283,d=70+r()*130,x=Math.cos(a)*d+20,z=Math.sin(a)*d;if(x<-138||x>196||Math.abs(z)>146)continue;if(x>60&&Math.abs(z)<120)continue;const y=H(x,z);if(y<-25&&x>80)continue;far.push([x,y-.5,z,.9+r()*1.1,r()*6]);}
 await R.distantForest(root,far,{tint:0x6f7e94});
 R.farRidges(root,{layers:[{dist:330,height:150,color:0x283246},{dist:560,height:260,color:0x1d2638},{dist:900,height:380,color:0x161d2e}],center:[20,0,0],base:-90,seed:12,mist:0x323e50});
 progress(.62,'Lighting the gable windows');
 // Water channel with a turning mill wheel beside the first eastern house.
 const chan=k.surface('rock',0x6a7070,2,.9),water=R.moonWater({ripple:1.2,flow:[0,1.5]});waters.push(water);for(const [x0,z0,x1,z1]of [[12.1,47,12.1,12],[12.1,12,27,12]]){const len=Math.hypot(x1-x0,z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2,ang=Math.atan2(x1-x0,z1-z0);const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=ang;k.batch.add(g);for(const s of [-1,1])box(.28,.45,len,s*.55,.1,0,chan,g);const w=mesh(new THREE.PlaneGeometry(.85,len),water,0,-.08,0,g);w.rotation.x=-Math.PI/2;}
 const wheel=new THREE.Group();wheel.position.set(12.9,1.4,25);root.add(wheel);{const rim=new THREE.MeshStandardMaterial({color:0x4a3e30,roughness:.9});for(const s of [-.28,.28]){const t=new THREE.Mesh(new THREE.TorusGeometry(1.45,.07,6,28),rim);t.rotation.y=Math.PI/2;t.position.x=s;wheel.add(t);}for(let i=0;i<12;i++){const a=i/12*6.283;const p=new THREE.Mesh(new THREE.BoxGeometry(.62,.06,.5),rim);p.position.set(0,Math.sin(a)*1.3,Math.cos(a)*1.3);p.rotation.x=-a;wheel.add(p);const sp=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.45),rim);sp.position.set(0,Math.sin(a)*.7,Math.cos(a)*.7);sp.rotation.x=-a;wheel.add(sp);}const ax=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.2,8),rim);ax.rotation.z=Math.PI/2;wheel.add(ax);wheel.traverse(o=>{o.castShadow=true;});}
 box(.3,1.6,.3,12.9,.8,23.4,dark);box(.3,1.6,.3,12.9,.8,26.6,dark);
 // Roadside guardian statues under a small roof at the hamlet entrance.
 const jizoStone=k.surface('stone',0x8a8f88,1),bib=new THREE.MeshStandardMaterial({color:0x8e2b23,roughness:.9});for(let i=0;i<3;i++){const x=-4.8-i*.7,z=38;cylinder(.22,.26,.55,x,.28,z,jizoStone,10);mesh(new THREE.SphereGeometry(.19,12,10),jizoStone,x,.72,z);const b=mesh(new THREE.ConeGeometry(.27,.3,10,1,true),bib,x,.5,z+.02);b.material.side=THREE.DoubleSide;}box(2.6,.1,1.1,-5.5,1.35,38,dark);for(const x of [-6.7,-4.3])box(.1,1.35,.1,x,.68,38.4,dark);for(const sd of [-1,1]){const rf=box(2.9,.08,.9,-5.5,1.62,38+sd*.38,k.tile);rf.rotation.x=sd*.5;}
 k.sign(-4,1.6,33,'MISTWEAVE RIDGE');
 // Paper lantern posts along the path; their halos are additive glow points.
 const lanternPaper=R.paperGlow(true),halos=[];for(const [x,z]of [[3.2,36],[-3.4,22],[3.6,12],[-2.4,-14],[2.6,-24],[-5.6,-36],[-.2,-44]]){const y=ground(x,z);box(.12,1.7,.12,x,y+.85,z,dark);box(.42,.5,.42,x,y+1.85,z,lanternPaper);box(.52,.06,.52,x,y+2.13,z,dark);box(.5,.04,.5,x,y+1.58,z,dark);halos.push([x,y+1.85,z,1.6,0xffc070]);}
 // Silkworm trays and a ladder beside the attic clue.
 const tray=k.surface('plaster',0xb3a074,.5,1),greens=new THREE.MeshStandardMaterial({color:0x4d6a35,roughness:.9});for(let i=0;i<7;i++){box(1.4,.05,.8,-13.1,.25+i*.28,5.5,tray);box(1.3,.03,.7,-13.1,.29+i*.28,5.5,greens);}for(const s of [-.75,.75])box(.06,2.2,.06,-13.1+s,1.1,5.1,wood);
 for(let i=0;i<9;i++)box(.05,.05,.7,-13.6,.4+i*.55,7.6,wood);for(const s of [-.3,.3])beam([-13.6,0,7.6+s],[-14.2,5.3,7.6+s],.04,wood);
 // The loom left running, weaving five bells.
 const bolt=new THREE.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.fillStyle='#d9ccb0';g.fillRect(0,0,256,512);for(let y=0;y<512;y+=3){g.fillStyle=`rgba(120,100,70,${.15+Math.random()*.15})`;g.fillRect(0,y,256,1);}for(let i=0;i<5;i++){g.fillStyle=i===4?'#7a2f3a':'#556078';const cy=60+i*95;g.beginPath();g.moveTo(128,cy-30);g.quadraticCurveTo(170,cy-25,172,cy+28);g.lineTo(84,cy+28);g.quadraticCurveTo(86,cy-25,128,cy-30);g.fill();g.fillRect(122,cy-40,12,12);}return c;})());bolt.colorSpace=THREE.SRGBColorSpace;
 {const lx=12.6,lz=-11.6;for(const s of [-1,1]){box(.12,1.8,.12,lx+s*.85,.9,lz-.6,wood);box(.12,1.2,.12,lx+s*.85,.6,lz+.7,wood);beam([lx+s*.85,1.2,lz+.7],[lx+s*.85,1.75,lz-.6],.05,wood);}box(1.9,.1,.1,lx,1.75,lz-.6,dark);box(1.9,.1,.1,lx,.95,lz+.7,dark);const cloth=mesh(new THREE.PlaneGeometry(1.5,1.4),new THREE.MeshStandardMaterial({map:bolt,side:THREE.DoubleSide,roughness:1}),lx,1.3,lz);cloth.rotation.x=-.55;box(1.2,.5,.5,lx,.25,lz+1.1,wood);}
 // Cocoon racks and threshing gear at the yard edges.
 const ccs=[];for(const [x,z]of [[-14,16],[14.4,6],[-14.2,-10]]){for(const s of [-1,1])box(.07,1.9,.07,x+s*.9,.95,z,wood);for(let i=0;i<4;i++){box(1.9,.04,.6,x,.5+i*.42,z,tray);for(let j=0;j<10;j++)ccs.push([x-.8+j*.18,.62+i*.42,z+(r()-.5)*.4,.8]);}}
 R.cocoons(root,ccs,{sway:0,hang:false});
 for(const [x,z]of [[-12.2,-2],[12.6,2.5]]){cylinder(.42,.5,.6,x,.3,z,k.surface('rock',0x8a8a84),14);cylinder(.3,.3,.05,x,.61,z,dark,12);}
 for(let i=0;i<14;i++){const x=12.2+(i%2)*.6,z=-3-i*.45;const b=box(.4,1.1,.35,x,.55,z,straw);b.rotation.z=(r()-.5)*.2;}
 progress(.72,'Spinning the threads');
 // Glowing threads: from the last farmhouse uphill into the ravine, between roof ridges, and down to pegs.
 const curves=[];const gable=[7,ground(7,-33)+12.6,-33];
 for(let i=0;i<26;i++){const tx=-30+r()*60,tz=-55-r()*40,ty=H(tx,tz)+6+r()*16;curves.push(R.catenary([gable[0]+(r()-.5)*2,gable[1]-r()*3,gable[2]+(r()-.5)*4],[tx,ty,tz],1+r()*4,26));}
 for(let i=0;i<10;i++){curves.push(R.catenary([3+r()*6,4+r()*5,-26.5],[pathX(-48)+(r()-.5)*3,ground(0,-48)+.3+r()*3,-48-r()*10],1.5+r()*2,24));}
 curves.push(R.catenary([4,4.5,-26.2],[0,ground(0,-40)+.4,-40],1.2,20));
 for(const [a,b]of [[[-19,12.8,3],[7,12.5,-33]],[[-19,12.8,24],[-19,12.8,3]],[[19,12.4,-14],[7,12.6,-33]],[[-20,12.6,-20],[7,12.5,-33]]])for(let j=0;j<3;j++)curves.push(R.catenary([a[0],a[1]-j*.6,a[2]+(j-1)*1.5],[b[0],b[1]-j*.5,b[2]+(j-1)*1.2],2.5+j*1.6,30));
 const threads=R.threadField(root,curves,{intensity:1.2});
 const peg=k.surface('cedar',0x5a4a38);cylinder(.05,.06,.6,0,ground(0,-40)+.3,-40,peg,6);
 // Low mist over the terraces and valley, a thin veil across the yard.
 const mist=R.mistLayers(root,[{x:60,y:-8,z:0,w:120,d:200,opacity:.45,color:0x8c9ab4,speed:.015,scale:.03},{x:110,y:-20,z:0,w:200,d:300,opacity:.6,color:0x7e8ca8,speed:.01,scale:.02},{x:40,y:-3,z:-10,w:60,d:160,opacity:.3,color:0x9eabc4,speed:.02,scale:.05},{x:0,y:.6,z:0,w:70,d:110,opacity:.16,color:0xaab4c8,speed:.03,scale:.08},{x:-10,y:2.5,z:-60,w:90,d:50,opacity:.35,color:0x93a0bb,speed:.02,scale:.05}]);
 // Windows and lantern halos, drifting motes, a few real lights.
 for(const [x,y,z]of [[7,ground(7,-33)+4.6,-25.6],[7,ground(7,-33)+7,-25.6],[7,ground(7,-33)+9.2,-25.6],[-19,4.2,11.6],[-19,6.6,11.6],[19,4.2,15.6],[19,4.2,-5.6],[19,8.6,-5.6],[-19,4.2,32],[-20,6.6,-12.6]])halos.push([x,y,z,4.5,0xffb262]);
 const glow=R.glowPoints(root,halos,{pulse:.12});
 const motes=R.glowPoints(root,Array.from({length:140},(_,i)=>[(r()-.5)*60,0,-20+(r()-.5)*80,.18+r()*.2,r()<.7?0xffe2a0:0xcfe0ff,r()*20]),{rise:.35,height:14});
 const grassBlades=R.grassField(root,48000,r=>{const x=-36+r()*110,z=-58+r()*112;if(Math.abs(x-pathX(z))<2.6)return null;if(Math.abs(x)<12.3&&Math.abs(z)<11.3)return null;if(prints.some(f=>R.inRotRect(x,z,f,.3)))return null;const e=x-T0+2.5*Math.sin(z*.05+1);if(e>0&&e<70){const fr=(e/STEP)%1,ti=Math.floor(e/STEP);if(fr<.06)return null;if(ti<9&&ti!==1&&ti!==4&&ti!==7&&fr>.08&&fr<.9&&r()<.85)return null;}return [x,H(x,z),z];},{hue:[.16,.26],sat:.16,light:[.12,.22],height:[.1,.42]});
 for(const [x,y,z,c,p]of [[7,ground(7,-33)+3,-24.5,0xffa860,14],[-14,2.2,3,0xffad66,8],[19,2.2,-5,0xffad66,7],[14.5,2,22,0xffb070,7],[3.2,2,36,0xffbf78,5],[-2.4,2,-14,0xffbf78,4]]){const l=new THREE.PointLight(c,p,16,1.8);l.position.set(x,y,z);root.add(l);}
 k.finish();progress(.96,'The hamlet holds its breath');
 const obstacles=[[12.9,25,1.1],[-13.1,5.5,.9],[12.6,-11.4,1.2],[-12.2,-2,.6],[12.6,2.5,.6],[-14,16,1.1],[14.4,6,1.1],[-14.2,-10,1.1],[-5.5,38,1.6],[-4,33,1.3]];
 for(const h of halos.slice(0,7))obstacles.push([h[0],h[2],.3]);
 return {trunks,texturesLoaded:14,grassBlades,discoveries:clues['ridge-hamlet'],
  views:{arrival:{pos:[2,2.2,44],look:[4,7,-30],name:'The hamlet road',sub:'Lamplight in every gable, and no one home.'},yard:{pos:[-8,3,12],look:[8,6,-30],name:'The threshing yard',sub:'A flat yard reserved for a future encounter.'},terraces:{pos:[23,3.5,40],look:[70,-12,-10],name:'The moonlit terraces',sub:'Flooded paddies step down into the mist.'},threads:{pos:[-6,3.5,-20],look:[6,12,-50],name:'The thread uphill',sub:'One filament runs from the last house into the ravine.'}},
  canWalk(x,z){if(z>47||z<-49||x<-25||x>wallX(0,z)-.7)return false;if(x>11.5&&x<12.75&&z>11.5)return false;if(x>11.5&&z>11.5&&z<12.75)return false;if(prints.some(f=>R.inRotRect(x,z,f,.25)))return false;if(obstacles.some(([a,b,rr])=>Math.hypot(x-a,z-b)<rr))return false;if(z<-40&&Math.abs(x-pathX(z))>9)return false;if(z>16&&z<44&&Math.abs(Math.abs(x)-7.5)<.3)return false;return true;},
  walkHeight:ground,locationAt(x,z){return z<-26?'The last farmhouse':Math.abs(x)<12&&Math.abs(z)<11?'The threshing yard':z>30?'The hamlet road':x>12?'Above the terraces':'The Silkfarm Hamlet';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam||camera);threads.update(t);mist.update(t);glow.update(t);motes.update(t);wheel.rotation.x=-t*.6;for(const w of waters)w.uniforms.time.value=t;},setEvening(){}};
}
