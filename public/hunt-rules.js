import {FIELD_CAMPS,regionTerrain,fieldCampHeight} from './expansion-rules.js';
import {TOWERS} from './tower-rules.js';
export const SAFE_HOUSES=[...FIELD_CAMPS,{id:'echo',name:'ECHO RELAY',x:102,z:0},{id:'cedar',name:'CEDAR BUNKER',x:-126,z:-52},{id:'atlas',name:'ATLAS STATION',x:38,z:-155},{id:'haven',name:'HAVEN CLINIC',x:-38,z:156},{id:'rust',name:'RUSTWATCH',x:171,z:91}];
export const WALK_SPEED=9,SPRINT_SPEED=14;
export function movementSpeed(sprint){return sprint===true?SPRINT_SPEED:WALK_SPEED;}
export function safeHouseAt(x,z){return SAFE_HOUSES.find(h=>Math.abs(x-h.x)<5.7&&Math.abs(z-h.z)<5.7)||null;}
export function outerHeight(x,z,edge){const distance=Math.max(Math.abs(x),Math.abs(z));if(distance<=80)return edge;const blend=Math.min(1,(distance-80)/24),raw=1.8+2.1*Math.sin(x*.028)*Math.cos(z*.033)+.6*Math.sin((x+z)*.09);let y=edge*(1-blend)+raw*blend;y=regionTerrain(x,z,y);for(const h of SAFE_HOUSES){const d=Math.max(Math.abs(x-h.x),Math.abs(z-h.z));const t=Math.max(0,Math.min(1,(d-8)/7));if(d<15)y=fieldCampHeight(h)*(1-t)+y*t;}for(const h of TOWERS){const d=Math.max(Math.abs(x-h.x),Math.abs(z-h.z));if(d<15){const u=Math.max(0,Math.min(1,(d-10)/5)),t=u*u*(3-2*u);y=h.baseY*(1-t)+y*t;}}return y;}
export function isAware(alien,target,now,distance){return !safeHouseAt(target.x,target.z)&&(distance<27||now<(alien.alertUntil||0));}
export function canRepopulate(room,now){return room.aliens.length-room.aliens.filter(a=>a?.regionId).length<6&&now-room.lastSpawn>45000;}
export function heading(from,to){const angle=Math.atan2(to.x-from.x,-(to.z-from.z));return ['N','NE','E','SE','S','SW','W','NW'][(Math.round(angle/(Math.PI/4))+8)%8];}
