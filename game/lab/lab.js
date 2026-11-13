// Fighter lab: inspect the sculpted fighters and their moves outside the game.
// ?cam=front|side|back|face|three  ?who=haru|mitsuki|both  ?clip=<name>&t=<seconds>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import makeFighter from '../assets/fighter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const q=new URLSearchParams(location.search);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fb4b8);scene.fog=new THREE.Fog(0x9fb4b8,12,40);
scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.5;
const cam=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,100);
scene.add(new THREE.HemisphereLight(0xc8e0ea,0x6a7258,1.4));const sun=new THREE.DirectionalLight(0xffe6c0,3);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-3,right:3,top:3,bottom:-3});scene.add(sun);
const ground=new THREE.Mesh(new THREE.CircleGeometry(8,48),new THREE.MeshStandardMaterial({color:0x8a8a72,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const who=q.get('who')||'both';const t0=performance.now();
const fighters=[];for(const id of who==='both'?['haru','mitsuki']:[who]){const f=makeFighter(THREE,id);scene.add(f);fighters.push(f);}
if(fighters.length===2){fighters[0].position.x=-.45;fighters[1].position.x=.45;}
const build=Math.round(performance.now()-t0);
const views={front:[[0,1.05,4.6],[0,.9,0]],side:[[4.6,1.05,0],[0,.9,0]],back:[[0,1.2,-4.6],[0,.9,0]],face:[[fighters.length>1?-.45:0,1.58,.75],[fighters.length>1?-.45:0,1.57,0]],face2:[[.45,1.6,.75],[.45,1.6,0]],three:[[2.6,1.6,3.4],[0,.9,0]],left:[[-3.6,1.3,2.2],[0,.95,0]],low:[[1.8,.6,3.2],[0,1.0,0]]};
const v=views[q.get('cam')||'three'];cam.position.set(...v[0]);const controls=new OrbitControls(cam,renderer.domElement);controls.target.set(...v[1]);controls.update();
let moves=null;try{moves=await import(q.get('moves')?'../fighter-moves-'+q.get('moves')+'.js':'../fighter-moves.js');}catch(e){console.warn('moves',e.message);}
const mixers=fighters.map(f=>moves?moves.animate(THREE,f):null);
const clip=q.get('clip');if(clip&&moves)mixers.forEach(m=>{m?.play(clip,0);if(q.get('speed'))m.setSpeed(+q.get('speed'),clip);});
if(q.get('drawn'))fighters.forEach(f=>f.userData.setDrawn(true));
let fixedT=q.get('t');
document.getElementById('info').textContent=fighters.map(f=>f.userData.name+' '+f.userData.triangles+' tris').join(' · ')+' · build '+build+' ms';
let last=performance.now();
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;
 mixers.forEach((m,i)=>{if(!m)return;if(fixedT!==null){m.seek(+fixedT);}else m.update(dt);if(m.air!==undefined)fighters[i].position.y=m.air||0;});
 controls.update();renderer.render(scene,cam);}
requestAnimationFrame(tick);window.__LAB__={ready:true,build,fighters,scene,cam,mixers,setT:v=>{fixedT=v;},play:(n)=>mixers.forEach(m=>m?.restart?m.restart(n,0):m?.play(n,0))};
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
