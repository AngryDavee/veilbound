import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const smooth=g=>{g.deleteAttribute('uv');g.deleteAttribute('normal');const m=mergeVertices(g,1e-4);m.computeVertexNormals();return m;};
import { texture } from '../kit.js';
import { windMaterial } from '../../detail-world.js';
// Ember Springs shared building blocks: snow-laden Taisho timber architecture, gas lamps,
// steam, hot-spring water, snowy forest and mountains. Everything is code-built geometry
// on the project's existing Atlas textures plus small canvas textures made at load time.

export function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
export function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export function fbm(x,z,o=5){let a=.5,v=0;for(let i=0;i<o;i++){v+=a*noise(x,z);x=x*2.03+17.1;z=z*2.03+9.3;a*=.5;}return v;}
export function ridged(x,z,o=5){let a=.5,v=0;for(let i=0;i<o;i++){v+=a*(1-Math.abs(noise(x,z)*2-1));x=x*2.1+3.7;z=z*2.1+5.1;a*=.5;}return v;}

function canvasTexture(w,h,draw,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const SIGN_TEXT=['湯','御宿','鍛冶','酒','炭','刀','茶屋','燈'];
export function springsMaterials(k){
 const snowNormal=k.maps.plaster[1].clone();snowNormal.repeat.set(1.5,1.5);
 const snow=new THREE.MeshStandardMaterial({color:0xe3eaf3,roughness:.88,normalMap:snowNormal,normalScale:new THREE.Vector2(.35,.35)});
 const shoji=canvasTexture(128,256,(g,w,h)=>{const grd=g.createRadialGradient(w/2,h/2,10,w/2,h/2,h*.7);grd.addColorStop(0,'#fff1d2');grd.addColorStop(1,'#e9c690');g.fillStyle=grd;g.fillRect(0,0,w,h);g.fillStyle='#3a2a1c';for(let i=0;i<=3;i++)g.fillRect(i*w/3-2,0,4,h);for(let j=0;j<=6;j++)g.fillRect(0,j*h/6-2,w,4);g.fillRect(0,0,w,7);g.fillRect(0,h-7,w,7);g.fillRect(0,0,7,h);g.fillRect(w-7,0,7,h);});
 const shojiDim=canvasTexture(128,256,(g,w,h)=>{g.fillStyle='#b8b4ab';g.fillRect(0,0,w,h);g.fillStyle='#2a2420';for(let i=0;i<=3;i++)g.fillRect(i*w/3-2,0,4,h);for(let j=0;j<=6;j++)g.fillRect(0,j*h/6-2,w,4);g.fillRect(0,0,w,7);g.fillRect(0,h-7,w,7);g.fillRect(0,0,7,h);g.fillRect(w-7,0,7,h);});
 const signs=canvasTexture(512,512,(g)=>{for(let i=0;i<8;i++){const cx=(i%4)*128,cy=Math.floor(i/4)*256,light=i%3===1;g.fillStyle=light?'#d9cba8':'#2a1d14';g.fillRect(cx,cy,128,256);g.strokeStyle=light?'#5a4026':'#b88a4a';g.lineWidth=6;g.strokeRect(cx+8,cy+8,112,240);g.fillStyle=light?'#1e140c':'#efd29a';const t=SIGN_TEXT[i];const size=t.length>1?70:96;g.font=`bold ${size}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif`;g.textAlign='center';g.textBaseline='middle';[...t].forEach((ch,j,a)=>g.fillText(ch,cx+64,cy+128+(j-(a.length-1)/2)*size*1.05));}});
 const noren=canvasTexture(128,128,(g,w,h)=>{g.fillStyle='#1d2a46';g.fillRect(0,0,w,h);g.fillStyle='#e8e2d2';g.beginPath();g.arc(w/2,h*.55,h*.2,0,Math.PI*2);g.fill();g.fillStyle='#1d2a46';g.beginPath();g.arc(w/2,h*.55,h*.13,0,Math.PI*2);g.fill();g.fillRect(w/2-3,h*.3,6,h*.5);});
 return {
  snow,
  ice:new THREE.MeshStandardMaterial({color:0xcfe2f4,roughness:.15,metalness:.1,emissive:0x0c1420}),
  innWood:k.surface('cedar',0x6a4e38,1,.86),
  innDark:k.surface('cedar',0x2f2420,1,.9),
  plaster:k.surface('plaster',0xdcd6c8,1,.95),
  stone:k.surface('stone',0x7a828d,1,.8),
  paving:k.surface('stone',0x5d646d,6,.55),
  rock:k.surface('rock',0x34373d,1,.92),
  tile:k.surface('stone',0x2a343e,2,.55),
  window:new THREE.MeshStandardMaterial({map:shoji,emissiveMap:shoji,emissive:0xffb260,emissiveIntensity:1.25,roughness:.9}),
  windowDim:new THREE.MeshStandardMaterial({map:shojiDim,emissiveMap:shojiDim,emissive:0x1a2230,emissiveIntensity:.6,roughness:.95}),
  signs:new THREE.MeshStandardMaterial({map:signs,emissiveMap:signs,emissive:0x5a4632,emissiveIntensity:.5,roughness:.9,side:THREE.DoubleSide}),
  noren:new THREE.MeshStandardMaterial({map:noren,roughness:1,side:THREE.DoubleSide}),
  iron:new THREE.MeshStandardMaterial({color:0x1f2226,metalness:.55,roughness:.5}),
  lampGlass:new THREE.MeshStandardMaterial({color:0xfff0d0,emissive:0xffb35a,emissiveIntensity:2.6,roughness:.6}),
  ember:new THREE.MeshStandardMaterial({color:0xff8a3a,emissive:0xff4a0a,emissiveIntensity:3,roughness:.9}),
  charcoal:new THREE.MeshStandardMaterial({color:0x121212,roughness:1}),
  clay:k.surface('earth',0x8c6a52,1,.95),
  rust:k.surface('rock',0x7c4a2c,1,.75),
  steel:new THREE.MeshStandardMaterial({color:0x9aa4ae,metalness:.85,roughness:.3}),
  bronze:new THREE.MeshStandardMaterial({color:0x9a7442,metalness:.8,roughness:.38,emissive:0x2a1406,emissiveIntensity:.6}),
  rope:new THREE.MeshStandardMaterial({color:0xb59c6c,roughness:1}),
  grout:new THREE.MeshStandardMaterial({color:0x22262c,roughness:1})
 };
}
// UVs into the 4x2 vertical-signboard atlas.
export function signGeometry(w,h,cell){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,c=cell%4,r=Math.floor(cell/4)%2;for(let i=0;i<uv.count;i++)uv.setXY(i,(c+uv.getX(i))/4,1-(r+1-uv.getY(i))/2);return g;}
// Triangular gable prism, indexed so it merges with boxes.
function prism(w,h,t){const P=[[-w/2,0],[w/2,0],[0,h]],v=[],u=[],ix=[];const quad=(a,b,c,d)=>{const n=v.length/3;v.push(...a,...b,...c,...d);u.push(0,0,1,0,1,1,0,1);ix.push(n,n+1,n+2,n,n+2,n+3);};
 for(const z of [t/2,-t/2]){const n=v.length/3;for(const p of P)v.push(p[0],p[1],z);u.push(0,0,1,0,.5,1);ix.push(...(z>0?[n,n+1,n+2]:[n,n+2,n+1]));}
 quad([w/2,0,t/2],[w/2,0,-t/2],[0,h,-t/2],[0,h,t/2]);quad([0,h,t/2],[0,h,-t/2],[-w/2,0,-t/2],[-w/2,0,t/2]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();return g;}
// Small icicles hanging from an eave line (local coordinates of g).
export function icicles(k,M,g,x0,x1,y,z,R,density=.6){for(let x=x0;x<x1;x+=.25+R()*.5){if(R()>density)continue;const len=.12+R()*R()*.6;const c=k.mesh(new THREE.ConeGeometry(.03+R()*.02,len,5),M.ice,x,y-len/2,z,g);c.rotation.x=Math.PI;c.castShadow=false;}}
// A thick snow-laden gable roof, ridge along local X. Overhanging eaves show rafter ends.
export function snowRoof(k,M,g,{x=0,y=0,z=0,w,d,rise=2,over=.9,side=.5,rotY=0,R=Math.random,ice=true}){
 const G=new THREE.Group();G.position.set(x,y,z);G.rotation.y=rotY;g.add(G);
 const half=d/2,angle=Math.atan2(rise,half),L=Math.hypot(rise,half)+over,W=w+side*2;
 for(const s of [-1,1]){const S=new THREE.Group();S.position.set(0,rise,0);S.rotation.x=s*angle;G.add(S);
  k.box(W,.2,L,0,-.1,s*L/2,M.tile,S);
  k.box(W-.12,.34+R()*.08,L-.25,0,.16,s*(L/2-.05),M.snow,S);
  const lip=k.cylinder(.2,.2,W-.1,0,.06,s*(L-.15),M.snow,8,S);lip.rotation.z=Math.PI/2;
  for(let i=-W/2+.2;i<W/2;i+=.48)k.box(.09,.13,.95,i,-.27,s*(L-.6),M.innDark,S);
  k.box(W,.24,.12,0,-.12,s*(L-.02),M.innDark,S);
  if(ice){const eave=new THREE.Group();eave.position.set(0,-.1,s*L);S.add(eave);icicles(k,M,eave,-W/2+.3,W/2-.3,-.12,0,R,.45);}
 }
 const ridge=k.cylinder(.32,.32,W+.1,0,rise+.2,0,M.snow,10,G);ridge.rotation.z=Math.PI/2;
 for(const s of [-1,1]){const pr=k.mesh(prism(d,rise,.18),M.plaster,s*(w/2),0,0,G);pr.rotation.y=Math.PI/2;
  const lat=k.mesh(prism(d*.4,rise*.4,.05),M.innDark,s*(w/2+.1),rise*.45,0,G);lat.rotation.y=Math.PI/2;
  for(const t of [-1,1])k.beam([s*(W/2-.02),rise+.12,0],[s*(W/2-.02),rise-L*Math.sin(angle)+.05,t*L*Math.cos(angle)],.11,M.innDark,G);}
 return G;
}
// Single-slope pent roof (hisashi) projecting from a facade at local +Z.
export function pent(k,M,g,{x=0,y,z=0,w,p=1.1,tilt=.4,R=Math.random}){const G=new THREE.Group();G.position.set(x,y,z);G.rotation.x=tilt;g.add(G);
 k.box(w,.1,p,0,0,p/2,M.tile,G);k.box(w-.06,.22+R()*.06,p-.06,0,.15,p/2-.02,M.snow,G);const lip=k.cylinder(.14,.14,w-.06,0,.1,p-.05,M.snow,8,G);lip.rotation.z=Math.PI/2;
 for(let i=-w/2+.15;i<w/2;i+=.5)k.box(.06,.08,p-.1,i,-.08,p/2,M.innDark,G);const e=new THREE.Group();e.position.set(0,-.06,p);G.add(e);icicles(k,M,e,-w/2+.2,w/2-.2,-.05,0,R,.4);return G;}
// Multi-storey timber inn. Local front faces +Z; origin at front-centre, ground level.
export function inn(k,M,{x,z,rot=0,W=8.4,D=9,floors=2,parent,seed=1,sign=-1,gableFront=false,lantern=true,passage=0}){
 const R=rng(seed),g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);const box=(w,h,d,px,py,pz,m)=>k.box(w,h,d,px,py,pz,m,g);
 const H0=3.3,HF=2.85,top=H0+floors*HF,lamps=[];
 box(W+.3,.42,D+.3,0,.21,-D/2,M.stone);
 if(passage){const side=(W-.3-passage)/2;for(const s of [-1,1])box(side,top-.4,D-.8,s*(passage/2+side/2),.4+(top-.4)/2,-D/2-.25,M.plaster);box(passage,top-3.6,D-.8,0,3.4+(top-3.6)/2,-D/2-.25,M.plaster);
  for(const s of [-1,1]){box(.14,3.1,D,s*passage/2,1.55,-D/2,M.innWood);for(let zz=-.3;zz>-D;zz-=1.6)box(.2,3.1,.2,s*(passage/2-.1),1.55,zz,M.innDark);}
  box(passage,.14,D,0,3.12,-D/2,M.innDark);for(let zz=-.5;zz>-D;zz-=1.1)box(passage,.16,.16,0,3.0,zz,M.innDark);
  for(let zz=-1.8;zz>-D+.5;zz-=3.2){k.lantern(0,2.5,zz,.6,g);lamps.push(new THREE.Vector3(0,2.5,zz));}}
 else box(W-.3,top-.4,D-.8,0,.4+(top-.4)/2,-D/2-.25,M.plaster);
 for(const sx of [-1,1]){box(.26,top,.26,sx*(W/2-.13),top/2,-.15,M.innDark);box(.26,top,.26,sx*(W/2-.13),top/2,-D+.15,M.innDark);
  for(let y=1.2;y<top;y+=1.4)box(.1,.12,D-.3,sx*(W/2-.13),y,-D/2,M.innDark);}
 const bays=Math.max(3,Math.round(W/1.9)),bw=W/bays,door=passage?-1:Math.floor(bays/2);
 for(let i=0;i<=bays;i++){if(passage&&Math.abs(-W/2+i*bw)<passage/2-.05)continue;box(.2,H0,.2,-W/2+i*bw,H0/2,-.12,M.innDark);}
 for(let i=0;i<bays;i++){const cx=-W/2+bw*(i+.5);if(passage&&Math.abs(cx)<passage/2+bw/2-.05)continue;
  if(i===door){box(bw-.12,2.6,.08,cx,.42+1.3,-1.4,M.window);box(bw-.1,.12,1.4,cx,3.0,-.7,M.innDark);box(.08,2.6,1.4,cx-bw/2+.06,1.72,-.7,M.innWood);box(.08,2.6,1.4,cx+bw/2-.06,1.72,-.7,M.innWood);
   for(let n=0;n<3;n++){const nw=(bw-.3)/3;const cl=k.mesh(new THREE.PlaneGeometry(nw-.04,1.0),M.noren,cx-(bw-.3)/2+nw*(n+.5),2.42,-.06,g);cl.castShadow=false;}
   box(bw+.1,.08,.08,cx,2.95,-.06,M.innDark);
   if(lantern)for(const s of [-1,1]){k.lantern(cx+s*(bw/2+.05),2.45,.35,.55,g);lamps.push(new THREE.Vector3(cx+s*(bw/2+.05),2.45,.35));}
  }else{box(bw-.14,2.25,.06,cx,.48+1.12+.2,-.4,R()<.18?M.windowDim:M.window);for(let s=-bw/2+.13;s<bw/2-.08;s+=.115)box(.035,2.3,.05,cx+s,1.85,-.32,M.innDark);box(bw-.1,.5,.14,cx,.66,-.32,M.innWood);box(bw-.1,.1,.16,cx,3.0,-.32,M.innDark);}
 }
 box(W+.12,.32,.32,0,H0-.12,-.1,M.innDark);
 pent(k,M,g,{y:H0-.02,w:W+.7,p:1.25,R});
 for(let f=0;f<floors;f++){const y0=H0+f*HF;box(W,.24,.36,0,y0+.12,-.06,M.innDark);
  const balcony=f===0||R()<.55,inset=balcony?0:-.05;
  if(balcony){box(W-.1,.14,.9,0,y0+.24,.44,M.innWood);box(W-.1,.07,.08,0,y0+1.12,.86,M.innDark);box(W-.06,.06,.16,0,y0+1.19,.86,M.snow);box(W-.1,.05,.06,0,y0+.62,.86,M.innDark);
   for(let b=-W/2+.12;b<W/2;b+=.2)box(.04,.86,.04,b,y0+.72,.86,M.innWood);box(W-.2,.08,.6,0,y0+.36,.5,M.snow);}
  const n=Math.max(4,Math.round(W/.95)),pw=W/n,hh=HF-1.15;
  for(let i=0;i<n;i++){const px=-W/2+pw*(i+.5);box(pw-.05,hh,.05,px,y0+.62+hh/2+.1,-.32+inset,R()<.22?M.windowDim:M.window);box(.07,hh+.2,.09,-W/2+pw*i,y0+.62+hh/2+.1,-.26,M.innDark);}
  box(W-.1,.62,.1,0,y0+.5,-.3,M.plaster);box(W-.1,.1,.12,0,y0+.82,-.26,M.innDark);box(W,.14,.14,0,y0+HF-.18,-.2,M.innDark);
  if(f<floors-1)pent(k,M,g,{y:y0+HF-.12,w:W+.4,p:.75,tilt:.45,R});
 }
 if(gableFront)snowRoof(k,M,g,{y:top,z:-D/2,w:D,d:W+.6,rise:2.3+R()*.6,rotY:Math.PI/2,R});else snowRoof(k,M,g,{y:top,z:-D/2,w:W+.2,d:D,rise:2.0+R()*.7,R});
 if(sign>=0){const s=k.mesh(signGeometry(.62,1.9,sign),M.signs,-W/2+.45,H0+1.25,.34,g);s.castShadow=false;box(.72,2.0,.06,-W/2+.45,H0+1.25,.3,M.innDark);}
 g.updateMatrixWorld(true);return {group:g,lamps:lamps.map(v=>g.localToWorld(v)),height:top};
}
// Taisho gas lamp on an iron post; returns the lamp head position.
export function gasLamp(k,M,g,x,z,y0=0,h=3.3){k.box(.32,.32,.32,x,y0+.16,z,M.iron,g);k.cylinder(.055,.08,h,x,y0+h/2,z,M.iron,8,g);k.cylinder(.1,.1,.12,x,y0+h-.04,z,M.iron,8,g);k.box(.5,.04,.04,x,y0+h-.35,z,M.iron,g);
 k.cylinder(.19,.13,.42,x,y0+h+.24,z,M.lampGlass,6,g);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;k.box(.02,.44,.02,x+Math.cos(a)*.18,y0+h+.24,z+Math.sin(a)*.18,M.iron,g);}
 k.cylinder(.03,.27,.18,x,y0+h+.53,z,M.iron,6,g);k.cylinder(.04,.25,.14,x,y0+h+.64,z,M.snow,6,g);return new THREE.Vector3(x,y0+h+.24,z);}

