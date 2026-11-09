// Mistweave Ridge shared pieces: thatch, glowing silk threads, mist, cocoons, farm architecture.
// Everything is code-built; canvas textures are procedural and generated at load time.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bakeStatic } from '../../assetlib.js';
import { windMaterial, windTime as windTimeRef } from '../../detail-world.js';

export const MOON=[-.42,.3,-.86];
export function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

function canvasTexture(w,h,draw,{srgb=true,repeat=[1,1]}={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
const cache=new Map();const once=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};

// Thick straw thatch: streaks run down the slope (texture u), course bands every layer, moss at the eave (u=1).
export function thatchMaterial(tint=0xffffff){
 const tex=once('thatch',()=>{const r=rng(91);const draw=(bump)=>(g,w,h)=>{g.fillStyle=bump?'#777':'#6d5d42';g.fillRect(0,0,w,h);
   for(let i=0;i<9000;i++){const y=r()*h,x=r()*w,len=20+r()*70,l=bump?90+r()*120:0;g.strokeStyle=bump?`rgb(${l},${l},${l})`:['#8a7652','#5d4d35','#9b8761','#4c3f2c','#7b6a4b','#a29270'][Math.floor(r()*6)];g.globalAlpha=.55+r()*.45;g.lineWidth=.6+r()*1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+len,y+(r()-.5)*5);g.stroke();}
   g.globalAlpha=1;for(let b=0;b<8;b++){const x=b*w/8+(r()-.5)*8;const grad=g.createLinearGradient(x-14,0,x+6,0);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.8,bump?'rgba(0,0,0,.55)':'rgba(25,18,10,.5)');grad.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grad;g.fillRect(x-14,0,20,h);}
   if(!bump){const m=g.createLinearGradient(w*.55,0,w,0);m.addColorStop(0,'rgba(60,80,40,0)');m.addColorStop(1,'rgba(52,74,38,.75)');g.fillStyle=m;g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(${50+r()*30},${76+r()*30},${36+r()*20},${.3+r()*.4})`;const x=w*(.7+r()*.3),y=r()*h;g.beginPath();g.ellipse(x,y,4+r()*14,3+r()*10,0,0,7);g.fill();}
    const top=g.createLinearGradient(0,0,w*.15,0);top.addColorStop(0,'rgba(30,24,16,.6)');top.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=top;g.fillRect(0,0,w*.15,h);}
  };return {map:canvasTexture(1024,512,draw(false)),bump:canvasTexture(1024,512,draw(true),{srgb:false})};});
 const m=new THREE.MeshStandardMaterial({map:tex.map,bumpMap:tex.bump,bumpScale:3.5,color:tint,roughness:1});return m;
}
// End-grain of cut thatch at the eaves and gables: dense dark stubble.
export function thatchEdgeMaterial(){return once('thatch-edge',()=>{const r=rng(5);const map=canvasTexture(256,256,(g,w,h)=>{g.fillStyle='#3b3022';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=40+r()*70;g.fillStyle=`rgb(${v+18},${v+8},${v-8})`;g.fillRect(r()*w,r()*h,1+r()*2,4+r()*12);}});return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:2,roughness:1,color:0xb0a080});});}
// Weathered vertical board siding for gables.
export function boardMaterial(k){return once('boards',()=>{const r=rng(17);const map=canvasTexture(512,512,(g,w,h)=>{for(let x=0;x<w;x+=32){const v=60+r()*30;g.fillStyle=`rgb(${v+20},${v+8},${v-6})`;g.fillRect(x,0,32,h);g.fillStyle='rgba(20,14,8,.7)';g.fillRect(x,0,2,h);for(let i=0;i<40;i++){g.fillStyle=`rgba(${r()<.5?20:120},${r()<.5?14:100},10,.15)`;g.fillRect(x+2+r()*28,r()*h,1,20+r()*80);}}const s=g.createLinearGradient(0,h,0,0);s.addColorStop(0,'rgba(10,12,8,.45)');s.addColorStop(.3,'rgba(0,0,0,0)');g.fillStyle=s;g.fillRect(0,0,w,h);});return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:1.2,roughness:.95,color:0xb8a890});});}
// Shoji/lattice glow: warm paper with a kumiko grid baked in; dim variant for unlit rooms.
export function paperGlow(lit=true){return once('paper'+lit,()=>{const map=canvasTexture(256,256,(g,w,h)=>{const grad=g.createRadialGradient(w/2,h*.6,10,w/2,h/2,w*.75);grad.addColorStop(0,lit?'#ffe2a6':'#6d6658');grad.addColorStop(1,lit?'#d98a3c':'#3e3a34');g.fillStyle=grad;g.fillRect(0,0,w,h);g.fillStyle='#24180e';for(let i=0;i<=4;i++){g.fillRect(i*w/4-3,0,6,h);}for(let j=0;j<=6;j++)g.fillRect(0,j*h/6-2,w,4);});return lit?new THREE.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:1.25,roughness:1}):new THREE.MeshStandardMaterial({map,roughness:1});});}
export function leafTexture(hue='#41532e'){return once('leaf'+hue,()=>{const r=rng(33);return canvasTexture(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<220;i++){const x=w*.5+(r()-.5)*w*.85*Math.sqrt(r()),y=h*.5+(r()-.5)*h*.85*Math.sqrt(r());const c=new THREE.Color(hue).offsetHSL((r()-.5)*.04,(r()-.5)*.1,(r()-.5)*.12);g.fillStyle=`#${c.getHexString()}`;g.save();g.translate(x,y);g.rotate(r()*6.28);g.beginPath();g.ellipse(0,0,4+r()*5,9+r()*7,0,0,7);g.fill();g.strokeStyle='rgba(255,255,230,.12)';g.beginPath();g.moveTo(0,-10);g.lineTo(0,10);g.stroke();g.restore();}});});}
export function glowTexture(){return once('glow',()=>canvasTexture(128,128,(g,w,h)=>{const grad=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.25,'rgba(255,255,255,.45)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);}));}

// Soft additive glow points (lamp halos, cocoon light, drifting memories) in one draw call.
export function glowPoints(root,items,{pulse=0,rise=0,height=0,sway=0}={}){
 const n=items.length,p=new Float32Array(n*3),c=new Float32Array(n*3),s=new Float32Array(n),ph=new Float32Array(n);const col=new THREE.Color();
 items.forEach(([x,y,z,size,color,phase],i)=>{p.set([x,y,z],i*3);col.set(color);c.set([col.r,col.g,col.b],i*3);s[i]=size;ph[i]=phase??i*1.37;});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setAttribute('size',new THREE.BufferAttribute(s,1));g.setAttribute('phase',new THREE.BufferAttribute(ph,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},map:{value:glowTexture()},pulse:{value:pulse},rise:{value:rise},height:{value:height},sway:{value:sway}},
  vertexShader:`attribute float size,phase;attribute vec3 color;uniform float time,pulse,rise,height,sway;varying vec3 vC;varying float vA;void main(){vec3 q=position;if(sway>0.){q.x+=sin(time*.8+position.x*.7+position.z*.5)*sway;q.z+=cos(time*.6+position.x*.4+position.z*.9)*sway*.6;}if(rise>0.){q.y=position.y+mod(time*rise+phase*7.,height);q.x+=sin(time*.4+phase)*.6;q.z+=cos(time*.3+phase)*.6;}vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;float pl=1.-pulse+pulse*(.5+.5*sin(time*1.3+phase));vA=pl*exp(-(-mv.z)*.006);if(rise>0.)vA*=smoothstep(0.,.15,mod(time*rise+phase*7.,height)/height)*(1.-smoothstep(.75,1.,mod(time*rise+phase*7.,height)/height));vC=color;gl_PointSize=min(size*620./max(-mv.z,.5),150.);}`,
  fragmentShader:`uniform sampler2D map;varying vec3 vC;varying float vA;void main(){float a=texture2D(map,gl_PointCoord).a;gl_FragColor=vec4(vC*a*vA,a*vA);}`});
 const pts=new THREE.Points(g,m);pts.frustumCulled=false;root.add(pts);return {points:pts,update(t){m.uniforms.time.value=t;}};
}

export function catenary(a,b,sag=1,n=20){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),pts=[];for(let i=0;i<=n;i++){const t=i/n,p=A.clone().lerp(B,t);p.y-=sag*4*t*(1-t);pts.push(p);}return pts;}
// Glowing silk filaments: one merged core and one merged halo, both additive with travelling beads of light.
export function threadField(root,curves,{color=0xffe6a8,radius=.012,halo=.05,intensity=1,segments=24,sway=0}={}){
 const core=[],wide=[];for(const pts of curves){const curve=new THREE.CatmullRomCurve3(pts);core.push(new THREE.TubeGeometry(curve,segments,radius,3,false));if(halo)wide.push(new THREE.TubeGeometry(curve,Math.max(8,segments/2),halo,4,false));}
 const mk=(geos,k)=>{if(!geos.length)return null;const g=mergeGeometries(geos.map(x=>{x.deleteAttribute('normal');return x;}),false);const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},color:{value:new THREE.Color(color)},intensity:{value:intensity*k},near:{value:k<1?16:4},sway:{value:sway}},
  vertexShader:'uniform float time,sway;varying vec2 vUv;varying vec3 vW;varying float vD;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);if(sway>0.){w.x+=sin(time*.8+w.x*.7+w.z*.5)*sway*uv.x;w.z+=cos(time*.6+w.x*.4+w.z*.9)*sway*.6*uv.x;}vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float time,intensity,near;uniform vec3 color;varying vec2 vUv;varying vec3 vW;varying float vD;void main(){float seed=vW.x*.13+vW.z*.11;float pulse=.55+.45*sin(vUv.x*30.-time*1.7+seed*9.);float bead=pow(max(0.,sin((vUv.x*2.5-time*.18+seed)*6.2832)),40.);float fade=exp(-vD*.011)*(near>0.?smoothstep(near*.4,near,vD):1.);gl_FragColor=vec4(color*(pulse*.55+bead*2.2)*intensity*fade,1.);}'});const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;root.add(mesh);return m;};
 const mats=[mk(core,1),mk(wide,.16)].filter(Boolean);return {update(t){for(const m of mats)m.uniforms.time.value=t;}};
}

// Drifting low mist sheets with fbm noise; each sheet fades at its edges.
export function mistLayers(root,layers){const mats=[];for(const L of layers){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},color:{value:new THREE.Color(L.color??0xaab8d0)},opacity:{value:L.opacity??.35},speed:{value:L.speed??.02},scale:{value:L.scale??.06},seed:{value:L.seed??Math.random()*10}},
 vertexShader:'varying vec2 vUv;varying vec3 vW;varying float vD;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform float time,opacity,speed,scale,seed;uniform vec3 color;varying vec2 vUv;varying vec3 vW;varying float vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*n(p);p*=2.1;a*=.5;}return v;}void main(){vec2 p=vW.xz*scale+vec2(time*speed,time*speed*.6)+seed;float d=fbm(p+fbm(p*1.7-time*speed*.5));float edge=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x)*smoothstep(0.,.18,vUv.y)*smoothstep(1.,.82,vUv.y);float near=smoothstep(1.,6.,vD);gl_FragColor=vec4(color,smoothstep(.35,.8,d)*opacity*edge*near);}'});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(L.w,L.d),m);mesh.rotation.x=-Math.PI/2;if(L.rotY)mesh.rotation.z=L.rotY;mesh.position.set(L.x,L.y,L.z);mesh.renderOrder=2;mesh.frustumCulled=false;root.add(mesh);mats.push(m);}
 return {update(t){for(const m of mats)m.uniforms.time.value=t;}};}

