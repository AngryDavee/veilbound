import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { createEnvironment, views, discoveries as sanctuaryClues, canWalk, walkHeight } from './environment.js';
import { regions as chapters, regionOrder, regionClues, worlds, allClues, worldOf } from './realms/campaign.js';
import { disposeGroup } from './realms/kit.js';
import { createCombat } from './combat.js';
import { createDuelCamera } from './duel-camera.js';
import { createAnimeFX } from './anime-fx.js';
let director=null,fx=null,duelCamOn=false;const viewDir=new THREE.Vector3();
regionClues.sanctuary=sanctuaryClues;
const discoveries=[...sanctuaryClues,...allClues];
const CACHE_LIMIT=4;
let currentRealm='sanctuary',realmLoading=false,lighting;const realmCache=new Map();

const $=s=>document.querySelector(s),canvas=$('#world');
let renderer,world,started=false,evening=false,photo=false,yaw=0,pitch=0,dragging=false,transition=null,near=null,viewOverride=null;
let elapsed=0,frames=0,fps=0,speed=0,lastPosition=new THREE.Vector3();
const keys=new Set(),stick={x:0,y:0};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,2500);
camera.rotation.order='YXZ';
// Third-person view: `camera` stays the player's eye (all game logic uses it); `viewCam` follows Haru from behind.
const viewCam=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,2500);let combat=null,combatOut=null,pushX=0,pushZ=0,moveDir=0,moveSpeed=0,camReady=false;const camGoal=new THREE.Vector3(),camAim=new THREE.Vector3(),aimNow=new THREE.Vector3();
const found=new Set();try{for(const n of JSON.parse(localStorage.getItem('veilbound-cloudveil-notes')||'[]'))if(discoveries.some(d=>d.id===n))found.add(n);}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function loadProgress(n,label){$('#load-progress').style.width=`${Math.round(n*100)}%`;$('#load-label').textContent=label;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3600)}
function orient(target){const d=new THREE.Vector3(...target).sub(camera.position).normalize();yaw=Math.atan2(-d.x,-d.z);pitch=Math.asin(d.y);camera.rotation.set(pitch,yaw,0);}
function begin(){if(started||realmLoading)return;started=true;$('#title').hidden=true;$('#title-foot').hidden=true;$('#hud').hidden=false;document.body.classList.add('playing');camera.position.fromArray(chapters[currentRealm].spawn);orient(chapters[currentRealm].look);lastPosition.copy(camera.position);toast('Seven worlds, one severed veil. Press M for the world map, or follow the marked exits.');}
function goView(name){if(!started)begin();const v=(world.views||views)[name];if(!v)return;viewOverride=v.name;transition={from:camera.position.clone(),to:new THREE.Vector3(...v.pos),start:elapsed,duration:reduced?.01:2.2,look:new THREE.Vector3(...v.look)};$('#views').hidden=true;$('#location-name').textContent=v.name;$('#location-sub').textContent=v.sub;keys.clear();}
function journal(){const el=$('#journal-notes');el.replaceChildren();for(const d of discoveries){const a=document.createElement('article');a.className=found.has(d.id)?'':'locked';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=found.has(d.id)?d.title:'An undiscovered trace';p.textContent=found.has(d.id)?d.text:'Keep exploring. Something waits here.';a.append(h,p);el.append(a);}$('#note-count').textContent=`${found.size}/${discoveries.length}`;{const list=world?.discoveries||sanctuaryClues;$('#objective-count').textContent=`${list.filter(d=>found.has(d.id)).length} / ${list.length}`;}}
function interact(){if(combat?.active&&director)return;if(!near||realmLoading)return;if(near.duel){combat?.start();return;}if(near.portal){changeRealm(near.portal);return;}$('#discovery-title').textContent=near.title;$('#discovery-text').textContent=near.text;$('#discovery').showModal();keys.clear();document.exitPointerLock?.();$('#discovery').dataset.note=near.id;}
function setPhoto(){photo=!photo;document.body.classList.toggle('photo',photo);$('#photo-hint').hidden=!photo;}
$('#enter').onclick=begin;$('#tour').onclick=()=>$('#journey').showModal();$('#home').onclick=async e=>{e.preventDefault();if(currentRealm!=='sanctuary')await changeRealm('sanctuary');started=false;transition=null;$('#title').hidden=false;$('#title-foot').hidden=false;$('#hud').hidden=true;$('#views').hidden=true;document.body.classList.remove('playing');};
$('#views-toggle').onclick=()=>$('#views').hidden=!$('#views').hidden;$('#close-views').onclick=()=>$('#views').hidden=true;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>goView(b.dataset.view));
$('#journal-toggle').onclick=()=>{journal();$('#journal').showModal();keys.clear();document.exitPointerLock?.();};
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#keep-note').onclick=()=>{found.add($('#discovery').dataset.note);try{localStorage.setItem('veilbound-cloudveil-notes',JSON.stringify([...found]));}catch{}journal();$('#discovery').close();toast((world?.discoveries||sanctuaryClues).every(d=>found.has(d.id))?'This region’s traces are complete. Follow the marked exit or open the world map.':'A trace has been added to your journal.');};
$('#interact-button').onclick=interact;$('#photo-hint').onclick=setPhoto;
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='e')interact();if(k==='m'&&!realmLoading){keys.clear();$('#journey').showModal();}if(k==='v'&&started)$('#views').hidden=!$('#views').hidden;if(k==='p')setPhoto();if(k==='j')$('#journal-toggle').click();if(k==='escape'){if(photo)setPhoto();$('#views').hidden=true;keys.clear();}});
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


