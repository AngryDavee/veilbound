import * as THREE from 'three';
// Shared sky pieces for regions that do not use the daylight Sky shader.
// nightSky(): gradient dome, procedural star field, moon disc with halo, optional drifting cloud bands.
// The dome follows the camera so it never clips; call update(t,camera) every frame.
export function nightSky(root,{top=0x060a18,horizon=0x24304a,glow=0x3a3a52,moonDir=[-.4,.45,-.8],moonColor=0xf2ecd8,moonSize=60,stars=2200,starBrightness=1,clouds=.35,cloudColor=0x1c2236,seed=7}={}){
 let s=seed;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
 const group=new THREE.Group();group.name='night-sky';root.add(group);
 const dir=new THREE.Vector3(...moonDir).normalize();
 const dome=new THREE.Mesh(new THREE.SphereGeometry(1200,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(top)},horizon:{value:new THREE.Color(horizon)},glow:{value:new THREE.Color(glow)},moon:{value:dir},clouds:{value:clouds},cloudColor:{value:new THREE.Color(cloudColor)},time:{value:0}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:`uniform vec3 top,horizon,glow,moon,cloudColor;uniform float clouds,time;varying vec3 vDir;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
  void main(){vec3 d=normalize(vDir);float y=max(d.y,0.);vec3 c=mix(horizon,top,pow(y,.55));
   float m=max(dot(d,moon),0.);c+=glow*pow(m,24.)*1.4+glow*pow(m,4.)*.25;
   vec2 uv=d.xz/(d.y+.25)*1.6+vec2(time*.004,0.);float cl=smoothstep(.45,.85,fbm(uv))*clouds*smoothstep(0.,.25,d.y);
   c=mix(c,cloudColor+glow*pow(m,6.)*.6,cl);if(d.y<0.)c=mix(horizon,horizon*.6,min(1.,-d.y*4.));gl_FragColor=vec4(c,1.);}`}));
 dome.frustumCulled=false;dome.renderOrder=-10;group.add(dome);
 // Stars: a single Points cloud on the upper hemisphere, twinkling in the shader.
 const sp=new Float32Array(stars*3),ss=new Float32Array(stars);for(let i=0;i<stars;i++){const u=rnd(),v=Math.pow(rnd(),.7),th=u*Math.PI*2,y=.06+v*.94,r=Math.sqrt(1-y*y);sp.set([Math.cos(th)*r*1100,y*1100,Math.sin(th)*r*1100],i*3);ss[i]=.4+Math.pow(rnd(),6)*2.4;}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('size',new THREE.BufferAttribute(ss,1));
 const starMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},bright:{value:starBrightness}},
  vertexShader:'attribute float size;uniform float time;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_Position.z=gl_Position.w*.9999;float tw=.7+.3*sin(time*2.+position.x*.13+position.z*.07);vA=tw;gl_PointSize=size*1.6;}',
  fragmentShader:'uniform float bright;varying float vA;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vec3(.9,.93,1.)*a*vA*bright,a*vA);}'});
 const starPts=new THREE.Points(sg,starMat);starPts.frustumCulled=false;starPts.renderOrder=-9;group.add(starPts);
 // Moon: a softly cratered disc and a large additive halo.
 const moonMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{color:{value:new THREE.Color(moonColor)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.9998;}',
  fragmentShader:`uniform vec3 color;varying vec2 v;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){vec2 p=v*2.-1.;float r=length(p);float disc=smoothstep(.5,.48,r);float halo=pow(max(0.,1.-r),3.)*.35;float mare=n(p*3.)*.5+n(p*7.)*.25;vec3 c=color*(1.-mare*.28)*disc+color*halo;gl_FragColor=vec4(c,max(disc,halo));}`});
 const moon=new THREE.Mesh(new THREE.PlaneGeometry(moonSize*2,moonSize*2),moonMat);moon.position.copy(dir).multiplyScalar(1000);moon.lookAt(0,0,0);moon.frustumCulled=false;moon.renderOrder=-8;group.add(moon);
 return {group,moonDirection:dir,update(t,camera){if(camera)group.position.copy(camera.position);dome.material.uniforms.time.value=t;starMat.uniforms.time.value=t;}};
}
// Falling particles (rain, snow, embers, petals) in a box that follows the camera.
export function precipitation(root,{count=4000,color=0xc8d4e8,size=.06,area=[60,30,60],speed=8,drift=.6,opacity=.6,rise=false,seed=11}={}){
 let s=seed;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
 const base=new Float32Array(count*3),pos=new Float32Array(count*3);for(let i=0;i<count;i++)base.set([rnd(),rnd(),rnd()],i*3);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const m=new THREE.PointsMaterial({color,size,transparent:true,opacity,depthWrite:false,sizeAttenuation:true});const pts=new THREE.Points(g,m);pts.frustumCulled=false;root.add(pts);
 return {points:pts,update(t,camera){const c=camera?.position||{x:0,y:0,z:0};for(let i=0;i<count;i++){const a=base[i*3],b=base[i*3+1],d=base[i*3+2];let y=(b*area[1]+(rise?1:-1)*t*speed*(.7+a*.6))%area[1];if(y<0)y+=area[1];const x=((a*area[0]+Math.sin(t*.7+i)*drift-c.x)%area[0]+area[0])%area[0]-area[0]/2;const z=((d*area[2]+Math.cos(t*.5+i*.3)*drift-c.z)%area[2]+area[2])%area[2]-area[2]/2;pos[i*3]=c.x+x;pos[i*3+1]=c.y-area[1]*.35+y;pos[i*3+2]=c.z+z;}g.attributes.position.needsUpdate=true;}};
}
