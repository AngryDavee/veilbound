import * as THREE from 'three';
import { kit } from '../kit.js';
import { clues } from './story.js';
import { M, facing, keepMaterials, instance, roomProto, doorProto, stairProto, lanternProto, halos, fragments, ROOM } from './parts.js';
// The Inverted Corridors: a walkway through a rectangular tube whose walls, ceiling and
// floor are all lined with rooms facing inward — upright, upside down and sideways.
// A second tube crosses at the central chamber; a door on its west wall shows the
// sanctuary dojo, already folded into the Keep in miniature.
export async function create(root,renderer,progress){
 progress(.1,'Every direction is down');const k=await kit(root,7202);const m=await keepMaterials(k);const r=k.random;
 const {box,beam,cylinder}=k;
 const HW=12,TOP=14,BOT=-6,ROW=7.6,TIER=3.8,{W,D,H}=ROOM;
 const near=[],far=[],doorBase=[],doorPhase=[],glowPts=[];
 const put=(mat,dist)=>{(dist<70?near:far).push(mat);};
 const cross=z=>Math.abs(z)<12;
 // Long tube along Z.
 for(let z=-150;z<=150;z+=ROW){const d=Math.abs(z);
  for(const side of [-1,1]){if(side>0&&cross(z))continue;
   for(let y=BOT;y<TOP-2;y+=TIER){if(side<0&&cross(z)&&y<4)continue;const flip=r()<.3;const mat=facing(side*(HW+D/2),y+(flip?H:0),z,[-side,0,0],flip?Math.PI:0);put(mat,d);if(!flip&&d<40){for(const s of [-1,1]){doorBase.push({mat,side:s});doorPhase.push(r()*20);}}if(r()<.4)glowPts.push([side*(HW+1),y+2,z]);}}
  for(const x of [-ROW,0,ROW])for(const dz of [0,TIER]){const zz=z+dz-ROW/2;const fl=r()<.5;put(facing(x,TOP+D/2,zz+(fl?H:0),[0,-1,0],fl?Math.PI:0),d);const fl2=r()<.5;put(facing(x,BOT-D/2,fl2?zz:zz+H,[0,1,0],fl2?Math.PI:0),d);if(r()<.3)glowPts.push([x,TOP-1,zz]);}
 }
 // Crossing tube along +X from the chamber, lined the same way.
 for(let x=HW+ROW/2;x<=150;x+=ROW){for(const side of [-1,1])for(let y=BOT;y<TOP-2;y+=TIER){const flip=r()<.3;put(facing(x,y+(flip?H:0),side*(HW+D/2),[0,0,-side],flip?Math.PI:0),x);}
  for(const z of [-ROW,0,ROW])for(const dx of [0,TIER]){const xx=x+dx-ROW/2;put(facing(xx,TOP+D/2,z,[0,-1,0],Math.PI/2),x);put(facing(xx,BOT-D/2,z,[0,1,0],Math.PI/2),x);}}
 // Sideways staircases climbing the walls and ceiling toward rooms they never reach.
 const stairs=[];for(let i=0;i<34;i++){const z=-90+i*5.3+(r()-.5)*3;if(cross(z)&&i%2)continue;const side=i%2?1:-1;const wall=i%3;
  if(wall===0)stairs.push(M(side*(HW-.5),2+r()*7,z,0,side*Math.PI/2,side*Math.PI/2));else if(wall===1)stairs.push(M((r()-.5)*14,TOP-.4,z,Math.PI,r()*6.28,0));else stairs.push(M(side*(HW-.6),BOT+4+r()*6,z,Math.PI/2,0,side*Math.PI/2));}
 progress(.35,'Turning the rooms');
 instance(root,roomProto(k,m,{detail:true}),near);
 const bins=[[],[]];far.forEach(f=>bins[r()<.7?0:1].push(f));instance(root,roomProto(k,m,{detail:'lite',lit:'paper'}),bins[0]);instance(root,roomProto(k,m,{detail:'lite',lit:'paperRed'}),bins[1]);
 instance(root,stairProto(k,m,{n:16}),stairs);
 const doors=instance(root,doorProto(k,m,{w:1.8,h:2.62}),doorBase.map(d=>d.mat));
 const tmp=new THREE.Matrix4(),slide=new THREE.Matrix4();
 function placeDoors(t){for(let i=0;i<doorBase.length;i++){const d=doorBase[i];const open=THREE.MathUtils.smoothstep(Math.sin(t*.4+doorPhase[i]),.1,.7);slide.makeTranslation(d.side*(.92+open*1.75),.02,D/2+.06+(d.side>0?.06:0));tmp.multiplyMatrices(d.mat,slide);doors.set(i,tmp);}doors.commit();}
 placeDoors(0);doors.refreshBounds();
 progress(.55,'Laying the corridor');
 // --- The walkway: boards, railings, and a procession of lacquer frames. ---
 const walk=(z0,z1,w=6)=>{const L=Math.abs(z1-z0),zc=(z0+z1)/2;box(w,.3,L,0,-.15,zc,m.floor);box(w+.5,.7,L,0,-.65,zc,m.lacquerDark);for(let z=Math.min(z0,z1);z<Math.max(z0,z1);z+=.45)box(w,.012,.03,0,.006,z,m.black);};
 walk(10,52);walk(-10,-58);
 box(20.4,.3,20.4,0,-.15,0,m.floor);box(21,.8,21,0,-.7,0,m.lacquerDark);for(let x=-10;x<10;x+=.45)box(.03,.012,20.4,x,.006,0,m.black);
 for(const [z0,z1] of [[10,52],[-10,-58]])for(const s of [-1,1]){const L=Math.abs(z1-z0),zc=(z0+z1)/2;box(.09,.09,L,s*2.9,1.05,zc,m.lacquer);box(.05,.05,L,s*2.9,.55,zc,m.lacquer);}
 const frames=[];for(let z=-56;z<=50;z+=3.6){if(Math.abs(z)<11)continue;frames.push(M(0,0,z));}
 const frame=new THREE.Group();for(const s of [-1,1]){k.box(.24,3.4,.24,s*2.9,1.7,0,m.lacquer,frame);k.box(.32,.1,.32,s*2.9,3.42,0,m.brass,frame);k.box(.3,.16,.3,s*2.9,1.1,0,m.brass,frame);}k.box(6.6,.32,.3,0,3.25,0,m.lacquer,frame);k.box(7.2,.14,.42,0,3.5,0,m.black,frame);
 instance(root,frame,frames,{cast:true});
 // Lanterns that hang upward: cords tied to floor brackets, flames burning toward the floor.
 const up=[];for(let z=-54;z<=48;z+=3.6){if(Math.abs(z)<11)continue;for(const s of [-1,1]){const x=s*2.2,y=2.3+Math.sin(z)*.2;if(Math.abs(z-22)<1.9&&s>0)continue;up.push(M(x,y,z,Math.PI,0,0));glowPts.push([x,y,z]);}}
 instance(root,lanternProto(k,m,{r:.3,cord:2}),up);
 // The one lantern turned right-way up.
 k.lantern(2.2,2.2,22,.65);cylinder(.012,.012,1,2.2,2.95,22,m.black,4);box(.6,.08,.6,2.2,3.45,22,m.brass);
 for(let z=-54;z<=48;z+=3.6){if(Math.abs(z)<11)continue;for(const s of [-1,1])box(.2,.06,.2,s*2.2,.03,z,m.brass);}
 progress(.7,'Opening the crossing chamber');
 // --- Crossing chamber (future arena): pillars at the corners only, rails on the open edges. ---
 for(const x of [-10.4,10.4])for(const z of [-10.4,10.4]){box(.8,14,.8,x,7-6,z,m.lacquer);for(const y of [0,3.2,6.4,9.6])box(1,.2,1,x,y+.1,z,m.brass);}
 for(const s of [-1,1]){for(const a of [-1,1]){box(7,.09,.09,a*6.5,1.05,s*10.2,m.lacquer);for(let x=3.2;x<=10;x+=1.7)box(.09,1.05,.09,a*x,.52,s*10.2,m.lacquer);}}
 box(.09,.09,20,10.2,1.05,0,m.lacquer);for(let z=-10;z<=10;z+=1.7)box(.09,1.05,.09,10.2,.52,z,m.lacquer);
 // Brass compass inlay across the chamber floor.
 for(const rad of [6,8.6]){const ring=k.mesh(new THREE.TorusGeometry(rad,.04,6,96),m.brass,0,.03,0);ring.rotation.x=Math.PI/2;}for(let i=0;i<8;i++){const a=i*Math.PI/4;beam([Math.cos(a)*6,.035,Math.sin(a)*6],[Math.cos(a)*8.6,.035,Math.sin(a)*8.6],.025,m.brass);}
 const fc=document.createElement('canvas');fc.width=1024;fc.height=256;const f=fc.getContext('2d');const gr=f.createLinearGradient(0,0,1024,256);gr.addColorStop(0,'#b8893c');gr.addColorStop(.5,'#d9b25a');gr.addColorStop(1,'#a87a34');f.fillStyle=gr;f.fillRect(0,0,1024,256);
 for(let i=0;i<260;i++){f.fillStyle=`rgba(${120+Math.random()*60},${80+Math.random()*40},30,.08)`;f.fillRect(Math.floor(Math.random()*16)*64,Math.floor(Math.random()*4)*64,64,64);}
 f.fillStyle='rgba(250,236,190,.55)';for(const [x,y,w] of [[60,40,380],[520,70,420],[200,180,520],[760,200,240]]){f.beginPath();f.roundRect(x,y,w,26,13);f.fill();}
 f.strokeStyle='#2c2016';f.lineCap='round';const pine=(x,y,s)=>{f.lineWidth=14*s;f.beginPath();f.moveTo(x,256);f.bezierCurveTo(x+30*s,170,x-40*s,120,x+20*s,y);f.stroke();f.fillStyle='#253a2a';for(const [dx,dy,w] of [[-60,0,140],[40,30,160],[-20,60,120],[70,-30,110]]){f.beginPath();f.ellipse(x+dx*s,y+dy*s,w*s/2,16*s,0,0,6.3);f.fill();}};pine(300,70,1);pine(780,110,.8);
 const fusumaArt=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(fc),roughness:.5,metalness:.35});fusumaArt.map.colorSpace=THREE.SRGBColorSpace;
 // West wall: gilded fusuma with one door slid open onto a folded room.
 for(let z=-10;z<10;z+=1.8){if(Math.abs(z+8.1)<1.2)continue;{const p=k.mesh(new THREE.BoxGeometry(.06,3,1.76),fusumaArt,-10.25,1.6,z+.9);const u=p.geometry.attributes.uv,i0=(z+10)/1.8;for(let v=0;v<u.count;v++)u.setX(v,(i0+u.getX(v))/11);}box(.1,.08,1.8,-10.25,3.12,z+.9,m.black);}
 box(.3,.4,20.6,-10.3,3.3,0,m.lacquer);box(.4,.6,20.6,-10.4,3.8,0,m.black);for(let z=-10;z<=10;z+=1.8)box(.1,3.1,.1,-10.2,1.55,z,m.lacquerDark);
 // Painted cranes on the fusuma: simple gold strokes.
 // The folded room: the sanctuary dojo in miniature on a lacquer plinth.
 box(.2,3.2,.2,-10.3,1.6,-9,m.lacquer);box(.2,3.2,.2,-10.3,1.6,-7.2,m.lacquer);box(12,.3,10,-16.4,-.15,-8,m.tatami);box(12,.2,10,-16.4,4.2,-8,m.beam);for(const z of [-13,-3])box(12,4.2,.1,-16.4,2.1,z,m.paperDim);box(.1,4.2,10,-22.4,2.1,-8,m.paper);
 box(2.6,.9,2.2,-16,.45,-8,m.lacquer);box(2.8,.06,2.4,-16,.92,-8,m.brass);const dj=fragments.dojo(k,m);dj.scale.setScalar(.2);dj.position.set(-16,.95,-8);dj.rotation.y=Math.PI/2;k.batch.add(dj);
 const djl=new THREE.PointLight(0xffc890,25,10,2);djl.position.set(-15,3,-8);root.add(djl);
 // East: the crossing tube opens beyond a railing.
 progress(.82,'Carving the Keepers’ oath');
 // The Keepers' oath, carved into a beam over the walkway.
 const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#2a1610';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#d9b064';ctx.font='italic 38px Georgia';ctx.textAlign='center';ctx.fillText('We folded the Court to shelter the valley.',512,56);ctx.font='italic 30px Georgia';ctx.fillText('One of us folded the world to own it.',512,102);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 box(6.6,.9,.4,0,3.9,-46,m.lacquerDark);k.mesh(new THREE.PlaneGeometry(6,.75),new THREE.MeshStandardMaterial({map:tex,roughness:.6,metalness:.3,emissive:0x2a1408,emissiveIntensity:.6}),0,3.9,-45.79);
 // The ends of the walk: arrival behind, an open gate onward.
 for(const [z,dir] of [[52.2,1],[-58.2,-1]]){for(const s of [-1,1])box(.5,6,.5,s*3.4,3,z,m.lacquer);box(8,.5,.5,0,6,z,m.lacquer);box(8.6,.35,.7,0,6.4,z,m.black);for(const s of [-1,1])box(1.6,5,.06,s*2.6,2.6,z+dir*.2,m.fusuma);}
 for(const [x,y,z,col,i,d] of [[0,3,36,0xffa060,40,18],[0,3,20,0xffa060,40,18],[-5,4,0,0xff9050,60,20],[5,4,0,0xff9050,60,20],[0,3,-24,0xffa060,40,18],[0,3,-44,0xffb070,45,18],[30,4,0,0xff7a40,80,40]]){const l=new THREE.PointLight(col,i,d,2);l.position.set(x,y,z);root.add(l);}
 const drift=[];for(let i=0;i<130;i++){const inCross=i%3===0;const x=inCross?16+r()*120:(r()-.5)*20,z=inCross?(r()-.5)*20:(r()-.5)*220,y=BOT+2+r()*(TOP-BOT-4);if(Math.abs(x)<4&&y<5)continue;drift.push(M(x,y,z,r()<.5?Math.PI:0,r()*6,0,.9+r()*.6));glowPts.push([x,y,z]);}
 instance(root,lanternProto(k,m,{r:.34,cord:3}),drift);
 const haloMat=halos(root,glowPts,{size:2.6,opacity:.9,density:.011});
 const motes=k.particles(420,0xffb070,.05,[40,24,120]);
 k.finish();progress(.95,'The lanterns rise');
 const inRect=(x,z,cx,cz,w,d)=>Math.abs(x-cx)<=w/2&&Math.abs(z-cz)<=d/2;
 return {texturesLoaded:9,grassBlades:0,discoveries:clues['keep-corridors'],
  views:{corridor:{pos:[0,1.9,46],look:[0,3,0],name:'The inverted corridor',sub:'Rooms on the walls. Rooms overhead. Rooms underfoot.'},
   chamber:{pos:[8,2.2,8],look:[-6,4,-6],name:'The crossing chamber',sub:'The only room in the Keep that agrees on which way is down.'},
   folded:{pos:[-5.5,1.75,-8.1],look:[-16,1.2,-8],name:'A room from the valley',sub:'Your home, folded small.'},
   crossing:{pos:[9,2,0],look:[60,6,0],name:'The crossing tube',sub:'Another corridor, running sideways through the first.'}},
  canWalk(x,z){return inRect(x,z,0,31,5.4,42)||inRect(x,z,0,-34,5.4,48)||inRect(x,z,0,0,19.6,19.6);},
  walkHeight(){return 0;},
  locationAt(x,z){if(Math.abs(z)<10)return 'The crossing chamber';return z>0?'The inverted corridor':'The corridor of the oath';},
  update(t){k.windTime.value=t;motes(t);placeDoors(t);haloMat.uniforms.time.value=t;},setEvening(){}};
}