function refreshRegionUI(){
 const c=chapters[currentRealm],w=worldOf(currentRealm);$('#location-kind').textContent='WORLD '+w.number+' · '+w.name.toUpperCase()+' · REGION '+c.index+'/'+w.regionIds.length;$('#location-name').textContent=c.name;$('#location-sub').textContent=c.description;
 $('#views').innerHTML='<div class="panel-title">VIEWS WITHIN THIS REGION <button id="close-views" aria-label="Close viewpoints">×</button></div>';
 const entries=Object.entries(world.views||views);entries.forEach(([id,v],i)=>{const b=document.createElement('button');b.dataset.view=id;b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>'+v.name+'<small>'+v.sub+'</small>';b.onclick=()=>goView(id);$('#views').append(b);});$('#close-views').onclick=()=>$('#views').hidden=true;
 $('#destination-shortcuts').innerHTML='<span>'+c.name.toUpperCase()+'</span><button id="open-map-shortcut">World map · '+worlds.length+' worlds ↗</button>';$('#open-map-shortcut').onclick=()=>$('#journey').showModal();
 const shortcuts=currentRealm==='sanctuary'?entries.filter(([id])=>['interior','water','garden'].includes(id)):entries.slice(0,3);for(const [id,v]of shortcuts){const b=document.createElement('button');b.dataset.view=id;b.textContent=v.name+' ↗';b.onclick=()=>goView(id);$('#destination-shortcuts').append(b);}
 $('#views-toggle').textContent='◇ Views in this region';$('#time-toggle').disabled=currentRealm!=='sanctuary';$('#time-label').textContent=currentRealm==='folded'?'Timeless':currentRealm==='reedwater'?'Rain':currentRealm==='sanctuary'?(evening?'Evening':'Morning'):(c.theme.label||'');
 $('#journal .journal-footer').textContent='Follow the trail through seven worlds. The world map lets you revisit any region.';journal();
}
function applyTheme(id){const t=chapters[id].theme,day=t.sky==='day';lighting.sky.visible=day;lighting.uniforms.sunPosition.value.set(...(t.skySun||[-.5,.65,.45]));lighting.uniforms.turbidity.value=t.turbidity??5;lighting.rebuildEnvironment();scene.background=day?null:new THREE.Color(t.background??t.fog);scene.fog=new THREE.FogExp2(t.fog,t.density);lighting.sun.color.setHex(t.sun);lighting.sun.intensity=t.power;lighting.sun.position.set(...(t.sunPos||[-45,80,40]));lighting.sun.target.position.set(...(t.target||[0,0,id==='folded'?-25:-8]));lighting.hemi.intensity=t.ambient;lighting.hemi.color.setHex(t.hemiSky??(day?0xb9d8e1:0x90aaba));lighting.hemi.groundColor.setHex(t.hemiGround??0x67744e);renderer.toneMappingExposure=t.exposure??(id==='folded'?1.12:1.05);renderer.shadowMap.needsUpdate=true;}
// Keep GPU memory bounded across 23 regions: the sanctuary stays resident, other regions are least-recently-used.
function evictRegions(){const ids=[...realmCache.keys()].filter(k=>k!=='sanctuary'&&k!==currentRealm);while(ids.length>CACHE_LIMIT-1){const old=ids.shift(),r=realmCache.get(old);realmCache.delete(old);try{r.dispose?.();r.root.removeFromParent();disposeGroup(r.root);}catch(e){console.warn('Region disposal',old,e);}}}
async function changeRealm(id){
 if(realmLoading||!chapters[id])return;realmLoading=true;keys.clear();stick.x=stick.y=0;transition=null;near=null;document.exitPointerLock?.();document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('#views').hidden=true;$('#loading').hidden=false;$('#loading').style.opacity='1';loadProgress(.05,'Travelling to '+chapters[id].name);
 const previous=world;let pendingRoot;
 try{
  let next=realmCache.get(id);
  if(!next){pendingRoot=new THREE.Group();pendingRoot.name='region-'+id;pendingRoot.visible=false;scene.add(pendingRoot);const module=await import(chapters[id].module);const create=module[chapters[id].factory||'create'];next=await create(pendingRoot,renderer,loadProgress,{camera,scene});next.root=pendingRoot;next.trunks=next.trunks||[];next.discoveries=next.discoveries||regionClues[id];next.update=next.update||(()=>{});next.setEvening=next.setEvening||(()=>{});realmCache.set(id,next);}
  else{realmCache.delete(id);realmCache.set(id,next);}
  previous.root.visible=false;next.root.visible=true;world=next;currentRealm=id;viewOverride=null;started=true;$('#title').hidden=true;$('#title-foot').hidden=true;$('#hud').hidden=false;document.body.classList.add('playing');
  const c=chapters[id];camera.position.fromArray(c.spawn);orient(c.look);lastPosition.copy(camera.position);combat?.setRegion(c.arena,(x,z)=>world.walkHeight(x,z));camReady=false;applyTheme(id);evening=false;evictRegions();world.setEvening(false);refreshRegionUI();loadProgress(.98,'Preparing the light in '+c.name);await renderer.compileAsync(scene,camera);renderer.render(scene,camera);loadProgress(1,c.name);window.__SCENE__.views=world.views;toast(c.tag+' — '+c.name);
 }catch(error){console.error(error);if(pendingRoot)pendingRoot.removeFromParent();previous.root.visible=true;toast('This region could not load. '+error.message);}
 finally{realmLoading=false;$('#loading').style.opacity='0';setTimeout(()=>{if(!realmLoading)$('#loading').hidden=true;},500);}
}
$('#world-map-toggle').onclick=()=>{keys.clear();$('#journey').showModal();};
for(const w of worlds){const sec=document.createElement('section');sec.className='world-block';sec.dataset.worldGroup=w.id;sec.style.setProperty('--accent',w.accent);sec.style.setProperty('--card',w.card);sec.innerHTML='<div class="world-head"><span>WORLD '+w.number+(w.herald&&w.herald!=='—'?' · HERALD: '+w.herald.toUpperCase():'')+'</span><h3>'+w.name+'</h3><p>'+w.summary+'</p></div><div class="world-regions"></div>';for(const id of w.regionIds){const c=chapters[id],b=document.createElement('button');b.dataset.world=id;b.innerHTML='<span>REGION '+c.index+'</span><strong>'+c.name+'</strong><small>'+c.description+'</small><em>'+c.arena.name+' · '+c.arena.size.join(' × ')+' m</em>';b.onclick=()=>changeRealm(id);sec.querySelector('.world-regions').append(b);}$('#journey-regions').append(sec);}

try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1.3:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const sky=new Sky();sky.scale.setScalar(1800);scene.add(sky);const uniforms=sky.material.uniforms;uniforms.turbidity.value=5;uniforms.rayleigh.value=1.5;uniforms.mieCoefficient.value=.004;uniforms.mieDirectionalG.value=.78;
 const sun=new THREE.DirectionalLight(0xffe3b1,3.2);sun.position.set(-65,100,65);sun.castShadow=true;sun.shadow.mapSize.set(matchMedia('(max-width:760px)').matches?2048:4096,matchMedia('(max-width:760px)').matches?2048:4096);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:250});sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
 const hemi=new THREE.HemisphereLight(0xb9d8e1,0x67744e,1.45);scene.add(hemi);const fill=new THREE.AmbientLight(0xe5e8db,.22);scene.add(fill);
 const initialSun=new THREE.Vector3(-.5,.65,.45);uniforms.sunPosition.value.copy(initialSun);
 const pmrem=new THREE.PMREMGenerator(renderer);const skyScene=new THREE.Scene();skyScene.add(sky.clone());let environmentTarget=pmrem.fromScene(skyScene,.05,.1,2500);scene.environment=environmentTarget.texture;scene.environmentIntensity=.32;
 scene.fog=new THREE.FogExp2(0xb4c8c1,.0018);
 $('#time-toggle').onclick=()=>{if(currentRealm!=='sanctuary')return;evening=!evening;sun.position.set(evening?-95:-65,evening?25:100,65);sun.color.setHex(evening?0xffbf80:0xffe3b1);sun.intensity=evening?2.3:3.2;hemi.intensity=evening?.95:1.45;hemi.color.setHex(evening?0x97b3d3:0xb9d8e1);uniforms.sunPosition.value.set(-.5,evening?.14:.65,.45);uniforms.turbidity.value=evening?8:5;scene.fog.color.setHex(evening?0xa7aca9:0xb4c8c1);renderer.toneMappingExposure=evening?1.0:1.05;renderer.shadowMap.needsUpdate=true;world?.setEvening(evening);skyScene.children[0].material.uniforms.sunPosition.value.copy(uniforms.sunPosition.value);const previousEnvironment=environmentTarget;environmentTarget=pmrem.fromScene(skyScene,.05,.1,2500);scene.environment=environmentTarget.texture;previousEnvironment.dispose();$('#time-label').textContent=evening?'Evening':'Morning';$('#sun-icon').textContent=evening?'☾':'☼';};
 const sanctuaryRoot=new THREE.Group();sanctuaryRoot.name='region-sanctuary';scene.add(sanctuaryRoot);world=await createEnvironment(sanctuaryRoot,renderer,loadProgress);Object.assign(world,{root:sanctuaryRoot,views,discoveries:sanctuaryClues,canWalk,walkHeight});realmCache.set('sanctuary',world);lighting={sky,sun,hemi,uniforms,rebuildEnvironment(){if(!sky.visible)return;skyScene.children[0].material.uniforms.sunPosition.value.copy(uniforms.sunPosition.value);skyScene.children[0].material.uniforms.turbidity.value=uniforms.turbidity.value;const prev=environmentTarget;environmentTarget=pmrem.fromScene(skyScene,.05,.1,2500);scene.environment=environmentTarget.texture;prev.dispose();}};loadProgress(.97,'Sculpting Haru and Mitsuki');await new Promise(r=>setTimeout(r,30));{try{fx=createAnimeFX(THREE,scene,{renderer,canvas});fx.overlay.style.zIndex=7;}catch(e){console.warn('anime fx unavailable',e);fx=null;}director=createDuelCamera(THREE,viewCam,{canPlace:(x,z)=>world.canWalk(x,z),ground:(x,z)=>world.walkHeight(x,z)});combat=createCombat(THREE,scene,{toast,director,fx});try{fx?.prewarm?.([combat.hero,combat.rival]);combat.warm();fx?.update(0,.001,camera);renderer.compile(scene,camera);fx?.clear?.();}catch(e){console.warn('fx prewarm',e);}}combat.setRegion(chapters.sanctuary.arena,(x,z)=>world.walkHeight(x,z));refreshRegionUI();journal();loadProgress(1,'Cloudveil awaits');
 camera.position.set(11,4.2,30);orient([0,5,-15]);renderer.render(scene,camera);
 $('#loading').style.opacity='0';setTimeout(()=>$('#loading').hidden=true,750);
 window.__READY__=true;window.__START__=begin;window.__GO__=changeRealm;window.__VIEW__=goView;window.__PLACE__=(pos,look)=>{transition=null;viewOverride=null;camera.position.set(...pos);orient(look);lastPosition.copy(camera.position);};
 window.__DUEL__={force:(w,x)=>combat.force?.(w,x),start:()=>combat.start(),stop:()=>combat.stop(),auto:v=>combat.setAuto(v),state:()=>combat.state()};
 window.__SCENE__={get director(){return director;},get fx(){return fx;},scene,camera,viewCam,get combat(){return combat;},renderer,views,discoveries,getActiveWorld:()=>world,getRegion:()=>chapters[currentRealm]};
 let previous=performance.now(),fpsTime=previous;
 function tick(now){
   requestAnimationFrame(tick);const raw=(now-previous)/1000;previous=now;const dt=Math.max(0,Math.min(.05,raw));elapsed+=dt;frames++;if(now-fpsTime>700){fps=frames*1000/(now-fpsTime);frames=0;fpsTime=now;}
   if(realmLoading){window.__GAME__={...window.__GAME__,realmLoading:true};return;}
   if(!started){const a=reduced?0:Math.sin(elapsed*.045);camera.position.set(11+a*1.5,4.2+a*.3,30);orient([0,5,-15]);}
   else if(transition){const t=THREE.MathUtils.clamp((elapsed-transition.start)/transition.duration,0,1),s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);orient(transition.look.toArray());if(t>=1)transition=null;}
   else if(!realmLoading&&!document.querySelector('dialog[open]')){
     let f=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-stick.y;
     let r=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stick.x;
     const len=Math.max(1,Math.hypot(f,r));f/=len;r/=len;let yaw0=yaw;if(director&&combat?.active){viewCam.getWorldDirection(viewDir);yaw0=Math.atan2(-viewDir.x,-viewDir.z);}const rate=keys.has('shift')?6:3.3,lock=combatOut?.lock;
     let dx=lock?0:(-Math.sin(yaw0)*f+Math.cos(yaw0)*r)*rate*dt,dz=lock?0:(-Math.cos(yaw0)*f-Math.sin(yaw0)*r)*rate*dt;
     if(!lock&&(Math.abs(f)+Math.abs(r)>.01))moveDir=Math.atan2(-Math.sin(yaw0)*f+Math.cos(yaw0)*r,-Math.cos(yaw0)*f-Math.sin(yaw0)*r);moveSpeed=lock?0:Math.hypot(f,r)*rate;
     dx+=pushX;dz+=pushZ;pushX=pushZ=0;
     const clear=(x,z)=>world.canWalk(x,z)&&!world.trunks.some(([tx,tz,rad])=>Math.hypot(x-tx,z-tz)<rad+.28);
     if(clear(camera.position.x+dx,camera.position.z))camera.position.x+=dx;
     if(clear(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
     const moving=Math.abs(dx)+Math.abs(dz)>.0001;
     if(moving){viewOverride=null;const ground=world.walkHeight(camera.position.x,camera.position.z);camera.position.y=THREE.MathUtils.lerp(camera.position.y,ground+1.68,Math.min(1,dt*8));}
     camera.rotation.set(pitch,yaw,0);
   }
   speed=lastPosition.distanceTo(camera.position)/Math.max(raw,.001);lastPosition.copy(camera.position);
   if(waterAudioGain)waterAudioGain.gain.setTargetAtTime(Math.max(0,1-Math.hypot(camera.position.x-38.8,camera.position.z+17)/55)*1.3,audioCtx.currentTime,.4);const indoors=currentRealm==='sanctuary'&&started&&Math.abs(camera.position.x)<10.5&&camera.position.z<-10.5&&camera.position.z>-21.5;hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,indoors?.38:(currentRealm==='sanctuary'?(evening?.95:1.45):chapters[currentRealm].theme.ambient),Math.min(1,dt*3));scene.environmentIntensity=indoors?.10:currentRealm==='folded'?.08:(chapters[currentRealm].theme.env??.26);const tp=started&&!transition&&!viewOverride&&!realmLoading;let renderCam=camera;
   if(combat){combatOut=combat.update(dt,{pos:{x:camera.position.x,z:camera.position.z},ground:(x,z)=>world.walkHeight(x,z),moveDir,moveSpeed:tp?moveSpeed:0,canWalk:(x,z)=>world.canWalk(x,z),visible:tp});pushX=combatOut.dx;pushZ=combatOut.dz;
     if(!director&&combat.active&&combatOut.yaw!==null){let d=(combatOut.yaw+Math.PI-yaw)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;yaw+=d*Math.min(1,raw*2.5);}
     if(tp&&director&&combat.active){renderCam=viewCam;if(!duelCamOn){duelCamOn=true;}director.update(raw,combat.camState(combatOut.timeScale));}
     else if(tp){if(duelCamOn){duelCamOn=false;viewCam.fov=53;viewCam.updateProjectionMatrix();camReady=false;}renderCam=viewCam;const h=combat.hero.position,r=combat.rival.position,duel=combat.active;
       aimNow.set(h.x,h.y+1.45,h.z);if(duel)aimNow.lerp(new THREE.Vector3(r.x,r.y+1.0,r.z),.45);
       const pt=THREE.MathUtils.clamp(pitch,-.75,.45)-(duel?.2:.12),cp=Math.cos(pt),fx=-Math.sin(yaw)*cp,fy=Math.sin(pt),fz=-Math.cos(yaw)*cp;
       const far=duel?3.7+Math.min(1.8,Math.hypot(r.x-h.x,r.z-h.z)*.3):3.3;let d=far;
       for(let s=.6;s<=far;s+=.2){const px=aimNow.x-fx*s,pz=aimNow.z-fz*s;if(!world.canWalk(px,pz)){d=Math.max(1.1,s-.3);break;}}
       const side=duel?1.5:.32;camGoal.set(aimNow.x-fx*d+Math.cos(yaw)*side,aimNow.y-fy*d,aimNow.z-fz*d-Math.sin(yaw)*side);
       let gy=h.y;try{gy=world.walkHeight(camGoal.x,camGoal.z);}catch{}camGoal.y=Math.max(camGoal.y,(Number.isFinite(gy)?gy:h.y)+.4);
       if(!camReady){viewCam.position.copy(camGoal);camAim.copy(aimNow);camReady=true;}
       viewCam.position.lerp(camGoal,Math.min(1,raw*9));camAim.lerp(aimNow,Math.min(1,raw*12));viewCam.lookAt(camAim);
       if(combatOut.shake>0){const k=combatOut.shake*.12;viewCam.position.x+=(Math.random()-.5)*k;viewCam.position.y+=(Math.random()-.5)*k;}
     }else camReady=false;}
   world.update(elapsed,dt,renderCam);renderer.render(scene,renderCam);fx?.update(raw,dt*(combatOut?.timeScale??1),renderCam);
   if(started&&!realmLoading){const x=camera.position.x,z=camera.position.z;const label=currentRealm!=='sanctuary'?(world.locationAt?.(x,z,camera.position.y)||chapters[currentRealm].name):z<-38?'The Silent Bell':x>21?'The Falling Water':z<-7&&Math.abs(x)<12?'The Training Hall':x<-12?'The Returning Garden':'Cloudveil Courtyard';if(!transition)$('#location-name').textContent=viewOverride||label;
     const a=((yaw*180/Math.PI)%360+360)%360;$('#bearing').textContent=['N','NW','W','SW','S','SE','E','NE'][Math.round(a/45)%8];
     const regionClues=world.discoveries||sanctuaryClues;const clue=regionClues.find(d=>Math.hypot(x-d.pos[0],z-d.pos[2])<3.6&&Math.abs(camera.position.y-d.pos[1])<3.5)??null;const chapter=chapters[currentRealm];const at=p=>Math.hypot(x-p[0],z-p[2])<3.2&&Math.abs(camera.position.y-p[1])<3;let portal=null;if(at(chapter.exit))portal={portal:chapter.next,title:(chapters[chapter.next].world!==chapter.world?'Travel to World '+chapters[chapter.next].worldNumber+' — ':'Travel to ')+chapters[chapter.next].name};else if(chapter.previous&&at(chapter.returnPoint))portal={portal:chapter.previous,title:'Return to '+chapters[chapter.previous].name};const arenaHere=combat&&!combat.active&&combat.inArena(x,z);near=clue&&!found.has(clue.id)?clue:portal||clue||(arenaHere?{duel:true,title:'Spar with Mitsuki'}:null);$('#interact').hidden=!near;if(near)$('#interact-text').textContent=near.portal||near.duel?near.title:(found.has(near.id)?'Read again: ':'Inspect: ')+near.title;
     const arena=chapter.arena;const inArena=Math.abs(x-arena.center[0])<arena.size[0]/2&&Math.abs(z-arena.center[2])<arena.size[1]/2;$('#arena-label').hidden=!inArena;$('#arena-label').textContent=arena.name+(combat?.active?' · Sparring':' · Battle ground');
   }
   window.__GAME__={duel:combat?.state(),realm:currentRealm,worldId:chapters[currentRealm].world,realmLoading,arena:chapters[currentRealm].arena.name,pos:[camera.position.x,camera.position.z],height:camera.position.y,fps,speed,score:found.size,over:false,draws:renderer.info.render.calls,tris:renderer.info.render.triangles,started,evening,texturesLoaded:world.texturesLoaded,grassBlades:world.grassBlades,windTime:elapsed,view:$('#location-name').textContent};
 }
 requestAnimationFrame(tick);
 window.addEventListener('resize',()=>{camera.aspect=viewCam.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();viewCam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(error){console.error(error);$('#loading').hidden=true;$('#error').hidden=false;$('#error-text').textContent=error.message;window.__LOAD_ERROR__=error.message;}
