import * as THREE from 'three';
import { ASSET, bakeStatic } from './assetlib.js';
import { addDetailWorld, windMaterial } from './detail-world.js';

export const views={
  arrival:{pos:[12,4.4,29],look:[0,4,-15],name:'Cloudveil Courtyard',sub:'A quiet place above the valley.'},
  interior:{pos:[3.4,2.54,-12.5],look:[0,2.3,-20.6],name:'Inside the Dojo',sub:'Woven rush, worn cedar, and the warmth of paper lanterns.'},
  hall:{pos:[3,2.2,-4],look:[0,2.8,-20],name:'The Training Hall',sub:'Every worn floorboard remembers a lesson.'},
  water:{pos:[26.5,2.0,8],look:[39,9,-18.4],name:'The Falling Water',sub:'The mountain speaks, even when its bells are silent.'},
  shrine:{pos:[31,12.5,-40],look:[-10,5,14],name:'The Silent Bell',sub:'Beyond the rooftops, the valley waits.'},
  garden:{pos:[-20,1.8,17],look:[-17,1.1,8],name:'The Returning Garden',sub:'Someone left a promise beneath the flowers.'},
};
export const discoveries=[
  {id:'letter',pos:[0,1.1,-19],title:'A letter left unfinished',text:'“I heard it again beyond the eastern ridge. A bell, though the old shrine has none. If I do not return before first light, follow the water. And promise me this: do not open a door that was not there yesterday.”\n\nThe handwriting is your sibling’s. The ink is only days old.'},
  {id:'ribbon',pos:[-17,.9,8],title:'The ribbon in the garden',text:'A faded violet ribbon is tied beneath the garden branches. You recognise the knot: the one your sibling taught you before your first journey. Beneath it, three small stones point toward the upper bell pavilion. Someone expected you to come.'},
  {id:'bell',pos:[32,12,-44],title:'The bell without an echo',text:'The bell bears a fresh crack, narrow as a sword’s edge. Its clapper has been bound with a strip of dark cloth. On the timber beside it, someone has scratched a warning: “When the valley answers, the way will open.”\n\nFar below, a doorway in the training hall seems darker than you remember.'},
];

let seed=9404;
const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)};
const smooth=t=>t*t*(3-2*t);
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v)}
function fbm(x,z){return noise(x,z)*.55+noise(x*2.1,z*2.1)*.27+noise(x*4.3,z*4.3)*.12+noise(x*8.4,z*8.4)*.06}
const peaks=[[-195,-260,155,125],[240,-320,210,130],[-420,-400,260,150],[50,-560,300,165],[480,-430,320,175],[-380,50,190,130],[320,210,160,110],[-230,360,210,145],[180,480,260,160],[470,420,230,125]];
export function terrainHeight(x,z){
 const d=Math.max(Math.abs(x)/42,Math.abs(z+5)/49),f=smooth(THREE.MathUtils.clamp((d-1)/1.2,0,1));
 let h=-10;for(const [px,pz,ph,s] of peaks)h=Math.max(h,ph*Math.exp(-((x-px)**2+(z-pz)**2)/(s*s)));
 const ridge=1-Math.abs(noise(x*.021,z*.021)*2-1);
 h=h*(.67+ridge*.28+fbm(x*.04,z*.04)*.2)+fbm(x*.12,z*.12)*7-8;
 return f*Math.max(-18,h);
}
export function walkHeight(x,z){
 // Walkable platforms are explicit; render geometry does not decide collision.
 if(x>27.5&&x<37&&z<-40&&z>-49)return 10.7;
 if(x>28&&x<36&&z<=-16&&z>=-40)return ((-z-16)/24)*10.7;
 if(Math.abs(x)<11.1&&z>-22.2&&z<-9.0)return .86;
 if(Math.abs(x)<3&&z>=-9&&z<-6.4)return Math.max(0,(-z-6.4)/2.6*.86);
 return 0;
}
export function canWalk(x,z){
 if(x<-28||x>38||z>42||z<-49)return false;
 if(Math.abs(x)<1.3&&z>-19.75&&z<-18.45)return false;
 if(Math.abs(x)<2.5&&z>-21.5&&z<-20.2)return false;
 if(Math.abs(x)>8.15&&Math.abs(x)<9.2&&z>-20.3&&z<-16.1)return false;
 if(Math.abs(Math.abs(x)-8)<.7&&Math.abs(z+12.8)<.65)return false;
 // Main hall perimeter; opening centered on the courtyard.
 if(z<-21.8&&Math.abs(x)<11.7)return false;
 if(Math.abs(x)>10.3&&Math.abs(x)<11.5&&z<-9&&z>-22)return false;
 if(z>-10.1&&z<-9.2&&Math.abs(x)>4.6&&Math.abs(x)<11.3)return false;
 if(x<-18&&z<-2&&z>-20)return false;
 if(Math.abs(z-32)<.7&&Math.abs(x)>3&&Math.abs(x)<26)return false;
 // Water and cliff faces have a clearly marked traversable bank on the west.
 if(x>29&&x<38&&z>-14&&z<22)return false;
 if(z<-24&&x<27)return false;
 return true;
}

