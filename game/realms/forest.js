import * as THREE from 'three';
import { kit } from './kit.js';
import { realmClues } from './story.js';
import { windMaterial } from '../detail-world.js';
import { Water } from 'three/addons/objects/Water.js';
export async function createForest(root,renderer,progress){
 progress(.15,'Following the old pilgrim road');const k=await kit(root,481);const {random:r,box,beam,cylinder,mesh,rock,floor,cedar,stone,moss,wood,dark,bronze}=k;
 const dirt=k.surface('moss',0x829177,28),ground=new THREE.PlaneGeometry(220,220,110,110);ground.rotateX(-Math.PI/2);const pos=ground.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),dist=Math.hypot(x,z+10),edge=THREE.MathUtils.smoothstep(dist,65,105);pos.setY(i,edge*(Math.sin(x*.09)*Math.cos(z*.07)*4+5)-.09);}ground.computeVertexNormals();mesh(ground,dirt);
 // A broad, open clearing interrupts the dense undergrowth. The route remains human-scale.
 floor(27,27,0,-10,.005,k.surface('earth',0x9c967b,12));
 for(let i=0;i<48;i++){const z=39-i*1.62,x=Math.sin(z*.12)*1.2;const o=box(2.2+r()*.5,.045,1.2,x,.025,z,k.surface('stone',0x87917e));o.rotation.y=(r()-.5)*.25;}
 for(let i=0;i<28;i++){const a=i/28*6.28,x=Math.cos(a)*14,z=-10+Math.sin(a)*14;if(Math.abs(x)<3)continue;rock(x,.08,z,.45+r()*.25,stone);}
 const trunks=[];for(let i=0;i<64;i++){const a=i*2.399,radius=22+r()*38,x=Math.cos(a)*radius,z=Math.sin(a)*radius-5;if(Math.abs(x)<5)continue;trunks.push(cedar(x,z,17+r()*13,.48+r()*.5));}
 // Layer a closed forest silhouette behind the clearing, beyond the walkable exit.
 // Staggered rows hide the terrain edge without obstructing the story route.
 for(let row=0;row<3;row++)for(let i=0;i<11;i++){const x=(i-5)*8+(r()-.5)*4,z=-49-row*9-r()*4;cedar(x,z,21+r()*13,.4+r()*.35);}
 // Near trees frame the route with integrated buttress roots instead of exposed log spokes.
 for(const[x,z,h]of [[-8,31,24],[9,26,28],[-12,15,23],[18,-5,29],[-20,-12,25],[11,-29,23],[-9,-35,26]])trunks.push(cedar(x,z,h,.7));
 progress(.48,'Growing the bamboo and understory');
 const bamboo=k.surface('moss',0x8b9d5b,1),leafMat=new THREE.MeshStandardMaterial({color:0x647e41,side:THREE.DoubleSide,roughness:1});
 // Clustered bamboo with internodes and fine lateral twigs.
 for(let cl=0;cl<26;cl++){const side=cl%2?-1:1,cx=side*(12+r()*22),cz=-40+r()*80;if(Math.hypot(cx,cz+10)<17)continue;for(let n=0;n<6;n++){const x=cx+(r()-.5)*3,z=cz+(r()-.5)*3,h=6+r()*7;const stalk=cylinder(.055,.095,h,x,h/2,z,bamboo,8);stalk.rotation.z=(r()-.5)*.09;for(let y=.6;y<h;y+=.7){cylinder(.09,.09,.035,x,y,z,dark,8);if(y>h*.55){const a=r()*6.28;beam([x,y,z],[x+Math.cos(a)*1.2,y+.3,z+Math.sin(a)*1.2],.014,bamboo);for(let j=0;j<5;j++){const l=mesh(new THREE.PlaneGeometry(.12,.65),leafMat,x+Math.cos(a)*(j*.2+.2),y+.25,z+Math.sin(a)*(j*.2+.2));l.rotation.set(-.5,a,1.1);}}}}}
 // Moss banks and low fern rosettes create thick bush close to the path.
 const bushes=new THREE.Group();for(let i=0;i<440;i++){const x=(r()-.5)*86,z=(r()-.5)*100;if(Math.abs(x)<3.8||Math.hypot(x,z+10)<15)continue;if(i<120)rock(x,.08,z,.6+r()*.8,moss);for(let j=0;j<5;j++){const a=j*1.256+r()*.4,len=.5+r()*.6;const frond=mesh(new THREE.PlaneGeometry(.28,len,1,5),k.foliage,x+Math.cos(a)*.25,.35+len*.25,z+Math.sin(a)*.25,bushes);frond.rotation.set(-.65,a,.4);frond.scale.x=2;}}
 k.batch.add(bushes); // Preserve the foliage shader; no per-frame object transforms.
 // A continuous carpet of tapered blades breaks up the moss floor beneath the bush.
 const gp=[],gn=[],gu=[],gb=[],gc=[];const grassColor=new THREE.Color();
 for(let i=0;i<32000;i++){const x=(r()-.5)*75,z=(r()-.5)*96;if(Math.abs(x)<3.6||Math.hypot(x,z+10)<15)continue;const h=.12+r()*.48,w=.018+r()*.023,a=r()*6.28,dx=Math.cos(a)*w,dz=Math.sin(a)*w,bx=Math.sin(a)*.14,bz=Math.cos(a)*.14;const A=[x-dx,.02,z-dz],B=[x+dx,.02,z+dz],C=[x+bx-dx*.4,h*.65,z+bz-dz*.4],D=[x+bx+dx*.4,h*.65,z+bz+dz*.4],E=[x+bx*1.8,h,z+bz*1.8];grassColor.setHSL(.22+r()*.06,.27,.24+r()*.13);for(const [v,t,u]of [[A,0,0],[B,0,1],[C,.65,0],[B,0,1],[D,.65,1],[C,.65,0],[C,.65,0],[D,.65,1],[E,1,.5]]){gp.push(...v);gn.push(0,1,0);gu.push(u,t);gb.push(t);gc.push(grassColor.r*(.6+t*.5),grassColor.g*(.6+t*.5),grassColor.b*(.6+t*.5));}}
 const gg=new THREE.BufferGeometry();for(const[n,a,s]of [['position',gp,3],['normal',gn,3],['uv',gu,2],['bend',gb,1],['color',gc,3]])gg.setAttribute(n,new THREE.Float32BufferAttribute(a,s));const gm=windMaterial(new THREE.MeshStandardMaterial({color:0xc4d0ac,vertexColors:true,roughness:1,side:THREE.DoubleSide}),.2,true);const grass=new THREE.Mesh(gg,gm);grass.receiveShadow=true;root.add(grass);
 // A shallow brook runs along the east edge; a fallen tree bridges its narrow reach.
 const water=new Water(new THREE.PlaneGeometry(7,125),{textureWidth:256,textureHeight:256,waterNormals:k.maps.rock[1],waterColor:0x26493d,sunColor:0xffe1b2,distortionScale:.65,fog:true});water.rotation.x=-Math.PI/2;water.position.set(31,.02,-5);root.add(water);
 for(let i=0;i<80;i++)rock(27.5+r()*7.5,.03,-62+r()*125,.3+r()*.5,i%3?stone:moss);
 const fallen=new THREE.Group();beam([25,.55,20],[37,1.1,17],.45,k.surface('rock',0x514936),fallen);for(let i=0;i<9;i++)rock(26+i,1,20-i*.25,.3,moss,fallen);k.batch.add(fallen);
 // The ruin is an old waystation, not a copy of a franchise landmark.
 for(const x of [-8,8]){box(.9,5,.9,x,2.5,-33,stone);rock(x,.3,-33,1.1,moss);}beam([-9,4.7,-33],[9,4.7,-33],.3,dark);beam([-8,4.1,-33],[8,4.1,-33],.18,wood);
 k.sign(0,3,-33,'THE RIVER REMEMBERS');for(const x of [-7,7]){box(1.1,.3,1.1,x,.15,-31,stone);k.lantern(x,1.8,-31,.8);}
 // Remains beside the clearing tell the bell-anchor story.
 for(let i=0;i<8;i++){rock(-13+r()*3,.3,-14+r()*7,.7,stone);}cylinder(.8,.9,.3,-11,.6,-11,bronze,24);mesh(new THREE.TorusGeometry(.67,.08,8,30),bronze,-11,.8,-11).rotation.x=Math.PI/2;
 box(.9,.6,.8,11,.3,9,stone);box(.06,.55,.035,11,.9,9,new THREE.MeshStandardMaterial({color:0x9b7aaf}));
 for(let i=0;i<100;i++){const x=(r()-.5)*70,z=(r()-.5)*90;if(Math.abs(x)<3||Math.hypot(x,z+10)<14)continue;const leaf=mesh(new THREE.PlaneGeometry(.08+r()*.16,.18+r()*.2),new THREE.MeshStandardMaterial({color:i%2?0x766244:0x9b7b42,side:THREE.DoubleSide}),x,.04,z);leaf.rotation.set(-Math.PI/2,r()*6.28,0);}
 k.sign(-5,1.7,34,'WHISPERING THICKET');k.sign(5,1.7,-37,'REEDWATER CROSSING');
 // Oblique shafts through the canopy, with soft radial edges.
 const shafts=new THREE.Group();for(let i=0;i<7;i++){const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;void main(){float a=pow(sin(v.x*3.14159),3.)*sin(v.y*3.14159)*.035;gl_FragColor=vec4(.9,.82,.54,a);}'});const m=mesh(new THREE.PlaneGeometry(2+r()*2,30),mat,-12+i*5,14,-18+r()*30,shafts);m.rotation.z=-.4;m.castShadow=false;}root.add(shafts);
 const drift=k.particles(300,0xcdd3ac,.035,[80,22,85]);k.finish();progress(.96,'Listening beneath the leaves');
 return {trunks,texturesLoaded:13,grassBlades:gb.length/9,views:{arrival:{pos:[0,2,34],look:[0,5,-20],name:'The old pilgrim road',sub:'Narrow trails lead through living roots.'},clearing:{pos:[0,2.5,7],look:[0,3,-27],name:'The hidden clearing',sub:'A 26-metre clearing reserved for a future encounter.'},brook:{pos:[23,2,22],look:[32,2,-12],name:'The rootbound brook',sub:'Water leads toward the town.'}},discoveries:realmClues.cedar,canWalk(x,z){return Math.abs(x)<27&&z>-42&&z<42&&!trunks.some(([a,b,r])=>Math.hypot(x-a,z-b)<r+.25);},walkHeight(){return 0;},update(t){k.windTime.value=t;drift(t);water.material.uniforms.time.value=t*.4;},setEvening(){}};
}
