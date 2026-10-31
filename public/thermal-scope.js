import * as THREE from './vendor/three.module.js';
export const HEAT_COLORS={alien:0xffe96a,hostile:0xff7842,ally:0x62cbff};
export function makeThermalMaterial(role,side=THREE.FrontSide){return new THREE.MeshBasicMaterial({color:HEAT_COLORS[role]??0x17252b,side,depthTest:true,depthWrite:true,fog:false});}
export function createScope(canvas,camera,weapon){
 let aiming=false,thermal=true,profile={zoom:28,range:160};const overlay=document.createElement('div');overlay.id='thermal-scope';overlay.hidden=true;overlay.innerHTML='<div class="scope-circle"><i class="scope-h"></i><i class="scope-v"></i><span id="scope-mode">THERMAL</span><small>ALIEN: YELLOW · HOSTILE: ORANGE · ALLY: BLUE<br>LEFT CLICK FIRE · T SWITCH OPTICS</small></div>';document.body.appendChild(overlay);
 function setAim(value){aiming=value;overlay.hidden=!value;document.body.classList.toggle('scoped',value);if(weapon)weapon.visible=!value;}
 canvas.addEventListener('pointerdown',e=>{if(e.button===2&&e.pointerType!=='touch'&&document.pointerLockElement===canvas)setAim(true);});
 canvas.addEventListener('mousedown',e=>{if(e.button===2&&document.pointerLockElement===canvas)setAim(true);});
 document.addEventListener('mouseup',e=>{if(e.button===2)setAim(false);});
 document.addEventListener('pointerup',e=>{if(e.button===2)setAim(false);});document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas)setAim(false);});addEventListener('blur',()=>setAim(false));
 document.addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat)thermal=!thermal;if(e.code==='KeyV'&&!e.repeat&&document.pointerLockElement===canvas)setAim(!aiming);});
 const mats=new Map();function material(role,side){const key=role+':'+side;if(!mats.has(key))mats.set(key,makeThermalMaterial(role,side));return mats.get(key);}
 function update(dt){const wanted=aiming?profile.zoom:78;if(Math.abs(camera.fov-wanted)>.01){camera.fov+=(wanted-camera.fov)*(1-Math.exp(-dt*18));camera.updateProjectionMatrix();}const mode=document.getElementById('scope-mode');if(mode)mode.textContent=(thermal?'THERMAL':'OPTICAL')+' · '+profile.range+'m';}
 function render(scene,renderer){if(!aiming||!thermal){renderer.render(scene,camera);return;}
  const restore=[],hidden=[],oldBackground=scene.background,oldFog=scene.fog,oldTone=renderer.toneMapping;
  function walk(o,inherited='cold'){if(!o.visible)return;const role=o.userData?.thermalRole||inherited;if(o.isMesh&&!o.userData.scopeEffect){restore.push([o,o.material]);const source=Array.isArray(o.material)?o.material:[o.material];const next=source.map(m=>material(role,m.side));o.material=Array.isArray(o.material)?next:next[0];}else if((o.isPoints||o.isLine||o.isSprite)&&!o.userData.scopeEffect){hidden.push([o,o.visible]);o.visible=false;}for(const child of o.children)walk(child,role);}
  walk(scene);scene.background=new THREE.Color(0x02070a);scene.fog=null;renderer.toneMapping=THREE.NoToneMapping;
  try{renderer.render(scene,camera);}finally{for(const [o,m]of restore)o.material=m;for(const [o,v]of hidden)o.visible=v;scene.background=oldBackground;scene.fog=oldFog;renderer.toneMapping=oldTone;}
 }
 return {get aiming(){return aiming;},get thermal(){return thermal;},setAim,setProfile:value=>{if(value)profile={zoom:value.zoom||28,range:value.range||160};},update,render};
}
