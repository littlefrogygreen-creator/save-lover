/* Pooled hand-drawn accents: never intercept input or change game timing. */
window.MotionFX=(()=>{
  const el=id=>document.getElementById(id),stage=el('stage'),active=new Map();
  let cursor=0,soft=false,lastChapter='';
  try{soft=localStorage.getItem('sl_motion')==='soft';}catch(_){}
  stage.insertAdjacentHTML('beforeend',`<div id="motionLayer" aria-hidden="true"><div id="paperSweep"></div><div id="chapterAccent"></div>${Array.from({length:24},(_,i)=>`<i class="ink-mark" id="inkMark${i}"></i>`).join('')}<i id="actionRing"></i></div><button id="motionToggle" type="button"></button>`);
  function gentle(){return soft||matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function preference(){stage.dataset.motion=gentle()?'soft':'rich';el('motionToggle').textContent='動態 '+(gentle()?'柔和':'豐富');el('motionToggle').setAttribute('aria-pressed',String(!gentle()));}
  function cancel(node){const a=active.get(node);if(a){a.cancel();active.delete(node);}}
  function play(node,frames,duration=400,delay=0){cancel(node);if(gentle())return;const a=node.animate(frames,{duration,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'none'});active.set(node,a);a.onfinish=a.oncancel=()=>{if(active.get(node)===a)active.delete(node);};}
  function burst(x,y,color='#d7aa58',count=7){if(gentle())return;for(let i=0;i<count;i++){const node=el('inkMark'+cursor++%24),angle=(Math.PI*2*i/count)-.5,dx=Math.cos(angle),dy=Math.sin(angle);node.style.left=x+'px';node.style.top=y+'px';node.style.background=color;play(node,[{opacity:0,transform:`translate(${dx*13}px,${dy*13}px) rotate(${angle}rad) scaleX(.3)`},{opacity:.9,offset:.17,transform:`translate(${dx*29}px,${dy*29}px) rotate(${angle}rad) scaleX(1)`},{opacity:0,transform:`translate(${dx*56}px,${dy*56}px) rotate(${angle}rad) scaleX(.4)`}],520);}}
  function ring(x,y,color='#8a7a9e'){const node=el('actionRing');node.style.left=x+'px';node.style.top=y+'px';node.style.borderColor=color;play(node,[{opacity:.8,transform:'translate(-50%,-50%) scale(.4)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.7)'}],480);}
  function reset(){for(const a of active.values())a.cancel();active.clear();lastChapter='';stage.classList.remove('aed-analysing');preference();}
  function state(s){preference();stage.classList.toggle('aed-analysing',s==='AED_ANALYSE');const chapter=s==='INTRO'?'一杯茶的時間':s==='COLLAPSE'?'突然，她冇再出聲。':s==='CPR'?(G.shocked?'繼續，唔好停。':'用一雙手，爭取時間。'):s==='ENDING'?'救護員接手。':'';
    if(chapter&&chapter!==lastChapter){lastChapter=chapter;play(el('paperSweep'),[{transform:'translateX(-120%) skewX(-12deg)',opacity:0},{opacity:.55,offset:.3},{transform:'translateX(220%) skewX(-12deg)',opacity:0}],750);}
    if(s==='CPR')play(el('playCpr'),[{opacity:0,transform:'translate(-25px,12px) scale(.96)'},{opacity:1,transform:'translate(3px,0) scale(1.005)',offset:.75},{opacity:1,transform:'none'}],520);
    if(s.startsWith('AED_'))play(el('aedLcd'),[{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],280);
    if(s==='AED_ON')play(el('aed'),[{opacity:0,transform:'translateY(22px) scale(.97)'},{opacity:1,transform:'none'}],470);
    if(s==='POSTURE')play(el('brief'),[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],440);
  }
  function dialog(who){play(el('dialog'),[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(-2px)',offset:.8},{opacity:1,transform:'none'}],310);if(who==='gm')play(el('gmPortrait'),[{opacity:.3,transform:'translateY(-50%) scale(.87)'},{opacity:1,transform:'translateY(-50%) scale(1.04)',offset:.7},{opacity:1,transform:'translateY(-50%) scale(1)'}],370);}
  function compression(c){const training=G.mode==='train',color=training?(c.good?'#458475':'#ba8755'):'#8a7a9e';ring(1170,640,color);if(training&&c.good)burst(1170,638,color,5);if(training&&(G.roundCount+1)%10===0){burst(370,310,'#d7aa58',10);play(el('playCpr'),[{transform:'scale(1)'},{transform:'scale(1.012)',offset:.4},{transform:'none'}],300);}play(el('playCount'),[{transform:'scale(1.3)',opacity:.6},{transform:'scale(.97)',offset:.7,opacity:1},{transform:'scale(1)',opacity:1}],260);}
  function land(){play(el('scene'),[{transform:'translate(0)'},{transform:'translate(6px,3px)',offset:.2},{transform:'translate(-4px,-1px)',offset:.45},{transform:'translate(2px,0)',offset:.7},{transform:'none'}],320);burst(1170,705,'#b19b80',9);}
  function action(ev){if(ev==='shoulder'&&G.state==='RESPONSE'){ring(1125,638);burst(1125,638,'#8a7a9e',6);}if(ev==='phone'&&G.state==='CALL'){burst(1360,165,'#7e8da8',7);play(el('objective'),[{transform:'translateX(-50%) scale(.94)'},{transform:'translateX(-50%) scale(1)'}],300);}}
  function shock(){Fading.shock();ring(805,420,'#458475');burst(805,420,'#d7aa58',12);play(el('aedDev'),[{transform:'scale(1)'},{transform:'scale(1.025)',offset:.35},{transform:'none'}],350);}
  el('motionToggle').onclick=()=>{soft=!gentle();try{localStorage.setItem('sl_motion',soft?'soft':'rich');}catch(_){}for(const a of active.values())a.cancel();active.clear();preference();};
  stage.addEventListener('pointerdown',e=>{const button=e.target.closest('button,#startCue');if(button)play(button,[{transform:'scale(.95)'},{transform:'scale(1.03)',offset:.65},{transform:'scale(1)'}],230);});
  preference();return{reset,state,dialog,compression,land,action,shock,burst,ring,get activeCount(){return active.size;}};
})();
