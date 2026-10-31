import {regionAt,biomeWeights,REGIONS} from './expansion-rules.js';
import * as THREE from './vendor/three.module.js';
import {scenicHeight} from './boundary-blend.js';
export function ridgeHeight(x,z){return scenicHeight(x,z)+12;}
export function addForestVista(scene){
 const landscape=new THREE.Group();landscape.name='Distant forest and mountain ridges';
 const positions=[],uvs=[],normals=[],colors=[],palette=REGIONS.map(r=>new THREE.Color(r.color));
 function grid(limit,step,hole){for(let z=-limit;z<limit;z+=step)for(let x=-limit;x<limit;x+=step){if(x>=-hole&&x<hole&&z>=-hole&&z<hole)continue;for(const [dx,dz]of [[0,0],[0,step],[step,0],[step,0],[0,step],[step,step]]){const xx=x+dx,zz=z+dz;positions.push(xx,scenicHeight(xx,zz),zz);uvs.push(xx/12,zz/12);const weights=biomeWeights(xx,zz),color=new THREE.Color(0,0,0);for(let k=0;k<4;k++){color.r+=palette[k].r*weights[k];color.g+=palette[k].g*weights[k];color.b+=palette[k].b*weights[k];}colors.push(color.r,color.g,color.b);const n=new THREE.Vector3(scenicHeight(xx-.5,zz)-scenicHeight(xx+.5,zz),1,scenicHeight(xx,zz-.5)-scenicHeight(xx,zz+.5)).normalize();normals.push(n.x,n.y,n.z);}}}
 grid(384,16,320);grid(1024,64,384);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1}));ground.userData.surface='rock';ground.receiveShadow=true;landscape.add(ground);
 const count=1500,crowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),new THREE.MeshStandardMaterial({color:0x354b38,roughness:1}),count);
 const d=new THREE.Object3D(),c=new THREE.Color();let used=0;
 const rand=i=>{const v=Math.sin(i*91.117+17.41)*43758.5453;return v-Math.floor(v);};
 for(let i=0;i<count*2&&used<count;i++){
  const x=(rand(i*3)-.5)*1900,z=(rand(i*3+1)-.5)*1900;
  if(Math.max(Math.abs(x),Math.abs(z))<340)continue;
  const size=6+rand(i*3+2)*9;d.position.set(x,ridgeHeight(x,z)-12+size*.8,z);d.scale.set(size*.62,size,size*.65);d.rotation.y=rand(i+5)*6.28;d.updateMatrix();crowns.setMatrixAt(used,d.matrix);
  c.setHSL(.25+rand(i+10)*.07,.16+rand(i+20)*.15,.16+rand(i+30)*.11);crowns.setColorAt(used,c);used++;
 }
 // A varied band of full-height trees carries the near forest across the border.
 const borderCount=120,trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.24,.42,1,6),new THREE.MeshStandardMaterial({color:0x403f32,roughness:1}),borderCount),borderCrowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshStandardMaterial({color:0x39593b,roughness:1}),borderCount);
 for(let i=0;i<borderCount;i++){const side=i%4,along=(rand(i+22000)-.5)*960,depth=325+rand(i+33000)*100,x=side===0?depth:side===1?-depth:along,z=side===2?depth:side===3?-depth:along,h=10+rand(i+44000)*13,y=scenicHeight(x,z);d.position.set(x,y+h*.5,z);d.scale.set(.9,h,.9);d.updateMatrix();trunks.setMatrixAt(i,d.matrix);d.position.y=y+h;d.scale.set(3+rand(i+11000)*2,2.5+rand(i+12000)*2,3+rand(i+13000)*2);d.updateMatrix();borderCrowns.setMatrixAt(i,d.matrix);}
 landscape.add(trunks,borderCrowns);
 crowns.count=used;crowns.instanceMatrix.needsUpdate=true;crowns.instanceColor.needsUpdate=true;landscape.add(crowns);scene.add(landscape);return landscape;
}
