// III·2 The Threadbound Ravine — a cedar gorge strung with glowing silk, a sagging rope bridge,
// a great waterfall closing the gorge to the west, and a silk-wrapped roadside shrine.
import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { nightSky } from '../atmosphere.js';
import * as R from './common.js';

const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const S=x=>16+2.5*Math.sin(x*.07)+1.5*Math.sin(x*.19);      // south rim
const N=x=>-6-2.5*Math.sin(x*.06)-1.2*Math.sin(x*.17);       // north rim
const FLOOR=-30,SAG=1.4,B0=16.4,B1=-6.4;
const trailX=z=>z>16?1.5*Math.sin(z*.11):2*Math.sin(z*.09)-1.2*ss(-30,-50,z);
const bridgeY=z=>{const t=(B0-z)/(B0-B1);return -SAG*4*t*(1-t);};
const northY=z=>2*ss(-28,-50,z);
function H(x,z){const s=S(x),n=N(x);
 if(x<-58&&z>N(-58)-6&&z<S(-58)+6)return x>-65.5?FLOOR:3+Math.min(27,Math.max(0,-x-80)*.5);
 const inG=z<s&&z>n&&x>-58;let y=inG?FLOOR+Math.sin(x*.3+z*.5)*.4:(z<=n?northY(z):0);
 if(!inG){const dx=Math.abs(x-trailX(z)),dr=Math.min(Math.abs(z-s),Math.abs(z-n));y+=ss(8,30,dx)*(Math.sin(x*.07+z*.05)*3+3)*ss(2,8,dr)+ss(-50,-95,x)*25*ss(6,20,dr)+(x<-58?3*ss(-58,-62,x):0);}
 return y;}
export function walk(x,z){if(z<B0+.2&&z>B1-.2&&Math.abs(x)<.9)return bridgeY(Math.min(B0,Math.max(B1,z)));return z<=N(x)?northY(z):0;}

