// World V building kit — the Floating Quarter.
// An instanced/merged collector keeps draw calls at one per material, and every builder here
// (tiled roofs, lattice teahouses, chochin lanterns, glow points, fire, smoke, petals, willow,
// cherry) feeds it. All geometry is authored in code; textures are painted on canvases.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
export function canvasTex(w,h,draw,{repeat=[1,1],srgb=true,wrap=true}={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(wrap){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.repeat.set(...repeat);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

// ---------- collector: one InstancedMesh per box material, one merged mesh per geometry material ----------
export function collector(){
 const boxes=new Map(),geos=new Map(),stack=[];let base=new THREE.Matrix4();
 const q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(),m=new THREE.Matrix4();
 const C={
  with(x,y,z,ry,fn){stack.push(base);base=base.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1)));try{fn();}finally{base=stack.pop();}},
  local(x,y,z){return new THREE.Vector3(x,y,z).applyMatrix4(base);},
  box(mat,w,h,d,x,y,z,rx=0,ry=0,rz=0){if(!boxes.has(mat))boxes.set(mat,[]);e.set(rx,ry,rz);q.setFromEuler(e);m.compose(p.set(x,y,z),q,s.set(w,h,d));boxes.get(mat).push(base.clone().multiply(m));},
  // A box spanning two points (beam), with a square section.
  beam(mat,a,b,r){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),len=A.distanceTo(B);const dir=B.clone().sub(A).normalize();q.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);const mid=A.add(B).multiplyScalar(.5);m.compose(mid,q,s.set(r,len,r));if(!boxes.has(mat))boxes.set(mat,[]);boxes.get(mat).push(base.clone().multiply(m));},
  geo(mat,g,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){let gg=g.index?g.toNonIndexed():g.clone();for(const k of Object.keys(gg.attributes))if(!['position','normal','uv'].includes(k))gg.deleteAttribute(k);if(!gg.attributes.uv)gg.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count*2),2));if(!gg.attributes.normal)gg.computeVertexNormals();e.set(rx,ry,rz);q.setFromEuler(e);m.compose(p.set(x,y,z),q,s.set(sx,sy,sz));gg.applyMatrix4(base.clone().multiply(m));if(!geos.has(mat))geos.set(mat,[]);geos.get(mat).push(gg);},
  build(root,{cast=true,receive=true,skipShadow=[]}={}){const unit=new THREE.BoxGeometry(1,1,1);let n=0,meshes=[];
   for(const [mat,list] of boxes){const im=new THREE.InstancedMesh(unit,mat,list.length);list.forEach((mm,i)=>im.setMatrixAt(i,mm));im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.castShadow=cast&&!skipShadow.includes(mat);im.receiveShadow=receive;root.add(im);n++;meshes.push(im);}
   for(const [mat,list] of geos){const g=mergeGeometries(list,false);g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.castShadow=cast&&!skipShadow.includes(mat);mesh.receiveShadow=receive;root.add(mesh);n++;meshes.push(mesh);}
   boxes.clear();geos.clear();return meshes;}
 };
 return C;
}

// ---------- painted textures ----------
export function tileTexture(){return canvasTex(256,256,(g,w,h)=>{g.fillStyle='#3a3e46';g.fillRect(0,0,w,h);const r=rng(5);
 for(let row=0;row<4;row++){const y0=row*64;for(let col=0;col<2;col++){const x0=col*128;
  // concave pan tile
  let gr=g.createLinearGradient(x0,0,x0+128,0);gr.addColorStop(0,'#2a2d34');gr.addColorStop(.5,'#3f444c');gr.addColorStop(1,'#2a2d34');g.fillStyle=gr;g.fillRect(x0,y0,128,64);
  // round cover tile ridge
  gr=g.createLinearGradient(x0+86,0,x0+128,0);gr.addColorStop(0,'#1d1f24');gr.addColorStop(.35,'#6a707a');gr.addColorStop(.6,'#4c525b');gr.addColorStop(1,'#1a1c20');g.fillStyle=gr;g.fillRect(x0+86,y0,42,64);
  // overlap shadow at the lower lip of each course
  gr=g.createLinearGradient(0,y0+48,0,y0+64);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.fillRect(x0,y0+48,128,16);
  g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x0,y0,128,3);}}
 for(let i=0;i<900;i++){g.fillStyle=`rgba(${r()<.5?'120,140,110':'0,0,0'},${r()*.08})`;g.fillRect(r()*w,r()*h,2+r()*6,2+r()*6);}});}
export function shojiTexture(){return canvasTex(256,256,(g,w,h)=>{const gr=g.createRadialGradient(128,140,10,128,128,190);gr.addColorStop(0,'#fff1d2');gr.addColorStop(1,'#e8c48c');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#3a2416';for(let i=0;i<=4;i++)g.fillRect(i*64-3,0,6,h);for(let j=0;j<=6;j++)g.fillRect(0,j*(h/6)-3,w,6);g.fillStyle='rgba(120,70,30,.12)';g.fillRect(0,h*.62,w,h*.38);});}
export function lanternTexture(kind){return canvasTex(128,128,(g,w,h)=>{g.fillStyle=kind==='red'?'#e2432c':'#f6ead2';g.fillRect(0,0,w,h);if(kind==='white'){g.fillStyle='#c8321f';g.fillRect(0,48,w,32);g.fillStyle='#f6ead2';g.beginPath();g.arc(64,64,12,0,7);g.fill();}else{g.fillStyle='#1c120e';g.font='bold 34px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif';g.textAlign='center';g.fillText('灯',64,78);}
 g.fillStyle='rgba(40,20,10,.55)';for(let y=0;y<h;y+=9)g.fillRect(0,y,w,2);},{wrap:true});}
export function nolenTexture(){return canvasTex(256,256,(g,w,h)=>{g.fillStyle='#24304c';g.fillRect(0,0,w,h);g.strokeStyle='#efe6d2';g.lineWidth=10;g.beginPath();g.arc(128,110,46,0,7);g.stroke();g.beginPath();g.moveTo(98,110);g.quadraticCurveTo(128,70,158,110);g.quadraticCurveTo(128,150,98,110);g.stroke();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,h-40,w,40);},{wrap:false});}
const JP='"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Songti SC",serif';
// Atlas of 16 vertical signboards (8 x 2 cells) and 8 horizontal plaques.
export function signAtlas(vertical,horizontal){
 const v=canvasTex(1024,1024,(g)=>{vertical.forEach((txt,i)=>{const cx=(i%8)*128,cy=Math.floor(i/8)*512;const dark=i%3===1;g.fillStyle=dark?'#1d1612':'#d9c49a';g.fillRect(cx,cy,128,512);g.strokeStyle=dark?'#a8823e':'#3a2416';g.lineWidth=8;g.strokeRect(cx+8,cy+8,112,496);g.fillStyle=dark?'#e8d6a8':'#1d1210';g.font=`76px ${JP}`;g.textAlign='center';const chars=[...txt];const step=Math.min(110,440/chars.length);chars.forEach((c,j)=>g.fillText(c,cx+64,cy+60+step*(j+.75)));});},{wrap:false});
 const hz=canvasTex(1024,512,(g)=>{horizontal.forEach((txt,i)=>{const cx=(i%2)*512,cy=Math.floor(i/2)*128;g.fillStyle=i===0?'#16100c':'#2a1812';g.fillRect(cx,cy,512,128);g.strokeStyle='#b8904a';g.lineWidth=7;g.strokeRect(cx+8,cy+8,496,112);g.fillStyle='#e9d39a';g.font=`84px ${JP}`;g.textAlign='center';g.fillText(txt,cx+256,cy+96);});},{wrap:false});
 const mv=new THREE.MeshStandardMaterial({map:v,roughness:.8,emissive:0x5a3c20,emissiveMap:v,emissiveIntensity:.35});
 const mh=new THREE.MeshStandardMaterial({map:hz,roughness:.7,emissive:0x6a4a20,emissiveMap:hz,emissiveIntensity:.45});
 const plane=(w,h,u0,v0,u1,v1)=>{const g=new THREE.PlaneGeometry(w,h);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));return g;};
 return {vertical:mv,horizontal:mh,vGeo:(i,w,h)=>{const c=i%16,col=c%8,row=Math.floor(c/8);return plane(w,h,col/8,1-(row+1)/2,(col+1)/8,1-row/2);},hGeo:(i,w,h)=>{const c=i%8,col=c%2,row=Math.floor(c/2);return plane(w,h,col/2,1-(row+1)/4,(col+1)/2,1-row/4);}};
}

