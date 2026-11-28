/* Decoded samples are shared; first use has a procedural fallback. */
window.Foley=(()=>{
  const names=['cup','pour','touch','fall','pad','press'],buffers=new Map(),voices=new Set();let loading=false;
  function prime(){if(loading||typeof audio!=='function')return;const ac=audio();if(!ac)return;loading=true;
    names.forEach(name=>fetch('assets/sound/'+name+'.wav').then(r=>r.ok?r.arrayBuffer():null).then(b=>b?ac.decodeAudioData(b):null).then(b=>{if(b)buffers.set(name,b);}).catch(()=>{}));
  }
  function play(name){if(!buffers.has(name)){prime();return false;}const ac=audio();if(!ac)return false;const src=ac.createBufferSource(),gain=ac.createGain();src.buffer=buffers.get(name);gain.gain.value=name==='fall'?.48:name==='pour'?.38:.3;src.connect(gain);gain.connect(ac.destination);voices.add(src);src.onended=()=>{voices.delete(src);src.disconnect();gain.disconnect();};src.start();return true;}
  function stop(){voices.forEach(s=>{try{s.stop();}catch(_){}});voices.clear();}
  return{prime,play,stop};
})();
