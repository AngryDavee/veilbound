import * as THREE from 'three';
import { bakeStatic } from '../../assetlib.js';
import { texture } from '../kit.js';
// The Endless Keep's construction kit. Repetition is the point: a handful of prototypes
// (tatami room, sliding door, stair, lantern, gallery) are baked once and instanced
// thousands of times at every angle so the fortress reads as infinite.

const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_p=new THREE.Vector3();
export function M(x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1,order='YXZ'){_e.set(rx,ry,rz,order);_q.setFromEuler(_e);_s.set(s,s,s);_p.set(x,y,z);return new THREE.Matrix4().compose(_p,_q,_s);}
// Place a room so its open front faces `normal` (a unit axis), then roll it around that normal.
export function facing(x,y,z,normal,roll=0,s=1){const base=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...normal).normalize());
 // Keep "up" sensible for vertical normals before the roll.
 const r=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),roll);const q=base.multiply(r);return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(s,s,s));}

export async function keepMaterials(k){
 const [tc,tn]=await Promise.all([texture('tatami-basecolor'),texture('tatami-normal')]);
 const tatami=new THREE.MeshStandardMaterial({color:0xa49a68,roughness:.92,map:tc.clone(),normalMap:tn.clone()});tatami.normalScale.set(.5,.5);
 const scroll=await texture('pine-scroll').catch(()=>null);
 const m={
  tatami,
  lacquer:k.surface('cedar',0x8a1f17,1,.34),
  lacquerDark:k.surface('cedar',0x4a110d,1,.4),
  black:k.surface('cedar',0x17100e,1,.48),
  beam:k.surface('cedar',0x3b2219,1,.72),
  floor:k.surface('cedar',0x5a3424,6,.5),
  hinoki:k.surface('cedar',0xc4a27a,4,.55),
  plaster:k.surface('plaster',0xb79c74,2,.9),
  stone:k.surface('stone',0x5e5652,3,.8),
  tile:k.tile,
  paper:new THREE.MeshStandardMaterial({color:0xf3dcae,emissive:0xff9a48,emissiveIntensity:.95,roughness:.9}),
  paperDim:new THREE.MeshStandardMaterial({color:0xcdb48a,emissive:0xb85a2a,emissiveIntensity:.35,roughness:.9}),
  paperRed:new THREE.MeshStandardMaterial({color:0xe07050,emissive:0xd0381c,emissiveIntensity:.9,roughness:.85}),
  lantern:new THREE.MeshStandardMaterial({color:0xffd9a0,emissive:0xff8a3a,emissiveIntensity:1.6,roughness:.8}),
  brass:new THREE.MeshStandardMaterial({color:0xb08a48,metalness:.85,roughness:.32}),
  gold:new THREE.MeshStandardMaterial({color:0xd9b064,metalness:.9,roughness:.25,emissive:0x3a2208,emissiveIntensity:.4}),
  fusuma:new THREE.MeshStandardMaterial({color:0xc9a86a,roughness:.75,metalness:.15}),
  scroll:scroll?new THREE.MeshStandardMaterial({map:scroll,roughness:.95}):null
 };
 return m;
}

// Bake a prototype group once and instance it with an array of Matrix4s.
// Returns {meshes,count,set(i,matrix)} so moving parts (sliding doors) can be animated.
export function instance(parent,proto,matrices,{cast=false,receive=true}={}){
 const baked=bakeStatic(proto);baked.updateMatrixWorld(true);const meshes=[],locals=[];
 baked.traverse(o=>{if(!o.isMesh)return;const im=new THREE.InstancedMesh(o.geometry,o.material,Math.max(1,matrices.length));const t=new THREE.Matrix4();matrices.forEach((mm,i)=>{t.multiplyMatrices(mm,o.matrixWorld);im.setMatrixAt(i,t);});im.count=matrices.length;im.castShadow=cast;im.receiveShadow=receive;im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();parent.add(im);meshes.push(im);locals.push(o.matrixWorld.clone());});
 const t=new THREE.Matrix4();
 return {meshes,count:matrices.length,set(i,mm){for(let j=0;j<meshes.length;j++){t.multiplyMatrices(mm,locals[j]);meshes[j].setMatrixAt(i,t);}},commit(){for(const m of meshes){m.instanceMatrix.needsUpdate=true;}},refreshBounds(){for(const m of meshes)m.computeBoundingSphere();}};
}

