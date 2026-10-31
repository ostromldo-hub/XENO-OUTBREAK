import * as THREE from './vendor/three.module.js';
export function configureNaturalMaterial(m){
 if(!m?.isMeshStandardMaterial)return;
 // Preserve imported texture maps and original metal/glass properties.
 if(m.userData.foliage){m.roughness=.78;m.side=THREE.DoubleSide;}
}
export function createRealisticWorld(scene,camera,renderer){
 const seen=new WeakSet(),clock={value:0};let scan=1;
 const sun=scene.children.find(o=>o.isDirectionalLight);
 if(sun){sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:190});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00025;sun.shadow.normalBias=.08;sun.shadow.radius=2;scene.add(sun.target);}
 const loader=new THREE.TextureLoader(),textures={};
 function texture(name,color=true){if(!textures[name]){const t=loader.load('/assets/realism/'+name);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;textures[name]=t;}return textures[name];}
 function update(dt,time){
  clock.value=time;scan+=dt;
  if(sun){const direction=sun.position.clone().normalize();sun.target.position.set(camera.position.x,0,camera.position.z);sun.position.copy(sun.target.position).addScaledVector(direction,100);}
  if(scan<2)return;scan=0;
  scene.traverse(o=>{
   if(!o.isMesh)return;
   if(o.userData.surface){const m=o.material,kind=o.userData.surface;if(!m.userData.surfaceApplied){m.map=texture(kind+'.jpg');if(kind!=='leaf'){m.bumpMap=texture(kind+'-height.png',false);m.bumpScale=kind==='bark'?.16:.11;}m.color.setHex(0xffffff);m.userData.surfaceApplied=true;m.needsUpdate=true;}}
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(!m?.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);configureNaturalMaterial(m);
    if(m.userData.foliage){const previous=m.onBeforeCompile;m.onBeforeCompile=function(shader,r){previous.call(this,shader,r);shader.uniforms.forestTime=clock;shader.vertexShader='uniform float forestTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vec3 forestPosition=position;
     #ifdef USE_INSTANCING
      forestPosition=(instanceMatrix*vec4(position,1.0)).xyz;
     #endif
     transformed.x+=sin(forestTime*1.25+forestPosition.x*.3+forestPosition.z*.2)*.065*smoothstep(0.0,1.8,position.y);`);};m.customProgramCacheKey=()=> 'xeno-natural-wind-v1';m.needsUpdate=true;}
   }
  });
 }
 return {update,clock};
}
