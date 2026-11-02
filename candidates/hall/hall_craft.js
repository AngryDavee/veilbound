export default function(THREE){
const g=new THREE.Group();let seed=37;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const mat=(c,n,r=.85)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:r});m.name=n;return m};
const wood=mat(0x76553c,'timber'),edge=mat(0xa27c56,'timber'),dark=mat(0x42392c,'timber'),plaster=mat(0xd8c9a7,'plaster'),tile=mat(0x394d57,'tile'),tileEdge=mat(0x63767d,'tile'),stone=mat(0xa3a294,'stone'),moss=mat(0x6f7850,'foliage'),leaf=mat(0x456d50,'foliage'),leafLight=mat(0x729066,'foliage');
const mesh=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
const box=(w,h,d,x,y,z,m=wood)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
const cyl=(rt,rb,h,x,y,z,m=wood,n=10)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
const beam=(a,b,r,m=wood)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const o=cyl(r*.72,r,A.distanceTo(B),0,0,0,m,8);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return o};
const tube=(pts,r,m=wood)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(8,pts.length*3),r,5,false),m);
const profile=(pts,depth,m,x,y,z)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),m,x,y,z)};
box(22,.55,12,0,.275,0,stone);box(23,.22,13.2,0,.68,0,edge);
for(let x=-10.8;x<11;x+=.36)box(.34,.07,12.9,x,.825,0,wood);
for(let i=0;i<4;i++)box(5.8,.21,1.05,0,.105+i*.21,8.1-i*.47,stone);
for(const x of [-10.5,-7,-3.5,3.5,7,10.5])for(const z of [-5.5,5.5]){box(.38,4.1,.38,x,2.85,z,wood);box(.72,.15,.7,x,4.68,z,edge);box(.95,.17,.65,x,4.87,z,wood)}
for(const z of [-5.5,5.5]){box(22,.3,.35,0,4.6,z,wood);box(22,.22,.4,0,1.05,z,wood)}
for(const x of [-10.5,10.5]){box(.22,3.5,11,x,2.72,0,plaster);box(.4,.3,12,x,4.6,0,wood);for(let z=-5;z<=5;z+=1.1){box(.27,3.5,.07,x,2.7,z,wood)}box(.28,.12,11,x,1.5,0,edge);box(.28,.12,11,x,3.5,0,edge);}
box(21,3.5,.2,0,2.7,-5.5,plaster);for(let x=-10;x<=10;x+=1.0)box(.06,3.5,.24,x,2.7,-5.5,wood);for(let y=1.3;y<4.5;y+=.65)box(21,.055,.25,0,y,-5.5,wood);
for(const side of [-1,1]){box(5.8,3.5,.18,side*7.65,2.7,5.5,plaster);for(let x=5;x<10.5;x+=.55)box(.055,3.4,.25,side*x,2.75,5.5,wood);for(let y=1.3;y<4.5;y+=.65)box(5.8,.055,.25,side*7.65,y,5.5,wood);}
for(let x=-11;x<=11;x+=.8)for(const z of [-6.1,6.1])box(.12,.16,3.5,x,4.5,z,dark);

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

// A projecting curved entrance canopy, distinct from the main roof.
for(let ix=0;ix<26;ix++){const x=-3.8+ix*.3;const y=4.85+1.0*Math.exp(-x*x/3);box(.31,.14,2.6,x,y,6.35,tile);beam([x,y+.08,5.15],[x,y+.08,7.65],.04,tileEdge)}
tube(Array.from({length:27},(_,i)=>{let x=-3.9+i*.3;return [x,4.75+Math.exp(-x*x/3),7.7]}),.14,edge);
for(const x of [-9.8,9.8]){box(.18,.8,11.4,x,1.35,0,wood);for(let z=-5.2;z<5.3;z+=.75)box(.09,.8,.09,x,1.32,z,edge)}
// Interior training floor and alcove, kept open through the central front bay.
box(5.5,.035,3.4,0,.88,-1.3,mat(0xa69f70,'fabric'));box(2.8,.15,.6,0,.95,-4.6,dark);
box(.65,1.5,.07,0,2.9,-5.32,mat(0xcec4a6,'fabric'));for(let y=2.4;y<3.5;y+=.22)box(.22,.035,.08,0,y,-5.26,dark);

g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld))});const center=bounds.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y});return g;}
