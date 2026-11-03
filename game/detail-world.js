import * as THREE from 'three';
import { bakeStatic } from './assetlib.js';
import { Water } from 'three/addons/objects/Water.js';

// One coherent wind field drives the canopy, grass, ferns and hanging cloth.
export const windTime = { value: 0 };
export function windMaterial(material, strength = .2, grass = false) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uWindTime = windTime;
    shader.vertexShader = `uniform float uWindTime;\n${grass ? 'attribute float bend;' : ''}\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec4 wp = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        wp = instanceMatrix * wp;
      #endif
      wp = modelMatrix * wp;
      float gust = sin(wp.x*.11 + wp.z*.08 + uWindTime*1.15) * .55 + sin(wp.z*.23-uWindTime*1.8)*.3 + .4;
      float flex = ${grass ? 'bend*bend' : '(.25+uv.y*.75)'};
      transformed.x += gust * flex * ${strength.toFixed(3)};
      transformed.z += sin(wp.x*.18+uWindTime*1.4)*flex*${(strength*.42).toFixed(3)};
      transformed.y += sin(wp.z*.3+uWindTime*2.2)*flex*${(strength*.12).toFixed(3)};
    `);
  };
  material.customProgramCacheKey = () => `cloudveil-wind-${strength}-${grass}`;
  return material;
}

