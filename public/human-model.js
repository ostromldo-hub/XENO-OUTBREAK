import * as THREE from './vendor/three.module.js';
export function buildHuman(faction='ally'){
 const group=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xb27b5b,roughness:.8}),cloth=new THREE.MeshStandardMaterial({color:faction==='hostile'?0x563c32:0x334943,roughness:.95}),armor=new THREE.MeshStandardMaterial({color:faction==='hostile'?0x844c38:0x536d64,metalness:.2,roughness:.6}),black=new THREE.MeshStandardMaterial({color:0x172120,roughness:.7});
 function oval(parent,pos,scale,material){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),material);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
 function segment(parent,a,b,r1,r2,material){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,av.distanceTo(bv),12),material);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());parent.add(m);oval(parent,a,[r1,r1,r1],material);oval(parent,b,[r2,r2,r2],material);return m;}
 oval(group,[0,1.13,0],[.265,.39,.16],cloth);oval(group,[0,1.20,.025],[.28,.27,.15],armor);oval(group,[0,.82,0],[.235,.15,.15],cloth);segment(group,[0,1.48,0],[0,1.60,0],.075,.07,skin);
 const head=oval(group,[0,1.73,.015],[.125,.17,.12],skin);oval(group,[0,1.65,.05],[.09,.08,.09],skin);
 oval(group,[0,1.73,.139],[.025,.037,.04],skin);
 for(const side of [-1,1]){oval(group,[side*.047,1.76,.12],[.016,.009,.007],black);oval(group,[side*.125,1.73,.015],[.02,.04,.027],skin);}
 oval(group,[0,1.845,-.005],[.14,.085,.13],armor);
 const legs=[],knees=[],arms=[],elbows=[];
 for(const side of [-1,1]){
  const hip=new THREE.Group();hip.position.set(side*.135,.83,0);group.add(hip);segment(hip,[0,0,0],[0,-.36,.015],.105,.075,cloth);
  const knee=new THREE.Group();knee.position.set(0,-.36,.015);hip.add(knee);segment(knee,[0,0,0],[0,-.35,-.015],.075,.055,cloth);oval(knee,[0,-.35,.055],[.075,.065,.145],black);legs.push(hip);knees.push(knee);
  const shoulder=new THREE.Group();shoulder.position.set(side*.29,1.40,0);group.add(shoulder);segment(shoulder,[0,0,0],[side*.015,-.28,0],.082,.063,cloth);oval(shoulder,[side*.012,-.03,0],[.105,.12,.10],armor);
  const elbow=new THREE.Group();elbow.position.set(side*.015,-.28,0);shoulder.add(elbow);segment(elbow,[0,0,0],[0,-.25,0],.06,.045,cloth);oval(elbow,[0,-.27,0],[.05,.075,.035],skin);shoulder.rotation.x=-.55;elbow.rotation.x=-1.0;arms.push(shoulder);elbows.push(elbow);
 }
 const rifle=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.56,4,8),black);rifle.rotation.x=Math.PI/2;rifle.position.set(.12,1.13,.45);group.add(rifle);
 const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:0xffcc6a}));muzzle.position.set(.12,1.13,.80);muzzle.visible=false;group.add(muzzle);
 group.userData={legs,knees,arms,elbows,muzzle,head};return group;
}
export function animateHuman(group,moving,shooting,time){const d=group.userData;d.legs.forEach((hip,i)=>{const phase=time*8+i*Math.PI;hip.rotation.x=moving?Math.sin(phase)*.40:0;d.knees[i].rotation.x=moving?Math.max(0,-Math.sin(phase))*.65:0;d.arms[i].rotation.x=-.55+(moving?Math.sin(phase)*.05:0)-(shooting?.06:0);d.elbows[i].rotation.x=-1;});d.muzzle.visible=shooting;}