// ---------- materials ----------
export function quarterMaterials(k){
 const tile=tileTexture();const bump=tile;const shoji=shojiTexture();
 const M={
  lacquer:k.surface('cedar',0xc0402e,1,.42),lattice:new THREE.MeshStandardMaterial({color:0x9a2a1e,roughness:.5}),
  black:k.surface('cedar',0x2c2522,1,.82),timber:k.surface('cedar',0x5a4535,1,.85),
  plaster:k.surface('plaster',0xd9ccb0,2,.95),plasterDirty:k.surface('plaster',0xa89a84,2,.95),plasterOchre:k.surface('plaster',0xc9a774,2,.95),plasterGrey:k.surface('plaster',0x9c9a98,2,.95),boardWall:k.surface('cedar',0x3e3028,2,.9),
  stone:k.surface('stone',0x7e7a80,2,.7),ishigaki:k.surface('rock',0x6a6670,1,.8),paving:k.surface('stone',0x5e5a64,14,.62),earth:k.surface('earth',0x5a4a40,16,.95),moss:k.surface('moss',0x6a7458,6,.95),
  tile:new THREE.MeshStandardMaterial({map:tile,bumpMap:bump,bumpScale:2.5,color:0xb8bcc8,roughness:.55,metalness:.15}),
  ridge:new THREE.MeshStandardMaterial({color:0x2a2c32,roughness:.5,metalness:.2}),
  soffit:new THREE.MeshStandardMaterial({color:0x2a201a,roughness:.9}),
  paperGlow:new THREE.MeshStandardMaterial({color:0x6a4a2a,emissive:0xffa75a,emissiveIntensity:1.15,roughness:1}),
  paperDim:new THREE.MeshStandardMaterial({color:0x4a3828,emissive:0xd98a4a,emissiveIntensity:.55,roughness:1}),
  shoji:new THREE.MeshStandardMaterial({map:shoji,emissive:0xffc070,emissiveMap:shoji,emissiveIntensity:.95,roughness:1}),
  interior:new THREE.MeshStandardMaterial({color:0x2a160e,emissive:0xb85a24,emissiveIntensity:.32,roughness:1}),
  lanternRed:new THREE.MeshStandardMaterial({map:lanternTexture('red'),emissive:0xff5a28,emissiveMap:lanternTexture('red'),emissiveIntensity:1.25,roughness:.9}),
  lanternWhite:new THREE.MeshStandardMaterial({map:lanternTexture('white'),emissive:0xffd29a,emissiveMap:lanternTexture('white'),emissiveIntensity:1.0,roughness:.9}),
  noren:new THREE.MeshStandardMaterial({map:nolenTexture(),side:THREE.DoubleSide,roughness:1}),
  norenRed:new THREE.MeshStandardMaterial({color:0x7a1c1a,side:THREE.DoubleSide,roughness:1}),
  rope:new THREE.MeshStandardMaterial({color:0x6a5a40,roughness:1}),
  bronze:new THREE.MeshStandardMaterial({color:0x8a6a3a,metalness:.75,roughness:.4}),
  water:new THREE.MeshStandardMaterial({color:0x0c0a10,roughness:.08,metalness:.4}),
  puddle:new THREE.MeshStandardMaterial({color:0x1c1418,roughness:.06,metalness:.25}),rut:new THREE.MeshStandardMaterial({color:0x2e241e,roughness:.8}),
  bamboo:k.surface('moss',0x8a8458,1,.7)
 };
 return M;
}

