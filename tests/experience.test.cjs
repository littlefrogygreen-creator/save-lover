const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
// Exercise the real scripts against a deterministic DOM/audio/hardware harness.
function game(fast=true){
  let now=1000,id=0;const timers=new Map(),nodes=new Map(),listeners={},sounds=[];
  class Node{
    constructor(key=''){this.key=key;this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.children=[];this.textContent='';this.hidden=false;this.className='';this.classList={add:(...a)=>{this.className=[...new Set([...this.className.split(' '),...a])].join(' ');},remove:(...a)=>{this.className=this.className.split(' ').filter(x=>!a.includes(x)).join(' ');},contains:a=>this.className.split(' ').includes(a),toggle:(a,v)=>{v??=!this.classList.contains(a);this.classList[v?'add':'remove'](a);return v;}};}
    set id(v){this._id=v;nodes.set('#'+v,this);}get id(){return this._id;}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
    addEventListener(k,f){(this.events??={})[k]=f;}appendChild(c){this.children.push(c);}
    insertAdjacentHTML(_,s){for(const m of s.matchAll(/id="([^"]+)"/g))get('#'+m[1]);}
    querySelector(s){return get(this.key+' '+s);}querySelectorAll(s){return list(this.key+' '+s);}
    getContext(){return{clearRect(){},save(){},restore(){},translate(){},scale(){},drawImage(){}};}
    animate(){return{cancel(){},onfinish:null};}getBBox(){return{};}setPointerCapture(){}
  }
  function get(k){if(!nodes.has(k))nodes.set(k,new Node(k));return nodes.get(k);}
  function list(k){const n=k==='.bs'?3:k==='#aedSteps div'?4:k.includes('.rhythm-dot')?3:k.includes('[data-phase]')?4:k.includes('.pad')?2:1;return Array.from({length:n},(_,i)=>{const e=get(k+':'+i);e.dataset.s=i+1;return e;});}
  const html=fs.readFileSync('index.html','utf8');for(const m of html.matchAll(/id="([^"]+)"/g))get('#'+m[1]);
  const param=()=>({value:0,setValueAtTime(v){assert(Number.isFinite(v));},linearRampToValueAtTime(v){assert(Number.isFinite(v));},exponentialRampToValueAtTime(v){assert(v>0&&Number.isFinite(v));},setTargetAtTime(){}});
  class Context{constructor(){this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination={};}resume(){return Promise.resolve();}createGain(){return{gain:param(),connect(){},disconnect(){}};}createOscillator(){sounds.push('tone');return{frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}createBuffer(_,n){return{getChannelData:()=>new Float32Array(n)};}createBufferSource(){sounds.push('buffer');return{connect(){},disconnect(){},start(){},stop(){}};}createBiquadFilter(){return{frequency:param(),Q:param(),connect(){},disconnect(){}};}createDynamicsCompressor(){return{threshold:param(),ratio:param(),connect(){}};}}
  const c={console,URLSearchParams,Float32Array,Math,Date,JSON,performance:{now:()=>now},location:{search:fast?'?fast':'',protocol:'http:'},innerWidth:1600,innerHeight:900,navigator:{},localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:false}),Image:class{},AudioContext:Context,document:{getElementById:id=>get("#"+id),querySelector:get,querySelectorAll:list,createElement:()=>new Node(),documentElement:get('html')},setTimeout:(f,d=0)=>{timers.set(++id,{f,t:now+d});return id;},clearTimeout:n=>timers.delete(n),setInterval:()=>0,addEventListener:(n,f)=>{(listeners[n]??=[]).push(f);},requestAnimationFrame:()=>0,fetch:()=>Promise.resolve({ok:false}),Audio:class{addEventListener(){}}};c.window=c;vm.createContext(c);
  for(const p of ['assets/foley.js','assets/experience.js','assets/theatre.js','assets/motion.js','assets/fading.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);
  for(const s of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(s[1],c);
  const run=s=>vm.runInContext(s,c);
  function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+10);for(const [i,t] of [...timers])if(t.t<=now){timers.delete(i);t.f();}run('frame(performance.now())');}}
  function press(){run('HW.contact=0;contactDown();');advance(80);run('HW.contact=0');advance(465);}
  return{c,run,advance,press,get,sounds,listeners};
}
// AED input and its previous state remain boolean across every input route.
const input=game();assert.equal(input.run('HW.aed'),false);assert.equal(input.run('PREV.aed'),false);
input.run("globalThis.aedEvents=0;const originalFire=fire;fire=k=>{if(k==='aed')aedEvents++;else originalFire(k);}");
input.get('#sim_aed').onpointerdown({preventDefault(){},pointerId:1});assert.equal(input.run('HW.aed'),true);assert.equal(input.run('PREV.aed'),true);
input.get('#sim_aed').onpointerup();assert.equal(input.run('HW.aed'),false);input.advance(20);assert.equal(input.run('aedEvents'),1);
const aedKey={key:'ArrowUp',code:'ArrowUp',repeat:false,preventDefault(){}};
for(const f of input.listeners.keydown)f(aedKey);assert.equal(input.run('HW.aed'),true);assert.equal(input.run('PREV.aed'),true);
for(const f of input.listeners.keydown)f({...aedKey,repeat:true});input.advance(20);assert.equal(input.run('aedEvents'),2);
for(const f of input.listeners.keyup)f(aedKey);assert.equal(input.run('HW.aed'),false);input.advance(20);
input.run("simAct('aed')");assert.equal(input.run('HW.aed'),true);input.advance(20);assert.equal(input.run('aedEvents'),3);input.advance(20);assert.equal(input.run('aedEvents'),3);
input.get('#sim_aed').onpointercancel();assert.equal(input.run('HW.aed'),false);
input.run('HW.aed=true;PREV.aed=true;reset()');assert.equal(input.run('HW.aed'),false);assert.equal(input.run('PREV.aed'),false);
input.run('HW.aed=true');input.advance(20);assert.equal(input.run('aedEvents'),4);assert.equal(input.run('PREV.aed'),true);
const start=game(false);start.run('cam={}');start.get('#startCue').onclick();assert.equal(start.get('#title').style.display,'none');assert.equal(start.get('#dialog').style.display,'none');start.advance(500);start.get('#startCue').onclick();start.advance(490);assert.equal(start.run('G.state'),'ATTRACT');assert.equal(start.run('G.busy'),false);assert.equal(start.get('#teaPotMotion').getAttribute('transform'),'');start.advance(10);assert.equal(start.run('G.state'),'INTRO');assert.equal(start.get('#startCue').getAttribute('aria-busy'),'false');assert.equal(start.get('#dialog').style.display,'block');assert(start.run('G.curLine').startsWith('星期六朝早'));start.advance(490);assert.equal(start.get('#teaPotMotion').getAttribute('transform'),'translate(0,0) rotate(0 908 414)');assert.equal(start.get('#teaStream').style.opacity,'0');start.advance(20);assert.notEqual(start.get('#teaPotMotion').getAttribute('transform'),'translate(0,0) rotate(0 908 414)');
const cancelledStart=game(false);cancelledStart.get('#startCue').onclick();cancelledStart.advance(500);cancelledStart.run('reset()');cancelledStart.advance(1500);assert.equal(cancelledStart.run('G.state'),'ATTRACT');assert.equal(cancelledStart.run('startTimer'),null);assert.equal(cancelledStart.get('#title').style.display,'flex');
const g=game();g.run("fire('pot')");g.advance(1400);assert.equal(g.run('G.state'),'RESPONSE');
g.run("fire('shoulder')");g.advance(65);assert.equal(g.run('G.state'),'CALL');assert.equal(g.get('#objZh').textContent,'正在自動撥打 999 · 免提求救');
assert.equal(g.run('G.called'),false);assert.equal(g.run('KEYS.arrowright'),undefined);assert(!g.get('#simObjs').children.some(b=>b.id==='sim_phone'));
g.run("fire('phone');fire('dial')");assert.equal(g.run('G.pending.length'),0);
g.advance(30);assert.equal(g.get('#dZh').textContent,g.run('CALL_SCRIPT[0][1]'));g.advance(120);assert.equal(g.run('G.state'),'AIRWAY');assert.equal(g.run('G.called'),true);assert.equal(g.run('G.log.call.s'),'ok');
g.run("fire('chin')");g.advance(700);assert.equal(g.run('G.state'),'CPR');
assert.equal(g.get('#playCpr').style.display,'block');assert.equal(g.get('#vitals').style.display,'none');
for(let i=0;i<60;i++)g.press();g.advance(300);assert.equal(g.run('G.state'),'AED_PADS');assert.equal(g.run('G.roundCount'),60);
// A short pointer click is a discrete event, independent of render-frame timing.
g.get('#sim_aed').onpointerdown({preventDefault(){},pointerId:1});g.get('#sim_aed').onpointerup();g.advance(100);assert.equal(g.run('G.state'),'AED_SHOCK');
g.get('#sim_aed').onpointerdown({preventDefault(){},pointerId:1});g.get('#sim_aed').onpointerup();g.advance(100);assert.equal(g.run('G.state'),'CPR');assert.equal(g.run('G.shocked'),true);assert.equal(g.run('G.roundCount'),0);
for(let i=0;i<60;i++)g.press();g.advance(1800);assert.equal(g.run('G.state'),'DEBRIEF');assert(!g.get('#debrief').innerHTML.includes('存活機會'));assert.equal(g.run('stats().n'),120);
g.run('reset()');g.advance(20);assert.equal(g.get('#playCount').textContent,'0');assert.equal(g.get('#playCpr').style.display,'none');assert(g.get('#postureHelp').hidden);
g.run("G.mode='real';go('CPR')");g.advance(20);assert(g.get('#playCpr').classList.contains('real-mode'));
g.run('serialOk=true;lastFrame=performance.now();HW.depth=55;simTick()');assert.equal(g.run('HW.depth'),55);g.advance(10);assert.equal(g.get('#playDepthValue').textContent,'5.5 cm');assert(!g.get('#playDepth').classList.contains('contact-only'));
g.run('serialOk=false');g.advance(10);assert(g.get('#playDepth').classList.contains('contact-only'));assert.equal(g.get('#playDepthNote').textContent,'接觸開關 · 未量測深度');
const a=game(false);a.run('unlockAudio()');for(const name of ['cup','pour','fall','touch','press','beat','phone','pad','shock','room'])a.c.Experience.sound(name);assert(a.sounds.length>15);a.get('#soundToggle').onclick();const before=a.sounds.length;a.c.Experience.sound('fall');a.run('beep()');assert.equal(a.sounds.length,before);a.get('#soundToggle').onclick();assert(a.c.Experience.enabled);
let utterance;a.c.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};a.c.speechSynthesis={getVoices:()=>[{lang:'zh-HK',name:'Test Cantonese'}],speak:u=>{utterance=u;},resume(){}};a.run("ttsSpeak('測試','gm')");assert.equal(utterance.lang,'zh-HK');assert.equal(utterance.pitch,1.08);utterance.onstart();assert.equal(a.run('MUS.duck'),1);utterance.onend();assert.equal(a.run('MUS.duck'),0);
const scene=game(false);scene.run("go('INTRO')");scene.advance(1500);assert.equal(scene.get('#teaStream').style.opacity,'1');assert(Number(scene.get('#teaWater').getAttribute('height'))>0);scene.advance(2000);assert.equal(scene.get('#teaWater').getAttribute('height'),'13');scene.run("show('gm','心口好翳','')");assert.equal(scene.get('#gmSitImage').getAttribute('href'),'assets/art/grandma-unwell.png');scene.run("stopTalk();go('COLLAPSE')");scene.advance(500);assert(scene.get('#stage').classList.contains('is-falling'));assert.equal(scene.get('#sceneWhisper').textContent,'');scene.advance(700);assert(!scene.get('#stage').classList.contains('is-falling'));assert.equal(scene.get('#fallingPose').style.display,'none');scene.run('reset()');scene.advance(5000);assert.equal(scene.run('G.state'),'ATTRACT');assert.equal(scene.get('#gmSitImage').getAttribute('href'),'assets/art/grandma-seated-v2.png');scene.c.matchMedia=()=>({matches:true});scene.run("go('COLLAPSE')");scene.advance(20);assert(!scene.get('#stage').classList.contains('is-falling'));
for(const name of ['cup','pour','fall','pad','press','touch']){const b=fs.readFileSync('assets/sound/'+name+'.wav');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(24),22050);assert.equal(b.readUInt32LE(40),b.length-44);assert(b.length>4000);}
const motion=game();for(let i=0;i<100;i++)motion.c.MotionFX.compression({good:true});assert(motion.c.MotionFX.activeCount<=30);motion.c.MotionFX.reset();assert.equal(motion.c.MotionFX.activeCount,0);motion.get('#motionToggle').onclick();assert.equal(motion.get('#stage').dataset.motion,'soft');motion.c.MotionFX.burst(10,10);assert.equal(motion.c.MotionFX.activeCount,0);motion.get('#motionToggle').onclick();assert.equal(motion.get('#stage').dataset.motion,'rich');motion.c.matchMedia=()=>({matches:true});motion.c.MotionFX.reset();motion.c.MotionFX.land();assert.equal(motion.c.MotionFX.activeCount,0);assert.equal(motion.get('#stage').dataset.motion,'soft');
const cancelledCall=game(false);cancelledCall.run("go('CALL')");cancelledCall.advance(500);cancelledCall.run('reset()');cancelledCall.advance(20000);assert.equal(cancelledCall.run('G.state'),'ATTRACT');assert.equal(cancelledCall.run('G.called'),false);
assert.equal(cancelledCall.run('CALL_RING.voices.size'),0);assert.equal(cancelledCall.run('CALL_RING.timer'),null);
const ringing=game(false);ringing.run("unlockAudio();go('CALL')");assert.equal(ringing.run('CALL_RING.voices.size'),4);ringing.advance(2400);assert.equal(ringing.run('CALL_RING.voices.size'),8);ringing.advance(2400);assert.equal(ringing.run('CALL_RING.voices.size'),12);ringing.advance(1690);assert.equal(ringing.run('G.called'),false);ringing.advance(10);assert.equal(ringing.run('G.called'),true);assert.equal(ringing.run('CALL_RING.voices.size'),0);assert.equal(ringing.run('CALL_RING.timer'),null);assert.equal(ringing.get('#dZh').textContent,ringing.run('CALL_SCRIPT[0][1]'));
const mutedRing=game(false);mutedRing.run("unlockAudio();go('CALL')");mutedRing.get('#soundToggle').onclick();assert.equal(mutedRing.run('CALL_RING.voices.size'),0);assert.equal(mutedRing.run('CALL_RING.timer'),null);const mutedSounds=mutedRing.sounds.length;mutedRing.advance(6500);assert.equal(mutedRing.sounds.length,mutedSounds);assert.equal(mutedRing.run('G.called'),true);
const skippedCall=game(false);skippedCall.run("go('CALL');nextLine();nextLine();nextLine();nextLine()");assert.equal(skippedCall.run('G.state'),'AIRWAY');assert.equal(skippedCall.run('G.log.call.s'),'ok');
const recordingLines=JSON.parse(fs.readFileSync('record.html','utf8').match(/const LINES = (\[.*\]);/)[1]);
// The colour theme is presentation-only, bounded, and follows motion preferences.
const fading=game();fading.run("G.t0=performance.now();go('CPR')");const gameBefore=fading.run('JSON.stringify({G,HW,PREV})');
fading.c.Fading.state('CPR');for(let i=0;i<150;i++)fading.c.Fading.compression();fading.c.Fading.shock();fading.c.Fading.tick(5000);
assert.equal(fading.run('JSON.stringify({G,HW,PREV})'),gameBefore);assert(fading.c.Fading.activeCount<=80);assert(Number(fading.get('#stage').style['--local-color'])>0);assert(Number(fading.get('#stage').style['--world-color'])<1);
fading.get('#motionToggle').onclick();fading.c.Fading.tick(5100);assert.equal(fading.c.Fading.activeCount,0);fading.c.Fading.compression();fading.c.Fading.shock();assert.equal(fading.c.Fading.activeCount,0);
fading.run('reset()');assert.equal(fading.c.Fading.activeCount,0);assert.equal(fading.get('#stage').style['--world-color'],'1');assert.equal(fading.get('#stage').style['--local-color'],'0');
fading.run("G.shocked=true;G.kind='C'");fading.c.Fading.state('ENDING');fading.c.Fading.tick(5200);assert.equal(fading.get('#stage').style['--world-color'],'0.120');fading.run("G.kind='A'");fading.c.Fading.tick(5300);assert.equal(fading.get('#stage').style['--world-color'],'1.000');
// An early AED press cannot bypass either mode's first round, including mid-CPR.
for(const [mode,target] of [['train',60],['real',90]]){
  const practice=game();practice.run(`setMode('${mode}');G.t0=performance.now();go('RESPONSE');fire('aed');stopTalk();go('PRECPR')`);practice.advance(500);
  assert.equal(practice.run('G.state'),'CPR');assert.equal(practice.run('G.round'),1);assert.equal(practice.run('G.aedFetched'),true);assert.equal(practice.run('G.log.cpr1'),undefined);assert.equal(practice.get('#cntOf').textContent,'/ '+target);assert.equal(practice.get('#playTarget').textContent,mode==='train'?' / '+target:' 下');
  for(let i=0;i<target-1;i++)practice.press();assert.equal(practice.run('G.state'),'CPR');assert.equal(practice.run('G.roundCount'),target-1);practice.press();practice.advance(300);assert.equal(practice.run('G.state'),'AED_PADS');assert.equal(practice.run('G.roundCount'),target);
  practice.get('#sim_aed').onpointerdown({preventDefault(){},pointerId:1});practice.get('#sim_aed').onpointerup();practice.advance(100);assert.equal(practice.run('G.state'),'AED_SHOCK',practice.run('JSON.stringify({mode:G.mode,busy:G.busy,pending:G.pending,queue:G.queue})'));
  practice.get('#sim_aed').onpointerdown({preventDefault(){},pointerId:1});practice.get('#sim_aed').onpointerup();practice.advance(100);assert.equal(practice.run('G.state'),'CPR');assert.equal(practice.run('G.round'),2);assert.equal(practice.run('G.roundCount'),0);
  for(let i=0;i<target-1;i++)practice.press();assert.equal(practice.run('G.state'),'CPR');assert.equal(practice.run('G.roundCount'),target-1);assert.equal(practice.run('G.log.cpr2'),undefined);practice.press();practice.advance(1800);assert.equal(practice.run('G.state'),'DEBRIEF');assert.equal(practice.run('stats().n'),target*2);assert.equal(practice.run('G.log.cpr2.s'),'ok');assert(practice.get('#debrief').innerHTML.includes('第一輪心外壓 '+target+' 下'));assert(practice.get('#debrief').innerHTML.includes('電擊後再做 '+target+' 下'));
  const during=game();during.run(`setMode('${mode}');go('CPR')`);during.press();during.run("fire('aed')");during.advance(300);assert.equal(during.run('G.state'),'CPR');assert.equal(during.run('G.roundCount'),1);assert.equal(during.run('G.log.cpr1'),undefined);
}
async function testCallVoice(){
  const spoken=[],voice=game(false);voice.c.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};voice.c.speechSynthesis={getVoices:()=>[{lang:'zh-HK',name:'Test Cantonese'}],speak:u=>spoken.push(u),cancel(){},resume(){}};
  const lines=JSON.parse(voice.run('JSON.stringify([CALL_DECISION,...CALL_SCRIPT])'));
  const manifest=JSON.parse(fs.readFileSync('voice/index.json','utf8'));
  for(const [who,text] of lines){const clean=text.replace(/[「」『』]/g,'');assert(recordingLines.some(x=>x[0]===who&&x[1]===clean));assert(voice.run('VOICE_LINES').includes(clean));const id=voice.run(`voiceId(${JSON.stringify(clean)})`);assert.equal(manifest[id],'mp3');assert(fs.statSync('voice/'+id+'.mp3').size>1000);voice.run(`speak(${JSON.stringify(text)},${JSON.stringify(who)})`);await new Promise(resolve=>setImmediate(resolve));assert.equal(spoken.at(-1).text,clean);assert.equal(spoken.at(-1).lang,'zh-HK');}
}
testCallVoice().then(()=>console.log('PASS: 60 x 2 training and 90 x 2 real-mode presses; early AED cannot skip first CPR; automatic 999 call, ring cleanup, original recordings, reset, AED boolean input, depth, audio, scenes and reduced motion.')).catch(error=>{console.error(error);process.exitCode=1;});