export async function create(root,renderer,progress,{camera}={}){
 progress(.08,'Descending into the threadbound ravine');const k=await kit(root,5521);k.foliage.emissive=new THREE.Color(0x0e1813);const r=k.random;const {box,beam,cylinder,mesh,rock,stone,dark,wood,moss}=k;
 const sky=nightSky(root,{top:0x050912,horizon:0x24304a,glow:0x5a6888,moonDir:R.MOON,moonSize:44,clouds:.32,cloudColor:0x2a3550,stars:2400,seed:9});
 const turf=k.surface('moss',0x4f5c50,50,1),cliff=k.surface('rock',0x6c7478,1,.92),trailMat=k.surface('earth',0x6e6656,10,1);
 R.terrain(k,H,{w:320,d:220,seg:280,x:40,z:-10,mat:turf});
 // Cliff faces: displaced rock walls following each rim, leaning into the gorge, with ledges.
 // Cliff faces with tilted strata: each band recesses upward and ends in a protruding ledge lip.
 const hash=n=>{const v=Math.sin(n*127.1)*43758.5453;return v-Math.floor(v);};
 const strat=(x,y)=>{const st=(y-Math.sin(x*.05)*1.2)/2.4,band=Math.floor(st),fr=st-band;const amp=Math.max(.25,.55+.45*Math.sin(x*.13+band*1.7));return {band,fr,amp,lip:(ss(0,.12,fr)*(1-ss(.12,.3,fr))*1.0-fr*.55)*amp};};
 const surfZ=(rim,side,x,y)=>{const t=Math.min(1,Math.max(0,(y-.4)/(FLOOR-1.5-.4)));const lean=side*(t*3.2+Math.sin(t*9+x*.2)*.6);const bump=Math.sin(x*.9+y*.7)*.22+Math.sin(x*2.3-y*1.9)*.12+Math.sin(y*.35+x*.13)*.8;return rim(x)+lean+side*(bump*.6+strat(x,y).lip);};
 function wall(rim,side,x0,x1){const pts=[],uv=[],col=[],ix=[];const cols=Math.ceil((x1-x0)/1.0),rows=84;const cTop=new THREE.Color(0xa9b4bc),cBot=new THREE.Color(0x30373a),cMoss=new THREE.Color(0x52623a),cRim=new THREE.Color(0xc4cfd6);
  for(let i=0;i<=cols;i++){const x=x0+(x1-x0)*i/cols;for(let j=0;j<=rows;j++){const t=j/rows,y=.4+(FLOOR-1.5-.4)*t;pts.push(x,y,surfZ(rim,side,x,y));uv.push(x*.09,y*.09);const st=strat(x,y);const c=cTop.clone().lerp(cBot,t*.85).multiplyScalar(.82+.32*hash(st.band*7.3+Math.floor(x/9)));if(st.fr<.14&&st.amp>.45)c.lerp(cMoss,.6);if(Math.sin(x*.21+y*.5)+Math.sin(y*1.3)>1.4)c.lerp(cMoss,.35);if(t<.05)c.lerp(cRim,.55);col.push(c.r,c.g,c.b);}}
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;if(side>0)ix.push(a,b,a+1,b,b+1,a+1);else ix.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();const wm=cliff.clone();wm.vertexColors=true;wm.side=THREE.DoubleSide;mesh(g,wm);
  // Moss pads, stones and ferns on the ledge lips.
  const ledges=new THREE.Group();for(let x=x0+2;x<Math.min(x1,90);x+=1.6+r()*1.8){for(let band=-12;band<=0;band++){const y=Math.sin(x*.05)*1.2+band*2.4+.15;if(y>-1.2||y<FLOOR+2)continue;const st=strat(x,y);if(st.amp<.5||r()<.55)continue;const z=surfZ(rim,side,x,y)+side*.35;rock(x,y,z,.3+r()*.35,r()<.7?moss:stone,ledges);if(r()<.7)for(let j=0;j<4;j++){const aa=j*1.57+r()*.6,len=.45+r()*.5;const f=mesh(new THREE.PlaneGeometry(.26,len,1,4),k.foliage,x+Math.cos(aa)*.2,y+.15+len*.2,z+Math.sin(aa)*.2,ledges);f.rotation.set(-.6,aa,.4);f.scale.x=2;}}}k.batch.add(ledges);}
 wall(S,-1,-58,190);wall(N,1,-58,190);
 // The western headwall: tiered, fluted rock with a recessed notch that holds the falls.
 const notch=z=>Math.exp(-Math.pow((z-6)/4.2,2));
 const headX=(z,y)=>-58.5-notch(z)*4.6+Math.sin(z*.8+y*.4)*.5+Math.sin(y*.3+z*.2)*1.6*(1-.7*notch(z))+Math.sin(z*2.1)*.35*(1-notch(z))+(Math.sin(y*.55)>.6?1.4:0)*(1-notch(z));
 {const pts=[],uv=[],col=[],ix=[];const cols=70,rows=36;const c0=new THREE.Color(0x9aa2a8),c1=new THREE.Color(0x3e4446),cm=new THREE.Color(0x5d6e4a);for(let i=0;i<=cols;i++){const z=N(-58)-6+(S(-58)-N(-58)+12)*i/cols;for(let j=0;j<=rows;j++){const t=j/rows,y=3.4+(FLOOR-1-3.4)*t;pts.push(headX(z,y),y,z);uv.push(z*.09,y*.09);const c=c0.clone().lerp(c1,t*.8);if(Math.sin(y*.55)>.55&&notch(z)<.5)c.lerp(cm,.6);col.push(c.r,c.g,c.b);}}for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;ix.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();const hm=cliff.clone();hm.vertexColors=true;hm.side=THREE.DoubleSide;mesh(g,hm);
  for(let i=0;i<60;i++){const z=N(-58)-4+r()*(S(-58)-N(-58)+8),y=-25+r()*26;if(notch(z)>.3)continue;if(Math.sin(y*.55)>.6)rock(headX(z,y)+1.2,y,z,.6+r()*1.2,moss);}}
 for(let i=0;i<140;i++){const x=-55+r()*150,side=r()<.5?1:-1,y=-2-r()*26,z=(side>0?N(x):S(x))+side*(-(y/FLOOR)*3.2+.6);rock(x,y,z,.5+r()*1.4,r()<.5?moss:stone);}
 for(let i=0;i<70;i++){const x=-56+r()*180,z=2+r()*6;rock(x,FLOOR+.2,z,.6+r()*1.6,r()<.3?moss:stone);}
 progress(.25,'Hanging the rope bridge');
 // Rope-and-plank suspension bridge: twisted three-strand handrails, a slatted deck lashed to
 // under-deck stringers, vertical hanging ties and a light diagonal net.
 const rope=k.surface('plaster',0x8a7a5a,.4,1),plank=k.surface('cedar',0x6e5a44,1,.95),lash=k.surface('plaster',0x5e5038,.3,1);
 const RAIL=1.05,zA=B0+.9,zB=B1-.9,railY=z=>(z>B0||z<B1?0:bridgeY(z))+RAIL;
 for(const z of [zA,zB])for(const sx of [-1,1]){cylinder(.15,.19,2.0,sx*1.0,.75,z,dark,10);box(.36,.09,.36,sx*1.0,1.8,z,dark);rock(sx*1.0,.1,z,.5,stone);const w=mesh(new THREE.TorusGeometry(.2,.06,6,16),rope,sx*1.0,1.25,z);w.rotation.x=Math.PI/2;for(let i=0;i<2;i++){const p=mesh(new THREE.PlaneGeometry(.12,.34),new THREE.MeshStandardMaterial({color:0xe8e0cc,side:THREE.DoubleSide,roughness:1}),sx*1.0+(i?.08:-.08),1.0,z+.2);p.castShadow=false;}}
 const along=(fy,x,n=60)=>{const pts=[];for(let i=0;i<=n;i++){const z=zA+(zB-zA)*i/n;pts.push(new THREE.Vector3(x,fy(z),z));}return pts;};
 for(const sx of [-1,1]){
  for(let st=0;st<3;st++){const pts=[];for(let i=0;i<=220;i++){const z=zA+(zB-zA)*i/220,tw=i*.9+st*2.094;pts.push(new THREE.Vector3(sx*.92+Math.cos(tw)*.022,railY(z)+Math.sin(tw)*.022,z));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),440,.016,5),rope);}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(along(z=>(z>B0||z<B1?0:bridgeY(z))+.52,sx*.9)),120,.014,5),rope);
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(along(z=>(z>B0||z<B1?0:bridgeY(z))-.09,sx*.8)),120,.03,6),rope);
  for(let z=B0-.1;z>B1;z-=.6){const y0=bridgeY(z)-.06;beam([sx*.8,y0,z],[sx*.92,railY(z),z],.009,rope);const z2=z-.6;if(z2>B1&&Math.round(z/.6)%2===0){beam([sx*.82,y0+.05,z],[sx*.91,railY(z2)-.05,z2],.006,rope);beam([sx*.82,bridgeY(z2)-.01,z2],[sx*.91,railY(z)-.05,z],.006,rope);}}}
 {const n=Math.round((B0-B1)/.3);for(let i=0;i<n;i++){const z=B0-i*.3-.15;if(i%29===14)continue;const y=bridgeY(z)-.03,w=1.58+(r()-.5)*.1;const p=box(w,.05,.22,(r()-.5)*.05,y,z,plank);p.rotation.y=(r()-.5)*.05;p.rotation.z=(r()-.5)*.04;for(const sx of [-1,1])box(.07,.08,.24,sx*.78,y-.02,z,lash);}}
 // Warden's binding knot halfway across.
 {const kn=new THREE.Mesh(new THREE.TorusKnotGeometry(.09,.03,48,6,2,3),new THREE.MeshStandardMaterial({color:0x8c2f2f,roughness:.9}));kn.position.set(-.92,bridgeY(4)+1.05,4);k.batch.add(kn);}
 progress(.4,'Wrapping the roadside shrine');
 // Stream across the shelf, tumbling over the lip into the gorge beside the shrine.
 const waters=[];const streamPts=[[-40,-38],[-32,-30],[-26,-22],[-21.5,-14],[-19,-7.5]];{const curve=new THREE.CatmullRomCurve3(streamPts.map(([x,z])=>new THREE.Vector3(x,0,z)));const P=curve.getPoints(60),pts=[],ix=[];P.forEach((p,i)=>{const t=i/60,w=1.1+t*.4;const nx=i<60?P[i+1].z-p.z:p.z-P[i-1].z,nz=-(i<60?P[i+1].x-p.x:p.x-P[i-1].x),l=Math.hypot(nx,nz);pts.push(p.x+nx/l*w,H(p.x,p.z)+.08,p.z+nz/l*w,p.x-nx/l*w,H(p.x,p.z)+.08,p.z-nz/l*w);if(i){const a=(i-1)*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}if(i%3===0)for(const s of [-1,1])rock(p.x+s*nx/l*(w+.4),.05,p.z+s*nz/l*(w+.4),.35+r()*.3,r()<.6?moss:stone);});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(ix);const wm=R.moonWater({ripple:1.5,flow:[1,1.2],density:.014});waters.push(wm);const m=new THREE.Mesh(g,wm);root.add(m);}
 const falls=[R.waterfallSheet(root,{x:-19,z:-6.2+.4,yTop:.1,yBottom:FLOOR,width:2.4}),R.waterfallSheet(root,{x:-59.2,z:5.6,yTop:3.2,yBottom:FLOOR,width:6.5,rotY:Math.PI/2}),R.waterfallSheet(root,{x:-59.0,z:8.2,yTop:2.6,yBottom:FLOOR,width:2.6,rotY:Math.PI/2})];
 {const sw=R.moonWater({ripple:1.4,flow:[2,0],density:.014});waters.push(sw);const m=new THREE.Mesh(new THREE.PlaneGeometry(26,3.4),sw);m.rotation.x=-Math.PI/2;m.position.set(-72,3.1,6.2);root.add(m);for(let i=0;i<26;i++)for(const sd of [-1,1])rock(-84+i,3.1,6.2+sd*(2+r()*.4),.4+r()*.4,r()<.5?moss:stone);}
 const river=R.moonWater({ripple:1.6,flow:[1.8,0],density:.014,tint:0x0d1a26});waters.push(river);{const m=new THREE.Mesh(new THREE.PlaneGeometry(260,9),river);m.rotation.x=-Math.PI/2;m.position.set(70,FLOOR+.25,5);root.add(m);}
 // Silk-wrapped shrine: stone base, timber hokora, translucent cocooned silk and thread anchors.
 {const sx=-14.6,sz=-20;box(1.6,.5,1.4,sx,.25,sz,stone);box(1.2,.12,1.0,sx,.56,sz,dark);box(.9,.9,.7,sx,1.07,sz,wood);for(const sd of [-1,1]){const rf=box(1.5,.07,.75,sx,1.68,sz+sd*.3,k.tile);rf.rotation.x=sd*.55;}box(.12,.18,1.0,sx,1.86,sz,dark);
  const silk=new THREE.MeshStandardMaterial({color:0xf2eee2,emissive:0xffe6b0,emissiveIntensity:.6,transparent:true,opacity:.86,roughness:.9,side:THREE.DoubleSide});const wrap=new THREE.SphereGeometry(1,48,36);const p=wrap.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x);const f=1+.05*Math.sin(y*26+a*3)+.035*Math.sin(y*9-a*5)+.025*Math.sin(a*11+y*4);p.setXYZ(i,x*f,y*(y<-.5?.8:1),z*f);}wrap.computeVertexNormals();const w=new THREE.Mesh(wrap,silk);w.scale.set(1.0,1.15,.85);w.position.set(sx,1.25,sz);root.add(w);
  cylinder(.16,.2,.5,sx,.85,sz+.1,stone,8);mesh(new THREE.SphereGeometry(.15,10,8),stone,sx,1.2,sz+.1);}
 progress(.52,'Raising the cedars');
 // Cedars on both rims; near trees frame the trail and carry the threads.
 const trunks=[],anchors=[];const addCedar=(x,z,h,rad)=>{const g=new THREE.Group();g.position.y=H(x,z)-.2;k.batch.add(g);const t=k.cedar(x,z,h,rad,g);anchors.push([x,H(x,z),z,h]);return t;};
 for(let i=0;i<90;i++){const x=-55+r()*110;let z;if(i<45)z=S(x)+3+r()*40;else z=N(x)-3-r()*50;if(Math.abs(x-trailX(z))<4.5)continue;if(z<-6&&z>-30&&x>-18&&x<15)continue;if(Math.hypot(x+19,z+7)<4||Math.hypot(x+14.6,z+20)<3)continue;const t=addCedar(x,z,18+r()*14,.45+r()*.4);if(Math.abs(x-trailX(z))<10)trunks.push(t);}
 for(let i=0;i<34;i++){const x=-67-r()*40,z=-22+r()*56;if(Math.abs(z-6.2)<3.2)continue;addCedar(x,z,20+r()*14,.5+r()*.4);}
 for(const [x,z,h]of [[-5.5,40,26],[6,31,24],[-6.5,22,27],[5.5,20,25],[-17.5,-12,28],[15.5,-10,26],[-8.5,-36,27],[9,-38,25],[-4.5,-47,24],[12,-46,26]])trunks.push(addCedar(x,z,h,.8));
 const far=[];for(let i=0;i<2200;i++){const x=-120+r()*280,z=-110+r()*200;if(z<S(x)+6&&z>N(x)-6)continue;if(Math.abs(x)<40&&z>-60&&z<55)continue;far.push([x,H(x,z)-.5,z,.9+r()*1.1,r()*6]);}
 await R.distantForest(root,far,{tint:0x6a7890});
 R.farRidges(root,{layers:[{dist:300,height:160,color:0x283246},{dist:520,height:260,color:0x1d2638},{dist:820,height:360,color:0x161d2e}],center:[0,0,-20],base:-60,seed:21,mist:0x2c3848});
 progress(.66,'Stringing the threads');
 // Hundreds of threads: between nearby cedars, across the gorge, down into the mist, and over the bridge.
 const curves=[];const pick=()=>anchors[Math.floor(r()*anchors.length)];
 for(let i=0;i<190;i++){const a=pick();let b=null;for(let tries=0;tries<12;tries++){const c=pick();const d=Math.hypot(c[0]-a[0],c[2]-a[2]);if(c!==a&&d>5&&d<(i<70?55:26)){b=c;break;}}if(!b)continue;const ya=a[1]+4+r()*(a[3]*.6),yb=b[1]+4+r()*(b[3]*.6);const d=Math.hypot(b[0]-a[0],b[2]-a[2]);curves.push(R.catenary([a[0],ya,a[2]],[b[0],yb,b[2]],d*.06+r()*d*.08,Math.min(40,10+Math.round(d/2))));}
 for(let i=0;i<40;i++){const a=pick();curves.push(R.catenary([a[0],a[1]+6+r()*10,a[2]],[a[0]+(r()-.5)*20,FLOOR+4+r()*10,4+r()*4],4+r()*6,24));}
 for(let i=0;i<6;i++){const z=r()<.5?B0-r()*2.5:B1+r()*2.5,yh=bridgeY(z)+1.05;const a=pick();curves.push(R.catenary([(r()<.5?-1:1)*.92,yh,z],[a[0],a[1]+5+r()*8,a[2]],2+r()*3,24));}
 for(let i=0;i<26;i++){const a0=r()*6.28,y0=.5+r()*1.6,a1=a0+1.5+r()*2,y1=.4+r()*1.8;const pts=[];for(let j=0;j<=12;j++){const t=j/12,aa=a0+(a1-a0)*t,yy=y0+(y1-y0)*t;pts.push(new THREE.Vector3(-14.6+Math.cos(aa)*1.02,yy+.1,-20+Math.sin(aa)*.9));}curves.push(pts);}
 // The thick severed thread near the far trail.
 curves.push(R.catenary([6.2,ground2(6,-42)+1.4,-42.3],[24,10,-58],2,24));curves.push(R.catenary([4.4,ground2(4,-42)+1.2,-41.7],[-6,12,-60],2,24));
 const threads=R.threadField(root,curves,{intensity:1.1});
 const cut=new THREE.MeshStandardMaterial({color:0xfff0c8,emissive:0xffd890,emissiveIntensity:1.2,roughness:.6});for(const [x0,x1]of [[6.2,5.6],[4.4,4.9]]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,.9,10),cut);m.position.set((x0+x1)/2,ground2(8,-42)+1.1,-42);m.rotation.z=1.2;root.add(m);}
 function ground2(x,z){return walk(x,z);}
 progress(.76,'Filling the gorge with mist');
 const mist=R.mistLayers(root,[{x:60,y:FLOOR+1.2,z:5,w:280,d:12,opacity:.9,color:0xa4b2c8,speed:.04,scale:.07},{x:60,y:FLOOR+3,z:5,w:280,d:14,opacity:.75,color:0x95a3bd,speed:.03,scale:.05},{x:50,y:FLOOR+5.5,z:5,w:260,d:15,opacity:.6,color:0x95a3bd,speed:.025,scale:.05},{x:40,y:FLOOR+10,z:5,w:240,d:16,opacity:.5,color:0x8e9cb6,speed:.02,scale:.04},{x:20,y:-10,z:5,w:200,d:19,opacity:.35,color:0x9aa8c2,speed:.015,scale:.03},{x:-48,y:FLOOR+6,z:5,w:30,d:30,opacity:.85,color:0xc4d0e0,speed:.06,scale:.08},{x:0,y:.8,z:30,w:60,d:40,opacity:.18,color:0xa0aec6,speed:.02,scale:.07},{x:0,y:2,z:-40,w:60,d:40,opacity:.22,color:0xa0aec6,speed:.02,scale:.07}]);
 // Ground cover: ferns and grass along the trails.
 const ferns=new THREE.Group();for(let i=0;i<360;i++){const x=-30+r()*60;const z=r()<.5?S(x)+1+r()*36:N(x)-1-r()*46;if(Math.abs(x-trailX(z))<2.2)continue;if(z<-6&&z>-30&&x>-12&&x<12)continue;const y=H(x,z);for(let j=0;j<5;j++){const a=j*1.256+r()*.4,len=.5+r()*.6;const f=mesh(new THREE.PlaneGeometry(.28,len,1,5),k.foliage,x+Math.cos(a)*.25,y+.3+len*.25,z+Math.sin(a)*.25,ferns);f.rotation.set(-.65,a,.4);f.scale.x=2;}if(i%3===0)rock(x,y+.05,z,.4+r()*.6,moss,ferns);}k.batch.add(ferns);
 const grassBlades=R.grassField(root,36000,r=>{const x=-36+r()*72,z=-56+r()*110;if(z<S(x)+.5&&z>N(x)-.5)return null;if(Math.abs(x-trailX(z))<1.8)return null;if(z<-5&&z>-23&&x>-11&&x<11)return null;return [x,H(x,z),z];},{hue:[.2,.3],sat:.15,light:[.1,.2],height:[.1,.45]});
 // Trails: south forest trail to the bridge, shelf flagstones, north trail uphill.
 {const pts=[],uv=[],ix=[];let n=0;for(let z=52;z>=B0+.3;z-=1){const x=trailX(z);for(const s of [-1,1]){pts.push(x+s*1.5,.03,z);uv.push(s>0?1:0,z*.25);}if(n){const a=(n-1)*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}n++;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,trailMat);}
 {const pts=[],uv=[],ix=[];let n=0;for(let z=-7;z>=-54;z-=1){const x=trailX(z);for(const s of [-1,1]){pts.push(x+s*1.5,northY(z)+.03,z);uv.push(s>0?1:0,z*.25);}if(n){const a=(n-1)*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}n++;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,trailMat);}
 {const flag=k.surface('stone',0x6f7778,1,.9);for(let z=-7.2;z>-31;z-=.85){const x=trailX(z)+(r()-.5)*.5;for(const o of [-.55,.55]){const f=mesh(new THREE.CylinderGeometry(.42+r()*.12,.46+r()*.12,.12,6+Math.floor(r()*3)),flag,x+o+(r()-.5)*.2,.02,z+(r()-.5)*.2);f.rotation.y=r()*3;f.scale.z=.8+r()*.3;}}}
 // Stone lanterns at the bridgeheads, a fallen trunk, a route marker.
 const halos=[];for(const [x,z]of [[-2.4,B0+2.4],[2.4,B0+2.4],[-2.4,B1-2.4],[2.4,B1-2.4],[trailX(-46)-2.5,-46],[trailX(30)+2.6,30]]){const y=walk(x,z);box(.7,.18,.7,x,y+.09,z,stone);cylinder(.12,.14,.8,x,y+.58,z,stone,8);box(.6,.12,.6,x,y+1.03,z,stone);box(.42,.4,.42,x,y+1.29,z,R.paperGlow(true));const c=new THREE.ConeGeometry(.52,.36,4);const cap=mesh(c,stone,x,y+1.67,z);cap.rotation.y=Math.PI/4;halos.push([x,y+1.3,z,1.9,0xffbc70]);}
 beam([-14,.5,36],[-6,1,30],.5,k.surface('rock',0x4c4434));k.sign(-3.2,1.6,34,'THE THREADBOUND RAVINE');
 const glow=R.glowPoints(root,[...halos,[-14.6,1.3,-20,3.2,0xffe6b0]],{pulse:.15});
 const motes=R.glowPoints(root,Array.from({length:220},(_,i)=>[-50+r()*150,FLOOR+2,1+r()*8,.25+r()*.25,r()<.6?0xffe2a0:0xd0e2ff,r()*30]),{rise:1.1,height:40});
 const fallGlow=R.glowPoints(root,[...Array.from({length:8},(_,i)=>[-58.6,FLOOR+2+i*4.4,5.6+(i%2)*.8,9-i*.4,0x8ea6c8,i]),[-56,FLOOR+1,5,22,0xa8bcd8,1],[-56,FLOOR+3,8,16,0x9ab0d0,2]],{pulse:.1});
 const floorMist=R.glowPoints(root,Array.from({length:150},(_,i)=>[-55+r()*170,FLOOR+1+r()*5,2+r()*7,5+r()*6,0x2c3446,r()*30]),{pulse:.2});
 const spray=R.glowPoints(root,Array.from({length:120},(_,i)=>[-59+r()*7,FLOOR+r()*2,2+r()*7,.6+r()*.8,0xc8d6ea,r()*10]),{rise:1.4,height:10});
 for(const [x,y,z,c,p]of [[0,2.5,B0+2.4,0xffb070,7],[0,2.5,B1-2.4,0xffb070,7],[-14.6,1.6,-19,0xffe0a8,5],[trailX(-46),3.5,-46,0xffb070,4],[-52,FLOOR+6,5,0xb8cce8,140],[-50,-6,6,0x9fb4d8,90]]){const l=new THREE.PointLight(c,p,p>20?80:15,p>20?1.3:1.6);l.position.set(x,y,z);root.add(l);}
 k.finish();progress(.96,'Every thread hums');
 const obstacles=[[-14.6,-20,1.25],[-2.4,B0+2.4,.5],[2.4,B0+2.4,.5],[-2.4,B1-2.4,.5],[2.4,B1-2.4,.5],[trailX(-46)-2.5,-46,.5],[-3.2,34,1.3]];
 return {trunks,texturesLoaded:13,grassBlades,discoveries:clues['ridge-ravine'],
  views:{trail:{pos:[1,2.2,42],look:[0,3,0],name:'The cedar trail',sub:'Threads hum between the trunks.'},bridge:{pos:[.2,1.3,6],look:[-50,6,5],name:'The rope bridge',sub:'Thirty metres of mist beneath the planks.'},falls:{pos:[-9,2.5,-9],look:[-57,4,5],name:'The western falls',sub:'The gorge ends in falling water.'},shelf:{pos:[8,3,-28],look:[-4,2,-10],name:'The gorge shelf',sub:'Open ground on the far rim, reserved for a future encounter.'}},
  canWalk(x,z){if(obstacles.some(([a,b,rr])=>Math.hypot(x-a,z-b)<rr))return false;
   if(z>=B0-.1){if(z>51)return false;if(z<S(x)+.6&&Math.abs(x)>.7)return false;return Math.abs(x-trailX(z))<6.5;}
   if(z>B1+.1)return Math.abs(x)<.62;
   if(z>N(x)-.6&&Math.abs(x)>.7)return false;if(z>-31)return x>-17&&x<14.5;if(z<-53)return false;return Math.abs(x-trailX(z))<6.5;},
  walkHeight:walk,locationAt(x,z){return z>B0?'The cedar trail':z>B1?'The rope bridge':z>-28?'The gorge shelf':'The upper trail';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam||camera);threads.update(t);mist.update(t);glow.update(t);motes.update(t);spray.update(t);floorMist.update(t);fallGlow.update(t);for(const f of falls)f.update(t);for(const w of waters)w.uniforms.time.value=t;},setEvening(){}};
}