// ---------- roofs ----------
function grid(nx,nz,fn){const pos=[],uv=[],idx=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const [x,y,z,u,v]=fn(i/nx,j/nz);pos.push(x,y,z);uv.push(u,v);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function facing(g,up=true){const n=g.attributes.normal;let s=0;for(let i=0;i<n.count;i++)s+=n.getY(i);if((s>0)!==up){const ix=g.index.array;for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}g.computeVertexNormals();}return g;}
// A tiled slope from (z0,y0) at the wall/ridge down to the eave (z1,y1), width along X.
export function slope(C,M,{w,z0,y0,z1,y1,sori=.25,corner=.4,rafters=true,fascia=true,x=0}){
 const W=w/2,run=z1-z0,drop=y0-y1,len=Math.hypot(run,drop),nx=Math.max(4,Math.round(w/.7)),nz=7;
 const f=(u,t)=>{const xx=x-W+w*u,c=Math.pow(Math.abs(xx-x)/W,5);return [xx,y0-drop*t-sori*Math.sin(t*Math.PI)*.5+c*t*t*corner,z0+run*t,(xx-x)/1.1,t*len/.6];};
 const top=facing(grid(nx,nz,f),true);C.geo(M.tile,top);
 const under=facing(grid(nx,nz,(u,t)=>{const r=f(u,t);r[1]-=.1;return r;}),false);C.geo(M.soffit,under);
 const rx=Math.sign(run)*Math.atan2(drop,Math.abs(run));
 if(fascia){C.box(M.black,w,.2,.12,x,y1-.08,z1);C.box(M.ridge,w+.05,.09,.2,x,y1+.03,z1+.03*Math.sign(run));}
 if(rafters){const t0=.0,t1=1;for(let xx=x-W+.2;xx<x+W;xx+=.36){const ya=y0-drop*t0-.2,yb=y1-.16,za=z0+run*t0,zb=z1-.04*Math.sign(run);C.box(M.timber,.08,.1,Math.hypot(zb-za,yb-ya),xx,(ya+yb)/2,(za+zb)/2,rx);}}
}
// Gabled roof with ridge along X, eaves toward ±Z, gable ends with barge boards and plaster infill.
export function gableRoof(C,M,{x=0,y,z=0,ry=0,w,d,rise=2.1,over=1.1,side=.7,ridgeH=.42,gable=true,rafters=true,ornament=true}){
 C.with(x,0,z,ry,()=>{const run=d/2+over,W=w+side*2;
  for(const s of [-1,1])slope(C,M,{w:W,z0:0,y0:y+rise,z1:s*run,y1:y,sori:.28,corner:.45,rafters});
  C.box(M.ridge,W+.15,ridgeH,.55,0,y+rise+ridgeH/2-.08,0);C.box(M.tile,W+.1,.12,.7,0,y+rise-.02,0);
  if(ornament)for(const s of [-1,1]){C.box(M.ridge,.42,.78,.62,s*(W/2+.02),y+rise+.32,0);C.box(M.ridge,.2,.3,.66,s*(W/2+.05),y+rise+.78,0,0,0,s*.4);}
  if(gable)for(const s of [-1,1]){const yw=y+rise*over/run,a=Math.atan2(rise,run);
   const tri=new THREE.BufferGeometry();tri.setAttribute('position',new THREE.Float32BufferAttribute([0,yw-.4,-d/2,0,yw-.4,d/2,0,y+rise-.05,0],3));tri.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));tri.computeVertexNormals();C.geo(M.plaster,tri,s*(w/2-.02));C.geo(M.plaster,tri,s*(w/2-.02),0,0,0,Math.PI);
   for(const zs of [-1,1])C.box(M.black,.12,.34,Math.hypot(run,rise),s*(W/2+.04),y+rise/2-.04,zs*run/2,zs*a);
   C.box(M.black,.18,.2,d+.3,s*(w/2),yw-.42,0);C.box(M.timber,.1,.12,.12,s*(W/2+.07),y+rise-.2,0);}
 });
}

// ---------- props ----------
let _lanternGeo;export function lanternGeo(){if(_lanternGeo)return _lanternGeo;const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new THREE.Vector2(.5*(.62+.38*Math.sin(Math.PI*t)),t-.5));}_lanternGeo=new THREE.LatheGeometry(pts,14);return _lanternGeo;}
// Chochin: barrel of glowing paper with black caps and a hanging cord.
export function chochin(C,M,glows,x,y,z,{s=1,kind='red',cord=.4}={}){C.geo(kind==='red'?M.lanternRed:M.lanternWhite,lanternGeo(),x,y,z,0,0,0,.55*s,.75*s,.55*s);for(const d of [-1,1])C.box(M.black,.2*s,.06*s,.2*s,x,y+d*.39*s,z);if(cord>0)C.box(M.rope,.02,cord,.02,x,y+.4*s+cord/2,z);const w=C.local(x,y,z);glows.push([w.x,w.y,w.z,...(kind==='red'?[1,.42,.2]:[1,.78,.5]),3.2*s]);}
// Stone lantern-post on a timber column (andon post) lining an approach.
export function andonPost(C,M,glows,x,z,h=2.3){C.box(M.stone,.5,.25,.5,x,.12,z);C.box(M.black,.16,h,.16,x,h/2+.2,z);C.box(M.black,.62,.08,.62,x,h+.2,z);C.box(M.paperGlow,.46,.6,.46,x,h+.55,z);for(const a of [-1,1])for(const b of [-1,1])C.box(M.black,.06,.66,.06,x+a*.24,h+.55,z+b*.24);for(const yy of [h+.26,h+.84])C.box(M.black,.54,.05,.54,x,yy,z);C.box(M.black,.5,.03,.03,x,h+.55,z+.24);C.box(M.black,.03,.03,.5,x+.24,h+.55,z);C.geo(M.tile,new THREE.ConeGeometry(.52,.35,4),x,h+1.03,z,0,Math.PI/4);const w=C.local(x,h+.55,z);glows.push([w.x,w.y,w.z,1,.68,.38,3.4]);}
// Plaster compound wall with stone footing and a tiled coping roof.
export function wallRun(C,M,x0,x1,z,{h=3,ry=0}={}){const w=Math.abs(x1-x0),cx=(x0+x1)/2;C.box(M.ishigaki,w,.6,.9,cx,.3,z);C.box(M.plaster,w,h-.6,.5,cx,.6+(h-.6)/2,z);C.box(M.black,w,.16,.56,cx,.68,z);for(let x=Math.min(x0,x1)+1.2;x<Math.max(x0,x1);x+=2.4)C.box(M.black,.14,h-.7,.56,x,.6+(h-.7)/2,z);for(const s of [-1,1])slope(C,M,{w,x:cx,z0:z,y0:h+.55,z1:z+s*.75,y1:h+.1,sori:.05,corner:0,rafters:false});C.box(M.ridge,w,.16,.3,cx,h+.62,z);}

