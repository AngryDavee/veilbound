import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
// Reference: references/sanctuary-object-reference.png. Each arm constructs the
// silhouette differently; shared helpers only standardize materials and origin.
const prelude=`export default function(THREE){
const g=new THREE.Group();let seed=37;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const mat=(c,n,r=.85)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:r});m.name=n;return m};
const wood=mat(0x76553c,'timber'),edge=mat(0xa27c56,'timber'),dark=mat(0x42392c,'timber'),plaster=mat(0xd8c9a7,'plaster'),tile=mat(0x394d57,'tile'),tileEdge=mat(0x63767d,'tile'),stone=mat(0xa3a294,'stone'),moss=mat(0x6f7850,'foliage'),leaf=mat(0x456d50,'foliage'),leafLight=mat(0x729066,'foliage');
const mesh=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
const box=(w,h,d,x,y,z,m=wood)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
const cyl=(rt,rb,h,x,y,z,m=wood,n=10)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
const beam=(a,b,r,m=wood)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const o=cyl(r*.72,r,A.distanceTo(B),0,0,0,m,8);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return o};
const tube=(pts,r,m=wood)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(8,pts.length*3),r,5,false),m);
const profile=(pts,depth,m,x,y,z)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),m,x,y,z)};
`;
const finish=`
g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld))});const center=bounds.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y});return g;}
`;
const roofPrimitive=`
for(const s of [-1,1]){const o=box(25,.24,9.1,0,6.42,s*4.02,tile);o.rotation.x=s*.42;box(25,.22,.3,0,4.66,s*8.2,edge)}
beam([-12.6,8.4,0],[12.6,8.4,0],.18,tileEdge);
`;
const roofProfile=`
for(const sign of [-1,1]){const p=[[0,8.4],[1.5,7.5],[4,6.1],[6.5,5.1],[8.3,4.8],[8.7,5.0],[8.7,4.75],[6.5,4.85],[4,5.85],[1.5,7.25],[0,8.15]];const o=profile(p,25,tile,-12.5,0,0);o.rotation.y=sign*Math.PI/2;o.position.x=sign<0?12.5:-12.5;}
`;
const roofCraft=`
const roofY=t=>8.35-4.65*t+1.23*t*t*t;
for(const sign of [-1,1]){
 const nx=42,nz=18,positions=[],uv=[],indices=[];
 for(let iz=0;iz<=nz;iz++){let t=iz/nz;for(let ix=0;ix<=nx;ix++){const x=-12.5+25*ix/nx;positions.push(x,roofY(t)+.22*Math.pow(Math.abs(x)/12.5,8)*t,sign*t*8.5);uv.push(ix/nx,iz/nz)}}
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){let a=z*(nx+1)+x,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const rm=tile.clone();rm.side=THREE.DoubleSide;mesh(geo,rm);
 for(let x=-12.5;x<=12.6;x+=.48){const pts=[];for(let j=0;j<=8;j++){let t=j/8;pts.push([x,roofY(t)+.065+.22*Math.pow(Math.abs(x)/12.5,8)*t,sign*8.5*t])}tube(pts,.055,tileEdge);cyl(.075,.075,.18,x,roofY(1)+.03,sign*8.55,tileEdge,8).rotation.x=Math.PI/2;}
 for(let j=1;j<17;j++){const t=j/18;beam([-12.5,roofY(t)+.015,sign*t*8.5],[12.5,roofY(t)+.015,sign*t*8.5],.022,dark)}
 const pts=[];for(let i=0;i<=14;i++){const x=-12.6+25.2*i/14;pts.push([x,roofY(1)-.12+.22*Math.pow(Math.abs(x)/12.5,8),sign*8.55])}tube(pts,.14,edge);
}
beam([-12.8,8.46,0],[12.8,8.46,0],.15,tileEdge);
for(const x of [-12.5,12.5]){tube([[x,5.05,-8.55],[x,5.8,-5],[x,8.35,0],[x,5.8,5],[x,5.05,8.55]],.16,edge);for(let z=-6;z<=6;z+=1.2)beam([x,4.65,z],[x,roofY(Math.abs(z)/8.5)-.3,z],.06,wood)}
`;
function hall(arm){
 let s=`box(22,.55,12,0,.275,0,stone);box(23,.22,13.2,0,.68,0,edge);
for(let x=-10.8;x<11;x+=.36)box(.34,.07,12.9,x,.825,0,wood);
for(let i=0;i<4;i++)box(5.8,.21,1.05,0,.105+i*.21,8.1-i*.47,stone);
for(const x of [-10.5,-7,-3.5,3.5,7,10.5])for(const z of [-5.5,5.5]){box(.38,4.1,.38,x,2.85,z,wood);box(.72,.15,.7,x,4.68,z,edge);box(.95,.17,.65,x,4.87,z,wood)}
for(const z of [-5.5,5.5]){box(22,.3,.35,0,4.6,z,wood);box(22,.22,.4,0,1.05,z,wood)}
for(const x of [-10.5,10.5]){box(.22,3.5,11,x,2.72,0,plaster);box(.4,.3,12,x,4.6,0,wood);for(let z=-5;z<=5;z+=1.1){box(.27,3.5,.07,x,2.7,z,wood)}box(.28,.12,11,x,1.5,0,edge);box(.28,.12,11,x,3.5,0,edge);}
box(21,3.5,.2,0,2.7,-5.5,plaster);for(let x=-10;x<=10;x+=1.0)box(.06,3.5,.24,x,2.7,-5.5,wood);for(let y=1.3;y<4.5;y+=.65)box(21,.055,.25,0,y,-5.5,wood);
for(const side of [-1,1]){box(5.8,3.5,.18,side*7.65,2.7,5.5,plaster);for(let x=5;x<10.5;x+=.55)box(.055,3.4,.25,side*x,2.75,5.5,wood);for(let y=1.3;y<4.5;y+=.65)box(5.8,.055,.25,side*7.65,y,5.5,wood);}
for(let x=-11;x<=11;x+=.8)for(const z of [-6.1,6.1])box(.12,.16,3.5,x,4.5,z,dark);
`;
 if(arm===0) s+=roofPrimitive;
 if(arm===1) s+=roofProfile+`for(let x=-12;x<=12;x+=.5)for(const sign of [-1,1])tube([[x,8.42,0],[x,7.5,sign*1.5],[x,6.1,sign*4],[x,5.1,sign*6.5],[x,5.02,sign*8.7]],.055,tileEdge);`;
 if(arm===2) s+=roofCraft+`
// A projecting curved entrance canopy, distinct from the main roof.
for(let ix=0;ix<26;ix++){const x=-3.8+ix*.3;const y=4.85+1.0*Math.exp(-x*x/3);box(.31,.14,2.6,x,y,6.35,tile);beam([x,y+.08,5.15],[x,y+.08,7.65],.04,tileEdge)}
tube(Array.from({length:27},(_,i)=>{let x=-3.9+i*.3;return [x,4.75+Math.exp(-x*x/3),7.7]}),.14,edge);
for(const x of [-9.8,9.8]){box(.18,.8,11.4,x,1.35,0,wood);for(let z=-5.2;z<5.3;z+=.75)box(.09,.8,.09,x,1.32,z,edge)}
// Interior training floor and alcove, kept open through the central front bay.
box(5.5,.035,3.4,0,.88,-1.3,mat(0xa69f70,'fabric'));box(2.8,.15,.6,0,.95,-4.6,dark);
box(.65,1.5,.07,0,2.9,-5.32,mat(0xcec4a6,'fabric'));for(let y=2.4;y<3.5;y+=.22)box(.22,.035,.08,0,y,-5.26,dark);
`;
 return s;
}
function gate(arm){let s=`for(const x of [-3,3]){box(.8,.22,.85,x,.11,0,stone);box(.43,3.8,.45,x,2.1,0,wood);box(.6,.23,.7,x,3.8,0,edge)}box(7,.4,.55,0,3.8,0,wood);box(6.5,.16,.5,0,3.2,0,wood);`;
 if(arm===0)s+=`for(const sign of [-1,1]){const r=box(8,.22,2.2,0,4.48,sign*.85,tile);r.rotation.x=sign*.42;}`;
 if(arm===1)s+=`const p=[[-2,4],[-1,4.25],[0,5.2],[1,4.25],[2,4],[2,3.8],[1,4.05],[0,4.95],[-1,4.05],[-2,3.8]];const r=profile(p,8,tile,4,0,0);r.rotation.y=-Math.PI/2;for(let x=-3.8;x<=3.8;x+=.4)tube([[x,4.08,-2],[x,4.35,-1],[x,5.27,0],[x,4.35,1],[x,4.08,2]],.055,tileEdge);`;
 if(arm===2)s+=`for(const sign of [-1,1]){for(let j=0;j<9;j++){let t=j/9;const z=sign*(t*1.9+.1),y=5.25-1.45*t+.35*t*t*t;box(8,.16,.29,0,y,z,tile);for(let x=-3.9;x<=3.9;x+=.39){const o=cyl(.06,.06,.31,x,y+.07,z,tileEdge,6);o.rotation.x=Math.PI/2}}beam([-4,4.2,sign*2],[4,4.2,sign*2],.12,edge)}for(let x=-3.5;x<3.6;x+=.65)box(.12,.13,3.7,x,3.93,0,dark);beam([-4.1,5.37,0],[4.1,5.37,0],.13,tileEdge);`;
 s+=`for(const side of [-1,1]){box(.16,2.7,1.55,side*3.22,1.65,.8,wood);for(let z=.1;z<=1.5;z+=.21)box(.2,2.65,.045,side*3.22,1.65,z,edge);box(.22,.16,1.6,side*3.22,.52,.8,dark);box(.22,.16,1.6,side*3.22,2.8,.8,dark)}box(1.7,.52,.13,0,3.51,.35,dark);box(1.5,.35,.14,0,3.51,.36,edge);`;
 return s;
}
function lantern(arm){let s=`box(.7,.18,.7,0,.09,0,stone);box(.53,.12,.53,0,.24,0,stone);`;
 if(arm===0)s+=`cyl(.15,.24,.7,0,.65,0,stone,6);box(.58,.14,.58,0,1.04,0,stone);`;
 if(arm===1)s+=`mesh(new THREE.LatheGeometry([[.24,.3],[.18,.42],[.105,.73],[.15,.94],[.28,1.01],[.3,1.09]].map(p=>new THREE.Vector2(...p)),12),stone);`;
 if(arm===2)s+=`for(let i=0;i<7;i++){let y=.34+i*.1;box(.26+Math.abs(y-.65)*.6,.11,.26+Math.abs(y-.65)*.6,0,y,0,stone)}box(.57,.12,.57,0,1.06,0,stone);`;
 s+=`for(const x of [-.19,.19])for(const z of [-.19,.19])box(.09,.34,.09,x,1.28,z,stone);const glow=mat(0xffe4a1,'fabric');glow.emissive.setHex(0xebae54);glow.emissiveIntensity=.5;box(.18,.22,.18,0,1.27,0,glow);box(.5,.07,.5,0,1.48,0,stone);`;
 if(arm===0)s+=`cyl(.06,.54,.23,0,1.63,0,stone,4).rotation.y=Math.PI/4;`;
 else s+=`const p=[[-.49,1.54],[-.28,1.59],[0,1.79],[.28,1.59],[.49,1.54],[.49,1.48],[.28,1.51],[0,1.69],[-.28,1.51],[-.49,1.48]];profile(p,.72,stone,0,0,-.36);`;
 s+=`cyl(.055,.12,.15,0,1.83,0,stone,8);mesh(new THREE.SphereGeometry(.085,8,5),stone,0,1.94,0);for(let i=0;i<6;i++){const o=mesh(new THREE.IcosahedronGeometry(.13,0),moss,(rnd()-.5)*.5,.18,(rnd()-.5)*.5);o.scale.y=.15;}`;
 return s;
}
function pine(arm){let s='';
 if(arm===0){s+=`beam([0,0,0],[.7,9.6,.3],.45,dark);for(let i=0;i<7;i++){const a=i*2.4,y=3+i*.9,x=Math.sin(a)*(3-i*.25),z=Math.cos(a)*(3-i*.25);beam([.3,y-1,0],[x,y,z],.18,dark);const o=mesh(new THREE.ConeGeometry(2.5-i*.15,1.6,9),leaf,x,y+.3,z);o.scale.z=.7;}`;}
 if(arm===1){s+=`tube([[0,0,0],[-.5,2,.1],[.25,4,.2],[-.2,6,0],[.8,9.4,-.3]],.27,dark);for(let i=0;i<12;i++){let a=i*2.399,y=3.2+i*.49,r=3.2-(i/12)*1.8,x=Math.cos(a)*r,z=Math.sin(a)*r;beam([0,y-.8,0],[x,y,z],.15,dark);let p=[[0,0],[.4,.5],[1.2,.7],[2,.35],[2.4,.15],[2.1,0]].map(v=>new THREE.Vector2(...v));mesh(new THREE.LatheGeometry(p,12),i%3?leaf:leafLight,x,y,z);}`;}
 if(arm===2){s+=`tube([[0,0,0],[-.35,1.9,.2],[.45,3.6,0],[.25,5.2,-.4],[1.0,7.3,-.2],[.8,10,0]],.35,dark);for(let i=0;i<6;i++){let a=i*Math.PI/3;beam([0,.5,0],[Math.cos(a)*1.0,.03,Math.sin(a)*1.0],.17,dark)}
for(let i=0;i<15;i++){const a=i*2.4,y=3.4+i*.43,r=(3.8-i*.17)*(i%2?.8:1.1),x=Math.sin(a)*r,z=Math.cos(a)*r;const pts=[[.3,y-.9,0],[x*.5,y-.4,z*.55],[x,y,z]];tube(pts,.12-i*.004,dark);for(let k=0;k<8;k++){const ang=k*2.4,rad=.25+Math.sqrt(rnd())*1.0;const o=mesh(new THREE.IcosahedronGeometry(.8+rnd()*.42,1),k%4?leaf:leafLight,x+Math.cos(ang)*rad,y+.15+rnd()*.35,z+Math.sin(ang)*rad);o.scale.set(1.2,.35+rnd()*.18,.85);o.rotation.y=rnd()*6.28;}}`;
 }
 return s;
}
function rock(arm){let s='';for(let i=0;i<5;i++){const x=[0,-1.1,1.2,-.7,1][i],z=[0,.4,.3,-.7,-.9][i],r=[1.6,.8,.95,.7,.6][i];
 if(arm===0)s+=`{const o=mesh(new THREE.DodecahedronGeometry(${r},0),stone,${x},${r*.5},${z});o.scale.set(1,.8,.8);o.rotation.set(.17,.72,0);}`;
 if(arm===1)s+=`{const o=mesh(new THREE.LatheGeometry([[0,0],[${r*.9},0],[${r},${r*.6}],[${r*.65},${r*1.5}],[0,${r*1.6}]].map(p=>new THREE.Vector2(...p)),7),stone,${x},0,${z});o.rotation.y=${i};}`;
 if(arm===2)s+=`{const geo=new THREE.SphereGeometry(${r},9,6);const p=geo.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),q=1+.12*Math.sin(x*4+y*3+z*5);p.setXYZ(j,x*q,Math.max(-${r*.48},y*q*.85),z*q*.8)}geo.computeVertexNormals();const o=mesh(geo,stone,${x},${r*.48},${z});o.rotation.y=${i*.7};const cap=mesh(new THREE.SphereGeometry(${r*.72},8,4),moss,${x-.1},${r*1.1},${z});cap.scale.set(1,.2,.7);}`;
 }return s;}
