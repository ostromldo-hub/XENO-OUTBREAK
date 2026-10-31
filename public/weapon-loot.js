import * as THREE from './vendor/three.module.js';
import {WEAPONS,weaponStats} from './weapon-rules.js';
export function buildWeapon(kind='rifle',tier=0){
 const g=new THREE.Group(),color=WEAPONS[kind]?.color||0x81d9b2;
 const metal=new THREE.MeshStandardMaterial({color:0x26363c,metalness:.7,roughness:.4}),dark=new THREE.MeshStandardMaterial({color:0x10191f,roughness:.7}),accent=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25+tier*.22,metalness:.4,roughness:.35});
 function box(w,h,d,x,y,z,m=metal){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);}
 const length=kind==='sniper'?1.45:kind==='smg'?.48:kind==='marksman'?1.15:.8;box(.22,.2,length,0,0,0);box(.14,.26,.17,0,-.19,.12,dark);box(.12,kind==='smg'?.4:.29,.17,0,-.2,-.15,dark);box(.2,.15,.28,0,-.03,length*.6,dark);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,(kind==='marksman'||kind==='sniper')?.7:.35,12),metal);barrel.rotation.x=Math.PI/2;barrel.position.z=-length*.65;g.add(barrel);
 const scope=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,(kind==='marksman'||kind==='sniper')?.42:.24,12),dark);scope.rotation.x=Math.PI/2;scope.position.set(0,.17,-.05);g.add(scope);
 for(let i=0;i<=tier;i++)box(.012,.055,.12,.116,.02,-.25+i*.14,accent);
 if(kind==='pulse'){for(const x of [-.14,.14])box(.045,.12,.5,x,0,-.14,accent);}
 return g;
}
export function createWeaponLootView(scene,camera,gun,socket){
 const objects=new Map(),hud=document.createElement('div'),prompt=document.createElement('div');hud.id='weapon-status';prompt.id='weapon-prompt';document.body.appendChild(hud);document.body.appendChild(prompt);let player=null,current='',ground=()=>0;
 document.addEventListener('keydown',e=>{if(/^Digit[1-5]$/.test(e.code)&&!e.repeat&&player){const kind=['rifle','smg','marksman','pulse','sniper'][Number(e.code.slice(-1))-1];socket.emit('switchWeapon',kind);}});
 function sync(state,self,getGround){player=state.players.find(p=>p.id===self);if(!player)return;ground=getGround;const collected=new Set(player.collected||[]),visible=(state.weaponLoot||[]).filter(g=>!collected.has(g.id)),ids=new Set(visible.map(g=>g.id));
  for(const [id,o]of objects)if(!ids.has(id)){scene.remove(o);o.traverse(child=>{child.geometry?.dispose();if(child.material)child.material.dispose();});objects.delete(id);}
  for(const item of visible)if(!objects.has(item.id)){
   const group=new THREE.Group();group.userData.loot=item;group.position.set(item.x,(item.y??ground(item.x,item.z))+.08,item.z);const color=WEAPONS[item.kind].color;
   const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.85,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;group.add(ring);
   const halo=new THREE.Mesh(new THREE.RingGeometry(.35,1.2,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending}));halo.rotation.x=-Math.PI/2;halo.position.y=.015;group.add(halo);
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.24,.7,1.7,24,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.06,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.y=.87;group.add(beam);
   const model=buildWeapon(item.kind);model.position.y=1.25;model.rotation.z=-.18;group.add(model);group.userData.model=model;group.userData.halo=halo;scene.add(group);objects.set(item.id,group);
  }
  const stats=player.weaponStats||weaponStats(player.weapon,player.weaponXp),key=stats.kind+stats.tier;
  if(current!==key){current=key;for(const child of [...gun.children])if(!child.isLight){gun.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});}gun.add(buildWeapon(stats.kind,stats.tier));}
  hud.textContent=stats.name+' · '+stats.rank+'\n'+(player.reloading?'RELOADING…':player.ammo+' / '+stats.mag)+' · '+(stats.next?player.weaponXp+' / '+stats.next+' XP':'MAX RANK')+'\n1 RIFLE · 2 SMG · 3 DMR · 4 PULSE · 5 SNIPER\nOWNED: '+(player.inventory||[]).map(k=>WEAPONS[k].name).join(' / ');
 }
 function update(time){let nearest=null;for(const o of objects.values()){const item=o.userData.loot;o.position.y=(item.y??ground(item.x,item.z))+.08;o.userData.model.position.y=1.25+Math.sin(time*2+item.x)*.13;o.userData.model.rotation.y=time*.7;o.userData.halo.material.opacity=.13+Math.sin(time*2)*.05;const distance=player?Math.hypot(player.x-item.x,player.z-item.z):Infinity;if(distance<=2.8&&(!Number.isFinite(item.y)||Math.abs((player.y||0)-item.y)<1.5)&&(!nearest||distance<nearest.distance))nearest={item,distance};}prompt.textContent=nearest&&player.hp>0?'E — EQUIP '+WEAPONS[nearest.item.kind].name:'';}
 return {sync,update};
}