// ---------- teahouse ----------
// Facade at local z=0 facing +Z, body to z=-d. Two or three storeys: red koshi lattice over glowing paper,
// pent roof with rafters, balcony with lacquer railing and shoji, gabled tile roof, signs and lanterns.
export function teahouse(C,M,S,glows,{x,z,ry=0,w=9,d=9,floors=2,seed=1,sign=0,plaque=-1,latticeMat,shade=0,wall=null}){
 const r=rng(seed*977+13);latticeMat=latticeMat||M.lattice;
 C.with(x,0,z,ry,()=>{const y0=.32,H1=3.15,H2=2.7,H3=2.45;const n=Math.max(3,Math.round(w/1.75)),bw=w/n,ent=Math.floor(n/2);
  C.box(M.stone,w+.1,y0,d+.2,0,y0/2,-d/2+.05);C.box(M.stone,w,.14,.4,0,.07,.25);
  const total=H1+H2+(floors>2?H3:0)+.3;
  // side and rear walls (plaster with timber frames)
  for(const s of [-1,1]){C.box(wall||(shade?M.plasterDirty:M.plaster),.2,total,d,s*(w/2-.1),y0+total/2,-d/2);C.box(M.black,.24,total,.24,s*w/2,y0+total/2,0);C.box(M.black,.24,total,.24,s*w/2,y0+total/2,-d);for(let yy=y0+H1;yy<y0+total;yy+=H2)C.box(M.black,.22,.18,d,s*(w/2+.01),yy,-d/2);}
  C.box(wall||M.plaster,w,total,.2,0,y0+total/2,-d+.1);
  // ground floor bays
  for(let i=0;i<n;i++){const cx=-w/2+bw*(i+.5);C.box(M.black,.2,H1,.24,-w/2+bw*i,y0+H1/2,0);
   if(i===ent){C.box(M.interior,bw,H1-.4,.05,cx,y0+(H1-.4)/2,-2.6);C.box(M.timber,bw,.06,2.6,cx,y0+.03,-1.3);C.box(M.stone,bw*.8,.16,.5,cx,.08,.5);C.box(M.black,bw+.1,.22,.26,cx,y0+2.42,0);
    for(let j=0;j<3;j++){const g=new THREE.PlaneGeometry(bw/3-.03,1.05);const uv=g.attributes.uv;for(let q=0;q<uv.count;q++)uv.setX(q,(j+uv.getX(q))/3);C.geo(r()<.5?M.noren:M.norenRed,g,cx-bw/3+j*bw/3,y0+1.78,.12);}
    C.box(M.black,bw,.04,.04,cx,y0+2.3,.12);}
   else{const slats=Math.floor(bw/.105);for(let j=0;j<slats;j++)C.box(latticeMat,.045,2.15,.07,cx-bw/2+.1+j*(bw-.2)/(slats-1),y0+.28+1.075,.09);
    for(const yy of [y0+.24,y0+2.4,y0+1.55])C.box(latticeMat,bw,.07,.08,cx,yy,.1);C.box(r()<.25?M.paperDim:M.paperGlow,bw-.2,2.1,.03,cx,y0+1.33,-.06);C.box(M.black,bw,.24,.14,cx,y0+.12,.07);}}
  C.box(M.black,.2,H1,.24,w/2,y0+H1/2,0);C.box(M.black,w,.24,.28,0,y0+H1-.05,0);
  // pent roof (hisashi) over the street
  slope(C,M,{w:w+.3,z0:-.05,y0:y0+H1+.55,z1:1.35,y1:y0+H1-.05,sori:.04,corner:.1});
  for(let i=0;i<n;i++)if(i!==ent&&r()<.55)chochin(C,M,glows,-w/2+bw*(i+.5),y0+H1-.75,.95,{s:.85,kind:r()<.5?'red':'white',cord:.25});
  chochin(C,M,glows,-w/2+bw*(ent+.5)-bw*.42,y0+H1-.7,.95,{s:1,kind:'red',cord:.2});chochin(C,M,glows,-w/2+bw*(ent+.5)+bw*.42,y0+H1-.7,.95,{s:1,kind:'red',cord:.2});
  // upper storeys
  let yb=y0+H1+.25;for(let f=1;f<floors;f++){const H=f===1?H2:H3,setback=f===1?-.55:-.25;C.box(M.black,w,.24,d,0,yb-.12,-d/2);
   const n2=Math.max(3,Math.round(w/1.5)),b2=w/n2;for(let i=0;i<=n2;i++)C.box(M.black,.18,H,.2,-w/2+b2*i,yb+H/2,setback);
   for(let i=0;i<n2;i++){const cx=-w/2+b2*(i+.5);C.box(r()<.2?M.paperDim:M.shoji,b2-.16,H-.55,.04,cx,yb+(H-.55)/2+.12,setback-.02);}
   C.box(M.black,w,.2,.24,0,yb+H-.1,setback);
   if(f===1){// balcony with lacquered railing
    C.box(M.timber,w+.2,.12,1.55,0,yb-.02,.2);C.box(M.black,w+.2,.2,.14,0,yb-.08,.98);const rl=Math.floor((w+.2)/.13);for(let j=0;j<=rl;j++)C.box(M.lacquer,.04,.72,.05,-w/2-.1+j*(w+.2)/rl,yb+.42,.92);for(const yy of [yb+.82,yb+.12])C.box(M.lacquer,w+.24,.08,.1,0,yy,.92);for(let i=0;i<=n2;i+=Math.max(1,Math.floor(n2/2)))C.box(M.lacquer,.12,.95,.12,-w/2-.05+i*(w+.1)/n2,yb+.48,.92);}
   else{for(let j=0;j<Math.floor(w/.16);j++)C.box(M.black,.05,H*.38,.06,-w/2+.2+j*.16,yb+H*.45,setback+.06);}
   if(f<floors-1)slope(C,M,{w:w+.2,z0:setback-.05,y0:yb+H+.35,z1:.75,y1:yb+H-.15,sori:.03,corner:.08,rafters:false});
   yb+=H;}
  gableRoof(C,M,{y:yb+.1,w,d,rise:1.9+r()*.5,over:1.15,side:.55,z:-d/2});
  // signs
  if(sign>=0){const g=S.vGeo(sign,.55,2.05);C.geo(S.vertical,g,-w/2+bw*(ent+.5)+bw*.5+.45,y0+1.35,.62);C.box(M.black,.65,2.2,.08,-w/2+bw*(ent+.5)+bw*.5+.45,y0+1.35,.56);C.box(M.black,.08,.4,.08,-w/2+bw*(ent+.5)+bw*.5+.45,y0+.1,.56);}
  if(plaque>=0){C.geo(S.horizontal,S.hGeo(plaque,2.4,.6),0,y0+H1+.95,.32,-.25);}
 });
}

// ---------- glow points: soft additive halos for every lamp, one draw call ----------
export function glowPoints(root,list,renderer){
 const n=list.length,pos=new Float32Array(n*3),col=new Float32Array(n*3),size=new Float32Array(n),seed=new Float32Array(n);
 list.forEach((g,i)=>{pos.set(g.slice(0,3),i*3);col.set(g.slice(3,6),i*3);size[i]=g[6];seed[i]=(i*.6180339)%1;});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('gcolor',new THREE.BufferAttribute(col,3));geo.setAttribute('gsize',new THREE.BufferAttribute(size,1));geo.setAttribute('gseed',new THREE.BufferAttribute(seed,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},scale:{value:500},strength:{value:1}},
  vertexShader:'attribute vec3 gcolor;attribute float gsize,gseed;uniform float time,scale;varying vec3 vC;varying float vF;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float fl=.88+.12*sin(time*(4.+gseed*5.)+gseed*40.)*sin(time*1.9+gseed*13.);gl_PointSize=min(900.,gsize*scale/max(.5,-mv.z)*fl);vC=gcolor*fl;float d=-mv.z;vF=exp(-d*.012)*smoothstep(.3,2.,d);}',
  fragmentShader:'uniform float strength;varying vec3 vC;varying float vF;void main(){float r=length(gl_PointCoord-.5)*2.;float a=exp(-r*r*3.5)*.5+exp(-r*r*30.)*.6;a*=1.-smoothstep(.85,1.,r);gl_FragColor=vec4(vC*a*vF*strength,1.);}'});
 mat.uniforms.strength.value=2.4;const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=5;root.add(pts);const v=new THREE.Vector2();
 return {points:pts,update(t,camera){mat.uniforms.time.value=t;renderer.getDrawingBufferSize(v);mat.uniforms.scale.value=v.y*camera.projectionMatrix.elements[5]*.5;}};
}

