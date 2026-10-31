import {quality} from './performance-mode.js';
import {regionAt} from './expansion-rules.js';
import * as THREE from './vendor/three.module.js';
import {climateAt,roofHeight} from './climate-rules.js';
export function createClimate(scene,camera,renderer,ground){
 const sun=scene.children.find(o=>o.isDirectionalLight),hemi=scene.children.find(o=>o.isHemisphereLight);
 const moon=new THREE.DirectionalLight(0x769dd0,.15);moon.position.set(-20,35,5);scene.add(moon);
 const beam=new THREE.SpotLight(0xc9e5ff,55,45,Math.PI/7,.45,1.3);beam.position.set(.15,-.1,-.2);camera.add(beam);const target=new THREE.Object3D();target.position.set(0,0,-20);camera.add(target);beam.target=target;let flashlightOverride=null;
 const count=1400,positions=new Float32Array(count*6),drops=[];
 for(let i=0;i<count;i++)drops.push({x:(Math.random()-.5)*65,y:Math.random()*32-3,z:(Math.random()-.5)*65});
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const rainMat=new THREE.LineBasicMaterial({color:0xb1cfdb,transparent:true,opacity:.35,depthWrite:false});const rain=new THREE.LineSegments(geometry,rainMat);rain.frustumCulled=false;rain.visible=false;scene.add(rain);
 const starPos=[];for(let i=0;i<450;i++){const a=Math.random()*Math.PI*2,h=Math.random()*.9+.1,r=350;starPos.push(Math.cos(a)*Math.sqrt(1-h*h)*r,h*r,Math.sin(a)*Math.sqrt(1-h*h)*r);}
 const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));const starMat=new THREE.PointsMaterial({color:0xc9dfec,size:1,transparent:true,opacity:0,depthWrite:false});const stars=new THREE.Points(starsGeo,starMat);scene.add(stars);
 const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(6,12,8),new THREE.MeshBasicMaterial({color:0xffe4ab,fog:false}));const moonDisc=new THREE.Mesh(new THREE.SphereGeometry(4,12,8),new THREE.MeshBasicMaterial({color:0xa7bed0,fog:false}));scene.add(sunDisc,moonDisc);
 const hud=document.createElement('div');hud.id='climate-status';hud.style.cssText='position:fixed;left:18px;bottom:78px;z-index:13;color:#d0e5db;background:#102725cc;padding:6px 10px;font:11px system-ui;pointer-events:none';document.body.appendChild(hud);
 document.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat)flashlightOverride=flashlightOverride===null?!beam.visible:!flashlightOverride;});
 let elapsed=0,seed=0,received=performance.now(),materialScan=0;const wetMaterials=new Map();
 function sync(data){if(!data)return;elapsed=data.elapsed;seed=data.seed;received=performance.now();}
 const skyNight=new THREE.Color(0x081321),skyDay=new THREE.Color(0xa6b2ad),skyRain=new THREE.Color(0x6d909c),sunWarm=new THREE.Color(0xffae72),sunDay=new THREE.Color(0xe7dfc4);
 function update(dt){const state=climateAt(elapsed+(performance.now()-received)/1000,seed);const {daylight,rain:weatherAmount,angle}=state;const localRegion=regionAt(camera.position.x,camera.position.z),snowy=localRegion?.id==='frost',amount=weatherAmount*(localRegion?.id==='dunes'?.2:1);rainMat.color.setHex(snowy?0xe9f3f5:0xb1cfdb);
  scene.background.copy(skyNight).lerp(skyDay,daylight).lerp(skyRain,amount*.65);if(scene.fog){scene.fog.color.copy(scene.background);scene.fog.density=.0018+(1-daylight)*.0057+amount*.006;}
  if(sun){sun.position.set(Math.cos(angle)*80,Math.sin(angle)*80,25);sun.intensity=daylight*(2.3-amount*1.5);sun.color.copy(sunWarm).lerp(sunDay,Math.max(0,state.elevation));}
  if(hemi){hemi.intensity=.34+daylight*.95-amount*.12;hemi.color.setHex(daylight>.3?0xa9b9b9:0x5577a0);hemi.groundColor.setHex(0x263326);}
  moon.intensity=(1-daylight)*.40;beam.visible=flashlightOverride??daylight<.35;renderer.toneMappingExposure=.92+daylight*.12;
  stars.position.set(camera.position.x,0,camera.position.z);starMat.opacity=(1-daylight)*(1-amount)*.85;
  const direction=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.2).normalize();sunDisc.position.copy(camera.position).addScaledVector(direction,330);moonDisc.position.copy(camera.position).addScaledVector(direction,-330);sunDisc.visible=state.elevation>-.05&&amount<.6;moonDisc.visible=state.elevation<.05&&amount<.6;
  geometry.setDrawRange(0,quality().rain*2);rain.visible=amount>.015;rainMat.opacity=amount*(.25+daylight*.18);
  if(rain.visible){for(let i=0;i<quality().rain;i++){const d=drops[i];d.y-=dt*(snowy?4+amount:23+amount*5);d.x+=dt*2.3;if(d.y< -3)d.y=29;if(d.x>32.5)d.x=-32.5;const x=camera.position.x+d.x,z=camera.position.z+d.z,floor=Math.max(ground(x,z)+.08,roofHeight(x,z)),y=camera.position.y+d.y;const bottom=Math.max(floor,y-(snowy?.18:1.15)),visible=y>floor;const k=i*6;positions[k]=x;positions[k+1]=visible?y:floor;positions[k+2]=z;positions[k+3]=visible?x-.10:x;positions[k+4]=visible?bottom:floor;positions[k+5]=z;}
   geometry.attributes.position.needsUpdate=true;}
  materialScan+=dt;if(materialScan>2){materialScan=0;scene.traverse(o=>{if(o.isMesh&&o.receiveShadow){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial&&m.roughness>.6&&!wetMaterials.has(m))wetMaterials.set(m,m.roughness);}});}
  for(const [mat,base]of wetMaterials)mat.roughness=base*(1-amount*.38);
  hud.textContent=state.name+' · '+(snowy&&amount>.1?'SNOW':state.weather)+' · F FLASHLIGHT '+(beam.visible?'ON':'OFF');
 }
 return {sync,update,beam,rain,hud};
}