export const ROOM={W:7.2,D:5.4,H:3.0};
// A tatami room, open at +Z, floor centred at the origin. `detail` adds tatami, kumiko and ceiling grid.
export function roomProto(k,m,{detail=true,lit='paper',W=ROOM.W,D=ROOM.D,H=ROOM.H}={}){
 const g=new THREE.Group(),b=(w,h,d,x,y,z,mat)=>k.box(w,h,d,x,y,z,mat,g),glow=m[lit];
 b(W+.4,.38,D+.3,0,-.19,0,m.black);
 if(detail==='lite'){b(W-.1,.05,D-.1,0,.03,0,m.tatami);b(W,H-.4,.05,0,(H-.4)/2+.05,-D/2+.06,glow);for(const s of [-1,1]){b(.05,H-.4,D,s*(W/2-.06),(H-.4)/2+.05,0,glow);b(.22,H,.22,s*W/2,H/2,D/2,m.lacquer);}b(W+.3,.3,.24,0,H-.12,D/2,m.lacquer);b(W+.4,.1,D+.3,0,H+.05,0,m.beam);for(const x of [-W/4,0,W/4])b(.06,H-.4,.06,x,(H-.4)/2+.05,-D/2+.1,m.black);return g;}
 if(detail){for(let i=0;i<4;i++)for(let j=0;j<6;j++)b(1.76,.06,.86,-W/2+.9+i*1.8,.03,-D/2+.45+j*.9,m.tatami);}else b(W-.1,.05,D-.1,0,.03,0,m.tatami);
 for(const x of [-W/2,W/2])for(const z of [-D/2,D/2])b(.22,H,.22,x,H/2,z,m.lacquer);
 b(.2,H,.2,0,H/2,-D/2,m.lacquer);
 b(W+.3,.3,.24,0,H-.12,D/2,m.lacquer);b(W+.3,.14,.1,0,.08,D/2+.02,m.black);
 b(W,.4,.08,0,H-.42,-D/2+.06,m.black);for(const s of [-1,1])b(.08,.4,D,s*(W/2-.06),H-.42,0,m.black);
 b(W+.4,.1,D+.3,0,H+.05,0,m.beam);
 // Back and side shoji.
 const ph=H-1.0;
 const shoji=(x,z,w,rot)=>{if(rot){b(.03,ph,w,x,ph/2+.18,z,glow);if(detail){for(const o of [-w/3,0,w/3])b(.05,ph,.03,x,ph/2+.18,z+o,m.black);for(let y=.4;y<ph;y+=ph/5)b(.05,.03,w,x,y+.18,z,m.black);}b(.07,.18,w,x,.09,z,m.beam);}else{b(w,ph,.03,x,ph/2+.18,z,glow);if(detail){for(const o of [-w/3,0,w/3])b(.03,ph,.05,x+o,ph/2+.18,z,m.black);for(let y=.4;y<ph;y+=ph/5)b(w,.03,.05,x,y+.18,z,m.black);}b(w,.18,.07,x,.09,z,m.beam);}};
 for(let i=0;i<4;i++)shoji(-W/2+.9+i*1.8,-D/2+.08,1.74,false);
 for(const s of [-1,1])for(let j=0;j<3;j++)shoji(s*(W/2-.08),-D/2+.9+j*1.8,1.74,true);
 if(detail){for(let i=1;i<8;i++)b(.05,.05,D,-W/2+i*.9,H-.03,0,m.black);b(W,.05,.05,0,H-.03,0,m.black);
  // A hanging lamp inside each room so stacked rows read as inhabited.
  k.cylinder(.012,.012,.6,0,H-.32,-.4,m.black,4,g);const l=k.mesh(new THREE.SphereGeometry(.22,10,8),m.lantern,0,H-.75,-.4,g);l.scale.y=1.25;}
 return g;
}
// Sliding shoji door, origin at its bottom centre.
export function doorProto(k,m,{w=1.8,h=2.6,lit='paper'}={}){const g=new THREE.Group(),b=(W,H,D,x,y,z,mat)=>k.box(W,H,D,x,y,z,mat,g);
 b(w,h,.035,0,h/2,0,m[lit]);for(const s of [-1,1])b(.06,h,.06,s*(w/2-.03),h/2,0,m.lacquerDark);b(w,.06,.06,0,h-.03,0,m.lacquerDark);b(w,.22,.06,0,.11,0,m.lacquerDark);
 for(const o of [-w/4,0,w/4])b(.025,h-.3,.05,o,h/2+.1,0,m.black);for(let y=.5;y<h;y+=h/6)b(w,.025,.05,0,y,0,m.black);return g;}
