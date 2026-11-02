import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { createEnvironment, views, discoveries, canWalk, walkHeight } from './environment.js';

const $=s=>document.querySelector(s),canvas=$('#world');
let renderer,world,started=false,evening=false,photo=false,yaw=0,pitch=0,dragging=false,transition=null,near=null,viewOverride=null;
let elapsed=0,frames=0,fps=0,speed=0,lastPosition=new THREE.Vector3();
const keys=new Set(),stick={x:0,y:0};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,2500);
camera.rotation.order='YXZ';
const found=new Set();try{for(const n of JSON.parse(localStorage.getItem('veilbound-cloudveil-notes')||'[]'))if(discoveries.some(d=>d.id===n))found.add(n);}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function loadProgress(n,label){$('#load-progress').style.width=`${Math.round(n*100)}%`;$('#load-label').textContent=label;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3600)}
function orient(target){const d=new THREE.Vector3(...target).sub(camera.position).normalize();yaw=Math.atan2(-d.x,-d.z);pitch=Math.asin(d.y);camera.rotation.set(pitch,yaw,0);}
function begin(){if(started)return;started=true;$('#title').hidden=true;$('#title-foot').hidden=true;$('#hud').hidden=false;document.body.classList.add('playing');camera.position.set(0,1.68,24);orient([0,3,-16]);lastPosition.copy(camera.position);toast('Explore six places. Use the destination buttons, or follow the stone trails on foot.');}
function goView(name){if(!started)begin();const v=views[name];viewOverride=v.name;transition={from:camera.position.clone(),to:new THREE.Vector3(...v.pos),start:elapsed,duration:reduced?.01:2.2,look:new THREE.Vector3(...v.look)};$('#views').hidden=true;$('#location-name').textContent=v.name;$('#location-sub').textContent=v.sub;keys.clear();}
function journal(){const el=$('#journal-notes');el.replaceChildren();for(const d of discoveries){const a=document.createElement('article');a.className=found.has(d.id)?'':'locked';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=found.has(d.id)?d.title:'An undiscovered trace';p.textContent=found.has(d.id)?d.text:'Keep exploring. Something waits here.';a.append(h,p);el.append(a);}$('#note-count').textContent=`${found.size}/3`;$('#objective-count').textContent=`${found.size} / 3`;}
function interact(){if(!near)return;$('#discovery-title').textContent=near.title;$('#discovery-text').textContent=near.text;$('#discovery').showModal();keys.clear();document.exitPointerLock?.();$('#discovery').dataset.note=near.id;}
function setPhoto(){photo=!photo;document.body.classList.toggle('photo',photo);$('#photo-hint').hidden=!photo;}
$('#enter').onclick=begin;$('#tour').onclick=()=>{begin();$('#views').hidden=false;};$('#home').onclick=e=>{e.preventDefault();started=false;transition=null;$('#title').hidden=false;$('#title-foot').hidden=false;$('#hud').hidden=true;$('#views').hidden=true;document.body.classList.remove('playing');};
$('#views-toggle').onclick=()=>$('#views').hidden=!$('#views').hidden;$('#close-views').onclick=()=>$('#views').hidden=true;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>goView(b.dataset.view));
$('#journal-toggle').onclick=()=>{journal();$('#journal').showModal();keys.clear();document.exitPointerLock?.();};
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#keep-note').onclick=()=>{found.add($('#discovery').dataset.note);try{localStorage.setItem('veilbound-cloudveil-notes',JSON.stringify([...found]));}catch{}journal();$('#discovery').close();toast(found.size===3?'All three traces found. The eastern journey lies ahead.':'A trace has been added to your journal.');};
$('#interact-button').onclick=interact;$('#photo-hint').onclick=setPhoto;
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='e')interact();if(k==='v'&&started)$('#views').hidden=!$('#views').hidden;if(k==='p')setPhoto();if(k==='j')$('#journal-toggle').click();if(k==='escape'){if(photo)setPhoto();$('#views').hidden=true;keys.clear();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();dragging=false;stick.x=stick.y=0;});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden)dragging=false;});
canvas.addEventListener('pointerdown',e=>{if(!started)return;dragging=true;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!started||(!dragging&&document.pointerLockElement!==canvas)||document.querySelector('dialog[open]'))return;transition=null;yaw-=e.movementX*.003;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0025,-1.2,1.1);});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('dblclick',()=>{if(started&&matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();});
const joystick=$('#joystick');let joyPointer=null;
function moveStick(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,m=Math.max(1,Math.hypot(dx,dy)/34);stick.x=dx/m/34;stick.y=dy/m/34;joystick.firstElementChild.style.transform=`translate(${stick.x*26}px,${stick.y*26}px)`;}
joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveStick(e)});for(const type of ['pointerup','pointercancel'])joystick.addEventListener(type,()=>{joyPointer=null;stick.x=stick.y=0;joystick.firstElementChild.style.transform='';});

