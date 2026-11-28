/* Scene-local performance. Timelines use the game clock, never delay an input. */
window.Theatre=(()=>{
  const el=id=>document.getElementById(id);
  let entered=0,phase='ATTRACT',poured=false,unwell=false,encouraged=0,lastCount=0,pourSound=false,landed=false;
  const rest='assets/art/grandma-seated-v2.png';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pose(src){el('gmSitImage').setAttribute('href',src);}
  function reset(){phase='ATTRACT';entered=0;poured=false;unwell=false;encouraged=0;lastCount=0;pose(rest);el('stage').classList.remove('is-falling','tea-poured','story-return','scene-unwell');el('fallingPose').style.display='none';el('teaPotMotion').setAttribute('transform','');el('teaStream').style.opacity='0';el('teaWater').setAttribute('height','0');el('sceneWhisper').textContent='';}
  function state(s){phase=s;entered=performance.now();pourSound=false;landed=false;el('sceneWhisper').textContent='';el('stage').classList.remove('is-falling');el('fallingPose').style.display='none';if(s!=='INTRO')el('teaStream').style.opacity='0';if(s==='INTRO'){poured=false;unwell=false;pose(rest);}if(s==='COLLAPSE'){unwell=false;el('stage').classList.remove('scene-unwell');if(!FAST&&!reduced())el('stage').classList.add('is-falling');}if(s==='CPR'){encouraged=0;lastCount=0;}if(s==='ENDING'){el('sceneWhisper').textContent='';} }
  function mood(who,zh){if(who==='gm'&&G.state==='INTRO'&&grandmaExpression(zh)==='worried'){unwell=true;pose('assets/art/grandma-unwell.png');el('stage').classList.add('scene-unwell');}if(who==='gm'&&G.state==='ENDING'){pose(rest);el('stage').classList.add('story-return');el('teaWater').setAttribute('height','13');el('sceneWhisper').textContent='同一張枱，同一杯茶。';}}
  function action(ev){if(ev==='shoulder'&&G.state==='RESPONSE')el('sceneWhisper').textContent='冇反應。';if(ev==='phone'&&G.state==='CALL')el('sceneWhisper').textContent='電話接通，唔使一個人面對。';}
  function tick(now){const t=now-entered,stage=el('stage');
    if(phase==='INTRO'&&!unwell){
      const a=FAST?1:Math.max(0,Math.min(1,(t-500)/2600)),lift=a<.2?a/.2:a>.78?(1-a)/.22:1;
      el('teaPotMotion').setAttribute('transform',reduced()?'':`translate(${lift*36},${-lift*38}) rotate(${lift*18} 908 414)`);
      const pouring=a>.24&&a<.72;el('teaStream').style.opacity=pouring?'1':'0';
      if(pouring&&!pourSound){pourSound=true;Experience.sound('pour');}
      const fill=Math.max(0,Math.min(1,(a-.24)/.48))*13;el('teaWater').setAttribute('height',String(fill));el('teaWater').setAttribute('y',String(459-fill));
      if(a>=.78&&!poured){poured=true;stage.classList.add('tea-poured');Experience.sound('cup');el('sceneWhisper').textContent='茶斟好喇。';}if(t>4300)el('sceneWhisper').textContent='';
    }
    if(phase==='COLLAPSE'){
      if(!landed&&(FAST||reduced()||t>=950)){landed=true;Experience.sound('fall');MotionFX.land();}
      const running=!FAST&&!reduced()&&t<1050;stage.classList.toggle('is-falling',running);
      el('fallingPose').style.display=running?'block':'none';
      if(running){const y=Math.min(1,t/850)*38;el('fallingPose').setAttribute('transform',`translate(${-Math.min(1,t/850)*35},${y})`);el('fallingPose').style.opacity=String(t<180?t/180:1);}
    }
    const active=['CPR','AED_WAIT'].includes(G.state);if(active){
      if(G.roundCount!==lastCount){lastCount=G.roundCount;if(G.mode==='train'&&G.roundCount>=10&&G.roundCount%10===0&&G.roundCount!==encouraged){encouraged=G.roundCount;el('sceneWhisper').textContent=G.roundCount===10?'我喺度，繼續。':'保持，救護員正趕嚟。';}}
      if(now-G.lastComp>1800)el('sceneWhisper').textContent='';
    }
    el('sceneWhisper').style.display=['INTRO','COLLAPSE','RESPONSE','CALL','CPR','ENDING'].includes(G.state)?'block':'none';
  }
  return{reset,state,mood,action,tick};
})();
