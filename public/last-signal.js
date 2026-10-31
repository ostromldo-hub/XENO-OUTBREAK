export const BRIEFING={x:0,z:-2,name:'ROOK’S FIELD TERMINAL'};
export const TRANSMITTER={x:0,z:0,name:'MAIN TRANSMITTER'};
export const EXTRACTION={x:0,z:-210,name:'RESCUE LANDING ZONE'};
export const HUNTS=[
 {id:'mimic',name:'THE MIMIC',part:'Signal decoder',x:130,z:-62,clue:{x:116,z:-62},relay:{x:102,z:0},hp:180,speed:5.1,hint:'A distress call repeats near the eastern survey wreck. The speaker never answers.',tactic:'Follow the false distress beacon. It becomes hostile when approached.'},
 {id:'burrower',name:'THE BURROWER',part:'Power regulator',x:-150,z:30,clue:{x:-136,z:24},relay:{x:-126,z:-52},hp:220,speed:4.4,hint:'Cedar patrol found churned soil and a half-buried radio west of the station.',tactic:'Watch the moving ground ring. Shoot when it surfaces; underground shots cannot hurt it.'},
 {id:'stalker',name:'THE STALKER',part:'Antenna coupler',x:66,z:151,clue:{x:54,z:142},relay:{x:-38,z:156},hp:200,speed:5.6,hint:'The southern expedition left claw-marked equipment. Something keeps circling the site.',tactic:'Keep turning. It circles outside biting range, then rushes in.'},
 {id:'warden',name:'THE WARDEN',part:'Containment key',x:-81,z:-140,clue:{x:-68,z:-128},relay:{x:38,z:-155},hp:420,speed:3.8,hint:'A heavy creature guards the northern colony wreck. Its armor bears transmitter fragments.',tactic:'Aim for the head. Two body hits or one headshot bring it down. Use the wreckage for cover.'}
];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function newMission(now=Date.now()){return {phase:'BRIEFING',startedAt:now,hunts:HUNTS.map(h=>({id:h.id,alienId:null,clue:false,defeated:false,recovered:false,installed:false,drop:{x:h.x,z:h.z}})),broadcast:0,boarding:0,extractDeadline:0,allDownSince:0,message:'Your suit is failing. Read Rook’s terminal at the base. Press E nearby.'};}
export function bindHunt(mission,huntId,alien){const h=mission.hunts.find(h=>h.id===huntId);h.alienId=alien.id;h.drop={x:alien.x,z:alien.z};}
export function recordHuntDeath(mission,alien,map){if(!alien.huntId)return;const h=mission.hunts.find(h=>h.id===alien.huntId);if(!h||h.defeated)return;h.defeated=true;let p={x:alien.x,z:alien.z};if(map?.blocked(p.x,p.z)){for(let r=1;r<8;r++)for(let i=0;i<12;i++){const q={x:alien.x+Math.cos(i*Math.PI/6)*r,z:alien.z+Math.sin(i*Math.PI/6)*r};if(!map.blocked(q.x,q.z)){p=q;r=8;break;}}}h.drop=p;mission.message=HUNTS.find(d=>d.id===h.id).name+' down. Recover its transmitter component.';}
export function interactionTargets(m){if(m.phase==='BRIEFING')return [{...BRIEFING,type:'brief',label:'E — READ SURVIVOR BRIEFING'},...m.hunts.filter(h=>h.defeated&&!h.recovered).map(h=>({...h.drop,type:'part',huntId:h.id,label:'E — RECOVER '+HUNTS.find(d=>d.id===h.id).part.toUpperCase()}))];if(['WON','FAILED'].includes(m.phase))return [{...BRIEFING,type:'restart',label:'E — NEW EXPEDITION (HOST)'}];const out=[];
 for(const h of m.hunts){const d=HUNTS.find(d=>d.id===h.id);if(!h.clue&&!h.recovered)out.push({...d.clue,type:'clue',huntId:h.id,label:'E — SCAN '+d.name+' TRAIL'});if(h.defeated&&!h.recovered)out.push({...h.drop,type:'part',huntId:h.id,label:'E — RECOVER '+d.part.toUpperCase()});if(h.recovered&&!h.installed)out.push({...d.relay,type:'relay',huntId:h.id,label:'E — INSTALL '+d.part.toUpperCase()});}
 if(m.phase==='READY')out.push({...TRANSMITTER,type:'broadcast',label:'E — START FINAL BROADCAST'});
 return out;
}
export function interactionRange(t){return t.type==='part'?4.5:3.5;}
export function interact(m,p,now=Date.now()){if(p.hp<=0)return {ok:false,message:'Respawn before interacting.'};const nearby=interactionTargets(m).filter(t=>distance(t,p)<=interactionRange(t)).sort((a,b)=>(a.type==='part'?0:1)-(b.type==='part'?0:1)||distance(a,p)-distance(b,p));const t=nearby[0];if(!t)return {ok:false,message:'Move closer to a terminal, trail marker, or component.'};
 if(t.type==='restart')return {ok:false,message:'Use the host restart control.'};
 if(t.type==='brief'){m.phase='HUNT';m.message='Covenant humans have allied with the predators. Use cover. Find the four trails, hunt their guardians, and install the recovered components at the marked relays. J opens your journal.';return {ok:true};}
 if(t.type==='broadcast'){m.phase='BROADCAST';m.broadcast=0;m.message='The distress transmitter is a containment alarm. Hold near the base for 60 seconds. Predators are responding.';return {ok:true};}
 const h=m.hunts.find(h=>h.id===t.huntId),d=HUNTS.find(d=>d.id===t.huntId);
 if(t.type==='clue'){h.clue=true;m.message=d.hint+' '+d.tactic;}
 if(t.type==='part'){if(m.phase==='BRIEFING')m.phase='HUNT';h.recovered=true;h.clue=true;m.message=d.part+' recovered. Take it to its marked safe-house relay.';}
 if(t.type==='relay'){h.installed=true;m.message='Relay restored. The ground answers with a low vibration.';if(m.hunts.every(h=>h.installed)){m.phase='READY';m.message='All relays online. Return to the base. Start the broadcast only when your squad is ready.';}}
 return {ok:true};
}
export function missionTick(m,players,dt,now=Date.now()){
 if(['BRIEFING','WON','FAILED'].includes(m.phase))return;
 const alive=players.filter(p=>p.hp>0);
 if(!alive.length){if(!m.allDownSince)m.allDownSince=now;if(now-m.allDownSince>=12000){m.phase='FAILED';m.message='The last signal went silent. Everyone was down for 12 seconds.';}return;}m.allDownSince=0;
 if(m.phase==='BROADCAST'){if(alive.some(p=>distance(p,TRANSMITTER)<18))m.broadcast=Math.min(60,m.broadcast+dt);if(m.broadcast>=60){m.phase='EXTRACTION';m.extractDeadline=now+120000;m.message='Rescue inbound at the northern landing zone. Get every living squad member there before the window closes.';}}
 if(m.phase==='EXTRACTION'){if(now>m.extractDeadline){m.phase='FAILED';m.message='The rescue window closed. The quarantine has claimed another squad.';return;}if(alive.every(p=>distance(p,EXTRACTION)<8)){m.boarding+=dt;if(m.boarding>=8){m.phase='WON';m.message='SIGNAL RECEIVED. Your squad escaped the quarantine.';}}else m.boarding=0;}
}
export function missionObjective(m,p){
 if(m.phase==='BRIEFING')return {...BRIEFING,label:'Read Rook’s survivor briefing'};
 if(m.phase==='READY')return {...TRANSMITTER,label:'Return and start the final broadcast'};
 if(m.phase==='BROADCAST')return {...TRANSMITTER,label:'Hold the transmitter: '+Math.floor(m.broadcast)+'/60 sec'};
 if(m.phase==='EXTRACTION')return {...EXTRACTION,label:'Reach rescue together · boarding '+Math.floor(m.boarding)+'/8 sec'};
 if(m.phase==='WON'||m.phase==='FAILED')return {...BRIEFING,label:m.phase==='WON'?'EXPEDITION COMPLETE':'EXPEDITION FAILED'};
 const candidates=[];for(const h of m.hunts){const d=HUNTS.find(d=>d.id===h.id);if(h.installed)continue;if(h.recovered)candidates.push({...d.relay,label:'Install '+d.part});else if(h.defeated)candidates.push({...h.drop,label:'Recover '+d.part});else if(h.clue)candidates.push({x:h.drop.x,z:h.drop.z,label:'Hunt '+d.name});else candidates.push({...d.clue,label:'Investigate '+d.name+' trail'});}
 return candidates.sort((a,b)=>distance(a,p)-distance(b,p))[0];
}
export function namedIntent(a,target,now){const d=HUNTS.find(h=>h.id===a.huntId);if(!d)return null;
 if(a.huntId==='burrower'){const phase=(now-a.bornAt)%6500;a.underground=phase<3300;return a.underground?{speed:1.25,underground:true}:null;}
 if(a.huntId==='stalker'&&distance(a,target)<22&&(now-a.bornAt)%10000<6000){const angle=(now-a.bornAt)*.0012+a.id;return {goal:{x:target.x+Math.sin(angle)*9,z:target.z+Math.cos(angle)*9},speed:.9};}
 return null;
}
export function hitDamage(a,damage){if(a.underground)return 0;return a.huntId==='warden'&&!a.attacking?Math.max(1,Math.floor(damage*.4)):damage;}
