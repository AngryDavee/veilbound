import * as THREE from 'three';
import { kit } from '../kit.js';
import { bakeStatic } from '../../assetlib.js';
import { clues } from './story.js';
import { M, facing, keepMaterials, instance, roomProto, lanternProto, halos, fragments, pagoda, houseProto, warmify, groundChunk } from './parts.js';
// The Nightwright's Meridian: a lacquer disc over the void, split by the glowing first fold.
// Fragments of every world orbit overhead; the Keep's rooms ring the far distance; and at the
// north end a plain timber gate opens on stone steps, cedar and morning — the way home.
export async function create(root,renderer,progress){
 progress(.1,'Descending to the Meridian');const k=await kit(root,7404);const m=await keepMaterials(k);const r=k.random;
 const {box,beam,cylinder,mesh}=k;const R=22;
 // --- The disc. ---
 const disc=mesh(new THREE.CylinderGeometry(R,R-1.5,1.4,96),m.black,0,-.7,0);
 const inlay=k.surface('cedar',0x2a1612,10,.35);const top=mesh(new THREE.CircleGeometry(R-.2,96),inlay,0,.01,0);top.rotation.x=-Math.PI/2;
 for(const rad of [4,9,14,18.5,21.6]){const t=mesh(new THREE.TorusGeometry(rad,rad>21?.12:.05,6,160),m.brass,0,.03,0);t.rotation.x=Math.PI/2;}
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;beam([Math.cos(a)*4,.03,Math.sin(a)*4],[Math.cos(a)*21.6,.03,Math.sin(a)*21.6],.025,m.brass);}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(.5,.04,1.2,Math.cos(a)*20,.03,Math.sin(a)*20,m.gold).rotation.y=-a;}
 // Beneath: a stepped inverted tower of lacquer and brass dissolving into the void.
 for(let i=0;i<7;i++){const rr=R-2-i*2.6;cylinder(rr,rr-1.2,2.6,0,-2.7-i*2.8,0,i%2?m.lacquerDark:m.black,48);const t=mesh(new THREE.TorusGeometry(rr+.05,.12,6,64),m.brass,0,-1.45-i*2.8,0);t.rotation.x=Math.PI/2;}
 // --- The rim: lacquer pillars and a brass ring beam, open where the bridges land. ---
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,x=Math.cos(a)*23.2,z=Math.sin(a)*23.2;if(Math.abs(x)<4)continue;cylinder(.45,.5,9,x,4.5,z,m.lacquer,14);box(1.1,.3,1.1,x,.15,z,m.brass);box(1.2,.35,1.2,x,9,z,m.brass);k.lantern(x*.97,7.6,z*.97,.7);}
 const rimRing=mesh(new THREE.TorusGeometry(23.2,.35,8,128),m.lacquer,0,9.4,0);rimRing.rotation.x=Math.PI/2;
 for(let i=0;i<56;i++){const a=i/56*Math.PI*2,x=Math.cos(a)*23.2,z=Math.sin(a)*23.2;if(Math.abs(x)<4)continue;for(const y of [.5,1.05])box(.08,.08,2.7,x,y,z,m.lacquer).rotation.y=-a;}
 progress(.3,'Tracing the first fold');
 // --- The first fold: a jagged crease of light across the disc, with a curtain rising from it. ---
 const pts=[];for(let i=0;i<=24;i++){const t=i/24,x=-26+t*52,z=10-t*28+Math.sin(t*19)*.9+(i%2?.5:-.5);pts.push(new THREE.Vector3(x,.12,z));}
 const creaseGeo=new THREE.BufferGeometry(),cp=[],cu=[],ci=[];pts.forEach((p,i)=>{const q=pts[Math.min(i+1,pts.length-1)],o=pts[Math.max(i-1,0)];const d=q.clone().sub(o).normalize(),n=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(.38);cp.push(...p.clone().add(n).toArray(),...p.clone().sub(n).toArray());cu.push(i/24,0,i/24,1);if(i<pts.length-1)ci.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);});
 creaseGeo.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));creaseGeo.setAttribute('uv',new THREE.Float32BufferAttribute(cu,2));creaseGeo.setIndex(ci);
 const creaseU={time:{value:0}};
 const ramp=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const img=x.createImageData(w,h);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const a=f(xx/(w-1),yy/(h-1));const o=(yy*w+xx)*4;img.data[o]=255;img.data[o+1]=Math.round(150+105*a);img.data[o+2]=Math.round(80+120*a*a);img.data[o+3]=Math.round(255*a);}x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
 // Lifted 12 cm clear of the brass inlays: at 4 cm the transparent pass lost the depth test to the floor lines.
 const creaseMat=new THREE.ShaderMaterial({uniforms:creaseU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float time;varying vec2 v;void main(){float edge=1.-abs(v.y*2.-1.);float pulse=.7+.3*sin(v.x*40.-time*3.);vec3 c=mix(vec3(1.,.35,.12),vec3(1.,.9,.6),edge*edge);gl_FragColor=vec4(c*pow(edge,1.3)*1.8*pulse,1.);}'});
 const crease=new THREE.Mesh(creaseGeo,creaseMat);crease.renderOrder=5;root.add(crease);
 const curtainGeo=new THREE.BufferGeometry(),qp=[],qu=[],qi=[];pts.forEach((p,i)=>{qp.push(p.x,.1,p.z,p.x,20,p.z);qu.push(i/24,0,i/24,1);if(i<pts.length-1)qi.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);});curtainGeo.setAttribute('position',new THREE.Float32BufferAttribute(qp,3));curtainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(qu,2));curtainGeo.setIndex(qi);
 const curtainMat=new THREE.ShaderMaterial({uniforms:creaseU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float time;varying vec2 v;void main(){float f=pow(1.-v.y,2.6);float streak=.55+.45*sin(v.x*90.+time*.6+sin(v.y*5.+time*.8)*2.);float edge=smoothstep(0.,.1,v.x)*smoothstep(1.,.9,v.x);gl_FragColor=vec4(vec3(1.,.5,.22)*f*streak*edge*.5,1.);}'});
 const curtain=new THREE.Mesh(curtainGeo,curtainMat);curtain.renderOrder=6;root.add(curtain);
 // --- Overhead: three great brass rings of the Keepers, turning slowly. ---
 const rings=[];for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(30+i*5,.45-i*.08,10,160),m.brass);t.position.set(0,46,0);t.rotation.set(Math.PI/2+i*.22,i*.6,0);root.add(t);rings.push(t);for(let j=0;j<12;j++){const n=new THREE.Mesh(new THREE.SphereGeometry(.7,10,8),m.gold);const a=j/12*Math.PI*2;n.position.set(Math.cos(a)*(30+i*5),Math.sin(a)*(30+i*5),0);t.add(n);}}
 progress(.5,'Gathering the stolen places');
 const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');const gg=gx.createRadialGradient(64,64,0,64,64,64);gg.addColorStop(0,'rgba(255,170,100,.55)');gg.addColorStop(.4,'rgba(255,120,60,.18)');gg.addColorStop(1,'rgba(0,0,0,0)');gx.fillStyle=gg;gx.fillRect(0,0,128,128);
 const glowSprite=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
 const orbiters=[];const kinds=[['bellPavilion',1.5],['brickTower',.9],['farmhouse',1.2],['carriage',1.3],['fireTower',1.3],['waterwheel',1.4],['teahouse',1.1],['gasLamp',1.5],['dojo',1],['bellPavilion',1.1],['carriage',1],['farmhouse',1]];
 kinds.forEach(([kind,sc],i)=>{const g=new THREE.Group();const frag=fragments[kind](k,m);g.add(frag);groundChunk(k,m,kind==='gasLamp'?2.6:kind==='carriage'?5:kind==='brickTower'?4.2:kind==='fireTower'?2.8:kind==='waterwheel'?4.2:5.4,g,r);warmify(g,.13);if(kind==='gasLamp'){for(const x of [-2.5,2.5]){const l=fragments.gasLamp(k,m);l.position.x=x;l.position.z=1.5;g.add(l);}}
  const baked=bakeStatic(g);baked.scale.setScalar(sc*1.25);const tilt=new THREE.Group();tilt.add(baked);tilt.rotation.set((r()-.5)*.5,r()*6.28,(r()-.5)*.5);
  const pivot=new THREE.Group();const rad=36+(i%3)*11+r()*6,a=i/kinds.length*Math.PI*2;tilt.position.set(Math.cos(a)*rad,8+(i%4)*7+r()*5,Math.sin(a)*rad);pivot.add(tilt);root.add(pivot);
  const sp=new THREE.Sprite(glowSprite);sp.scale.setScalar(26*sc);sp.position.copy(tilt.position);sp.position.y-=2;pivot.add(sp);orbiters.push({pivot,tilt,speed:.01+r()*.012,phase:r()*6.28,spin:(r()-.5)*.05});});
 // An inverted pagoda and two more drifting from far above, the Keep's own fragments.
 const pg=bakeStatic(pagoda(k,m,{tiers:5,base:9,story:3}));pg.rotation.x=Math.PI;pg.position.set(-60,70,-90);root.add(pg);
 // --- The Keep itself ringing the far distance: rooms in a vast cylinder, fading into fog. ---
 const ring=[[],[],[],[]];for(let i=0;i<620;i++){const a=r()*Math.PI*2,rad=140+r()*55,cl=Math.floor(r()*9);const y=-70+cl*17+(r()-.5)*10;const sc=.9+r()*.9;const flip=r()<.07;
  const mtx=M(Math.cos(a)*rad,y,Math.sin(a)*rad,flip?Math.PI:0,-a-Math.PI/2+(r()-.5)*.6,(r()-.5)*(r()<.15?.5:0),sc);ring[i%4].push(mtx);}
 instance(root,houseProto(k,m,0,'paper'),ring[0]);instance(root,houseProto(k,m,1,'paper'),ring[1]);instance(root,houseProto(k,m,2,'paper'),ring[2]);instance(root,houseProto(k,m,0,'paperRed'),ring[3]);
 progress(.7,'Opening the way home');
 // --- Bridges. ---
 const bridge=(z0,z1)=>{const L=Math.abs(z1-z0),zc=(z0+z1)/2;box(5.6,.3,L,0,-.15,zc,m.floor);box(6,.6,L,0,-.55,zc,m.lacquerDark);for(const s of [-1,1]){box(.1,.1,L,s*2.8,1.05,zc,m.lacquer);for(let z=Math.min(z0,z1);z<=Math.max(z0,z1)+.01;z+=2){box(.13,1.1,.13,s*2.8,.55,z,m.lacquer);box(.2,.06,.2,s*2.8,1.12,z,m.brass);}}};
 bridge(21,37);bridge(-21,-40);
 for(const s of [-1,1])box(.5,6,.5,s*3.4,3,37.4,m.lacquer);box(8,.5,.5,0,6,37.4,m.lacquer);box(8.6,.35,.7,0,6.4,37.4,m.black);for(const s of [-1,1])box(1.6,5,.06,s*2.6,2.6,37.6,m.fusuma);
 // The way home: weathered cedar posts, stone steps climbing into a morning that should not be here.
 const stone=k.surface('stone',0x8e8a7e,1,.85),oldWood=k.surface('cedar',0x6a5a48,1,.9);
 for(const s of [-1,1]){box(.5,5.2,.5,s*3,2.6,-40,oldWood);box(.7,.4,.7,s*3,.2,-40,stone);}box(7.6,.4,.45,0,5.1,-40,oldWood);box(8.4,.3,.6,0,5.45,-40,oldWood);
 for(let i=0;i<14;i++)box(5.4,.24,.9,0,.12+i*.24,-41-i*.85,stone);
 for(let i=0;i<10;i++)k.rock((r()-.5)*14,.2+r()*2,-42-r()*12,.8+r(),k.moss);
 const homeSky=new THREE.ShaderMaterial({depthWrite:false,transparent:true,uniforms:creaseU,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec2 v;void main(){vec3 top=vec3(.55,.72,.86),hor=vec3(1.,.86,.62);vec3 c=mix(hor,top,smoothstep(.15,.9,v.y));float sun=smoothstep(.09,.0,length((v-vec2(.6,.32))*vec2(1.6,1.)));c+=vec3(1.,.9,.7)*sun;float mt=step(v.y,.18+.08*sin(v.x*9.)+.04*sin(v.x*23.));c=mix(c,vec3(.42,.55,.6),mt*.8);float e=smoothstep(0.,.12,v.x)*smoothstep(1.,.88,v.x)*smoothstep(0.,.05,v.y)*smoothstep(1.,.8,v.y);gl_FragColor=vec4(c*1.15,e);}'});
 mesh(new THREE.PlaneGeometry(52,32),homeSky,0,10,-58);
 for(const [x,z,h] of [[-5.5,-47,18],[6,-50,20],[-8,-53,16]])k.cedar(x,z,h,.55);
 const homeLight=new THREE.PointLight(0xfff0d0,90,30,2);homeLight.position.set(0,6,-44);root.add(homeLight);
 const key=new THREE.PointLight(0xffb070,22,160,1);key.position.set(0,34,0);root.add(key);
 // --- Your sibling's stand: a planted sword with the scarf knotted at its hilt, and a lantern. ---
 const blade=new THREE.MeshStandardMaterial({color:0xd8dde0,metalness:.95,roughness:.18});const sw=new THREE.Group();sw.position.set(-15.6,0,-6.2);sw.rotation.set(.12,.4,.08);k.batch.add(sw);
 k.box(.045,1.05,.012,0,.5,0,blade,sw);k.box(.2,.03,.16,0,1.04,0,m.gold,sw);k.box(.04,.32,.04,0,1.22,0,m.black,sw);const scarf=new THREE.MeshStandardMaterial({color:0x9c2c3a,roughness:.9,side:THREE.DoubleSide});for(let i=0;i<5;i++){const p=k.box(.16,.3,.02,.05+i*.09,1.1-i*.18,.03,scarf,sw);p.rotation.z=.4+i*.1;}
 k.lantern(-14.9,.35,-5.3,.5);box(.6,.06,.6,-14.9,.03,-5.3,m.black);
 // The fold's knot: a brass seal where the crease is deepest.
 const seal=mesh(new THREE.TorusGeometry(1.1,.08,8,40),m.gold,8.2,.06,-8.4);seal.rotation.x=Math.PI/2;
 const glow=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2,x=Math.cos(a)*23.2,z=Math.sin(a)*23.2;if(Math.abs(x)<4)continue;glow.push([x*.97,7.6,z*.97]);}for(const p of pts)if(Math.random()<.5)glow.push([p.x,.4,p.z]);
 for(const [x,y,z,c,i,d] of [[0,8,0,0xff9a60,120,34],[-12,5,8,0xff9050,60,22],[12,5,-12,0xff9050,60,22],[8,2,-8,0xff6a30,50,14],[0,4,30,0xffa060,30,14],[-14.9,1.2,-5.3,0xffb070,12,6]]){const l=new THREE.PointLight(c,i,d,2);l.position.set(x,y,z);root.add(l);}
 const haloMat=halos(root,glow,{size:3,opacity:.9,density:.004});

 const embers=k.particles(700,0xffa060,.07,[120,60,120]);
 k.finish();progress(.95,'Every world turns overhead');
 const inRect=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<=w/2&&Math.abs(z-cz)<=d/2;
 return {texturesLoaded:11,grassBlades:0,discoveries:clues['keep-meridian'],
  views:{arrival:{pos:[0,2.2,32],look:[0,10,-20],name:'The Meridian',sub:'Every world you crossed, turning overhead.'},
   fold:{pos:[16,2.4,6],look:[2,3,-10],name:'The first fold',sub:'Everything stolen hangs from this one crease.'},
   orbit:{pos:[-6,1.8,10],look:[-50,30,-40],name:'The stolen places',sub:'A bell pavilion, a brick tower, a farmhouse, a train.'},
   home:{pos:[0,2,-30],look:[0,4,-52],name:'The way home',sub:'Stone steps, cedar, and morning.'}},
  canWalk(x,z){return Math.hypot(x,z)<=R-.4||inRect(x,z,0,29,5.2,17)||inRect(x,z,0,-31,5.2,19.5);},
  walkHeight(){return 0;},
  locationAt(x,z){if(z<-21)return 'The way home';if(z>21)return 'The descent';return 'The Nightwright’s Meridian';},
  update(t){k.windTime.value=t;embers(t);creaseU.time.value=t;haloMat.uniforms.time.value=t;rings.forEach((g,i)=>{g.rotation.z=t*(.02+i*.012)*(i%2?-1:1);});for(const o of orbiters){o.pivot.rotation.y=o.phase+t*o.speed;o.tilt.rotation.y+=o.spin*.016;}pg.rotation.y=t*.01;},setEvening(){}};
}
