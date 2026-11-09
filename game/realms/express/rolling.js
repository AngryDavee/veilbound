import * as THREE from 'three';
// World IV shared kit: procedural canvas textures, a Taisho-era tender locomotive, clerestory
// wooden carriages, ballasted track, GPU steam plumes and gas lamps with additive glow.
// Every builder takes the region kit `k` so materials share the Atlas texture library.

const canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
let seed=4401;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

export function brickTexture(repeatX=1,repeatY=1,base=[128,52,40]){
 const t=canvas(512,512,(g,w,h)=>{g.fillStyle='#b8ada0';g.fillRect(0,0,w,h);const bw=64,bh=24;for(let row=0;row*bh<h;row++)for(let col=-1;col*bw<w;col++){const x=col*bw+(row%2?bw/2:0)+2,y=row*bh+2;const v=.72+rnd()*.42,soot=rnd()<.12?.55:1;g.fillStyle=`rgb(${base[0]*v*soot|0},${base[1]*v*soot|0},${base[2]*v*soot|0})`;g.fillRect(x,y,bw-4,bh-4);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,y+bh-8,bw-4,4);}
  // rain streaks and soot under sills
  for(let i=0;i<70;i++){g.fillStyle=`rgba(20,16,14,${.05+rnd()*.08})`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*5,40+rnd()*160);}});
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);return t;
}
export function clockTexture(){
 return canvas(512,512,(g,w)=>{const c=w/2;g.fillStyle='#14110e';g.fillRect(0,0,w,w);g.beginPath();g.arc(c,c,240,0,7);g.fillStyle='#c9a65a';g.fill();g.beginPath();g.arc(c,c,226,0,7);g.fillStyle='#efe6cf';g.fill();
  g.fillStyle='#1d1a16';g.font='bold 44px Georgia';g.textAlign='center';g.textBaseline='middle';const R=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];R.forEach((r,i)=>{const a=i/12*Math.PI*2-Math.PI/2;g.save();g.translate(c+Math.cos(a)*180,c+Math.sin(a)*180);g.rotate(a+Math.PI/2);g.fillText(r,0,0);g.restore();});
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2;g.lineWidth=i%5?2:5;g.beginPath();g.moveTo(c+Math.cos(a)*216,c+Math.sin(a)*216);g.lineTo(c+Math.cos(a)*(i%5?204:196),c+Math.sin(a)*(i%5?204:196));g.stroke();}
  const hand=(a,len,wd)=>{g.save();g.translate(c,c);g.rotate(a);g.fillStyle='#16130f';g.beginPath();g.moveTo(-wd,22);g.lineTo(wd,22);g.lineTo(wd*.4,-len);g.lineTo(-wd*.4,-len);g.fill();g.restore();};
  hand((11+59/60)/12*Math.PI*2,110,10);hand(59/60*Math.PI*2,170,6);g.beginPath();g.arc(c,c,12,0,7);g.fillStyle='#8a6a2a';g.fill();});
}
export function signTexture(lines,{bg='#ece3cc',fg='#1c1a17',w=1024,h=256,border='#2a2420',font='Georgia'}={}){
 return canvas(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle=border;g.lineWidth=14;g.strokeRect(10,10,w-20,h-20);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';lines.forEach((l,i)=>{g.font=`${l.weight||''} ${l.size||80}px ${l.font||font}`;g.fillText(l.text,w/2,l.y??h/2);});
  for(let i=0;i<900;i++){g.fillStyle=`rgba(60,40,20,${rnd()*.08})`;g.fillRect(rnd()*w,rnd()*h,2,2);}});
}
export function glowTexture(){
 return canvas(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,244,220,1)');gr.addColorStop(.12,'rgba(255,214,150,.8)');gr.addColorStop(.35,'rgba(255,176,96,.24)');gr.addColorStop(.6,'rgba(255,150,70,.06)');gr.addColorStop(1,'rgba(255,140,60,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
}

export function materials(k){
 const black=new THREE.MeshStandardMaterial({color:0x17181b,metalness:.55,roughness:.42});
 const soot=new THREE.MeshStandardMaterial({color:0x232220,metalness:.3,roughness:.75});
 const brass=new THREE.MeshStandardMaterial({color:0xb08a46,metalness:.85,roughness:.32});
 const steel=new THREE.MeshStandardMaterial({color:0x6d7277,metalness:.8,roughness:.35});
 const rail=new THREE.MeshStandardMaterial({color:0x8a8f94,metalness:.9,roughness:.28});
 const red=new THREE.MeshStandardMaterial({color:0x8a2219,metalness:.2,roughness:.5});
 const oxblood=k.surface('cedar',0x6a2620,1,.55);
 const oxDark=k.surface('cedar',0x3e1714,1,.6);
 const roofCanvas=new THREE.MeshStandardMaterial({color:0x2c2a28,roughness:.9});
 const window=new THREE.MeshStandardMaterial({color:0xffd9a0,emissive:0xffa851,emissiveIntensity:1.15,roughness:.6});
 const windowDim=new THREE.MeshStandardMaterial({color:0x5a4c3c,emissive:0x8a5428,emissiveIntensity:.45,roughness:.4});
 const fire=new THREE.MeshStandardMaterial({color:0xff7a2a,emissive:0xff5a10,emissiveIntensity:2.4});
 const lampGlass=new THREE.MeshStandardMaterial({color:0xfff0c8,emissive:0xffbf6a,emissiveIntensity:2.2,roughness:.3});
 const white=new THREE.MeshStandardMaterial({color:0xd8d4ca,roughness:.7});
 return {black,soot,brass,steel,rail,red,oxblood,oxDark,roofCanvas,window,windowDim,fire,lampGlass,white};
}

const hcyl=(k,r1,r2,len,x,y,z,mat,g,sides=24)=>{const m=k.cylinder(r1,r2,len,x,y,z,mat,sides,g);m.rotation.x=Math.PI/2;return m;};
const axleCyl=(k,r,w,x,y,z,mat,g,sides=28)=>{const m=k.cylinder(r,r,w,x,y,z,mat,sides,g);m.rotation.z=Math.PI/2;return m;};

function wheel(k,M,g,x,y,z,r,spokes=true){
 axleCyl(k,r,.13,x,y,z,M.black,g,32);axleCyl(k,r*1.03,.06,x+(x>0?.07:-.07),y,z,M.steel,g,32);
 axleCyl(k,r*.2,.24,x,y,z,M.black,g,12);
 if(spokes)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const s=k.box(.07,.08,r*.78,x+(x>0?.03:-.03),y+Math.sin(a)*r*.48,z+Math.cos(a)*r*.48,M.soot,g);s.rotation.x=-a;}
 if(spokes){const cw=k.box(.1,r*.42,r*.7,x+(x>0?.05:-.05),y-r*.5,z,M.black,g);}
 return y;
}