// Synthesized ambience has no external requests and starts only after a gesture.
let audioCtx,audioGain,waterAudioGain,audioOn=false;
$('#audio-toggle').onclick=async()=>{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioGain=audioCtx.createGain();audioGain.gain.value=0;audioGain.connect(audioCtx.destination);const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*4,audioCtx.sampleRate),data=buffer.getChannelData(0);let value=0;for(let i=0;i<data.length;i++){value=(value+(Math.random()*2-1)*.03)/1.03;data[i]=value*3;}const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;source.connect(filter).connect(audioGain);source.start();waterAudioGain=audioCtx.createGain();waterAudioGain.gain.value=0;const waterFilter=audioCtx.createBiquadFilter();waterFilter.type='highpass';waterFilter.frequency.value=450;const waterSource=audioCtx.createBufferSource();waterSource.buffer=buffer;waterSource.loop=true;waterSource.playbackRate.value=1.7;waterSource.connect(waterFilter).connect(waterAudioGain).connect(audioGain);waterSource.start();}await audioCtx.resume();audioOn=!audioOn;audioGain.gain.setTargetAtTime(audioOn?.25:0,audioCtx.currentTime,.7);$('#audio-label').textContent=audioOn?'Sound on':'Sound off';$('#audio-toggle').setAttribute('aria-label',audioOn?'Disable ambient sound':'Enable ambient sound');};

