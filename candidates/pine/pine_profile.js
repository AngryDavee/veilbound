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
tube([[0,0,0],[-.5,2,.1],[.25,4,.2],[-.2,6,0],[.8,9.4,-.3]],.27,dark);for(let i=0;i<12;i++){let a=i*2.399,y=3.2+i*.49,r=3.2-(i/12)*1.8,x=Math.cos(a)*r,z=Math.sin(a)*r;beam([0,y-.8,0],[x,y,z],.15,dark);let p=[[0,0],[.4,.5],[1.2,.7],[2,.35],[2.4,.15],[2.1,0]].map(v=>new THREE.Vector2(...v));mesh(new THREE.LatheGeometry(p,12),i%3?leaf:leafLight,x,y,z);}
g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld))});const center=bounds.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y});return g;}