function bell(arm){let s=`for(const x of [-1.65,1.65])for(const z of [-1.45,1.45]){box(.62,.22,.65,x,.11,z,stone);box(.3,3.4,.32,x,1.9,z,wood)}for(const z of [-1.45,1.45])box(3.9,.24,.3,0,3.4,z,edge);for(const x of [-1.65,1.65])box(.3,.24,3.6,x,3.4,0,wood);`;
 if(arm===0)s+=`for(const sign of [-1,1]){const o=box(5,.22,2.7,0,4.05,sign*1.05,tile);o.rotation.x=sign*.4;}`;
 if(arm===1)s+=`const o=profile([[-2.4,3.5],[0,4.9],[2.4,3.5],[2.4,3.3],[0,4.65],[-2.4,3.3]],5,tile,2.5,0,0);o.rotation.y=-Math.PI/2;`;
 if(arm===2)s+=`for(const sign of [-1,1])for(let j=0;j<10;j++){const t=j/10;box(5.2,.18,.3,0,4.9-1.7*t+.4*t*t*t,sign*t*2.4,tile);for(let x=-2.5;x<=2.5;x+=.4){const o=cyl(.055,.055,.32,x,4.98-1.7*t+.4*t*t*t,sign*t*2.4,tileEdge,6);o.rotation.x=Math.PI/2}}beam([-2.7,5,0],[2.7,5,0],.13,tileEdge);`;
 s+=`const bronze=mat(0x4c7467,'metal',.58);bronze.metalness=.45;mesh(new THREE.LatheGeometry([[.5,0],[.54,.06],[.45,.14],[.43,.85],[.35,1.05],[.12,1.14]].map(p=>new THREE.Vector2(...p)),18),bronze,0,1.8,0);beam([0,2.9,0],[0,3.6,0],.06,dark);for(let y=1.95;y<2.8;y+=.26){const o=mesh(new THREE.TorusGeometry(.44,.02,4,18),bronze,0,y,0);o.rotation.x=Math.PI/2}beam([-1.1,2.1,.9],[1.1,2.1,.9],.12,wood);beam([-.8,2.1,.9],[-.8,3.4,.9],.025,edge);beam([.8,2.1,.9],[.8,3.4,.9],.025,edge);`;
 return s;
}
for(const [name,fn] of Object.entries({hall,gate,lantern,pine,rock,bell})){
 const dir=path.join(root,'candidates',name);fs.mkdirSync(dir,{recursive:true});
 for(let arm=0;arm<3;arm++)fs.writeFileSync(path.join(dir,`${name}_${['primitive','profile','craft'][arm]}.js`),prelude+fn(arm)+finish);
}
console.log('18 independent construction candidates written. Verify and visually select before copying into game/assets.');
