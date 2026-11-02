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

for(const s of [-1,1]){const o=box(25,.24,9.1,0,6.42,s*4.02,tile);o.rotation.x=s*.42;box(25,.22,.3,0,4.66,s*8.2,edge)}
beam([-12.6,8.4,0],[12.6,8.4,0],.18,tileEdge);

g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld))});const center=bounds.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y});return g;}