// A run of stairs with lacquer stringers and handrail. Origin at its bottom-front centre, climbing toward -Z.
export function stairProto(k,m,{n=14,w=2,rise=.22,run=.3}={}){const g=new THREE.Group();
 for(let i=0;i<n;i++)k.box(w,.08,run+.02,0,(i+1)*rise-.04,-i*run-run/2,m.floor,g);
 for(const s of [-1,1]){k.beam([s*w/2,0,0],[s*w/2,n*rise,-n*run],.07,m.lacquer,g);k.beam([s*w/2,1,0],[s*w/2,n*rise+1,-n*run],.035,m.lacquer,g);for(let i=0;i<=n;i+=4)k.cylinder(.03,.03,1,s*w/2,i*rise+.5,-i*run,m.lacquerDark,6,g);}
 return g;}
// A red-railed gallery segment (engawa) of length L along X, outer edge at +Z.
export function galleryProto(k,m,{L=7.6,d=1.6}={}){const g=new THREE.Group();k.box(L,.2,d,0,-.1,d/2,m.floor,g);k.box(L,.12,.12,0,-.26,d,m.lacquerDark,g);k.box(L,.08,.08,0,1.0,d-.06,m.lacquer,g);k.box(L,.05,.05,0,.55,d-.06,m.lacquer,g);for(let x=-L/2;x<L/2;x+=1.9)k.box(.09,1.05,.09,x,.5,d-.06,m.lacquer,g);
 // Brass cap fittings echo the Keepers' work in the Folded Court.
 for(let x=-L/2;x<L/2;x+=1.9)k.box(.14,.06,.14,x,1.05,d-.06,m.brass,g);return g;}
export function lanternProto(k,m,{r=.34,cord=2}={}){const g=new THREE.Group();const l=k.mesh(new THREE.SphereGeometry(r,14,10),m.lantern,0,0,0,g);l.scale.y=1.3;for(const s of [-1,1])k.cylinder(r*.45,r*.45,.07,0,s*r*1.3,0,m.black,10,g);for(let j=-2;j<=2;j++){const rr=r*Math.sqrt(1-(j/3)**2)+.005;const t=k.mesh(new THREE.TorusGeometry(rr,.008,4,18),m.black,0,j*r*.4,0,g);t.rotation.x=Math.PI/2;}if(cord)k.cylinder(.01,.01,cord,0,r*1.3+cord/2,0,m.black,4,g);return g;}

// Soft additive glows for lamps, cheaper than lights. Fades with distance like exp2 fog.
export function halos(parent,points,{color=0xffa860,size=3.2,opacity=.55,density=.008}={}){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{color:{value:new THREE.Color(color)},size:{value:size},opacity:{value:opacity},density:{value:density},time:{value:0}},
  vertexShader:'uniform float size,density,time;varying float vF;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=-mv.z;vF=exp(-pow(density*d,2.))*(.85+.15*sin(time*2.3+position.x*.7+position.y*.3));gl_PointSize=clamp(size*1100./max(d,.5),1.,480.);}',
  fragmentShader:'uniform vec3 color;uniform float opacity;varying float vF;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(exp(-r*r*7.)*.8+exp(-r*r*40.)*.6)*step(r,1.)*opacity*vF;gl_FragColor=vec4(color*a,a);}'});
 const p=new THREE.Points(g,mat);p.frustumCulled=false;parent.add(p);return mat;}

