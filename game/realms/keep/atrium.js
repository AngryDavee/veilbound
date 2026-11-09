import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { M, facing, keepMaterials, instance, roomProto, doorProto, stairProto, galleryProto, lanternProto, halos, hipRoof, fragments, ROOM } from './parts.js';
// The Stacked Atrium: a square well of red-lacquer balconies rising and falling out of sight
// (after the tiered inn atria of old hot-spring towns), a roofed floating stage at its centre,
// and slices of earlier worlds folded into its walls like exhibits in a museum of stolen places.
export async function create(root,renderer,progress){
 progress(.1,'Climbing the stacked atrium');const k=await kit(root,7303);const m=await keepMaterials(k);const r=k.random;
 const {box,beam,cylinder,mesh}=k;const {W,D,H}=ROOM;
 const IN=24,FRONT=25.6,TIER=4.2,cols=[];for(let c=-26.6;c<=26.61;c+=7.6)cols.push(c);
 const walls=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]];
 const near=[],farLit=[],farRed=[],gal=[],lamps=[],stairs=[],glow=[],doorBase=[],doorPhase=[],slots=[];
 for(const n of walls)for(const c of cols)for(let t=-8;t<=16;t++){
  const y=t*TIER,ground=t===0;const along=n[2]!==0;
  if(ground&&along&&Math.abs(c)<5)continue; // vestibules pierce the north and south walls
  const fx=along?c:-n[0]*FRONT,fz=along?-n[2]*FRONT:c;const mat=facing(fx-n[0]*D/2,y,fz-n[2]*D/2,n,0);
  slots.push({mat,n,c,t,fx,fz});
 }
 // Choose slots for folded fragments of earlier worlds before instancing the ordinary rooms.
 const exhibitKinds=['street','train','lattice','forge','thatch','street','train','lattice','forge','thatch','lattice','forge'];
 const exhibits=[];const pick=[[0,-11.4,1],[0,11.4,2],[1,-3.8,1],[1,19,3],[2,3.8,1],[2,-19,2],[3,-11.4,1],[3,11.4,3],[0,3.8,4],[1,-19,4],[2,19,4],[3,-3.8,5]];
 for(const [wi,c,t] of pick){const s=slots.find(q=>q.n===walls[wi]&&Math.abs(q.c-c)<.1&&q.t===t);if(s){s.exhibit=exhibitKinds[exhibits.length];exhibits.push(s);}}
 for(const s of slots){const {mat,t,n,fx,fz}=s;
  if(!s.exhibit){if(t>=-2&&t<=4){near.push(mat);if(r()<.5)for(const sd of [-1,1]){doorBase.push({mat,side:sd});doorPhase.push(r()*20);}}else (r()<.78?farLit:farRed).push(mat);}
  if(t!==0)gal.push(facing(fx,t*TIER,fz,n,0));
  if(t>=-2&&t<=6&&r()<.55)lamps.push(M(fx+n[0]*1.5,t*TIER+3.1,fz+n[2]*1.5));
  glow.push([fx+n[0]*1.2,t*TIER+2.6,fz+n[2]*1.2]);
  if(t!==0&&(t+Math.round(s.c/7.6))%3===0){const dir=t%2?1:-1;const rot=Math.atan2(n[0],n[2]);const tang=[Math.cos(rot),-Math.sin(rot)];stairs.push(M(fx+n[0]*.85+tang[0]*dir*2,t*TIER,fz+n[2]*.85+tang[1]*dir*2,0,rot+(dir>0?Math.PI/2:-Math.PI/2),0));}
 }
 progress(.3,'Lacquering the balconies');
 instance(root,roomProto(k,m,{detail:true}),near);
 instance(root,roomProto(k,m,{detail:'lite',lit:'paper'}),farLit);instance(root,roomProto(k,m,{detail:'lite',lit:'paperRed'}),farRed);
 instance(root,galleryProto(k,m,{L:7.6,d:1.6}),gal);
 instance(root,stairProto(k,m,{n:14,w:1.2,rise:.3,run:.3}),stairs);
 instance(root,lanternProto(k,m,{r:.3,cord:.8}),lamps);
 const doors=instance(root,doorProto(k,m,{w:1.8,h:2.62}),doorBase.map(d=>d.mat));
 const tmp=new THREE.Matrix4(),slide=new THREE.Matrix4();
 function placeDoors(t){for(let i=0;i<doorBase.length;i++){const d=doorBase[i];const open=THREE.MathUtils.smoothstep(Math.sin(t*.3+doorPhase[i]),.1,.75);slide.makeTranslation(d.side*(.92+open*1.75),.02,D/2+.06+(d.side>0?.06:0));tmp.multiplyMatrices(d.mat,slide);doors.set(i,tmp);}doors.commit();}
 placeDoors(0);doors.refreshBounds();
 // Corner piers bind the four walls and run the full height.
 for(const x of [-1,1])for(const z of [-1,1]){box(2.2,140,2.2,x*(IN+.6),-10,z*(IN+.6),m.lacquer);for(let t=-8;t<=16;t++)box(2.6,.35,2.6,x*(IN+.6),t*TIER+.1,z*(IN+.6),m.brass);}
 progress(.45,'Folding in the stolen places');
 // --- Exhibits: slices of earlier worlds set into room slots. ---
 const brick=k.surface('stone',0x7a3a2a,3,.85),cobble=k.surface('stone',0x4a4c50,4,.8),thatch=k.surface('moss',0x8a7448,3,1),carriage=k.surface('cedar',0x283a33,2,.45),clay=k.surface('earth',0x5a3a2a,2,.95);
 const ember=new THREE.MeshStandardMaterial({color:0xff7a30,emissive:0xff5a10,emissiveIntensity:2.2,roughness:.6});
 const exhibitGlow=[];
 for(const s of exhibits){const g=new THREE.Group();const b=(w,h,d,x,y,z,mat)=>k.box(w,h,d,x,y,z,mat,g);
  if(s.exhibit==='street'){b(W,H+.6,.3,0,(H+.6)/2,-D/2,brick);b(W,.1,D,0,.05,0,cobble);for(let i=0;i<3;i++)b(1.6,1.8,.05,-2.4+i*2.4,1.5,-D/2+.18,m.paper);for(let i=0;i<3;i++)b(1.9,.12,.6,-2.4+i*2.4,2.55,-D/2+.45,m.black);const lamp=fragments.gasLamp(k,m);lamp.position.set(2.6,0,1.4);lamp.scale.setScalar(.75);g.add(lamp);exhibitGlow.push([2.6,3,1.4]);}
  else if(s.exhibit==='train'){b(W,H,.25,0,H/2,-.4,carriage);for(let i=0;i<4;i++){b(1.2,.9,.05,-2.7+i*1.8,1.8,-.25,m.paper);b(1.3,.06,.08,-2.7+i*1.8,1.28,-.22,m.brass);}b(W,.08,.1,0,1.1,-.2,m.brass);b(W,.3,.6,0,H+.15,-.4,m.black);for(const x of [-2.5,2.5]){const wh=k.cylinder(.45,.45,.15,x,.45,0,m.black,14,g);wh.rotation.x=Math.PI/2;}exhibitGlow.push([0,1.8,.4]);}
  else if(s.exhibit==='lattice'){b(W,H,.1,0,H/2,-.2,m.paperRed);for(let x=-W/2+.15;x<W/2;x+=.22)b(.07,H,.07,x,H/2,0,m.lacquer);b(W,.25,.12,0,H-.1,0,m.black);b(W+.6,.18,1.2,0,H+.2,.3,m.tile);exhibitGlow.push([0,1.6,.6]);}
  else if(s.exhibit==='forge'){b(W,H+.4,.6,0,(H+.4)/2,-D/2+.3,clay);const arch=k.mesh(new THREE.CylinderGeometry(1.2,1.2,.2,20,1,false,0,Math.PI),ember,0,.9,-D/2+.65,g);arch.rotation.x=Math.PI/2;arch.rotation.z=Math.PI/2;b(2.4,.9,.2,0,.45,-D/2+.65,ember);for(let i=0;i<6;i++)b(.3,.12+r()*.2,.5,-2.6+i*.9,.1,1,m.black);b(1,.8,.6,2.4,.4,.6,m.black);exhibitGlow.push([0,1,-1.5],[0,1.2,-1.5]);}
  else {b(W,H*.7,.2,0,H*.35,-D/2+.2,m.plaster);for(let i=0;i<3;i++)b(1.4,1,.05,-2.4+i*2.4,1.1,-D/2+.32,m.paper);const roof=b(W+1,.7,3.2,0,H*.9,-D/2+1.4,thatch);roof.rotation.x=-.75;b(W+1.2,.3,.3,0,H*1.2,-D/2+.2,thatch);exhibitGlow.push([0,1.2,-1.6]);}
  g.applyMatrix4(s.mat);g.updateMatrixWorld(true);for(const p of exhibitGlow.splice(0))glow.push(new THREE.Vector3(...p).applyMatrix4(s.mat).toArray());k.batch.add(g);
 }
 progress(.6,'Raising the floating stage');
 // --- The floating stage: hinoki boards, corner pillars, a heavy roof and a painted backboard. ---
 box(26,1.6,26,0,-.8,0,m.black);box(26.4,.12,26.4,0,-.06,0,m.lacquer);box(25.6,.2,25.6,0,-.1,0,m.hinoki);for(let x=-12.6;x<12.8;x+=.42)box(.02,.01,25.6,x,.006,0,m.beam);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;beam([Math.cos(a)*16,-1.6,Math.sin(a)*16],[Math.cos(a)*5,-26,Math.sin(a)*5],.7,m.lacquerDark);}
 cylinder(4,1.5,12,0,-8,0,m.black,8);for(let i=0;i<6;i++){const t=k.mesh(new THREE.TorusGeometry(4.2-i*.4,.12,6,32),m.brass,0,-2-i*2,0);t.rotation.x=Math.PI/2;}
 const PH=15;for(const x of [-12.7,12.7])for(const z of [-12.7,12.7]){cylinder(.42,.46,PH,x,PH/2,z,m.lacquer,16);box(1.1,.3,1.1,x,.15,z,m.brass);for(const y of [5,10,PH-.2])box(1,.25,1,x,y,z,m.brass);}
 // An open lattice crown instead of a solid roof, so the tiers and the lantern cascade stay visible.
 for(const s of [-1,1]){box(26.2,.7,.55,0,PH,s*12.7,m.lacquer);box(.55,.7,26.2,s*12.7,PH,0,m.lacquer);box(27,.25,.9,0,PH+.45,s*12.7,m.black);box(.9,.25,27,s*12.7,PH+.45,0,m.black);}
 // Above the crown: square lacquer frames recede upward, each turned a little further, into the fog.
 const frames=[];for(let j=1;j<=18;j++){frames.push(M(0,PH+j*5.2,0,0,j*.11,0,1+j*.045));}
 const fr=new THREE.Group();for(const s2 of [-1,1]){k.box(26,.55,.45,0,0,s2*13,m.lacquer,fr);k.box(.45,.55,26,s2*13,0,0,m.lacquer,fr);k.box(26.6,.18,.8,0,.38,s2*13,m.black,fr);k.box(.8,.18,26.6,s2*13,.38,0,m.black,fr);}for(const x of [-13,13])for(const z of [-13,13])k.box(.9,.4,.9,x,-.1,z,m.brass,fr);
 instance(root,fr,frames);const frLamps=[];frames.forEach((f,j)=>{if(j%2)return;const p=new THREE.Vector3().setFromMatrixPosition(f);for(const [x,z] of [[-13,-13],[13,-13],[-13,13],[13,13]]){const v=new THREE.Vector3(x,-1.2,z).applyMatrix4(new THREE.Matrix4().extractRotation(f)).multiplyScalar(1+j*.045).add(p);frLamps.push(M(v.x,v.y,v.z));glow.push(v.toArray());}});instance(root,lanternProto(k,m,{r:.42,cord:1}),frLamps);
 // A small gabled canopy over the backboard only.
 k.roof(0,7,-12.9,18,4,k.batch);
 // Eave lanterns on the stage roof and a cascade of lanterns rising from the ridge into the fog.
 for(const x of [-12.7,12.7])for(const z of [-12.7,12.7]){k.lantern(x+Math.sign(x)*.9,PH-1.4,z+Math.sign(z)*.9,1.1);glow.push([x+Math.sign(x)*.9,PH-1.4,z+Math.sign(z)*.9]);}
 const cascade=[];for(let i=0;i<46;i++){const a=i*2.4,rr=1+i*.12;cascade.push(M(Math.cos(a)*rr,PH+3+i*1.6,Math.sin(a)*rr,0,a,0,1.2));glow.push([Math.cos(a)*rr,PH+3+i*1.6,Math.sin(a)*rr]);}instance(root,lanternProto(k,m,{r:.45,cord:1.5}),cascade);
 // Backboard with a painted pine, outside the arena at the stage's north edge.
 const pc=document.createElement('canvas');pc.width=1024;pc.height=512;const p=pc.getContext('2d');p.fillStyle='#c79b52';p.fillRect(0,0,1024,512);for(let i=0;i<500;i++){p.fillStyle=`rgba(90,60,20,${Math.random()*.06})`;p.fillRect(Math.random()*1024,Math.random()*512,90,4);}
 p.strokeStyle='#3a2a1a';p.lineCap='round';p.lineWidth=46;p.beginPath();p.moveTo(470,512);p.bezierCurveTo(560,380,380,300,520,170);p.stroke();p.lineWidth=20;p.beginPath();p.moveTo(500,260);p.bezierCurveTo(650,230,760,250,880,200);p.stroke();p.beginPath();p.moveTo(520,200);p.bezierCurveTo(400,170,260,190,150,150);p.stroke();
 p.fillStyle='#24402c';for(const [x,y,w] of [[880,190,260],[160,140,240],[520,150,300],[700,250,200],[320,210,180]]){for(let j=0;j<3;j++){p.beginPath();p.ellipse(x+(j-1)*w*.25,y-j*14,w/2,30,0,0,6.3);p.fill();}}
 const pine=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(pc),roughness:.7});pine.map.colorSpace=THREE.SRGBColorSpace;
 box(17,6.6,.3,0,3.3,-12.9,m.beam);mesh(new THREE.PlaneGeometry(16,6),pine,0,3.3,-12.74);
 // Five cold cushions for five Heralds.
 for(let i=0;i<5;i++){box(.85,.12,.85,-4+i*2,.06,-12.1,new THREE.MeshStandardMaterial({color:[0x5a1a2a,0x2a3a5a,0x3a4a2a,0x6a3a1a,0x3a3a3a][i],roughness:.95}));}
 // Bridges from the stage: south, north, west, east, with brass-capped railings.
 const bridge=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(x1-x0,z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2;const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=a;k.batch.add(g);
  k.box(4.4,.3,L,0,-.15,0,m.floor,g);k.box(4.8,.7,L,0,-.6,0,m.lacquerDark,g);for(const s of [-1,1]){k.box(.1,.1,L,s*2.15,1.05,0,m.lacquer,g);for(let zz=-L/2;zz<=L/2+.01;zz+=L/Math.round(L/1.8)){k.box(.12,1.1,.12,s*2.15,.55,zz,m.lacquer,g);k.box(.18,.06,.18,s*2.15,1.11,zz,m.brass,g);}}};
 bridge(0,12.8,0,23.4);bridge(0,-12.8,0,-23.4);bridge(-12.8,-6,-23.4,-6);bridge(12.8,-6,23.4,-6);
 // Ground ring: walkable balcony at stage level with railings broken where bridges land.
 for(const n of walls){const along=n[2]!==0;const g=new THREE.Group();k.batch.add(g);g.rotation.y=Math.atan2(n[0],n[2]);g.position.set(-n[0]*24,0,-n[2]*24);
  k.box(51.2,.3,3.2,0,-.15,-.8,m.floor,g);k.box(51.2,.7,.4,0,-.6,.8,m.lacquerDark,g);const gap=along?0:6*(n[0]>0?1:-1)*-1;
  for(let x=-24;x<24;x+=1.85){if(Math.abs(x-(along?0:(n[0]<0?-6:6)))<2.6)continue;k.box(.1,1.05,.1,x,.52,.8,m.lacquer,g);k.box(1.85,.09,.09,x+.92,1.05,.8,m.lacquer,g);}}
 // Vestibules through the north and south walls.
 for(const s of [1,-1]){box(13,.3,16,0,-.15,s*33,m.floor);for(const x of [-6.5,6.5]){box(.3,4.2,16,x,2.1,s*33,m.paperDim);for(let z=25.6;z<=41;z+=1.8)box(.12,4.2,.14,x*.98,2.1,s*z,m.lacquer);}box(13,.2,16,0,4.3,s*33,m.beam);for(let z=27;z<41;z+=3.2){box(13,.25,.25,0,4.1,s*z,m.lacquer);k.lantern(0,3.4,s*z,.6);glow.push([0,3.4,s*z]);}
  for(const x of [-1,1])box(.5,6,.5,x*3.4,3,s*41.2,m.lacquer);box(8,.5,.5,0,6,s*41.2,m.lacquer);for(const x of [-1,1])box(1.6,5,.06,x*2.6,2.6,s*41.4,m.fusuma);}
 // The one stair in the atrium that goes down.
 for(let i=0;i<16;i++)box(2,.12,.34,5.2,-i*.28-.06,-28.5-i*.34,m.floor);for(const x of [4.2,6.2])beam([x,1,-28.5],[x,1-16*.28,-28.5-16*.34],.04,m.lacquer);box(2.4,.02,6,5.2,.01,-31.2,new THREE.MeshBasicMaterial({color:0x050203,transparent:true,opacity:.6}));
 const ashMat=new THREE.MeshStandardMaterial({color:0x6a6460,roughness:1});for(let i=0;i<6;i++)box(.14,.01,.28,4.8+(i%2)*.6,.012,-26.2-i*.7,ashMat);
 // The gas lamp bolted to the west bridge.
 const lamp=fragments.gasLamp(k,m);lamp.position.set(-15.6,0,-8);k.batch.add(lamp);glow.push([-15.6,3.95,-8]);box(.5,.3,.3,-15.6,.9,-8.1,m.brass);
 for(const [x,y,z,c,i,d] of [[-8,9,8,0xffb070,110,28],[8,9,-8,0xffb070,110,28],[8,9,8,0xff9050,90,26],[-8,9,-8,0xff9050,90,26],[0,3,33,0xffa060,35,14],[0,3,-33,0xffa060,35,14],[-15.6,4,-8,0xffc890,20,10],[0,-14,0,0xff6030,120,40]]){const l=new THREE.PointLight(c,i,d,2);l.position.set(x,y,z);root.add(l);}
 const haloMat=halos(root,glow,{size:2.8,opacity:.85,density:.006});
 const motes=k.particles(500,0xffc080,.05,[60,60,60]);
 k.finish();progress(.95,'The stage waits for an audience');
 const inRect=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<=w/2&&Math.abs(z-cz)<=d/2;
 return {texturesLoaded:9,grassBlades:0,discoveries:clues['keep-atrium'],
  views:{entry:{pos:[0,2,23.6],look:[0,11,-6],name:'The stacked atrium',sub:'Balconies rise and fall farther than the lanterns reach.'},
   stage:{pos:[9,2,9],look:[-4,3,-12],name:'The floating stage',sub:'Five cushions. No audience.'},
   balconies:{pos:[-22.6,1.8,-6],look:[22,20,-24],name:'The west balcony',sub:'Lamp-lit streets, train windows and forge-fire, folded into the walls.'},
   below:{pos:[2,1.9,20],look:[-14,-30,-10],name:'Over the rail',sub:'The tiers keep going down.'}},
  canWalk(x,z){if(inRect(x,z,0,0,25.4,25.4))return true;if(inRect(x,z,0,18.2,3.8,11)||inRect(x,z,0,-18.2,3.8,11)||inRect(x,z,-18.2,-6,11,3.8)||inRect(x,z,18.2,-6,11,3.8))return true;
   if(inRect(x,z,0,0,51,51)&&!inRect(x,z,0,0,46.6,46.6))return true;if(inRect(x,z,0,33,12.2,15.8)||inRect(x,z,0,-33,12.2,15.8))return !(x>4&&x<6.5&&z<-27.6&&z>-34.6);return false;},
  walkHeight(){return 0;},
  locationAt(x,z){if(Math.abs(z)>25.5)return z>0?'The entry vestibule':'The descending stair';if(Math.abs(x)<13&&Math.abs(z)<13)return 'The floating stage';if(Math.abs(x)>22||Math.abs(z)>22)return 'The atrium balcony';return 'The stage bridges';},
  update(t){k.windTime.value=t;motes(t);placeDoors(t);haloMat.uniforms.time.value=t;},setEvening(){}};
}
