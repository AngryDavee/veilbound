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
// Continuous buttress flare: roots emerge from the trunk and disappear below the soil.
const trunkGeo=new THREE.BufferGeometry(),tp=[],tu=[],ti=[];const rings=36,sides=24;
for(let j=0;j<=rings;j++){const y=j/rings*10,t=y/10;for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;const buttress=Math.pow(Math.max(0,Math.cos(a*5+.4)),5)*.75*Math.exp(-y*3.8);const radius=(.38*(1-t)+.065)+.25*Math.exp(-y*3.5)+buttress;const bark=1+.035*Math.sin(a*17+y*2)+.02*Math.sin(a*31-y*4);tp.push(Math.sin(t*5)*.27+Math.cos(a)*radius*bark,y-.08,Math.sin(t*3)*.2+Math.sin(a)*radius*bark);tu.push(i/sides*3,y*.6);}}
for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;ti.push(a,b,a+1,b,b+1,a+1);}trunkGeo.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));trunkGeo.setAttribute('uv',new THREE.Float32BufferAttribute(tu,2));trunkGeo.setIndex(ti);trunkGeo.computeVertexNormals();const trunk=mesh(trunkGeo,dark);trunk.name='continuous-root-flare';

for(let i=0;i<15;i++){const a=i*2.4,y=3.4+i*.43,r=(3.8-i*.17)*(i%2?.8:1.1),x=Math.sin(a)*r,z=Math.cos(a)*r;const pts=[[.3,y-.9,0],[x*.5,y-.4,z*.55],[x,y,z]];tube(pts,.12-i*.004,dark);for(let k=0;k<8;k++){const ang=k*2.4,rad=.25+Math.sqrt(rnd())*1.0;const o=mesh(new THREE.IcosahedronGeometry(.8+rnd()*.42,1),k%4?leaf:leafLight,x+Math.cos(ang)*rad,y+.15+rnd()*.35,z+Math.sin(ang)*rad);o.scale.set(1.2,.35+rnd()*.18,.85);o.rotation.y=rnd()*6.28;}}
g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld))});const center=bounds.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y});return g;}
