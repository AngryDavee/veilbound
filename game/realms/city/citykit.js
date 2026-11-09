import * as THREE from 'three';
// World II building kit. Everything here is code-built: procedural canvas textures for brick,
// granite setts and signage; a single-draw-call glow field for lamp halos; camera-facing wet-street
// reflection streaks; and generators for Taisho brick arcades, timber machiya and street furniture.
// Geometry goes into k.batch (baked by k.finish); lines/points/instanced effects go straight to root.

export const JP_FONT="'Hiragino Mincho ProN','Hiragino Sans','Hiragino Sans GB','Yu Mincho','Noto Serif CJK JP',serif";
export function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

export function canvasTexture(w,h,draw,{srgb=true,repeat=true}={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}

// A box whose UVs are in world metres / tile, so one material keeps constant texel density.
export function uvBox(w,h,d,tile=2){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let i=0;i<4;i++){const j=f*4+i;uv.setXY(j,uv.getX(j)*dims[f][0]/tile,uv.getY(j)*dims[f][1]/tile);}return g;}
export function colored(geo,color){const c=new THREE.Color(color),n=geo.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;}

function brickCanvas(ctx,w,h,{base=[122,58,40],spread=26,mortar='#8d8173',soot=.0}={}){const r=rng(91);ctx.fillStyle=mortar;ctx.fillRect(0,0,w,h);const rows=26,cols=9,bh=h/rows,bw=w/cols;
 for(let y=0;y<rows;y++){const off=(y%2)*bw/2;for(let x=-1;x<=cols;x++){const v=(r()-.5)*spread,dark=r()<.08?-30:0,burn=r()<.05?-45:0;ctx.fillStyle=`rgb(${base[0]+v+dark+burn|0},${base[1]+v*.6+dark+burn*.5|0},${base[2]+v*.4+dark|0})`;const px=x*bw+off+1.5,py=y*bh+1.5;ctx.fillRect(px,py,bw-3,bh-3);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(px,py+bh-5,bw-3,2);ctx.fillStyle='rgba(255,230,200,.05)';ctx.fillRect(px,py,bw-3,2);for(let s=0;s<6;s++){ctx.fillStyle=`rgba(0,0,0,${r()*.12})`;ctx.fillRect(px+r()*bw,py+r()*bh,2+r()*5,1+r()*3);}}}
 if(soot){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgba(10,8,8,${soot})`);g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(10,8,8,${soot*.6})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}}
function settsCanvas(ctx,w,h){const r=rng(7);ctx.fillStyle='#1a1d22';ctx.fillRect(0,0,w,h);const rows=20,sh=h/rows;for(let y=0;y<rows;y++){let x=-r()*30;while(x<w){const sw=34+r()*26,v=(r()-.5)*28;const g=62+v;ctx.fillStyle=`rgb(${g|0},${g+3|0},${g+8|0})`;ctx.beginPath();ctx.roundRect?ctx.roundRect(x+2,y*sh+2,sw-4,sh-4,5):ctx.rect(x+2,y*sh+2,sw-4,sh-4);ctx.fill();ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(x+4,y*sh+3,sw-8,2);x+=sw;}}}
function settsRough(ctx,w,h){const r=rng(8);ctx.fillStyle='#7a7a7a';ctx.fillRect(0,0,w,h);for(let i=0;i<70;i++){const x=r()*w,y=r()*h,rad=10+r()*60,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'rgba(20,20,20,.9)');g.addColorStop(1,'rgba(20,20,20,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);}const rows=20,sh=h/rows;ctx.fillStyle='rgba(30,30,30,.8)';for(let y=0;y<rows;y++)ctx.fillRect(0,y*sh-1,w,3);}

function chochinMat(c1,c2){const t=canvasTexture(128,128,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,c2);g.addColorStop(.5,c1);g.addColorStop(1,c2);c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='rgba(40,8,0,.35)';for(let y=6;y<h;y+=9)c.fillRect(0,y,w,2);c.fillStyle='#1a0c08';c.fillRect(0,0,w,10);c.fillRect(0,h-10,w,10);});return new THREE.MeshBasicMaterial({map:t,toneMapped:false});}
export function cityMaterials(k){
 const brickTex=canvasTexture(512,512,(c,w,h)=>brickCanvas(c,w,h));const brickTex2=canvasTexture(512,512,(c,w,h)=>brickCanvas(c,w,h,{base:[96,46,36],spread:30,soot:.35}));const brickTex3=canvasTexture(512,512,(c,w,h)=>brickCanvas(c,w,h,{base:[142,82,56],spread:22,mortar:'#9d9384'}));
 const nrm=k.maps.rock[1].clone();nrm.repeat.set(1,1);
 const std=(o)=>new THREE.MeshStandardMaterial(o);
 const fromKit=(name,color,rough=.85)=>{const m=std({color,roughness:rough});m.map=k.maps[name][0].clone();m.map.repeat.set(1,1);m.normalMap=k.maps[name][1].clone();m.normalMap.repeat.set(1,1);m.normalScale.set(.4,.4);return m;};
 const setts=canvasTexture(512,512,settsCanvas),settsR=canvasTexture(512,512,settsRough,{srgb:false});
 return {
  brick:std({map:brickTex,normalMap:nrm,normalScale:new THREE.Vector2(.35,.35),roughness:.88}),
  brickDark:std({map:brickTex2,normalMap:nrm,normalScale:new THREE.Vector2(.35,.35),roughness:.9}),
  brickLight:std({map:brickTex3,normalMap:nrm,normalScale:new THREE.Vector2(.35,.35),roughness:.86}),
  trim:fromKit('stone',0xd2c8b4,.8),granite:fromKit('stone',0x8a8c90,.7),curb:fromKit('rock',0x8d9094,.6),
  timber:fromKit('cedar',0x4a3426,.82),timberDark:fromKit('cedar',0x2a1e17,.85),plaster:fromKit('plaster',0xd9ccb0,.92),plasterOchre:fromKit('plaster',0xb9935e,.92),
  tile:fromKit('stone',0x2c3540,.55),tileDark:fromKit('stone',0x1f252c,.6),
  road:std({map:setts,roughnessMap:settsR,roughness:.55,metalness:.05,color:0xb6bcc8}),
  sidewalk:fromKit('stone',0x747a80,.42),
  iron:std({color:0x1d2124,roughness:.45,metalness:.65}),rail:std({color:0x9aa2aa,roughness:.25,metalness:.9}),brass:std({color:0x9c7a45,roughness:.38,metalness:.8}),
  glassDark:std({color:0x0b1118,roughness:.08,metalness:.4}),
  lit:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),
  lampGlass:new THREE.MeshBasicMaterial({color:0xffd9a0,toneMapped:false}),chochin:chochinMat('#e8452a','#7a1408'),chochinWhite:chochinMat('#ffe2b0','#c08040'),
  red:std({color:0xa3271c,roughness:.55}),cream:std({color:0xd6c9a4,roughness:.7}),maroon:std({color:0x5a1e1c,roughness:.6}),
  canvasCloth:std({color:0x3c3a36,roughness:1,side:THREE.DoubleSide}),
  puddle:std({color:0x0a0d12,roughness:.04,metalness:.6}),
  vermilion:std({color:0xb8321e,roughness:.55}),vermilionDark:std({color:0x7e2216,roughness:.6}),
  black:std({color:0x111214,roughness:.9}),wire:new THREE.LineBasicMaterial({color:0x0c0d10,transparent:true,opacity:.85}),
 };
}

const signCache=new Map();
export function signMaterial(text,{w=512,h=128,vertical=false,bg='#2a1d14',fg='#e8d6a8',border='#8a6a3a',font=JP_FONT,size=0,emissive=false}={}){
 const key=[text,w,h,vertical,bg,fg,border,emissive].join('|');if(signCache.has(key))return signCache.get(key);
 const t=canvasTexture(w,h,(c)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);const r=rng(text.length*31);for(let i=0;i<300;i++){c.fillStyle=`rgba(0,0,0,${r()*.08})`;c.fillRect(r()*w,r()*h,1+r()*12,1+r()*2);}c.strokeStyle=border;c.lineWidth=Math.min(w,h)*.05;c.strokeRect(c.lineWidth/2,c.lineWidth/2,w-c.lineWidth,h-c.lineWidth);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
  if(vertical){const chars=[...text],fs=size||Math.min(w*.7,(h*.86)/chars.length);c.font=`700 ${fs}px ${font}`;chars.forEach((ch,i)=>c.fillText(ch,w/2,h*.07+fs*(i+.5)));}
  else{const fs=size||Math.min(h*.62,w*.86/Math.max(1,[...text].length)*1.05);c.font=`700 ${fs}px ${font}`;c.fillText(text,w/2,h/2+fs*.04);}},{repeat:false});
 const m=emissive?new THREE.MeshBasicMaterial({map:t,toneMapped:false}):new THREE.MeshStandardMaterial({map:t,roughness:.8});signCache.set(key,m);return m;}
export function norenMaterial(text,color='#1f2c4a',fg='#efe6d2'){const key='noren|'+text+color;if(signCache.has(key))return signCache.get(key);
 const t=canvasTexture(256,256,c=>{c.fillStyle=color;c.fillRect(0,0,256,256);c.fillStyle='rgba(0,0,0,.25)';for(let i=1;i<3;i++)c.fillRect(i*256/3-2,0,4,256);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`700 92px ${JP_FONT}`;c.fillText(text,128,120);c.beginPath();c.arc(128,120,104,0,Math.PI*2);c.lineWidth=6;c.strokeStyle=fg;c.stroke();},{repeat:false});
 const m=new THREE.MeshStandardMaterial({map:t,roughness:1,side:THREE.DoubleSide});signCache.set(key,m);return m;}

// One draw call for every halo. Size is in metres; fog fades them with distance.
export function glowField(root,renderer,{fogK=.004}={}){const items=[];const api={add(x,y,z,size,color=0xffbe70,alpha=1){const c=new THREE.Color(color);items.push([x,y,z,size,c.r,c.g,c.b,alpha]);},build(){
 const n=items.length,pos=new Float32Array(n*3),size=new Float32Array(n),col=new Float32Array(n*4);items.forEach((it,i)=>{pos.set(it.slice(0,3),i*3);size[i]=it[3];col.set(it.slice(4),i*4);});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('size',new THREE.BufferAttribute(size,1));g.setAttribute('tint',new THREE.BufferAttribute(col,4));
 api.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{halfH:{value:450},fogK:{value:fogK},time:{value:0}},
  vertexShader:'attribute float size;attribute vec4 tint;uniform float halfH,fogK,time;varying vec4 vT;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=-mv.z;float flick=.93+.07*sin(time*7.+position.x*3.+position.z*2.);vT=vec4(tint.rgb,tint.a*exp(-d*fogK)*flick);gl_PointSize=min(512.,size*projectionMatrix[1][1]*halfH/max(d,.1));}',
  fragmentShader:'varying vec4 vT;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;if(r>1.)discard;float a=exp(-r*r*5.)*.85+exp(-r*18.)*.9;gl_FragColor=vec4(vT.rgb*a*vT.a,1.);}'});
 api.points=new THREE.Points(g,api.material);api.points.frustumCulled=false;api.points.renderOrder=5;root.add(api.points);return api.points;},
 update(t){if(!api.material)return;api.material.uniforms.time.value=t;const s=renderer.getDrawingBufferSize(new THREE.Vector2());api.material.uniforms.halfH.value=s.y/2;}};return api;}

// Wet-ground reflections: each lamp gets a streak that always stretches toward the viewer.
export function streakField(root,{y=.03,fade=.012}={}){const items=[];const api={add(x,z,width,length,color=0xffb060,alpha=.5){const c=new THREE.Color(color);items.push([x,z,width,length,c.r*alpha,c.g*alpha,c.b*alpha]);},build(){
 const base=new THREE.PlaneGeometry(1,1,1,6);base.translate(0,.5,0);const g=new THREE.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
 const n=items.length,c=new Float32Array(n*4),col=new Float32Array(n*3);items.forEach((it,i)=>{c.set([it[0],it[1],it[2],it[3]],i*4);col.set(it.slice(4),i*3);});g.setAttribute('inst',new THREE.InstancedBufferAttribute(c,4));g.setAttribute('tint',new THREE.InstancedBufferAttribute(col,3));g.instanceCount=n;
 api.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},gy:{value:y},fade:{value:fade}},
  vertexShader:'attribute vec4 inst;attribute vec3 tint;uniform float gy;varying vec2 vUv;varying vec3 vT;varying float vD;void main(){vec2 c=inst.xy;vec2 dir=normalize(cameraPosition.xz-c+vec2(.0001));vec2 perp=vec2(-dir.y,dir.x);float dist=length(cameraPosition.xz-c);float len=min(inst.w,dist*.85);vec2 p=c+perp*position.x*inst.z*(1.+position.y*.6)+dir*position.y*len;vUv=uv;vT=tint;vD=dist;gl_Position=projectionMatrix*viewMatrix*vec4(p.x,gy,p.y,1.);}',
  fragmentShader:'uniform float time,fade;varying vec2 vUv;varying vec3 vT;varying float vD;void main(){float x=abs(vUv.x-.5)*2.;float ripple=.75+.25*sin(vUv.y*60.-time*3.)*sin(vUv.y*23.+time*1.7);float a=pow(1.-x,2.2)*pow(1.-vUv.y,1.4)*ripple*exp(-vD*fade);gl_FragColor=vec4(vT*a,1.);}'});
 api.mesh=new THREE.Mesh(g,api.material);api.mesh.frustumCulled=false;api.mesh.renderOrder=4;root.add(api.mesh);return api.mesh;},update(t){if(api.material)api.material.uniforms.time.value=t;}};return api;}

// Overhead wires: one LineSegments object with sagging catenaries.
export function wireField(root,mat){const segs=[];return{add(a,b,sag=.6,steps=14){let prev=null;for(let i=0;i<=steps;i++){const t=i/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t];if(prev)segs.push(...prev,...p);prev=p;}},build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(segs,3));const l=new THREE.LineSegments(g,mat);root.add(l);return l;}};}

export function makeTools(k,M){
 const B=k.batch;
 const put=(geo,mat,x,y,z,g=B,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const bx=(w,h,d,x,y,z,mat,g=B,tile=2)=>put(uvBox(w,h,d,tile),mat,x,y,z,g);
 const litBox=(w,h,d,x,y,z,color,g=B)=>{const m=put(colored(new THREE.BoxGeometry(w,h,d),color),M.lit,x,y,z,g);m.castShadow=false;return m;};
 const litPlane=(w,h,x,y,z,color,g=B)=>{const m=put(colored(new THREE.PlaneGeometry(w,h),color),M.lit,x,y,z,g);m.castShadow=false;return m;};
 const cyl=(r1,r2,h,x,y,z,mat,seg=10,g=B)=>put(new THREE.CylinderGeometry(r1,r2,h,seg),mat,x,y,z,g);
 return {put,bx,litBox,litPlane,cyl};
}

const WARM=[0xffc070,0xffb45c,0xffd49a,0xffa850,0xf6c890];
// An arched window assembly pasted on a wall face at local z (facing +z).
function archWindow(T,M,g,x,y,z,w,h,lit,r){const {bx,put,litPlane}=T;const col=WARM[(r()*WARM.length)|0];
 const frame=M.trim;bx(w+.3,.14,.18,x,y-h/2-.07,z+.05,frame,g);// sill
 for(const s of [-1,1])bx(.14,h,.14,x+s*(w/2+.07),y,z+.05,frame,g);
 const arch=put(new THREE.RingGeometry(w/2,w/2+.16,16,1,0,Math.PI),frame,x,y+h/2,z+.12,g);arch.castShadow=false;bx(.22,.3,.16,x,y+h/2+w/2+.06,z+.08,frame,g);
 if(lit){const c=new THREE.Color(col).multiplyScalar(.55+r()*.45);litPlane(w,h,x,y,z+.03,c,g);const top=put(colored(new THREE.CircleGeometry(w/2,16,0,Math.PI),c),M.lit,x,y+h/2,z+.03,g);top.castShadow=false;}
 else{put(new THREE.PlaneGeometry(w,h),M.glassDark,x,y,z+.03,g);put(new THREE.CircleGeometry(w/2,16,0,Math.PI),M.glassDark,x,y+h/2,z+.03,g);}
 bx(.05,h+w/2,.05,x,y+w/4,z+.07,M.timberDark,g);for(let i=1;i<3;i++)bx(w,.04,.05,x,y-h/2+i*h/3,z+.07,M.timberDark,g);}

// Taisho brick commercial block. Local: front at +z, base y=0, centered.
export function brickBlock(T,M,o){const {w,d=10,floors=2,seed=1,mat=M.brick,shop='',noren=null,clock=false,parapet=true,awning=null}=o;const r=rng(seed);const g=new THREE.Group();const {bx,litBox,litPlane,put,cyl}=T;
 const fh=[4.4,3.9,3.6];let H=0;for(let i=0;i<floors;i++)H+=fh[i];const fz=d/2;
 bx(w,H,d,0,H/2,0,mat,g);bx(w+.3,.5,d+.3,0,.25,0,M.granite,g);
 const bays=Math.max(2,Math.round(w/3.4)),bw=w/bays;
 // Ground floor shopfronts: piers, lit glass, transoms and a fascia sign.
 for(let i=0;i<=bays;i++)bx(.42,4.2,.3,-w/2+i*bw,2.1,fz+.12,M.trim,g);
 for(let i=0;i<bays;i++){const x=-w/2+(i+.5)*bw,lit=r()<.62,col=new THREE.Color(WARM[(r()*5)|0]).multiplyScalar(lit?.75+r()*.35:.12);litPlane(bw-.6,2.6,x,1.85,fz+.03,col,g);for(let j=1;j<4;j++)bx(.05,2.6,.06,x-bw/2+.3+j*(bw-.6)/4,1.85,fz+.06,M.timberDark,g);bx(bw-.5,.12,.1,x,3.2,fz+.07,M.timberDark,g);bx(bw-.5,.9,.12,x,.45,fz+.06,M.timberDark,g);litPlane(bw-.6,.5,x,3.55,fz+.03,col.clone().multiplyScalar(.7),g);
  if(!lit&&r()<.6){for(let s=0;s<14;s++)bx(bw-.6,.17,.05,x,.55+s*.19,fz+.1,M.iron,g);}}
 bx(w+.2,.55,.3,0,4.15,fz+.15,M.trim,g);
 if(shop){const s=put(new THREE.PlaneGeometry(Math.min(w*.7,6),.48),signMaterial(shop,{w:640,h:96,bg:'#1d1a17',fg:'#e9cf8f',border:'#6e5a36'}),0,4.15,fz+.31,g);s.castShadow=false;}
 if(awning){for(let i=0;i<bays;i++){const x=-w/2+(i+.5)*bw;const a=put(new THREE.PlaneGeometry(bw-.4,1.3),awning,x,3.55,fz+.65,g);a.rotation.x=-1.0;}}
 // Upper floors: arched windows, string courses, cornice and a stepped parapet.
 let y=4.4;for(let f=1;f<floors;f++){const h=fh[f];bx(w+.25,.22,.3,0,y+.11,fz+.12,M.trim,g);for(let i=0;i<bays;i++){const x=-w/2+(i+.5)*bw;archWindow(T,M,g,x,y+h*.45,fz,Math.min(1.2,bw*.42),h*.42,r()<.5,r);}y+=h;}
 bx(w+.5,.35,.6,0,H+.05,fz-.05,M.trim,g);for(let i=0;i<w*2;i++)bx(.14,.16,.14,-w/2+.25+i*.5,H-.2,fz+.2,M.trim,g);
 if(parapet){bx(w,.9,.35,0,H+.65,fz-.1,mat,g);bx(w+.1,.12,.45,0,H+1.15,fz-.1,M.trim,g);bx(w*.32,1.4,.36,0,H+1.4,fz-.1,mat,g);bx(w*.36,.14,.46,0,H+2.15,fz-.1,M.trim,g);}
 for(const s of [-1,1])bx(.5,H+.4,.45,s*(w/2-.1),(H+.4)/2,fz+.05,M.trim,g,1);
 // Side elevations get their own windows so corner buildings never show blank walls.
 for(const s of [-1,1]){const sg=new THREE.Group();sg.rotation.y=s*Math.PI/2;g.add(sg);const sb=Math.max(1,Math.round((d-2)/3.4)),sw=(d-2)/sb;let yy=4.4;for(let f=1;f<floors;f++){bx(d,.22,.3,0,yy+.11,w/2+.12,M.trim,sg);for(let i=0;i<sb;i++)archWindow(T,M,sg,-d/2+1+(i+.5)*sw,yy+fh[f]*.45,w/2,1.0,fh[f]*.4,r()<.4,r);yy+=fh[f];}
  for(let i=0;i<sb;i++){const lit=r()<.5;const c=new THREE.Color(WARM[(r()*5)|0]).multiplyScalar(lit?.7:.1);litPlane(1.3,1.8,-d/2+1+(i+.5)*sw,2.1,w/2+.03,c,sg);bx(1.55,.14,.2,-d/2+1+(i+.5)*sw,1.1,w/2+.08,M.trim,sg);bx(1.55,.2,.2,-d/2+1+(i+.5)*sw,3.1,w/2+.08,M.trim,sg);}
  bx(d,.55,.3,0,4.15,w/2+.12,M.trim,sg);}
 if(clock){const cy=H+2.6;cyl(1.1,1.1,.3,0,cy,fz+.1,M.trim,24,g).rotation.x=Math.PI/2;const face=put(colored(new THREE.CircleGeometry(.95,24),new THREE.Color(0xfff0d0).multiplyScalar(.9)),M.lit,0,cy,fz+.27,g);face.castShadow=false;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;bx(.05,.16,.02,Math.sin(a)*.78,cy+Math.cos(a)*.78,fz+.29,M.black,g).rotation.z=-a;}const hand=bx(.05,.6,.02,.12,cy+.25,fz+.3,M.black,g);hand.rotation.z=-.4;bx(.05,.75,.02,-.05,cy-.36,fz+.3,M.black,g).rotation.z=.15;}
 for(let i=0;i<1+((r()*2)|0);i++)bx(.6,1.4,.6,(r()-.5)*w*.7,H+.7,-d/4,mat,g);
 g.userData.height=H;return g;}

// Timber machiya shophouse with lattice, lean-to eave, slatted upper window, noren and kanban.
export function machiya(T,M,k,o){const {w,d=9,seed=1,shop='',sign='',norenColor='#203050',upperMat=M.plaster,tall=false}=o;const r=rng(seed);const g=new THREE.Group();const {bx,litPlane,put,cyl}=T;
 const h1=3.3,h2=tall?3.2:2.5,H=h1+h2,fz=d/2;
 bx(w,.3,d,0,.15,0,M.granite,g);bx(w,H,d-.6,0,H/2,-.3,upperMat,g);
 for(const s of [-1,1]){bx(.24,H,.24,s*(w/2-.12),H/2,fz-.12,M.timberDark,g);bx(.24,H,.24,s*(w/2-.12),H/2,-fz+.12,M.timberDark,g);}
 // Ground floor: warm paper behind a dense koshi lattice, centre doorway with noren.
 const door=1.8;const warm=new THREE.Color(WARM[(r()*5)|0]).multiplyScalar(.55+r()*.4);litPlane(w-.5,2.5,0,1.55,fz-.28,warm,g);
 for(let x=-w/2+.35;x<w/2-.3;x+=.11){if(Math.abs(x)<door/2)continue;bx(.045,2.5,.06,x,1.55,fz-.18,M.timberDark,g);}
 for(const yy of [.32,2.82])bx(w-.4,.1,.12,0,yy,fz-.18,M.timberDark,g);bx(w,.24,.24,0,h1,fz-.12,M.timberDark,g);
 if(shop){const nm=norenMaterial(shop,norenColor);for(let i=0;i<3;i++){const p=put(new THREE.PlaneGeometry(door/3-.02,1.15,1,4),nm,-door/3+i*door/3,2.25,fz-.05,g);p.geometry.attributes.uv.array.forEach((v,j,a)=>{if(j%2===0)a[j]=i/3+v/3;});p.geometry.attributes.uv.needsUpdate=true;p.rotation.x=.04;}bx(door+.2,.06,.06,0,2.85,fz-.05,M.timber,g);}
 // Lean-to eave (hisashi) with exposed rafter ends.
 const ev=put(uvBox(w+.4,.08,1.3,2),M.tile,0,h1+.25,fz+.45,g);ev.rotation.x=.3;for(let x=-w/2;x<=w/2;x+=.45)bx(.07,.07,1.25,x,h1+.05,fz+.35,M.timber,g).rotation.x=.3;
 for(let x=-w/2;x<=w/2+.01;x+=.28){const t=put(new THREE.CylinderGeometry(.06,.06,1.3,6,1,false,0,Math.PI),M.tileDark,x,h1+.32,fz+.45,g);t.rotation.set(Math.PI/2+.3,0,0);}
 // Upper floor: slatted mushiko window or lit shoji.
 const mw=Math.min(w*.6,4.2);if(r()<.55){bx(mw+.2,1.1,.12,0,h1+h2*.5,fz-.55,M.timberDark,g);litPlane(mw,1,0,h1+h2*.5,fz-.5,warm.clone().multiplyScalar(.6),g);for(let x=-mw/2+.1;x<mw/2;x+=.22)bx(.1,1,.08,x,h1+h2*.5,fz-.44,upperMat,g);}
 else{litPlane(mw,1.2,0,h1+h2*.52,fz-.58,warm.clone().multiplyScalar(.85),g);for(let x=-mw/2;x<=mw/2+.01;x+=mw/4)bx(.05,1.2,.05,x,h1+h2*.52,fz-.54,M.timberDark,g);for(let yy=-.6;yy<=.61;yy+=.3)bx(mw,.04,.05,0,h1+h2*.52+yy,fz-.54,M.timberDark,g);bx(mw+.4,.5,.06,0,h1+.55,fz-.45,M.timber,g);for(let x=-mw/2;x<=mw/2;x+=.12)bx(.03,.5,.05,x,h1+.55,fz-.4,M.timberDark,g);}
 // Main roof: ridge parallel to the street.
 k.roof(0,H-.15,-.3,w+1.2,d+.8,g);
 if(sign){const sm=signMaterial(sign,{w:128,h:512,vertical:true,bg:'#1c140e',fg:'#efd9a8',border:'#5a4026'});const p=put(new THREE.PlaneGeometry(.55,2.1),sm,w/2-.5,h1+1.2,fz+.6,g);p.rotation.y=Math.PI/2;const p2=put(new THREE.PlaneGeometry(.55,2.1),sm,w/2-.5,h1+1.2,fz+.6,g);p2.rotation.y=-Math.PI/2;p.castShadow=p2.castShadow=false;bx(.1,.1,.9,w/2-.5,h1+2.3,fz+.35,M.timberDark,g);}
 g.userData.lamps=[];for(const sx of [-1,1]){const lx=sx*(door/2+.55),ly=2.55,lz=fz+.25;const ch=put(new THREE.SphereGeometry(.26,14,10),M.chochin,lx,ly,lz,g);ch.scale.y=1.35;ch.castShadow=false;for(const cy of [-.36,.36])T.cyl(.13,.13,.06,lx,ly+cy,lz,M.black,10,g);T.cyl(.012,.012,.5,lx,ly+.62,lz,M.black,4,g);g.userData.lamps.push([lx,ly,lz]);}
 g.userData.height=H+2;return g;}

// Gas lamp: iron post, glass lantern, finial. Returns lamp-head world position (for glows/lights).
export function gasLamp(T,M,x,z,{h=3.6,g}={}){const {cyl,bx,put}=T;cyl(.16,.2,.5,x,.25,z,M.iron,10,g);cyl(.06,.09,h-.5,x,h/2,z,M.iron,8,g);cyl(.12,.12,.08,x,h-.05,z,M.iron,10,g);bx(.5,.06,.06,x,h-.35,z,M.iron,g);
 const head=h+.32;const glass=put(new THREE.CylinderGeometry(.24,.15,.52,4,1,true),M.lampGlass,x,head,z,g);glass.rotation.y=Math.PI/4;glass.castShadow=false;const cap=put(new THREE.ConeGeometry(.33,.3,4),M.iron,x,head+.4,z,g);cap.rotation.y=Math.PI/4;cyl(.03,.03,.25,x,head+.6,z,M.iron,6,g);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;bx(.025,.55,.025,x+Math.cos(a)*.2,head,z+Math.sin(a)*.2,M.iron,g);}return [x,head,z];}

export function rickshaw(T,M,x,z,ry=0,g0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;const {put,bx,cyl}=T;
 for(const s of [-1,1]){const wheel=put(new THREE.TorusGeometry(.62,.035,6,28),M.timberDark,s*.62,.65,0,g);wheel.rotation.y=Math.PI/2;for(let i=0;i<10;i++){const sp=bx(.02,1.22,.02,s*.62,.65,0,M.timber,g);sp.rotation.x=i*Math.PI/10;}cyl(.06,.06,.12,s*.62,.65,0,M.iron,8,g).rotation.z=Math.PI/2;bx(.05,.05,2.4,s*.38,.62,1.25,M.timberDark,g).rotation.x=-.12;}
 bx(.85,.12,.7,0,.85,-.05,M.timberDark,g);bx(.85,.6,.12,0,1.2,-.4,M.maroon,g);bx(.85,.1,.6,0,.95,-.05,M.maroon,g);bx(.08,.08,.75,0,.48,.95,M.timberDark,g);bx(.9,.05,.05,0,.43,2.4,M.timberDark,g);
 const hood=put(new THREE.CylinderGeometry(.62,.62,.9,10,1,true,-Math.PI/2,Math.PI*.75),M.canvasCloth,0,1.25,-.25,g);hood.rotation.z=Math.PI/2;return g;}

// Taisho streetcar, local length along z. Destination board text is passed in.
export function tramCar(T,M,dest='雷鐘前'){const g=new THREE.Group();const {bx,put,litPlane,cyl}=T;const L=10,W=2.4;
 bx(W,.5,L-1,0,.55,0,M.black,g);for(const z of [-3,3]){bx(W-.3,.45,1.8,0,.4,z,M.iron,g);for(const s of [-1,1])for(const dz of [-.6,.6]){const wh=cyl(.38,.38,.12,s*.6,.38,z+dz,M.iron,14,g);wh.rotation.z=Math.PI/2;}}
 bx(W,1.0,L,0,1.3,0,M.maroon,g);bx(W+.04,.08,L+.04,0,1.82,0,M.brass,g);bx(W,1.15,L,0,2.42,0,M.cream,g);
 const win=new THREE.Color(0xffc27a).multiplyScalar(.75);for(const s of [-1,1]){for(let i=0;i<8;i++){const z=-3.9+i*1.11;const p=litPlane(.86,.8,s*(W/2+.01),2.42,z,win,g);p.rotation.y=s*Math.PI/2;bx(.06,1.0,.12,s*(W/2+.02),2.42,z-.55,M.maroon,g);}}
 for(const e of [-1,1]){const p=litPlane(1.6,.8,0,2.42,e*(L/2+.01),win,g);p.rotation.y=e>0?0:Math.PI;bx(1.2,.35,.05,0,3.2,e*(L/2+.02),M.black,g);const ds=put(new THREE.PlaneGeometry(1.1,.28),signMaterial(dest,{w:256,h:64,bg:'#f0e6c8',fg:'#1a1a1a',border:'#222',emissive:true}),0,3.2,e*(L/2+.05),g);ds.rotation.y=e>0?0:Math.PI;ds.castShadow=false;bx(.9,.5,.4,0,.9,e*(L/2+.2),M.iron,g);}
 bx(W+.3,.15,L+.4,0,3.05,0,M.timberDark,g);bx(1.3,.4,L-1.5,0,3.3,0,M.cream,g);bx(1.5,.1,L-1.3,0,3.52,0,M.timberDark,g);for(let i=0;i<7;i++){const p=litPlane(.9,.25,.66,3.3,-3+i,new THREE.Color(0xffc27a).multiplyScalar(.4),g);p.rotation.y=Math.PI/2;}
 const pole=bx(.06,.06,5.2,0,4.6,-.6,M.iron,g);pole.rotation.x=-.42;bx(.3,.18,.4,0,3.62,1.6,M.iron,g);return g;}

// The Cloudpiercer: octagonal brick shaft (10 storeys), two timber gallery storeys, spire.
export function cloudpiercer(T,M,{lights=null,glows=null,x=0,z=0,y=0}={}){const g=new THREE.Group();g.position.set(x,y,z);const {put,cyl,bx,litPlane}=T;const R=7.4;const r=rng(1212);
 let h=0;const storey=(rad,sh,mat,lit)=>{const s=put(new THREE.CylinderGeometry(rad,rad,sh,8),mat,0,h+sh/2,0,g);s.rotation.y=Math.PI/8;
  const ring=put(new THREE.CylinderGeometry(rad+.35,rad+.35,.35,8),M.trim,0,h+sh-.1,0,g);ring.rotation.y=Math.PI/8;
  const ap=rad*Math.cos(Math.PI/8);for(let f=0;f<8;f++){const a=f*Math.PI/4;const cx=Math.sin(a)*(ap+.02),cz=Math.cos(a)*(ap+.02);for(const off of [-1.1,1.1]){const wx=cx+Math.cos(a)*off,wz=cz-Math.sin(a)*off;const on=r()<lit;const col=on?new THREE.Color(0xffc070).multiplyScalar(.6+r()*.5):new THREE.Color(0x10141c);const p=litPlane(.8,sh*.42,wx,h+sh*.5,wz,col,g);p.rotation.y=a;if(on&&glows)glows.add(x+wx*1.02,y+h+sh*.5,z+wz*1.02,1.4,0xffb060,.35);}}
  h+=sh;};
 put(new THREE.CylinderGeometry(R+1.2,R+1.4,1.2,8),M.granite,0,.6,0,g).rotation.y=Math.PI/8;h=1.2;
 for(let i=0;i<10;i++)storey(R-i*.08,4.2,i%3===1?M.brickDark:M.brick,.35);
 const top=h;for(let i=0;i<2;i++){storey(R-.9-i*.4,3.6,M.cream,.75);const gal=put(new THREE.CylinderGeometry(R+.6-i*.4,R+.6-i*.4,.2,8),M.timberDark,0,h-3.6,0,g);gal.rotation.y=Math.PI/8;}
 const roof=put(new THREE.ConeGeometry(R+.2,7.5,8),M.tileDark,0,h+3.75,0,g);roof.rotation.y=Math.PI/8;cyl(.12,.12,4,0,h+9,0,M.brass,6,g);
 if(glows){glows.add(x,y+h+11,z,2.4,0xff5a3a,.9);for(let f=0;f<8;f++){const a=f*Math.PI/4;glows.add(x+Math.sin(a)*(R+.6),y+top+.4,z+Math.cos(a)*(R+.6),1.6,0xffd090,.6);}}
 g.userData.height=h+11;return g;}