export async function createEnvironment(scene,renderer,progress){
 const textures={};const loader=new THREE.TextureLoader();
 const jobs=[];for(const name of ['cedar','stone','earth','rock'])for(const role of ['basecolor','normal','roughness'])jobs.push([name,role]);
 let done=0;
 await Promise.all(jobs.map(async([n,r])=>{const t=await loader.loadAsync(`./textures/${n}-${r}.png`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(r==='basecolor')t.colorSpace=THREE.SRGBColorSpace;(textures[n]??={})[r]=t;progress(.1+(++done/jobs.length)*.22,'Preparing cedar, stone, and mountain earth');}));
 function material(name,color,repeat=1){const t=textures[name],m=new THREE.MeshStandardMaterial({color,roughness:.9});if(t){for(const [role,key] of [['basecolor','map'],['normal','normalMap'],['roughness','roughnessMap']]){if(name==='earth'&&role==='roughness')continue;const tx=t[role].clone();tx.repeat.set(repeat,repeat);m[key]=tx;}m.normalScale.set(.22,.22);if(name==='earth')m.roughness=.96;}return m;}
 const soil=material('earth',0xbeb59b,18),paving=material('stone',0x9faaa0,1),rockMat=material('rock',0x838d79,2);
 soil.normalScale.set(.65,.65);soil.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGround;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(position,1.)).xyz;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGround;').replace('#include <map_fragment>','#include <map_fragment>\nfloat soilPatch=sin(vGround.x*.61+sin(vGround.z*.37))*sin(vGround.z*.53+sin(vGround.x*.18));float grain=fract(sin(dot(vGround.xz,vec2(127.1,311.7)))*43758.54);diffuseColor.rgb*=.90+soilPatch*.10+grain*.08;');};
 const grassMat=new THREE.MeshStandardMaterial({color:0x647b4e,roughness:1});
 const architecture=new THREE.Group(),landscape=new THREE.Group();
 const box=(group,w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o};
 const applyTextures=root=>{root.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.name==='timber'||m.name==='stone'){const n=m.name==='timber'?'cedar':'rock',a=m.clone();a.map=textures[n].basecolor;a.normalMap=textures[n].normal;a.normalScale.set(.14,.14);a.roughness=.88;a.color.lerp(new THREE.Color(0xffffff),m.name==='timber'?.5:.05);if(m.name==='timber'){a.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat lum=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(lum),diffuseColor.rgb,.52);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.20,.13,.075),.32);');};a.customProgramCacheKey=()=> 'soft-cedar';}o.material=a;}});};
 const foliageMap=await loader.loadAsync('./textures/pine-foliage.png');foliageMap.colorSpace=THREE.SRGBColorSpace;foliageMap.anisotropy=4;
 const foliageMaterial=new THREE.MeshStandardMaterial({map:foliageMap,color:0xc7d1b3,alphaTest:.42,alphaToCoverage:true,side:THREE.DoubleSide,roughness:1});
 windMaterial(foliageMaterial,.32);
 function needleCanopy(root){const leaves=[];root.traverse(o=>{if(o.isMesh&&o.material.name==='foliage')leaves.push(o);});for(const o of leaves){o.geometry.computeBoundingSphere();const r=o.geometry.boundingSphere.radius,cluster=new THREE.Group();cluster.position.copy(o.position);cluster.rotation.copy(o.rotation);cluster.scale.copy(o.scale);for(let i=0;i<3;i++){const card=new THREE.Mesh(new THREE.PlaneGeometry(r*2.8,r*2.35),foliageMaterial);card.rotation.y=i*Math.PI/3;if(i===2)card.rotation.x=-Math.PI/2;card.castShadow=true;card.receiveShadow=true;cluster.add(card);}o.parent.add(cluster);o.removeFromParent();}return bakeStatic(root);}
 const sources=await Promise.all(['training-hall','entrance-gate','stone-lantern','mountain-pine','mossy-rocks','bell-pavilion'].map(async n=>{let a=await ASSET(`./assets/${n}.js`,{keepHierarchy:n==='mountain-pine'});if(!a.children.length)throw Error(`Empty asset: ${n}`);applyTextures(a);if(n==='mountain-pine')a=needleCanopy(a);return a}));
 const [hall,gate,lantern,pine,rocks,bell]=sources;
 progress(.44,'Raising the timber halls');
 const place=(proto,group,x,y,z,scale=1,rot=0)=>{const o=proto.clone();o.position.set(x,y,z);o.scale.multiplyScalar(scale);o.rotation.y=rot;group.add(o);return o};
 place(hall,architecture,0,0,-16);
 place(hall,architecture,-24,0,-10,.58,Math.PI/2);
 place(gate,architecture,0,0,32);
 place(bell,architecture,32,10.7,-44);
 // Stable platform and an ascending stone stair path to the bell.
 box(architecture,10,1.1,9,32,10.1,-44,rockMat);
 for(let i=0;i<48;i++){const y=(i+1)*10.7/48,z=-16-i*.5;box(architecture,6,.25,.55,32,y-.125,z,rockMat)}
 for(let i=0;i<13;i++)for(const s of [-1,1]){box(architecture,.15,1.0,.15,32+s*2.9,i*10.7/12+.5,-16-i*2,new THREE.MeshStandardMaterial({color:0x715840,roughness:.9}));}
 // Courtyard paving and low garden walls are structural landscape, not props.
 const court=new THREE.Mesh(new THREE.PlaneGeometry(54,68),soil);court.rotation.x=-Math.PI/2;court.position.set(0,-.03,3);court.receiveShadow=true;scene.add(court);
 for(let i=0;i<23;i++){const z=30-i*1.6,x=Math.sin(i*.2)*.7;box(architecture,3.3,.05,1.62,x,.005,z,paving);}
 for(let i=0;i<15;i++){const x=-2-i*1.4,z=8+Math.sin(i*.2)*1.8;box(architecture,1.55,.05,2.1,x,.008,z,paving);}
 for(const side of [-1,1])for(let i=0;i<12;i++){
   const x=side*(5+i*1.8),z=32;box(architecture,1.78,.65,.8,x,.3,z,rockMat);box(architecture,1.78,1.4,.32,x,1.27,z,new THREE.MeshStandardMaterial({color:0xc8c4ac,roughness:1}));box(architecture,1.85,.2,.75,x,2.05,z,new THREE.MeshStandardMaterial({color:0x475a58,roughness:.8}));
 }
 // Plants grow in beds around the empty, usable center of the training court.
 for(const side of [-1,1]){for(let i=0;i<20;i++)place(rocks,landscape,side*19.3,.01,-1+i*1.6,.22,rnd()*6.28);}
 const lanternPositions=[[-6,24],[6,24],[-6,9],[6,9],[-8,-4],[8,-4],[-17,12],[24,-8],[28,-18],[32,-38]];
 for(const [x,z]of lanternPositions)place(lantern,architecture,x,walkHeight(x,z),z,.82);
 const lightSources=[];for(const [x,z]of [[-6,24],[6,9],[-8,-4],[24,-8]]){const l=new THREE.PointLight(0xffcc80,0,8,2);l.position.set(x,1.3,z);scene.add(l);lightSources.push(l)}
 scene.add(bakeStatic(architecture));
 progress(.56,'Carving the surrounding ridges');
 // A continuous heightfield gives ridges real parallax from every viewpoint.
 const terrain=new THREE.PlaneGeometry(1450,1450,340,340);terrain.rotateX(-Math.PI/2);const p=terrain.attributes.position,cols=[];const c=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=terrainHeight(x,z);p.setY(i,h-.15);}terrain.computeVertexNormals();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=p.getY(i),slope=terrain.attributes.normal.getY(i),n=fbm(x*.07,z*.07);c.setHex(slope<.72?0x7a8174:n>.62?0x728562:n>.38?0x526e50:0x364f42);c.multiplyScalar(.83+noise(x*.31,z*.31)*.3);cols.push(c.r,c.g,c.b)}terrain.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 const terrainTex=textures.rock.basecolor.clone();terrainTex.repeat.set(140,140);const terrainNormal=textures.rock.normal.clone();terrainNormal.repeat.set(140,140);
 const tm=new THREE.MeshStandardMaterial({vertexColors:true,map:terrainTex,normalMap:terrainNormal,normalScale:new THREE.Vector2(.6,.6),roughness:1});const mountain=new THREE.Mesh(terrain,tm);mountain.receiveShadow=true;scene.add(mountain);
 // Rock faces and the eastern waterfall make a distinct destination.
 // Stratified rock face supplied by detail-world.
 for(let i=0;i<35;i++){const a=rnd()*Math.PI*2,r=37+rnd()*18,x=Math.cos(a)*r,z=Math.sin(a)*r-9;if(x>27&&z<-15)continue;place(rocks,landscape,x,Math.max(0,terrainHeight(x,z)),z,.5+rnd()*1.6,rnd()*6.28)}
 const nearTrees=[[-26,27,1.65],[-31,7,1.7],[-31,-27,1.6],[-16,-33,1.6],[15,-32,1.7],[25,26,1.5],[42,0,1.5],[39,-33,1.4],[-17,38,1.4],[29,45,1.6],[-15,9,.85],[-27,39,1.4]];
 const trunks=[];for(const[x,z,s]of nearTrees){place(pine,landscape,x,0,z,s,rnd()*6.28);trunks.push([x,z,.5*s]);}
 scene.add(bakeStatic(landscape));
 // Forest instancing shares three meshes across hundreds of distant trees.
 const placements=[];for(let i=0;i<1250;i++){let x,z;if(i<250){const a=rnd()*6.28,r=65+rnd()*110;x=Math.cos(a)*r;z=Math.sin(a)*r-15;}else{x=(rnd()-.5)*900;z=(rnd()-.55)*900;}if(Math.abs(x)<50&&z>-55&&z<58)continue;const y=terrainHeight(x,z);if(y<0)continue;placements.push([x,y,z,.7+rnd()*1.1,rnd()*6.28]);}
 const simplified=needleCanopy(await ASSET('./assets/mountain-pine-distant.js',{keepHierarchy:true}));simplified.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 const matrix=new THREE.Matrix4(),dummy=new THREE.Object3D();simplified.updateMatrixWorld(true);
 simplified.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const inst=new THREE.InstancedMesh(geo,o.material,placements.length);placements.forEach(([x,y,z,s,a],i)=>{dummy.position.set(x,y,z);dummy.scale.set(s,s,s);dummy.rotation.set(0,a,0);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.castShadow=false;inst.receiveShadow=false;scene.add(inst);});
 progress(.7,'Planting the gardens');
 // Fine geometry breaks up the silhouette of low plants and wisteria.
 const green=new THREE.MeshStandardMaterial({color:0x708b54,roughness:.95,side:THREE.DoubleSide});
 function blossom(){const pos=[],uv=[];for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const verts=[[0,.015,0],[Math.cos(a-.45)*.055,0,Math.sin(a-.45)*.055],[Math.cos(a-.22)*.105,.025,Math.sin(a-.22)*.105],[Math.cos(a)*.115,.04,Math.sin(a)*.115],[Math.cos(a+.22)*.105,.025,Math.sin(a+.22)*.105],[Math.cos(a+.45)*.055,0,Math.sin(a+.45)*.055]];for(let j=1;j<5;j++)for(const v of [verts[0],verts[j],verts[j+1]]){pos.push(...v);uv.push(v[0]*4+.5,v[2]*4+.5);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
 const flowers=new THREE.Group(),leafGeo=new THREE.SphereGeometry(.16,8,4),flowerGeo=blossom();
 const bloomMats=[0x9d8db6,0xb6a2cc,0xc5b6d8,0x797fa7].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.95,side:THREE.DoubleSide}));
 for(let i=0;i<68;i++){const side=i%2?-1:1,x=side*(20+rnd()*3),z=1+rnd()*26;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.009,.012,.55,5),green);stem.position.set(x,.29,z);flowers.add(stem);for(let k=0;k<5;k++){const l=new THREE.Mesh(leafGeo,green);l.position.set(x+(rnd()-.5)*.5,.22+rnd()*.2,z+(rnd()-.5)*.5);l.scale.set(1.9,.4,1);l.rotation.z=rnd();flowers.add(l);}for(let k=0;k<8;k++){const f=new THREE.Mesh(flowerGeo,bloomMats[i%4]);const a=k*2.4;f.position.set(x+Math.cos(a)*.14,.52+rnd()*.13,z+Math.sin(a)*.14);f.rotation.set((rnd()-.5)*1.4,rnd()*6.28,(rnd()-.5)*1.4);flowers.add(f)}}
 for(const side of [-1,1])for(let i=0;i<25;i++){const x=side*(2.4+rnd()*1.1),z=31+(rnd()-.5)*2,len=.4+rnd()*1.2;for(let k=0;k<7;k++){const f=new THREE.Mesh(flowerGeo,bloomMats[i%4]);f.position.set(x+Math.sin(k+i)*.06,3.8-k*len/7,z);f.scale.set(.9-k*.08,1.4,.9-k*.08);f.rotation.x=1.1;flowers.add(f)}}
 scene.add(bakeStatic(flowers));
 // Wind-carried petals remain subtle and spatially attached to the entrance.
 const petalPositions=new Float32Array(150*3),petalSeed=[];
 for(let i=0;i<150;i++){const a=[(rnd()-.5)*36,1+rnd()*10,5+rnd()*35];petalSeed.push(a);petalPositions.set(a,i*3)}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(petalPositions,3));const petals=new THREE.Points(pg,new THREE.PointsMaterial({color:0xd9c9e5,size:.055,transparent:true,opacity:.7,depthWrite:false}));scene.add(petals);
 // Story traces use simple physical objects, not floating objective beacons.
 const interiorBounce=new THREE.PointLight(0xffdfae,22,17,2);interiorBounce.position.set(0,3.8,-14);scene.add(interiorBounce);
 const story=new THREE.Group(),paper=new THREE.MeshStandardMaterial({color:0xe4d9b7,roughness:1});
 box(story,.65,.015,.42,0,1.05,-19,paper).rotation.y=.2;
 box(story,.5,.09,.5,-17,.1,8,rockMat);box(story,.06,.65,.015,-17,.65,8,bloomMats[1]);
 scene.add(story);
 progress(.92,'Weaving tatami, shaping water, and filling the gardens');
 const detail=await addDetailWorld(scene,renderer,textures,terrainHeight);
 return {texturesLoaded:jobs.length+detail.texturesLoaded,trunks,grassBlades:detail.grassBlades,update(t){detail.update(t);const a=pg.attributes.position;for(let i=0;i<150;i++){const s=petalSeed[i];a.setXYZ(i,s[0]+Math.sin(t*.2+i)*1.5,((s[1]-t*.12)%10+10)%10,s[2]+Math.sin(t*.12+i*.7))}a.needsUpdate=true;},setEvening(value){detail.setEvening(value);for(const l of lightSources)l.intensity=value?10:0;}};
}
