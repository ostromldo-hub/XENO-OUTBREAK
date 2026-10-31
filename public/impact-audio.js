export const AUDIO_FILES=['rifle','smg','marksman','pulse','sniper'].map(k=>'gun-'+k).concat(['dirt','wood'].flatMap(s=>[0,1,2,3].map(i=>'step-'+s+'-'+i)));
export function createImpactAudio(context){
 const buffers=new Map(),master=context.createGain(),limiter=context.createDynamicsCompressor();master.gain.value=.65;limiter.threshold.value=-12;limiter.knee.value=14;limiter.ratio.value=5;limiter.attack.value=.003;limiter.release.value=.18;master.connect(limiter);limiter.connect(context.destination);
 const ready=Promise.all(AUDIO_FILES.map(async key=>{try{const response=await fetch('/assets/audio/'+key+'.wav');if(!response.ok)return;buffers.set(key,await context.decodeAudioData(await response.arrayBuffer()));}catch{}}));
 let lastStep=-1;const voices=[];
 function play(type,volume,pan){let key=type;if(type.startsWith('step-')){let variant=Math.floor(Math.random()*4);if(variant===lastStep)variant=(variant+1)%4;lastStep=variant;key=type+'-'+variant;}
  const buffer=buffers.get(key);if(!buffer)return false;
  // Bound overlapping tails during automatic fire.
  while(voices.length>=24){const old=voices.shift();try{old.stop();}catch{}}
  const source=context.createBufferSource(),gain=context.createGain(),stereo=context.createStereoPanner();source.buffer=buffer;source.playbackRate.value=type.startsWith('step-')?.94+Math.random()*.12:.98+Math.random()*.04;gain.gain.value=volume;stereo.pan.value=pan;source.connect(gain);gain.connect(stereo);stereo.connect(master);voices.push(source);source.onended=()=>{const i=voices.indexOf(source);if(i>=0)voices.splice(i,1);source.disconnect();gain.disconnect();stereo.disconnect();};source.start();return true;
 }
 return {play,ready};
}
