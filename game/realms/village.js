import * as THREE from 'three';
import { kit } from './kit.js';
import { realmClues } from './story.js';
import { Water } from 'three/addons/objects/Water.js';
export async function createVillage(root,renderer,progress){
 progress(.1,'Entering the rain at Reedwater');const k=await kit(root,923);const {random:r,box,mesh,cylinder,beam,wood,dark,stone,bronze}=k;
 const paving=k.surface('stone',0x7c8885,18,.55);k.floor(140,52,0,23,-.04,paving);k.floor(140,60,0,-43,-.04,paving);
 // Sluice walls support the canal rather than leaving water as an unbounded plane.
 for(const z of [-13,-3]){box(160,2,.8,0,-.8,z,k.surface('rock',0x59685e,16,.7));for(let x=-76;x<77;x+=2)box(1.94,.16,1.1,x,.08,z,stone);}
 const water=new Water(new THREE.PlaneGeometry(180,10),{textureWidth:512,textureHeight:512,waterNormals:k.maps.rock[1],waterColor:0x183e40,sunColor:0xb8d2df,distortionScale:.5,fog:true});water.rotation.x=-Math.PI/2;water.position.set(0,-.35,-8);water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.025;').replace('vec3( 1.5, 1.0, 1.5 )','vec3( .3, 1., .3 )');root.add(water);
 // Two narrow bridges lead to the northern workshop quarter.
 for(const x of [0,26]){for(let i=0;i<40;i++){const z=-15+i*.35,y=Math.max(0,1.15*Math.sin((z+15)/14*Math.PI));box(6.8,.16,.34,x,y-.08,z,wood);for(const side of [-1,1])if(i%4===0){cylinder(.055,.07,1.05,x+side*3.25,y+.5,z,dark,8);k.lantern(x+side*3.25,y+1.25,z,.45);}}
 for(const side of [-1,1]){const pts=[];for(let j=0;j<=20;j++){const z=-15+j*.7;pts.push(new THREE.Vector3(x+side*3.25,1+Math.max(0,1.15*Math.sin(j/20*Math.PI)),z));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.07,6,false),dark);}}
 progress(.4,'Raising the canal town');
 for(const x of [-30,-19,-8,8,19,30])k.house(x,-32,9.3,9,0,{lit:true,open:Math.abs(x)===8,height:4.3+(Math.abs(x)===19?2:0)});
 for(const side of [-1,1])for(const z of [5,18,31])k.house(side*27,z,10,8,side>0?-Math.PI/2:Math.PI/2,{lit:true,height:z===18?6:4.5});
 // Distant roof layers imply a larger town beyond the accessible quarter.
 for(const side of [-1,1])for(let i=0;i<6;i++)k.house(side*(46+r()*15),-35+i*14,8+r()*5,9,side>0?-Math.PI/2:Math.PI/2,{lit:true,height:4+r()*5});
 for(let x=-36;x<37;x+=6){beam([x,0,-1],[x,3,-1],.06,dark);k.lantern(x,2.7,-1,.8);k.lantern(x,2.7,-15,.8);}
 for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffbd70,30,12,2);l.position.set([-20,20,-20,20][i],3,[18,18,-24,-24][i]);root.add(l);}
 // Broad ferry yard: props remain outside the 22 x 18 m future battle footprint.
 for(let x=-11;x<=11;x+=1.4)for(const z of [5,24])box(1.3,.045,.5,x,.04,z,bronze);
 for(const side of [-1,1])for(let z=6;z<24;z+=1.4)box(.5,.045,1.3,side*11,.04,z,bronze);
 k.sign(0,3.4,36,'REEDWATER CROSSING');beam([-5,0,36],[-5,4,36],.15,dark);beam([5,0,36],[5,4,36],.15,dark);beam([-5,3.9,36],[5,3.9,36],.13,wood);
 function barrel(x,z){cylinder(.44,.37,.95,x,.48,z,wood,18);for(const y of [.15,.48,.8]){const hoop=mesh(new THREE.TorusGeometry(.43,.025,6,20),bronze,x,y,z);hoop.rotation.x=Math.PI/2;}for(let a=0;a<12;a++){const t=a/12*6.28;beam([x+Math.cos(t)*.435,.1,z+Math.sin(t)*.435],[x+Math.cos(t)*.435,.85,z+Math.sin(t)*.435],.01,dark);}}
 for(let i=0;i<22;i++){const side=i%2?-1:1;barrel(side*(15+r()*4),2+r()*34);}
 // Canvas awnings and merchant counters form sheltered side lanes.
 const awningMat=new THREE.MeshStandardMaterial({color:0x536f79,side:THREE.DoubleSide,roughness:1});for(const side of [-1,1])for(const z of [9,24]){box(4,.18,1.5,side*20,.85,z,dark);for(const x of [side*18,side*22])beam([x,0,z],[x,3.4,z],.06,wood);const awning=mesh(new THREE.PlaneGeometry(5,3,8,6),awningMat,side*20,3.1,z);awning.rotation.x=-1.3;const p=awning.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*2.8)*.035);awning.geometry.computeVertexNormals();for(let j=0;j<5;j++)cylinder(.18,.16,.25,side*20-1+j*.5,1.06,z,k.paper,12);}
 // Low canal boats, planks and curved gunwales.
 for(const[x,z]of [[-16,-7],[15,-9]]){const shape=new THREE.Shape();shape.moveTo(-1.2,-3);shape.quadraticCurveTo(-1.7,0,-1,3);shape.quadraticCurveTo(0,4,1,3);shape.quadraticCurveTo(1.7,0,1.2,-3);shape.quadraticCurveTo(0,-4,-1.2,-3);const hull=mesh(new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:2}),dark,x,-.3,z);hull.rotation.x=-Math.PI/2;for(let j=0;j<9;j++)box(1.9,.08,.3,x,.24,z-2.5+j*.6,wood);beam([x-1,.3,z-1],[x+1,.3,z+2],.045,wood);}
 // Bell-founder workspace: the lost shipment is physically present.
 for(let i=0;i<4;i++){const bell=mesh(new THREE.LatheGeometry([new THREE.Vector2(.36,0),new THREE.Vector2(.45,.1),new THREE.Vector2(.37,.8),new THREE.Vector2(.12,1.0)],20),bronze,-11+i*.8,.2,-25);bell.rotation.z=(i%2)*.15;}
 box(2,.13,.8,-10,.8,-27,wood);box(.5,.025,.35,-10,.89,-27,k.paper);cylinder(.16,.18,.15,10,.5,18,bronze,18);box(.65,.45,.65,10,.23,18,dark);box(1,.7,.8,0,.35,-35,dark);cylinder(.17,.17,.2,0,.8,-35,bronze,12);
 k.sign(0,2.5,-37,'THE FOLDED COURT');
 // Rain streaks and concentric ripple rings animate in world space.
 const count=900,rainPos=new Float32Array(count*6),rainSeeds=Array.from({length:count},()=>[r(),r(),r()]);const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rainPos,3));const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xaac6d0,transparent:true,opacity:.20,depthWrite:false}));rain.frustumCulled=false;root.add(rain);
 const ripples=[];for(let i=0;i<36;i++){const m=mesh(new THREE.RingGeometry(.15,.165,24),new THREE.MeshBasicMaterial({color:0xa7bcc4,transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}),(r()-.5)*65,.045,r()*37,root);m.rotation.x=-Math.PI/2;ripples.push(m);}
 k.finish();progress(.95,'Lighting the ferry yard');
 return {trunks:[],texturesLoaded:12,grassBlades:0,discoveries:realmClues.reedwater,views:{arrival:{pos:[0,2,31],look:[0,4,-22],name:'The ferry yard',sub:'A broad fighting ground between the merchant lanes.'},canal:{pos:[-12,2.1,-.5],look:[9,2,-16],name:'Lanterns on the canal',sub:'The last boat never returned.'},workshop:{pos:[-6,2,-20],look:[-10,2,-30],name:'The founder’s workshop',sub:'A cargo of bells, and one missing weight.'}},canWalk(x,z){if(Math.abs(x)>36||z>37||z<-39)return false;if(z>-13&&z<-3&&Math.abs(x)>3.1&&Math.abs(x-26)>3.1)return false;return !k.obstacles.some(o=>{const dx=Math.abs(x-o.x),dz=Math.abs(z-o.z);if(!o.open)return dx<o.w/2+.25&&dz<o.d/2+.25;return (Math.abs(dx-o.w/2)<.3&&dz<o.d/2+.2)||(Math.abs(z-(o.z-o.d/2))<.3&&dx<o.w/2+.2)||(Math.abs(z-(o.z+o.d/2))<.3&&dx>1.3&&dx<o.w/2+.2);});},walkHeight(x,z){if(k.obstacles.some(o=>o.open&&Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2))return .55;if(z>-15&&z<-1&&(Math.abs(x)<3.5||Math.abs(x-26)<3.5))return Math.max(0,1.15*Math.sin((z+15)/14*Math.PI));return 0;},update(t){water.material.uniforms.time.value=t*.45;rainSeeds.forEach(([a,b,c],i)=>{const x=(a-.5)*95,y=((b*28-t*14)%28+28)%28,z=(c-.5)*95;rainPos.set([x,y,z,x-.12,y+.65,z+.03],i*6);});rg.attributes.position.needsUpdate=true;ripples.forEach((m,i)=>{const v=(t*.65+i*.31)%1;m.scale.setScalar(.5+v*2);m.material.opacity=(1-v)*.14;});},setEvening(){}};
}
