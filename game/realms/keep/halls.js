import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { M, facing, keepMaterials, instance, roomProto, doorProto, stairProto, galleryProto, lanternProto, halos, pagoda, ROOM, eaveProto, deepPaper, warmify } from './parts.js';
// The Falling Halls: a tatami landing suspended in a vertical shaft whose four walls are
// lined with rooms stacked beyond sight above and below. Rooms float in the void at every
// angle, sliding doors open by themselves, and an inverted pagoda hangs over the landing.
export async function create(root,renderer,progress){
 progress(.1,'Falling through the halls');const k=await kit(root,7101);const m=await keepMaterials(k);m.deep=deepPaper();const r=k.random;
 const {box,beam,cylinder,mesh}=k;
 const AX=48,AZ=60,TIER=3.8,STEP=7.6;
 // --- Shaft walls: detailed near tiers, simplified far tiers. ---
 const near=[],far=[],galleries=[],doorBase=[],doorPhase=[];
 const walls=[{n:[0,0,1],along:'x',fixed:-AZ,len:AX-4},{n:[0,0,-1],along:'x',fixed:AZ,len:AX-4},{n:[1,0,0],along:'z',fixed:-AX,len:AZ-4},{n:[-1,0,0],along:'z',fixed:AX,len:AZ-4}];
 // Walls are built as irregular stacks: each column has its own scale, depth, orientation and gaps,
 // with overhanging eaves, so the shaft reads as accreted architecture rather than a façade grid.
 const eaves=[],grades={lit:[],dim:[],red:[],deep:[]};const T=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
 const grade=(mat,y)=>{const ay=Math.abs(y),v=r();if(ay>72)grades.deep.push(mat);else if(ay>40)(v<.55?grades.dim:v<.8?grades.red:grades.deep).push(mat);else (v<.7?grades.lit:v<.88?grades.dim:grades.red).push(mat);};
 for(const w of walls){let a=-w.len-5;while(a<w.len+5){const sc=.7+r()*.85,depth=r()<.35?3+r()*14:r()*2.5,style=r();
   const roll=style<.7?0:style<.8?Math.PI:style<.93?(r()<.5?1:-1)*Math.PI/2:0,tilt=style>=.93?(r()<.5?1:-1)*(.15+r()*.35):0,side=Math.abs(roll)>1&&Math.abs(roll)<2;
   const step=(side?ROOM.W:ROOM.H+.8)*sc+(r()<.3?r()*1.6:0);
   if(r()>.1)for(let y=-110+r()*step;y<110;y+=step+(r()<.1?step*(1+r()*2):0)){
    const off=ROOM.D/2*sc+depth,yy=y+(roll===Math.PI?ROOM.H*sc:0);
    const pos=w.along==='x'?[a,yy,w.fixed-w.n[2]*off]:[w.fixed-w.n[0]*off,yy,a];
    const mat=facing(...pos,w.n,roll,sc);if(tilt)mat.multiply(new THREE.Matrix4().makeRotationX(tilt));
    if(Math.abs(y)<9&&roll===0&&!tilt&&depth<2.6){near.push(mat);galleries.push(mat.clone().multiply(T(0,0,ROOM.D/2)));for(const s of [-1,1]){doorBase.push({mat,side:s});doorPhase.push(r()*20);}}
    else grade(mat,y);
    if(roll===0&&!tilt&&r()<.24)eaves.push(mat.clone().multiply(T(0,ROOM.H+.2,ROOM.D/2-.2)));
   }
   a+=ROOM.W*sc+(r()<.3?r()*5:.35);}}
 // --- Rooms adrift in the void, rotated onto walls and ceilings, with stairs that lead nowhere. ---
 const adrift=[],stairs=[];const axes=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]];
 for(let c=0;c<46;c++){let x,z;do{x=(r()-.5)*80;z=(r()-.5)*100;}while(Math.abs(x)<22&&Math.abs(z)<46);const y=(r()-.5)*110;
  for(let j=0;j<1+Math.floor(r()*3);j++){const n=axes[Math.floor(r()*6)];{const odd=r()<.4;const mm=facing(x+(r()-.5)*9,y+(r()-.5)*7,z+(r()-.5)*9,n,odd?r()*6.28:Math.floor(r()*4)*Math.PI/2,.8+r()*.6);if(odd)mm.multiply(new THREE.Matrix4().makeRotationX((r()-.5)*.9));adrift.push(mm);}}
  for(let j=0;j<2;j++)stairs.push(M(x+(r()-.5)*12,y+(r()-.5)*10,z+(r()-.5)*12,Math.floor(r()*4)*Math.PI/2,r()*6.28,Math.floor(r()*4)*Math.PI/2));}
 progress(.3,'Stacking rooms beyond sight');
 instance(root,roomProto(k,m,{detail:true}),near.concat(adrift.slice(0,30)));
 for(const mm of adrift.slice(30))grade(mm,new THREE.Vector3().setFromMatrixPosition(mm).y);
 instance(root,roomProto(k,m,{detail:'lite',lit:'paper'}),grades.lit);instance(root,roomProto(k,m,{detail:'lite',lit:'paperDim'}),grades.dim);instance(root,roomProto(k,m,{detail:'lite',lit:'paperRed'}),grades.red);instance(root,roomProto(k,m,{detail:'lite',lit:'deep'}),grades.deep);
 instance(root,eaveProto(k,m),eaves);
 instance(root,galleryProto(k,m),galleries);
 instance(root,stairProto(k,m),stairs);
 // Bridges strung across the shaft at many heights.
 const spans=[];for(let b=0;b<16;b++){const y=(b-8)*13+(r()-.5)*5,alongX=b%2;if(Math.abs(y)<8)continue;const c=(r()-.5)*(alongX?90:70);for(let s=-6;s<=6;s++){spans.push(alongX?M(s*7.6,y,c,0,0,0):M(c,y,s*7.6,0,Math.PI/2,0));}}
 const spanProto=new THREE.Group();k.box(7.6,.22,2.4,0,-.11,0,m.floor,spanProto);for(const s of [-1,1]){k.box(7.6,.08,.08,0,1,s*1.15,m.lacquer,spanProto);for(let x=-3.8;x<3.8;x+=1.9)k.box(.08,1,.08,x,.5,s*1.15,m.lacquer,spanProto);}k.box(7.6,.3,.3,0,-.35,0,m.lacquerDark,spanProto);
 instance(root,spanProto,spans);
 const diag=[];for(let b=0;b<26;b++){const y0=(r()-.5)*160;if(Math.abs(y0)<12)continue;const a0=r()*Math.PI*2,a1=a0+Math.PI+(r()-.5)*1.8;const p0=[Math.cos(a0)*47,y0,Math.sin(a0)*58],p1=[Math.cos(a1)*47,y0+(r()-.5)*30,Math.sin(a1)*58];
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz=p1[2]-p0[2],L=Math.hypot(dx,dz),n=Math.ceil(L/7.4),yaw=Math.atan2(-dz,dx),pitch=Math.atan2(dy,L);
  for(let s=0;s<n;s++){const t=(s+.5)/n,x=p0[0]+dx*t,y=p0[1]+dy*t,z=p0[2]+dz*t;if(Math.abs(x)<18&&Math.abs(z)<44&&Math.abs(y)<10)continue;diag.push(M(x,y,z,0,yaw,pitch));}}
 instance(root,spanProto,diag);
 const flights=[];for(let i=0;i<48;i++){let x,z;do{x=(r()-.5)*86;z=(r()-.5)*106;}while(Math.abs(x)<18&&Math.abs(z)<44);const y=(r()-.5)*170;if(Math.abs(y)<6)continue;flights.push(M(x,y,z,(r()-.5)*.5,r()*6.28,(r()-.5)*.5,.9+r()*.5));}
 instance(root,stairProto(k,m,{n:26,w:2.2}),flights);
 // Self-sliding doors on every near room.
 const doors=instance(root,doorProto(k,m,{w:1.8,h:2.62}),doorBase.map(d=>d.mat));
 const tmp=new THREE.Matrix4(),slide=new THREE.Matrix4();
 function placeDoors(t){for(let i=0;i<doorBase.length;i++){const d=doorBase[i];const open=THREE.MathUtils.smoothstep(Math.sin(t*.35+doorPhase[i]),.2,.8);const x=d.side*(.92+open*1.75);slide.makeTranslation(x,.02,ROOM.D/2+.06+(d.side>0?.06:0));tmp.multiplyMatrices(d.mat,slide);doors.set(i,tmp);}doors.commit();}
 placeDoors(0);doors.refreshBounds();
 progress(.5,'Laying the landing');
 // --- The landing: a 30 m tatami hall with its own sliding perimeter. ---
 const tat=[];for(let i=0;i<16;i++)for(let j=0;j<33;j++)tat.push(M(-14.4+i*1.8+.9,0,-14.85+j*.9+.45));
 const mat1=new THREE.Group();k.box(1.77,.07,.87,0,.035,0,m.tatami,mat1);k.box(1.79,.02,.07,0,.07,.42,m.black,mat1);k.box(1.79,.02,.07,0,.07,-.42,m.black,mat1);instance(root,mat1,tat,{receive:true});
 box(31.2,1.2,31.2,0,-.6,0,m.black);box(31.6,.18,31.6,0,-.08,0,m.lacquer);
 // Massive brackets beneath the landing reach down into the fog.
 for(const s of [-1,1])for(const t of [-1,1]){beam([s*14,-1,t*14],[s*6,-22,t*6],.55,m.lacquerDark);beam([s*14,-1,t*14],[s*14,-9,t*14],.4,m.black);}
 for(let i=0;i<4;i++){box(30,.6,.6,0,-1.6-i*.01,-12+i*8,m.beam);box(.6,.6,30,-12+i*8,-1.9,0,m.beam);}
 const ring=mesh(new THREE.TorusGeometry(12.6,.05,6,120),m.brass,0,.08,0);ring.rotation.x=Math.PI/2;const ring2=mesh(new THREE.TorusGeometry(11.7,.03,6,120),m.brass,0,.08,0);ring2.rotation.x=Math.PI/2;
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;beam([Math.cos(a)*11.7,.085,Math.sin(a)*11.7],[Math.cos(a)*12.6,.085,Math.sin(a)*12.6],.03,m.brass);}
 // Perimeter posts, lintels, and track-mounted shoji that open onto the void.
 const perim=[],pPhase=[];
 for(const side of [[0,1],[0,-1],[1,0],[-1,0]]){for(let a=-15;a<=15.01;a+=1.875){const x=side[0]?side[0]*15:a,z=side[1]?side[1]*15:a;if(!(side[1]&&Math.abs(a)<3.4)){box(.24,3.2,.24,x,1.6,z,m.lacquer);box(.3,.12,.3,x,3.25,z,m.brass);}
   if(a<15&&!(side[1]&&Math.abs(a+.94)<3.6)){const cx=side[0]?x:a+.94,cz=side[1]?z:a+.94;perim.push({x:cx,z:cz,rot:side[0]?Math.PI/2:0,s:(Math.round(a/1.875)%2)?1:-1});pPhase.push(r()*30);}}
  if(side[0])box(.3,.34,30.2,side[0]*15,3.05,0,m.lacquer);else{for(const s of [-1,1])box(11.5,.34,.3,s*9.25,3.05,side[1]*15,m.lacquer);}box(side[0]?.3:30.2,.12,side[0]?30.2:.3,side[0]*15,.06,side[1]*15,m.black);}
 const pDoors=instance(root,doorProto(k,m,{w:1.8,h:2.85,lit:'paper'}),perim.map(p=>M(p.x,0,p.z,0,p.rot,0)));
 function placePerim(t){for(let i=0;i<perim.length;i++){const p=perim[i];const open=THREE.MathUtils.smoothstep(Math.sin(t*.28+pPhase[i]),-.1,.7);slide.makeTranslation(p.s*open*1.7,0,0);tmp.multiplyMatrices(M(p.x,.03,p.z,0,p.rot,0),slide);pDoors.set(i,tmp);}pDoors.commit();}
 placePerim(0);pDoors.refreshBounds();
 // --- Bridges: arrival (south) and onward (north). ---
 function bridge(z0,z1){const len=Math.abs(z1-z0),zc=(z0+z1)/2;box(5.6,.3,len,0,-.15,zc,m.floor);box(6,.5,len,0,-.5,zc,m.lacquerDark);for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z+=.6)box(5.6,.02,.04,0,.005,z,m.black);
  for(const s of [-1,1]){box(.1,.1,len,s*2.85,1.05,zc,m.lacquer);box(.06,.06,len,s*2.85,.55,zc,m.lacquer);for(let z=Math.min(z0,z1);z<=Math.max(z0,z1)+.01;z+=2.25){box(.14,1.1,.14,s*2.85,.55,z,m.lacquer);box(.2,.07,.2,s*2.85,1.12,z,m.brass);}}
  for(let z=Math.min(z0,z1)+2;z<Math.max(z0,z1);z+=6)for(const s of [-1,1]){beam([s*2.85,1.1,z],[s*2.85,3.4,z],.05,m.black);k.lantern(s*2.85,3.1,z,.75);}
  beam([0,-.7,z0],[0,-14,(z0+z1)/2],.3,m.black);}
 bridge(15.2,38);bridge(-15.2,-41);
 // The door you fell through, standing open on nothing.
 for(const s of [-1,1])box(.4,6,.4,s*3.4,3,38.4,m.lacquer);box(8,.5,.5,0,6,38.4,m.lacquer);box(8.6,.35,.7,0,6.4,38.4,m.black);for(const s of [-1,1])k.box(1.8,5,.06,s*2.6,2.6,38.6,m.fusuma);
 // Onward: the tilted drafting room around a perfectly level table.
 box(10,.3,13,0,-.15,-34.5,m.floor);box(10.4,.5,13.4,0,-.5,-34.5,m.lacquerDark);
 const tilted=new THREE.Group();tilted.position.set(0,0,-34);tilted.rotation.set(.3,Math.PI/2+.12,0);k.batch.add(tilted);
 for(const x of [-5.5,5.5])for(const z of [-5,5])k.box(.26,7,.26,x,3.2,z,m.lacquer,tilted);k.box(11.4,.3,.3,0,6.6,5,m.lacquer,tilted);k.box(11.4,.3,.3,0,6.6,-5,m.lacquer,tilted);for(const s of [-1,1])k.box(.3,.3,10.4,s*5.5,6.6,0,m.lacquer,tilted);
 for(let i=0;i<5;i++){k.box(1.9,4.4,.04,-4.4+i*2.2,3.4,-5.1,m.paper,tilted);for(let y=1.6;y<5.6;y+=.9)k.box(1.9,.04,.06,-4.4+i*2.2,y,-5.08,m.black,tilted);}
 k.box(11,.2,10,0,7.6,0,m.beam,tilted);for(let x=-5;x<=5;x+=1)k.box(.06,.06,10,x,7.45,0,m.black,tilted);
 box(2.2,.08,1.3,-3,1.0,-31,m.hinoki);for(const x of [-1,1])for(const z of [-.55,.55])box(.07,1,.07,-3+x,.5,-31+z,m.black);box(1.4,.01,.9,-3,1.045,-31,new THREE.MeshStandardMaterial({color:0xe8dcc0,roughness:1}));
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;beam([-3+Math.cos(a)*.3,1.05,-31+Math.sin(a)*.3],[-3+Math.cos(a+2)*.32,1.05,-31+Math.sin(a+2)*.32],.004,m.lacquer);}
 // The way onward: a great fusuma gate slid open on a lantern-lit corridor.
 for(const s of [-1,1]){box(.5,7,.5,s*4,3.5,-41,m.lacquer);box(3.2,6,.08,s*5.6,3,-41.2,m.fusuma);}box(9.4,.6,.6,0,7,-41,m.lacquer);box(10,.4,.9,0,7.45,-41,m.black);
 for(let i=0;i<6;i++){box(.2,3,.2,-2.6,1.5,-43-i*2.5,m.lacquer);box(.2,3,.2,2.6,1.5,-43-i*2.5,m.lacquer);box(5.4,.2,.2,0,3,-43-i*2.5,m.lacquer);k.lantern(0,2.4,-43-i*2.5,.55);}box(5.4,.1,16,0,-.05,-50,m.floor);
 // Clue props: a stand of five small bells; a scarf snagged on the east doors.
 box(1.4,.08,.5,-13.6,1.3,8,m.black);for(const x of [-.6,.6])box(.07,1.3,.07,-13.6+x,.65,8,m.black);for(let i=0;i<5;i++){cylinder(.012,.012,.3,-14.1+i*.25,1.15,8,m.black,4);k.mesh(new THREE.CylinderGeometry(.05,.1,.16,10),m.brass,-14.1+i*.25,.95,8);}
 const scarf=new THREE.MeshStandardMaterial({color:0x9c2c3a,roughness:.9,side:THREE.DoubleSide});for(let i=0;i<8;i++){const p=box(.34,.42,.03,14.85,2.2-i*.36,-6+Math.sin(i*.9)*.12,scarf);p.rotation.y=Math.PI/2;p.rotation.z=Math.sin(i)*.15;}
 progress(.7,'Hanging the inverted pagoda');
 // --- Landmark: an inverted pagoda descending from the fog above the landing. ---
 const pag=warmify(pagoda(k,m,{tiers:6,base:12,story:3.4}),.22,0xff7030);const pagRoot=new THREE.Group();const PY=52,PS=1.1;pagRoot.position.set(0,PY,0);pagRoot.rotation.x=Math.PI;pag.scale.setScalar(PS);pagRoot.add(pag);
 const pagBaked=new THREE.Group();pagBaked.add(pagRoot);const pagStatic=(await import('../../assetlib.js')).bakeStatic(pagBaked);root.add(pagStatic);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+.4;beam([Math.cos(a)*7,PY+2,Math.sin(a)*7],[Math.cos(a)*46,PY+48,Math.sin(a)*56],.07,m.brass);}
 // Lanterns hang from every eave corner of the inverted tiers, and a great lantern at the tip.
 const eave=[];for(let i=0;i<6;i++){const y=PY-(i*4.8+3.4)*PS,w=12*(1-i*.12)*PS*.62;for(let c=0;c<4;c++){const a=c*Math.PI/2+Math.PI/4;eave.push([Math.cos(a)*w,y-1.2,Math.sin(a)*w]);}}
 instance(root,lanternProto(k,m,{r:.5,cord:1.2}),eave.map(p=>M(...p)));const tip=lanternProto(k,m,{r:1.6,cord:0});tip.position.set(0,PY-43.5,0);k.batch.add(tip);
 const halo=[];
 // --- Lanterns adrift throughout the shaft. ---
 const lamps=[];for(let i=0;i<340;i++){let x,z;do{x=(r()-.5)*88;z=(r()-.5)*112;}while(Math.abs(x)<17&&Math.abs(z)<44);const y=(r()-.5)*120+4;lamps.push(M(x,y,z,0,r()*6,0,.8+r()*.8));halo.push([x,y,z]);}
 instance(root,lanternProto(k,m,{cord:6}),lamps);
 for(const p of near.concat(far))if(r()<.3){const e=new THREE.Vector3().setFromMatrixPosition(p);halo.push([e.x*.97,e.y+1.6,e.z*.97]);}
 const haloMat=halos(root,halo,{size:3.2,opacity:.85,density:.0075});halos(root,eave.concat([[0,PY-43.5,0],[0,PY-43.5,0]]),{size:7,opacity:1,density:.004});
 const bridgeGlow=[];for(const z0 of [17.2,23.2,29.2,35.2,-17.2,-23.2,-29.2,-35.2])for(const s of [-1,1])bridgeGlow.push([s*2.85,3.1,z0]);halos(root,bridgeGlow,{size:2.4,opacity:1});
 for(const [x,y,z,c,i,d] of [[-9,5,9,0xffa060,60,22],[9,5,-9,0xffa060,60,22],[9,5,9,0xff9050,55,22],[-9,5,-9,0xff9050,55,22],[0,PY-46,0,0xff7840,160,44],[0,PY-24,14,0xff8a50,150,40],[0,4,28,0xffb070,30,14],[0,4,-34,0xffb070,40,16]]){const l=new THREE.PointLight(c,i,d,2);l.position.set(x,y,z);root.add(l);}
 for(const x of [-AX,AX])for(const z of [-AZ,AZ]){box(2.4,240,2.4,x,0,z,m.lacquerDark);for(let y=-110;y<120;y+=TIER*3)box(3,.5,3,x,y,z,m.brass);}
 const embers=k.particles(500,0xffb070,.06,[90,90,110]);
 k.finish();progress(.95,'The doors begin to slide');
 const inRect=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<=w/2&&Math.abs(z-cz)<=d/2;
 return {texturesLoaded:9,grassBlades:0,discoveries:clues['keep-halls'],
  views:{landing:{pos:[0,3.2,34],look:[0,12,-20],name:'The door you fell through',sub:'Rooms above, rooms below. No sky.'},
   void:{pos:[2.2,1.9,24],look:[30,-26,8],name:'Over the edge',sub:'The halls fall away into amber fog.'},
   pagoda:{pos:[-10,1.8,10],look:[0,32,0],name:'The inverted pagoda',sub:'Someone built a tower downward, toward you.'},
   onward:{pos:[0,2,-24],look:[0,2.5,-42],name:'The drafting room',sub:'A level table in a tilted room.'}},
  canWalk(x,z){return inRect(x,z,0,0,29.2,29.2)||inRect(x,z,0,26.5,5.2,23.4)||inRect(x,z,0,-27.5,5.2,25)||inRect(x,z,0,-34.5,9,12)||inRect(x,z,0,-46,4.6,10);},
  walkHeight(){return 0;},
  locationAt(x,z){if(z>15)return 'The arrival bridge';if(z<-28)return 'The drafting room';if(z<-15)return 'The onward bridge';return 'The landing hall';},
  update(t){k.windTime.value=t;embers(t);placeDoors(t);placePerim(t);haloMat.uniforms.time.value=t;pagStatic.rotation.y=t*.012;},setEvening(){}};
}
