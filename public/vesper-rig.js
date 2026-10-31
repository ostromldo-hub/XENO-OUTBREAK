import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
const V=a=>new THREE.Vector3(...a);
function anatomy(){
 const defs=[['pelvis',-1,[0,1.65,-.3],[0,2.05,-.19]],['spine',0,[0,2.1,-.19],[0,3.18,-.08]],['neck',1,[0,3.18,-.08],[0,3.62,.43]],['head',2,[0,3.62,.43],[0,3.65,1.2]]];
 for(const s of [-1,1]){
  const n=defs.length;
  defs.push([`thigh${s}`,0,[s*.39,1.70,-.27],[s*.58,1.09,.18]],[`shin${s}`,n,[s*.58,1.09,.18],[s*.56,.47,-.42]],[`ankle${s}`,n+1,[s*.56,.47,-.42],[s*.58,.13,.18]],[`foot${s}`,n+2,[s*.58,.13,.18],[s*.58,.1,.67]]);
  const a=defs.length;
  defs.push([`arm${s}`,1,[s*.74,3.13,-.04],[s*1.06,2.36,.12]],[`elbow${s}`,a,[s*1.06,2.36,.12],[s*.99,1.68,.48]],[`hand${s}`,a+1,[s*.99,1.68,.48],[s*1,1.15,.75]]);
 }
 for(let i=0;i<6;i++){const t=i/6,u=(i+1)/6;const pos=t=>[Math.sin(t*3.5)*.45,1.65-t*.85+.12*Math.sin(t*5),-(.53+t*2.25)];defs.push([`tail${i}`,i?defs.length-1:0,pos(t),pos(u)]);}
 defs.push(['jaw',3,[0,3.49,.57],[0,3.37,1.25]],['mandible-1',3,[-.32,3.47,.76],[-.43,3.36,1.2]],['mandible1',3,[.32,3.47,.76],[.43,3.36,1.2]]);
 return defs;
}
const defs=anatomy();
function distanceToSegment(p,a,b){const d=b.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(d)/d.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(d,t));}
export function makeTemplate(source){
 source.updateMatrixWorld(true);const batches=new Map(),p=new THREE.Vector3();
 source.traverse(o=>{
  if(!o.isMesh)return;
  let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  const ids=new Uint16Array(g.attributes.position.count*4),weights=new Float32Array(ids.length),name=o.name.toLowerCase();
  let fixed=-1;g.computeBoundingBox();const center=g.boundingBox.getCenter(new THREE.Vector3());const jawIndex=defs.findIndex(d=>d[0]==='jaw');
  if(/mandible/.test(name))fixed=defs.findIndex(d=>d[0]==='mandible'+(center.x<0?-1:1));else if(/jaw/.test(name)||(/tooth/.test(name)&&center.y<3.43))fixed=jawIndex;else if(/eye|pupil|brow|nostril|tooth/.test(name))fixed=3;
  else if(/costal|pectoral|nodule|scapular|shoulder|dorsal|vertebral/.test(name))fixed=1;
  for(let i=0;i<g.attributes.position.count;i++){
   p.fromBufferAttribute(g.attributes.position,i);
   if(fixed>=0){ids[i*4]=fixed;weights[i*4]=1;continue;}
   const candidates=defs.map((d,k)=>({k,dist:distanceToSegment(p,V(d[2]),V(d[3]))})).sort((a,b)=>a.dist-b.dist);
   const first=candidates[0],second=candidates[1];const a=1/Math.pow(.04+first.dist,6),b=1/Math.pow(.04+second.dist,6);
   ids[i*4]=first.k;ids[i*4+1]=second.k;weights[i*4]=a/(a+b);weights[i*4+1]=b/(a+b);
  }
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  for(const attr of Object.keys(g.attributes))if(!['position','normal','uv','skinIndex','skinWeight'].includes(attr))g.deleteAttribute(attr);
  const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,geometries:[]});batches.get(key).geometries.push(g);
 });
 const groups=[];for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries);if(!geometry)throw new Error('Cannot skin Vesper geometry');groups.push({geometry,material:batch.material});batch.geometries.forEach(g=>g.dispose());}
 return groups;
}
export function createRig(template){
 const group=new THREE.Group(),bones=defs.map(d=>{const b=new THREE.Bone();b.name=d[0];return b;});
 defs.forEach((d,i)=>{bones[i].position.copy(V(d[2]));if(d[1]>=0){bones[i].position.sub(V(defs[d[1]][2]));bones[d[1]].add(bones[i]);}else group.add(bones[i]);});
 group.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();
 for(const {geometry,material} of template){const mesh=new THREE.SkinnedMesh(geometry,material);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);mesh.bind(skeleton,new THREE.Matrix4());}
 group.scale.setScalar(.69);group.userData={bones,skeleton,phase:0,activity:0,attack:0};return group;
}
export function animateRig(group,dt,moving,attacking,seed=0,charging=false){
 const d=group.userData;if(!d.bones)return;
 d.activity+=(Number(moving)-d.activity)*(1-Math.exp(-dt*10));d.attack+=(Number(attacking)-d.attack)*(1-Math.exp(-dt*12));
 d.phase+=dt*(charging?12:moving?8.5:2.2);const t=d.phase+seed*.43;
 for(const b of d.bones)b.rotation.set(0,0,0);
 for(const side of [-1,1]){
  const phase=t+(side<0?Math.PI:0),stride=Math.sin(phase)*d.activity;
  const bone=name=>d.bones.find(b=>b.name===name+side);
  bone('thigh').rotation.x=stride*.48;
  bone('shin').rotation.x=-Math.max(0,Math.cos(phase))*.75*d.activity;
  bone('ankle').rotation.x=-stride*.22+Math.max(0,Math.cos(phase))*.4*d.activity;
  bone('foot').rotation.x=-stride*.12;
  const swipe=Math.sin(t*1.7+(side<0?Math.PI:0));
  bone('arm').rotation.x=-stride*.34-d.attack*(.85+swipe*.50);
  bone('arm').rotation.z=side*(.05+d.attack*.22);
  bone('elbow').rotation.x=-.1-Math.max(0,-stride)*.25-d.attack*(.4-swipe*.25);
  bone('hand').rotation.x=Math.sin(t)*.08;
 }
 d.bones[1].rotation.y=Math.sin(t)*.045*d.activity;d.bones[3].rotation.y=-Math.sin(t)*.04*d.activity;
 const bite=.5+.5*Math.sin(t*2.6);d.bones.find(b=>b.name==='jaw').rotation.x=.055+d.attack*(.12+bite*.7);for(const side of [-1,1])d.bones.find(b=>b.name==='mandible'+side).rotation.y=side*(.04+d.attack*bite*.38);d.bones[2].rotation.x=-d.attack*bite*.14;
 for(let i=0;i<6;i++)d.bones.find(b=>b.name===`tail${i}`).rotation.y=Math.sin(t*.5-i*.5)*(.035+i*.012);
 group.position.y=.05+Math.sin(t*2)*.025*d.activity;group.rotation.z=Math.sin(t)*.012*d.activity;
}
