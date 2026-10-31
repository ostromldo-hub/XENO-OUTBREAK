export const WORLD_LIMIT=320;
export const REGIONS=[{id:'frost',name:'FROSTREACH HIGHLANDS',x:-285,z:-270,color:0xb6c8cf,species:'howler'},{id:'dunes',name:'CRIMSON DUNES',x:285,z:-270,color:0xb78656,species:'runner'},{id:'swamp',name:'MIREFALL WETLANDS',x:285,z:270,color:0x597367,species:'spitter'},{id:'ash',name:'CINDER BASIN',x:-285,z:270,color:0x50505a,species:'brute'}];
export const FIELD_CAMPS=[{id:'frost-camp',name:'FROST FIELD CAMP',x:-215,z:-250},{id:'dune-camp',name:'DUNE FIELD CAMP',x:215,z:-250},{id:'mire-camp',name:'MIRE FIELD CAMP',x:215,z:250},{id:'ash-camp',name:'CINDER FIELD CAMP',x:-215,z:250}];
export const SPECIES={howler:{name:'FROST HOWLER',color:0xb6d4db,speed:5.9,damage:16},runner:{name:'DUNE RAZOR',color:0xb99354,speed:7,damage:16},spitter:{name:'MIRE SPITTER',color:0x6f9950,speed:3.8,damage:13},brute:{name:'CINDER BRUTE',color:0x4e4642,speed:3.3,damage:26}};
const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function regionAt(x,z){if(Math.max(Math.abs(x),Math.abs(z))<=240)return null;return x<0?(z<0?REGIONS[0]:REGIONS[3]):(z<0?REGIONS[1]:REGIONS[2]);}
export function regionTerrain(x,z,original){const edge=Math.max(Math.abs(x),Math.abs(z)),blend=smooth((edge-240)/70);if(!blend)return original;
 const wave=Math.sin(x*.009)*Math.cos(z*.011),ridge=Math.sin(x*.004+z*.003)**2;
 // Blend directional landscapes through broad transition bands.
 const east=smooth((x+110)/220),south=smooth((z+110)/220);
 const frost=20+48*ridge+13*wave,dunes=8+10*Math.sin(x*.019+Math.sin(z*.009))*Math.sin(z*.012),swamp=-.5+2*Math.sin(x*.014)*Math.cos(z*.013),ash=12+24*ridge+8*Math.sin(x*.017)*Math.cos(z*.012);
 const north=frost*(1-east)+dunes*east,lower=ash*(1-east)+swamp*east;let h=original*(1-blend)+(north*(1-south)+lower*south)*blend;
 for(const site of EXPEDITION_SITES){const d=Math.hypot(x-site.x,z-site.z);if(d<12){const sx=site.x,sz=site.z,sw=Math.sin(sx*.009)*Math.cos(sz*.011),sr=Math.sin(sx*.004+sz*.003)**2;const biomeBase=site.region==='frost'?20+48*sr+13*sw:site.region==='dunes'?8+10*Math.sin(sx*.019+Math.sin(sz*.009))*Math.sin(sz*.012):site.region==='swamp'?-.5+2*Math.sin(sx*.014)*Math.cos(sz*.013):12+24*sr+8*Math.sin(sx*.017)*Math.cos(sz*.012);const mix=smooth((Math.max(Math.abs(sx),Math.abs(sz))-240)/70),old=1.8+2.1*Math.sin(sx*.028)*Math.cos(sz*.033)+.6*Math.sin((sx+sz)*.09),base=old*(1-mix)+biomeBase*mix;h=base*(1-smooth((d-6)/6))+h*smooth((d-6)/6);}}
 return h;
}
export const EXPEDITION_SITES=REGIONS.flatMap(r=>[{id:r.id+'-survey',region:r.id,kind:'survey',name:r.name+' — SURVEY UPLINK',x:r.x,z:r.z},{id:r.id+'-nest',region:r.id,kind:'nest',name:r.name+' — ALIEN NEST',x:r.x+(r.x>0?15:-15),z:r.z+30},{id:r.id+'-salvage',region:r.id,kind:'salvage',name:r.name+' — LOST FLIGHT RECORDER',x:r.x+(r.x>0?10:-10),z:r.z-35}]);
export function newExpedition(){return {sites:EXPEDITION_SITES.map(s=>({...s,active:false,progress:0,carried:false,complete:false})),complete:0};}
export function expeditionInteract(room,p,map,terminals=FIELD_CAMPS){if(p.hp<=0)return null;const e=room.expedition,site=e.sites.find(s=>!s.complete&&Math.hypot(s.x-p.x,s.z-p.z)<4.5);if(site){if(site.kind==='nest'&&room.aliens.some(a=>a.objectiveId===site.id))return 'Clear the nest guardians before planting the charge.';if(site.kind==='salvage'){if(site.carried)return 'Recorder secured by the squad. Deliver it at a safe-house field terminal.';site.carried=true;return 'FLIGHT RECORDER RECOVERED — return to any safe-house terminal and press E.';}site.active=true;return site.kind==='nest'?'CHARGE ARMED — remain within 16 m for 8 seconds.':'UPLINK ACTIVE — remain within 16 m for 15 seconds.';}
 const terminal=terminals.concat([{x:0,z:-2}]).find(h=>Math.hypot(h.x-p.x,h.z-p.z)<4.5);if(terminal){const carried=e.sites.filter(s=>s.kind==='salvage'&&s.carried&&!s.complete);if(carried.length){for(const s of carried)finishExpeditionSite(room,s);return 'Flight recorders delivered. Squad rewards issued.';}}return null;}
export function finishExpeditionSite(room,s){if(s.complete)return;s.complete=true;s.active=false;room.expedition.complete++;room.score+=300;for(const p of room.players.values()){p.weaponXp=(p.weaponXp||0)+3;if(p.hp>0){p.hp=Math.min(100,p.hp+20);p.suit=Math.min(100,(p.suit||0)+30);}}}
export function expeditionTick(room,dt){for(const s of room.expedition.sites){if(!s.active||s.complete)continue;const present=[...room.players.values()].some(p=>p.hp>0&&Math.hypot(p.x-s.x,p.z-s.z)<=16);if(present)s.progress+=dt;if(s.progress>=(s.kind==='nest'?8:15))finishExpeditionSite(room,s);}}

export function fieldCampHeight(h){return h.id?.endsWith('-camp')?regionTerrain(h.x,h.z,1.8+2.1*Math.sin(h.x*.028)*Math.cos(h.z*.033)+.6*Math.sin((h.x+h.z)*.09)):0;}

export function biomeWeights(x,z){const east=smooth((x+110)/220),south=smooth((z+110)/220);return [(1-east)*(1-south),east*(1-south),east*south,(1-east)*south];}
