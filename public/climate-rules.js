import {fieldCampHeight} from './expansion-rules.js';
import {SAFE_HOUSES} from './hunt-rules.js';
export const DAYLIGHT_SECONDS=1200,NIGHT_SECONDS=180,DUSK_SECONDS=20,DAWN_SECONDS=20;
export const DAY_SECONDS=DAYLIGHT_SECONDS+NIGHT_SECONDS;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function climateAt(seconds,seed=0){
 const clock=((seconds%DAY_SECONDS)+DAY_SECONDS)%DAY_SECONDS,a=Math.asin(.2),b=Math.asin(.16),dark=NIGHT_SECONDS-DUSK_SECONDS-DAWN_SECONDS;let angle,name;
 if(clock<DAYLIGHT_SECONDS){angle=a+(Math.PI-2*a)*clock/DAYLIGHT_SECONDS;name='DAY';}
 else if(clock<DAYLIGHT_SECONDS+DUSK_SECONDS){angle=Math.PI-a+(a+b)*(clock-DAYLIGHT_SECONDS)/DUSK_SECONDS;name='DUSK';}
 else if(clock<DAY_SECONDS-DAWN_SECONDS){angle=Math.PI+b+(Math.PI-2*b)*(clock-DAYLIGHT_SECONDS-DUSK_SECONDS)/dark;name='NIGHT';}
 else{angle=2*Math.PI-b+(a+b)*(clock-(DAY_SECONDS-DAWN_SECONDS))/DAWN_SECONDS;name='DAWN';}
 const phase=((angle/(Math.PI*2))%1+1)%1,elevation=Math.sin(angle),daylight=smooth((elevation+.16)/.45);
 const start=70+Math.abs(seed%31),period=330+Math.abs(seed%41),duration=75+Math.abs(seed%26),t=((seconds%period)+period)%period;
 const rain=smooth((t-start)/12)*smooth((start+duration-t)/15);
 return {phase,angle,elevation,daylight,rain,name,weather:rain>.05?'RAIN':'CLEAR'};
}
export function roofHeight(x,z){
 const shelter=SAFE_HOUSES.find(h=>Math.abs(x-h.x)<6.4&&Math.abs(z-h.z)<6.4);if(shelter)return fieldCampHeight(shelter)+4.7;
 if(x>5.7&&x<16.3&&z>-15.3&&z< -2.7)return 4.35;
 return -Infinity;
}
