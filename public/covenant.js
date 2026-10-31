import {safeHouseAt} from './hunt-rules.js';
export function createHunters(map){return [{x:85,z:-28},{x:-92,z:26},{x:95,z:115},{x:-110,z:-110}].map((point,i)=>{let p=point;for(let step=0;step<16&&map.blocked(p.x,p.z,.45);step++)p={x:point.x+Math.cos(step*1.7)*(step+1),z:point.z+Math.sin(step*1.7)*(step+1)};if(map.blocked(p.x,p.z,.45))p=map.spawn('enemy',i);return {id:'covenant-'+i,name:['COVENANT SCOUT','COVENANT RIFLEMAN','COVENANT TRACKER','COVENANT MARAUDER'][i],...p,home:{...p},hp:100,yaw:0,kills:0,lastShot:0,moving:false,shooting:false,faction:'covenant',alertUntil:0};});}
export function updateHunters(room,map,now,dt,onShot=()=>{}){
 const players=[...room.players.values()].filter(p=>p.hp>0&&!safeHouseAt(p.x,p.z));
 if(players.length&&room.hostiles.some(h=>players.some(p=>Math.hypot(h.x-p.x,h.z-p.z)<100))&&now-(room.lastHunterNav||0)>2600){room.hunterNav=map.field(players);room.lastHunterNav=now;}
 for(const h of room.hostiles){h.shooting=false;h.moving=false;if(h.hp<=0)continue;const target=players.reduce((best,p)=>!best||Math.hypot(h.x-p.x,h.z-p.z)<Math.hypot(h.x-best.x,h.z-best.z)?p:best,null);if(!target)continue;const dx=target.x-h.x,dz=target.z-h.z,d=Math.hypot(dx,dz)||1;const visible=map.lineClear(h,target,.05);if(d<85&&visible)h.alertUntil=now+18000;if(now>(h.alertUntil||0))continue;h.yaw=Math.atan2(dx,dz);
  let goal=null;if(d>28||!visible)goal=visible?target:room.hunterNav?map.waypoint(h,room.hunterNav):null;else if(d<12)goal={x:h.x-dx/d*3,z:h.z-dz/d*3};else if(Math.floor(now/4000)%2===0)goal={x:h.x+dz/d*2,z:h.z-dx/d*2};
  if(goal){const length=Math.hypot(goal.x-h.x,goal.z-h.z)||1,ox=h.x,oz=h.z;map.move(h,(goal.x-h.x)/length*3.5*dt,(goal.z-h.z)/length*3.5*dt,.4);h.moving=Math.hypot(h.x-ox,h.z-oz)>.001;}
  if(d<48&&visible&&now-h.lastShot>1250){h.lastShot=now;h.shooting=true;const from={x:h.x,y:map.ground(h.x,h.z)+1.45,z:h.z},to={x:target.x,y:(target.feetY??map.ground(target.x,target.z))+1.1,z:target.z};const hit=!map.shotClear||map.shotClear(from,to);if(hit)target.hp=Math.max(0,target.hp-9);onShot(h,target,from,to,hit);}
 }
 room.hostiles=room.hostiles.filter(h=>h.hp>0);
}
export function rayHit(origin,yaw,pitch,targets,ground,maxRange=160,clear=()=>true){
 const dir={x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};let best=maxRange,hit=null;
 for(const a of targets){if(a.hp<=0||a.underground)continue;const base=ground(a.x,a.z),human=a.faction==='covenant',warden=a.huntId==='warden';
  const zones=a.isTarget?[[1.3,.5,'body']]:human?[[.45,.38,'body'],[1.05,.38,'body'],[1.65,.28,'head']]:warden?[[.7,.8,'body'],[1.6,.8,'body'],[2.7,.42,'head']]:[[.55,.65,'body'],[1.3,.65,'body'],[2.1,.32,'head']];
  for(const [level,radius,zone] of zones){const dx=a.x-origin.x,dy=base+level-origin.y,dz=a.z-origin.z,along=dx*dir.x+dy*dir.y+dz*dir.z,perp2=dx*dx+dy*dy+dz*dz-along*along;if(along<=0||perp2>radius*radius)continue;const entry=Math.max(0,along-Math.sqrt(Math.max(0,radius*radius-perp2)));if(entry>=best)continue;const point={x:origin.x+dir.x*entry,y:origin.y+dir.y*entry,z:origin.z+dir.z*entry};if(clear(origin,point)){best=entry;hit={target:a,zone,point,distance:entry};}}
 }
 return hit;
}
export function rayTarget(...args){return rayHit(...args)?.target??null;}
export function playerBulletDamage(target,zone){
 if(!target.isAlien)return 35;
 return zone==='head'?target.hp:Math.ceil((target.maxHp||110)/2);
}
