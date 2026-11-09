import * as THREE from 'three';
import { canvasTexture, rng, colored, JP_FONT } from './citykit.js';
// Temple architecture for the Thunderbell Precinct: concave hip roofs with up-turned corners,
// bracket sets, a five-storey pagoda, a two-storey vermilion gate with a giant paper lantern,
// a bell tower, stone lanterns and an incense burner.

export function roofTileMaterial(){const t=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#343e48';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){const g=c.createLinearGradient(x,0,x+16,0);g.addColorStop(0,'#252c34');g.addColorStop(.5,'#6a7682');g.addColorStop(1,'#252c34');c.fillStyle=g;c.fillRect(x,0,16,h);}c.fillStyle='rgba(0,0,0,.45)';for(let y=0;y<h;y+=21)c.fillRect(0,y,w,3);const r=rng(5);for(let i=0;i<220;i++){c.fillStyle=`rgba(${r()<.5?0:120},${r()<.5?0:130},${r()<.5?0:110},${r()*.08})`;c.fillRect(r()*w,r()*h,4+r()*20,2+r()*8);}});
 return new THREE.MeshStandardMaterial({map:t,roughness:.55,metalness:.15,side:THREE.DoubleSide});}

// Hip roof: eave rectangle W×D at y=0, ridge of length R at height `rise`, concave sag, corner upturn.
export function hipRoof(W,D,rise,{R=0,sag=1.7,up=.9,thick=.35,mat,edgeMat,seg=14}={}){const g=new THREE.Group();const pos=[],uv=[],idx=[];
 const patch=(E0,E1,R0,R1,len)=>{const base=pos.length/3;for(let j=0;j<=seg;j++){const t=j/seg;for(let i=0;i<=seg;i++){const s=i/seg;const ex=E0[0]+(E1[0]-E0[0])*s,ez=E0[2]+(E1[2]-E0[2])*s,rx=R0[0]+(R1[0]-R0[0])*s,rz=R0[2]+(R1[2]-R0[2])*s;const x=ex+(rx-ex)*t,z=ez+(rz-ez)*t;const edge=Math.abs(s-.5)*2;const y=rise*Math.pow(t,sag)+up*Math.pow(edge,5)*(1-t)*(1-t);pos.push(x,y,z);uv.push(s*len/2,t*rise*1.6/2);}}
  for(let j=0;j<seg;j++)for(let i=0;i<seg;i++){const a=base+j*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1);}};
 const w=W/2,d=D/2,r=R/2;
 patch([-w,0,d],[w,0,d],[-r,0,0],[r,0,0],W);patch([w,0,-d],[-w,0,-d],[r,0,0],[-r,0,0],W);
 patch([w,0,d],[w,0,-d],[r,0,0],[r,0,0],D);patch([-w,0,-d],[-w,0,d],[-r,0,0],[-r,0,0],D);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;g.add(m);
 // Under-surface (soffit) slightly below, so the roof has thickness and dark eaves.
 const under=new THREE.Mesh(geo,edgeMat);under.position.y=-thick;under.castShadow=false;under.receiveShadow=true;g.add(under);
 // Ridge beam and hip ridges.
 const ridge=new THREE.Mesh(new THREE.BoxGeometry(Math.max(R,.3)+.4,.42,.5),edgeMat);ridge.position.y=rise+.1;g.add(ridge);
 for(const sx of [-1,1])for(const sz of [-1,1]){const pts=[];for(let j=0;j<=10;j++){const t=j/10;const x=sx*(w+(r-w)*t),z=sz*d*(1-t);pts.push(new THREE.Vector3(x,rise*Math.pow(t,sag)+up*(1-t)*(1-t)+.12,z));}const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.13,6),edgeMat);tube.castShadow=true;g.add(tube);}
 return g;}

// Repeating bracket layer under eaves (stacked blocks), as a ring around a rectangle.
export function brackets(T,mat,g,W,D,y,step=1.1){const {bx}=T;step*=1.15;for(const [len,axis] of [[W,'x'],[D,'z']])for(const s of [-1,1])for(let a=-len/2+.4;a<=len/2-.39;a+=step){const x=axis==='x'?a:s*W/2,z=axis==='x'?s*D/2:a;bx(.3,.22,.3,x,y,z,mat,g);bx(.5,.16,.5,x,y+.2,z,mat,g);bx(.3,.18,.7,x*(1+.12/Math.max(1,Math.abs(x)||1)),y+.38,z,mat,g);}}

export function giantLantern(text='雷鐘',{h=3.9,r=1.65}={}){const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(new THREE.Vector2(r*(.86+.14*Math.sin(t*Math.PI)),t*h));}
 const tex=canvasTexture(1024,512,(c,w,hh)=>{const g=c.createLinearGradient(0,0,0,hh);g.addColorStop(0,'#5a0c08');g.addColorStop(.12,'#b8241a');g.addColorStop(.5,'#e0402a');g.addColorStop(.88,'#b8241a');g.addColorStop(1,'#5a0c08');c.fillStyle=g;c.fillRect(0,0,w,hh);c.strokeStyle='rgba(60,8,4,.5)';c.lineWidth=3;for(let y=10;y<hh;y+=22){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}c.fillStyle='#160606';c.textAlign='center';c.textBaseline='middle';c.font=`900 190px ${JP_FONT}`;const ch=[...text];for(const cx of [w*.25,w*.75])ch.forEach((t,i)=>c.fillText(t,cx,hh*.5+(i-(ch.length-1)/2)*190));},{repeat:false});
 const g=new THREE.Group();const body=new THREE.Mesh(new THREE.LatheGeometry(pts,40),new THREE.MeshBasicMaterial({map:tex,color:0xd8b0a0,toneMapped:false}));body.rotation.y=-Math.PI/2;g.add(body);
 const wood=new THREE.MeshStandardMaterial({color:0x1a1210,roughness:.7});for(const y of [0,h]){const ring=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r*.9,.32,32),wood);ring.position.y=y;ring.castShadow=true;g.add(ring);const band=new THREE.Mesh(new THREE.TorusGeometry(r*.9,.05,6,40),new THREE.MeshStandardMaterial({color:0x9c7a45,metalness:.8,roughness:.35}));band.rotation.x=Math.PI/2;band.position.y=y+(y?-.17:.17);g.add(band);}
 return g;}

export function stoneLantern(T,M,x,z,{s=1,g}={}){const {cyl,bx,put}=T;const st=M.granite;cyl(.42*s,.5*s,.25*s,x,.12*s,z,st,6,g);cyl(.14*s,.18*s,1.0*s,x,.75*s,z,st,8,g);cyl(.36*s,.2*s,.22*s,x,1.35*s,z,st,6,g);const box=put(new THREE.CylinderGeometry(.27*s,.27*s,.45*s,6),M.lampGlass,x,1.7*s,z,g);box.castShadow=false;for(let i=0;i<6;i++){const a=i*Math.PI/3;bx(.07*s,.46*s,.07*s,x+Math.cos(a)*.27*s,1.7*s,z+Math.sin(a)*.27*s,st,g);}
 put(new THREE.ConeGeometry(.62*s,.42*s,6),st,x,2.12*s,z,g);put(new THREE.SphereGeometry(.12*s,8,6),st,x,2.4*s,z,g);return [x,1.7*s,z];}