// Camera-facing additive glows (one draw call). items: [x,y,z,size,colorHex]
function fogParsV(){return '\n#include <fog_pars_vertex>\n';}
const fogFade=`float fogF=1.;
#ifdef USE_FOG
 #ifdef FOG_EXP2
  fogF=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
 #else
  fogF=1.-smoothstep(fogNear,fogFar,vFogDepth);
 #endif
#endif
`;
function instGeo(n,attrs){const base=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);for(const [name,arr,size] of attrs)g.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(arr),size));g.instanceCount=n;return g;}
export function glowSprites(root,items,{intensity=1,flicker=.08}={}){
 const off=[],sz=[],col=[],seed=[];const c=new THREE.Color();for(const [x,y,z,s,hex] of items){off.push(x,y,z);sz.push(s);c.setHex(hex??0xffb060);col.push(c.r,c.g,c.b);seed.push(Math.random());}
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},intensity:{value:intensity},flick:{value:flicker}}]),
  vertexShader:`attribute vec3 offset;attribute float size;attribute vec3 tint;attribute float seed;uniform float time,flick;varying vec2 vUv;varying vec3 vTint;varying float vF;${fogParsV()}
  void main(){vUv=uv;vTint=tint;vF=1.-flick+flick*(.5+.5*sin(time*9.+seed*40.)*sin(time*3.7+seed*11.));vec4 mvPosition=modelViewMatrix*vec4(offset,1.);mvPosition.xy+=position.xy*size;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float intensity;varying vec2 vUv;varying vec3 vTint;varying float vF;
#include <fog_pars_fragment>

  void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),2.6);float core=pow(max(0.,1.-d*2.6),2.);${fogFade}gl_FragColor=vec4(vTint*(a*.5+core*.9)*vF*intensity*fogF,1.);}`});
 const m=new THREE.Mesh(instGeo(items.length,[['offset',off,3],['size',sz,1],['tint',col,3],['seed',seed,1]]),mat);m.frustumCulled=false;m.renderOrder=5;root.add(m);return {mesh:m,update(t){mat.uniforms.time.value=t;}};
}
// Rising, curling steam puffs from a list of emitter points (one draw call).
export function steamField(root,emitters,{count=200,rise=6,life=9,size0=.8,size1=4,opacity=.22,color=0xdfe6ef,wind=[.15,.05],jitter=[1,1]}={}){
 const base=[],seed=[];for(let i=0;i<count;i++){const e=emitters[i%emitters.length];base.push(e[0]+(Math.random()-.5)*jitter[0],e[1],e[2]+(Math.random()-.5)*jitter[1]);seed.push(Math.random());}
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},rise:{value:rise},life:{value:life},s0:{value:size0},s1:{value:size1},opacity:{value:opacity},color:{value:new THREE.Color(color)},wind:{value:new THREE.Vector2(...wind)}}]),
  vertexShader:`attribute vec3 base;attribute float seed;uniform float time,rise,life,s0,s1;uniform vec2 wind;varying vec2 vUv;varying float vA,vS,vNear;${fogParsV()}
  void main(){float ph=fract(time/life+seed);vec3 p=base+vec3(wind.x*ph*life+sin(time*.35+seed*20.)*.5*ph,ph*rise,wind.y*ph*life+cos(time*.3+seed*17.)*.5*ph);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);float s=mix(s0,s1,ph);float a=seed*6.283+time*.15*(seed-.5);vec2 q=mat2(cos(a),-sin(a),sin(a),cos(a))*position.xy;mvPosition.xy+=q*s;gl_Position=projectionMatrix*mvPosition;
  vA=smoothstep(0.,.18,ph)*(1.-smoothstep(.4,1.,ph));vNear=smoothstep(.5,3.5,-mvPosition.z);vUv=uv;vS=seed;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float opacity,time;uniform vec3 color;varying vec2 vUv;varying float vA,vS,vNear;
#include <fog_pars_fragment>

  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){vec2 p=vUv-.5;float d=length(p)*2.;float nn=n(vUv*4.+vS*31.)*.6+n(vUv*9.-vS*13.)*.4;float a=smoothstep(1.,.15,d+(nn-.5)*.7)*vA*vNear*opacity;${fogFade}gl_FragColor=vec4(color,a*mix(.35,1.,fogF));}`});
 const m=new THREE.Mesh(instGeo(count,[['base',base,3],['seed',seed,1]]),mat);m.frustumCulled=false;m.renderOrder=6;root.add(m);return {mesh:m,update(t){mat.uniforms.time.value=t;}};
}
// Dark hot-spring/river water: animated ripples, fresnel to sky, moon glint, optional transparency.
export function waterSurface(root,geometry,{deep=0x0b1820,sky=0x4a5a72,tint=0x2a4a52,moonDir=[-.35,.42,-.84],flow=0,opacity=.94,warm=0x000000,spot=[0,0,0,0],spotColor=0xffa860,spot2=[0,0,0,0]}={}){
 const mat=new THREE.ShaderMaterial({transparent:opacity<1,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},deep:{value:new THREE.Color(deep)},sky:{value:new THREE.Color(sky)},tint:{value:new THREE.Color(tint)},warm:{value:new THREE.Color(warm)},moon:{value:new THREE.Vector3(...moonDir).normalize()},flow:{value:flow},opacity:{value:opacity},spot:{value:new THREE.Vector4(...spot)},spot2:{value:new THREE.Vector4(...spot2)},spotColor:{value:new THREE.Color(spotColor)}}]),
  vertexShader:`varying vec3 vW;${fogParsV()}void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float time,flow,opacity;uniform vec3 deep,sky,tint,moon,warm,spotColor;uniform vec4 spot,spot2;varying vec3 vW;
#include <fog_pars_fragment>

  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float H(vec2 p){p.y+=time*flow;return n(p*.7+time*.08)+.5*n(p*1.9-vec2(0.,time*.3))+.25*n(p*4.3+vec2(time*.45,0.))+.12*n(p*9.+time*.6);}
  void main(){vec2 p=vW.xz;float e=.12,a=H(p);vec3 N=normalize(vec3((a-H(p+vec2(e,0.)))*1.6,1.,(a-H(p+vec2(0.,e)))*1.6));vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(N,V),0.),3.);vec3 R=reflect(-V,N);float sp=pow(max(dot(R,moon),0.),220.)*3.+pow(max(dot(R,moon),0.),18.)*.12;
  vec3 c=mix(deep+tint*a*.25,sky,fr*.8)+vec3(.85,.9,1.)*sp+warm*(.6+.4*a);float sd=spot.z>0.?smoothstep(spot.z,0.,length(vW.xz-spot.xy)):0.;float sd2=spot2.z>0.?smoothstep(spot2.z,0.,length(vW.xz-spot2.xy)):0.;c+=spotColor*(sd*sd*spot.w*.6+sd2*sd2*spot2.w)*(.75+.5*a);gl_FragColor=vec4(c,mix(opacity,1.,fr)*(1.-sd*.6));
  #include <fog_fragment>
  }`});
 const m=new THREE.Mesh(geometry,mat);m.receiveShadow=false;root.add(m);return {mesh:m,update(t){mat.uniforms.time.value=t;}};
}
// Broken lamp reflections lying on the water surface, stretched toward the viewer axis (z).
export function lampStreaks(root,items,{y=0}={}){const off=[],sz=[],col=[],seed=[];const c=new THREE.Color();for(const [x,z,w,l,hex] of items){off.push(x,y,z);sz.push(w,l);c.setHex(hex??0xffa850);col.push(c.r,c.g,c.b);seed.push(Math.random());}
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0}}]),
  vertexShader:`attribute vec3 offset;attribute vec2 size;attribute vec3 tint;attribute float seed;varying vec2 vUv;varying vec3 vT;varying float vS;${fogParsV()}void main(){vUv=uv;vT=tint;vS=seed;vec3 p=offset+vec3(position.x*size.x,0.,position.y*size.y);vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float time;varying vec2 vUv;varying vec3 vT;varying float vS;
#include <fog_pars_fragment>

  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){float x=abs(vUv.x-.5)*2.;float y=abs(vUv.y-.5)*2.;float band=n(vec2(vUv.x*3.+vS*9.,vUv.y*18.-time*1.3+vS*20.));float a=pow(1.-x,1.6)*(1.-y*y)*smoothstep(.3,.75,band);${fogFade}gl_FragColor=vec4(vT*a*.9*fogF,1.);}`});
 const m=new THREE.Mesh(instGeo(items.length,[['offset',off,3],['size',sz,2],['tint',col,3],['seed',seed,1]]),mat);m.geometry.attributes.position=m.geometry.attributes.position;m.frustumCulled=false;m.renderOrder=4;
 // PlaneGeometry lies in XY; our vertex shader maps XY → XZ.
 root.add(m);return {mesh:m,update(t){mat.uniforms.time.value=t;}};
}
// Snow-laden firs/cedars: layered drooping boughs of needle cutout cards with snow clumps that
// follow each bough. Three irregular prototypes are instanced; far trees use crossed cards.
function firPrototype(seed){const R=rng(seed),cards=[],snow=[],trunk=[];const H=10+R()*5,n=9+Math.floor(R()*4);
 trunk.push(new THREE.CylinderGeometry(.1,.34,H*.96,7).translate(0,H*.48,0));
 for(let i=0;i<n;i++){const t=i/(n-1),y=1.5+t*(H-2.6)+(R()-.5)*.3,r=Math.pow(1-t,.85)*(2.7+R()*.6)+.45,cnt=Math.round(5+4*(1-t)+R()*2),off=R()*6.28;
  for(let j=0;j<cnt;j++){const a=off+j/cnt*Math.PI*2+(R()-.5)*.5,L=r*(.75+R()*.4),droop=.28+.3*(1-t)+R()*.15,ya=y+(R()-.5)*.35;
   const c1=new THREE.PlaneGeometry(L*1.35,L*.8);c1.rotateX(-Math.PI/2);c1.translate(L*.58,0,0);c1.rotateZ(-droop);c1.rotateY(a);c1.translate(0,ya,0);cards.push(c1);
   const c2=new THREE.PlaneGeometry(L*1.2,L*.55);c2.translate(L*.55,-L*.12,0);c2.rotateZ(-droop-.1);c2.rotateY(a);c2.translate(0,ya,0);cards.push(c2);
   if(R()<.8){const sn=smooth(new THREE.IcosahedronGeometry(1,1));const sp=sn.attributes.position;for(let q=0;q<sp.count;q++){const yy=sp.getY(q);sp.setY(q,yy<0?yy*.25:yy);}sn.computeVertexNormals();sn.scale(L*.3,.1+.08*(1-t)+R()*.05,L*.14+.04);sn.translate(L*.42+R()*L*.15,.06,0);sn.rotateZ(-droop*.92);sn.rotateY(a);sn.translate(0,ya,0);snow.push(sn);}}}
 for(let j=0;j<4;j++){const c=new THREE.PlaneGeometry(.9,1.6);c.translate(0,.8,0);c.rotateY(j*Math.PI/4);c.translate(0,H-.8,0);cards.push(c);}
 const cap=smooth(new THREE.IcosahedronGeometry(1,1));cap.scale(.3,.42,.3);cap.translate(0,H-.2,0);snow.push(cap);
 const norm=a=>a.map(g=>{g=g.index?g.toNonIndexed():g;if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});return {cards:mergeGeometries(norm(cards)),snow:mergeGeometries(norm(snow)),trunk:trunk[0],H};}