// ---------- camera-facing (Y-locked) billboards for fire and smoke ----------
const NOISE=`float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*n2(p);p*=2.07;a*=.5;}return v;}`;
function billboardGeo(list){const n=list.length,P=[],Cn=[],D=[],Sd=[],U=[],I=[];list.forEach((b,i)=>{for(const [cx,cy] of [[-.5,0],[.5,0],[.5,1],[-.5,1]]){P.push(b.x,b.y,b.z);Cn.push(cx,cy);D.push(b.w,b.h);Sd.push(b.seed??(i*.37)%1);U.push(cx+.5,cy);}const a=i*4;I.push(a,a+1,a+2,a,a+2,a+3);});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('corner',new THREE.Float32BufferAttribute(Cn,2));g.setAttribute('dims',new THREE.Float32BufferAttribute(D,2));g.setAttribute('bseed',new THREE.Float32BufferAttribute(Sd,1));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);return g;}
const BB_VERT=`attribute vec2 corner,dims;attribute float bseed;uniform float time;varying vec2 vUv;varying float vSeed;varying float vDist;
void main(){vec3 c=(modelMatrix*vec4(position,1.)).xyz;vec3 toCam=cameraPosition-c;toCam.y=0.;vec3 right=normalize(vec3(toCam.z,0.,-toCam.x)+vec3(1e-4,0.,0.));
 float sway=sin(time*2.3+bseed*31.+corner.y*2.)*.12*corner.y*dims.x;vec3 wp=c+right*(corner.x*dims.x+sway)+vec3(0.,corner.y*dims.y,0.);vUv=uv;vSeed=bseed;vec4 mv=viewMatrix*vec4(wp,1.);vDist=-mv.z;gl_Position=projectionMatrix*mv;}`;
export function flames(root,list){const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:BB_VERT,
 fragmentShader:`uniform float time;varying vec2 vUv;varying float vSeed;varying float vDist;${NOISE}
 void main(){vec2 uv=vUv;float n=fbm(vec2(uv.x*2.6+vSeed*17.,uv.y*2.2-time*(1.6+vSeed*.8)));float m=fbm(vec2(uv.x*5.5-vSeed*9.,uv.y*4.5-time*3.1));
  float w=1.-abs(uv.x-.5)*2.;float shape=w*1.3-uv.y*1.15+(n-.5)*1.1+(m-.5)*.45+.12;float f=smoothstep(0.,.3,shape);float core=smoothstep(.32,.75,shape);
  vec3 col=mix(vec3(.55,.07,.01),vec3(1.,.42,.06),f);col=mix(col,vec3(1.,.86,.5),core);float a=f*smoothstep(0.,.08,uv.y+.02);float fogf=exp(-vDist*.006);gl_FragColor=vec4(col*a*1.6*fogf,a);}`});
 const mesh=new THREE.Mesh(billboardGeo(list),mat);mesh.frustumCulled=false;mesh.renderOrder=6;root.add(mesh);return {mesh,update(t){mat.uniforms.time.value=t;}};}
export function smoke(root,list,{color=[.09,.06,.07],under=[.7,.28,.1],opacity=.55}={}){const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,uniforms:{time:{value:0},color:{value:new THREE.Vector3(...color)},under:{value:new THREE.Vector3(...under)},opacity:{value:opacity}},vertexShader:BB_VERT,
 fragmentShader:`uniform float time,opacity;uniform vec3 color,under;varying vec2 vUv;varying float vSeed;varying float vDist;${NOISE}
 void main(){vec2 uv=vUv;float widen=.35+uv.y*.65;float x=(uv.x-.5)/widen;float n=fbm(vec2(x*2.+vSeed*13.,uv.y*2.6-time*.18-vSeed*5.));float m=fbm(vec2(x*4.1-vSeed*3.,uv.y*5.-time*.32));
  float body=(1.-smoothstep(.15,.5,abs(x)+(n-.5)*.45))*smoothstep(0.,.15,uv.y)*(1.-smoothstep(.65,1.,uv.y));float a=body*(.55+m*.6)*opacity;vec3 c=mix(color,under,pow(1.-uv.y,2.5)*.9+(m-.5)*.1);gl_FragColor=vec4(c,a);}`});
 const mesh=new THREE.Mesh(billboardGeo(list),mat);mesh.frustumCulled=false;mesh.renderOrder=4;root.add(mesh);return {mesh,update(t){mat.uniforms.time.value=t;}};}

