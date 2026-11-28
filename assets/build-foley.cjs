// Original deterministic physical-model sketches; no third-party recordings.
const fs=require('fs'),path=require('path');const rate=22050;let seed=931;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2147483648-1;};
function render(name,duration,fn){const n=Math.ceil(duration*rate),b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/rate,v=fn(t,i);const fade=Math.min(1,t/.008,(duration-t)/.025);b.writeInt16LE(Math.round(Math.tanh(v)*fade*24000),44+i*2);}fs.writeFileSync(path.join(__dirname,'sound',name+'.wav'),b);}
fs.mkdirSync(path.join(__dirname,'sound'),{recursive:true});
const ceramic=t=>[1870,2860,4240,5890].reduce((s,f,i)=>s+Math.sin(2*Math.PI*f*t)*Math.exp(-t*(11+i*6))/(i+2),0);
render('cup',.65,t=>ceramic(t)*.5+(t>.09?ceramic(t-.09)*.12:0));
let low=0;render('pour',1.65,t=>{low=low*.76+rnd()*.24;const envelope=Math.sin(Math.PI*t/1.65)**.6;const bubble=Math.sin(2*Math.PI*(580*t+85*Math.sin(t*9)))*Math.exp(-((t*17)%1)*12);return(low*.42+bubble*.05)*envelope;});
render('touch',.26,t=>rnd()*.18*Math.exp(-t*19)*(Math.sin(t*170)**2));
render('fall',.85,t=>{const bump=Math.sin(2*Math.PI*62*t)*Math.exp(-t*14)*.38;return bump+rnd()*.21*Math.exp(-t*10)+(t>.19?ceramic(t-.19)*.17:0);});
render('pad',.65,t=>rnd()*.15*Math.sin(Math.PI*t/.65)*(1+Math.sin(t*96))*.5);
render('press',.18,t=>Math.sin(2*Math.PI*(94*t-100*t*t))*.21*Math.exp(-t*28)+rnd()*.02*Math.exp(-t*40));
console.log('Built six original Foley samples.');