let FIRS=null,FAR=null;
function farTexture(){const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.clearRect(0,0,256,512);g.fillStyle='#3a2a20';g.fillRect(122,380,12,132);
 for(let i=0;i<11;i++){const t=i/10,y=470-t*440,w=(1-t)*118+14;g.fillStyle=i%2?'#18261f':'#1c2c24';g.beginPath();g.moveTo(128,y-58);g.quadraticCurveTo(128+w*.5,y-30,128+w,y+6);g.lineTo(128-w,y+6);g.quadraticCurveTo(128-w*.5,y-30,128,y-58);g.fill();
  g.fillStyle='#dfe7f0';g.beginPath();g.moveTo(128,y-56);g.quadraticCurveTo(128+w*.45,y-30,128+w*.9,y-2);g.quadraticCurveTo(128+w*.4,y-16,128,y-34);g.quadraticCurveTo(128-w*.4,y-16,128-w*.9,y-2);g.quadraticCurveTo(128-w*.45,y-30,128,y-56);g.fill();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export async function snowTrees(root,positions,{M,near=()=>true}={}){
 const leaf=await texture('pine-foliage');
 if(!FIRS)FIRS=[1,2,3].map(s=>firPrototype(9000+s*77));
 const needle=windMaterial(new THREE.MeshStandardMaterial({map:leaf,color:0x7d8f86,alphaTest:.42,side:THREE.DoubleSide,roughness:1}),.08);
 const bark=new THREE.MeshStandardMaterial({color:0x3a2c22,roughness:1});const snowMat=M?.snow||new THREE.MeshStandardMaterial({color:0xe3eaf3,roughness:.9});
 const groups=[[],[],[]],far=[];positions.forEach((p,i)=>{if(near(p[0],p[2]))groups[i%3].push(p);else far.push(p);});
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),sc=new THREE.Vector3();const out=[];
 groups.forEach((list,gi)=>{if(!list.length)return;const P=FIRS[gi];for(const [geo,mat] of [[P.cards,needle],[P.snow,snowMat],[P.trunk,bark]]){const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach(([x,y,z,s],i)=>{const h=Math.abs(Math.sin(x*12.9+z*78.2));e.set((h-.5)*.05,h*40,(h-.5)*.05);q.setFromEuler(e);m.compose(v.set(x,y-.25,z),q,sc.set(s*.85,s*(.8+h*.45),s*.85));im.setMatrixAt(i,m);});im.castShadow=true;im.receiveShadow=true;root.add(im);out.push(im);}});
 if(far.length){if(!FAR)FAR=farTexture();const g1=new THREE.PlaneGeometry(7.5,13);g1.translate(0,6.3,0);const g2=g1.clone().rotateY(Math.PI/2);const geo=mergeGeometries([g1,g2]);const mat=new THREE.MeshStandardMaterial({map:FAR,alphaTest:.5,side:THREE.DoubleSide,roughness:1});const im=new THREE.InstancedMesh(geo,mat,far.length);far.forEach(([x,y,z,s],i)=>{const h=Math.abs(Math.sin(x*3.1+z*7.7));q.setFromAxisAngle(v.set(0,1,0),h*6.28);m.compose(new THREE.Vector3(x,y-.3,z),q,sc.set(s,s*(.85+h*.4),s));im.setMatrixAt(i,m);});im.castShadow=true;root.add(im);out.push(im);}
 return out;}
// A boulder with a snow cap derived from its own upper surface, so the snow hugs the rock.
export function snowBoulder(k,M,g,x,y,z,s,R,{cap=.42,rockMat}={}){let geo=smooth(new THREE.IcosahedronGeometry(1,3));const p=geo.attributes.position,ph=R()*10;
 for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=1+.14*Math.sin(a*7+b*5+c*9+ph)+.07*Math.sin(a*13-c*11+ph*2);p.setXYZ(i,a*f,b*f,c*f);}geo.computeVertexNormals();
 const cg=geo.clone(),cp=cg.attributes.position;for(let i=0;i<cp.count;i++){const yy=cp.getY(i);if(yy<cap){const f=Math.max(.35,1-(cap-yy)*1.6);cp.setXYZ(i,cp.getX(i)*f*.9,cap-.06-(1-f)*.1,cp.getZ(i)*f*.9);}else{const e=Math.min(1,(yy-cap)*3),th=.03+.08*e;cp.setXYZ(i,cp.getX(i)*(1+.035*e),yy+th,cp.getZ(i)*(1+.035*e));}}cg.computeVertexNormals();cg.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(cp.count*2),2));geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(p.count*2),2));
 const G=new THREE.Group();G.position.set(x,y+s*.25,z);G.rotation.y=R()*6.28;G.scale.set(s*(.8+R()*.4),s*.55,s*(.7+R()*.5));g.add(G);const r=new THREE.Mesh(geo,rockMat||M.rock);r.castShadow=r.receiveShadow=true;G.add(r);const c=new THREE.Mesh(cg,M.snow);c.castShadow=c.receiveShadow=true;G.add(c);return G;}
