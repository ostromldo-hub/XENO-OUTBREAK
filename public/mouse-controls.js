export function lookAngles(yaw,pitch,dx,dy,sensitivity=.0026){
 return {yaw:yaw-dx*sensitivity,pitch:Math.max(-Math.PI/2+.02,Math.min(Math.PI/2-.02,pitch-dy*sensitivity))};
}
export function installMouseControls(canvas,{aim,setLocked,setShooting}){
 const button=document.createElement('button');button.id='mouseLookButton';button.textContent='CLICK TO PLAY — Mouse to look · WASD move · SPACE jump · SHIFT sprint';document.body.appendChild(button);
 let dragging=false,lastX=0,lastY=0;
 function mode(type){document.body.dataset.inputMode=type;}
 function capture(){
  mode('mouse');
  if(!canvas.requestPointerLock){button.textContent='Mouse capture unavailable — hold right mouse to look';return;}
  try{const result=canvas.requestPointerLock();if(result?.catch)result.catch(failed);}catch(error){failed();}
 }
 function failed(){setLocked(false);button.hidden=false;button.textContent='Click to capture mouse · or hold right mouse to look';}
 button.addEventListener('click',capture);
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'){mode('touch');button.hidden=true;return;}
  mode('mouse');
  if(e.button===2){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);}
  if(document.pointerLockElement===canvas){if(e.button===0)setShooting(true);}else if(e.button===0)capture();
 });
 // mousedown fires for each button in a chord; pointerdown only fires for the first.
 canvas.addEventListener('mousedown',e=>{if(e.button===0&&document.pointerLockElement===canvas)setShooting(true);});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;setLocked(locked);setShooting(false);button.hidden=locked;if(!locked)button.textContent='CLICK TO RESUME — Mouse to look · ESC to release';});
 document.addEventListener('pointerlockerror',failed);
 document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement===canvas)aim(e.movementX,e.movementY);
  else if(dragging){aim(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;}
 });
 document.addEventListener('pointerup',e=>{if(e.button===2)dragging=false;if(e.button===0)setShooting(false);});
 document.addEventListener('mouseup',e=>{if(e.button===0)setShooting(false);});
 addEventListener('blur',()=>{dragging=false;setShooting(false);});
 document.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code))mode('mouse');});
 // A mouse event overrides touchscreen detection on hybrid laptops.
 mode(matchMedia('(any-hover:hover) and (any-pointer:fine)').matches?'mouse':'touch');
 if(document.body.dataset.inputMode==='touch')button.hidden=true;
}
