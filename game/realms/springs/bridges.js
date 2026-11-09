import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { nightSky, precipitation } from '../atmosphere.js';
import { springsMaterials, snowRoof, inn, gasLamp, glowSprites, steamField, waterSurface, lampStreaks, snowTrees, terrain, mountains, snowMounds, signGeometry, rng, fbm, icicles, stoneLantern, snowPatches } from './common.js';
// Region VI·1 — The Gaslamp Bridges. A steaming river channel between three- and four-storey
// timber inns, gas lamps on both banks, arched footbridges and the Great Inn gateway.
const BRIDGES=[28,10,-8];
const arch=x=>.85*(1-(x/5)**2);
function groundHeight(x,z){const ax=Math.abs(x);if(ax<4.6&&z>-16.5)return -6;const side=THREE.MathUtils.smoothstep(ax,23,78)*(30+30*fbm(x*.025,z*.03,4));const north=THREE.MathUtils.smoothstep(-z,62,125)*(36+34*fbm(x*.03+4,z*.02,4));const lane=Math.abs(x)<5&&z<-56?THREE.MathUtils.smoothstep(-z,58,80)*9:0;return Math.max(side,north,lane)+(ax>21?fbm(x*.2,z*.2,2)*.6:0);}
export async function create(root,renderer,progress,{camera}={}){
 progress(.08,'Following the river street through the snow');
 const k=await kit(root,6061),M=springsMaterials(k),R=rng(6061),B=k.batch,trunks=[],lampHeads=[],lanterns=[],streaks=[],mounds=[];
 const box=(w,h,d,x,y,z,m)=>k.box(w,h,d,x,y,z,m);
 const moonDir=[-.36,.4,-.84];
 const sky=nightSky(root,{top:0x060b17,horizon:0x2f3c54,glow:0x56627e,moonDir,moonSize:46,clouds:.5,cloudColor:0x232b3e,stars:1800,starBrightness:.8});
 // Valley floor, hillsides and the far mountain ring.
 terrain(root,k,{size:360,seg:180,cx:0,cz:-10,height:groundHeight,repeat:70});
 mountains(root,k,{r0:200,peak:280,seed:6});
 progress(.2,'Laying the embankments');
 // River channel: coursed stone walls, capstones, curbs and railings along both banks.
 for(const s of [-1,1]){
  for(let z=-16;z<132;z+=3){const h=2.7;box(.7,h,3.02,s*4.25,-h/2+.05,z+1.5,M.stone);}
  for(let z=-16;z<132;z+=1.25){box(.8,.22,1.2,s*4.3,.12,z+.6,M.stone);box(.66,.12,1.1,s*4.3,.27,z+.6,M.snow);}
  for(let z=-16;z<34;z+=1.8){if(BRIDGES.some(b=>Math.abs(z+.9-b)<1.6))continue;box(.18,.86,.18,s*4.45,.65,z,M.stone);box(.24,.08,.24,s*4.45,1.1,z,M.snow);}
  for(const [a,b] of [[-16,BRIDGES[2]-1.5],[BRIDGES[2]+1.5,BRIDGES[1]-1.5],[BRIDGES[1]+1.5,BRIDGES[0]-1.5],[BRIDGES[0]+1.5,33.2]]){const L=b-a;box(.1,.08,L,s*4.45,.98,(a+b)/2,M.innWood);box(.16,.06,L,s*4.45,1.04,(a+b)/2,M.snow);box(.06,.06,L,s*4.45,.6,(a+b)/2,M.innWood);}
  // Drain spouts and moss streaks on the channel wall.
  for(let z=-12;z<34;z+=6.5){box(.2,.2,.5,s*3.95,-.55,z,M.innDark);box(.05,.9,.3,s*3.92,-1.0,z,new THREE.MeshStandardMaterial({color:0x1c2a22,roughness:1}));}
 }
 // Paving: individual setts on both banks, with snow banked along edges.
 for(const s of [-1,1])for(let z=-16.4;z<33.6;z+=.92)for(let x=4.65;x<9.95;x+=1.18){const w=1.1+R()*.06;box(Math.min(w,9.95-x),.14,.86,s*(x+w/2),-.05,z+.45,M.paving);}
 // Bridge plaza over the culverted river, flanked by stone parapets.
 box(20.4,.7,16.6,0,-.36,41.6,M.stone);
 for(let z=33.6;z<49.6;z+=1.02)for(let x=-9.9;x<9.9;x+=1.25){const w=Math.min(1.2,9.95-x);box(w,.12,.98,x+w/2,-.04,z+.5,M.paving);}
 for(const [x0,x1,z] of [[-4.2,4.2,33.3],[-9.9,9.9,49.9]]){const L=x1-x0;box(L,.75,.4,(x0+x1)/2,.38,z,M.stone);box(L+.1,.14,.52,(x0+x1)/2,.82,z,M.stone);box(L,.18,.44,(x0+x1)/2,.97,z,M.snow);for(let x=x0+.6;x<x1;x+=2.1)mounds.push([x,1.02,z,.35+R()*.3,.12,.25]);}
 // The plaza gate: a timber frame with a signboard, under which the visitor arrives.
 for(const s of [-1,1]){box(.36,4.6,.36,s*3.4,2.3,47.6,M.innDark);box(.6,.5,.6,s*3.4,.25,47.6,M.stone);}
 box(8.2,.34,.42,0,4.45,47.6,M.innDark);box(8.6,.18,.6,0,4.7,47.6,M.snow);box(7.4,.22,.3,0,3.9,47.6,M.innDark);
 {const c=document.createElement('canvas');c.width=1024;c.height=200;const g=c.getContext('2d');g.fillStyle='#24180f';g.fillRect(0,0,1024,200);g.strokeStyle='#c99a52';g.lineWidth=8;g.strokeRect(14,14,996,172);g.fillStyle='#f0d49c';g.font='bold 104px "Hiragino Mincho ProN","Yu Mincho",serif';g.textAlign='center';g.textBaseline='middle';g.fillText('ほむら湯温泉',512,104);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sm=new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0x7a5a38,emissiveIntensity:.7,roughness:.9});
  k.mesh(new THREE.PlaneGeometry(3.6,.7),sm,0,4.15,47.38);k.mesh(new THREE.PlaneGeometry(3.6,.7),sm,0,4.15,47.82).rotation.y=Math.PI;
  // The Great Inn's horizontal board uses the same lettering.
  k.mesh(new THREE.PlaneGeometry(7,1.35),sm,0,5.55,-39.15);}
 progress(.34,'Raising the inns');
 // Arched footbridges: curved deck boards, rails, posts, snow on every top surface.
 for(const zb of BRIDGES){for(let i=0;i<=20;i++){const x=-5+i*.5,y=arch(x);const b=box(.52,.12,2.5,x,y-.06,zb,M.innWood);b.rotation.z=-Math.atan(-1.7*x/25);if(i%2===0)box(.5,.06,2.1,x,y+.03,zb,M.snow);}
  for(const s of [-1,1]){const pts=[],sn=[];for(let i=0;i<=20;i++){const x=-5+i*.5;pts.push(new THREE.Vector3(x,arch(x)+1.0,zb+s*1.2));sn.push(new THREE.Vector3(x,arch(x)+1.07,zb+s*1.2));}
   k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.06,6,false),M.innDark);k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sn),32,.07,6,false),M.snow);
   const mid=pts.map(p=>p.clone().setY(p.y-.45));k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mid),32,.035,5,false),M.innWood);
   for(let i=0;i<=10;i++){const x=-5+i;k.box(.12,1.05,.12,x,arch(x)+.5,zb+s*1.2,M.innDark);k.box(.16,.06,.16,x,arch(x)+1.11,zb+s*1.2,M.snow);}}
  // Under-arch beams.
  for(const s of [-1,.0,1]){const pts=[];for(let i=0;i<=16;i++){const x=-4.4+i*.55;pts.push(new THREE.Vector3(x,arch(x)-.25,zb+s*.9));}k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.12,6,false),M.innDark);}
 }
 // Banks lined with inns. East faces -X, west faces +X; four-storey landmarks near the plaza.
 const plan=[[42,3,true],[28.6,3,false],[19.6,2,true],[10.6,3,false],[1.6,2,false],[-7.4,3,true]];
 let seed=11;for(const s of [-1,1])for(const [zc,floors,gable] of plan){const r=inn(k,M,{x:s*10,z:zc,rot:-s*Math.PI/2,W:8.4,D:9.5,floors:floors+(s>0&&zc===10.6?0:0),parent:B,seed:seed++,sign:(seed%3===0)?-1:seed%8,gableFront:gable!==(s<0)});lanterns.push(...r.lamps);}
 for(const s of [-1,1]){const r=inn(k,M,{x:s*10,z:-14,rot:-s*Math.PI/2,W:4.6,D:8,floors:2,parent:B,seed:seed++,sign:-1,lantern:false});lanterns.push(...r.lamps);
  for(const zc of [-20.6,-29.6,-38.6]){const r2=inn(k,M,{x:s*12,z:zc,rot:-s*Math.PI/2,W:8.4,D:10,floors:zc===-29.6?3:2,parent:B,seed:seed++,sign:seed%8,gableFront:zc!==-29.6});lanterns.push(...r2.lamps);}}
 // The Great Inn: a five-storey bathhouse whose ground floor is the gateway north.
 const great=inn(k,M,{x:0,z:-39.4,rot:0,W:19,D:13,floors:4,parent:B,seed:77,sign:-1,gableFront:true,passage:4.4});lanterns.push(...great.lamps);
 {// Rooftop lookout and a curved entrance canopy.
  const g=new THREE.Group();g.position.set(0,great.height+2.4,-45.9);B.add(g);k.box(3.6,2.6,3.6,0,1.3,0,M.innDark,g);for(const s of [-1,1]){k.box(3.0,1.5,.05,0,1.4,s*1.82,M.window,g);k.box(.05,1.5,3.0,s*1.82,1.4,0,M.window,g);}
  for(let i=-6;i<=6;i++){const x=i*.42,y=.65*(1-(x/2.7)**2)+.32*Math.pow(Math.abs(x)/2.7,8);const sl=k.box(.44,.12,3.0,x,4.0+y,-38.6,M.tile);const sl2=Math.atan(-2*.65*x/(2.7*2.7)+8*.32*Math.sign(x)*Math.pow(Math.abs(x)/2.7,7)/2.7);sl.rotation.z=sl2;const sn=k.box(.44,.22,2.9,x,4.16+y,-38.6,M.snow);sn.rotation.z=sl2;}
  for(const s of [-1,1]){k.box(.24,3.9,.24,s*2.3,1.95,-37.6,M.innDark);k.box(.5,.4,.5,s*2.3,.2,-37.6,M.stone);}k.box(5,.28,.3,0,3.9,-37.6,M.innDark);
 }
 // Small roof caps for the lookout.
 snowRoof(k,M,B,{x:0,y:great.height+5,z:-45.9,w:4.4,d:4.4,rise:1.6,over:.7,side:.4,R});
 // Lane north of the Great Inn: low sheds, the last gas lamp, steps up toward the forges.
 for(const s of [-1,1]){box(.5,1.4,7,s*2.7,.7,-55.5,M.stone);box(.6,.2,7,s*2.7,1.5,-55.5,M.snow);
  const shed=new THREE.Group();B.add(shed);k.box(4,2.6,6.5,s*5.4,1.3,-55.5,M.innWood,shed);k.box(4.4,.5,7.2,s*5.3,2.85,-55.5,M.snow,shed);}
 for(let i=0;i<12;i++){box(5,.32,.9,0,.16+i*.36,-59+-i*.85,M.stone);box(4.8,.1,.6,0,.37+i*.36,-59.1-i*.85,M.snow);}
 // Gas lamps on both banks, around the plaza and square, and the final lamp in the lane.
 const lampSpots=[[4.85,31],[4.85,19],[4.85,4.4],[4.85,-13],[-4.85,24.5],[-4.85,14.2],[-4.85,-2.5],[-4.85,-13.5],[9.2,35.6],[-9.2,35.6],[8.6,48.8],[-8.6,48.8],[10.8,-17.6],[-10.8,-17.6],[10.8,-38.8],[-10.8,-38.8],[1.75,-54]];
 for(const [x,z] of lampSpots){lampHeads.push(gasLamp(k,M,B,x,z));trunks.push([x,z,.3]);mounds.push([x,0,z,.6,.22,.6]);if(Math.abs(x)<5.5&&z>-16&&z<34)streaks.push([Math.sign(x)*2.6,z+3.4,.55,6.5,0xffb15a]);}
 // The guardian's scarf-pin tied to the last lamp.
 box(.04,.6,.12,1.62,2.3,-54,new THREE.MeshStandardMaterial({color:0xa2242a,roughness:.9}));box(.12,.06,.12,1.62,2.62,-54,M.bronze);
 // Plaza foot bath (ashiyu): a timber tub of hot water under a little snow roof.
 {const fx=-6.4,fz=41.5;box(3.4,.55,1.9,fx,.27,fz,M.innWood);box(3.0,.3,1.5,fx,.38,fz,M.grout);for(const s of [-1,1]){box(3.4,.12,.36,fx,.6,fz+s*.95,M.innWood);}for(const sx of [-1,1])for(const sz of [-1,1]){box(.16,2.6,.16,fx+sx*1.7,1.3,fz+sz*1.0,M.innDark);}
  snowRoof(k,M,B,{x:fx,y:2.55,z:fz,w:3.6,d:2.4,rise:.9,over:.55,side:.35,R});trunks.push([fx,fz,2.1],[fx-1.2,fz,1.4],[fx+1.2,fz,1.4]);}
 for(const [x,z] of [[6.6,38.8],[6.6,44.6],[-1.6,-57.6],[1.6,-57.6]]){lanterns.push(stoneLantern(k,M,B,x,z,0,x>3?1.15:.9));trunks.push([x,z,.5]);}
 progress(.55,'Setting out the night street');
 // Props along the inn fronts: benches, barrels, firewood, buckets, umbrellas, hand-carts.
 const barrel=(x,z,sc=1)=>{k.cylinder(.36*sc,.31*sc,.85*sc,x,.43*sc,z,M.innWood,14);for(const y of [.14,.43,.72])k.mesh(new THREE.TorusGeometry(.355*sc,.025,4,16),M.iron,x,y*sc,z).rotation.x=Math.PI/2;k.cylinder(.3*sc,.33*sc,.1,x,.88*sc,z,M.snow,12);trunks.push([x,z,.45*sc]);};
 const bench=(x,z,rot)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;B.add(g);k.box(1.8,.08,.45,0,.45,0,M.innWood,g);for(const s of [-1,1])k.box(.08,.45,.4,s*.8,.22,0,M.innDark,g);k.box(1.7,.1,.4,0,.54,0,M.snow,g);trunks.push([x,z,.7]);};
 const wood=(x,z,rot)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;B.add(g);for(let r=0;r<4;r++)for(let i=0;i<5-r%2;i++){const l=k.cylinder(.09,.09,1.1,(i-2)*.19+(r%2)*.09,.1+r*.17,0,M.innWood,6,g);l.rotation.x=Math.PI/2;}k.box(1.1,.12,1.2,0,.82,0,M.snow,g);trunks.push([x,z,.7]);};
 for(const s of [-1,1])for(const [zc] of plan){if(zc>34)continue;const fx=s*9.35,r=R();if(r<.33)barrel(fx,zc+2.6+R(),.95);else if(r<.66)bench(s*9.35,zc-2.4,s>0?Math.PI/2:-Math.PI/2);else wood(fx,zc+2.8,Math.PI/2);if(R()<.6)barrel(fx,zc-3.3,.8);mounds.push([s*9.6,0,zc+R()*3,.9,.35,1.6]);mounds.push([s*9.6,0,zc-3.6,.7,.28,1.2]);}
 // Clue: the inn register on a writing stand before the west inn.
 {const g=new THREE.Group();g.position.set(-9.25,0,21.4);B.add(g);k.box(.6,.9,.45,0,.45,0,M.innDark,g);k.box(.7,.06,.5,0,.92,0,M.innWood,g);const b=k.box(.42,.05,.3,0,.98,0,M.plaster,g);b.rotation.y=.2;k.box(.02,.06,.3,0,.99,0,M.innDark,g);trunks.push([-9.25,21.4,.45]);}
 // Clue: a blade rusted in a single night, planted in the snow.
 {const g=new THREE.Group();g.position.set(9.1,0,-6.2);g.rotation.z=-.18;B.add(g);k.box(.05,1.0,.12,0,.55,0,M.rust,g);k.box(.24,.04,.2,0,1.06,0,M.iron,g);k.cylinder(.03,.03,.32,0,1.24,0,M.innDark,6,g);mounds.push([9.1,0,-6.2,.7,.3,.7]);trunks.push([9.1,-6.2,.35]);}
 // Inn-square edge dressing (outside the battle rectangle): a stone basin, notice board, snow banks.
 {k.box(1.8,.7,1.0,-10.7,.35,-24.5,M.stone);k.box(1.6,.12,.8,-10.7,.66,-24.5,new THREE.MeshStandardMaterial({color:0x1b2f36,roughness:.1,emissive:0x101820}));const bb=k.cylinder(.04,.04,1.6,-10.7,1.2,-24.5,M.innWood,6);bb.rotation.z=Math.PI/2;trunks.push([-10.7,-24.5,1.1]);
  k.box(1.9,1.3,.12,10.75,1.5,-26,M.innWood);k.box(2.1,.12,.3,10.75,2.25,-26,M.snow);for(const s of [-1,1])k.box(.12,2.1,.12,10.75+s*.85,1.05,-26,M.innDark);k.box(.5,.7,.02,10.75-.4,1.5,-25.92,M.plaster);k.box(.4,.5,.02,10.75+.3,1.6,-25.92,M.plaster);trunks.push([10.75,-26,1.1]);
  for(let x=-10;x<=10;x+=2.5)mounds.push([x,0,-39.4,1.1,.35,.6]);for(let z=-36;z<-18;z+=3)for(const s of [-1,1])mounds.push([s*11.3,0,z,.6,.3,1.3]);}
 // Culvert where the hot river emerges beneath the square.
 {box(8.4,2.4,1.2,0,-1.0,-16.2,M.stone);const arc=new THREE.Mesh(new THREE.TorusGeometry(2.6,.45,8,24,Math.PI),M.stone);arc.position.set(0,-1.6,-15.6);k.batch.add(arc);box(5.1,1.2,.4,0,-1.85,-15.7,new THREE.MeshStandardMaterial({color:0x05080a,roughness:1}));
  box(8.4,.75,.4,0,.38,-16.1,M.stone);box(8.6,.14,.55,0,.82,-16.1,M.stone);box(8.4,.18,.45,0,.97,-16.1,M.snow);}
 // Square paving over dark grout.
 box(23.4,.1,24,0,-.06,-28,M.grout);box(4.8,.1,19,0,-.06,-49.5,M.grout);for(const s of [-1,1])box(5.6,.1,50,s*7.25,-.08,8.6,M.grout);
 for(let z=-16.4;z>-40;z-=1.02)for(let x=-11.6;x<11.6;x+=1.25){const w=Math.min(1.2,11.65-x);box(w,.12,.98,x+w/2,-.04,z-.5,M.paving);}
 for(let z=-40;z>-59;z-=.95)box(4.6,.12,.9,0,-.04,z-.45,M.paving);
 // Lit streetside lanterns strung across the river between inns.
 for(const zc of [33,15.1,-2.9]){const pts=[];for(let i=0;i<=12;i++){const x=-9.6+i*1.6;pts.push(new THREE.Vector3(x,5.6-1.0*Math.sin(i/12*Math.PI),zc));}k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.015,4,false),M.innDark);for(let i=1;i<12;i+=2){const p=pts[i];k.lantern(p.x,p.y-.45,p.z,.42);lanterns.push(new THREE.Vector3(p.x,p.y-.45,p.z));}}
 // South reach: snowy banks, cedars and a second arched bridge in the distance.
 for(const s of [-1,1]){for(let z=52;z<120;z+=8){mounds.push([s*(7+R()*4),0,z+R()*4,2+R()*2,.6+R()*.4,3+R()*2]);}const r=inn(k,M,{x:s*13,z:64,rot:-s*Math.PI/2,W:8,D:9,floors:2,parent:B,seed:seed++,lantern:false});}
 for(let i=0;i<=20;i++){const x=-5+i*.5;box(.52,.14,2.2,x,arch(x),78,M.innWood);if(i%2==0)box(.5,.08,2,x,arch(x)+.1,78,M.snow);}
 progress(.66,'Planting the snowbound cedars');
 // Conifers behind the inns and up the valley walls.
 const trees=[];for(let i=0;i<520;i++){const s=R()<.5?-1:1,x=s*(21.5+Math.pow(R(),1.5)*70),z=-130+R()*260;const y=groundHeight(x,z);if(y<-1)continue;trees.push([x,y,z,.8+R()*.9]);}
 for(let i=0;i<90;i++){const x=(R()-.5)*100,z=-62-R()*70;if(Math.abs(x)<4)continue;trees.push([x,groundHeight(x,z),z,.8+R()*.8]);}
 await snowTrees(root,trees,{M,near:(x,z)=>Math.abs(x)<48&&z>-95&&z<70});
 snowMounds(root,M,mounds);
 // Drifts banked against walls, kerbs and parapets; trodden slush down the walking lines.
 const drifts=[],edge=[],slush=[];
 for(const s of [-1,1]){for(let z=-16.2;z<33.4;z+=1.05+R()*.3){drifts.push([s*(9.5-R()*.1),0,z,.5+R()*.25,.2+R()*.14,.9+R()*.5]);if(!BRIDGES.some(b=>Math.abs(z-b)<1.5))drifts.push([s*4.72,.05,z,.32+R()*.12,.15+R()*.08,.8+R()*.4]);}
  for(let z=34;z<49.3;z+=1.1)drifts.push([s*9.5,0,z,.55+R()*.2,.22+R()*.12,1+R()*.4]);for(let z=-39.2;z<-17;z+=1.1)drifts.push([s*11.3,0,z,.55+R()*.2,.24+R()*.12,1+R()*.4]);
  for(let x=4.8;x<11.2;x+=1.1)drifts.push([s*x,0,-16.75,.9+R()*.3,.2+R()*.1,.45]);}
 for(let x=-4;x<=4;x+=1)drifts.push([x+R()*.3,0,33.9,.8,.18+R()*.08,.42]);for(let x=-9.4;x<=9.4;x+=1.1)drifts.push([x,0,49.35,.8,.2+R()*.1,.45]);
 for(let x=-1.7;x<=1.7;x+=1.1)for(const z of [-40.5,-52.4])drifts.push([x,0,z,.7,.15,.4]);for(let z=-52;z>-58.5;z-=1.1)for(const s of [-1,1])drifts.push([s*2.15,0,z,.35,.25,.8]);
 snowMounds(root,M,drifts);
 for(let i=0;i<220;i++){const zone=R();let x,z;if(zone<.5){const s=R()<.5?-1:1;x=s*(R()<.5?8.9+R()*.5:5.1+R()*.4);z=-16+R()*49;}else if(zone<.75){x=(R()<.5?-1:1)*(8.8+R()*.6);z=34+R()*15;}else{x=(R()<.5?-1:1)*(10.4+R()*.8);z=-17-R()*22;}edge.push([x,.035,z,.25+R()*.45,.3+R()*.7]);}
 snowPatches(root,M,edge);
 for(const s of [-1,1])for(let z=-16;z<33.5;z+=1.6+R()*.8)slush.push([s*(7.1+(R()-.5)*.8),.032,z,.7+R()*.5,1.4+R()*.8]);
 for(let z=34.5;z<49;z+=1.4)for(const x of [-5.5,0,5.5])slush.push([x+(R()-.5)*1.5,.032,z,.8+R()*.5,1.3+R()*.6]);
 for(let z=-17;z>-58;z-=1.5)slush.push([(R()-.5)*1.4,.032,z,.7+R()*.4,1.4+R()*.7]);for(let z=-18;z>-38;z-=1.7)for(const x of [-7,7])slush.push([x+(R()-.5)*2,.032,z,.8,1.3]);
 snowPatches(root,M,slush,{color:0x4c5560,opacity:.55,roughness:.35});
 // Water, steam, reflections, glows and snowfall are dynamic and stay outside the bake.
 const waterGeo=new THREE.PlaneGeometry(8,150,1,1);waterGeo.rotateX(-Math.PI/2);waterGeo.translate(0,-1.25,58);
 const foot=new THREE.PlaneGeometry(2.9,1.4);foot.rotateX(-Math.PI/2);foot.translate(-6.4,.5,41.5);const footWater=waterSurface(root,foot,{deep:0x1a2a2c,sky:0x5a6a80,tint:0x3a5a58,moonDir,opacity:1,warm:0x1a0e04});
 const water=waterSurface(root,waterGeo,{deep:0x07121a,sky:0x3c4c66,tint:0x24484e,moonDir,flow:.25,opacity:.96,warm:0x0e0a06});
 const streak=lampStreaks(root,[...streaks,[0,40,.8,14,0xffc88a],[1.2,27,.5,6,0xffa850],[-1.4,12,.5,6,0xffa850]],{y:-1.22});
 const steamPts=[];for(let z=-15;z<56;z+=1.4)steamPts.push([(R()-.5)*6.2,-1.15,z]);for(let i=0;i<10;i++)steamPts.push([(R()-.5)*3,-1.1,-14.8]);for(let i=0;i<14;i++)steamPts.push([-6.4+(R()-.5)*2.6,.55,41.5+(R()-.5)*1.2]);
 const steam=steamField(root,steamPts,{count:340,rise:7,life:10,size0:.9,size1:4.5,opacity:.2,color:0xdde5ee,wind:[.12,-.06],jitter:[1,1.4]});
 const vents=steamField(root,[[0,great.height+3,-46],[-12.5,8.6,-29.6],[15,10,10.6],[-15,8.8,1.6],[15,8.6,-20.6]],{count:60,rise:9,life:12,size0:1.4,size1:6,opacity:.13,color:0xcfd8e4,wind:[.4,.1],jitter:[2,2]});
 const glowItems=[...lampHeads.map(p=>[p.x,p.y,p.z,2.2,0xffb862]),...lanterns.map(p=>[p.x,p.y,p.z,1.5,0xff9d4a])];
 const glows=glowSprites(root,glowItems,{intensity:1.1,flicker:.06});
 const snow=precipitation(root,{count:5200,color:0xf0f4ff,size:.075,area:[64,30,64],speed:1.25,drift:1.3,opacity:.9,seed:61});
 // Warm practical lights; the moon supplies the cool key.
 for(const [x,y,z,i] of [[6,3.8,38,26],[-6.5,3.6,22,24],[6.5,3.6,4,24],[-6.5,3.6,-11,22],[0,5,-24,30],[0,2.7,-46,18],[1.75,3.4,-54,16]]){const l=new THREE.PointLight(0xffb06a,i,17,1.6);l.position.set(x,y,z);root.add(l);}
 k.finish();progress(.95,'Lighting the gas lamps');
 const inRect=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
 return {trunks,texturesLoaded:16,grassBlades:0,discoveries:clues['springs-bridges'],
  views:{arrival:{pos:[0,2.1,47],look:[0,6,-6],name:'The river street',sub:'Inns lean over the steaming water.'},bridge:{pos:[-2.2,2.7,10],look:[1,3,-16],name:'The middle footbridge',sub:'Steam rises past every lamp.'},square:{pos:[9,2.3,-18],look:[-3,6,-40],name:'The inn square',sub:'The open square before the Great Inn.'},great:{pos:[0,2.0,-19],look:[0,9,-42],name:'The Great Inn',sub:'Its ground floor is the gateway north.'}},
  canWalk(x,z){const ax=Math.abs(x);if(ax<9.6&&z>33.6&&z<49.4)return true;if(ax>4.5&&ax<9.6&&z>-16.6&&z<=33.7)return true;if(BRIDGES.some(b=>Math.abs(z-b)<1.0)&&ax<4.7&&z>-16)return true;if(inRect(x,z,-11.4,11.4,-39.7,-16.4))return true;if(ax<2.05&&z<=-39.6&&z>-58.6)return true;return false;},
  walkHeight(x,z){const ax=Math.abs(x);if(ax<4.7&&BRIDGES.some(b=>Math.abs(z-b)<1.05))return Math.max(0,arch(x));return 0;},
  locationAt(x,z){return z>33.5?'The bridge plaza':z>-16.4?'The river street':z>-39.6?'The inn square':'The Great Inn gateway';},
  update(t,dt,cam){k.windTime.value=t;sky.update(t,cam);snow.update(t,cam);water.update(t);footWater.update(t);streak.update(t);steam.update(t);vents.update(t);glows.update(t);},setEvening(){}};
}