// Heightfield terrain coloured by slope: snow on gentle ground, slate rock on steep faces.
export function terrain(root,k,{size=400,seg=200,cx=0,cz=0,height,snow=0xdfe6ef,rockCol=0x2c3036,rockSlope=[.5,.78],repeat=60}){
 const g=new THREE.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i)+cx,p.getZ(i)+cz));g.translate(cx,0,cz);g.computeVertexNormals();
 const n=g.attributes.normal,col=new Float32Array(p.count*3),a=new THREE.Color(snow),b=new THREE.Color(rockCol),c=new THREE.Color();
 for(let i=0;i<p.count;i++){const t=THREE.MathUtils.smoothstep(n.getY(i)+(fbm(p.getX(i)*.08,p.getZ(i)*.08,3)-.5)*.25,rockSlope[0],rockSlope[1]);c.copy(b).lerp(a,t);col.set([c.r,c.g,c.b],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));const nm=k.maps.rock[1].clone();nm.repeat.set(repeat,repeat);
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,normalMap:nm,normalScale:new THREE.Vector2(.5,.5)}));m.receiveShadow=true;root.add(m);return m;
}
// Instanced snow drifts / mounds. items: [x,y,z,sx,sy,sz]
export function snowMounds(root,M,items){const geo=smooth(new THREE.IcosahedronGeometry(1,2)),p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=1+.12*Math.sin(x*5+z*4)+.06*Math.sin(y*9);p.setXYZ(i,x*f,Math.max(y,-.2)*f,z*f);}geo.computeVertexNormals();
 const im=new THREE.InstancedMesh(geo,M.snow,items.length),m=new THREE.Matrix4(),q=new THREE.Quaternion();items.forEach(([x,y,z,sx,sy,sz],i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28);m.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,sy,sz));im.setMatrixAt(i,m);});im.receiveShadow=true;im.castShadow=true;root.add(im);return im;}