// Locomotive: rail top at y=0, buffer beam at z=-7 (front faces -Z), cab back at z=+6.
export function locomotive(k,M,g,{bell=true,lit=true}={}){
 const {box,cylinder,beam}=k;
 box(1.9,.5,12.8,0,1.18,-.5,M.black,g);
 for(const s of [-1,1]){box(.6,.06,9.6,s*1.27,1.66,-1.6,M.black,g);box(.04,.24,9.6,s*1.56,1.56,-1.6,M.soot,g);}
 box(2.75,.6,.28,0,1.2,-6.95,M.red,g);for(const s of [-1,1]){hcyl(k,.12,.12,.5,s*.92,1.2,-7.25,M.steel,g,12);hcyl(k,.22,.22,.06,s*.92,1.2,-7.5,M.steel,g,16);}
 box(.28,.22,.5,0,1.1,-7.3,M.soot,g);
 // Cylinders, valve chests, crossheads and rods.
 for(const s of [-1,1]){hcyl(k,.34,.34,1.25,s*1.18,1.18,-5.25,M.black,g,20);hcyl(k,.36,.36,.08,s*1.18,1.18,-5.88,M.steel,g,20);box(.38,.35,1.1,s*1.18,1.62,-5.25,M.black,g);beam([s*1.24,1.18,-4.6],[s*1.24,1.18,-3.4],.04,M.steel,g);beam([s*1.32,1.0,-3.4],[s*1.32,.82,-.6],.05,M.steel,g);box(.07,.13,4.1,s*1.34,.78,-.6,M.steel,g);}
 // Wheels: leading pony truck, three coupled drivers, trailing wheel.
 for(const s of [-1,1]){wheel(k,M,g,s*.62,.42,-5.4,.42,false);for(const z of [-2.7,-.6,1.5])wheel(k,M,g,s*.7,.78,z,.78);wheel(k,M,g,s*.66,.5,3.8,.5,false);}
 for(const z of [-2.7,-.6,1.5]){const s=box(2.3,.06,.8,0,1.58,z,M.black,g);}
 // Boiler with brass bands, smokebox, chimney, domes and the anchor bell.
 hcyl(k,.8,.8,7.2,0,2.45,-1.0,M.black,g,32);for(const z of [-4.3,-2.6,.2,2.3]){const b=k.mesh(new THREE.TorusGeometry(.8,.014,4,40),M.brass,0,2.45,z,g);}
 hcyl(k,.86,.86,1.6,0,2.45,-5.3,M.soot,g,32);hcyl(k,.8,.8,.06,0,2.45,-6.12,M.black,g,32);
 const door=k.mesh(new THREE.TorusGeometry(.6,.03,6,32),M.steel,0,2.45,-6.16,g);for(const y of [2.2,2.7])box(.5,.05,.03,.12,y,-6.17,M.steel,g);hcyl(k,.08,.08,.06,0,2.45,-6.2,M.brass,g,12);
 cylinder(.27,.32,1.0,0,3.75,-5.2,M.black,18,g);cylinder(.38,.3,.16,0,4.3,-5.2,M.black,18,g);
 for(const [z,mat] of [[-2.1,M.brass],[.4,M.black]]){cylinder(.38,.42,.55,0,3.38,z,M.black,20,g);k.mesh(new THREE.SphereGeometry(.38,20,10,0,Math.PI*2,0,Math.PI/2),mat,0,3.64,z,g);}
 if(bell){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector2(.08+.2*Math.pow(t,1.6)+(t>.92?.04:0),.5-t*.5));}const b=k.mesh(new THREE.LatheGeometry(pts,24),M.brass,0,3.45,-.85,g);b.material.side=THREE.DoubleSide;for(const s of [-1,1])beam([s*.3,3.2,-.85],[s*.3,4.05,-.85],.025,M.brass,g);beam([-.3,4.05,-.85],[.3,4.05,-.85],.03,M.brass,g);}
 box(.42,.36,.34,0,3.4,-5.95,M.black,g);const lamp=box(.3,.24,.05,0,3.4,-6.13,lit?M.lampGlass:M.white,g);
 for(const s of [-1,1]){beam([s*.86,2.95,-5.5],[s*.86,2.95,2.4],.025,M.steel,g);beam([s*.78,1.95,-4.6],[s*.9,1.95,2.2],.05,M.brass,g);}
 cylinder(.07,.07,.4,.3,3.4,2.4,M.brass,10,g);
 // Firebox, cab, roof and fire glow.
 box(1.8,1.6,1.8,0,2.2,3.3,M.black,g);
 const cz=4.6,cw=2.75;box(cw,.9,2.6,0,2.1,cz,M.black,g);box(cw,1.3,.12,0,3.25,cz-1.25,M.black,g);
 for(const s of [-1,1]){box(.08,1.3,.45,s*cw/2,3.25,cz-1.05,M.black,g);box(.08,1.3,.45,s*cw/2,3.25,cz+1.05,M.black,g);box(.08,.25,2.6,s*cw/2,3.98,cz,M.black,g);}
 const roof=k.mesh(new THREE.CylinderGeometry(2.4,2.4,3.0,24,1,true,-.62,1.24),M.soot,0,2.0,cz,g);roof.rotation.x=-Math.PI/2;roof.material.side=THREE.DoubleSide;
 for(const s of [-1,1])box(.6,.5,.08,s*.75,3.3,cz-1.32,lit?M.window:M.windowDim,g);
 if(lit)box(.6,.45,.05,0,2.15,cz-1.2,M.fire,g);
 return g;
}
export function tender(k,M,g){
 const {box}=k;box(2.6,2.0,6.2,0,2.35,0,M.black,g);box(2.75,.14,6.35,0,3.38,0,M.soot,g);box(1.9,.5,.08,0,3.55,-3.05,M.black,g);
 const coal=k.mesh(new THREE.IcosahedronGeometry(1,3),new THREE.MeshStandardMaterial({color:0x101012,metalness:.4,roughness:.35,flatShading:true}),0,3.45,-.6,g);coal.scale.set(1.15,.45,2.2);
 hcyl(k,.32,.32,.12,0,3.5,2.2,M.steel,g,16);
 box(1.8,.45,6.4,0,1.15,0,M.black,g);for(const z of [-2.2,2.2]){box(2.4,.35,1.8,0,.85,z,M.soot,g);for(const zz of [-.55,.55])for(const s of [-1,1])wheel(k,M,g,s*.62,.45,z+zz,.45,false);}
 for(const s of [-1,1])k.beam([s*1.3,1.4,-3],[s*1.3,3.3,-3],.03,M.steel,g);
 return g;
}
// Clerestory-roofed wooden carriage centred at the origin, 17 m long, floor at y=1.15.
export function carriage(k,M,g,{len=17,lit=true,label=null,windowMat=null}={}){
 const {box,beam}=k;const w=2.8,half=len/2,win=windowMat||(lit?M.window:M.windowDim);
 box(w,.95,len,0,1.62,0,M.oxblood,g);box(w,.6,len,0,3.3,0,M.oxblood,g);box(w-.2,.9,len-.4,0,2.55,0,win,g);
 for(const s of [-1,1]){for(let z=-half+.2;z<=half-.2;z+=1.15)box(.1,.95,.16,s*(w/2+.01),2.55,z,M.oxDark,g);box(.06,.05,len,s*(w/2+.03),2.08,0,M.brass,g);box(.06,.05,len,s*(w/2+.03),3.02,0,M.brass,g);for(let z=-half+.6;z<half;z+=2.2)box(.05,.75,.03,s*(w/2+.03),1.62,z,M.oxDark,g);}
 // Clerestory roof with a lit lantern strip.
 const roofA=k.mesh(new THREE.CylinderGeometry(3.4,3.4,len+.3,30,1,true,-.43,.86),M.roofCanvas,0,.53,0,g);roofA.rotation.x=-Math.PI/2;roofA.material.side=THREE.DoubleSide;
 box(1.5,.36,len-1,0,3.95,0,M.oxDark,g);box(1.42,.18,len-1.2,0,3.95,0,win,g);for(let z=-half+1;z<half-.8;z+=.9)for(const s of [-1,1])box(.05,.36,.1,s*.73,3.95,z,M.oxDark,g);
 const roofB=k.mesh(new THREE.CylinderGeometry(1.9,1.9,len-.8,20,1,true,-.42,.84),M.roofCanvas,0,2.4,0,g);roofB.rotation.x=-Math.PI/2;roofB.material.side=THREE.DoubleSide;
 // Open end platforms with railings and steps.
 for(const e of [-1,1]){box(w,.12,.9,0,1.12,e*(half+.45),M.soot,g);for(const s of [-1,1]){beam([s*1.3,1.15,e*(half+.85)],[s*1.3,2.15,e*(half+.85)],.03,M.brass,g);beam([s*1.3,2.15,e*(half+.85)],[s*1.3,2.15,e*half],.025,M.brass,g);box(.6,.06,.3,s*1.1,.75,e*(half+.6),M.steel,g);box(.6,.06,.3,s*1.1,.42,e*(half+.6),M.steel,g);}beam([-.6,2.15,e*(half+.85)],[.6,2.15,e*(half+.85)],.025,M.brass,g);box(.9,2.0,.08,0,2.15,e*half,M.oxDark,g);box(.6,1.0,.05,0,2.55,e*(half+.03),win,g);}
 // Underframe, truss rods and bogies.
 box(2.2,.3,len,0,.98,0,M.black,g);for(const s of [-1,1]){beam([s*.9,.95,-half+1],[s*.9,.45,-3],.03,M.steel,g);beam([s*.9,.45,-3],[s*.9,.45,3],.03,M.steel,g);beam([s*.9,.45,3],[s*.9,.95,half-1],.03,M.steel,g);}
 for(const z of [-half+2.4,half-2.4]){box(2.2,.3,2.6,0,.62,z,M.soot,g);for(const zz of [-.9,.9])for(const s of [-1,1])wheel(k,M,g,s*.62,.43,z+zz,.43,false);for(const s of [-1,1])k.mesh(new THREE.TorusGeometry(.22,.04,6,12),M.steel,s*1.05,.62,z,g).rotation.y=Math.PI/2;}
 if(label){const t=signTexture([{text:label,size:90,weight:'bold'}],{bg:'#2a120f',fg:'#d8b46a',border:'#b08a46',w:512,h:128});for(const s of [-1,1]){const p=k.mesh(new THREE.PlaneGeometry(1.4,.35),new THREE.MeshStandardMaterial({map:t,roughness:.6}),s*(w/2+.04),1.62,0,g);p.rotation.y=s*Math.PI/2;}}
 return g;
}
// Ballasted track running along Z at x, rail top at y.
export function track(k,M,x,z0,z1,y=0,{ballast=true,sleeperMat=null}={}){
 const len=Math.abs(z1-z0),zc=(z0+z1)/2;const sl=sleeperMat||k.surface('cedar',0x3d3329,1,.95);
 if(ballast){const b=k.box(3.2,.35,len,x,y-.38,zc,k.surface('rock',0x5d5a55,Math.max(2,len/6),.95));}
 const geo=new THREE.BoxGeometry(2.1,.14,.24),n=Math.floor(len/.62);const inst=new THREE.InstancedMesh(geo,sl,n);const m=new THREE.Matrix4();for(let i=0;i<n;i++){m.makeTranslation(x+(rnd()-.5)*.06,y-.24,Math.min(z0,z1)+.31+i*.62);inst.setMatrixAt(i,m);}inst.receiveShadow=true;k.batch.add(inst);
 for(const s of [-1,1]){k.box(.07,.15,len,x+s*.535,y-.075,zc,M.rail,k.batch);k.box(.15,.03,len,x+s*.535,y-.15,zc,M.rail,k.batch);}
}
// GPU steam plume: one Points draw per emitter; particles cycle through their life in the shader.
export function steam(root,{origin=[0,0,0],count=90,rise=4,spread=1.6,size=3.2,life=5,wind=[.5,0,.3],color=0xe8ecf0,opacity=.32,dark=0}={}){
 const g=new THREE.BufferGeometry(),pos=new Float32Array(count*3),sd=new Float32Array(count),rn=new Float32Array(count*3);for(let i=0;i<count;i++){sd[i]=i/count+rnd()*.02;rn.set([rnd(),rnd(),rnd()],i*3);}
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('seed',new THREE.BufferAttribute(sd,1));g.setAttribute('rnd',new THREE.BufferAttribute(rn,3));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},origin:{value:new THREE.Vector3(...origin)},wind:{value:new THREE.Vector3(...wind)},rise:{value:rise},spread:{value:spread},size:{value:size},life:{value:life},color:{value:new THREE.Color(color)},opacity:{value:opacity},dark:{value:dark}},
  vertexShader:`uniform float time,rise,spread,size,life;uniform vec3 origin,wind;attribute float seed;attribute vec3 rnd;varying float vA;varying float vR;void main(){float a=fract(time/life+seed);vec3 p=origin+vec3((rnd.x-.5)*spread*(.25+a*2.),rise*(1.-pow(1.-a,1.8))*(.7+rnd.y*.6),(rnd.z-.5)*spread*(.25+a*2.))+wind*a*life;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(900.,size*(.35+a*1.9)*320./max(.5,-mv.z));vA=smoothstep(0.,.1,a)*pow(1.-a,1.3)*exp(-max(0.,-mv.z-25.)*.012);vR=rnd.x*6.28;}`,
  fragmentShader:`uniform vec3 color;uniform float opacity,dark;varying float vA;varying float vR;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;if(d>1.)discard;float n=.75+.25*sin(atan(p.y,p.x)*3.+vR)*d;float a=pow(1.-d,1.6)*n*vA*opacity;gl_FragColor=vec4(mix(color,color*.35,dark*d),a);}`});
 const pts=new THREE.Points(g,mat);pts.frustumCulled=false;root.add(pts);return {points:pts,update(t){mat.uniforms.time.value=t;}};
}
// Additive glow halos for every practical lamp in a region, drawn as one Points object.
export function glows(root,list,{size=2.4,color=0xffc278}={}){
 const p=new Float32Array(list.length*3);list.forEach((v,i)=>p.set(v,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const m=new THREE.PointsMaterial({map:glowTexture(),color,size,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.85});const pts=new THREE.Points(g,m);pts.frustumCulled=false;root.add(pts);return pts;
}
// Cast-iron gas lamp; returns the glow position.
export function gasLamp(k,M,x,y,z,h=3.4,g=k.batch){
 k.cylinder(.16,.2,.4,x,y+.2,z,M.black,10,g);k.cylinder(.05,.08,h,x,y+h/2,z,M.black,10,g);k.cylinder(.11,.11,.08,x,y+h*.55,z,M.black,10,g);
 for(const s of [-1,1])k.beam([x,y+h-.25,z],[x+s*.3,y+h+.05,z],.02,M.black,g);
 k.cylinder(.22,.14,.5,x,y+h+.3,z,M.lampGlass,4,g).rotation.y=Math.PI/4;k.cylinder(.04,.3,.22,x,y+h+.66,z,M.black,4,g).rotation.y=Math.PI/4;k.cylinder(.03,.03,.14,x,y+h+.82,z,M.black,6,g);
 return [x,y+h+.3,z];
}
// Telegraph pole with crossarms and porcelain insulators.
export function telegraphPole(k,M,x,z,h=7.5,g=k.batch,wood=null){
 const w=wood||k.surface('cedar',0x4a3b2c,1,.95);k.cylinder(.11,.15,h,x,h/2,z,w,8,g);
 for(const y of [h-.4,h-1.1]){k.box(1.8,.1,.1,x,y,z,w,g);for(const dx of [-.75,-.3,.3,.75])k.cylinder(.04,.05,.12,x+dx,y+.11,z,M.white,6,g);}
}
export const rand=rnd;
