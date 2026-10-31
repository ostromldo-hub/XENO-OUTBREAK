import * as THREE from './vendor/three.module.js';
import {HUNTS,BRIEFING,TRANSMITTER,EXTRACTION,interactionTargets,interactionRange,missionObjective} from './last-signal.js';
import {heading} from './hunt-rules.js';
let status,journal,prompt,restart,socketRef,selfRef,objective,journalKey='';const markers=new Map();
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function setupMissionUI(socket,getSelf){socketRef=socket;selfRef=getSelf;
 status=document.createElement('section');status.id='mission-status';document.body.appendChild(status);
 prompt=document.createElement('div');prompt.id='mission-prompt';document.body.appendChild(prompt);
 journal=document.createElement('section');journal.id='mission-journal';journal.hidden=true;document.body.appendChild(journal);
 restart=document.createElement('button');restart.id='mission-restart';restart.textContent='START A NEW EXPEDITION';restart.hidden=true;restart.onclick=()=>socket.emit('restartMission');document.body.appendChild(restart);socket.on('disconnect',()=>{journal.hidden=true;status.hidden=true;prompt.textContent='';restart.hidden=true;});socket.on('joined',()=>{status.hidden=false;});
 document.addEventListener('keydown',e=>{if(!getSelf())return;if(e.code==='KeyJ'){e.preventDefault();e.stopImmediatePropagation();journal.hidden=!journal.hidden;if(!journal.hidden)document.exitPointerLock?.();return;}if(!journal.hidden){if(e.code==='Escape')journal.hidden=true;e.stopPropagation();return;}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();socket.emit('interact');}},true);
}
export function addMissionWorld(world,ground){
 const steel=new THREE.MeshStandardMaterial({color:0x334c50,metalness:.6,roughness:.5}),screen=new THREE.MeshStandardMaterial({color:0x6fdecf,emissive:0x2a7464,emissiveIntensity:1.3});
 function terminal(point,height=1.1){const g=new THREE.Group();g.position.set(point.x,ground(point.x,point.z),point.z);const post=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,height,8),steel);post.position.y=height/2;g.add(post);const face=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.12),screen);face.position.set(0,height,.12);face.rotation.x=-.3;g.add(face);world.add(g);return g;}
 terminal(BRIEFING);for(const h of HUNTS)terminal(h.relay,1.4);
 const mast=new THREE.Group();mast.position.set(TRANSMITTER.x,ground(0,0),TRANSMITTER.z);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,8,10),steel);pole.position.set(-3,4,0);mast.add(pole);for(let i=0;i<3;i++){const hoop=new THREE.Mesh(new THREE.TorusGeometry(1.3+i*.3,.035,5,24),screen);hoop.position.set(-3,5+i,0);hoop.rotation.y=i*.8;mast.add(hoop);}world.add(mast);
 // Visible trails: a broken radio and three-pronged marks on each hunt site.
 for(const h of HUNTS){const radio=terminal(h.clue,.4);radio.rotation.z=.35;for(let i=0;i<8;i++){const slash=new THREE.Mesh(new THREE.BoxGeometry(.07,.03,.55),steel);slash.position.set(h.clue.x+Math.sin(i)*2,ground(h.clue.x,h.clue.z)+.05,h.clue.z-i*.75);slash.rotation.y=.5;world.add(slash);}}
 const pad=new THREE.Mesh(new THREE.RingGeometry(5.7,6,40),new THREE.MeshBasicMaterial({color:0x83ead9,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(EXTRACTION.x,ground(EXTRACTION.x,EXTRACTION.z)+.08,EXTRACTION.z);world.add(pad);
 const rescue=new THREE.Group();rescue.name='Rescue shuttle';rescue.visible=false;rescue.position.set(EXTRACTION.x,ground(EXTRACTION.x,EXTRACTION.z)+5,EXTRACTION.z);
 const hull=new THREE.Mesh(new THREE.CapsuleGeometry(1.3,6,4,12),steel);hull.rotation.x=Math.PI/2;rescue.add(hull);for(const x of [-2.5,2.5]){const wing=new THREE.Mesh(new THREE.BoxGeometry(4,.2,3),steel);wing.position.x=x;rescue.add(wing);}world.add(rescue);markers.set('rescue',rescue);
 function marker(key,point,color){const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.35),new THREE.MeshBasicMaterial({color}));mesh.position.set(point.x,ground(point.x,point.z)+2,point.z);mesh.visible=false;world.add(mesh);markers.set(key,mesh);}
 for(const h of HUNTS){marker('clue-'+h.id,h.clue,0xe1b45c);marker('part-'+h.id,{x:h.x,z:h.z},0x91ffb9);marker('relay-'+h.id,h.relay,0x74dcff);}marker('brief',BRIEFING,0x74dcff);marker('broadcast',TRANSMITTER,0xffb061);marker('extraction',EXTRACTION,0x91ffb9);
}
export function missionFrame(time){for(const [key,m] of markers){if(key==='rescue')continue;m.rotation.y=time*.8;}}
export function updateMission(s,self,ground){if(!status||!s.mission)return;const m=s.mission,p=s.players.find(p=>p.id===self);if(!p)return;
 objective=missionObjective(m,p);const d=objective?Math.round(Math.hypot(p.x-objective.x,p.z-objective.z)):0;
 status.innerHTML='<b>THE LAST SIGNAL</b><span>SUIT '+(p.suit??100)+'% · RELAYS '+m.hunts.filter(h=>h.installed).length+'/4</span><strong>'+esc(objective?.label||m.phase)+'</strong><small>'+(objective?heading(p,objective)+' · '+d+'m':'')+(m.phase==='EXTRACTION'?' · '+Math.max(0,Math.ceil((m.extractDeadline-Date.now())/1000))+' sec remaining':'')+'</small><p>'+esc(m.message)+'</p><small>E interact · J journal · SHIFT sprint</small>';
 const near=interactionTargets(m).find(t=>Math.hypot(t.x-p.x,t.z-p.z)<=interactionRange(t));prompt.textContent=near?.label||'';
 const rows=m.hunts.map(h=>{const d=HUNTS.find(d=>d.id===h.id);return '<article><b>'+d.name+' — '+(h.installed?'RELAY ONLINE':h.recovered?'PART RECOVERED':h.defeated?'RECOVER COMPONENT':h.clue?'TRAIL FOUND':'LEAD')+'</b><p>'+esc(d.hint)+'</p><p>'+esc(d.tactic)+'</p><small>'+esc(d.part)+'</small></article>';}).join('');
 const nextJournalKey=JSON.stringify(m.hunts.map(h=>[h.clue,h.defeated,h.recovered,h.installed]));if(nextJournalKey!==journalKey){journalKey=nextJournalKey;journal.innerHTML='<h2>THE LAST SIGNAL</h2><p>Your ship is down. Your suit is failing. Four alien guardians hold the parts of an abandoned distress system. Find their trails, recover the parts, restore the relays, then broadcast and escape together.</p>'+rows+'<p>Safe houses recharge your suit and health. Final broadcast: stay within 18 m of the base for 60 seconds. Rescue: all living players must remain in the northern landing zone for 8 seconds, within the 120-second window.</p><small>J or Escape closes this journal.</small>';} 
 restart.hidden=!(s.hostId===self&&['WON','FAILED'].includes(m.phase));
 for(const [key,obj] of markers)if(key!=='rescue')obj.visible=false;
 if(markers.has('brief'))markers.get('brief').visible=m.phase==='BRIEFING';
 for(const h of m.hunts){const d=HUNTS.find(d=>d.id===h.id);const clue=markers.get('clue-'+h.id),part=markers.get('part-'+h.id),relay=markers.get('relay-'+h.id);if(clue)clue.visible=!h.clue&&!h.recovered&&m.phase!=='BRIEFING';if(part){part.position.set(h.drop.x,ground(h.drop.x,h.drop.z)+1,h.drop.z);part.visible=h.defeated&&!h.recovered;}if(relay)relay.visible=h.recovered&&!h.installed;}
 if(markers.has('broadcast'))markers.get('broadcast').visible=['READY','BROADCAST'].includes(m.phase);
 if(markers.has('extraction'))markers.get('extraction').visible=['EXTRACTION','WON'].includes(m.phase);
 if(markers.has('rescue'))markers.get('rescue').visible=['EXTRACTION','WON'].includes(m.phase);
}