// Distant mountain ring with snow fields and dark ridges.
export function mountains(root,k,{r0=180,r1=650,peak=260,seed=3,cx=0,cz=0}={}){const o=seed*13.7;return terrain(root,k,{size:1800,seg:150,cx,cz,height:(x,z)=>{const r=Math.hypot(x-cx,z-cz),t=THREE.MathUtils.smoothstep(r,r0,r0+160);return -20+t*(peak*(.35+ridged(x*.004+o,z*.004)*.95)+fbm(x*.02,z*.02,3)*20);},rockSlope:[.55,.82],repeat:120});}

// Stone lantern (tōrō) with a glowing firebox and a snow cap; returns the firebox position.
export function stoneLantern(k,M,g,x,z,y0=0,s=1){k.box(.7*s,.2*s,.7*s,x,y0+.1*s,z,M.stone,g);k.cylinder(.13*s,.16*s,.9*s,x,y0+.65*s,z,M.stone,8,g);k.box(.62*s,.14*s,.62*s,x,y0+1.16*s,z,M.stone,g);k.box(.42*s,.4*s,.42*s,x,y0+1.43*s,z,M.stone,g);
 for(const r of [0,Math.PI/2]){const w=k.box(.22*s,.24*s,.44*s,x,y0+1.45*s,z,M.lampGlass,g);w.rotation.y=r;}
 k.cylinder(.08*s,.62*s,.32*s,x,y0+1.8*s,z,M.stone,6,g);k.cylinder(.06*s,.55*s,.18*s,x,y0+1.98*s,z,M.snow,6,g);k.cylinder(.06*s,.1*s,.2*s,x,y0+2.08*s,z,M.stone,6,g);return new THREE.Vector3(x,y0+1.45*s,z);}
