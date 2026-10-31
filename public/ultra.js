// Optional cinematic detail layer. Geometry is deterministic and client-only.
const rr=(i)=>{const v=Math.sin(i*91.117+17.41)*43758.5453;return v-Math.floor(v)};
export function addCinematicEnvironment(T,scene){
 const darkRock=new T.MeshStandardMaterial({color:0x35373b,roughness:.95,flatShading:true});
 const stone=new T.MeshStandardMaterial({color:0x59564f,roughness:1,flatShading:true});
 const bark=new T.MeshStandardMaterial({color:0x343c37,roughness:1});
 const leaf=new T.MeshStandardMaterial({color:0x38594e,side:T.DoubleSide,roughness:.9});
 const glow=new T.MeshStandardMaterial({color:0x4fcac2,emissive:0x19aeb6,emissiveIntensity:2.1});
 const coral=new T.MeshStandardMaterial({color:0x846c88,roughness:.75});
 const crystal=new T.MeshStandardMaterial({color:0x75c7cf,emissive:0x157e95,emissiveIntensity:.85,metalness:.25,roughness:.22,transparent:true,opacity:.83});
 // Ancient spires and layered eroded rock formations.
 for(let i=0;i<38;i++){
  const x=(rr(i*17+3)-.5)*72,z=(rr(i*17+5)-.5)*72;if(Math.hypot(x,z)<10)continue;
  const h=2.5+rr(i*17+8)*8;
  const pillar=new T.Mesh(new T.CylinderGeometry(.15+rr(i*11)*.65,.9+rr(i*11+2)*1.1,h,5,3),i%3?darkRock:stone);
  pillar.position.set(x,h*.38,z);pillar.rotation.z=(rr(i*13)-.5)*.42;pillar.rotation.x=(rr(i*14)-.5)*.35;pillar.castShadow=true;pillar.receiveShadow=true;scene.add(pillar);
  if(i%3===0){const cap=new T.Mesh(new T.DodecahedronGeometry(1.2+rr(i*8),0),darkRock);cap.position.set(x,h*.83,z);cap.scale.set(1.2,.5,1);scene.add(cap);}
 }
 // Alien fungal trees: branching silhouettes and translucent broad foliage.
 for(let i=0;i<42;i++){
  const x=(rr(i*31+4)-.5)*76,z=(rr(i*31+5)-.5)*76;if(Math.hypot(x,z)<11)continue;
  const height=3.5+rr(i*31+6)*7,group=new T.Group();group.position.set(x,0,z);
  const trunk=new T.Mesh(new T.CylinderGeometry(.1,.38,height,7),bark);trunk.position.y=height/2;trunk.castShadow=true;group.add(trunk);
  for(let j=0;j<7;j++){
   const angle=j*2.399+rr(i*31+7)*2,heightRatio=.35+rr(i*19+j)*.55;
   const branch=new T.Mesh(new T.CylinderGeometry(.03,.11,1.6+rr(j+i)*1.9,5),bark);
   branch.position.set(Math.sin(angle)*.65,height*heightRatio,Math.cos(angle)*.65);branch.rotation.z=Math.sin(angle)*.7;branch.rotation.x=Math.cos(angle)*.7;group.add(branch);
   const frond=new T.Mesh(new T.SphereGeometry(.65+rr(i+j)*.65,7,5),leaf);
   frond.scale.set(.8,.13,2.3);frond.position.set(Math.sin(angle)*1.5,height*heightRatio+.55,Math.cos(angle)*1.5);frond.rotation.y=angle;group.add(frond);
  }
  if(i%5===0){for(let k=0;k<4;k++){const orb=new T.Mesh(new T.SphereGeometry(.09,8,6),glow);orb.position.set(Math.sin(k*1.57)*.6,height*.7+k*.18,Math.cos(k*1.57)*.6);group.add(orb)}}
  scene.add(group);
 }
 // Bioluminescent mushrooms, crystalline deposits, low-growing spore pods.
 for(let i=0;i<210;i++){
  const x=(rr(i*23+1)-.5)*77,z=(rr(i*23+2)-.5)*77;if(Math.hypot(x,z)<8)continue;
  const g=new T.Group();g.position.set(x,0,z);const scale=.35+rr(i*23+3)*1.4;
  if(i%4===0){
   const shard=new T.Mesh(new T.ConeGeometry(.16*scale,1.7*scale,5),crystal);shard.position.y=.85*scale;shard.rotation.z=(rr(i+4)-.5)*.45;g.add(shard);
  }else{
   const stem=new T.Mesh(new T.CylinderGeometry(.035,.075,.5*scale,6),coral);stem.position.y=.25*scale;g.add(stem);
   const cap=new T.Mesh(new T.SphereGeometry(.25*scale,9,6),i%3===0?glow:leaf);cap.scale.y=.35;cap.position.y=.53*scale;g.add(cap);
  }
  scene.add(g);
 }
 // Dust / drifting spores. GPU points instead of individual meshes.
 const count=950,positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){positions[i*3]=(rr(i*5+1)-.5)*78;positions[i*3+1]=.3+rr(i*5+2)*14;positions[i*3+2]=(rr(i*5+3)-.5)*78;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));
 const spores=new T.Points(geo,new T.PointsMaterial({color:0x9ccac1,size:.09,transparent:true,opacity:.48,depthWrite:false}));spores.userData.spores=true;scene.add(spores);
 const mist=new T.PointLight(0x75d9bf,35,26,2);mist.position.set(16,3,-13);scene.add(mist);
 const rim=new T.DirectionalLight(0x9b8be9,1.5);rim.position.set(18,24,12);scene.add(rim);
 const ground=scene.children.find(x=>x.isMesh&&x.geometry?.type==='PlaneGeometry');if(ground)ground.receiveShadow=true;
}
export function addCreatureDetail(T,creature){
 const shell=new T.MeshStandardMaterial({color:0x343d36,roughness:.52,metalness:.12});
 const fang=new T.MeshStandardMaterial({color:0xb9b5a0,roughness:.8});
 const biolume=new T.MeshStandardMaterial({color:0x5bce98,emissive:0x1acb8b,emissiveIntensity:1.7});
 // Dorsal armor and paired horns emphasize the predator silhouette.
 for(let i=0;i<5;i++){
  const plate=new T.Mesh(new T.ConeGeometry(.22-i*.02,.46,5),shell);plate.position.set(0,1.7-i*.06,.62-i*.27);plate.rotation.x=-.65;creature.add(plate);
 }
 for(const side of [-1,1]){
  for(let i=0;i<3;i++){
   const spike=new T.Mesh(new T.ConeGeometry(.1,.3+i*.04,5),fang);
   spike.position.set(side*(.25+i*.12),1.66-i*.12,-.86+i*.12);spike.rotation.z=side*.55;creature.add(spike);
  }
  const gland=new T.Mesh(new T.SphereGeometry(.09,8,6),biolume);gland.position.set(side*.53,1.3,.1);creature.add(gland);
 }
 creature.traverse(o=>{if(o.isMesh)o.castShadow=true});
}
export function updateAtmosphere(scene,time,dt){
 const spores=scene.children.find(o=>o.userData?.spores);
 if(spores){spores.rotation.y+=dt*.002;spores.position.y=Math.sin(time*.12)*.3;}
}
