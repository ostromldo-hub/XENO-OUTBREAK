import * as THREE from './vendor/three.module.js';
export const QUALITY={performance:{label:'PERFORMANCE',ratio:.65,far:520,grass:800,rain:240,shadows:false},balanced:{label:'BALANCED',ratio:1,far:900,grass:5000,rain:900,shadows:false},high:{label:'HIGH',ratio:1.4,far:1400,grass:9000,rain:1400,shadows:true}};
let mode='performance';try{const saved=localStorage.getItem('xeno-graphics');if(QUALITY[saved])mode=saved;}catch{}
export function quality(){return QUALITY[mode];}
export function splitInstances(source,size=128){const cells=new Map(),matrix=new THREE.Matrix4(),color=new THREE.Color();for(let i=0;i<source.count;i++){source.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/size)+','+Math.floor(matrix.elements[14]/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);}const chunks=[];for(const indices of cells.values()){const part=new THREE.InstancedMesh(source.geometry,source.material,indices.length);part.position.copy(source.position);part.quaternion.copy(source.quaternion);part.scale.copy(source.scale);part.layers.mask=source.layers.mask;part.renderOrder=source.renderOrder;part.castShadow=source.castShadow;part.receiveShadow=source.receiveShadow;part.userData={...source.userData,chunked:true};for(let i=0;i<indices.length;i++){source.getMatrixAt(indices[i],matrix);part.setMatrixAt(i,matrix);if(source.instanceColor){source.getColorAt(indices[i],color);part.setColorAt(i,color);}}part.computeBoundingSphere();part.computeBoundingBox();chunks.push(part);}return chunks;}
export function createPerformanceMode(scene,camera,renderer){
 const button=document.createElement('button');button.id='graphics-mode';document.body.appendChild(button);let elapsed=0,frames=0,scan=1,fps=0;const pending=[],patches=[];let cullElapsed=0;const center=new THREE.Vector3();const seen=new WeakSet();
 function apply(){const q=quality();renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,q.ratio));renderer.shadowMap.enabled=q.shadows;camera.far=q.far;camera.updateProjectionMatrix();try{localStorage.setItem('xeno-graphics',mode);}catch{}button.textContent=q.label+' · F2';}
 function cycle(){mode=['performance','balanced','high'][(['performance','balanced','high'].indexOf(mode)+1)%3];apply();}
 button.onclick=cycle;document.addEventListener('keydown',e=>{if(e.code==='F2'){e.preventDefault();if(!e.repeat)cycle();}});apply();
 function update(dt){cullElapsed+=dt;if(cullElapsed>=.2){cullElapsed=0;for(const part of patches){part.updateWorldMatrix(true,false);center.copy(part.boundingSphere.center).applyMatrix4(part.matrixWorld);const reach=quality().far+part.boundingSphere.radius*Math.max(part.scale.x,part.scale.y,part.scale.z);part.visible=center.distanceToSquared(camera.position)<reach*reach;}}elapsed+=dt;scan+=dt;frames++;if(elapsed>=1){fps=Math.round(frames/elapsed);elapsed=0;frames=0;button.textContent=quality().label+' · '+fps+' FPS · F2';}
  if(scan>=2){scan=0;scene.traverse(o=>{if(o.isInstancedMesh&&o.count>256&&!o.userData.dynamicInstances&&!o.userData.chunked&&!seen.has(o)){seen.add(o);pending.push(o);}});}
  // Split at most one static batch per frame; then frustum-cull by forest patch.
  const source=pending.shift();if(source?.parent){const parent=source.parent;for(const part of splitInstances(source)){parent.add(part);patches.push(part);}parent.remove(source);source.dispose();}
 }
 return {update};
}