// Square hip roof with flared eaves, built as a single frustum.
export function hipRoof(k,m,w,h,x,y,z,g,mat=m.tile){const r=k.mesh(new THREE.CylinderGeometry(w*.12,w*.78,h,4,1),mat,x,y+h/2,z,g);r.rotation.y=Math.PI/4;k.box(w*1.1,.14,w*1.1,x,y+.02,z,m.black,g);return r;}
// A multi-tier pagoda (used inverted over the Falling Halls).
export function pagoda(k,m,{tiers=5,base=11,story=3.6}={}){const g=new THREE.Group();let y=0;for(let i=0;i<tiers;i++){const w=base*(1-i*.12);k.box(w*.72,story,w*.72,0,y+story/2,0,m.lacquer,g);for(let s=0;s<4;s++){const a=s*Math.PI/2;for(let j=-1;j<=1;j++){const p=k.box(w*.18,story*.6,.05,0,y+story*.48,0,m.paper,g);const off=w*.36+.03;p.position.set(Math.sin(a)*off+Math.cos(a)*j*w*.22,y+story*.48,Math.cos(a)*off-Math.sin(a)*j*w*.22);p.rotation.y=a;}}
  for(let s=0;s<4;s++){const a=s*Math.PI/2+Math.PI/4;k.box(.3,story,.3,Math.sin(a)*w*.51,y+story/2,Math.cos(a)*w*.51,m.black,g);}
  k.box(w*.82,.25,w*.82,0,y+story,0,m.brass,g);hipRoof(k,m,w*1.15,1.5,0,y+story+.1,0,g);
  // Eave rafters under each roof tier.
  for(let s=0;s<4;s++){for(let j=-5;j<=5;j++){const a=s*Math.PI/2;const r=k.box(.08,.08,w*.22,0,0,0,m.beam,g);r.position.set(Math.sin(a)*w*.47+Math.cos(a)*j*w*.07,y+story+.02,Math.cos(a)*w*.47-Math.sin(a)*j*w*.07);r.rotation.y=a;}}
  y+=story+1.4;}
 for(let i=0;i<9;i++){const t=k.mesh(new THREE.TorusGeometry(.7-i*.05,.09,6,20),m.gold,0,y+1+i*.7,0,g);t.rotation.x=Math.PI/2;}k.cylinder(.12,.18,8,0,y+3.5,0,m.gold,8,g);return g;}

