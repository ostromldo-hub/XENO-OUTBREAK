import {buildHuman,animateHuman} from './human-model.js';
import * as THREE from './vendor/three.module.js';
import {createMapPhysics} from './map-physics.js';
export async function addJungle(world){
 const [a,b]=await Promise.all([fetch('/assets/jungle-expansion.json'),fetch('/assets/map-collision.json')]);if(!a.ok||!b.ok)throw new Error('Expanded jungle data unavailable');
 const extras=await a.json(),map=createMapPhysics(await b.json()),dummy=new THREE.Object3D();
 const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x465147,roughness:.93,flatShading:true}),extras.rocks.length);
 extras.rocks.forEach((r,i)=>{dummy.position.set(r.x,map.ground(r.x,r.z)+r.h/2,r.z);dummy.rotation.set(0,0,0);dummy.scale.set(r.w,r.h/2,r.d);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);});rocks.userData.surface='rock';rocks.castShadow=true;rocks.receiveShadow=true;world.add(rocks);
 const vertices=[],uvs=[];
 for(let i=0;i<7;i++){const t=i/6,width=.32*Math.sin(Math.PI*t);vertices.push(-width,t*1.6,.22*Math.sin(Math.PI*t),width,t*1.6,.22*Math.sin(Math.PI*t));uvs.push(0,t,1,t);}
 const indices=[];for(let i=0;i<6;i++){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const plants=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0x517549,roughness:.75,side:THREE.DoubleSide}),extras.plants.length*6);
 extras.plants.forEach((p,i)=>{for(let k=0;k<6;k++){dummy.position.set(p.x,map.ground(p.x,p.z)+.02,p.z);dummy.rotation.set(.65, p.angle+k*Math.PI/3,0);dummy.scale.set(p.size,p.size,p.size);dummy.updateMatrix();plants.setMatrixAt(i*6+k,dummy.matrix);}});plants.userData.surface='leaf';plants.receiveShadow=true;plants.material.userData.foliage=true;world.add(plants);
 // Raised, terrain-conforming dirt patches avoid coplanar ground flicker.
 const pathGeo=new THREE.PlaneGeometry(3.6,1.8,4,3);pathGeo.rotateX(-Math.PI/2);
 const pathMat=new THREE.MeshStandardMaterial({color:0x64563a,roughness:1});
 const combinedPos=[],combinedNormals=[];
 for(const p of extras.paths){const g=pathGeo.toNonIndexed(),pos=g.attributes.position;const angle=Math.abs(Math.hypot(p.x,p.z)-44)<1?Math.atan2(p.x,p.z):p.z===0?Math.PI/2:0;
  const c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)*c+pos.getZ(i)*s+p.x,z=-pos.getX(i)*s+pos.getZ(i)*c+p.z;combinedPos.push(x,map.ground(x,z)+.045,z);}g.dispose();}
 const pathGeometry=new THREE.BufferGeometry();pathGeometry.setAttribute('position',new THREE.Float32BufferAttribute(combinedPos,3));pathGeometry.computeVertexNormals();world.add(new THREE.Mesh(pathGeometry,pathMat));pathGeo.dispose();
}
export function createMarine(world,name,faction='ally'){
 const group=buildHuman(faction);const {legs,muzzle}=group.userData;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(2.2,.55,1);sprite.position.y=2.45;group.add(sprite);
 Object.assign(group.userData,{canvas,texture,lastHp:null,name,faction,thermalRole:faction==='hostile'?'hostile':'ally'});world.add(group);return group;
}
export function updateMarine(group,n,time,dt){
 const d=group.userData;if(!d.target)group.position.set(n.x,n.y,n.z);d.target=new THREE.Vector3(n.x,n.y,n.z);group.position.lerp(d.target,1-Math.exp(-dt*14));group.rotation.y=n.yaw;group.rotation.z=n.hp<=0?1.4:0;
 animateHuman(group,n.moving&&n.hp>0,n.shooting&&n.hp>0,time);
 if(d.lastHp!==n.hp){d.lastHp=n.hp;const ctx=d.canvas.getContext('2d');ctx.clearRect(0,0,256,64);ctx.fillStyle='#081923cc';ctx.fillRect(0,0,256,64);ctx.font='bold 23px sans-serif';ctx.fillStyle=n.hp>0?'#94ffde':'#ff9966';ctx.fillText(n.name+(n.hp>0?(d.faction==='hostile'?' — ENEMY':' — ALLY'):' — DOWN'),10,27);ctx.fillStyle='#203c3e';ctx.fillRect(10,40,236,12);ctx.fillStyle='#57dbac';ctx.fillRect(10,40,236*Math.max(0,n.hp)/100,12);d.texture.needsUpdate=true;}
}
export function shotTracer(world,event){
 const from=new THREE.Vector3(event.from.x,event.from.y,event.from.z),to=new THREE.Vector3(event.to.x,event.to.y,event.to.z),geo=new THREE.BufferGeometry().setFromPoints([from,to]),mat=new THREE.LineBasicMaterial({color:0xffdf95,transparent:true,opacity:.8});const line=new THREE.Line(geo,mat);world.add(line);setTimeout(()=>{world.remove(line);geo.dispose();mat.dispose();},100);
}