// ---------- motes: falling petals or rising embers, computed entirely on the GPU ----------
export function motes(root,renderer,{count=2500,area=[60,26,60],speed=.8,rise=false,kind='petal',size=.09,drift=1.4,base=0,anchor=null,fade=null,colorA=[.95,.66,.76],colorB=[1,.86,.9],seed=3}={}){
 const r=rng(seed),s=new Float32Array(count*3);for(let i=0;i<s.length;i++)s[i]=r();const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));g.setAttribute('mseed',new THREE.BufferAttribute(s,3));
 const ember=kind==='ember';const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:ember?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{time:{value:0},cam:{value:new THREE.Vector3()},area:{value:new THREE.Vector3(...area)},speed:{value:speed},drift:{value:drift},base:{value:base},scale:{value:500},size:{value:size},anchor:{value:new THREE.Vector3(...(anchor||[0,0,0]))},anchored:{value:anchor?1:0},fade:{value:fade||area[0]*.5},colA:{value:new THREE.Vector3(...colorA)},colB:{value:new THREE.Vector3(...colorB)}},
  vertexShader:`attribute vec3 mseed;uniform float time,speed,drift,base,scale,size,anchored,fade;uniform vec3 cam,area,anchor,colA,colB;varying float vRot;varying vec3 vCol;varying float vA;
  void main(){vec3 p;float dir=${rise?'1.':'-1.'};float y=mod(mseed.y*area.y+dir*time*speed*(.6+mseed.x*.8),area.y);
   float sx=sin(time*.9+mseed.z*40.)*drift+sin(time*.37+mseed.x*20.)*drift*.6;float sz=cos(time*.7+mseed.x*33.)*drift;
   if(anchored>.5){p=anchor+vec3((mseed.x-.5)*area.x+sx*.15,mseed.y*area.y,(mseed.z-.5)*area.z+sz*.15);}
   else{p.x=mod(mseed.x*area.x+sx-cam.x,area.x)-area.x*.5+cam.x;p.z=mod(mseed.z*area.z+sz-cam.z,area.z)-area.z*.5+cam.z;p.y=base+y;}
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float d=-mv.z;gl_PointSize=min(64.,size*(.6+mseed.z*.8)*scale/max(.3,d));
   vRot=mseed.x*6.28+time*(${ember?'0.':'1.2'}+mseed.y*2.);vCol=mix(colA,colB,mseed.z);vA=(1.-smoothstep(fade*.64,fade,d))*${rise?'(1.-smoothstep(.55,1.,y/area.y))*smoothstep(0.,.08,y/area.y)':'1.'}*(${ember?'.6+.4*sin(time*9.+mseed.z*50.)':'1.'});}`,
  fragmentShader:`varying float vRot;varying vec3 vCol;varying float vA;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vRot),s=sin(vRot);p=mat2(c,-s,s,c)*p;
   ${ember?'float r=length(p)*2.;float a=exp(-r*r*6.)*vA;gl_FragColor=vec4(vCol*a*1.6,a);':'vec2 q=p*vec2(2.1,3.4);float r=length(q);float notch=smoothstep(.0,.12,abs(p.x)+(.5+p.y)*.2-.02);float a=(1.-smoothstep(.75,.95,r))*vA;if(a<.05)discard;gl_FragColor=vec4(vCol*(.75+.25*q.y),a*.92);'}}`});
 const pts=new THREE.Points(g,mat);pts.frustumCulled=false;root.add(pts);const v=new THREE.Vector2();
 return {points:pts,update(t,camera){mat.uniforms.time.value=t;if(camera)mat.uniforms.cam.value.copy(camera.position);renderer.getDrawingBufferSize(v);mat.uniforms.scale.value=v.y*(camera?camera.projectionMatrix.elements[5]:1.8)*.5;}};
}

// ---------- organic: tapered tubes, willow and cherry ----------
export function taperTube(points,r0,r1,radial=8,seg=null){const curve=new THREE.CatmullRomCurve3(points);seg=seg||Math.max(6,points.length*4);const fr=curve.computeFrenetFrames(seg,false);const P=[],U=[],I=[];
 for(let i=0;i<=seg;i++){const t=i/seg,c=curve.getPointAt(t),rad=r0+(r1-r0)*t;for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,n=fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));const k=1+.08*Math.sin(a*3+t*9);P.push(c.x+n.x*rad*k,c.y+n.y*rad*k,c.z+n.z*rad*k);U.push(j/radial*2,t*4);}}
 for(let i=0;i<seg;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;I.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return g;}
export function willowAtlas(){return canvasTex(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);const r=rng(17);
 // left half: a hanging strand of slender leaves
 for(let y=0;y<h;y+=5){const cx=64+Math.sin(y*.05)*3;g.strokeStyle='rgba(70,80,40,1)';g.lineWidth=2;g.beginPath();g.moveTo(cx,y);g.lineTo(cx,y+6);g.stroke();
  for(const s of [-1,1]){if(r()<.25)continue;const len=18+r()*26,ang=s*(.35+r()*.5);const gg=96+r()*40|0;g.fillStyle=`rgb(${66+r()*26|0},${gg},${84+r()*22|0})`;g.save();g.translate(cx,y);g.rotate(ang);g.beginPath();g.ellipse(0,len/2,3+r()*1.5,len/2,0,0,7);g.fill();g.restore();}}
 // right top: paper fortune
 g.fillStyle='#f2ead8';g.fillRect(150,30,80,180);g.fillStyle='rgba(60,40,30,.6)';for(let i=0;i<6;i++)g.fillRect(170+i*10,50,3,120+r()*20);g.fillStyle='#d8ccb2';g.fillRect(150,110,80,8);
 // right bottom: red ribbon
 g.fillStyle='#b8241c';g.fillRect(170,280,40,200);});}
