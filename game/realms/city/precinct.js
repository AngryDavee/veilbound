import * as THREE from 'three';
import { kit } from '../kit.js';
import { nightSky, precipitation } from '../atmosphere.js';
import { clues } from './story.js';
import { cityMaterials, makeTools, glowField, streakField, wireField, signMaterial, rng, uvBox, canvasTexture, colored, cloudpiercer, JP_FONT } from './citykit.js';
import { roofTileMaterial, hipRoof, brackets, giantLantern, stoneLantern } from './temple.js';

// The Thunderbell Precinct. Spawn in the forecourt (z=44), through the great gate (z=28),
// down the shuttered stall approach (z 9–22) to the incense court (arena), main hall (z=-32),
// pagoda (west) and the bell tower (east); a rear gate (22,-50) leads on to the Cloudpiercer.
export async function create(root,renderer,progress,{camera}={}){
 progress(.1,'Passing beneath the great lantern');const k=await kit(root,3301);const M=cityMaterials(k);const T=makeTools(k,M);const {bx,put,cyl,litPlane}=T;const r=rng(9157);
 const glows=glowField(root,renderer,{fogK:.003}),streaks=streakField(root,{y:.06}),wires=wireField(root,M.wire);
 const sky=nightSky(root,{top:0x07061a,horizon:0x2c2440,glow:0x6a5a80,moonDir:[.3,.5,-.81],moonSize:30,clouds:.5,cloudColor:0x1e1a2c,seed:41});
 const leaves=precipitation(root,{count:500,color:0xe8b830,size:.09,area:[60,16,70],speed:.9,drift:1.8,opacity:.85,seed:5});
 const roofMat=roofTileMaterial(),soffit=new THREE.MeshStandardMaterial({color:0x22140f,roughness:.8,side:THREE.DoubleSide});const white=k.surface('plaster',0xe6dcc4,1,.92);const gold=new THREE.MeshStandardMaterial({color:0xc69a3e,metalness:.85,roughness:.32});
 const gravelTex=canvasTexture(512,512,(c,w,h)=>{c.fillStyle='#6d6a64';c.fillRect(0,0,w,h);const q=rng(3);for(let i=0;i<9000;i++){const v=80+q()*90|0;c.fillStyle=`rgb(${v},${v-3},${v-8})`;c.beginPath();c.arc(q()*w,q()*h,1+q()*2.6,0,7);c.fill();}});const gravel=new THREE.MeshStandardMaterial({map:gravelTex,roughness:.92,color:0xb8b4ac});
 const circles=[],boxes=[];const block=(x,z,w,d)=>boxes.push([x,z,w/2,d/2]);const grp=(x,y,z,ry=0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;k.batch.add(g);return g;};
 const vermilion=M.vermilion;

 // Ground: raked gravel court, granite slab paths, base plane beyond the walls.
 put(uvBox(400,.1,400,4),M.road,0,-.15,0);put(uvBox(60,.1,100,3),gravel,0,-.04,-1);
 const slab=(x0,x1,z0,z1)=>{for(let z=z0;z<z1;z+=1.05)for(let x=x0;x<x1;x+=2.05){const w=Math.min(2,x1-x);bx(w,.12,1,x+w/2,.0,z+.5,M.granite,k.batch,2).rotation.y=(r()-.5)*.012;}};
 slab(-3,3,-20,49);slab(3,22,-1.2,1);slab(19,25,-49,-1);
 // Enclosure: earthen walls with tile caps; an opening in the south wall and the rear gate in the north.
 const sujibei=k.surface('plaster',0xc9a25e,1,.92);const wall=(x,z,len,alongX)=>{const w=alongX?len:.8,d=alongX?.8:len;bx(w,2.8,d,x,1.4,z,sujibei);for(let i=0;i<5;i++)bx(w+.02,.07,d+.02,x,1.5+i*.22,z,white);bx(w+.04,.35,d+.04,x,.17,z,M.granite);bx(w+.5,.25,d+.5,x,2.9,z,M.tileDark);bx(alongX?len:.3,.35,alongX?.3:len,x,3.15,z,M.tileDark);for(let i=0;i<len;i+=1.6)bx(alongX?.08:.85,.08,alongX?.85:.08,x+(alongX?-len/2+i:0),2.2,z+(alongX?0:-len/2+i),M.timberDark);};
 wall(-17.5,50,25,true);wall(17.5,50,25,true);wall(-30,0,100,false);wall(31,0,100,false);wall(-5,-50,50,true);wall(28,-50,6,true);

 progress(.25,'Raising the vermilion gate');
 // Great gate: two storeys, vermilion pillars, lattice side bays, giant paper lantern in the centre bay.
 {const g=grp(0,0,28);for(const x of [-7,-2.6,2.6,7])for(const z of [-3,0,3]){if(z===0&&Math.abs(x)<3)continue;cyl(.4,.4,.5,x,.25,z,M.granite,10,g);cyl(.32,.34,6.5,x,3.5,z,vermilion,14,g);}
  for(const z of [-3,3]){bx(15,.5,.45,0,6.5,z,vermilion,g);bx(15,.3,.35,0,5.2,z,vermilion,g);}for(const x of [-7,-2.6,2.6,7])bx(.4,.5,6.4,x,6.5,0,vermilion,g);
  brackets(T,vermilion,g,15,6.4,6.85,1.25);
  for(const s of [-1,1])for(const z of [-3,3]){for(let x=2.9;x<6.8;x+=.42)bx(.08,4.4,.08,s*x,2.9,z,vermilion,g);for(let y=.9;y<5;y+=.55)bx(4,.07,.08,s*4.8,y,z,vermilion,g);litPlane(3.9,4.4,s*4.8,2.9,z*.85,new THREE.Color(0x3a0c08),g);}
  const lower=hipRoof(19,10.5,2.4,{R:11,mat:roofMat,edgeMat:soffit,up:.7});lower.position.y=7.3;g.add(lower);
  bx(12,3.4,5.4,0,9.7,0,vermilion,g);for(const s of [-1,1]){for(let x=-5.4;x<=5.4;x+=1.8)litPlane(1.4,2.2,x,9.8,s*2.72,new THREE.Color(0xffb070).multiplyScalar(.45),g).rotation.y=s>0?0:Math.PI;}
  for(const s of [-1,1]){bx(13.4,.12,.12,0,8.9,s*3.3,vermilion,g);bx(.12,.12,6.6,s*6.7,8.9,0,vermilion,g);for(let x=-6.6;x<=6.6;x+=1.1){cyl(.05,.05,.8,x,8.5,s*3.3,vermilion,6,g);}bx(13.4,.2,6.6,0,8.1,0,M.timberDark,g);}
  brackets(T,vermilion,g,12,5.4,11.6,1.1);const top=hipRoof(16.5,9.6,3.3,{R:7.5,mat:roofMat,edgeMat:soffit,up:.9});top.position.y=12.1;g.add(top);
  for(const x of [-8.3,8.3])for(const z of [-4.8,4.8])glows.add(x,7.9,28+z,.8,0xffb060,.6);
  const plaque=put(new THREE.PlaneGeometry(1.4,2.4),signMaterial('雷鐘山',{w:140,h:300,vertical:true,bg:'#1a1410',fg:'#e7c46a',border:'#c69a3e'}),0,10,2.84,g);plaque.castShadow=false;
  // Straw sandals offered on the gate's inner face.
  const straw=new THREE.MeshStandardMaterial({map:canvasTexture(128,256,(c,w,h)=>{c.fillStyle='#b89a5a';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=6){c.fillStyle=y%12?'#8f7440':'#cbb070';c.fillRect(0,y,w,3);}}),roughness:1});for(const x of [-1.8,1.8]){const sa=cyl(1,1,.25,x,9.8,-3.05,straw,20,g);sa.rotation.x=Math.PI/2;sa.scale.set(.75,1,2.1);}
  const lantern=giantLantern('雷鐘');lantern.position.set(0,2.4,28);root.add(lantern);bx(.3,.3,.3,0,6.5,0,M.black,g);
  glows.add(0,4.3,28,9,0xff3a20,.45);glows.add(0,4.3,31.6,5,0xff6a40,.3);streaks.add(0,31.5,1.8,9,0xff4020,.6);streaks.add(0,24.5,1.8,9,0xff4020,.5);
  const ll=new THREE.PointLight(0xff5a38,40,18,1.6);ll.position.set(0,4.2,30.5);root.add(ll);const ll2=new THREE.PointLight(0xff5a38,24,14,1.6);ll2.position.set(0,4.2,25.5);root.add(ll2);
  for(const x of [-7,-2.6,2.6,7])for(const z of [25,31])circles.push([x,z,.45]);block(-4.8,28,4.6,6.6);block(4.8,28,4.6,6.6);}

 progress(.4,'Shuttering the stalls');
 // Shuttered stalls flank the approach; paper lantern strings span it overhead.
 const shutterTex=canvasTexture(128,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,12);c.fillStyle='#5a5f62';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=10){c.fillStyle='#3a3d40';c.fillRect(0,y,w,3);c.fillStyle='#777c80';c.fillRect(0,y+3,w,1);}const q=rng(4);for(let i=0;i<40;i++){c.fillStyle=`rgba(120,60,30,${q()*.25})`;c.fillRect(q()*w,q()*h,2+q()*30,1+q()*6);}});const shutter=new THREE.MeshStandardMaterial({map:shutterTex,metalness:.5,roughness:.55});
 const wares=['人形燒','煎餅','扇子','玩具','手拭','簪','團子','雷おこし'];
 for(const s of [-1,1]){for(let i=0;i<4;i++){const z=9+1.65+i*3.3,x=s*6.6;const g=grp(x,0,z,s<0?Math.PI/2:-Math.PI/2);bx(3.25,3.1,4,0,1.55,-.2,white,g);put(new THREE.PlaneGeometry(3.0,2.5),shutter,0,1.35,1.82,g);bx(3.3,.3,.15,0,2.75,1.85,M.timberDark,g);const sg=put(new THREE.PlaneGeometry(2.6,.5),signMaterial(wares[(i+(s>0?4:0))%8],{w:480,h:96,bg:'#f0e4c4',fg:'#7a1a10',border:'#1a1a1a'}),0,3.2,1.9,g);sg.castShadow=false;
   const eave=put(uvBox(3.3,.08,1.6,2),roofMat,0,3.6,2.2,g);eave.rotation.x=.32;for(let a=-1.5;a<=1.5;a+=.38)bx(.07,.07,1.5,a,3.42,2.05,M.timber,g).rotation.x=.32;bx(3.3,.6,4.2,0,3.4,-.3,M.tileDark,g);
   if(i%2===0){const lx=0,ly=2.3,lz=2.55;const ch=put(new THREE.SphereGeometry(.24,12,8),M.chochin,lx,ly,lz,g);ch.scale.y=1.35;ch.castShadow=false;const v=new THREE.Vector3(lx,ly,lz);g.updateMatrixWorld(true);g.localToWorld(v);glows.add(v.x,v.y,v.z,1.2,0xff5030,.8);glows.add(v.x,v.y,v.z,4,0xff4020,.2);}}
  block(s*6.6,15.6,4.2,13.4);}
 for(let i=0;i<4;i++){const z=10+i*3.8;wires.add([-4.6,4.5,z],[4.6,4.5,z],.5,10);for(let j=-2;j<=2;j++){const x=j*1.6,y=4.5-.5*4*(.5+x/9.2)*(.5-x/9.2)-.45;const ch=put(new THREE.SphereGeometry(.22,12,8),j%2?M.chochin:M.chochinWhite,x,y,z);ch.scale.y=1.3;ch.castShadow=false;glows.add(x,y,z,1.1,j%2?0xff5a30:0xffc070,.75);}}
 const al=new THREE.PointLight(0xffa060,26,16,1.7);al.position.set(0,3.6,15);root.add(al);for(let z=11;z<23;z+=4)streaks.add(0,z,1.2,6,0xff7040,.35);

 progress(.52,'Lighting the incense');
 // Bronze incense burner with a little roof, glowing embers and a column of smoke.
 {const g=grp(0,0,6.8);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const leg=bx(.18,.9,.18,Math.cos(a)*.95,.45,Math.sin(a)*.95,M.brass,g);leg.rotation.z=Math.cos(a)*.15;}
  const bowl=new THREE.LatheGeometry([new THREE.Vector2(.2,0),new THREE.Vector2(1.1,.15),new THREE.Vector2(1.35,.6),new THREE.Vector2(1.4,.75),new THREE.Vector2(1.25,.8)],24);put(bowl,M.brass,0,.85,0,g);const ember=put(new THREE.CircleGeometry(1.15,24),new THREE.MeshBasicMaterial({color:0xff6a20,toneMapped:false}),0,1.55,0,g);ember.rotation.x=-Math.PI/2;ember.castShadow=false;
  for(const [x,z] of [[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9]])cyl(.06,.06,1.6,x,2.3,z,M.brass,6,g);const darkBronze=new THREE.MeshStandardMaterial({color:0x3e3426,metalness:.7,roughness:.5});const cap=hipRoof(2.8,2.8,.9,{R:0,mat:darkBronze,edgeMat:darkBronze,up:.35,thick:.08,seg:8});cap.position.y=3.1;g.add(cap);
  glows.add(0,1.7,6.8,2.4,0xff6a20,.8);const bl=new THREE.PointLight(0xff7a30,22,12,1.8);bl.position.set(0,2,6.8);root.add(bl);circles.push([0,6.8,1.7]);}
 const smokeN=260,sp=new Float32Array(smokeN*3),ss=new Float32Array(smokeN);for(let i=0;i<smokeN;i++){sp.set([r(),r(),r()],i*3);ss[i]=r();}const sgeo=new THREE.BufferGeometry();sgeo.setAttribute('position',new THREE.BufferAttribute(sp,3));sgeo.setAttribute('seed',new THREE.BufferAttribute(ss,1));
 const smokeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},halfH:{value:450}},vertexShader:'attribute float seed;uniform float time,halfH;varying float vA;varying float vH;void main(){float t=fract(time*.06+seed);vec3 p=vec3(0.,1.7,6.8);p.y+=t*11.;float spread=.15+t*t*3.2;p.x+=(position.x-.5)*spread+sin(time*.4+seed*20.+t*4.)*t*1.4+t*t*2.;p.z+=(position.z-.5)*spread+cos(time*.3+seed*13.)*t*.8;vH=t;vA=smoothstep(0.,.1,t)*(1.-t)*.32;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(.8+t*5.)*projectionMatrix[1][1]*halfH/max(-mv.z,.1);}',
  fragmentShader:'varying float vA;varying float vH;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.;if(d>1.)discard;float a=(1.-d*d)*vA*.5;vec3 c=mix(vec3(.85,.55,.38),vec3(.55,.56,.66),smoothstep(0.,.35,vH));gl_FragColor=vec4(c,a);}'});
 const smoke=new THREE.Points(sgeo,smokeMat);smoke.frustumCulled=false;smoke.renderOrder=6;root.add(smoke);

 progress(.62,'Raising the five-storey pagoda');
 // Five-storey pagoda west of the court.
 {const P=grp(-22,0,-8);bx(9.5,1.2,9.5,0,.6,0,M.granite,P);for(const s of [-1,1])bx(3,.4,1.2,0,.2,s*5.3,M.granite,P);let y=1.2;
  for(let i=0;i<5;i++){const b=6.2-i*.55,h=i===0?3.6:2.8;bx(b,h,b,0,y+h/2,0,white,P);for(const sx of [-1,-.33,.33,1])for(const sz of [-1,1]){bx(.32,h,.32,sx*b/2,y+h/2,sz*b/2,vermilion,P);bx(.32,h,.32,sz*b/2,y+h/2,sx*b/2,vermilion,P);}
   for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){const dx=Math.sin(a)*(b/2+.02),dz=Math.cos(a)*(b/2+.02);const door=put(new THREE.PlaneGeometry(b*.3,h*.7),M.vermilionDark,dx,y+h*.4,dz,P);door.rotation.y=a;for(let j=0;j<3;j++)for(let q=0;q<3;q++){const st=put(new THREE.SphereGeometry(.04,5,4),gold,dx+Math.cos(a)*(-b*.1+q*b*.1),y+h*.15+j*h*.25,dz-Math.sin(a)*(-b*.1+q*b*.1),P);st.castShadow=false;}
    if(i>0){const rl=bx(b+1.2,.08,.08,dx*1.2,y+.75,dz*1.2,vermilion,P);rl.rotation.y=a;}}
   if(i>0)bx(b+1.4,.15,b+1.4,0,y+.05,0,M.timberDark,P);
   bx(b+.3,.3,b+.3,0,y+h+.15,0,vermilion,P);brackets(T,vermilion,P,b+.2,b+.2,y+h+.35,.9);
   const rf=hipRoof(b+4.2,b+4.2,1.7,{R:0,mat:roofMat,edgeMat:soffit,up:.75,seg:12});rf.position.y=y+h+.95;P.add(rf);
   for(const sx of [-1,1])for(const sz of [-1,1]){const cx=sx*(b/2+2.05),cz=sz*(b/2+2.05),cy=y+h+1.5;cyl(.05,.05,.5,cx,cy-.35,cz,gold,6,P);glows.add(-22+cx,cy-.7,-8+cz,.55,0xffd27a,.6);}
   y+=h+1.6;}
  cyl(.14,.14,9,0,y+4.5,0,M.brass,8,P);for(let i=0;i<9;i++){const tr=put(new THREE.TorusGeometry(.55-i*.02,.07,6,20),M.brass,0,y+1.4+i*.62,0,P);tr.rotation.x=Math.PI/2;}put(new THREE.SphereGeometry(.28,10,8),gold,0,y+8.6,0,P);
  glows.add(-22,y+8.6,-8,1,0xffc070,.5);block(-22,-8,10,10);const pl=new THREE.PointLight(0xffa868,18,16,1.7);pl.position.set(-16.5,3,-6);root.add(pl);
  for(const sx of [-1,1])for(const sz of [-1,1])wires.add([-22,y+1,-8],[-22+sx*3.5,y-1.2,-8+sz*3.5],.05,2);}

 progress(.72,'Opening the main hall');
 // Main hall: raised platform, open vermilion front, lit shoji, double-tier hip roof.
 {const H=grp(0,0,-32);bx(28,1.2,20,0,.6,0,M.granite,H);for(let i=0;i<6;i++)bx(10,.2,.36,0,.1+i*.2,10+2.1-i*.36,M.granite,H);
  for(let x=-10;x<=10;x+=4){cyl(.42,.42,.3,x,1.35,7,M.granite,10,H);cyl(.36,.38,7,x,4.7,7,vermilion,14,H);}for(const x of [-12,12])for(const z of [-7,0,7])cyl(.36,.38,7,x,4.7,z,vermilion,14,H);
  bx(25,.5,.45,0,8.1,7,vermilion,H);bx(25,.3,.35,0,6.5,7,vermilion,H);
  bx(24,6.8,13,0,4.6,-1.5,white,H);for(let x=-10;x<=10;x+=1.25){const sh=litPlane(1.15,4.6,x,3.7,5.03,new THREE.Color(0xffc27a).multiplyScalar(.55+((x*7)%3)*.1),H);for(let y=1.8;y<6;y+=.5)bx(1.15,.04,.04,x,y,5.06,M.timberDark,H);bx(.08,4.8,.08,x+.62,3.7,5.06,M.timberDark,H);}
  bx(26,.15,4,0,1.28,7,M.timber,H);for(let i=0;i<6;i++)cyl(.04,.04,.9,-12+i*.1,1.7,9,vermilion,6,H);
  const box=bx(3,.9,1.2,0,1.8,8.8,M.timberDark,H);for(let i=0;i<10;i++)bx(.05,.05,1.2,-1.35+i*.3,2.27,8.8,M.timber,H);const hl=giantLantern('奉納',{h:2.2,r:.9});hl.position.set(0,3.6,-32+6.2);root.add(hl);glows.add(0,4.6,-25.8,4,0xff4a2a,.4);
  brackets(T,vermilion,H,25,14.6,8.55,1.4);const lr=hipRoof(32,22,4.6,{R:16,mat:roofMat,edgeMat:soffit,up:1.3});lr.position.y=9.0;H.add(lr);
  bx(18,3,9,0,13.5,-1.5,white,H);for(const sz of [-1,1]){for(let x=-8.6;x<=8.6;x+=2.15){cyl(.2,.2,3,x,13.5,-1.5+sz*4.55,vermilion,8,H);}for(let x=-7.5;x<=7.6;x+=2.15){const p=litPlane(1.5,1.6,x,13.6,-1.5+sz*4.53,new THREE.Color(0xffc27a).multiplyScalar(.5),H);if(sz<0)p.rotation.y=Math.PI;for(let y=12.9;y<14.4;y+=.36)bx(1.5,.04,.05,x,y,-1.5+sz*4.56,M.timberDark,H);}bx(18.2,.25,.3,0,12.1,-1.5+sz*4.6,vermilion,H);}brackets(T,vermilion,H,18,9,15.1,1.3);const ur=hipRoof(23,14,4.4,{R:11,mat:roofMat,edgeMat:soffit,up:1.1});ur.position.y=15.4;H.add(ur);
  for(const sx of [-1,1])for(const sz of [-1,1])glows.add(sx*15.6,9.6,-32+sz*10.6,.7,0xffd27a,.6);
  const hl2=new THREE.PointLight(0xffb070,34,22,1.6);hl2.position.set(0,4.5,-23.5);root.add(hl2);block(0,-32,28.2,20.2);for(const x of [-10,-6,-2,2,6,10])circles.push([x,-25,.5]);circles.push([0,-23.2,1.7]);}

 progress(.8,'Wrapping the Thunderbell');
 // Bell tower: stone base, splayed posts, hip roof, a bronze bell wrapped in black cloth, the striking log.
 {const B=grp(20,0,-30);bx(7,1,7,0,.5,0,M.granite,B);for(const sx of [-1,1])for(const sz of [-1,1]){const p=cyl(.24,.3,5.8,sx*2.4,3.9,sz*2.4,vermilion,10,B);p.rotation.set(-sz*.05,0,sx*.05);}
  for(const s of [-1,1]){bx(5.6,.32,.3,0,6.4,s*2.25,vermilion,B);bx(.3,.32,5.6,s*2.25,6.4,0,vermilion,B);bx(5.4,.18,.2,0,2.2,s*2.4,vermilion,B);}brackets(T,vermilion,B,5,5,6.7,1);const br=hipRoof(9,9,2.6,{R:2.5,mat:roofMat,edgeMat:soffit,up:.8});br.position.y=7.2;B.add(br);
  const bellPts=[new THREE.Vector2(0,0)];for(let i=14;i>=0;i--){const t=i/14;bellPts.push(new THREE.Vector2(.62+.3*Math.pow(1-t,3)+.06*Math.sin(t*3),2.0*(1-t)));}bellPts.push(new THREE.Vector2(0,2.05));
  const clothTex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#0d0d10';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=6){c.fillStyle=`rgba(255,255,255,${.02+Math.abs(Math.sin(x*.07))*.05})`;c.fillRect(x,0,3,h);}});const cloth=new THREE.MeshStandardMaterial({map:clothTex,roughness:.55,metalness:.1,color:0x9aa0b4,side:THREE.DoubleSide});
  const bell=put(new THREE.LatheGeometry(bellPts,28),cloth,0,3.8,0,B);bell.scale.set(1.08,1,1.08);cyl(.18,.18,.6,0,6.05,0,M.brass,8,B);for(const a of [0,1.2,2.4])cyl(.03,.03,2.1,Math.cos(a)*.3,4.9,Math.sin(a)*.3,M.cream,5,B).rotation.z=.3*Math.cos(a);
  for(let i=0;i<3;i++){const band=put(new THREE.TorusGeometry(.75+i*.07,.035,6,28),M.cream,0,4.3+i*.5,0,B);band.rotation.x=Math.PI/2;}
  const log=cyl(.2,.2,2.6,-2.2,4.7,0,M.timber,10,B);log.rotation.z=Math.PI/2;const rope=put(new THREE.TorusGeometry(1.0,.09,8,32),new THREE.MeshStandardMaterial({color:0xcdb47a,roughness:1}),0,5.45,0,B);rope.rotation.x=Math.PI/2;const shideMat=new THREE.MeshBasicMaterial({color:0xe8e4da,side:THREE.DoubleSide});for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const sh=new THREE.Group();sh.position.set(Math.cos(a)*1.0,5.3,Math.sin(a)*1.0);sh.rotation.y=-a+Math.PI/2;B.add(sh);for(let j=0;j<4;j++){const p=put(new THREE.PlaneGeometry(.16,.2),shideMat,(j%2)*.08-.04,-j*.18,0,sh);p.castShadow=false;}}for(const x of [-3,-1.6]){wires.add([20+x,6.3,-30],[20+x,4.85,-30],0,1);}
  glows.add(23,3,-26.2,.9,0xffc070,.6);const tl=new THREE.PointLight(0xffb880,22,11,1.6);tl.position.set(20,2.6,-26.4);root.add(tl);block(20,-30,7.2,7.2);
  stoneLantern(T,M,16.2,-25.6,{s:1});stoneLantern(T,M,23.8,-25.6,{s:1});glows.add(16.2,1.7,-25.6,1,0xffc070,.8);glows.add(23.8,1.7,-25.6,1,0xffc070,.8);circles.push([16.2,-25.6,.6],[23.8,-25.6,.6]);}

 progress(.86,'Hanging the prayer plaques');
 // Ema racks: hundreds of small wooden plaques on three rails.
 {const g=grp(14,0,8.6);for(const x of [-2.6,2.6])bx(.18,2.4,.18,x,1.2,0,M.timberDark,g);const er=hipRoof(6.4,1.6,.5,{R:5.4,mat:roofMat,edgeMat:soffit,up:.2,thick:.1,seg:6});er.position.y=2.45;g.add(er);
  const ema=new THREE.MeshStandardMaterial({map:canvasTexture(64,64,(c)=>{c.fillStyle='#c9a774';c.fillRect(0,0,64,64);c.fillStyle='#6a4a2a';c.fillRect(0,0,64,6);for(let i=0;i<5;i++){c.fillStyle='rgba(40,20,10,.55)';c.fillRect(10+i*9,14,3,40);}},{repeat:false}),roughness:.85});
  const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(.17,.12,.012),ema,330);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();let n=0;for(const ry of [.75,1.35,1.95])for(let i=0;i<110;i++){const x=-2.5+i*.046+(r()-.5)*.02;e.set((r()-.5)*.3,(r()<.5?0:Math.PI)+(r()-.5)*.4,(r()-.5)*.25);q.setFromEuler(e);m.compose(new THREE.Vector3(x,ry-.08,(r()-.5)*.06),q,new THREE.Vector3(1,1,1));inst.setMatrixAt(n++,m);}
  inst.castShadow=true;g.add(inst);for(const ry of [.75,1.35,1.95])bx(5.2,.04,.04,0,ry,0,M.timber,g);block(14,8.6,5.8,.8);glows.add(14,2.2,7.2,.9,0xffc070,.5);}
 // Ginkgo trees in autumn gold, with leaf carpets beneath.
 const leafA=new THREE.MeshStandardMaterial({color:0xd8a426,roughness:.9,flatShading:true}),leafB=new THREE.MeshStandardMaterial({color:0xb27a18,roughness:.9,flatShading:true});const bark=k.surface('cedar',0x4a3a2e,1,.95);
 for(const [x,z,h] of [[-17,6,11],[27,6,12],[-16,-21,10],[27,-18,11],[-26,22,9],[27,30,9]]){const g=grp(x,0,z);cyl(.32,.55,h*.6,0,h*.3,0,bark,9,g);for(let i=0;i<5;i++){const a=i*1.3+r(),len=2+r()*1.6;T.put(new THREE.CylinderGeometry(.08,.16,len,6),bark,Math.cos(a)*len*.4,h*.45+i*.5,Math.sin(a)*len*.4,g).rotation.set(Math.sin(a)*.9,0,-Math.cos(a)*.9);}
  for(let i=0;i<16;i++){const a=r()*Math.PI*2,rad=r()*2.6*(1-i/22),y=h*.5+i/16*h*.55;const blob=put(new THREE.IcosahedronGeometry(1.1+r()*.8,1),i%3?leafA:leafB,Math.cos(a)*rad,y,Math.sin(a)*rad,g);blob.scale.y=.75;}
  for(let i=0;i<70;i++){const a=r()*Math.PI*2,rad=Math.pow(r(),.6)*4.5;const lf=put(new THREE.CircleGeometry(.09+r()*.06,5),i%2?leafA:leafB,Math.cos(a)*rad,.02+r()*.01,Math.sin(a)*rad,g);lf.rotation.x=-Math.PI/2;lf.castShadow=false;}
  circles.push([x,z,.7]);}
 // Stone lanterns line the forecourt and court perimeter.
 for(const [x,z] of [[-5,40],[5,40],[-5,35],[5,35],[-13.5,-19],[13.5,-19],[-13.5,7.5],[-26,-1],[-26,-15],[28,-6]]){const h=stoneLantern(T,M,x,z,{s:1.1});glows.add(...h,1.1,0xffc070,.85);glows.add(...h,3.4,0xffa050,.2);circles.push([x,z,.6]);streaks.add(x,z,.6,3,0xffb060,.3);}
 // Rear gate to the tower district.
 {const g=grp(22,0,-50);for(const x of [-2.6,2.6])cyl(.25,.28,4.5,x,2.25,0,M.timberDark,10,g);bx(6.4,.35,.4,0,4.3,0,M.timberDark,g);const gr=hipRoof(7.6,2.6,1.1,{R:5.6,mat:roofMat,edgeMat:soffit,up:.4,thick:.12,seg:8});gr.position.y=4.6;g.add(gr);}
 k.sign(22,3.2,-49.3,'TO THE CLOUDPIERCER');
 // Beyond the walls: city roofs, glowing windows and the tower on the skyline.
 const tower=cloudpiercer(T,M,{glows,x:64,z:-150});k.batch.add(tower);
 const far=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x16141a,roughness:1}),300);let fi=0;const mtx=new THREE.Matrix4();for(let i=0;i<300;i++){const a=r()*Math.PI*2,d=62+Math.pow(r(),.8)*200;const x=Math.cos(a)*d,z=Math.sin(a)*d;const w=6+r()*12,h=4+r()*10,dd=6+r()*10;mtx.compose(new THREE.Vector3(x,h/2,z),new THREE.Quaternion(),new THREE.Vector3(w,h,dd));far.setMatrixAt(fi++,mtx);for(let j=0;j<2;j++)glows.add(x+(r()-.5)*w,1+r()*(h-1.5),z+(r()-.5)*dd,.8,0xffb868,.45);}far.count=fi;root.add(far);
 glows.build();streaks.build();wires.build();k.finish();

 const inR=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;const hit=(x,z)=>boxes.some(b=>Math.abs(x-b[0])<b[2]+.3&&Math.abs(z-b[1])<b[3]+.3);
 const veranda=(x,z)=>inR(x,z,-11.5,11.5,-26.3,-22.05);const ramp=(x,z)=>inR(x,z,-4.9,4.9,-22.1,-19.8);
 const canWalk=(x,z)=>{if(veranda(x,z)||ramp(x,z))return !circles.some(c=>Math.hypot(x-c[0],z-c[1])<c[2]+.28);
  const ok=inR(x,z,-9.8,9.8,32.6,49.3)||inR(x,z,-2.1,2.1,23,33)||inR(x,z,-4.3,4.3,9,23.4)||inR(x,z,-29.2,30.2,-49.2,9.3);return ok&&!hit(x,z);};
 const walkHeight=(x,z)=>veranda(x,z)?1.2:ramp(x,z)?THREE.MathUtils.clamp((-19.8-z)/2.3,0,1)*1.2:0;
 progress(.96,'The bell waits');
 return {texturesLoaded:16,grassBlades:0,trunks:circles,discoveries:clues['city-precinct'],
  views:{gate:{pos:[3,1.9,46],look:[0,7,26],name:'The great gate',sub:'A paper lantern taller than a man hangs in the vermilion gate.'},approach:{pos:[0,1.8,21],look:[0,3,-24],name:'The stall approach',sub:'Every shutter is down. Every lantern is lit.'},pagoda:{pos:[-6,1.8,4],look:[-22,14,-8],name:'The five-storey pagoda',sub:'Bells hang from every eave, and none of them move.'},bell:{pos:[12,2.2,-14],look:[20,4,-30],name:'The bell wrapped in black',sub:'The anchor bell of the capital, silenced by a Herald.'},court:{pos:[-10,2.4,-19],look:[6,3,6],name:'The incense court',sub:'An open court of raked gravel — a future battle ground.'}},
  canWalk,walkHeight,
  locationAt(x,z){if(z>32)return 'The forecourt';if(z>23)return 'The great gate';if(z>9)return 'The stall approach';if(x<-16)return 'Beneath the pagoda';if(x>14&&z<-20)return 'The bell tower';if(z<-21)return 'The main hall';return 'The incense court';},
  update(t,dt,cam){sky.update(t,cam);leaves.update(t,cam);glows.update(t);streaks.update(t);smokeMat.uniforms.time.value=t;smokeMat.uniforms.halfH.value=glows.material.uniforms.halfH.value;},setEvening(){}};
}