// Simplified fragments of earlier worlds, folded into the Keep. Each returns a Group at origin, base y=0.
export const fragments={
 bellPavilion(k,m){const g=new THREE.Group();k.box(6,.6,6,0,.3,0,m.stone,g);for(const x of [-2.4,2.4])for(const z of [-2.4,2.4])k.box(.32,4.4,.32,x,2.8,z,m.lacquer,g);hipRoof(k,m,7.4,2.2,0,5,0,g);const bell=k.cylinder(.7,1,1.8,0,3.6,0,m.brass,16,g);k.box(.2,.6,.2,0,4.7,0,m.black,g);return g;},
 brickTower(k,m){const g=new THREE.Group();const brick=k.surface('stone',0x7a3a2a,2,.85);for(let i=0;i<6;i++){const w=6-i*.35;k.box(w,4,w,0,2+i*4,0,brick,g);for(let s=0;s<4;s++)for(const o of [-1,1]){const a=s*Math.PI/2;const p=k.box(.7,1.6,.06,0,0,0,m.paper,g);p.position.set(Math.sin(a)*(w/2+.02)+Math.cos(a)*o*w*.22,2.2+i*4,Math.cos(a)*(w/2+.02)-Math.sin(a)*o*w*.22);p.rotation.y=a;}k.box(w+.3,.25,w+.3,0,4+i*4,0,m.stone,g);}hipRoof(k,m,4.2,3.4,0,24,0,g,k.surface('stone',0x3a4a4a,1,.6));return g;},
 farmhouse(k,m){const g=new THREE.Group();const thatch=k.surface('moss',0x8a7448,3,1);k.box(8,2.6,6,0,1.3,0,m.plaster,g);for(const x of [-4,0,4])k.box(.25,2.6,.25,x,1.3,3,m.beam,g);for(let i=0;i<3;i++)k.box(1.6,1,.05,-2.6+i*2.6,1.4,3.02,m.paper,g);for(const s of [-1,1]){const r=k.box(9,.7,6.6,0,6,s*1.65,thatch,g);r.rotation.x=s*-1.05;}k.box(9.2,.4,.4,0,8.9,0,thatch,g);return g;},
 carriage(k,m){const g=new THREE.Group();const body=k.surface('cedar',0x2a3a34,2,.5);k.box(3,2.6,14,0,2.2,0,body,g);k.cylinder(1.6,1.6,14,0,3.2,0,m.black,16,g).rotation.x=Math.PI/2;for(let i=0;i<9;i++)for(const s of [-1,1])k.box(.06,.9,1,s*1.52,2.6,-6+i*1.5,m.paper,g);for(const z of [-5,-3.6,3.6,5])for(const s of [-1,1]){const w=k.cylinder(.5,.5,.18,s*1.2,.55,z,m.black,14,g);w.rotation.z=Math.PI/2;}return g;},
 fireTower(k,m){const g=new THREE.Group();for(const x of [-1.2,1.2])for(const z of [-1.2,1.2])k.beam([x*1.5,0,z*1.5],[x*.7,11,z*.7],.12,m.beam,g);for(let y=1;y<11;y+=1.2){k.box(2.6,.08,.08,0,y,1.2,m.beam,g);}k.box(2.6,.15,2.6,0,11,0,m.floor,g);hipRoof(k,m,2.8,1.4,0,12.6,0,g);k.cylinder(.35,.45,.7,0,12,0,m.brass,12,g);return g;},
 waterwheel(k,m){const g=new THREE.Group();const w=new THREE.Group();for(const s of [-.6,.6]){const t=k.mesh(new THREE.TorusGeometry(3.4,.12,6,32),m.beam,0,0,s,w);}for(let i=0;i<16;i++){const a=i/16*Math.PI*2;k.beam([0,0,0],[Math.cos(a)*3.4,Math.sin(a)*3.4,0],.06,m.beam,w);const p=k.box(.08,.7,1.3,Math.cos(a)*3.5,Math.sin(a)*3.5,0,m.beam,w);p.rotation.z=a;}w.position.y=3.8;g.add(w);k.box(1,4,2,4,2,0,m.stone,g);k.box(2,.4,1,4.6,4.1,0,m.beam,g);return g;},
 dojo(k,m){const g=new THREE.Group();k.box(10,1,7,0,.5,0,m.stone,g);k.box(9,2.8,6,0,2.4,0,m.plaster,g);for(let i=0;i<6;i++)k.box(1.2,2,.05,-3.5+i*1.4,2.2,3.03,m.paper,g);for(const x of [-4.5,4.5])for(const z of [-3,3])k.box(.25,2.8,.25,x,2.4,z,m.beam,g);k.roof(0,3.6,0,11,8.5,g);return g;},
 gasLamp(k,m){const g=new THREE.Group();k.cylinder(.08,.14,3.6,0,1.8,0,m.black,8,g);k.box(.5,.08,.5,0,3.62,0,m.black,g);k.mesh(new THREE.CylinderGeometry(.28,.18,.6,6),m.lantern,0,3.95,0,g);k.mesh(new THREE.ConeGeometry(.38,.3,6),m.black,0,4.4,0,g);return g;},
 teahouse(k,m){const g=new THREE.Group();const red=m.paperRed;k.box(8,6,5,0,3,0,m.lacquerDark,g);for(let f=0;f<2;f++){for(let i=0;i<20;i++)k.box(.07,2.3,.07,-3.8+i*.4,1.4+f*3,2.55,m.lacquer,g);k.box(7.8,2.2,.04,0,1.4+f*3,2.5,red,g);k.box(8.6,.2,1.2,0,2.9+f*3,2.9,m.black,g);}k.roof(0,6,0,9,6,g);return g;}
};
export function floatingChunk(k,m,w,g){const geo=new THREE.ConeGeometry(w,w*1.3,7,3);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<w*.6){p.setX(i,p.getX(i)*(.8+.4*Math.sin(i*1.7)));p.setZ(i,p.getZ(i)*(.8+.4*Math.cos(i*2.3)));}}geo.computeVertexNormals();const c=k.mesh(geo,k.surface('rock',0x4a3e3a,1,.9),0,-w*.65,0,g);c.rotation.x=Math.PI;k.box(w*1.5,.3,w*1.5,0,-.15,0,m.stone,g).scale.set(1,1,1);return c;}

