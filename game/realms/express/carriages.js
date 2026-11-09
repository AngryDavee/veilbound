import * as THREE from 'three';
import { kit } from '../kit.js';
import { bakeStatic } from '../../assetlib.js';
import { clues } from './story.js';
import { nightSky } from '../atmosphere.js';
import { materials, glows, signTexture, telegraphPole, rand as r } from './rolling.js';

// The Sleeping Carriages — four connected cars laid end to end along Z, floor at y=0.
// The train is static; the night landscape scrolls past the windows (+Z) in tiles.
// Cars (z from rear to front): third class 47.5..26.5, dining 25.1..4.1, sleeper 2.7..-18.3,
// baggage -19.7..-47.5. Gangways connect them through narrow end doors.
const CARS=[{id:'third',z0:47.5,z1:26.5,aisle:.5,name:'Third-class carriage'},{id:'dining',z0:25.1,z1:4.1,aisle:.5,name:'The dining car'},{id:'sleeper',z0:2.7,z1:-18.3,aisle:.46,name:'The sleeper car'},{id:'baggage',z0:-19.7,z1:-47.5,aisle:1.25,name:'The baggage car'}];
const W=1.4,VEST=1.3,SPEED=17,TILE=240,RAIL=-1.15;

export async function create(root,renderer,progress,{camera}={}){
 progress(.12,'Boarding the midnight express');
 const k=await kit(root,7707);const M=materials(k);const {box,cylinder,beam,mesh}=k;
 const sky=nightSky(root,{top:0x04060e,horizon:0x1e2a42,glow:0x50587a,moonDir:[-.78,.3,.2],moonSize:44,clouds:.3,cloudColor:0x141a2a,stars:2600});
 const teak=k.surface('cedar',0x8a5634,1,.42),teakDark=k.surface('cedar',0x4e2e1c,1,.5),cream=k.surface('plaster',0xe8dcbc,2,.85),floorMat=k.surface('cedar',0x3e2a1e,6,.62);
 const velvetG=new THREE.MeshStandardMaterial({color:0x2c4a3c,roughness:.95}),velvetR=new THREE.MeshStandardMaterial({color:0x5c1c20,roughness:.92,side:THREE.DoubleSide}),linen=new THREE.MeshStandardMaterial({color:0xece6d6,roughness:.8}),glass=new THREE.MeshStandardMaterial({color:0x9fb2c8,roughness:.05,metalness:.2,transparent:true,opacity:.1,depthWrite:false});
 const lampMat=new THREE.MeshStandardMaterial({color:0xfff2d6,emissive:0xffcf8a,emissiveIntensity:2.2,roughness:.4}),shadeMat=new THREE.MeshStandardMaterial({color:0xf0c890,emissive:0xff9a40,emissiveIntensity:1.1,roughness:.6,side:THREE.DoubleSide});
 const interior=new THREE.Group();interior.name='train-interior';root.add(interior);const I=interior;
 const glowList=[];const swaying=[];
 const noShadow=m=>{m.castShadow=false;return m;};

 // ── Car shell: floor, teak walls with window bays, arched ceiling with carlines, vestibules, end doors ──
 function shell(c,{pitch=1.15,winW=.9,ceiling=cream}={}){
  const len=c.z0-c.z1,zc=(c.z0+c.z1)/2;
  box(2.8,.1,len,0,-.05,zc,floorMat,I);box(.9,.012,len-.4,0,.006,zc,new THREE.MeshStandardMaterial({color:c.id==='dining'?0x6a2a24:0x3a4a3a,roughness:.9}),I);
  for(const s of [-1,1]){
   box(.1,.8,len,s*W,.4,zc,teak,I);box(.1,.85,len,s*W,2.175,zc,teak,I);box(.16,.05,len,s*(W-.04),.82,zc,teakDark,I);box(.14,.06,len,s*(W-.03),1.76,zc,teakDark,I);
   box(.06,.12,len,s*(W-.05),.06,zc,teakDark,I);
   // Window posts; vestibule ends are solid with an exterior door.
   const a=c.z1+VEST,b=c.z0-VEST;for(let z=a;z<=b+.01;z+=pitch){box(.12,.95,pitch-winW,s*W,1.275,z,teak,I);}
   for(const e of [c.z1+VEST/2,c.z0-VEST/2]){box(.1,.95,VEST,s*W,1.275,e,teakDark,I);box(.12,.5,.5,s*(W-.01),1.45,e,glass,I);box(.04,1.9,.04,s*(W-.06),1.0,e-.42,M.brass,I);}
   noShadow(box(.02,.95,b-a,s*(W+.03),1.275,(a+b)/2,glass,I));
   for(let z=c.z1+1;z<c.z0-.5;z+=2.3)box(.05,.06,.1,s*(W-.06),1.2,z,M.brass,I);
  }
  const ceil=mesh(new THREE.CylinderGeometry(2.2,2.2,len,28,1,true,-.68,1.36),ceiling,0,.89,zc,I);ceil.rotation.x=-Math.PI/2;ceil.material.side=THREE.DoubleSide;
  for(let z=c.z1+.4;z<c.z0;z+=1.15){const rib=mesh(new THREE.TorusGeometry(2.17,.03,4,14,1.36),teakDark,0,.89,z,I);rib.rotation.z=Math.PI/2-.68;}
  box(.5,.06,len-.6,0,3.06,zc,teakDark,I);
  // Saloon partitions at each vestibule, and car end walls with gangway doors.
  for(const [z,e] of [[c.z1+VEST,-1],[c.z0-VEST,1]]){for(const s of [-1,1])box(.9,2.7,.08,s*.95,1.35,z,teak,I);box(1.0,.62,.08,0,2.39,z,teak,I);box(.06,2.05,.9,-.5,1.03,z+e*.45,teakDark,I);box(.02,.5,.4,-.49,1.5,z+e*.45,glass,I);}
  for(const z of [c.z0,c.z1]){for(const s of [-1,1])box(1.0,2.8,.1,s*.9,1.4,z,teakDark,I);box(.8,.75,.1,0,2.42,z,teakDark,I);}
  return {len,zc};
 }
 // Ceiling lamp that sways with the train.
 function ceilingLamp(x,z,y=2.85,small=false){const pivot=new THREE.Group();pivot.position.set(x,3.0,z);root.add(pivot);const rod=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,3.0-y),M.brass);rod.position.y=-(3.0-y)/2;pivot.add(rod);
  const g=new THREE.Mesh(new THREE.SphereGeometry(small?.11:.16,16,10),lampMat);g.position.y=-(3.0-y)-.1;pivot.add(g);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.05,.14,.08,14),M.brass);cap.position.y=-(3.0-y)+.02;pivot.add(cap);swaying.push({pivot,phase:r()*6,amp:.035+r()*.02});glowList.push([x,y-.1,z]);return pivot;}

 progress(.28,'Walking the third-class carriage');
 // ── Car 1: third class — facing bench bays, luggage racks, abandoned hats and bento ──
 const c1=CARS[0];shell(c1);
 const hat=(x,y,z,kind)=>{const m=kind?new THREE.MeshStandardMaterial({color:0xcdb57a,roughness:.9}):new THREE.MeshStandardMaterial({color:0x1d1a18,roughness:.6});if(kind){cylinder(.15,.15,.09,x,y+.045,z,m,18,I);cylinder(.26,.26,.012,x,y+.006,z,m,22,I);box(.31,.025,.31,x,y+.03,z,new THREE.MeshStandardMaterial({color:0x2a2420}),I).scale.set(1,1,1);}else{mesh(new THREE.SphereGeometry(.14,16,8,0,Math.PI*2,0,Math.PI/2),m,x,y+.01,z,I).scale.y=.9;mesh(new THREE.TorusGeometry(.17,.03,6,18),m,x,y+.015,z,I).rotation.x=Math.PI/2;}};
 const bento=(x,y,z)=>{box(.22,.06,.16,x,y+.03,z,new THREE.MeshStandardMaterial({color:0x2a1414,roughness:.4}),I);box(.2,.015,.14,x+.03,y+.075,z+.02,new THREE.MeshStandardMaterial({color:0x8a1e18,roughness:.4}),I);for(const dx of [-.04,.04])box(.008,.008,.18,x+dx,y+.09,z-.06,M.white,I);};
 const bayStart=c1.z1+VEST+.85;let bay=0;
 for(let z=bayStart;z<c1.z0-VEST-.5;z+=1.72,bay++){for(const s of [-1,1]){
  for(const face of [-1,1]){const bz=z+face*.48;box(.9,.12,.5,s*.95,.45,bz,velvetG,I);box(.9,.4,.12,s*.95,.22,bz,teakDark,I);box(.9,.62,.1,s*.95,.82,bz+face*.24,velvetG,I);box(.94,.07,.12,s*.95,1.16,bz+face*.24,teak,I);}
  box(.12,.25,.06,s*.48,.62,z,teakDark,I);
  if((bay+(s>0?1:0))%2===0)hat(s*(.7+r()*.3),.51,z+(r()>.5?.45:-.45),r()>.5);if((bay*3+s)%4===0)bento(s*1.05,.51,z+(r()-.5)*.6);
  if((bay+s)%3===0){const n=box(.32,.01,.24,s*.85,.515,z+(r()-.5)*.7,new THREE.MeshStandardMaterial({color:0xdcd2b8,roughness:1}),I);n.rotation.y=r();}
 }}
 // Brass luggage racks with slats, and the luggage left behind on them.
 for(const s of [-1,1]){for(const y of [2.08,2.1])box(.02,.02,c1.z0-c1.z1-2*VEST,s*(W-.45),y,(c1.z0+c1.z1)/2,M.brass,I);for(let z=c1.z1+VEST+.2;z<c1.z0-VEST;z+=.2)box(.4,.012,.02,s*(W-.25),2.08,z,M.brass,I);for(let z=c1.z1+VEST+.4;z<c1.z0-VEST;z+=1.15)beam([s*(W-.05),2.3,z],[s*(W-.45),2.08,z],.012,M.brass,I);
  for(let i=0;i<9;i++){const z=c1.z1+VEST+.8+i*2.1+r()*.6,w=.3+r()*.35;box(.38,.18+r()*.14,w,s*(W-.27),2.2,z,[M.oxDark,teakDark,new THREE.MeshStandardMaterial({color:0x5a4a32,roughness:.8})][i%3],I);}}
 for(let z=c1.z1+3;z<c1.z0-1;z+=4.6)ceilingLamp(0,z);
 const sign1=signTexture([{text:'THIRD CLASS',size:90,weight:'bold'}],{bg:'#2a1a10',fg:'#e2c27a',border:'#b08a46',w:768,h:192});mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshStandardMaterial({map:sign1,roughness:.6}),0,2.42,c1.z1+VEST+.05,I);

 progress(.42,'Setting the dining car');
 // ── Car 2: dining car — linen tables, shaded lamps, a pantry counter ──
 const c2=CARS[1];shell(c2,{pitch:1.9,winW:1.5});
 for(let z=c2.z1+VEST+1.2,i=0;z<c2.z0-VEST-.9;z+=1.9,i++){for(const s of [-1,1]){
  box(.75,.04,.9,s*.97,.74,z,linen,I);box(.78,.2,.92,s*.97,.64,z,linen,I);cylinder(.05,.08,.72,s*1.0,.36,z,M.black,10,I);
  for(const f of [-1,1]){const cz=z+f*.62;box(.42,.06,.4,s*.97,.46,cz,velvetR,I);box(.42,.55,.06,s*.97,.78,cz+f*.2,teak,I);for(const dx of [-.17,.17])box(.04,.44,.04,s*.97+dx,.22,cz,teakDark,I);
   for(const dz of [-.2]){mesh(new THREE.CylinderGeometry(.11,.11,.012,18),M.white,s*.97,.765,z+f*.25,I);box(.015,.005,.17,s*.97+.15,.765,z+f*.25,M.steel,I);box(.015,.005,.17,s*.97-.15,.765,z+f*.25,M.steel,I);mesh(new THREE.CylinderGeometry(.03,.025,.11,10),glass,s*1.15,.82,z+f*.2,I);}}
  // Table lamp with a pleated shade against the window.
  cylinder(.05,.06,.03,s*1.22,.77,z,M.brass,12,I);cylinder(.012,.012,.3,s*1.22,.92,z,M.brass,8,I);mesh(new THREE.CylinderGeometry(.07,.13,.14,12,1,true),shadeMat,s*1.22,1.1,z,I);glowList.push([s*1.22,1.07,z]);
  mesh(new THREE.CylinderGeometry(.025,.035,.12,8),glass,s*.9,.82,z,I);mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshStandardMaterial({color:0xc83a4a,roughness:.8}),s*.9,.9,z,I);
 }}
 // The menu stand at the clue table.
 box(.16,.22,.02,.9,.88,12.4,new THREE.MeshStandardMaterial({map:signTexture([{text:'MENU',size:70,weight:'bold',y:50},{text:'Tomorrow',size:58,y:140},{text:'—',size:40,y:200}],{bg:'#efe4c8',fg:'#3a1a14',border:'#8a6a3a',w:256,h:256}),roughness:.8}),I);
 // Pantry counter, bottle shelves and a wall clock stopped at 11:59.
 for(const sx of [-1,1]){box(.85,1.0,.6,sx*.97,.5,c2.z0-VEST-.4,teakDark,I);box(.9,.05,.66,sx*.97,1.02,c2.z0-VEST-.4,M.brass,I);box(.85,.03,.25,sx*.97,1.6,c2.z0-VEST-.12,teak,I);box(.85,.03,.25,sx*.97,1.95,c2.z0-VEST-.12,teak,I);}
 for(let i=0;i<22;i++){const x=(i<11?-1.38:.56)+(i%11)*.075,y=i%2?1.62:1.97;cylinder(.03,.035,.22+r()*.08,x,y+.12,c2.z0-VEST-.12,new THREE.MeshStandardMaterial({color:[0x2a4a2a,0x5a2a14,0xa8a090,0x3a2a10][i%4],roughness:.15,metalness:.2,transparent:true,opacity:.85}),8,I);}
 for(let z=c2.z1+3;z<c2.z0-1;z+=3.8)ceilingLamp(0,z);
 const sign2=signTexture([{text:'DINING CAR',size:90,weight:'bold'}],{bg:'#2a1010',fg:'#e2c27a',border:'#b08a46',w:768,h:192});mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshStandardMaterial({map:sign2,roughness:.6}),0,2.42,c2.z1+VEST+.05,I);

 progress(.56,'Drawing the sleeper curtains');
 // ── Car 3: open-section sleeper — made-up berths behind heavy curtains, night lamps ──
 const c3=CARS[2];shell(c3,{pitch:1.9,winW:1.4,ceiling:k.surface('plaster',0xb8b0a0,2,.9)});
 const blanket=new THREE.MeshStandardMaterial({color:0x3a3a4a,roughness:1});
 const curtainGeo=(len,h)=>{const g=new THREE.PlaneGeometry(len,h,48,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*11)*.035+Math.sin(x*3.7)*.02);}g.computeVertexNormals();return g;};
 for(let z=c3.z1+VEST+1;z<c3.z0-VEST-.9;z+=1.9){for(const s of [-1,1]){
  box(.88,.45,1.8,s*.96,.225,z,teakDark,I);box(.84,.12,1.75,s*.96,.51,z,blanket,I);box(.5,.1,.3,s*.96,.62,z-.7,linen,I);
  box(.88,.06,1.8,s*.96,1.55,z,teakDark,I);box(.84,.1,1.75,s*.96,1.63,z,blanket,I);
  box(.88,1.0,.05,s*.96,1.1,z+.92,teak,I);box(.88,.9,.05,s*.96,2.05,z+.92,teak,I);
  // Curtains on a brass rail at the aisle edge, with a few left half-open.
  const open=((z*7)|0)%3===0||((z*5)|0)%4===1&&s<0;const c=mesh(curtainGeo(open?1.0:1.82,2.35),velvetR,s*.5,1.25,open?z-.42:z,I);c.rotation.y=Math.PI/2;
  if(open){mesh(new THREE.SphereGeometry(.06,10,8),lampMat,s*1.2,.95,z-.6,I);glowList.push([s*1.2,.95,z-.6]);}
  const num=signTexture([{text:String(Math.round((z-c3.z1)/1.9)*2+(s>0?1:2)),size:150,weight:'bold'}],{bg:'#d8c08a',fg:'#2a1a10',border:'#5a3a1a',w:256,h:256});mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshStandardMaterial({map:num}),s*.47,2.25,z,I).rotation.y=s>0?-Math.PI/2:Math.PI/2;
 }}
 for(const s of [-1,1])box(.02,.02,c3.z0-c3.z1-2*VEST,s*.5,2.43,(c3.z0+c3.z1)/2,M.brass,I);
 for(let z=c3.z1+3;z<c3.z0-1;z+=5)ceilingLamp(0,z,2.9,true);
 // Shoes waiting under the berths for a morning that never comes.
 for(let i=0;i<10;i++){const z=c3.z1+VEST+1+Math.floor(i/2)*3.8+(r()-.5),s=i%2?1:-1;for(const dx of [-.06,.06]){const sh=box(.09,.07,.24,s*.62+dx,.035,z,new THREE.MeshStandardMaterial({color:0x2a1c12,roughness:.5}),I);}}
 const sign3=signTexture([{text:'SLEEPER',size:90,weight:'bold'}],{bg:'#1a1420',fg:'#e2c27a',border:'#b08a46',w:768,h:192});mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshStandardMaterial({map:sign3,roughness:.6}),0,2.42,c3.z0-VEST-.05,I).rotation.y=Math.PI;

 progress(.66,'Opening the baggage car');
 // ── Car 4: baggage car — open sliding doors on both sides, the night rushing past ──
 const c4=CARS[3],l4=c4.z0-c4.z1,z4=(c4.z0+c4.z1)/2,DOOR=[-36.5,2.6];
 box(2.8,.1,l4,0,-.05,z4,k.surface('cedar',0x5a4634,8,.8),I);
 for(const s of [-1,1]){const d0=DOOR[0]-DOOR[1]/2,d1=DOOR[0]+DOOR[1]/2;
  box(.1,2.7,c4.z0-d1,s*W,1.35,(c4.z0+d1)/2,teakDark,I);box(.1,2.7,d0-c4.z1,s*W,1.35,(d0+c4.z1)/2,teakDark,I);box(.1,.5,DOOR[1],s*W,2.45,DOOR[0],teakDark,I);
  for(let z=c4.z1+.6;z<c4.z0;z+=.9)box(.04,2.6,.08,s*(W-.07),1.3,z,teak,I);
  // Slid-open door leaf riding on its rail, and a small barred window pair.
  box(.08,2.2,DOOR[1],s*(W+.12),1.15,d1+DOOR[1]/2+.05,M.oxDark,I);box(.05,.05,DOOR[1]*2.3,s*(W+.15),2.32,DOOR[0]+DOOR[1]*.6,M.steel,I);
  for(const z of [-24,-44]){box(.02,.5,.8,s*(W+.01),2.05,z,glass,I);for(let i=0;i<4;i++)box(.03,.5,.03,s*(W-.03),2.05,z-.3+i*.2,M.black,I);}
 }
 const ceil4=mesh(new THREE.CylinderGeometry(2.2,2.2,l4,24,1,true,-.68,1.36),teakDark,0,.89,z4,I);ceil4.rotation.x=-Math.PI/2;ceil4.material.side=THREE.DoubleSide;
 for(const z of [c4.z0,c4.z1]){for(const s of [-1,1])box(1.0,2.8,.1,s*.9,1.4,z,teakDark,I);box(.8,.75,.1,0,2.42,z,teakDark,I);}
 // Cargo stacked at both ends, clear of the 14 m battle floor in the middle.
 const trunk=(x,y,z,w,h,d,mat)=>{box(w,h,d,x,y+h/2,z,mat,I);box(w+.02,.04,d+.02,x,y+h*.7,z,M.brass,I);box(w+.02,.04,d+.02,x,y+h*.25,z,M.brass,I);};
 const sack=new THREE.MeshStandardMaterial({color:0x8a7a5a,roughness:1});
 for(let i=0;i<14;i++){const s=i%2?1:-1,z=c4.z0-1.5-Math.floor(i/2)*1.05,y=0;trunk(s*.85,0,z,.8,.5+r()*.3,.9,[M.oxDark,teakDark,velvetG][i%3]);if(i%3===0)trunk(s*.85,.75,z,.7,.4,.8,teak);}
 for(let i=0;i<8;i++){const s=i%2?1:-1;const m=mesh(new THREE.SphereGeometry(.38,10,8),sack,s*.85,.32,c4.z1+1.2+Math.floor(i/2)*.75,I);m.scale.set(1,.7,1.3);}
 for(const s of [-1,1])for(let i=0;i<5;i++){const z=-29.5-i*1.6;if(Math.abs(z-DOOR[0])<1.6)continue;box(.04,.04,.25,s*1.33,2.15,z,M.steel,I);const sk=mesh(new THREE.SphereGeometry(.22,10,8),sack,s*1.3,1.75,z,I);sk.scale.set(.45,1.4,.8);}
 {const rack=new THREE.Group();k.batch.add(rack);for(let i=0;i<=6;i++)box(.02,1.2,.3,-1.2+i*.4,1.7,c4.z0-.25,teak,I);for(let j=0;j<=4;j++)box(2.4,.02,.3,0,1.1+j*.3,c4.z0-.25,teak,I);for(let i=0;i<14;i++)box(.3,.18,.04,-1+(i%6)*.4,1.22+Math.floor(i/6)*.3,c4.z0-.18,new THREE.MeshStandardMaterial({color:[0xe8dcc0,0xc8b890,0xe0d0b0][i%3],roughness:1}),I);}
 mesh(new THREE.TorusGeometry(.32,.04,8,24),M.black,.7,1.3,c4.z1+.12,I);beam([.7,1.3,c4.z1+.12],[.7,.4,c4.z1+.12],.03,M.black,I);
 // The conductor's whistle on the floor (clue landmark) and a hanging storm lantern.
 cylinder(.018,.022,.12,.15,.02,-37,M.brass,10,I).rotation.z=Math.PI/2;
 const storm=ceilingLamp(0,-31,2.4);const storm2=ceilingLamp(0,-42,2.4);
 // Gangways: bellows, footplates and lamps between cars.
 for(let i=0;i<3;i++){const za=CARS[i].z1,zb=CARS[i+1].z0,zc=(za+zb)/2,len=za-zb;box(1.1,.08,len,0,-.04,zc,M.steel,I);for(let j=0;j<6;j++){const z=zb+(j+.5)*len/6;for(const s of [-1,1])box(.08,2.3,.12,s*.62,1.15,z,M.black,I);box(1.3,.08,.12,0,2.3,z,M.black,I);}noShadow(box(1.2,2.3,len,0,1.15,zc,new THREE.MeshStandardMaterial({color:0x1a1612,roughness:1,side:THREE.BackSide}),I));}
 // Front door of the baggage car toward the tender; the exit.
 box(.75,1.9,.05,0,.95,c4.z1-.03,new THREE.MeshStandardMaterial({color:0x0a0806,emissive:0x3a2210,emissiveIntensity:.6}),I);
 box(.75,1.9,.05,0,.95,c1.z0+.03,new THREE.MeshStandardMaterial({color:0x0a0806,emissive:0x2a1a10,emissiveIntensity:.4}),I);

 // Bake the interior into a single rolling body. Glass never blocks the moonlight.
 interior.traverse(o=>{if(o.isMesh&&(o.material===glass||o.material.side===THREE.BackSide))o.castShadow=false;});
 const body=bakeStatic(interior);interior.removeFromParent();root.add(body);

 progress(.76,'Painting the moonlit country');
 // ── The scrolling world: one tile of countryside, cloned four times and wrapped ──
 const tileSrc=new THREE.Group();const T=tileSrc;
 const paddy=new THREE.MeshStandardMaterial({color:0x04070c,emissive:0x0a1426,emissiveIntensity:.5,roughness:.42,metalness:0}),bund=k.surface('moss',0x1c2216,4,1),slope=k.surface('moss',0x2f3a2a,8,1),ballast=k.surface('rock',0x4a4844,20,.95);
 box(900,.1,TILE,0,-3.55,0,paddy,T);
 for(const s of [-1,1])for(let z=-TILE/2;z<TILE/2;z+=12+r()*12){const w=40+r()*120;for(let x=12;x<420;x+=w+r()*6){box(w,.22,.5,s*(x+w/2),-3.42,z,bund,T);}}
 for(const x of [-64,-41,-27,24,37,88,-103,128,-152,170,-200])box(.55,.22,TILE,x+(r()-.5)*4,-3.42,0,bund,T);
 // Rice stubble rows catch the moonlight in the nearest paddies.
 {const g=new THREE.ConeGeometry(.08,.35,4),n=2600,inst=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0x5a5a40,roughness:1}),n),m=new THREE.Matrix4();for(let i=0;i<n;i++){const s=r()<.5?-1:1;m.makeTranslation(s*(12+r()*30),-3.32,-TILE/2+r()*TILE);inst.setMatrixAt(i,m);}T.add(inst);}
 // Low mist banks drift across the fields.
 {const tex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(200,210,230,.55)');gr.addColorStop(1,'rgba(200,210,230,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();const mm=new THREE.MeshBasicMaterial({map:tex,color:0x8090a8,transparent:true,opacity:.22,depthWrite:false,fog:true});for(let i=0;i<26;i++){const s=r()<.5?-1:1,pl=mesh(new THREE.PlaneGeometry(30+r()*40,4+r()*3),mm,s*(16+r()*90),-2.2+r()*.8,-TILE/2+r()*TILE,T);pl.rotation.y=Math.PI/2+(r()-.5)*.6;}}
 for(const s of [-1,1]){const sl=box(7.2,.12,TILE,s*7.6,-2.55,0,slope,T);sl.rotation.z=-s*.3;}
 box(9,.4,TILE,0,-1.75,0,ballast,T);
 // The adjacent line: sleepers that blur past at arm's length.
 {const g=new THREE.BoxGeometry(2.1,.14,.24),n=Math.floor(TILE/.62),inst=new THREE.InstancedMesh(g,k.surface('cedar',0x2e2620,1,.95),n),m=new THREE.Matrix4();for(let i=0;i<n;i++){m.makeTranslation(-4.4,RAIL-.24,-TILE/2+.3+i*.62);inst.setMatrixAt(i,m);}T.add(inst);for(const s of [-1,1])box(.07,.15,TILE,-4.4+s*.535,RAIL-.075,0,M.rail,T);}
 // Telegraph poles every 40 m with wires (lines are kept outside the bake).
 const wire=[];const poleG=new THREE.Group();poleG.position.y=-1.8;T.add(poleG);for(let z=-TILE/2;z<TILE/2;z+=40){telegraphPole(k,M,3.4,z,7.5,poleG,k.surface('cedar',0x3a2e22,1,.95));for(const dx of [-.75,-.3,.3,.75])for(let j=0;j<8;j++){const a=j/8,b=(j+1)/8,sag=t=>-1.2*4*t*(1-t);const y=dx*dx>.2?5.4:4.7;wire.push(3.4+dx,y+sag(a),z+a*40,3.4+dx,y+sag(b),z+b*40);}}
 // Cedar windbreaks, bamboo stands and farmhouses with lamp-lit windows.
 const needle=new THREE.MeshStandardMaterial({color:0x1a2a22,roughness:1,flatShading:true}),trunkM=k.surface('cedar',0x3a2c20,1,1),thatch=new THREE.MeshStandardMaterial({color:0x4a3c2a,roughness:1,flatShading:true});
 const tree=(x,z,h)=>{cylinder(.2,.3,h*.4,x,-3.4+h*.2,z,trunkM,6,T);for(let i=0;i<4;i++){const c=mesh(new THREE.ConeGeometry(h*.22*(1-i*.17),h*.42,7),needle,x,-3.4+h*(.35+i*.17),z,T);c.rotation.y=r()*3;}};
 for(let i=0;i<60;i++){const s=r()<.5?-1:1,x=s*(14+Math.pow(r(),1.5)*140),z=-TILE/2+r()*TILE;if(Math.abs(x)>40&&Math.abs(x)<78&&s>0)continue;tree(x,z,7+r()*11);}
 for(let row=0;row<3;row++)for(let i=0;i<12;i++)tree(-26-row*5,-110+i*7+row*3,10+r()*6);
 const lit=[];const farmhouse=(x,z,a)=>{const g=new THREE.Group();g.position.set(x,-3.4,z);g.rotation.y=a;T.add(g);box(8,2.8,5.5,0,1.4,0,k.surface('plaster',0x6a6250,2,1),g);const ro=mesh(new THREE.ConeGeometry(5.6,4.2,4),thatch,0,4.7,0,g);ro.rotation.y=Math.PI/4;ro.scale.set(1.25,1,.85);box(1.6,1,.06,-1.6,1.4,2.78,M.window,g);box(1.0,.9,.06,2,1.4,2.78,M.windowDim,g);for(const xx of [-4,4])box(.2,2.8,.2,xx,1.4,2.75,trunkM,g);const v=new THREE.Vector3(-1.6,1.4,3.3).applyAxisAngle(new THREE.Vector3(0,1,0),a);lit.push([x+v.x,-3.4+v.y,z+v.z]);};
 farmhouse(-46,-60,.4);farmhouse(-88,30,-.2);farmhouse(-34,90,2.8);farmhouse(96,-20,1.5);farmhouse(120,70,3.6);farmhouse(-140,-100,.9);
 for(let i=0;i<6;i++){const cx=-13-r()*8,cz=-TILE/2+20+i*38+r()*10;for(let j=0;j<14;j++){const x=cx+(r()-.5)*4,z=cz+(r()-.5)*5,h=6+r()*5;cylinder(.05,.06,h,x,-3.4+h/2,z,new THREE.MeshStandardMaterial({color:0x3a4a2c,roughness:.8}),6,T);for(let y=h*.5;y<h;y+=.6){const l=mesh(new THREE.PlaneGeometry(1.4,.25),new THREE.MeshStandardMaterial({color:0x2a3a22,side:THREE.DoubleSide,roughness:1}),x+(r()-.5)*.6,-3.4+y,z+(r()-.5)*.6,T);l.rotation.set(r(),r()*3,r());}}}
 // A level-crossing hut and a wayside halt flash past close to the windows.
 {const g=new THREE.Group();g.position.set(7,-1.6,60);T.add(g);box(2.2,2.3,2,0,1.15,0,k.surface('cedar',0x4a3a2a,1,.9),g);box(2.6,.15,2.4,0,2.4,0,M.roofCanvas,g);box(.8,.6,.05,-.3,1.4,-1.03,M.window,g);cylinder(.06,.06,3.4,-2,1.7,-1.2,M.black,8,g);box(.36,.36,.2,-2,3.4,-1.2,M.black,g);mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshStandardMaterial({color:0xff4020,emissive:0xff3010,emissiveIntensity:3}),-2,3.4,-1.32,g);box(.1,.1,6,-2.1,1.2,-4.2,new THREE.MeshStandardMaterial({color:0xe8e0d0}),g);lit.push([7-.3,-1.6+1.4,60-1.1],[7-2,-1.6+3.4,60-1.4]);}
 {const g=new THREE.Group();g.position.set(4.2,-1.2,-70);T.add(g);box(4,1.0,40,0,-.5,0,k.surface('stone',0x6a6a64,6,.8),g);box(.3,.08,40,-1.95,.04,0,M.white,g);box(3,2.6,6,1,1.3,4,k.surface('cedar',0x3e3024,2,.9),g);box(3.6,.14,7,1,2.7,4,M.roofCanvas,g);box(.06,1,1.8,-.52,1.3,4,M.windowDim,g);for(const z of [-12,-2,10]){cylinder(.05,.06,2.8,-1.2,1.4,z,M.black,8,g);box(.25,.35,.25,-1.2,2.9,z,M.lampGlass,g);lit.push([4.2-1.2,-1.2+2.9,-70+z]);}const ns=signTexture([{text:'KAWAGIRI',size:120,weight:'bold'}],{bg:'#efe6d0',fg:'#1d1b18',border:'#1d1b18'});const sg=mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshStandardMaterial({map:ns,roughness:.7}),-1.3,2,-6,g);sg.rotation.y=-Math.PI/2;}
 // Reeds on the near river bank.
 for(let i=0;i<220;i++){const x=40+r()*6,z=-TILE/2+r()*TILE,h=1+r()*1.4;const b=mesh(new THREE.PlaneGeometry(.05,h),new THREE.MeshStandardMaterial({color:0x4a5238,side:THREE.DoubleSide,roughness:1}),x,-3.9+h/2,z,T);b.rotation.set((r()-.5)*.4,r()*3,(r()-.5)*.4);}
 const tileBaked=bakeStatic(T);tileBaked.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 const wireGeo=new THREE.BufferGeometry();wireGeo.setAttribute('position',new THREE.Float32BufferAttribute(wire,3));const wireLines=new THREE.LineSegments(wireGeo,new THREE.LineBasicMaterial({color:0x2a2e38}));tileBaked.add(wireLines);
 const tileGlow=glows(tileBaked,lit,{size:3.2});
 const tiles=[];for(let i=-2;i<=1;i++){const t=i===-2?tileBaked:tileBaked.clone();root.add(t);t.userData.i=i;tiles.push(t);}
 // A long river with a moving moon-glint, static across all tiles; the ripples scroll with the train.
 const river=new THREE.Mesh(new THREE.PlaneGeometry(34,1200,1,1),new THREE.ShaderMaterial({transparent:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},moonZ:{value:.2}}]),
  vertexShader:'#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'#include <fog_pars_fragment>\nuniform float time;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){vec2 p=vec2(vW.x*.6,(vW.z-time*17.)*.25);float rip=n(p*3.)*.6+n(p*7.+time*.2)*.4;float streak=exp(-pow((vW.z-6.)*.03,2.))*smoothstep(.55,.9,rip);vec3 c=vec3(.03,.05,.09)+vec3(.55,.6,.72)*streak*.9+vec3(.08,.1,.16)*rip*.3;gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}'}));
 river.rotation.x=-Math.PI/2;river.position.set(60,-3.9,0);root.add(river);
 // Static far mountains — almost no parallax at this distance.
 const mts=new THREE.MeshStandardMaterial({color:0x111a28,roughness:1,flatShading:true});for(const s of [-1,1])for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(70+r()*90,60+r()*120,5),mts);m.position.set(s*(260+r()*160),-4,-700+i*110+r()*40);m.scale.z=1.8;root.add(m);}

 // ── Lights: seven warm interior lamps; the moon pours through the left-hand windows ──
 const L=[[0,2.4,42],[0,2.4,32],[0,2.4,20],[0,2.4,9],[0,2.3,-8,0xd8b088,9],[0,2.2,-31],[0,2.2,-42]];const pls=[];
 for(const [x,y,z,c,i] of L){const l=new THREE.PointLight(c||0xffc27a,i||11,9,1.5);l.position.set(x,y,z);root.add(l);pls.push(l);}
 const halo=glows(root,glowList,{size:1.1});
 // Dust in the lamplight, and grit swirling in through the open baggage doors.
 const dust=(()=>{const n=500,p=new Float32Array(n*3),b=[];for(let i=0;i<n;i++)b.push([r()*2.6-1.3,.2+r()*2.6,r()*94-47,r()]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:0xffe2b0,size:.012,transparent:true,opacity:.5,depthWrite:false}));pts.frustumCulled=false;root.add(pts);return t=>{b.forEach(([x,y,z,s],i)=>{const inBag=z<-30&&z>-43;const v=inBag?6:.08;p[i*3]=inBag?((x+t*v*s*.3)%2.8+2.8)%2.8-1.4:x+Math.sin(t*.4+i)*.1;p[i*3+1]=y+Math.sin(t*.6+i*1.3)*.08;p[i*3+2]=inBag?-43+(((z+43)+t*v)%13+13)%13:z+Math.sin(t*.3+i)*.2;});g.attributes.position.needsUpdate=true;};})();
 k.finish();progress(.95,'Every clock aboard reads 11:59');

 const carAt=z=>CARS.find(c=>z<=c.z0&&z>=c.z1);
 function canWalk(x,z){
  const c=carAt(z);
  if(!c){// gangways
   for(let i=0;i<3;i++)if(z<CARS[i].z1&&z>CARS[i+1].z0)return Math.abs(x)<.4;return false;}
  if(z>c.z0-.06||z<c.z1+.06)return Math.abs(x)<.38;
  if(c.id==='baggage'){if(Math.abs(x)>1.25)return false;if(z>c.z0-8.6)return Math.abs(x)<.35;if(z<c.z1+4.3)return Math.abs(x)<.35;return true;}
  if(Math.abs(z-(c.z0-VEST))<.06||Math.abs(z-(c.z1+VEST))<.06)return Math.abs(x)<.4;
  if(z>c.z0-VEST||z<c.z1+VEST)return Math.abs(x)<1.2;
  return Math.abs(x)<c.aisle;
 }
 // The pantry counter blocks the dining car's forward vestibule; walk round through the aisle gap.
 const off=[0,0];
 return {texturesLoaded:14,grassBlades:0,discoveries:clues['express-carriages'],
  views:{third:{pos:[.2,1.62,44.4],look:[0,1.5,28],name:'Third-class carriage',sub:'Hats, bento and folded papers. Every seat is still warm.'},
   window:{pos:[.35,1.5,35],look:[-6,.6,30],name:'The window seat',sub:'Each window shows a different field.'},
   dining:{pos:[.2,1.6,22],look:[0,1.2,6],name:'The dining car',sub:'Tables laid for a meal served at midnight.'},
   sleeper:{pos:[0,1.6,.6],look:[0,1.4,-16],name:'The sleeper car',sub:'Curtains drawn. Shoes waiting for morning.'},
   baggage:{pos:[.3,1.65,-24.5],look:[-.3,1.4,-44],name:'The baggage car',sub:'Doors open on the rushing dark.'}},
  canWalk,walkHeight:()=>0,
  locationAt(x,z){const c=carAt(z);return c?c.name:'Between carriages';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam||camera);
   const o=(t*SPEED)%TILE;for(const tl of tiles)tl.position.z=o+tl.userData.i*TILE;
   river.material.uniforms.time.value=t;tileGlow.material.opacity=.85;
   // Rail joints: a soft roll and a small bump every 25 m of travel.
   const joint=Math.pow(Math.max(0,Math.sin((t*SPEED/25)*Math.PI*2)),18);body.rotation.z=Math.sin(t*1.3)*.0035+Math.sin(t*2.9)*.0012;body.position.y=-joint*.012;
   for(const s of swaying){s.pivot.rotation.z=Math.sin(t*1.3+s.phase)*s.amp+joint*.02;s.pivot.rotation.x=Math.sin(t*.9+s.phase*2)*s.amp*.4;}
   for(let i=0;i<pls.length;i++)pls[i].intensity=(L[i][4]||11)*(1-joint*.12+Math.sin(t*9+i)*.015);
   dust(t);halo.material.opacity=.7+Math.sin(t*6.1)*.04;},
  setEvening(){}};
}
