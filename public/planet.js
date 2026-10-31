// Procedural biome and articulated creatures. All assets generated locally.
export function buildPlanet(T,scene){
 const random=(n)=>{let x=Math.sin(n*127.1+91.7)*43758.5453;return x-Math.floor(x)};
 function texture(base,spots,seed){
   const c=document.createElement('canvas');c.width=c.height=512;
   const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,512,512);
   for(let i=0;i<2400;i++){const x=random(seed+i*3)*512,y=random(seed+i*3+1)*512,r=1+random(seed+i*3+2)*15;
    g.fillStyle=spots[i%spots.length];g.globalAlpha=.05+random(i+seed)*.24;
    g.beginPath();g.ellipse(x,y,r,r*(.3+random(i+4)),random(i)*6.28,0,6.283);g.fill();}
   g.globalAlpha=1;const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
 }
 const dirt=texture('#4b443a',['#a68e70','#252a26','#6b6a57','#827258'],41);
 dirt.repeat.set(12,12);
 const terrain=new T.Mesh(new T.PlaneGeometry(80,80,48,48),new T.MeshStandardMaterial({map:dirt,roughness:1}));
 terrain.rotation.x=-Math.PI/2;terrain.position.y=-.035;scene.add(terrain);
 const rockTexture=texture('#514b43',['#b0a28b','#252c31','#796c5b'],12);
 const rockMat=new T.MeshStandardMaterial({map:rockTexture,roughness:.96,flatShading:true});
 const mossMat=new T.MeshStandardMaterial({color:0x425c49,roughness:1});
 const glowMat=new T.MeshStandardMaterial({color:0x63c9d2,emissive:0x29c9d6,emissiveIntensity:1.7,roughness:.4});
 for(let i=0;i<105;i++){
   const x=(random(i*7+1)-.5)*75,z=(random(i*7+2)-.5)*75;
   if(Math.hypot(x,z)<7)continue;
   const size=.35+random(i*7+3)*2.2;
   const rock=new T.Mesh(new T.DodecahedronGeometry(size,0),rockMat);
   rock.position.set(x,size*.35-.08,z);rock.scale.set(1,.5+random(i+40)*.65,.7+random(i+90)*.6);
   rock.rotation.set(random(i+4),random(i+5)*6,random(i+6)*.3);scene.add(rock);
 }
 for(let i=0;i<55;i++){
   const x=(random(i*13+2)-.5)*74,z=(random(i*13+3)-.5)*74;
   if(Math.hypot(x,z)<9)continue;
   const g=new T.Group(),h=1.3+random(i*13+4)*4;
   const stalk=new T.Mesh(new T.CylinderGeometry(.045,.16,h,5),mossMat);stalk.position.y=h/2;g.add(stalk);
   for(let j=0;j<3;j++){
     const leaf=new T.Mesh(new T.ConeGeometry(.2+random(i+j)*.2,.8+random(i+j+3),5),mossMat);
     leaf.position.set(Math.sin(j*2.1)*.25,h*.45+j*.4,Math.cos(j*2.1)*.25);leaf.rotation.z=.65*Math.cos(j*2.1);g.add(leaf);
   }
   if(i%6===0){const orb=new T.Mesh(new T.SphereGeometry(.11,8,6),glowMat);orb.position.y=h;g.add(orb);}
   g.position.set(x,0,z);scene.add(g);
 }
 const sky=new T.Mesh(new T.SphereGeometry(125,32,16),new T.MeshBasicMaterial({color:0x322b43,side:T.BackSide,fog:false}));
 scene.add(sky);
 const moon=new T.Mesh(new T.SphereGeometry(10,32,20),new T.MeshBasicMaterial({color:0xd7b7a2,fog:false}));
 moon.position.set(-62,55,-80);scene.add(moon);
 const atmosphere=new T.HemisphereLight(0x9ba4cc,0x483c30,1.2);scene.add(atmosphere);
 const sun=new T.DirectionalLight(0xf0a989,2.4);sun.position.set(-25,50,-30);scene.add(sun);
 // Distant jagged silhouettes provide depth without costly geometry.
 const cliffMat=new T.MeshStandardMaterial({color:0x292b32,roughness:1,flatShading:true});
 for(let i=0;i<35;i++){
   const angle=i/35*Math.PI*2,dist=51+random(i+440)*15,h=9+random(i+450)*25;
   const cliff=new T.Mesh(new T.ConeGeometry(5+random(i+400)*7,h,5),cliffMat);
   cliff.position.set(Math.cos(angle)*dist,h*.35,Math.sin(angle)*dist);cliff.rotation.z=(random(i+300)-.5)*.4;scene.add(cliff);
 }
}
export function createCreature(T){
 const g=new T.Group();
 const skin=new T.MeshStandardMaterial({color:0x454e44,roughness:.82,metalness:.05});
 const armor=new T.MeshStandardMaterial({color:0x252f30,roughness:.5,metalness:.24});
 const flesh=new T.MeshStandardMaterial({color:0x687a66,roughness:.88});
 const eye=new T.MeshStandardMaterial({color:0xff7745,emissive:0xff3211,emissiveIntensity:2.5});
 const bone=new T.MeshStandardMaterial({color:0xa8a390,roughness:.8});
 function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=g){
   const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
 }
 const torso=mesh(new T.IcosahedronGeometry(.7,2),skin,0,1.13,0,1.12,.83,1.4);
 mesh(new T.IcosahedronGeometry(.5,1),armor,0,1.38,.12,1.2,.65,1.2);
 const head=mesh(new T.SphereGeometry(.44,16,12),skin,0,1.73,-.58,1.1,.65,1.55);
 mesh(new T.ConeGeometry(.22,.7,7),bone,0,1.55,-1.14,1,1,1).rotation.x=-Math.PI/2;
 for(const side of [-1,1]){
   mesh(new T.SphereGeometry(.105,12,8),eye,side*.24,1.81,-1.03);
   const ridge=mesh(new T.ConeGeometry(.13,.68,6),armor,side*.39,2.06,-.35);
   ridge.rotation.z=-side*.5;
 }
 const legs=[];
 for(let i=0;i<6;i++){
   const side=i%2===0?-1:1,segment=Math.floor(i/2);
   const hip=new T.Group();hip.position.set(side*.5,1.06,.6-segment*.56);g.add(hip);
   const upper=mesh(new T.CylinderGeometry(.13,.18,.76,7),skin,side*.24,-.16,0);
   upper.rotation.z=side*.8;
   const lower=mesh(new T.CylinderGeometry(.08,.13,.9,6),flesh,side*.51,-.57,-.06);
   lower.rotation.z=-side*.5;
   const claw=mesh(new T.ConeGeometry(.12,.45,5),bone,side*.58,-1.05,-.24);
   claw.rotation.x=-.65;
   legs.push({hip,side,segment});
 }
 const tail=new T.Group();tail.position.set(0,1.1,.67);g.add(tail);
 for(let i=0;i<5;i++){const part=mesh(new T.ConeGeometry(.19-i*.028,.58,7),skin,0,-.07+i*.08,.2+i*.34,1,1,1,tail);part.rotation.x=Math.PI/2;}
 g.userData={legs,tail,torso,head};return g;
}
export function animateCreature(g,time,id){
 const u=g.userData,phase=time*7+Number(id||0)*.9;
 u.legs.forEach(({hip,side,segment})=>{hip.rotation.x=Math.sin(phase+segment*2.1+(side>0?Math.PI:0))*.52;hip.rotation.z=side*(.12+Math.sin(phase+segment)*.08)});
 u.torso.position.y=1.13+Math.sin(phase*2)*.065;
 u.head.rotation.z=Math.sin(phase*.33)*.08;
 u.tail.rotation.y=Math.sin(phase*.65)*.4;
 g.rotation.z=Math.sin(phase)*.035;
}