// Flat, irregular snow patches lying on paving. items: [x,y,z,sx,sz]
export function snowPatches(root,M,items,{color=0xe2e9f2,opacity=1,roughness=.9}={}){
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,256,256);
 for(let i=0;i<34;i++){const a=Math.random()*6.28,r=Math.random()*70,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r*.8,s=20+Math.random()*44;const gr=g.createRadialGradient(x,y,0,x,y,s);gr.addColorStop(0,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,s,0,7);g.fill();}
 const t=new THREE.CanvasTexture(c);const mat=new THREE.MeshStandardMaterial({color,roughness,opacity,alphaMap:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const geo=new THREE.PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);
 const im=new THREE.InstancedMesh(geo,mat,items.length),m=new THREE.Matrix4(),q=new THREE.Quaternion();items.forEach(([x,y,z,sx,sz],i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28);m.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,1,sz));im.setMatrixAt(i,m);});im.receiveShadow=true;im.renderOrder=1;root.add(im);return im;}
// Falling water sheet: scrolling streaks with foam toward the bottom (uv.y=0 bottom).
export function fallSheet(root,geometry,{color=0xdfeaf4,speed=1.6,opacity=.85,streaks=34}={}){
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},color:{value:new THREE.Color(color)},speed:{value:speed},opacity:{value:opacity},streaks:{value:streaks}}]),
  vertexShader:`varying vec2 vUv;${fogParsV()}void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float time,speed,opacity,streaks;uniform vec3 color;varying vec2 vUv;
  #include <fog_pars_fragment>
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){float s=n(vec2(vUv.x*streaks,vUv.y*3.+time*speed))*.6+n(vec2(vUv.x*streaks*2.3,vUv.y*7.+time*speed*1.7))*.4;float edge=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);float foam=smoothstep(.25,0.,vUv.y);float a=(smoothstep(.35,.75,s)*.85+.15+foam*.6)*edge*opacity;gl_FragColor=vec4(color*(.75+.35*s+foam*.3),min(a,1.));
  #include <fog_fragment>
  }`});
 const m=new THREE.Mesh(geometry,mat);m.renderOrder=3;root.add(m);return {mesh:m,update(t){mat.uniforms.time.value=t;}};
}
// Open-fronted smithy: hearth with hood, anvil, quench trough, sword rack, bellows, charcoal.
// Local front (+Z) is open. Returns hearth glow position (world) and smoke vent position.
export function smithy(k,M,{x,z,rot=0,W=8,D=7,parent,seed=1,rust=.3,sign=-1,H=3.6,rise}){const R=rng(seed),g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);const box=(w,h,d,px,py,pz,m)=>k.box(w,h,d,px,py,pz,m,g);
 box(W+.2,.3,D+.2,0,.15,-D/2,M.stone);box(W-.2,.06,D-.4,0,.32,-D/2,M.clay);
 box(W,H,.2,0,H/2+.3,-D+.1,M.plaster);for(const s of [-1,1]){box(.2,H,D,s*(W/2-.1),H/2+.3,-D/2,M.innWood);for(let y=.9;y<H;y+=.62)box(.24,.06,D,s*(W/2-.1),y,-D/2,M.innDark);}
 for(const px of [-W/2+.15,-W/6,W/6,W/2-.15])box(.26,H+.1,.26,px,H/2+.3,-.15,M.innDark);box(W+.2,.32,.3,0,H+.3,-.15,M.innDark);
 for(let i=-W/2+.4;i<W/2;i+=.9)box(.06,H*.8,.04,i,H/2+.5,-D+.24,M.innDark);for(const s of [-1,1]){box(1.7,1.0,.06,s*W/4,H-.5,-D+.22,M.window);for(let j=-.6;j<=.6;j+=.3)box(.04,1.0,.08,s*W/4+j,H-.5,-D+.25,M.innDark);}
 snowRoof(k,M,g,{y:H+.42,z:-D/2,w:W,d:D+.4,rise:rise??(1.7+R()*.4),over:.95,side:.45,R});
 // Hearth: clay box, glowing coal bed, hood and chimney through the roof.
 const hx=-W/2+1.6,hz=-D+1.4;box(2.0,.95,1.6,hx,.78,hz,M.clay);box(1.4,.08,1.0,hx,1.27,hz,M.ember);k.rock(hx-.3,1.32,hz+.1,.18,M.charcoal,g);k.rock(hx+.25,1.32,hz-.2,.16,M.charcoal,g);
 box(2.2,.18,1.8,hx,2.6,hz,M.clay);k.cylinder(.55,1.0,.8,hx,2.2,hz,M.clay,4,g).rotation.y=Math.PI/4;k.cylinder(.32,.38,H+1.8,hx,2.6+(H+1.8)/2,hz,M.clay,8,g);k.cylinder(.2,.42,.2,hx,H+4.6,hz,M.snow,8,g);
 // Box bellows beside the hearth.
 box(.7,.8,1.6,hx+1.45,.75,hz,M.innWood);box(.08,.08,1.2,hx+1.45,1.25,hz+.9,M.innDark);
 // Anvil on a stump, hammers, tongs.
 const ax=hx+.4,az=-D/2+.4;k.cylinder(.38,.42,.7,ax,.67,az,M.innWood,10,g);box(.7,.22,.28,ax,1.13,az,M.iron);box(.42,.16,.2,ax,.96,az,M.iron);k.cylinder(.02,.11,.22,ax+.45,1.13,az,M.iron,6,g).rotation.z=Math.PI/2;box(.04,.04,.42,ax-.1,1.3,az+.05,M.innWood);box(.12,.1,.08,ax-.1,1.3,az-.17,M.iron);
 // Quench trough of dark water.
 box(1.6,.6,.6,W/2-1.3,.62,-D+1.0,M.innWood);box(1.45,.04,.46,W/2-1.3,.9,-D+1.0,new THREE.MeshStandardMaterial({color:0x0b1418,roughness:.08,metalness:.2}));
 // Sword rack against the back wall — rusted blades among the bright ones.
 box(2.4,.08,.12,W/2-1.8,1.9,-D+.38,M.innWood);box(2.4,.08,.12,W/2-1.8,.9,-D+.38,M.innWood);for(let i=0;i<6;i++){const bx=W/2-2.8+i*.4,ru=R()<rust;box(.035,1.45,.07,bx,1.45,-D+.46,ru?M.rust:M.steel);box(.14,.03,.1,bx,2.12,-D+.46,M.iron);k.cylinder(.025,.025,.3,bx,2.3,-D+.46,M.innDark,6,g);}
 // Tools on pegs, charcoal sacks, an iron bloom on the floor.
 for(let i=0;i<4;i++){box(.04,.6+R()*.3,.04,-W/2+.35,1.6,-D+2.6+i*.35,M.iron);}for(let i=0;i<3;i++){const c=k.cylinder(.3,.34,.7,W/2-.6,.65,-D+2.6+i*.65,M.rope,8,g);c.rotation.z=(R()-.5)*.3;}k.rock(.3,.45,-D/2-.6,.32,M.rust,g);
 // Snow banked against the side walls; signboard.
 if(sign>=0){const s=k.mesh(signGeometry(.55,1.6,sign),M.signs,-W/2-.12,2.2,-.25,g);s.rotation.y=-Math.PI/2;}
 g.updateMatrixWorld(true);return {hearth:g.localToWorld(new THREE.Vector3(hx,1.6,hz)),vent:g.localToWorld(new THREE.Vector3(hx,H+4.8,hz)),anvil:g.localToWorld(new THREE.Vector3(ax,1,az)),group:g};
}
