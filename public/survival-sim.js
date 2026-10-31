import {hitDamage} from './last-signal.js';
import {stepVertical} from './surface-physics.js';
export function jump(p){if(p.hp<=0)return false;if('grounded'in p){if(!p.grounded)return false;p.grounded=false;p.vy=8.8;return true;}if((p.jumpY||0)>.001||(p.vy||0)>0)return false;p.vy=7;p.jumpY=0;return true;}
export function updateJump(p,dt,map){if(map)return stepVertical(p,dt,map);if(p.hp<=0){p.jumpY=0;p.vy=0;return;}if(!(p.jumpY||p.vy))return;p.jumpY=Math.max(0,(p.jumpY||0)+(p.vy||0)*dt-10*dt*dt);p.vy=(p.vy||0)-20*dt;if(p.jumpY<=0){p.jumpY=0;p.vy=0;}}
const names=['ROOK','VEGA','CRUZ','NOVA'];
export function createSquad(map){return names.map((name,i)=>{const points=[{x:0,z:-38},{x:38,z:0},{x:-38,z:0},{x:0,z:38}];let p=points[i];if(map.blocked(p.x,p.z,.5))p=map.spawn('player',i);return {id:'npc-'+i,name,...p,spawn:{...p},hp:100,yaw:0,kills:0,lastShot:0,moving:false,shooting:false,respawnAt:0};});}
export function updateSquad(room,map,now,dt,onShot=()=>{}){
 for(const n of room.npcs){
  n.shooting=false;n.moving=false;
  if(n.hp<=0){if(!n.respawnAt)n.respawnAt=now+18000;if(now>=n.respawnAt){Object.assign(n,n.spawn,{hp:100,respawnAt:0});}continue;}
  let target=null,best=Infinity;
  for(const a of [...room.aliens,...(room.hostiles||[])]){if(a.hp<=0)continue;const d=Math.hypot(a.x-n.x,a.z-n.z);if(d<best&&map.lineClear(n,a,.05)){target=a;best=d;}}
  if(!target)continue;
  const dx=target.x-n.x,dz=target.z-n.z;n.yaw=Math.atan2(dx,dz);
  if(best>23||best<7){const sign=best<7?-1:1,ox=n.x,oz=n.z;map.move(n,dx/best*2.8*dt*sign,dz/best*2.8*dt*sign,.4);n.moving=Math.hypot(n.x-ox,n.z-oz)>.001;}
  if(best<32&&now-n.lastShot>=850){n.lastShot=now;n.shooting=true;target.hp-=hitDamage(target,8);onShot(n,target);if(target.hp<=0){n.kills++;room.score+=50;}}
 }
 room.aliens=room.aliens.filter(a=>a.hp>0);if(room.hostiles)room.hostiles=room.hostiles.filter(h=>h.hp>0);
}
export function terrainLift(x,z){
 const lane=Math.min(Math.abs(x),Math.abs(z),Math.abs(Math.hypot(x,z)-44));
 const fade=Math.max(0,Math.min(1,(lane-3)/4))*Math.max(0,Math.min(1,(Math.max(Math.abs(x),Math.abs(z))-20)/6));
 return fade*(1.25+.8*Math.sin(x*.085)*Math.cos(z*.072)+.65*Math.sin(x*.16+z*.09));
}
