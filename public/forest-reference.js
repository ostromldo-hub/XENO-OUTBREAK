import {quality} from './performance-mode.js';
import {regionAt} from './expansion-rules.js';
import {scenicHeight} from './boundary-blend.js';
import * as THREE from './vendor/three.module.js';
import {createMapPhysics} from './map-physics.js';
import {SAFE_HOUSES} from './hunt-rules.js';
// Decorative terrain details; all solid gameplay surfaces remain authoritative.
export async function addReferenceForest(scene,camera){
 const response=await fetch('/assets/map-collision.json');if(!response.ok)return null;
 const map=createMapPhysics(await response.json());
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,.045,.28,.025,.045,.28,.025,.035,0,0,.07,.52,.06],3));geo.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({color:0x6d8346,roughness:.96,side:THREE.DoubleSide});mat.userData.foliage=true;
 const count=9000,grass=new THREE.InstancedMesh(geo,mat,count);grass.receiveShadow=true;grass.frustumCulled=false;grass.userData.dynamicInstances=true;scene.add(grass);
 const d=new THREE.Object3D(),color=new THREE.Color();let lastX=Infinity,lastZ=Infinity,index=0,updating=false,lastCount=0,initialized=0;
 const rand=i=>{const n=Math.sin(i*127.1+41.7)*43758.5453;return n-Math.floor(n);};
 function update(){
  const active=quality().grass;if(!updating){if(Math.hypot(camera.position.x-lastX,camera.position.z-lastZ)<12&&lastCount===active)return;lastX=camera.position.x;lastZ=camera.position.z;lastCount=active;index=0;updating=true;}const end=Math.min(active,index+300);
  for(let i=index;i<end;i++){
   const x=lastX+(rand(i*3)-.5)*100,z=lastZ+(rand(i*3+1)-.5)*100;
   const region=regionAt(x,z),dry=region?.id==='dunes'||region?.id==='ash';const clear=(dry&&rand(i+34)<Math.max(0,Math.min(1,(Math.max(Math.abs(x),Math.abs(z))-240)/180)))||Math.abs(x)<18&&Math.abs(z)<18||SAFE_HOUSES.some(h=>Math.abs(x-h.x)<8&&Math.abs(z-h.z)<8)||Math.max(Math.abs(x),Math.abs(z))<319&&map.blocked(x,z,.15);
   d.position.set(x,(Math.max(Math.abs(x),Math.abs(z))>320?scenicHeight(x,z):map.ground(x,z))-.015,z);d.rotation.set(0,rand(i+8)*Math.PI*2,0);d.scale.setScalar(clear?0:.55+rand(i+3)*.9);d.updateMatrix();grass.setMatrixAt(i,d.matrix);
   if(region?.id==='frost')color.setHSL(.2,.08,.5+rand(i+6)*.1);else color.setHSL(.22+rand(i+4)*.065,.32+rand(i+5)*.2,.3+rand(i+6)*.18);grass.setColorAt(i,color);
  }
  index=end;initialized=Math.max(initialized,end);grass.count=Math.min(active,initialized);if(index>=active)updating=false;grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;
 }
 update();return {update,grass};
}
