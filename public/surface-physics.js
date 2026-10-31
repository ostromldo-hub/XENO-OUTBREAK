import {terrainLift} from './survival-sim.js';
export function colliderTop(c,x,z,ground){
 if(c.ramp){const r=c.ramp,t=Math.max(0,Math.min(1,((r.axis==='x'?x:z)-r.from)/(r.to-r.from)));return r.low+(r.high-r.low)*t;}if(Number.isFinite(c.surfaceY))return c.surfaceY;
 if(c.ellipsoid){const e=c.ellipsoid,rr=((x-e.x)/e.w)**2+((z-e.z)/e.d)**2;if(rr>1)return -Infinity;return ground(e.x,e.z)+e.h/2*(1+Math.sqrt(1-rr));}
 let top=-Infinity;
 for(const t of c.triangles||[]){const ax=t[0],az=t[2],bx=t[3],bz=t[5],cx=t[6],cz=t[8],den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-9)continue;const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,w=1-u-v;if(u>=-1e-5&&v>=-1e-5&&w>=-1e-5)top=Math.max(top,u*t[1]+v*t[4]+w*t[7]);}
 return Number.isFinite(top)?top+terrainLift(x,z):top;
}
export function stepVertical(p,dt,map){
 const floor=map.ground(p.x,p.z);if(!Number.isFinite(p.feetY)){p.feetY=floor;p.grounded=true;p.vy=0;}
 if(p.hp<=0){p.feetY=floor;p.vy=0;p.grounded=true;p.jumpY=0;return;}
 const old=p.feetY;let next=old+(p.vy||0)*dt-10*dt*dt;p.vy=(p.vy||0)-20*dt;
 const support=map.support(p.x,p.z,old+.23);
 if(next<=support){p.feetY=support;p.vy=0;p.grounded=true;}else{p.feetY=next;p.grounded=false;}
 p.jumpY=Math.max(0,p.feetY-floor);
}