// Weeping willow: tapered trunk and limbs, hundreds of animated drooping strands with tied fortunes.
export function willow(root,k,M,{x,z,seed=9,height=8.5,strands=420,fortunes=160}){
 const r=rng(seed),C=collector(),bark=k.surface('cedar',0x4a4034,1,.95);const tips=[];
 C.geo(bark,taperTube([new THREE.Vector3(x,0,z),new THREE.Vector3(x+.3,2.2,z+.1),new THREE.Vector3(x+.1,4.2,z-.2),new THREE.Vector3(x-.2,5.6,z)],.62,.32,10,20));
 for(let i=0;i<9;i++){const a=i/9*6.28+r()*.5,y0=3.6+r()*1.6,reach=2.6+r()*2.4;const p0=new THREE.Vector3(x+Math.cos(a)*.2,y0,z+Math.sin(a)*.2),p1=new THREE.Vector3(x+Math.cos(a)*reach*.5,y0+1.6+r(),z+Math.sin(a)*reach*.5),p2=new THREE.Vector3(x+Math.cos(a)*reach,height-.6+r()*1.2,z+Math.sin(a)*reach),p3=new THREE.Vector3(x+Math.cos(a)*(reach+1.2),height-1.4,z+Math.sin(a)*(reach+1.2));C.geo(bark,taperTube([p0,p1,p2,p3],.2,.05,6,12));tips.push([p1,p2,p3]);}
 C.build(root);
 // strands: two crossed ribbons each; attribute sway=(hang 0..1, seed)
 const P=[],U=[],S=[],I=[];let v=0;const quad=(pts,wd,u0,u1,sd,v0=0,v1=1)=>{for(const rot of [0,Math.PI/2]){const dx=Math.cos(rot)*wd/2,dz=Math.sin(rot)*wd/2;pts.forEach(([px,py,pz,hang],j)=>{const t=j/(pts.length-1);P.push(px-dx,py,pz-dz,px+dx,py,pz+dz);U.push(u0,v1-(v1-v0)*t,u1,v1-(v1-v0)*t);S.push(hang,sd,hang,sd);});for(let j=0;j<pts.length-1;j++){const a=v+j*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}v+=pts.length*2;}};
 for(let i=0;i<strands;i++){const tip=tips[i%tips.length],t=r();const b=new THREE.CatmullRomCurve3(tip).getPoint(.3+t*.7);b.x+=(r()-.5)*.8;b.z+=(r()-.5)*.8;const len=Math.min(b.y-.5,3.5+r()*4.2);const pts=[];for(let j=0;j<=8;j++){const q=j/8;pts.push([b.x+q*q*(r()-.5)*.3,b.y-len*q+q*.1,b.z,q]);}quad(pts,.2+r()*.1,0,.5,r());
  if(i<fortunes){const q=.55+r()*.4,p=pts[Math.round(q*8)];const fy=p[1];quad([[p[0],fy+.09,p[2]+.02,q],[p[0],fy-.09,p[2]+.02,q+.02]],.06,.58,.92,r(),.58,.95);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('sway',new THREE.Float32BufferAttribute(S,2));g.setIndex(I);g.computeVertexNormals();
 const time={value:0};const mat=new THREE.MeshStandardMaterial({map:willowAtlas(),alphaTest:.45,side:THREE.DoubleSide,roughness:.9,color:0x9fb4b0,emissive:0x04070a});
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=time;sh.vertexShader='uniform float uT;attribute vec2 sway;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat hh=sway.x*sway.x;transformed.x+=(sin(uT*1.1+sway.y*6.28+position.y*.4)*.35+sin(uT*2.3+sway.y*20.)*.08)*hh;transformed.z+=cos(uT*.8+sway.y*9.)*.25*hh;');};mat.customProgramCacheKey=()=>'quarter-willow';
 const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return {update(t){time.value=t;},trunk:[x,z,.75]};
}
export function blossomTexture(){return canvasTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const r=rng(23);g.strokeStyle='rgba(40,28,24,1)';g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(128,128);g.lineTo(128+(r()-.5)*220,128+(r()-.5)*220);g.stroke();}
 for(let i=0;i<620;i++){const a=r()*6.28,lobe=.72+.28*Math.sin(a*3+1)+.15*Math.sin(a*7),d=Math.pow(r(),.75)*104*lobe;const x=128+Math.cos(a)*d,y=128+Math.sin(a)*d*.85;const pk=r();g.fillStyle=pk<.12?'#fff4f6':pk<.45?'#f6c4d2':pk<.85?'#e9a0b8':'#c87890';g.beginPath();g.arc(x,y,3+r()*5,0,7);g.fill();if(r()<.3){g.fillStyle='#b8485c';g.beginPath();g.arc(x,y,1.3,0,7);g.fill();}}},{wrap:false});}
// Cherry tree: gnarled tapered limbs carrying crossed blossom cards (wind-animated).
export function cherry(C,k,M,blossomMat,x,z,{seed=1,height=5.5,spread=3.2,cards=26}={}){const r=rng(seed),bark=M.cherryBark||(M.cherryBark=k.surface('cedar',0x3a2c28,1,.95));
 const trunkTop=new THREE.Vector3(x+(r()-.5)*.6,height*.45,z+(r()-.5)*.6);C.geo(bark,taperTube([new THREE.Vector3(x,0,z),new THREE.Vector3(x+(r()-.5)*.3,height*.22,z),trunkTop],.26,.18,8,10));
 const ends=[];for(let i=0;i<6;i++){const a=i/6*6.28+r()*.6,rr=spread*(.6+r()*.4);const p2=new THREE.Vector3(x+Math.cos(a)*rr*.55,height*(.65+r()*.15),z+Math.sin(a)*rr*.55),p3=new THREE.Vector3(x+Math.cos(a)*rr,height*(.78+r()*.2),z+Math.sin(a)*rr);C.geo(bark,taperTube([trunkTop,p2,p3],.13,.04,6,8));ends.push(p2,p3);}
 for(let i=0;i<cards;i++){const e=ends[i%ends.length],s=1.6+r()*1.4;const px=e.x+(r()-.5)*1.6,py=e.y+(r()-.3)*1.1,pz=e.z+(r()-.5)*1.6;const a=r()*3.14;for(let c=0;c<3;c++)C.geo(blossomMat,new THREE.PlaneGeometry(s,s*.85),px,py,pz,(r()-.5)*.5,a+c*1.047,(r()-.5)*.4);}
 return [x,z,.45];}

// ---------- fire-watch tower (hinomi-yagura): ladder tower, braced legs, roofed lookout, bell hook ----------
export function fireTower(C,M,glows,x,z,{h=20,bell=false,scorched=false}={}){const wood=scorched?M.black:M.timber;const b0=2.2,b1=1.25;
 C.box(M.stone,5.4,.5,5.4,x,.25,z);
 for(const sx of [-1,1])for(const sz of [-1,1])C.beam(wood,[x+sx*b0,.4,z+sz*b0],[x+sx*b1,h,z+sz*b1],.3);
 for(let y=3;y<h;y+=3.2){const f=y/h,f2=Math.min(1,(y+3.2)/h);const bb=b0+(b1-b0)*f,bb2=b0+(b1-b0)*f2;
  for(const s of [-1,1]){C.beam(wood,[x-bb,y,z+s*bb],[x+bb,y,z+s*bb],.16);C.beam(wood,[x+s*bb,y,z-bb],[x+s*bb,y,z+bb],.16);
   if(y+3.2<h){C.beam(wood,[x-bb,y,z+s*bb],[x+bb2,y+3.2,z+s*bb2],.09);C.beam(wood,[x+bb,y,z+s*bb],[x-bb2,y+3.2,z+s*bb2],.09);C.beam(wood,[x+s*bb,y,z-bb],[x+s*bb2,y+3.2,z+bb2],.09);C.beam(wood,[x+s*bb,y,z+bb],[x+s*bb2,y+3.2,z-bb2],.09);}}}
 // ladder up the south face
 for(const s of [-1,1])C.beam(wood,[x+s*.35,.5,z+b0+.25],[x+s*.35,h,z+b1+.25],.08);for(let y=.9;y<h;y+=.38){const f=y/h,zz=z+b0+(b1-b0)*f+.25;C.box(wood,.7,.05,.05,x,y,zz);}
 // lookout platform, railing, roof and bell
 C.box(M.timber,3.6,.18,3.6,x,h+.1,z);for(const s of [-1,1]){C.box(M.lacquer,3.6,.07,.07,x,h+1.05,z+s*1.78);C.box(M.lacquer,.07,.07,3.6,x+s*1.78,h+1.05,z);}
 for(const sx of [-1,1])for(const sz of [-1,1])C.box(wood,.14,2.6,.14,x+sx*1.65,h+1.4,z+sz*1.65);
 C.geo(M.tile,new THREE.ConeGeometry(2.9,1.6,4,1,true),x,h+3.35,z,0,Math.PI/4);C.geo(M.soffit,new THREE.ConeGeometry(2.85,1.55,4,1,true),x,h+3.3,z,Math.PI,Math.PI/4);C.box(M.ridge,.3,.7,.3,x,h+4.3,z);
 C.box(M.bronze,.06,.5,.06,x,h+2.35,z);C.geo(M.bronze,new THREE.TorusGeometry(.12,.025,6,12),x,h+2.05,z);
 if(bell)C.geo(M.bronze,new THREE.LatheGeometry([new THREE.Vector2(.0,.0),new THREE.Vector2(.32,0),new THREE.Vector2(.28,.15),new THREE.Vector2(.22,.5),new THREE.Vector2(.08,.6)],12),x,h+1.35,z);
 const w=C.local(x,h+1.6,z);glows.push([w.x,w.y,w.z,1,.6,.3,2]);return [x,z,3];}