// Bake a prototype group and draw it many times with instancing (one draw call per material).
export function instanceProto(root,proto,transforms,{cast=true,colors=null}={}){const baked=bakeStatic(proto),dummy=new THREE.Object3D(),out=[];for(const child of baked.children){if(!child.isMesh)continue;const im=new THREE.InstancedMesh(child.geometry,child.material,transforms.length);transforms.forEach(([x,y,z,s=1,ry=0,sy],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(s,sy??s,s);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);if(colors)im.setColorAt(i,colors[i]);});im.castShadow=cast;im.receiveShadow=true;im.computeBoundingSphere();root.add(im);out.push(im);}return out;}

// Distant cedar forest cutouts on crossed planes, tinted by moonlight and haze.
export async function distantForest(root,positions,{tint=0x7d8aa0}={}){const map=await new THREE.TextureLoader().loadAsync('./textures/distant-pine.png');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;const mat=windMaterial(new THREE.MeshLambertMaterial({map,color:tint,emissive:0x1a2430,alphaTest:.55,side:THREE.DoubleSide}),.12);const prev=mat.onBeforeCompile;mat.onBeforeCompile=sh=>{prev(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(min(sampledDiffuseColor.r,min(sampledDiffuseColor.g,sampledDiffuseColor.b))>.55)discard;');};const proto=new THREE.Group();for(let f=0;f<2;f++){const p=new THREE.Mesh(new THREE.PlaneGeometry(13.4,10),mat);p.position.y=4.5;p.rotation.y=f*Math.PI/2;proto.add(p);}return instanceProto(root,proto,positions,{cast:false});}

// Far mountain silhouettes: layered ridgelines that fog into the night.
export function farRidges(root,{layers=[{dist:300,height:120,color:0x232c3c}],center=[0,0,0],arc=[0,Math.PI*2],seed=4,base=-40,mist=0x3a4656}={}){const r=rng(seed);const mc=new THREE.Color(mist);for(const L of layers){const seg=420,pos=[],col=[],idx=[];const ph=Array.from({length:6},()=>r()*10);const tc=new THREE.Color(L.color);for(let i=0;i<=seg;i++){const a=arc[0]+(arc[1]-arc[0])*i/seg,x=center[0]+Math.cos(a)*L.dist,z=center[2]+Math.sin(a)*L.dist;const h=L.height*(.42+.28*Math.sin(a*3+ph[0])+.16*Math.sin(a*7.3+ph[1])+.08*Math.abs(Math.sin(a*17+ph[2]))+.05*Math.sin(a*41+ph[3])+.025*Math.sin(a*97+ph[4]));pos.push(x,base,z,x,base+h,z);col.push(mc.r,mc.g,mc.b,tc.r,tc.g,tc.b);if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:false}));m.frustumCulled=false;m.renderOrder=-5;root.add(m);}}

// Moonlit water without a render pass: reflects a night-sky gradient and the moon, with rippled normals.
export function moonWater({moon=MOON,top=0x1a2440,horizon=0x55658a,moonColor=0xfff2d0,tint=0x101c2a,fog=0x323e50,density=.012,ripple=1,flow=[0,0]}={}){const m=new THREE.ShaderMaterial({uniforms:{time:{value:0},moon:{value:new THREE.Vector3(...moon).normalize()},top:{value:new THREE.Color(top)},horizon:{value:new THREE.Color(horizon)},moonColor:{value:new THREE.Color(moonColor)},tint:{value:new THREE.Color(tint)},fogColor:{value:new THREE.Color(fog)},density:{value:density},ripple:{value:ripple},flow:{value:new THREE.Vector2(...flow)}},
 vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform float time,density,ripple;uniform vec3 moon,top,horizon,moonColor,tint,fogColor;uniform vec2 flow;varying vec3 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vW.xz*1.3+flow*time;float e=.05;float a=n(p+time*.25)+.5*n(p*2.7-time*.4),bx=n(p+vec2(e,0)+time*.25)+.5*n((p+vec2(e,0))*2.7-time*.4),bz=n(p+vec2(0,e)+time*.25)+.5*n((p+vec2(0,e))*2.7-time*.4);vec3 N=normalize(vec3((a-bx)*ripple*.6,1.,(a-bz)*ripple*.6));
  vec3 V=normalize(vW-cameraPosition);vec3 R=reflect(V,N);float fres=.04+.96*pow(1.-max(dot(-V,N),0.),5.);vec3 sky=mix(horizon,top,pow(max(R.y,0.),.6));float md=max(dot(R,moon),0.);sky+=moonColor*(pow(md,900.)*6.+pow(md,60.)*.35+pow(md,8.)*.06);
  vec3 c=mix(tint,sky,clamp(fres*1.3+.5,0.,1.));float d=length(vW-cameraPosition);float f=1.-exp(-pow(density*d,2.));gl_FragColor=vec4(mix(c,fogColor,f),1.);}`});return m;}
// A carpet of tapered grass blades swayed by the shared wind field.
export function grassField(root,count,sample,{hue=[.12,.2],sat=.25,light=[.2,.35],height=[.15,.6]}={}){const r=rng(count+7);const gp=[],gu=[],gb=[],gc=[],gn=[];const col=new THREE.Color();let made=0;
 for(let i=0;i<count;i++){const s=sample(r);if(!s)continue;const [x,y,z]=s;made++;const h=height[0]+r()*(height[1]-height[0]),w=.018+r()*.022,a=r()*6.28,dx=Math.cos(a)*w,dz=Math.sin(a)*w,bx=Math.sin(a)*.14,bz=Math.cos(a)*.14;const A=[x-dx,y,z-dz],B=[x+dx,y,z+dz],C=[x+bx-dx*.4,y+h*.65,z+bz-dz*.4],D=[x+bx+dx*.4,y+h*.65,z+bz+dz*.4],E=[x+bx*1.8,y+h,z+bz*1.8];col.setHSL(hue[0]+r()*(hue[1]-hue[0]),sat,light[0]+r()*(light[1]-light[0]));for(const [v,t,u]of [[A,0,0],[B,0,1],[C,.65,0],[B,0,1],[D,.65,1],[C,.65,0],[C,.65,0],[D,.65,1],[E,1,.5]]){gp.push(...v);gn.push(0,1,0);gu.push(u,t);gb.push(t);gc.push(col.r*(.55+t*.6),col.g*(.55+t*.6),col.b*(.55+t*.6));}}
 const g=new THREE.BufferGeometry();for(const [n,a,s]of [['position',gp,3],['normal',gn,3],['uv',gu,2],['bend',gb,1],['color',gc,3]])g.setAttribute(n,new THREE.Float32BufferAttribute(a,s));const m=windMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),.2,true);const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;root.add(mesh);return made;}

// Heightfield terrain mesh from a height function.
export function terrain(k,fn,{w=200,d=200,seg=160,x=0,z=0,mat}={}){const g=new THREE.PlaneGeometry(w,d,seg,seg);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,fn(p.getX(i)+x,p.getZ(i)+z));}g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.position.set(x,0,z);m.receiveShadow=true;m.castShadow=false;k.batch.add(m);return m;}

// Silk cocoons: instanced glowing ovoids hung on short threads.
export function cocoons(root,list,{sway=.12,hang=true}={}){
 const fib=once('silkfib',()=>{const r=rng(41);const draw=bump=>(g,w,h)=>{g.fillStyle=bump?'#808080':'#d9d6cf';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=bump?120+r()*135:225+r()*30;g.strokeStyle=bump?`rgba(${v},${v},${v},.55)`:`rgba(${v},${v-4},${v-14},${.22+r()*.35})`;g.lineWidth=.4+r()*.9;g.beginPath();const y=r()*h,x=r()*w,sl=(r()-.5)*.9;g.moveTo(x-60,y-60*sl);g.bezierCurveTo(x-20,y+(r()-.5)*14,x+20,y+(r()-.5)*14,x+60,y+60*sl);g.stroke();}for(let i=0;i<120;i++){g.fillStyle=bump?'rgba(40,40,40,.4)':'rgba(150,140,120,.25)';g.fillRect(r()*w,r()*h,1+r()*3,1);}};return {map:canvasTexture(256,256,draw(false)),bump:canvasTexture(256,256,draw(true),{srgb:false})};});
 const shape=(kind)=>{const g=kind===2?new THREE.SphereGeometry(.16,22,16,0,Math.PI*2,0,Math.PI*.7):new THREE.SphereGeometry(.16,22,16);const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const a=Math.atan2(z,x);const el=kind===0?2.1:kind===1?1.55:1.8;y*=el;const taper=1-.18*Math.max(0,y/(.16*el))-.1*Math.max(0,-y/(.16*el));const f=1+.04*Math.sin(y*70+a*2)+.025*Math.sin(a*9-y*30);x*=taper*f;z*=taper*f;if(kind===2&&y<-.02){y+=Math.sin(a*7)*.03+Math.sin(a*13)*.015;x*=1.08;z*=1.08;}p.setXYZ(i,x,y,z);}g.computeVertexNormals();if(hang)g.translate(0,-.16*(kind===0?2.1:1.6)*.9,0);return g;};
 const mk=(kind)=>{const m=new THREE.MeshStandardMaterial({color:0x9a9890,map:fib.map,bumpMap:fib.bump,bumpScale:1.2,roughness:.72,side:kind===2?THREE.DoubleSide:THREE.FrontSide});m.onBeforeCompile=sh=>{sh.uniforms.uTime=windTimeRef;sh.uniforms.uSway={value:sway};
   sh.vertexShader='uniform float uTime,uSway;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
    vec3 ip=vec3(instanceMatrix[3]);float sc=length(instanceMatrix[0].xyz);transformed.x+=sin(uTime*.8+ip.x*.7+ip.z*.5)*uSway/sc;transformed.z+=cos(uTime*.6+ip.x*.4+ip.z*.9)*uSway*.6/sc;
   #endif`);
   sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   {vec3 nV=normalize(normal);vec3 vV=normalize(vViewPosition);float fr=1.-abs(dot(nV,vV));float fib=dot(diffuseColor.rgb,vec3(.33));
    vec3 warm=vec3(1.,.58,.22);
    #ifdef USE_INSTANCING_COLOR
     warm*=vColor;
    #endif
    float inner=pow(1.-fr,2.4);totalEmissiveRadiance+=warm*inner*(.45+.55*fib)*1.05+vec3(.6,.68,.82)*pow(fr,2.5)*.35;
    if(!gl_FrontFacing)totalEmissiveRadiance+=vec3(1.,.55,.2)*1.4;}`);};m.customProgramCacheKey=()=>'cocoon-'+kind;return m;};
 const out=[];for(const kind of [0,1,2]){const items=list.filter(c=>(c[4]??0)===kind);if(!items.length)continue;const im=new THREE.InstancedMesh(shape(kind),mk(kind),items.length),d=new THREE.Object3D(),c=new THREE.Color();items.forEach(([x,y,z,s=1,_k,tone=.5],i)=>{d.position.set(x,y,z);d.rotation.set((i%5-2)*.05,i*2.1,(i%3-1)*.06);d.scale.set(s*(.9+(i%4)*.06),s,s*(.9+(i%3)*.07));d.updateMatrix();im.setMatrixAt(i,d.matrix);c.setRGB(.85+tone*.3,.75+tone*.25,.6+tone*.2);im.setColorAt(i,c);});im.castShadow=false;im.receiveShadow=false;im.frustumCulled=false;root.add(im);out.push(im);}return out;}

// Gassho-style farmhouse: a steep (60°) thick thatch A-frame, ridge along local z, gables at ±z.
// Returns an oriented footprint rectangle for collision.
export function gasshoHouse(k,x,y,z,{span=11,length=16,wall=2.7,rot=0,lit=[true,true,false],seed=1,scale=1,tint=0xffffff,frontProps=true}={}){
 const r=rng(seed),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;g.scale.setScalar(scale);k.batch.add(g);
 const {box,beam,cylinder,mesh,stone,dark,wood,paper}=k;const thatch=thatchMaterial(tint),edge=thatchEdgeMaterial(),boards=boardMaterial(k),glow=paperGlow(true),dim=paperGlow(false);
 const W=span,L=length,th=Math.PI/3,H=W/2*Math.tan(th),top=wall+.5;
 // Stone plinth, floor, timber frame and lower walls.
 box(W+.6,.5,L+.6,0,.25,0,stone,g);for(let i=-W/2;i<=W/2;i+=1.1)k.rock(i,.12,L/2+.45,.28,stone,g);
 for(const sx of [-1,1])for(let zz=-L/2;zz<=L/2+.01;zz+=L/Math.round(L/1.8)){box(.26,wall,.26,sx*W/2,.5+wall/2,zz,dark,g);}
 for(const sz of [-1,1])for(let xx=-W/2;xx<=W/2+.01;xx+=W/Math.round(W/1.8))box(.26,wall,.26,xx,.5+wall/2,sz*L/2,dark,g);
 for(const sx of [-1,1]){box(.14,wall,L,sx*(W/2-.05),.5+wall/2,0,boards,g);box(.3,.3,L+.4,sx*W/2,.5+wall,0,dark,g);box(.3,.24,L+.4,sx*W/2,.75,0,dark,g);}
 // Front (+z) and back gables: sliding doors below, boarded triangle with lattice windows above.
 for(const sz of [-1,1]){const zz=sz*L/2;box(W,.3,.3,0,.5+wall,zz,dark,g);
  const doors=Math.round(W/1.8);for(let i=0;i<doors;i++){const xx=-W/2+(i+.5)*W/doors;const lt=sz>0?(i%3!==1&&lit[0]):lit[0]&&i===1;box(W/doors-.12,wall-.5,.06,xx,.5+(wall-.5)/2+.15,zz+sz*.04,lt?glow:dim,g);}
  const tri=new THREE.Shape();tri.moveTo(-W/2,0);tri.lineTo(W/2,0);tri.lineTo(0,H);tri.closePath();const tg=new THREE.ShapeGeometry(tri);const tri0=mesh(tg,boards,0,top,zz-sz*.35,g);tri0.material.side=THREE.DoubleSide;
  // Three attic levels of windows, narrowing toward the ridge; level beams and small rain hoods.
  const levels=[[1.0,.62],[3.4,.36],[5.6,.16]];levels.forEach(([hy,frac],li)=>{if(hy>H-1)return;const ww=W*frac,wy=top+hy;const on=lit[Math.min(li,lit.length-1)]&&(sz>0||li===0);box(ww,1.1,.08,0,wy+.5,zz-sz*.3,on?glow:dim,g);for(let j=-ww/2;j<=ww/2+.01;j+=ww/Math.max(2,Math.round(ww/.55)))box(.06,1.2,.12,j,wy+.5,zz-sz*.24,dark,g);box(ww+.3,.12,.16,0,wy+1.08,zz-sz*.24,dark,g);box(ww+.3,.12,.16,0,wy-.05,zz-sz*.24,dark,g);const wl=W*(1-(hy+1.2)/H)*.98;box(wl,.18,.2,0,wy-.25,zz-sz*.28,dark,g);const hood=box(ww+.9,.08,.9,0,wy+1.35,zz-sz*.0,wood,g);hood.rotation.x=sz*.35;});
  // The great A-frame rafters visible at the gable.
  for(const sx of [-1,1])beam([sx*(W/2+1.2),top-.55,zz-sz*.25],[0,top+H+.4,zz-sz*.25],.2,dark,g);
 }
 // Two thick thatch slabs: local +x of each slab runs downslope, eave at u=1.
 const over=1.25,slope=W/2/Math.cos(th)+over*1.15,T=.95;
 for(const sx of [-1,1]){const side=new THREE.Group();side.rotation.y=sx>0?0:Math.PI;g.add(side);
  const slab=mesh(new THREE.BoxGeometry(slope,T,L+2.2),thatch,0,0,0,side);slab.rotation.z=-th;const dir=new THREE.Vector3(Math.cos(th),-Math.sin(th),0),nrm=new THREE.Vector3(Math.sin(th),Math.cos(th),0);const c=new THREE.Vector3(0,top+H+.15,0).addScaledVector(dir,slope/2).addScaledVector(nrm,T/2);slab.position.copy(c);
  // Layered eave skirt and a second, darker under-course give the cut thatch its depth.
  const eave=new THREE.Vector3(0,top+H+.15,0).addScaledVector(dir,slope);const sk=mesh(new THREE.BoxGeometry(.5,T*1.25,L+2.3),edge,0,0,0,side);sk.rotation.z=-th;sk.position.copy(eave).addScaledVector(dir,-.2).addScaledVector(nrm,T*.55);
  const under=mesh(new THREE.BoxGeometry(slope*.35,T*.6,L+1.9),edge,0,0,0,side);under.rotation.z=-th;under.position.copy(eave).addScaledVector(dir,-slope*.17).addScaledVector(nrm,-.15);
  // Rafter ends under the eave.
  for(let zz=-L/2-.8;zz<=L/2+.8;zz+=.75){const a=eave.clone().addScaledVector(dir,-1.6).addScaledVector(nrm,-.2),b=eave.clone().addScaledVector(dir,-.25).addScaledVector(nrm,-.15);beam([a.x,a.y,zz],[b.x,b.y,zz],.06,dark,side);}
 }
 // Ridge cap with crossed ridge-riders.
 const ry=top+H+.15+T/Math.cos(th)*.5+.25;box(1.0,.55,L+2.4,0,ry,0,edge,g);box(.36,.28,L+2.4,0,ry+.38,0,dark,g);
 for(let zz=-L/2-1;zz<=L/2+1;zz+=1.4)for(const s of [-1,1])beam([s*.85,ry-.45,zz],[-s*.25,ry+.75,zz],.07,dark,g);
 if(frontProps){// Firewood stacks under the eaves, a cocoon tray rack and a hanging straw mat.
  for(const sx of [-1,1]){for(let j=0;j<3;j++)for(let i=0;i<14;i++){const lg=cylinder(.09+r()*.03,.1,1.0,sx*(W/2+.75),.62+j*.19,-L/2+2+i*.2+ (j%2)*.1,wood,6,g);lg.rotation.x=Math.PI/2;lg.rotation.z=(r()-.5)*.1;}box(.9,.12,3.2,sx*(W/2+.75),.5,-L/2+3.3,dark,g);}
  const rx=W/2-1.4,rz=L/2+1.1;for(const s of [-1,1])box(.08,1.7,.08,rx+s*.8,1.35,rz,wood,g);for(let i=0;i<5;i++){box(1.7,.04,.7,rx,.85+i*.32,rz,k.surface('plaster',0xbfae86,.5),g);}
 }
 g.userData.footprint={x,z,w:W+.9,d:L+.9,rot};return g.userData.footprint;
}
export function inRotRect(px,pz,f,pad=0){const dx=px-f.x,dz=pz-f.z,c=Math.cos(-f.rot),s=Math.sin(-f.rot);const lx=dx*c+dz*s,lz=-dx*s+dz*c;return Math.abs(lx)<f.w/2+pad&&Math.abs(lz)<f.d/2+pad;}

// Vertical waterfall sheet with scrolling streaks; foam and spray are handled by callers.
export function waterfallSheet(root,{x,z,yTop,yBottom,width,rotY=0,color=0xd8e6f2}){const h=yTop-yBottom;const m=new THREE.ShaderMaterial({defines:{H:h.toFixed(2),W:width.toFixed(2)},transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},color:{value:new THREE.Color(color)}},
 vertexShader:'varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform float time;uniform vec3 color;varying vec2 vUv;varying float vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){float y=vUv.y*H;vec2 p=vec2(vUv.x*W*5.,y*.35+time*3.2);float s=n(p)*.55+n(vec2(p.x*2.1,p.y*1.7)+4.)*.3+n(vec2(p.x*.5,y*.08+time*1.2))*.3;float streak=smoothstep(.42,.9,s);float wob=n(vec2(y*.15+time*.6,1.))*.18;float edge=smoothstep(0.,.14+wob,vUv.x)*smoothstep(1.,.86-wob,vUv.x);float a=(.22+streak*.75)*edge;float foam=smoothstep(.12,0.,vUv.y);gl_FragColor=vec4(color*(.85+streak*.9+foam*.6),min(1.,a*1.15+foam*edge*.5));}'});
 const geo=new THREE.PlaneGeometry(width,h,8,24);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i),t=(h/2-yy)/h;p.setZ(i,-(1-t)*(1-t)*1.6+Math.sin(p.getX(i)*1.3)*.15);}const sheet=new THREE.Mesh(geo,m);sheet.position.set(x,yBottom+h/2,z);sheet.rotation.y=rotY;sheet.frustumCulled=false;root.add(sheet);return {update(t){m.uniforms.time.value=t;}};}

export function glossyWater(color=0x0e1a26){return new THREE.MeshStandardMaterial({color,roughness:.08,metalness:.0,envMapIntensity:2});}
