import * as THREE from 'three';
import { kit } from './kit.js';
import { bakeStatic } from '../assetlib.js';
import { realmClues } from './story.js';
export async function createCastle(root,renderer,progress){
 progress(.12,'Finding the Court between the bells');const k=await kit(root,1801);const {box,mesh,beam,cylinder,wood,dark,bronze,paper}=k;
 const lacquer=k.surface('cedar',0x743c32,1,.57),floorMat=k.surface('cedar',0xb29a75,8,.72),moving=[];
 // A stable, walkable cross through a vast moving architectural mechanism.
 function platform(x,y,z,w,d){box(w,1.3,d,x,y-.65,z,dark);box(w,.1,d,x,y+.01,z,floorMat);for(let i=-w/2;i<w/2;i+=.5)box(.028,.02,d,x+i,y+.07,z,dark);for(const side of [-1,1]){box(w,.12,.16,x,y+.1,z+side*(d/2-.1),bronze);box(.16,.12,d,x+side*(w/2-.1),y+.1,z,bronze);}}
 platform(0,0,0,28,28);platform(-30,0,0,15,18);platform(30,0,0,15,18);platform(0,0,29,16,14);platform(0,0,-30,18,16);platform(0,6,-72,30,26);
 for(let i=0;i<22;i++){const x=-23+i*2.2;if(Math.abs(x)<14)continue;box(2.15,.3,6,x,-.1,0,wood);}for(const z of [15,18,21,-15,-18,-21])box(6,.3,3.1,0,-.1,z,wood);
 for(const x of [-30,30])for(const side of [-1,1])k.rail([x-7.4,side*8.8],[x+7.4,side*8.8],1.1);
 for(const side of [-1,1]){k.rail([side*13.7,-13.7],[side*13.7,-3.5],1.1);k.rail([side*13.7,3.5],[side*13.7,13.7],1.1);k.rail([-13.7,side*13.7],[-3.5,side*13.7],1.1);k.rail([3.5,side*13.7],[13.7,side*13.7],1.1);k.rail([side*3,15],[side*3,22],1.1);k.rail([side*3,-15],[side*3,-22],1.1);}
 // Physical stairs ascend six metres toward the heart, with paired handrails.
 for(let i=0;i<40;i++)box(7,.18,.56,0,(i+1)*.15-.09,-38-i*.55,wood);
 for(const s of [-1,1]){for(let i=0;i<10;i++){beam([s*3.3,i*.6,-38-i*2.2],[s*3.3,1+i*.6,-38-i*2.2],.06,lacquer);beam([s*3.3,1+i*.6,-38-i*2.2],[s*3.3,1+(i+1)*.6,-40.2-i*2.2],.06,lacquer);}k.rail([s*14.7,-84.7],[s*14.7,-59.3],7.1);}
 box(7,.3,2,0,5.9,-60,wood);
 // Brass inlays define the arena, leaving the centre clear for future combat.
 for(const radius of [9,11.5]){const ring=mesh(new THREE.TorusGeometry(radius,.035,6,100),bronze,0,.1,0);ring.rotation.x=Math.PI/2;}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam([Math.cos(a)*9,.11,Math.sin(a)*9],[Math.cos(a)*12,.11,Math.sin(a)*12],.025,bronze);}
 // Distinctive inverted roof lanterns and four great pillars frame the central ring.
 for(const x of [-11,11])for(const z of [-11,11]){box(.65,10,.65,x,5,z,lacquer);box(1.1,.25,1.1,x,.125,z,bronze);box(1.2,.25,1.2,x,8,z,bronze);k.lantern(x,7.3,z,1.5);beam([x,8,z],[x*.8,10,z*.8],.15,wood);}
 k.sign(0,3.4,33,'THE FOLDED COURT');
 progress(.45,'Suspending the turning halls');
 // Decorative orbital architecture moves around stable collision routes.
 // The radial observatory and counterweight mechanism distinguish this layout from its references.
 for(let tier=0;tier<4;tier++){
  const ring=new THREE.Group(),radius=48+tier*11,height=-24+tier*19;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2+tier*.17,x=Math.cos(a)*radius,z=Math.sin(a)*radius-22;
   const hall=new THREE.Group();hall.position.set(x,height,z);hall.rotation.y=-a+Math.PI/2;ring.add(hall);
   box(17,.6,11,0,0,0,dark,hall);box(17,.1,11,0,.35,0,floorMat,hall);
   for(const side of [-1,1]){for(let j=-8;j<=8;j+=2){box(.18,7,.18,j,3.8,side*4.7,lacquer,hall);box(1.7,4.8,.08,j,3.5,side*4.6,k.glow,hall);for(let y=1.4;y<6;y+=.8)box(1.8,.04,.15,j,y,side*4.5,dark,hall);}box(17,.22,.4,0,7.1,side*4.7,wood,hall);}
   k.roof(0,7.2,0,19,13,hall);k.rail([-8,-5.3],[8,-5.3],1.4,hall);
   // Diagonal trusswork beneath each hall emphasizes mass and depth.
   for(const side of [-1,1])beam([side*7,0,4],[0,-5,0],.16,dark,hall);
   if(i%3===0){for(let j=0;j<16;j++)box(4,.18,.65,8.5+j*.4,j*.35,-3,wood,hall);}
  }
  // Walkways form complete orbital galleries instead of isolated floating boxes.
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2+tier*.17,b=(i+1)/12*Math.PI*2+tier*.17;const A=new THREE.Vector3(Math.cos(a)*radius,height-.1,Math.sin(a)*radius-22),B=new THREE.Vector3(Math.cos(b)*radius,height-.1,Math.sin(b)*radius-22);const center=A.clone().add(B).multiplyScalar(.5),len=A.distanceTo(B),walk=box(3.8,.32,len,center.x,center.y,center.z,wood,ring);walk.rotation.y=Math.atan2(B.x-A.x,B.z-A.z);const tangent=B.clone().sub(A).normalize(),side=new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar(1.7);for(const sign of [-1,1]){const p=A.clone().addScaledVector(side,sign),q=B.clone().addScaledVector(side,sign);beam([p.x,height+1,p.z],[q.x,height+1,q.z],.06,bronze,ring);for(let j=0;j<=8;j++){const v=p.clone().lerp(q,j/8);beam([v.x,height,v.z],[v.x,height+1,v.z],.045,lacquer,ring);}}}
  const merged=bakeStatic(ring);root.add(merged);moving.push({group:merged,speed:(tier%2?1:-1)*(.006+tier*.001),phase:tier*.15});
 }
 // More distant architectural fragments fade into the void, with no floor beneath them.
 for(let i=0;i<18;i++){const a=i*2.4,r=100+i*2,x=Math.cos(a)*r,z=Math.sin(a)*r-30;box(14,.6,10,x,-45+(i%5)*24,z,dark);for(let j=0;j<4;j++){box(2,4,.2,x-5+j*3,-42+(i%5)*24,z+4,k.glow);}}
 // A suspended brass astrolabe is the story's final mechanism.
 const heart=new THREE.Group();heart.position.set(0,17,-72);root.add(heart);
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(4+i*.8,.095,12,90),bronze);ring.rotation.set(i*.6,i*.9,0);heart.add(ring);moving.push({group:ring,speed:.04+i*.015,phase:i*.4,heart:true});}
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,3),new THREE.MeshStandardMaterial({color:0x99d7d1,emissive:0x4fb9bb,emissiveIntensity:1.8,metalness:.4,roughness:.2}));heart.add(core);
 for(const x of [-12,12]){beam([x,6,-72],[x,26,-72],.18,lacquer);beam([x,26,-72],[0,27,-72],.12,bronze);beam([x,26,-72],[0,17,-72],.035,bronze);}
 for(const[x,y,z]of [[0,7,0],[-30,4,0],[30,4,0],[0,13,-72]]){const l=new THREE.PointLight(z<-50?0x79d3d6:0xffaa63,z<-50?180:160,32,2);l.position.set(x,y,z);root.add(l);}
 for(const x of [-30,30]){box(2,.8,1,x,.4,0,wood);box(.7,.03,.5,x,.84,0,paper);k.lantern(x,3,-2,.9);}box(2,.8,1,0,6.4,-72,wood);box(.7,.05,.5,0,6.84,-72,paper);k.lantern(1.6,7.2,-72,.7);
 k.sign(0,8,-80,'THE WAY HOME');
 const motes=k.particles(450,0xd9b98d,.045,[160,90,180]);k.finish();progress(.96,'Aligning the Meridian Ring');
 const inRect=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<w/2&&Math.abs(z-cz)<d/2;
 return {trunks:[],texturesLoaded:12,grassBlades:0,discoveries:realmClues.folded,views:{arrival:{pos:[0,3.5,29],look:[0,9,-40],name:'The suspended threshold',sub:'The halls move. Your path holds.'},arena:{pos:[10,3,11],look:[-3,5,-20],name:'The Meridian Ring',sub:'An open arena between turning counterweights.'},heart:{pos:[0,8,-61],look:[0,17,-72],name:'The heart of the Court',sub:'The fourth weight belongs here.'}},canWalk(x,z){return inRect(x,z,0,0,27,27)||inRect(x,z,-30,0,14,17)||inRect(x,z,30,0,14,17)||inRect(x,z,0,29,15,13)||inRect(x,z,0,-30,17,16)||inRect(x,z,0,-72,29,25)||inRect(x,z,0,0,59,5.5)||inRect(x,z,0,0,5.5,59)||inRect(x,z,0,-48,6.3,26);},walkHeight(x,z){if(z<=-60)return 6;if(z<-38)return Math.min(6,(-z-38)/22*6);return 0;},update(t){k.windTime.value=t;motes(t);for(const m of moving){if(m.heart){m.group.rotation.y=t*m.speed+m.phase;m.group.rotation.z=Math.sin(t*.1+m.phase)*.3;}else m.group.rotation.y=Math.sin(t*m.speed+m.phase)*.045;}},setEvening(){}};
}