// ---------- street props along house fronts: fire-bucket pyramids, benches, lit standing signs, barrels, potted pines ----------
export function streetProps(C,M,S,glows,list,r){const obs=[];for(const [kind,x,z,ry=0] of list){C.with(x,0,z,ry,()=>{
 if(kind==='buckets'){C.box(M.timber,1.1,.5,.7,0,.25,0);let n=0;for(const [row,cnt] of [[0,3],[1,2],[2,1]])for(let i=0;i<cnt;i++){C.geo(M.lacquer,new THREE.CylinderGeometry(.17,.14,.3,12),(i-(cnt-1)/2)*.36,.65+row*.3,0);n++;}}
 else if(kind==='bench'){C.box(M.norenRed,1.9,.05,.8,0,.5,0);C.box(M.timber,1.8,.08,.7,0,.45,0);for(const a of [-.8,.8])for(const b of [-.28,.28])C.box(M.black,.07,.45,.07,a,.22,b);C.geo(M.lacquer,new THREE.CylinderGeometry(.04,.04,2.4,8),.5,1.2,-.2);C.geo(M.norenRed,new THREE.ConeGeometry(1.2,.5,16,1,true),.5,2.35,-.2);}
 else if(kind==='kanban'){C.box(M.black,.5,1.15,.5,0,.58,0);C.box(M.paperGlow,.42,.8,.42,0,.7,0);C.geo(S.vertical,S.vGeo(Math.floor(r()*16),.36,.75),0,.7,.215);C.box(M.black,.56,.06,.56,0,1.18,0);const w=C.local(0,.75,0);glows.push([w.x,w.y,w.z,1,.65,.35,2.2]);}
 else if(kind==='barrel'){C.geo(M.timber,new THREE.CylinderGeometry(.42,.38,.95,16),0,.48,0);for(const y of [.15,.5,.82])C.geo(M.black,new THREE.TorusGeometry(.41,.025,4,18),0,y,0,Math.PI/2);C.geo(M.water,new THREE.CircleGeometry(.36,16),0,.9,0,-Math.PI/2);}
 else if(kind==='pine'){C.geo(M.stone,new THREE.CylinderGeometry(.4,.32,.5,10),0,.25,0);const g=M.pineMat||(M.pineMat=new THREE.MeshStandardMaterial({color:0x2c4430,roughness:1,flatShading:true}));for(let i=0;i<4;i++)C.geo(g,new THREE.SphereGeometry(.35+r()*.15,7,5),(r()-.5)*.6,.9+i*.32,(r()-.5)*.6,0,0,0,1.4,.45,1.4);C.geo(M.timber,new THREE.CylinderGeometry(.04,.06,1.5,6),0,1.1,0,.2,0,.15);}
 });obs.push([x,z,kind==='bench'?1.05:kind==='buckets'?.7:.5]);}return obs;}

// ---------- billowing smoke: soft round puffs that rise, swell, drift and fade on a loop ----------
// Each column is many puffs at staggered phases; every edge of every puff falls off in alpha.
export function smokePuffs(root,columns,{color=[.08,.055,.06],under=[.75,.3,.1],opacity=.5,puffs=7,seed=91}={}){const r=rng(seed),P=[],Cn=[],D=[],Sd=[],U=[],I=[];let i=0;
 for(const c of columns)for(let q=0;q<puffs;q++){const sz=c.size*(.7+r()*.6),ph=(q+r()*.6)/puffs,sx=(r()-.5)*c.size*.4,sz2=(r()-.5)*c.size*.4;for(const [cx,cy] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){P.push(c.x+sx,c.y,c.z+sz2);Cn.push(cx,cy);D.push(sz,c.rise);Sd.push(ph,r());U.push(cx+.5,cy+.5);}const a=i*4;I.push(a,a+1,a+2,a,a+2,a+3);i++;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('corner',new THREE.Float32BufferAttribute(Cn,2));g.setAttribute('dims',new THREE.Float32BufferAttribute(D,2));g.setAttribute('pseed',new THREE.Float32BufferAttribute(Sd,2));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{time:{value:0},color:{value:new THREE.Vector3(...color)},under:{value:new THREE.Vector3(...under)},opacity:{value:opacity}},
  vertexShader:`attribute vec2 corner,dims,pseed;uniform float time;varying vec2 vUv;varying float vLife,vSeed;
  void main(){float life=fract(time*(.018+pseed.y*.012)+pseed.x);vec3 c=(modelMatrix*vec4(position,1.)).xyz;c.y+=life*dims.y;c.x+=sin(life*3.+pseed.y*20.)*dims.x*.35+life*dims.y*.18;c.z+=cos(life*2.+pseed.y*11.)*dims.x*.25;
   float s=dims.x*(.55+life*1.6);vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
   float rot=pseed.y*6.28+life*1.5;vec2 cr=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*corner;vec3 wp=c+(right*cr.x+up*cr.y)*s;vUv=uv;vLife=life;vSeed=pseed.y;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
  fragmentShader:`uniform float opacity;uniform vec3 color,under;varying vec2 vUv;varying float vLife,vSeed;${NOISE}
  void main(){vec2 p=vUv-.5;float n=fbm(p*3.2+vec2(vSeed*17.,vLife*1.4));float m=fbm(p*7.+vec2(-vLife*2.,vSeed*5.));float r=length(p)*2.;float d=r+(n-.5)*.5+(m-.5)*.2;
   float a=(1.-smoothstep(.2,.85,d))*(1.-smoothstep(.55,1.,r))*sin(vLife*3.14159)*opacity*(.6+m*.6);vec3 c=mix(under,color,smoothstep(0.,.25,vLife))*(.8+n*.4);gl_FragColor=vec4(c,a);}`});
 const mesh=new THREE.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=4;root.add(mesh);return {mesh,update(t){mat.uniforms.time.value=t;}};}