// --- Additions after coordinator review ---
// Deep-fog shoji for rooms far above and below: nearly black-red, barely glowing.
export function deepPaper(){return new THREE.MeshStandardMaterial({color:0x4a2420,emissive:0x5a140a,emissiveIntensity:.55,roughness:.95});}
// A flared pent roof (eave) that overhangs a room front: tiles, rafter ends and a ridge.
export function eaveProto(k,m,{w=8.6,d=2.8}={}){const g=new THREE.Group();const s=k.box(w,.16,d,0,0,d/2-.3,m.tile,g);s.rotation.x=.38;for(let x=-w/2+.2;x<w/2;x+=.45)k.box(.08,.08,d*.9,x,-.12,d/2-.4,m.beam,g).rotation.x=.38;k.box(w+.2,.18,.2,0,-.42,d-.55,m.black,g);k.box(w+.3,.22,.3,0,.3,-.25,m.tile,g);for(const sx of [-1,1]){const c=k.box(.5,.14,.6,sx*(w/2+.1),-.3,d-.6,m.tile,g);c.rotation.set(.38,0,-sx*.25);}return g;}
// Horizon buildings for the Meridian: lit, roofed and recognisable at distance.
export function houseProto(k,m,variant=0,lit='paper'){const g=new THREE.Group(),b=(w,h,d,x,y,z,mat)=>k.box(w,h,d,x,y,z,mat,g),glow=m[lit];
 if(variant===0){b(7,3,5,0,1.5,0,m.lacquerDark);for(let i=0;i<4;i++){b(1.5,2.1,.05,-2.55+i*1.7,1.5,2.52,glow);b(.06,2.1,.08,-1.7+i*1.7,1.5,2.55,m.black);}hipRoof(k,m,9,1,0,3,0,g);b(5,2.4,3.8,0,4.4,0,m.lacquerDark);for(let i=0;i<3;i++)b(1.3,1.6,.05,-1.5+i*1.5,4.4,1.92,glow);hipRoof(k,m,7,1.6,0,5.6,0,g);}
 else if(variant===1){for(let t=0;t<3;t++){const w=5-t*1.1,y=t*3.2;b(w,2.6,w,0,y+1.3,0,m.lacquer);for(let s=0;s<4;s++){const a=s*Math.PI/2,p=b(w*.6,1.6,.05,0,0,0,glow);p.position.set(Math.sin(a)*(w/2+.03),y+1.3,Math.cos(a)*(w/2+.03));p.rotation.y=a;}hipRoof(k,m,w*1.5,.9,0,y+2.6,0,g);}k.cylinder(.06,.06,2.4,0,10.6,0,m.gold,6,g);}
 else {b(8,2.8,5,0,1.4,0,m.black);b(7.4,2,.05,0,1.5,2.52,glow);for(let x=-3.6;x<=3.6;x+=.6)b(.05,2,.08,x,1.5,2.56,m.black);b(8.4,.2,1.4,0,2.9,2.8,m.tile);hipRoof(k,m,10,1.8,0,2.8,0,g);}
 return g;}
// Give fragment materials a warm self-glow so they read as lit miniatures in the void.
export function warmify(group,amount=.32,warm=0xff8a40){const cache=new Map(),w=new THREE.Color(warm);group.traverse(o=>{if(!o.isMesh)return;const mat=o.material;if(!mat?.isMeshStandardMaterial)return;if(!cache.has(mat)){const c=mat.clone();if(c.emissiveIntensity<=0.01||c.emissive.getHex()===0){c.emissive=c.color.clone().multiplyScalar(amount).lerp(w,.25);c.emissiveIntensity=1;}cache.set(mat,c);}o.material=cache.get(mat);});return group;}
// A crumbling chunk of earth with a torn-paper rim, for fragments adrift in the Keep.
export function groundChunk(k,m,w,g,rnd=Math.random){const moss=k.surface('moss',0x6f7850,2,1),earth=k.surface('earth',0x8a6a50,2,.95),rock=k.surface('rock',0x7a6656,1,.9);
 const top=new THREE.CylinderGeometry(w,w*.92,.6,9,1);const tp=top.attributes.position;for(let i=0;i<tp.count;i++){const a=Math.atan2(tp.getZ(i),tp.getX(i));const f=1+.12*Math.sin(a*5+1)+.08*Math.sin(a*11);tp.setX(i,tp.getX(i)*f);tp.setZ(i,tp.getZ(i)*f);}top.computeVertexNormals();k.mesh(top,moss,0,-.3,0,g);
 const cone=new THREE.ConeGeometry(w*.95,w*1.1,12,5);const cp=cone.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),a=Math.atan2(z,x);const j=.82+.18*Math.sin(a*3+y*1.7)+.08*Math.sin(a*7-y*3);cp.setX(i,x*j);cp.setZ(i,z*j);}cone.computeVertexNormals();const c=k.mesh(cone,earth,0,-.6-w*.55,0,g);c.rotation.x=Math.PI;
 for(let i=0;i<6;i++){const a=i*1.1+rnd(),rr=w*(.3+rnd()*.5);k.rock(Math.cos(a)*rr,-w*(.9+rnd()*.9),Math.sin(a)*rr,.25+rnd()*.5,rock,g);}
 // Torn paper: jagged strips standing around the rim, as if the place was cut from a scroll.
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,h=.25+rnd()*.45,f=1+.12*Math.sin(a*5+1)+.08*Math.sin(a*11);const p=k.box(w*.22,h,.025,Math.cos(a)*w*f*.99,-.2-h*.2,Math.sin(a)*w*f*.99,m.paperDim,g);p.rotation.set((rnd()-.5)*.15,-a+Math.PI/2,(rnd()-.5)*.2);}
 return g;}
