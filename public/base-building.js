import * as THREE from './vendor/three.module.js';
export async function addBuilding(world){
 const response=await fetch('/assets/base-building.json');if(!response.ok)throw new Error('Building layout could not load');const data=await response.json();
 const materials={wall:new THREE.MeshStandardMaterial({color:0x42606a,metalness:.45,roughness:.5}),trim:new THREE.MeshStandardMaterial({color:0x172e39,metalness:.7,roughness:.4}),light:new THREE.MeshStandardMaterial({color:0x52edee,emissive:0x39d9df,emissiveIntensity:2}),screen:new THREE.MeshStandardMaterial({color:0x174653,emissive:0x126474,emissiveIntensity:.7})};
 const room=new THREE.Group();room.name='Enterable research habitat';
 for(const b of data.boxes){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...b.size),materials[b.material]);mesh.name=b.name;mesh.position.set(...b.position);mesh.receiveShadow=true;room.add(mesh);}
 const lamp=new THREE.PointLight(0x9ceeff,65,14,2);lamp.position.set(11,3.1,-9);room.add(lamp);world.add(room);
 return room;
}
// Cut out terrain hidden beneath the extraction slab: no coplanar terrain/pad faces.
export function removeUnderPad(geometry,halfSize=16){
 const pos=geometry.attributes.position,keep=[];
 for(let i=0;i<pos.count;i+=3){const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;if(Math.abs(x)<halfSize-1e-4&&Math.abs(z)<halfSize-1e-4)continue;keep.push(i,i+1,i+2);}
 geometry.setIndex(keep);const result=geometry.toNonIndexed();geometry.dispose();return result;
}
