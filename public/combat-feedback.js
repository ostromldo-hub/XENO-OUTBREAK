import {createImpactAudio} from './impact-audio.js';
import {TOWERS} from './tower-rules.js';
import * as THREE from './vendor/three.module.js';
export function compassDegrees(yaw){return ((-yaw*180/Math.PI)%360+360)%360;}
export function createFeedback(scene,camera,canvas){
 const compass=document.createElement('div');compass.id='compass';document.body.appendChild(compass);
 const audioButton=document.createElement('button');audioButton.id='audio-toggle';audioButton.textContent='SOUND ON · M MUTE';document.body.appendChild(audioButton);
 let audio,impactAudio,muted=false,previous=null,walk=0,stepClock=0,growl=0;const traces=[],marks=[],bodies=new Map();
 function unlock(){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!audio&&Context){audio=new Context();impactAudio=createImpactAudio(audio);}audio?.resume();}
 canvas.addEventListener('pointerdown',unlock);document.addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat)toggle();});
 function toggle(){muted=!muted;audioButton.textContent=muted?'SOUND OFF · M UNMUTE':'SOUND ON · M MUTE';}audioButton.onclick=()=>{unlock();toggle();};
 function sound(type,point,kind='rifle'){
  if(!audio||muted||audio.state!=='running')return;
  const distance=point?camera.position.distanceTo(new THREE.Vector3(point.x,point.y||0,point.z)):0;if(distance>95)return;
  let stereo=0;if(point){const dx=point.x-camera.position.x,dz=point.z-camera.position.z;stereo=THREE.MathUtils.clamp((dx*Math.cos(camera.rotation.y)-dz*Math.sin(camera.rotation.y))/Math.max(1,distance),-1,1);}if(type==='gun'&&impactAudio?.play('gun-'+(kind||'rifle'),.95/(1+distance*.055),stereo))return;if(type==='step'){const wood=TOWERS.some(t=>Math.hypot(t.x-camera.position.x,t.z-camera.position.z)<4&&Math.abs(camera.position.y-t.baseY-t.height-1.7)<.5)||Math.abs(camera.position.x)<15&&Math.abs(camera.position.z)<15;if(impactAudio?.play(wood?'step-wood':'step-dirt',.18,0))return;}
  const gain=audio.createGain(),pan=audio.createStereoPanner(),duration=type==='gun'?.18:type==='step'?.12:.65;
  const volume=(type==='gun'?.35:type==='step'?.035:.24)/(1+distance*.09);
  gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
  if(point){const dx=point.x-camera.position.x,dz=point.z-camera.position.z;pan.pan.value=THREE.MathUtils.clamp((dx*Math.cos(camera.rotation.y)-dz*Math.sin(camera.rotation.y))/Math.max(1,distance),-1,1);}
  gain.connect(pan);pan.connect(audio.destination);
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*4);
  const source=audio.createBufferSource();source.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='gun'?2200:type==='step'?360:650;source.connect(filter);filter.connect(gain);source.start();source.stop(audio.currentTime+duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};
  if(type!=='step'){const oscillator=audio.createOscillator();oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(type==='gun'?130:85,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(type==='gun'?40:35,audio.currentTime+duration);oscillator.connect(gain);oscillator.start();oscillator.stop(audio.currentTime+duration);}
 }
 function shot(event){
  sound('gun',event.from,event.weapon);const from=new THREE.Vector3(event.from.x,event.from.y,event.from.z),to=new THREE.Vector3(event.to.x,event.to.y,event.to.z);
  // Match marks to rendered surfaces; never raycast thousands of grass instances.
  if(event.surface&&event.normal)impact(to,new THREE.Vector3(event.normal.x,event.normal.y,event.normal.z));
  if(!event.targetId&&event.surface===undefined){const direction=to.clone().sub(from),distance=direction.length(),ray=new THREE.Raycaster(from,direction.normalize(),.1,distance+.5),candidates=[];
   function walk(o,actor=false){actor=actor||!!o.userData.thermalRole;if(o.isMesh&&(!o.isInstancedMesh||o.count<6000&&!o.material?.userData.foliage)&&!actor&&o.visible&&o.material?.opacity!==0&&o!==camera)candidates.push(o);if(o!==camera)for(const child of o.children)walk(child,actor);}
   scene.updateMatrixWorld(true);walk(scene);const hit=ray.intersectObjects(candidates,false)[0];if(hit){to.copy(hit.point);const matrix=hit.object.matrixWorld.clone();if(hit.instanceId!==undefined){const instance=new THREE.Matrix4();hit.object.getMatrixAt(hit.instanceId,instance);matrix.multiply(instance);}const normal=hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(matrix)).normalize();impact(to,normal);}
  }
  // Start below/right of the eye so the shot is visible while aiming straight ahead.
  const start=from.clone().add(new THREE.Vector3(.08,-.08,-.18).applyQuaternion(camera.quaternion));
  const tracer=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,to]),new THREE.LineBasicMaterial({color:0xffe4a2,transparent:true,opacity:.95,depthTest:true}));tracer.userData.scopeEffect=true;scene.add(tracer);traces.push({object:tracer,life:.12});
 }
 function impact(point,normal){const mark=new THREE.Mesh(new THREE.CircleGeometry(.065+Math.random()*.035,10),new THREE.MeshBasicMaterial({color:0x171313,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}));mark.position.copy(point).addScaledVector(normal,.008);mark.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);mark.userData.scopeEffect=true;scene.add(mark);marks.push(mark);if(marks.length>120)dispose(marks.shift());}
 function dispose(o){scene.remove(o);o.geometry?.dispose();o.material?.dispose();}
 function wound(obj){if(!obj)return;const patch=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),new THREE.MeshStandardMaterial({color:0x571d25,roughness:1}));patch.scale.z=.2;patch.position.set((Math.random()-.5)*.3,1.1+Math.random()*.5,.4);obj.add(patch);}
 function corpse(data,obj){if(bodies.has(data.id))return;obj.userData.model.visible=true;obj.position.set(data.x,data.y+.3,data.z);obj.rotation.set(0,data.yaw||0,0);obj.userData.thermalRole='corpse';
  const wound=new THREE.Mesh(new THREE.SphereGeometry(.19,10,6),new THREE.MeshStandardMaterial({color:0x571d25,roughness:.95}));wound.scale.set(1,1.4,.25);wound.position.set(.16,1.35,.38);obj.add(wound);bodies.set(data.id,{object:obj,fall:0});sound('death',data);
 }
 function syncCorpses(data,make,live){const ids=new Set(data.map(d=>d.id));for(const d of data)if(!bodies.has(d.id)){const obj=live.get(d.id)||make(d);live.delete(d.id);corpse(d,obj);}for(const [id,b]of bodies)if(!ids.has(id)){scene.remove(b.object);bodies.delete(id);}}
 function update(dt,yaw,aliens,alive=true,grounded=true){
  const degree=compassDegrees(yaw),labels=['N','NE','E','SE','S','SW','W','NW'];compass.textContent=labels[Math.round(degree/45)%8]+'  '+Math.round(degree)%360+'°   |   '+[-60,-30,0,30,60].map(offset=>{const d=(degree+offset+360)%360;return labels[Math.round(d/45)%8];}).join('     ');
  for(let i=traces.length-1;i>=0;i--){traces[i].life-=dt;if(traces[i].life<=0){dispose(traces[i].object);traces.splice(i,1);}}
  for(const b of bodies.values()){b.fall=Math.min(1,b.fall+dt*1.8);b.object.rotation.z=b.fall*Math.PI*.48;}
  stepClock+=dt;if(previous&&alive&&grounded){const distance=Math.hypot(camera.position.x-previous.x,camera.position.z-previous.z);if(distance<2)walk+=distance;if(walk>2&&stepClock>.28){walk=0;stepClock=0;sound('step');}}previous=camera.position.clone();
  growl-=dt;if(growl<=0){growl=3+Math.random()*3;let nearest;for(const obj of aliens.values())if(!nearest||camera.position.distanceTo(obj.position)<camera.position.distanceTo(nearest.position))nearest=obj;if(nearest&&camera.position.distanceTo(nearest.position)<45)sound('alien',nearest.position);}
 }
 return {shot,sound,update,syncCorpses,wound};
}
