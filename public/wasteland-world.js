import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import * as THREE from './vendor/three.module.js';
import {createMapPhysics} from './map-physics.js';
import {SAFE_HOUSES} from './hunt-rules.js';
export async function addWasteland(world){
 const responses=await Promise.all([fetch('/assets/map-collision.json'),fetch('/assets/wasteland-props.json')]);if(responses.some(r=>!r.ok))throw new Error('Wasteland data unavailable');const map=createMapPhysics(await responses[0].json()),props=await responses[1].json();
 const mats={rust:new THREE.MeshStandardMaterial({color:0x805139,metalness:.5,roughness:.85}),steel:new THREE.MeshStandardMaterial({color:0x485954,metalness:.6,roughness:.65}),cream:new THREE.MeshStandardMaterial({color:0xaca58a,roughness:.8}),dark:new THREE.MeshStandardMaterial({color:0x202d2c,roughness:.9}),cyan:new THREE.MeshStandardMaterial({color:0x5bcac1,emissive:0x2a6d66,emissiveIntensity:.7}),glass:new THREE.MeshStandardMaterial({color:0x254a51,metalness:.4,roughness:.15}),red:new THREE.MeshStandardMaterial({color:0xbb633c,emissive:0x4b1405,emissiveIntensity:.5})};
 function box(parent,x,y,z,w,h,d,mat='steel'){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats[mat]);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cylinder(parent,x,y,z,radius,length,mat='rust',axis='z'){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,12),mats[mat]);if(axis==='z')m.rotation.x=Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
 function label(parent,text,x,y,z,size=3){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#132420';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#b8b395';ctx.lineWidth=8;ctx.strokeRect(8,8,496,112);ctx.fillStyle='#e2d4ac';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.fillText(text,256,78);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size/4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 // Terrain outside the original 160 m map. The shared function joins its boundary.
 const positions=[],uvs=[];const step=4;
 for(let z=-240;z<240;z+=step)for(let x=-240;x<240;x+=step){if(x>=-80&&x<80&&z>=-80&&z<80)continue;for(const [dx,dz] of [[0,0],[0,step],[step,0],[step,0],[0,step],[step,step]]){const xx=x+dx,zz=z+dz;positions.push(xx,map.ground(xx,zz),zz);uvs.push(xx/12,zz/12);}}
 const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));terrainGeo.computeVertexNormals();const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({color:0x526044,roughness:1}));const normals=[];for(let i=0;i<positions.length;i+=3){const x=positions[i],z=positions[i+2],n=new THREE.Vector3(map.ground(x-.5,z)-map.ground(x+.5,z),1,map.ground(x,z-.5)-map.ground(x,z+.5)).normalize();normals.push(n.x,n.y,n.z);}terrainGeo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));terrain.userData.surface='soil';terrain.receiveShadow=true;world.add(terrain);
 const dummy=new THREE.Object3D();
 const crowns=[];for(let c=0;c<5;c++){const g=new THREE.SphereGeometry(c===0?.8:.58,8,6);const a=c*Math.PI*.5;g.translate(c===0?0:Math.sin(a)*.57,c===0?.18:-.12,c===0?0:Math.cos(a)*.57);crowns.push(g);}const crownGeo=mergeGeometries(crowns);crowns.forEach(g=>g.dispose());
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.6,1,1,7),mats.dark,props.trees.length),canopies=new THREE.InstancedMesh(crownGeo,new THREE.MeshStandardMaterial({color:0x39593b,roughness:1}),props.trees.length);
 props.trees.forEach((t,i)=>{const y=map.ground(t.x,t.z);dummy.position.set(t.x,y+t.h/2,t.z);dummy.rotation.set(0,0,0);dummy.scale.set(t.r,t.h,t.r);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=y+t.h;dummy.scale.set(4.3,2.4,4.3);dummy.updateMatrix();canopies.setMatrixAt(i,dummy.matrix);});trunks.material=trunks.material.clone();trunks.userData.surface='bark';trunks.castShadow=true;trunks.receiveShadow=true;canopies.castShadow=true;canopies.receiveShadow=true;const cp=canopies.geometry.attributes.position;for(let v=0;v<cp.count;v++){const x=cp.getX(v),y=cp.getY(v),z=cp.getZ(v),f=1+.16*Math.sin(x*13+y*9)*Math.cos(z*11-y*6);cp.setXYZ(v,x*f,y*f,z*f);}cp.needsUpdate=true;canopies.geometry.computeVertexNormals();world.add(trunks,canopies);
 const leafPos=[],leafIndices=[];for(let i=0;i<8;i++){const t=i/7,w=.36*Math.sin(t*Math.PI);leafPos.push(-w,t*1.9,.3*Math.sin(t*Math.PI),w,t*1.9,.3*Math.sin(t*Math.PI));if(i<7){const k=i*2;leafIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafPos,3));const leafUV=[];for(let i=0;i<8;i++)leafUV.push(0,i/7,1,i/7);leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute(leafUV,2));leafGeo.setIndex(leafIndices);leafGeo.computeVertexNormals();
 const shrubs=new THREE.InstancedMesh(leafGeo,new THREE.MeshStandardMaterial({color:0x517549,roughness:.8,side:THREE.DoubleSide}),props.shrubs.length*5);
 props.shrubs.forEach((p,i)=>{for(let k=0;k<5;k++){dummy.position.set(p.x,map.ground(p.x,p.z)+.02,p.z);dummy.rotation.set(.6,k*Math.PI*2/5+i,0);dummy.scale.set(p.size,p.size,p.size);dummy.updateMatrix();shrubs.setMatrixAt(i*5+k,dummy.matrix);}});shrubs.userData.surface='leaf';shrubs.receiveShadow=true;shrubs.material.userData.foliage=true;world.add(shrubs);
 for(const h of SAFE_HOUSES){
  const house=new THREE.Group();house.position.set(h.x,map.ground(h.x,h.z),h.z);house.name=h.name;
  for(const x of [-6,6])box(house,x,2.2,0,.35,4.4,12,'cream');
  for(const z of [-6,6]){for(const x of [-3.8,3.8])box(house,x,2.2,z,4.4,4.4,.35,'cream');box(house,0,3.85,z,3.2,1.1,.35,'steel');for(const x of [-1.6,1.6])box(house,x,1.65,z+(z>0?.2:-.2),.07,3.2,.07,'cyan');}
  box(house,0,-.04,0,12,.16,12,'dark');box(house,0,4.5,0,12.8,.3,12.8,'rust');
  for(const x of [-5.9,5.9])for(let z=-5;z<=5;z+=2)box(house,x,2.0,z,.12,4.1,.12,'steel');
  box(house,-4.8,1.1,-2,1,2.2,2,'steel');for(let y=.4;y<2;y+=.5)box(house,-4.25,y,-2,.06,.03,1.7,'rust');
  box(house,4.5,.9,-2,1.5,.15,3,'cream');for(const z of [-3,-1])cylinder(house,4.5,.45,z,.06,.9,'steel','y');
  box(house,4.5,1.45,-2,1,.7,.1,'dark');box(house,4.5,1.45,-1.94,.8,.5,.03,'cyan');
  for(const y of [.45,1.65]){box(house,-3.8,y,2,2,.18,3,'steel');box(house,-3.8,y+.15,2,1.8,.22,2.8,'cream');box(house,-3.8,y+.3,.9,1.5,.15,.45,'dark');}
  for(const x of [-4.7,-2.9])for(const z of [.6,3.4])cylinder(house,x,1.0,z,.045,2.0,'steel','y');
  for(let i=0;i<6;i++){box(house,3.8+i*.12,1.08,-2.4,.08,.2,.16,i%2?'red':'cyan');}
  label(house,h.name,0,3.9,6.24,4);label(house,'SAFE • MEDICAL • AMMO',0,2.8,-5.78,4);box(house,0,4.28,0,5,.06,.2,'cyan');
  // Warm interior fixture; emissive strips remain visible on low light counts.
  const lamp=new THREE.PointLight(0xffdba0,30,11);lamp.position.set(0,3,0);house.add(lamp);world.add(house);
 }
 for(const w of props.wrecks){const g=new THREE.Group();g.position.set(w.x,map.ground(w.x,w.z),w.z);g.rotation.y=w.angle;
  box(g,0,.75,0,2.1,.9,4.8,'rust');box(g,0,1.45,-.25,1.85,.65,2.1,'steel');box(g,0,1.65,.7,1.5,.3,.04,'glass');box(g,0,1.25,1.65,1.95,.2,1.2,'cream').rotation.z=.16;
  for(const x of [-1.05,1.05])for(const z of [-1.45,1.45]){const tire=cylinder(g,x,.48,z,.48,.3,'dark','y');tire.rotation.z=Math.PI/2;}
  for(const x of [-.7,.7])box(g,x,.85,2.43,.35,.15,.08,'cream');box(g,0,.44,2.46,2.2,.2,.1,'steel');
  const door=box(g,1.3,1.05,.2,.08,.9,1.4,'rust');door.rotation.y=.7;for(let i=0;i<4;i++)box(g,-.8+i*.5,.1,3+i*.6,.7,.08,.4,'rust').rotation.y=i;
  world.add(g);
 }
 for(const s of props.ships){const g=new THREE.Group();g.position.set(s.x,map.ground(s.x,s.z),s.z);g.rotation.set(.07,s.angle,-.13);
  const hull=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.8,18,14,1,true),mats.steel);hull.rotation.x=Math.PI/2;hull.position.y=2.2;g.add(hull);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(2.1,6,14),mats.cream);nose.rotation.x=Math.PI/2;nose.position.set(0,2.2,12);g.add(nose);
  box(g,0,3.6,8,2.8,.7,3,'glass');
  for(const side of [-1,1]){const wing=box(g,side*5,1.5,-1,7,.22,7,'rust');wing.rotation.y=side*.28;wing.rotation.z=side*.14;
   cylinder(g,side*2.7,2,-10,1.2,5,'dark');cylinder(g,side*2.7,2,-12.6,1.0,.2,'rust');
   for(let j=0;j<4;j++)box(g,side*3.9,2.1,-11+j*.7,.2,.12,.4,'cream');}
  for(let z=-7;z<7;z+=3){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.65,.06,5,18),mats.rust);ring.position.set(0,2.2,z);g.add(ring);}
  for(let i=0;i<8;i++){const panel=box(g,-8+i*2,.1,14+(i%3)*2,1.8,.1,2,'rust');panel.rotation.y=i*.8;}
  label(g,'ORBITAL SURVEY • 07',0,4.92,0,5).rotation.x=-Math.PI/2;world.add(g);
 }
 // Dirt road strips from the core to distant shelters, kept clear of trees.
 const roadMat=new THREE.MeshStandardMaterial({color:0x746a4d,roughness:1});const roadPos=[];
 for(const axis of [0,1])for(const sign of [-1,1])for(let t=80;t<234;t+=3){const a=t*sign,b=(t+3)*sign;for(const [v,w] of [[a,-2],[b,-2],[a,2],[a,2],[b,-2],[b,2]]){const x=axis?v:w,z=axis?w:v;roadPos.push(x,map.ground(x,z)+.05,z);}}
 const road=new THREE.BufferGeometry();road.setAttribute('position',new THREE.Float32BufferAttribute(roadPos,3));road.computeVertexNormals();roadMat.side=THREE.DoubleSide;world.add(new THREE.Mesh(road,roadMat));
 return map;
}
