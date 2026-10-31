import * as THREE from './vendor/three.module.js';

const styledMaterials=new WeakSet();

// Preserve standard material maps, skinning, instancing, fog and local lights.
// A shared clock animates foliage without allocating per-frame materials.
export function styleMaterial(material,clock){
 if(!material?.isMeshStandardMaterial||styledMaterials.has(material))return false;
 styledMaterials.add(material);
 const wind=!!material.userData.foliage;
 material.roughness=Math.max(.8,material.roughness);material.metalness=Math.min(.18,material.metalness);
 material.normalScale?.multiplyScalar(.28);
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.uniforms.xenoTime=clock;
  shader.vertexShader='uniform float xenoTime;\n'+shader.vertexShader;
  if(wind)shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 windOrigin = position;
   #ifdef USE_INSTANCING
    windOrigin = (instanceMatrix * vec4(position,1.0)).xyz;
   #endif
   float tipWeight = smoothstep(0.0,1.8,position.y);
   transformed.x += sin(xenoTime*1.4+windOrigin.x*.29+windOrigin.z*.21)*.13*tipWeight;
   transformed.z += cos(xenoTime*.95+windOrigin.z*.26)*.07*tipWeight;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   // Quantize illumination relative to albedo, retaining painted texture color.
   float paintBase = max(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),.04);
   float paintLight = dot(outgoingLight,vec3(.2126,.7152,.0722))/paintBase;
   float paintBand = paintLight < .45 ? .33 : (paintLight < .9 ? .7 : (paintLight < 1.5 ? 1.15 : 1.8));
   outgoingLight *= mix(1.0,paintBand/max(paintLight,.08),.72);
   float paintRim = pow(1.0-max(dot(normal,normalize(vViewPosition)),0.0),3.0);
   outgoingLight += diffuseColor.rgb * paintRim * .075;
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>`xeno-painted-v1-${wind}`;
 material.needsUpdate=true;return true;
}

export function createStylizedWorld(scene){
 const clock={value:0};let scan=1;
 const clouds=new THREE.Group();clouds.name='Painted cloud banks';
 const cloudMaterial=new THREE.MeshLambertMaterial({color:0xfff2d3,flatShading:true});
 const cloudGeometry=new THREE.SphereGeometry(1,10,6);
 for(let i=0;i<14;i++){
  const bank=new THREE.Group();bank.position.set(Math.sin(i*2.4)*210,85+(i%3)*7,Math.cos(i*2.4)*210);
  for(let j=0;j<4;j++){const puff=new THREE.Mesh(cloudGeometry,cloudMaterial);puff.position.set(j*10-15,Math.sin(j*2+i)*3,Math.cos(j+i)*5);puff.scale.set(15,5+j%2*3,9);bank.add(puff);}
  clouds.add(bank);
 }
 scene.add(clouds);
 function update(dt,time){
  clock.value=time;scan+=dt;
  // Late-loaded GLBs and newly spawned characters receive the same treatment.
  if(scan>=.5){scan=0;scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])styleMaterial(m,clock);});}
  clouds.rotation.y=time*.0008;
  const daylight=scene.children.find(o=>o.isHemisphereLight)?.intensity??1;
  cloudMaterial.color.setHex(daylight>.7?0xffefd3:0x33445f);
 }
 return {update,clock,clouds};
}
