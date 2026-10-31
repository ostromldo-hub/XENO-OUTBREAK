import * as THREE from './vendor/three.module.js';
import {TOWERS,towerColliders,nearbyLadder} from './tower-rules.js';
export function addLookoutTowers(scene){
 const group=new THREE.Group();group.name='Old timber lookout towers';
 const texture=new THREE.TextureLoader().load('/assets/realism/bark.jpg');texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,4);texture.colorSpace=THREE.SRGBColorSpace;
 const timber=new THREE.MeshStandardMaterial({color:0x8d8067,map:texture,roughness:1}),plank=new THREE.MeshStandardMaterial({color:0x7c7666,map:texture,roughness:1}),rungMat=new THREE.MeshStandardMaterial({color:0x696252,roughness:.9,metalness:.15});
 function box(x,y,z,w,h,d,mat=timber){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function beam(a,b,width=.13){const delta=b.clone().sub(a),o=new THREE.Mesh(new THREE.BoxGeometry(width,delta.length(),width),timber);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;group.add(o);}
 for(const c of towerColliders()){if(c.walkable)continue;if(c.name.includes('rail')){for(const y of [c.minY+.5,c.maxY-.05])box((c.minX+c.maxX)/2,y,(c.minZ+c.maxZ)/2,c.maxX-c.minX,.1,c.maxZ-c.minZ,plank);continue;}box((c.minX+c.maxX)/2,(c.minY+c.maxY)/2,(c.minZ+c.maxZ)/2,c.maxX-c.minX,c.maxY-c.minY,c.maxZ-c.minZ,c.name.includes('rail')?plank:timber);}
 for(const t of TOWERS){
  for(const x of [-2.3,2.3])for(const z of [-2.3,2.3])box(t.x+x,t.baseY+t.height+.55,t.z+z,.12,1.1,.12,plank);
  for(let i=0;i<15;i++)box(t.x-2.5+(i+.5)*5/15,t.baseY+t.height-.1,t.z,5/15-.012,.2,5,plank);
  for(let y=0;y<t.height-1;y+=5){const top=Math.min(t.height,y+5);for(const z of [-2.3,2.3]){beam(new THREE.Vector3(t.x-2.3,t.baseY+y,t.z+z),new THREE.Vector3(t.x+2.3,t.baseY+top,t.z+z));beam(new THREE.Vector3(t.x+2.3,t.baseY+y,t.z+z),new THREE.Vector3(t.x-2.3,t.baseY+top,t.z+z));}}
  // One straight ladder, from the ground through a gap in the upper guardrail.
  for(const x of [-.48,.48])box(t.x+x,t.baseY+(t.height+1)/2,t.z+2.8,.1,t.height+1,.12,timber);
  const rungCount=Math.ceil((t.height+.4)/.38),rungs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.045,.045,.98,8),rungMat,rungCount),dummy=new THREE.Object3D();for(let i=0;i<rungCount;i++){dummy.rotation.z=Math.PI/2;dummy.position.set(t.x,t.baseY+.3+i*.38,t.z+2.8);dummy.updateMatrix();rungs.setMatrixAt(i,dummy.matrix);}group.add(rungs);
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#403d30';ctx.fillRect(0,0,512,128);ctx.fillStyle='#d5c8a2';ctx.textAlign='center';ctx.font='bold 36px serif';ctx.fillText(t.name,256,51);ctx.font='24px serif';ctx.fillText('E — LADDER  /  W ↑  S ↓',256,96);const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.57),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(t.x+1.6,t.baseY+1.5,t.z+2.65);group.add(sign);
 }
 scene.add(group);const prompt=document.createElement('div');prompt.id='ladder-prompt';document.body.appendChild(prompt);
 return {sync(p){const tower=p.ladderId?TOWERS.find(t=>t.id===p.ladderId):nearbyLadder({...p,feetY:p.y});prompt.textContent=p.ladderId?'LADDER · W UP · S DOWN · SPACE LET GO':tower?'E — CLIMB '+tower.name+' LADDER':'';}};
}
