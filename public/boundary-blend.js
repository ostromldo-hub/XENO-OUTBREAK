import {outerHeight} from './hunt-rules.js';
export function scenicHeight(x,z){const edge=Math.max(Math.abs(x),Math.abs(z)),u=Math.max(0,Math.min(1,(edge-320)/320)),t=u*u*(3-2*u),ridge=35+60*Math.sin(x*.003+z*.002)**2;return outerHeight(x,z,0)*(1-t)+ridge*t;}
