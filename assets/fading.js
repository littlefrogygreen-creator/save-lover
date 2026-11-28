/* Presentation only. Never writes game, hardware, score or dialogue state. */
window.Fading=(()=>{
  const el=id=>document.getElementById(id),stage=el('stage'),active=new Map();
  let phase='ATTRACT',entered=0,lastTick=0,lastPress=-1e9,warmth=0,shockAt=-1e9,cursor=0,rippleCursor=0,dabCursor=0,strokeCursor=0;
  const gentle=()=>stage.dataset.motion==='soft'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.insertAdjacentHTML('beforeend',`
    <svg id="colorScene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><radialGradient id="colorFeather"><stop offset="0" stop-color="white"/><stop offset=".55" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
      <mask id="colorWindow"><rect width="1600" height="900" fill="black"/><ellipse id="colorHalo" cx="1185" cy="635" rx="380" ry="235" fill="url(#colorFeather)"/></mask></defs>
      <use href="#sceneDrawing" mask="url(#colorWindow)"/>
    </svg>
    <div id="fadingPaper" aria-hidden="true"></div>
    <div id="paintLayer" aria-hidden="true"><div id="colorWash"></div><div id="colorWave"></div>${Array.from({length:48},(_,i)=>`<i class="paint-petal" id="paintPetal${i}"></i>`).join('')}</div>
    <div id="paintAccents" aria-hidden="true"><div id="inkCurtain"></div><div id="colorRibbon"></div>${Array.from({length:6},(_,i)=>`<i class="paint-ripple" id="paintRipple${i}"></i>`).join('')}${Array.from({length:12},(_,i)=>`<i class="paint-dab" id="paintDab${i}"></i>`).join('')}${Array.from({length:8},(_,i)=>`<i class="paint-stroke" id="paintStroke${i}"></i>`).join('')}</div>
`);
  function animate(node,frames,duration,delay=0){
    if(active.has(node))active.get(node).cancel();
    if(gentle())return;
    const a=node.animate(frames,{duration,delay,easing:'cubic-bezier(.16,.65,.25,1)'});active.set(node,a);
    a.onfinish=a.oncancel=()=>{if(active.get(node)===a)active.delete(node);};
  }
  function clear(){for(const a of active.values())a.cancel();active.clear();}
  const colors=['#a57caf','#de8973','#dfb45f','#72a48e','#8b9fb7'];
  function ripple(x=1185,y=635,big=false,delay=0){
    const node=el('paintRipple'+rippleCursor++%6);node.style.left=x+'px';node.style.top=y+'px';node.style.borderColor=colors[rippleCursor%5];
    animate(node,[{opacity:0,transform:'translate(-50%,-50%) rotate(-8deg) scale(.25)'},{opacity:.8,offset:.12},{opacity:0,transform:'translate(-50%,-50%) rotate(8deg) scale('+(big?5:1.65)+')'}],big?1700:750,delay);
  }
  function dab(big=false){
    const node=el('paintDab'+dabCursor++%12);node.style.left=(1120+Math.sin(dabCursor*2.4)*100)+'px';node.style.top=(610+Math.cos(dabCursor*1.8)*55)+'px';node.style.background=colors[dabCursor%5];
    animate(node,[{opacity:0,transform:'translate(-50%,-50%) scale(.2) rotate(-12deg)'},{opacity:.2,offset:.16},{opacity:.12,offset:.5},{opacity:0,transform:'translate(-50%,-50%) scale('+(big?4:1.7)+') rotate(15deg)'}],big?2200:1300);
  }
  function stroke(big=false){
    const node=el('paintStroke'+strokeCursor++%8);node.style.left=(big?500:990+Math.sin(strokeCursor)*65)+'px';node.style.top=(big?720:704+Math.cos(strokeCursor)*20)+'px';node.style.width=(big?1000:360)+'px';node.style.background=colors[strokeCursor%5];
    animate(node,[{opacity:0,clipPath:'inset(0 100% 0 0)',transform:'rotate(-2deg)'},{opacity:.4,clipPath:'inset(0 0 0 0)',offset:.35},{opacity:0,clipPath:'inset(0 0 0 0)',transform:'rotate(1deg)'}],big?2300:1300);
  }
  function paint(n=12,big=false){
    if(gentle())return;
    for(let i=0;i<n;i++){
      const p=el('paintPetal'+cursor++%48),angle=i*2.399+cursor*.3,reach=(big?330:140)*(1+(i%3)*.2);
      p.style.background=colors[cursor%5];p.style.left='1185px';p.style.top='635px';p.style.borderRadius=i%3===0?'50%':'70% 25% 65% 30%';p.style.width=(i%3===0?5:10)+'px';p.style.height=(i%3===0?5:22)+'px';
      animate(p,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.8,offset:.12},{opacity:.5,offset:.5},{opacity:0,transform:`translate(${Math.cos(angle)*reach}px,${Math.sin(angle)*reach*.65-45}px) rotate(${angle*80}deg) scale(${big?1.8:1})`}],big?1900:1050);
    }
  }
  function sweep(){animate(el('inkCurtain'),[{opacity:0,transform:'translateX(-110%) rotate(-5deg)'},{opacity:.55,offset:.35},{opacity:0,transform:'translateX(160%) rotate(5deg)'}],1300);}
  function state(s){
    phase=s;entered=performance.now();stage.dataset.fading=s.toLowerCase();
    const warm=['ATTRACT','PHOTO','INTRO'].includes(s);
    if(warm){warmth=0;shockAt=-1e9;}
    if(s==='COLLAPSE'){warmth=0;animate(el('fadingPaper'),[{opacity:0},{opacity:.6,offset:.5},{opacity:0}],1900);}
    if(['INTRO','CALL','POSTURE','AED_ON','CPR'].includes(s))sweep();
    if(s==='COLLAPSE'){paint(32,true);ripple(1185,665,true);}
    if(s==='CPR')animate(el('playCpr'),[{opacity:0,transform:'translateY(12px) rotate(-.6deg)'},{opacity:1,transform:'none'}],650);
    if(s==='ENDING'){clear();}
  }
  function compression(){
    lastPress=performance.now();warmth=Math.min(1,warmth+.065);
    const milestone=(G.roundCount+1)%10===0;
    paint(milestone?30:12,milestone);ripple();dab(milestone);
    if(milestone){ripple(1185,635,true,130);stroke();}
    animate(el('colorWash'),[{opacity:0,transform:'scale(.65)'},{opacity:.6,offset:.2},{opacity:0,transform:'scale(1.8)'}],950);
    animate(el('playCpr'),[{boxShadow:'0 0 0 0 #aa83b000'},{boxShadow:'0 0 0 7px #aa83b030',offset:.25},{boxShadow:'0 0 0 14px #aa83b000'}],420);

  }
  function shock(){
    shockAt=performance.now();warmth=Math.max(warmth,.65);paint(48,true);
    ripple(1185,635,true);ripple(1185,635,true,180);ripple(1185,635,true,360);dab(true);stroke(true);sweep();
    animate(el('colorRibbon'),[{opacity:0,transform:'scaleX(.05)'},{opacity:.6,offset:.2},{opacity:0,transform:'scaleX(1)'}],2300);
    animate(el('colorWave'),[{opacity:0,transform:'translate(-50%,-50%) scale(.15)'},{opacity:.65,offset:.15},{opacity:0,transform:'translate(-50%,-50%) scale(4)'}],1800);
  }
  function tick(now){
    if(now-lastTick<32)return;const dt=Math.min(100,now-lastTick);lastTick=now;
    if(gentle()&&active.size)clear();
    const warm=['ATTRACT','PHOTO','INTRO'].includes(phase),ending=['ENDING','DEBRIEF','CERT'].includes(phase);
    if(!warm&&!ending&&now-lastPress>1000)warmth=Math.max(0,warmth-dt*.000025);
    const since=Math.max(0,now-lastPress),pulse=gentle()?0:Math.max(0,1-since/1000),wave=gentle()?0:Math.max(0,1-(now-shockAt)/3400);
    const fade=phase==='COLLAPSE'?Math.min(1,(now-entered)/1900):1;
    const saturation=warm?1:ending?(G.kind==='A'?1:.12):1-fade+fade*(.12+warmth*.22);
    stage.style.setProperty('--world-color',saturation.toFixed(3));
    stage.style.setProperty('--local-color',warm||ending?'0':String(Math.min(1,.2+warmth*.65+pulse*.32+wave*.5)));
    el('colorHalo').setAttribute('rx',String(Math.round(270+warmth*190+pulse*160+wave*1100)));
    el('colorHalo').setAttribute('ry',String(Math.round(175+warmth*100+pulse*85+wave*650)));
  }
  function reset(){clear();phase='ATTRACT';warmth=0;lastPress=shockAt=-1e9;entered=lastTick=0;stage.dataset.fading='attract';stage.style.setProperty('--world-color','1');stage.style.setProperty('--local-color','0');}
  return{reset,state,compression,shock,tick,get activeCount(){return active.size;}};
})();