export async function addDetailWorld(scene, renderer, textures, terrainHeight) {
  let seed=77261;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const loader=new THREE.TextureLoader(),tex={};
  for(const name of ['tatami','moss','plaster']){
    tex[name]={};await Promise.all(['basecolor','normal','roughness'].map(async role=>{
      const t=await loader.loadAsync(`./textures/${name}-${role}.png`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(role==='basecolor')t.colorSpace=THREE.SRGBColorSpace;tex[name][role]=t;
    }));
  }
  const scrollMap=await loader.loadAsync('./textures/pine-scroll.png');scrollMap.colorSpace=THREE.SRGBColorSpace;
  scene.traverse(o=>{if(!o.isMesh||!o.material||Array.isArray(o.material))return;const m=o.material;if(m.name==='plaster'){m.map=tex.plaster.basecolor;m.normalMap=tex.plaster.normal;m.normalScale=new THREE.Vector2(.15,.15);m.needsUpdate=true;}if(m.name==='tile'){m.map=textures.stone.basecolor.clone();m.map.repeat.set(12,6);m.roughness=.76;m.needsUpdate=true;}});
  function pbr(set,color=0xffffff,repeat=1,rough=.88){const maps=tex[set]||textures[set];const m=new THREE.MeshStandardMaterial({color,roughness:rough});for(const[role,key]of [['basecolor','map'],['normal','normalMap'],['roughness','roughnessMap']]){m[key]=maps[role].clone();m[key].repeat.set(repeat,repeat);}m.normalScale.set(.38,.38);return m;}
  const trailStone=pbr('stone',0xaeb4a5);
  const wood=pbr('cedar',0x9b8065,1,.65),darkWood=pbr('cedar',0x57483c,1,.76),stone=pbr('rock',0x85938b,1),wetStone=pbr('rock',0x526e65,1,.32),moss=pbr('moss',0xb8c3a2,1),matting=pbr('tatami',0xe5d6b1,2),plaster=pbr('plaster',0xffffff,3),bronze=new THREE.MeshStandardMaterial({color:0x6c6651,metalness:.65,roughness:.47}),linen=new THREE.MeshStandardMaterial({color:0xc9b591,roughness:1}),indigo=new THREE.MeshStandardMaterial({color:0x283c48,roughness:.95});
  // Generated roughness for straw/plaster was too glossy on inspection; retain their relief, use diffuse values.
  matting.roughnessMap=null;matting.roughness=.96;plaster.roughnessMap=null;plaster.roughness=.98;wetStone.roughnessMap=null;wetStone.roughness=.52;
  const riverCenter=z=>33.8+THREE.MathUtils.clamp((-z-8)/11,0,1)*4.8;
  const groups={interior:new THREE.Group(),garden:new THREE.Group(),banks:new THREE.Group(),cliff:new THREE.Group(),routes:new THREE.Group()};
  const mesh=(group,geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;};
  const box=(g,w,h,d,x,y,z,m=wood)=>mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cyl=(g,rt,rb,h,x,y,z,m=wood,n=12)=>mesh(g,new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
  function beam(g,a,b,r,m=wood){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),o=cyl(g,r,r,A.distanceTo(B),0,0,0,m,8);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());return o;}
  function rock(g,x,y,z,sx,sy,sz,m=stone){const geo=new THREE.IcosahedronGeometry(1,1),p=geo.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i);const f=1+.15*Math.sin(a*13+b*17+c*19);p.setXYZ(i,a*f,b*f,c*f);}geo.computeVertexNormals();const o=mesh(g,geo,m,x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rnd()*.2,rnd()*6.28,rnd()*.15);return o;}

  // Interior: individual tatami edges, framing, joinery, equipment and a tokonoma.
  const g=groups.interior;
  box(g,20.4,.08,10.4,0,4.64,-16,plaster);
  for(let x=-9.6;x<10;x+=1.2){box(g,.16,.25,10.8,x,4.47,-16,darkWood);for(const z of [-20.9,-11.1])box(g,.44,.16,.65,x,4.24,z,wood);}
  for(const z of [-20.7,-18.5,-16,-13.5,-11.2])box(g,20.7,.26,.23,0,4.17,z,darkWood);
  // Individual mats leave the approach to the story table unobstructed.
  for(let ix=0;ix<5;ix++)for(let iz=0;iz<3;iz++){
    const x=-4.1+ix*2.05,z=-17.9+iz*1.08;
    box(g,2.01,.075,1.04,x,.91,z,matting);
    for(const s of [-1,1])box(g,.045,.079,1.045,x+s*.98,.915,z,indigo);
  }
  // Raised rear alcove, paper scroll, bronze bowl and ikebana arrangement.
  box(g,4.5,.18,.9,0,.97,-20.65,darkWood);
  box(g,4.3,2.9,.07,0,2.55,-21.32,plaster);
  for(const x of [-2.22,2.22])box(g,.15,3.4,.2,x,2.67,-21.23,darkWood);
  box(g,4.6,.18,.45,0,4.25,-21.2,wood);
  box(g,1.28,2.5,.06,0,2.65,-21.18,linen);
  mesh(g,new THREE.PlaneGeometry(.98,1.9),new THREE.MeshStandardMaterial({map:scrollMap,roughness:1}),0,2.7,-21.14);
  for(const y of [1.4,3.9]){const o=cyl(g,.045,.045,1.45,0,y,-21.13,darkWood);o.rotation.z=Math.PI/2;}
  const vase=mesh(g,new THREE.LatheGeometry([new THREE.Vector2(.10,0),new THREE.Vector2(.21,.1),new THREE.Vector2(.25,.3),new THREE.Vector2(.13,.5),new THREE.Vector2(.1,.58)],20),new THREE.MeshStandardMaterial({color:0x536e6c,roughness:.3}),1.45,1.07,-20.6);
  for(let i=0;i<7;i++)beam(g,[1.45,1.48,-20.6],[1.45+(rnd()-.5)*.7,1.9+rnd()*.6,-20.6+(rnd()-.5)*.5],.012,darkWood);
  cyl(g,.18,.12,.12,-1.5,1.12,-20.6,bronze,24);
  // Low writing desk at the existing letter, with brush, inkstone and rolled scrolls.
  box(g,2,.09,.9,0,1.005,-19.1,darkWood);for(const x of [-.82,.82])for(const z of [-19.4,-18.8])box(g,.1,.18,.1,x,.88,z,wood);
  box(g,.28,.035,.19,.65,1.07,-19.1,new THREE.MeshStandardMaterial({color:0x252b2b,roughness:.4}));beam(g,[.35,1.08,-19.35],[.68,1.08,-19.44],.012,wood);
  for(let i=0;i<3;i++){const o=cyl(g,.055,.055,.46,-.65+i*.14,1.1,-19.25,linen);o.rotation.x=Math.PI/2;}
  // Weapon racks in both side bays: wooden practice swords and wrapped handles.
  for(const side of [-1,1]){
    const x=side*8.65;
    for(const z of [-19.8,-16.5]){box(g,.8,.13,.5,x,1,z,darkWood);box(g,.12,1.8,.12,x,1.85,z,darkWood);}
    for(const y of [1.45,2.2])box(g,.13,.12,3.55,x,y,-18.15,wood);
    for(let k=0;k<6;k++){
      const z=-19.5+k*.52;beam(g,[x-.1,1.1,z],[x+.12,2.65,z],.024,wood);
      for(let j=0;j<9;j++){const o=cyl(g,.031,.031,.012,x+.08,2.35+j*.025,z,linen,8);o.rotation.z=-.14;}
      cyl(g,.075,.075,.025,x+.06,2.25,z,darkWood);
    }
    // Folded cloth, sandals, shelves and a straw practice target.
    box(g,2,.12,.8,side*7,1.05,-20.7,darkWood);
    for(let i=0;i<4;i++)box(g,.62,.095,.45,side*7,1.16+i*.095,-20.7,i%2?linen:indigo);
    for(let i=0;i<3;i++){const o=mesh(g,new THREE.TorusGeometry(.27,.065,6,18),matting,side*8,1.62+i*.2,-12.8);o.rotation.x=Math.PI/2;}
    cyl(g,.10,.13,1.6,side*8,.86+1.0,-12.8,wood);
    box(g,.9,.15,.9,side*8,.98,-12.8,darkWood);
    beam(g,[side*8-.6,1.8,-12.8],[side*8+.6,1.8,-12.8],.065,wood);
    for(let i=0;i<4;i++)for(const s of [-1,1]){const o=mesh(g,new THREE.CapsuleGeometry(.08,.2,3,6),matting,side*5.7+i*.24,.97,-10.8+s*.16);o.rotation.x=Math.PI/2;}
    // Low meditation cushions against the side walls.
    for(let i=0;i<3;i++){box(g,.85,.13,.72,side*6.4,1,-12.5-i*1.2,indigo);box(g,.76,.025,.64,side*6.4,1.08,-12.5-i*1.2,linen);}
  }
  // Paper lanterns with real ribs, hanging wires and warm local illumination.
  const lanternGlow=new THREE.MeshStandardMaterial({color:0xf1d6a2,emissive:0xffbd66,emissiveIntensity:.45,roughness:.9});
  for(const x of [-6,0,6])for(const z of [-12.5,-18.5]){
    beam(g,[x,4.4,z],[x,3.8,z],.012,bronze);
    mesh(g,new THREE.SphereGeometry(.3,20,16),lanternGlow,x,3.5,z).scale.set(1,1.35,1);
    for(let j=0;j<9;j++){const y=-.34+j*.085,r=.3*Math.sqrt(Math.max(.04,1-(y/.42)**2));const o=mesh(g,new THREE.TorusGeometry(r,.009,4,20),wood,x,3.5+y,z);o.rotation.x=Math.PI/2;}
    cyl(g,.12,.12,.07,x,3.91,z,bronze);cyl(g,.12,.12,.07,x,3.09,z,bronze);
  }
  const interiorLights=[];for(const x of [-6,6]){const l=new THREE.PointLight(0xffce8e,34,11,2);l.position.set(x,3.4,-15.5);scene.add(l);interiorLights.push(l);}
  // Contact shading anchors furnishings without another full-scene geometry pass.
  function contact(x,z,w,d,opacity=.24){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:opacity}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float opacity;void main(){vec2 p=abs(vUv-.5)*2.;float a=(1.-smoothstep(.48,1.,p.x))*(1.-smoothstep(.48,1.,p.y));gl_FragColor=vec4(.07,.055,.035,a*opacity);}'});const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,.87,z);scene.add(o);}
  contact(0,-20.8,5.2,1.7,.34);contact(0,-19.1,2.7,1.5,.28);for(const s of [-1,1]){contact(s*8.6,-18.2,1.6,4.6,.28);contact(s*8,-12.8,1.5,1.5);for(let i=0;i<3;i++)contact(s*6.4,-12.5-i*1.2,1.1,.95,.22);contact(s*10,-16,1.2,10,.24);}
  // Hand-forged corner straps and pegs on the entrance posts.
  for(const x of [-10.5,-7,-3.5,3.5,7,10.5])for(const z of [-10.5,-21.5]){box(g,.39,.16,.39,x,1.18,z,bronze);for(const y of [1.18,4.05]){const peg=cyl(g,.024,.024,.06,x,y,z+.22,bronze,8);peg.rotation.x=Math.PI/2;}}
  // Bell pavilion floor, offering stand, suspended rope and bronze studs.
  const shrine=groups.routes;
  box(shrine,1.3,.12,.6,32,11.35,-47.2,darkWood);for(const x of [31.5,32.5])box(shrine,.12,.6,.4,x,11.05,-47.2,wood);
  cyl(shrine,.18,.12,.13,32,11.49,-47.2,bronze,20);
  const rope=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(32,15.4,-43.7),new THREE.Vector3(32.2,14,-43.5),new THREE.Vector3(32.1,12.8,-43.3),new THREE.Vector3(32.15,11.5,-43.3)]),24,.035,6,false),linen);shrine.add(rope);
  for(let i=0;i<8;i++)cyl(shrine,.055,.055,.015,32.15,11.5+i*.055,-43.3,darkWood,8);
  // Readable physical wayfinding at the branching trails.
  function sign(x,z,label,arrow){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#e4d8b8';ctx.fillRect(0,0,512,128);ctx.fillStyle='#35463b';ctx.font='26px Georgia';ctx.textAlign='center';ctx.fillText(label+'  '+arrow,256,74);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;box(groups.routes,.10,1.5,.10,x,.75,z,wood);box(groups.routes,2.3,.65,.12,x,1.6,z,darkWood);mesh(groups.routes,new THREE.PlaneGeometry(2.1,.52),new THREE.MeshStandardMaterial({map:t,roughness:1}),x,1.6,z+.065);}
  sign(21,17,'FALLING WATER','→');sign(26,-14,'UPPER BELL','↗');sign(-16,22,'RETURNING GARDEN','←');

  // One eroded cliff mass replaces the visibly stacked boulder tower.
  const cliffGeo=new THREE.BoxGeometry(28,28,12,70,70,3),cp=cliffGeo.attributes.position,cc=[],cliffColor=new THREE.Color();
  for(let i=0;i<cp.count;i++){const x=cp.getX(i)+43,t=(cp.getY(i)+14)/28,v=(cp.getZ(i)+6)/12;const top=5+23*Math.exp(-((x-35)*(x-35))/145)+Math.sin(x*.7)*.7;const y=t*top;const ridge=Math.sin(x*1.4+y*.25)*.35+Math.sin(y*2.1+x*.27)*.18;const front=-20.1+ridge+Math.sin(x*.4)*.5;cp.setXYZ(i,x,y-.2,front-(1-v)*12);cliffColor.setHex(v>.8&&Math.sin(x*.7+y*.14)>.65?0x7c8a70:0x9baba1);cc.push(cliffColor.r,cliffColor.g,cliffColor.b);}
  cliffGeo.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));cliffGeo.computeVertexNormals();const cliffMaterial=stone.clone();cliffMaterial.vertexColors=true;cliffMaterial.roughnessMap=null;cliffMaterial.roughness=.95;cliffMaterial.map=stone.map.clone();cliffMaterial.map.repeat.set(7,7);mesh(groups.cliff,cliffGeo,cliffMaterial,0,0,0);
  // River stones, wet margins, sediment, and an irregular waterline.
  for(let i=0;i<140;i++){
    const z=-16+rnd()*43,s=rnd()<.5?-1:1,x=riverCenter(z)+s*(3.5+Math.sin(z*.22)*.55)+rnd()*.6;
    rock(groups.banks,x,.04+rnd()*.13,z,.18+rnd()*.48,.15+rnd()*.32,.2+rnd()*.4,i%3?wetStone:moss);
  }
  for(let i=0;i<90;i++)rock(groups.banks,31+rnd()*6,-.08,-17+rnd()*43,.1+rnd()*.2,.06,.1+rnd()*.2,stone);
  // Moss creeps around rock roots, lantern plinths and the courtyard margins.
  for(let i=0;i<65;i++){
    const side=rnd()<.5?-1:1,x=side*(19.5+rnd()*8),z=-5+rnd()*38;
    rock(groups.garden,x,.025,z,.35+rnd()*.7,.035,.25+rnd()*.6,moss);
  }
  // Irregular stone stepping trail visibly branches toward water and the stair.
  for(let i=0;i<28;i++){
    const z=22-i*1.5,x=25.1+Math.sin(i*.23)*.4;
    const o=box(groups.routes,2.25+rnd()*.35,.07,1.25+rnd()*.2,x,.035,z,trailStone);o.rotation.y=(rnd()-.5)*.15;
  }
  // Bamboo fence, joint lashings, bridge-like stair rails, and trail markers.
  for(let i=0;i<37;i++){
    const z=25-i*1.1;beam(groups.routes,[28.6,0,z],[28.6,1.05+(i%3)*.05,z],.045,wood);
    if(i<36)for(const y of [.4,.86])beam(groups.routes,[28.6,y,z],[28.6,y,z-1.1],.03,wood);
  }
  for(const side of [-1,1])for(let i=0;i<12;i++)beam(groups.routes,[32+side*2.9,1+i*10.7/12,-16-i*2],[32+side*2.9,1+(i+1)*10.7/12,-18-i*2],.065,wood);
  // A garden tea bench and bamboo water basin beside the western trail.
  box(groups.garden,3,.13,.85,-23,.58,17,darkWood);for(const x of [-24,-22])box(groups.garden,.22,.6,.6,x,.3,17,wood);
  rock(groups.garden,-24,.35,10,.9,.45,.8,stone);
  mesh(groups.garden,new THREE.TorusGeometry(.58,.18,8,24),stone,-24,.65,10).rotation.x=Math.PI/2;
  mesh(groups.garden,new THREE.CircleGeometry(.57,28),new THREE.MeshPhysicalMaterial({color:0x63877a,metalness:.2,roughness:.12}),-24,.65,10).rotation.x=-Math.PI/2;
  beam(groups.garden,[-24.6,.1,9.8],[-24.6,1.4,9.8],.06,wood);beam(groups.garden,[-24.6,1.3,9.8],[-24,1.12,10],.05,wood);
  beam(groups.garden,[-15.2,1.6,9],[-16.1,1.25,8.4],.04,darkWood);beam(groups.garden,[-16.1,1.25,8.4],[-17.05,.98,8],.025,darkWood);
  for(const side of [-1,1]){const loop=mesh(groups.garden,new THREE.TorusGeometry(.10,.018,5,16),new THREE.MeshStandardMaterial({color:0x9c84ad,roughness:1}),-17+side*.085,.98,8.015);loop.scale.y=.6;loop.rotation.z=side*.4;}
  // Garden stones, a raked sand patch and a finite training circle.
  for(let i=0;i<16;i++){const ring=mesh(groups.garden,new THREE.TorusGeometry(1.3+i*.13,.009,3,64),new THREE.MeshStandardMaterial({color:0xb1a889,roughness:1}),-13,.015,18);ring.rotation.x=-Math.PI/2;ring.scale.set(1,.65,1);}
  for(let i=0;i<110;i++){const a=rnd()*6.28,r=5+rnd()*.12;rock(groups.garden,Math.cos(a)*r,.02,7+Math.sin(a)*r,.045,.025,.055,stone);}

  // Ferns have individually folded paired leaflets, not opaque leaf balls.
  const fernMat=windMaterial(new THREE.MeshStandardMaterial({color:0x78904d,roughness:1,side:THREE.DoubleSide,vertexColors:true}),.12);
  const fp=[],fc=[],fu=[],color=new THREE.Color();
  function tri(a,b,c,shade){fp.push(...a,...b,...c);color.setHex(shade);for(let k=0;k<3;k++)fc.push(color.r,color.g,color.b);fu.push(0,0,1,0,.5,1);}
  for(let n=0;n<155;n++){
    const side=rnd()<.5?-1:1,x=side*(21+rnd()*6),z=-5+rnd()*37;
    for(let f=0;f<7;f++){
      const a=f*6.28/7+rnd()*.5,len=.45+rnd()*.55,dx=Math.cos(a),dz=Math.sin(a);
      for(let j=1;j<10;j++){
        const t=j/10,h=Math.sin(t*2.3)*len*.7,px=x+dx*t*len,pz=z+dz*t*len,w=Math.sin(t*Math.PI)*.19;
        for(const sign of [-1,1])tri([px,.06+h,pz],[px-dx*.07+dz*w*sign,.08+h,pz-dz*.07-dx*w*sign],[px+dx*.10,.07+h,pz+dz*.10],j%2?0x94aa5b:0x607e3d);
      }
    }
  }
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(fu,2));fg.computeVertexNormals();const ferns=new THREE.Mesh(fg,fernMat);ferns.receiveShadow=true;scene.add(ferns);

  // Curved, tapered grass blades. Density comes from batched geometry, movement from GPU wind.
  const gp=[],gc=[],gu=[],gb=[],gn=[];
  const grassCount=matchMedia('(max-width:760px)').matches?24000:48000;
  for(let i=0;i<grassCount;i++){
    let x,z;if(i<grassCount*.77){const s=rnd()<.5?-1:1;x=s*(18.8+rnd()*9.5);z=-5+rnd()*39;}else{x=-29+rnd()*58;z=34+rnd()*11;}
    // Leave the east trail and west garden stepping stones clear.
    if(x>23.6&&x<26.7&&z<24)continue;
    if(x<-15&&z>7&&z<11)continue;
    const h=.16+Math.pow(rnd(),1.7)*.64,w=.018+rnd()*.024,a=rnd()*6.28,dx=Math.cos(a),dz=Math.sin(a),lean=.12+rnd()*.25;
    const shade=new THREE.Color().setHSL(.21+rnd()*.06,.27+rnd()*.18,.22+rnd()*.16);
    const row=t=>[x+Math.sin(a)*lean*t*t,.035+h*t,z+Math.cos(a)*lean*t*t];
    for(let j=0;j<4;j++){
      const t=j/4,u=(j+1)/4,A=row(t),B=row(u),wa=w*(1-t),wb=w*(1-u);
      const vertices=[[A[0]-dx*wa,A[1],A[2]-dz*wa],[A[0]+dx*wa,A[1],A[2]+dz*wa],[B[0]-dx*wb,B[1],B[2]-dz*wb],[A[0]+dx*wa,A[1],A[2]+dz*wa],[B[0]+dx*wb,B[1],B[2]+dz*wb],[B[0]-dx*wb,B[1],B[2]-dz*wb]];
      vertices.forEach((v,k)=>{gp.push(...v);const f=k===0||k===1||k===3?t:u;gb.push(f);gu.push(k%2,f);gn.push(0,1,0);const light=.55+f*.55;gc.push(shade.r*light,shade.g*light,shade.b*light);});
    }
  }
  const grassGeo=new THREE.BufferGeometry();for(const[n,a,size]of [['position',gp,3],['color',gc,3],['normal',gn,3],['uv',gu,2],['bend',gb,1]])grassGeo.setAttribute(n,new THREE.Float32BufferAttribute(a,size));
  const grassMat=windMaterial(new THREE.MeshStandardMaterial({color:0xdce4ba,roughness:1,side:THREE.DoubleSide,vertexColors:true}),.26,true);
  const grass=new THREE.Mesh(grassGeo,grassMat);grass.receiveShadow=true;grass.name='wind-grass';scene.add(grass);

  // Reeds and tiny seed heads vary the river bank's silhouette.
  const reedGroup=new THREE.Group();for(let i=0;i<125;i++){
    const x=29.6+rnd()*.8,z=-10+rnd()*34,h=.6+rnd()*.65;
    beam(reedGroup,[x,0,z],[x+.1,h,z+.08],.013,wood);const o=mesh(reedGroup,new THREE.CapsuleGeometry(.035,.17,3,5),linen,x+.1,h,z+.08);o.rotation.z=-.18;
  }scene.add(bakeStatic(reedGroup));
  groups.cliff.position.x=4.6;
  for(const [name,group]of Object.entries(groups)){const b=bakeStatic(group);b.name=`detail-${name}`;scene.add(b);}
  // Distant forest canopy: inexpensive geometry fills the mountain slopes at real scale.
  const distantMap=await loader.loadAsync('./textures/distant-pine.png');distantMap.colorSpace=THREE.SRGBColorSpace;distantMap.anisotropy=4;
  const forestProto=new THREE.Group(),forestMat=windMaterial(new THREE.MeshBasicMaterial({map:distantMap,color:0xc3cdae,alphaTest:.55,side:THREE.DoubleSide}),.18);
  const compileForest=forestMat.onBeforeCompile;forestMat.onBeforeCompile=shader=>{compileForest(shader);shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(min(sampledDiffuseColor.r,min(sampledDiffuseColor.g,sampledDiffuseColor.b))>.55)discard;');};
  for(let face=0;face<2;face++){const crown=new THREE.Mesh(new THREE.PlaneGeometry(13.4,10),forestMat);crown.position.y=4.5;crown.rotation.y=face*Math.PI/2;forestProto.add(crown);}
  const forestGeo=bakeStatic(forestProto).children[0].geometry,forestInstances=[];
  for(let i=0;i<7200;i++){const a=rnd()*6.28,r=100+rnd()*530,x=Math.cos(a)*r,z=Math.sin(a)*r-25,y=terrainHeight(x,z);if(y<2)continue;const slope=Math.abs(terrainHeight(x+3,z)-y)+Math.abs(terrainHeight(x,z+3)-y);if(slope>8)continue;forestInstances.push([x,y,z,.7+rnd()*.9,rnd()*6.28]);}
  const forest=new THREE.InstancedMesh(forestGeo,forestMat,forestInstances.length),dummy=new THREE.Object3D();forestInstances.forEach(([x,y,z,s,a],i)=>{dummy.position.set(x,y,z);dummy.scale.set(s,s,s);dummy.rotation.y=a;dummy.updateMatrix();forest.setMatrixAt(i,dummy.matrix);forest.setColorAt(i,new THREE.Color().setHSL(.24+rnd()*.08,.18+rnd()*.15,.60+rnd()*.20));});forest.name='mountain-forest';scene.add(forest);

  // Real reflected water follows an irregular bank, with a connected plunge pool.
  const shape=new THREE.Shape();const left=[],right=[];
  for(let z=-19;z<=28;z+=1){const half=3.0+Math.sin(z*.22)*.45+(z<-10?1.4*Math.sin((z+19)/9*Math.PI):0);left.push([riverCenter(z)-half,z]);right.push([riverCenter(z)+half,z]);}
  [...left,...right.reverse()].forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const normal=textures.rock.normal.clone();normal.wrapS=normal.wrapT=THREE.RepeatWrapping;
  const water=new Water(new THREE.ShapeGeometry(shape),{textureWidth:512,textureHeight:512,waterNormals:normal,sunDirection:new THREE.Vector3(-.5,.7,.4),sunColor:0xffe6bd,waterColor:0x244e44,distortionScale:1.6,fog:true,alpha:.9});water.rotation.x=-Math.PI/2;water.position.y=.12;water.name='reflective-river';water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.025;').replace('vec3( 1.5, 1.0, 1.5 )','vec3( .35, 1.0, .35 )').replace('100.0, 2.0, 0.5','100.0, .7, 0.5');water.material.uniforms.size.value=4;scene.add(water);
  const reflect=water.onBeforeRender;let reflectedAt=-100;const reflectedPosition=new THREE.Vector3(1e6,0,0),reflectedRotation=new THREE.Quaternion();water.onBeforeRender=function(r,s,c,...args){const now=performance.now();if(now-reflectedAt<80&&c.position.distanceToSquared(reflectedPosition)<.001&&1-Math.abs(c.quaternion.dot(reflectedRotation))<.00001)return;reflectedAt=now;reflectedPosition.copy(c.position);reflectedRotation.copy(c.quaternion);reflect.call(this,r,s,c,...args);};
  // Cascades overlap at different depths and break into ribbons near their feet.
  const fallUniforms={time:{value:0},evening:{value:0}};
  const fallMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:fallUniforms,
    vertexShader:`uniform float time;varying vec2 vUv;varying float vFoam;void main(){vUv=uv;vec3 p=position;float s=sin(uv.y*38.-time*4.+uv.x*15.);p.z+=s*.09+sin(uv.x*23.+time*2.)*.045;p.x*=.84+(1.-uv.y)*.28+sin(uv.y*9.)*.05;p.x+=sin(uv.y*17.+time*1.8)*.05;vFoam=s;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float time;uniform float evening;varying vec2 vUv;varying float vFoam;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
      void main(){vec2 uv=vUv;float streak=n(vec2(uv.x*54.,uv.y*8.+time*3.));float fine=n(vec2(uv.x*120.,uv.y*85.+time*19.));float churn=n(vec2(uv.x*13.,uv.y*37.+time*8.));float edge=smoothstep(0.,.1,uv.x)*smoothstep(0.,.1,1.-uv.x);float foam=smoothstep(.38,.82,streak*.6+fine*.4);float broken=smoothstep(.10,.32,churn+uv.y*.4);vec3 col=mix(vec3(.40,.58,.56),vec3(.91,.96,.90),.43+foam*.57);col*=mix(1.,.8,evening);gl_FragColor=vec4(col,edge*(.38+foam*.55)*broken);}`});
  for(let i=0;i<5;i++){
    const geo=new THREE.PlaneGeometry(i===0?4.5:1.5+rnd()*.6,25.5,12,80),fall=new THREE.Mesh(geo,fallMat);fall.position.set(38.8+(i-2)*.58,13.1,-18.45+i*.11);fall.rotation.y=(i-2)*.035;fall.name='waterfall-layer';scene.add(fall);
  }
  // Soft spray particles rise from the impact; separate ballistic droplets catch the light.
  function particles(count,mist){const positions=new Float32Array(count*3),seeds=[];for(let i=0;i<count;i++)seeds.push([rnd(),rnd(),rnd(),rnd()]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:mist?.075:.5}},vertexShader:`attribute float size;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(${mist?'180.':'6.'},${mist?'950.':'45.'}/-mv.z);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.85,.94,.89,pow(1.-r,${mist?'2.':'1.'})*opacity);}`});const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.name=mist?'waterfall-mist':'waterfall-droplets';scene.add(points);return {geo,seeds};}
  const spray=particles(180,true),drops=particles(320,false);
  const foamUniforms={time:fallUniforms.time};
  const foam=new THREE.Mesh(new THREE.PlaneGeometry(8.2,10),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:foamUniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;void main(){vec2 p=(vUv-.5)*vec2(1.,1.3);float r=length(p);float waves=sin(r*120.-time*4.+sin(atan(p.y,p.x)*15.)*.7)*.5+.5;float breakup=sin(p.x*97.+sin(p.y*77.+time))*sin(p.y*83.-time);float a=smoothstep(.6,.12,r)*(.16+pow(waves,8.)*.28)*smoothstep(-.3,.5,breakup);gl_FragColor=vec4(.87,.94,.86,a);}`}));foam.rotation.x=-Math.PI/2;foam.position.set(37.3,.14,-14.9);scene.add(foam);
  // Tiny airborne motes reveal interior light and bring still spaces to life.
  const dustPos=new Float32Array(120*3);for(let i=0;i<120;i++)dustPos.set([(rnd()-.5)*18,1+rnd()*3,-11-rnd()*9],i*3);
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffe7b2,size:.018,transparent:true,opacity:.36,depthWrite:false}));scene.add(dust);
  return {texturesLoaded:11,grassBlades:gb.length/24,update(t){
    windTime.value=t;fallUniforms.time.value=t;water.material.uniforms.time.value=t*.65;
    for(const[p,mist]of [[spray,true],[drops,false]]){const a=p.geo.attributes.position;p.seeds.forEach(([s,v,w,q],i)=>{const life=(t*(mist?.16:.5)+s)%1;if(mist)a.setXYZ(i,38.8+(v-.5)*(2+life*8)+life*.8, .3+life*2.7,-17+w*4+life*2);else{const angle=v*6.28,r=life*(1+w*3);a.setXYZ(i,38.8+Math.cos(angle)*r,.2+Math.sin(life*Math.PI)*(1+q*2.3),-17+Math.sin(angle)*r);}});a.needsUpdate=true;}
    dust.rotation.y=Math.sin(t*.03)*.002;
  },setEvening(value){fallUniforms.evening.value=value?1:0;for(const l of interiorLights)l.intensity=value?48:34;lanternGlow.emissiveIntensity=value?.85:.45;water.material.uniforms.sunColor.value.setHex(value?0xffc089:0xffe6bd);}};
}