try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1.3:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const sky=new Sky();sky.scale.setScalar(1800);scene.add(sky);const uniforms=sky.material.uniforms;uniforms.turbidity.value=5;uniforms.rayleigh.value=1.5;uniforms.mieCoefficient.value=.004;uniforms.mieDirectionalG.value=.78;
 const sun=new THREE.DirectionalLight(0xffe3b1,3.2);sun.position.set(-65,100,65);sun.castShadow=true;sun.shadow.mapSize.set(matchMedia('(max-width:760px)').matches?2048:4096,matchMedia('(max-width:760px)').matches?2048:4096);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:250});sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
 const hemi=new THREE.HemisphereLight(0xb9d8e1,0x67744e,1.45);scene.add(hemi);const fill=new THREE.AmbientLight(0xe5e8db,.22);scene.add(fill);
 const initialSun=new THREE.Vector3(-.5,.65,.45);uniforms.sunPosition.value.copy(initialSun);
 const pmrem=new THREE.PMREMGenerator(renderer);const skyScene=new THREE.Scene();skyScene.add(sky.clone());let environmentTarget=pmrem.fromScene(skyScene,.05,.1,2500);scene.environment=environmentTarget.texture;scene.environmentIntensity=.32;
 scene.fog=new THREE.FogExp2(0xb4c8c1,.0018);
 $('#time-toggle').onclick=()=>{evening=!evening;sun.position.set(evening?-95:-65,evening?25:100,65);sun.color.setHex(evening?0xffbf80:0xffe3b1);sun.intensity=evening?2.3:3.2;hemi.intensity=evening?.95:1.45;hemi.color.setHex(evening?0x97b3d3:0xb9d8e1);uniforms.sunPosition.value.set(-.5,evening?.14:.65,.45);uniforms.turbidity.value=evening?8:5;scene.fog.color.setHex(evening?0xa7aca9:0xb4c8c1);renderer.toneMappingExposure=evening?1.0:1.05;renderer.shadowMap.needsUpdate=true;world?.setEvening(evening);skyScene.children[0].material.uniforms.sunPosition.value.copy(uniforms.sunPosition.value);const previousEnvironment=environmentTarget;environmentTarget=pmrem.fromScene(skyScene,.05,.1,2500);scene.environment=environmentTarget.texture;previousEnvironment.dispose();$('#time-label').textContent=evening?'Evening':'Morning';$('#sun-icon').textContent=evening?'☾':'☼';};
 world=await createEnvironment(scene,renderer,loadProgress);journal();loadProgress(1,'Cloudveil awaits');
 camera.position.set(11,4.2,30);orient([0,5,-15]);renderer.render(scene,camera);
 $('#loading').style.opacity='0';setTimeout(()=>$('#loading').hidden=true,750);
 window.__READY__=true;window.__START__=begin;
 window.__SCENE__={scene,camera,renderer,views,discoveries};
 let previous=performance.now(),fpsTime=previous;
 function tick(now){
   requestAnimationFrame(tick);const raw=(now-previous)/1000;previous=now;const dt=Math.max(0,Math.min(.05,raw));elapsed+=dt;frames++;if(now-fpsTime>700){fps=frames*1000/(now-fpsTime);frames=0;fpsTime=now;}
   if(!started){const a=reduced?0:Math.sin(elapsed*.045);camera.position.set(11+a*1.5,4.2+a*.3,30);orient([0,5,-15]);}
   else if(transition){const t=THREE.MathUtils.clamp((elapsed-transition.start)/transition.duration,0,1),s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);orient(transition.look.toArray());if(t>=1)transition=null;}
   else if(!document.querySelector('dialog[open]')){
     let f=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-stick.y;
     let r=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stick.x;
     const len=Math.max(1,Math.hypot(f,r));f/=len;r/=len;const rate=keys.has('shift')?6:3.3;
     const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*rate*dt,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*rate*dt;
     const clear=(x,z)=>canWalk(x,z)&&!world.trunks.some(([tx,tz,rad])=>Math.hypot(x-tx,z-tz)<rad+.28);
     if(clear(camera.position.x+dx,camera.position.z))camera.position.x+=dx;
     if(clear(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
     const moving=Math.abs(dx)+Math.abs(dz)>.0001;
     if(moving){viewOverride=null;const ground=walkHeight(camera.position.x,camera.position.z);camera.position.y=THREE.MathUtils.lerp(camera.position.y,ground+1.68,Math.min(1,dt*8));}
     camera.rotation.set(pitch,yaw,0);
   }
   speed=lastPosition.distanceTo(camera.position)/Math.max(raw,.001);lastPosition.copy(camera.position);
   if(waterAudioGain)waterAudioGain.gain.setTargetAtTime(Math.max(0,1-Math.hypot(camera.position.x-38.8,camera.position.z+17)/55)*1.3,audioCtx.currentTime,.4);const indoors=started&&Math.abs(camera.position.x)<10.5&&camera.position.z<-10.5&&camera.position.z>-21.5;hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,indoors?.38:(evening?.95:1.45),Math.min(1,dt*3));scene.environmentIntensity=indoors?.10:.32;world.update(elapsed);renderer.render(scene,camera);
   if(started){const x=camera.position.x,z=camera.position.z;const label=z<-38?'The Silent Bell':x>21?'The Falling Water':z<-7&&Math.abs(x)<12?'The Training Hall':x<-12?'The Returning Garden':'Cloudveil Courtyard';if(!transition)$('#location-name').textContent=viewOverride||label;
     const a=((yaw*180/Math.PI)%360+360)%360;$('#bearing').textContent=['N','NW','W','SW','S','SE','E','NE'][Math.round(a/45)%8];
     near=discoveries.find(d=>Math.hypot(x-d.pos[0],z-d.pos[2])<3.6&&Math.abs(camera.position.y-d.pos[1])<3.5)??null;$('#interact').hidden=!near;if(near)$('#interact-text').textContent=(found.has(near.id)?'Read again: ':'Inspect: ')+near.title;
   }
   window.__GAME__={pos:[camera.position.x,camera.position.z],height:camera.position.y,fps,speed,score:found.size,over:false,draws:renderer.info.render.calls,tris:renderer.info.render.triangles,started,evening,texturesLoaded:world.texturesLoaded,grassBlades:world.grassBlades,windTime:elapsed,view:$('#location-name').textContent};
 }
 requestAnimationFrame(tick);
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(error){console.error(error);$('#loading').hidden=true;$('#error').hidden=false;$('#error-text').textContent=error.message;window.__LOAD_ERROR__=error.message;}
