// Living World 3A — painterly arena scars, entirely visual and sprite-cached.
// The player can leave at most 140 marks; older worlds seed subtle repeatable scars.
(() => {
  const KEY = "shadowLivingWorldV1";
  const MAX_SCARS = 140;
  const scars = [];
  const cachedSprites = new Map();
  const types = ["frost", "fire", "ruin", "water"];
  const hash = (x,y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const rngFrom = seed => {
    let n = ((seed * 4294967295) >>> 0) || 1;
    return () => { n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967296; };
  };
  function sprite(type, variant) {
    const key = type + variant;
    if (cachedSprites.has(key)) return cachedSprites.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const g = canvas.getContext("2d");
    const random = rngFrom(hash(variant + types.indexOf(type) * 17, 9));
    const mid = 128, r = 102;
    const disk = (radius, fill, scaleY=1) => {
      g.save();g.translate(mid,mid);g.scale(1,scaleY);
      g.fillStyle=fill;g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.fill();g.restore();
    };
    const grad = (inner, outer) => {
      const v=g.createRadialGradient(mid,mid,8,mid,mid,r);
      v.addColorStop(0,inner);v.addColorStop(.58,outer);v.addColorStop(1,"#00000000");return v;
    };
    if (type === "frost") {
      disk(r,grad("#73e4ff54","#358bae21"),.75);
      g.save();g.translate(mid,mid);
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+variant*.29;
        const length=(42+random()*45);
        g.save();g.rotate(a);g.strokeStyle=i%2?"#8ef0ffb3":"#cefaffb5";
        g.lineWidth=1.5+random()*2;g.beginPath();g.moveTo(0,0);
        g.lineTo(length,random()*9-4);g.stroke();
        for(let j=1;j<4;j++){
          const x=length*j/4;
          g.beginPath();g.moveTo(x,0);g.lineTo(x-11, -8-j*2);g.moveTo(x,0);g.lineTo(x-12,8+j*2);g.stroke();
        }g.restore();
      }
      for(let i=0;i<20;i++){
        const a=random()*Math.PI*2, d=16+random()*72, x=Math.cos(a)*d,y=Math.sin(a)*d*.72;
        const w=3+random()*9,h=5+random()*15;
        g.fillStyle=i%2?"#b6f6ffad":"#5bd3f1a6";
        g.beginPath();g.moveTo(x,y-h);g.lineTo(x+w,y+1);g.lineTo(x,y+h*.3);g.lineTo(x-w,y+1);g.closePath();g.fill();
        g.strokeStyle="#e5fcffb0";g.lineWidth=.8;g.stroke();
      }g.restore();
    } else if(type === "fire") {
      disk(r,grad("#08090abd","#25160f7a"),.82);
      disk(80,grad("#180c09ad","#54200f42"),.74);
      g.save();g.translate(mid,mid);g.scale(1,.8);
      for(let i=0;i<34;i++){
        const a=random()*Math.PI*2,d=20+random()*90;
        const x=Math.cos(a)*d,y=Math.sin(a)*d;
        g.fillStyle=i%4===0?"#bd593966":"#030608b3";
        g.beginPath();g.ellipse(x,y,2+random()*11,1+random()*7,a,0,Math.PI*2);g.fill();
      }
      for(let i=0;i<12;i++){
        const a=random()*Math.PI*2,d=24+random()*72,x=Math.cos(a)*d,y=Math.sin(a)*d;
        g.fillStyle=i%3===0?"#ffbc6899":"#dd643e91";
        g.beginPath();g.arc(x,y,1.2+random()*2.2,0,Math.PI*2);g.fill();
      }g.restore();
    } else if (type === "water") {
      // Wet ground is a persistent local puddle (not a short-lived projectile VFX).
      disk(r, grad("#20769bb8", "#0c385a70"), .74);
      disk(74, grad("#4599cb6b", "#194d6b24"), .69);
      g.save(); g.translate(mid,mid); g.scale(1,.73);
      for(let i=0;i<4;i++){
        const radius=28+i*17+variant*2;
        g.strokeStyle=i%2?"#b7edff76":"#6bc7f7a3";
        g.lineWidth=2.5-i*.25;
        g.beginPath();
        g.ellipse(0,0,radius,radius*.79,variant*.15,i*.45,Math.PI*1.78+i*.25);
        g.stroke();
      }
      for(let i=0;i<13;i++){
        const a=random()*Math.PI*2, distance=13+random()*72;
        g.fillStyle=i%3===0?"#e0fbffb8":"#4eabce8a";
        g.beginPath();g.ellipse(Math.cos(a)*distance,Math.sin(a)*distance,2+random()*6,1+random()*2,a,0,Math.PI*2);g.fill();
      }
      g.restore();
    } else {
      disk(r,grad("#111113a8","#45383250"),.82);
      g.save();g.translate(mid,mid);
      g.strokeStyle="#74665ca1";g.lineWidth=3;
      for(let i=0;i<9;i++){
        const a=i*Math.PI*2/9+variant*.13;
        g.beginPath();g.moveTo(random()*10-5,random()*10-5);
        let x=0,y=0;
        for(let j=0;j<4;j++){
          const length=15+j*15+random()*12;
          x=Math.cos(a)*length+(random()-.5)*13;
          y=Math.sin(a)*length*.72+(random()-.5)*13;
          g.lineTo(x,y);
        }g.stroke();
        g.strokeStyle="#090b0caa";g.lineWidth=1.5;g.stroke();
        g.strokeStyle="#74665ca1";g.lineWidth=3;
      }
      for(let i=0;i<17;i++){
        const a=random()*Math.PI*2,d=25+random()*70,x=Math.cos(a)*d,y=Math.sin(a)*d*.75,size=3+random()*8;
        g.fillStyle=i%3===0?"#a093798c":"#484440bb";
        g.beginPath();g.moveTo(x-size,y-size*.5);g.lineTo(x+size*.7,y-size);g.lineTo(x+size,y+size*.5);g.lineTo(x-size*.5,y+size);g.closePath();g.fill();
        g.strokeStyle="#1a1b1dbb";g.lineWidth=1;g.stroke();
      }g.restore();
    }
    cachedSprites.set(key,canvas);return canvas;
  }
  const effects = [];
  let running = false;
  function terrainAt(x, y) {
    for (let i = scars.length - 1; i >= 0; i--) {
      const mark = scars[i];
      if (mark.type === "ruin") continue;
      const dx = mark.x - x, dy = mark.y - y;
      if (dx*dx+dy*dy <= (mark.size*.78)**2) return mark.type;
    }
    return null;
  }
  function leaveScarEffect(kind, x, y) {
    if (effects.length >= 35) effects.shift();
    if (effects.some(effect=>effect.kind===kind &&
      (effect.x-x)**2+(effect.y-y)**2 < 48**2)) return;
    effects.push({kind,x,y,life:kind==="steam"?.88:.75,max:kind==="steam"?.88:.75});
  }
  function resolveScar(type, x, y) {
    if(type==="ruin") return {type, effect:null};
    const local = terrainAt(x,y);
    const base = window.worldBiomeAt?.(x,y) || window.getDominantWorld?.() || "frozen";
    // Local marks take precedence over the baseline biome.
    const ground = local || (base==="burning"?"fire":base==="flooded"?"water":"frost");
    if (type==="fire" && ground==="frost")
      return {type:"fire",effect:"steam"}; // Player fire claims the frozen ground.
    if (type==="fire" && ground==="water")
      return {type:"fire",effect:"steam"}; // Steam is the reaction; the new terrain is FIRE.
    if (type==="water" && ground==="fire")
      return {type:"water",effect:"steam"}; // Water extinguishes embers.
    if (type==="frost" && ground==="water")
      return {type:"frost",effect:"crystals"}; // Frozen puddles become ice.
    return {type,effect:null};
  }
  window.resetWorldScars=()=>{scars.length=0;effects.length=0;running=true;};
  window.clearWorldScars=()=>{scars.length=0;effects.length=0;running=false;};
  window.terrainAt=terrainAt;
  window.updateWorldScarEffects=dt=>{
    for(let i=effects.length-1;i>=0;i--){
      effects[i].life-=dt;
      if(effects[i].life<=0) effects.splice(i,1);
    }
  };
  window.addWorldScar=(type,x,y,radius)=>{
    if(!running||!types.includes(type)||!Number.isFinite(x)||!Number.isFinite(y))return;
    const reaction=resolveScar(type,x,y);
    if(reaction.effect)leaveScarEffect(reaction.effect,x,y);
    type=reaction.type;
    if(scars.some(s=>s.type===type&&(s.x-x)**2+(s.y-y)**2<48**2))return;
    if(type!=="ruin"){
      for(let i=scars.length-1;i>=0;i--){
        const previous=scars[i];
        if(previous.type!=="ruin"&&previous.type!==type&&
           (previous.x-x)**2+(previous.y-y)**2<76**2)scars.splice(i,1);
      }
    }
    const size=Math.max(48,Math.min(152,(radius||80)*.83));
    scars.push({type,x,y,size,variant:Math.floor(hash(x,y)*4)});
    if(scars.length>MAX_SCARS)scars.shift();
  };
  let lastSave="",world=null,lastCheck=0;
  function historicalWorld(){
    const now=Date.now();
    if(now-lastCheck<4000)return world;
    lastCheck=now;
    try{
      const data=storageGet(KEY,"null");
      if(data!==lastSave){lastSave=data;world=JSON.parse(data);}
    }catch{world=null}
    return world;
  }
  function drawMark(mark,alpha){
    const tile=sprite(mark.type,mark.variant);
    ctx.globalAlpha=alpha;
    ctx.drawImage(tile,mark.x-mark.size,mark.y-mark.size,mark.size*2,mark.size*2);
  }
  window.drawWorldScars=(left,top)=>{
    const right=left+W,bottom=top+H;
    const history=historicalWorld();
    const fullQuality=graphicsQuality==="high";
    ctx.save();
    // Legacy run-history marks are kept in storage, but must not overwrite the
    // visual identity of the new single-dominant-world system.
    if(history&&history.runs>0&&!window.getDominantWorld){
      const step=480;
      for(let i=0;i<types.length;i++){
        const type=types[i],power=Math.min(40,Math.max(0,Number(history[type])||0));
        if(power<1)continue;
        for(let gx=Math.floor(left/step)-1;gx<=Math.ceil(right/step)+1;gx++){
          for(let gy=Math.floor(top/step)-1;gy<=Math.ceil(bottom/step)+1;gy++){
            const n=hash(gx+i*31,gy-i*47);
            if(n>Math.min(.50,power*.021))continue;
            const x=(gx+.15+n*.72)*step,y=(gy+.1+hash(gy,gx)*.75)*step;
            const size=70+n*48;
            drawMark({type,x,y,size,variant:Math.floor(n*4)},fullQuality?.42:.28);
          }
        }
      }
    }
    const visible=scars.filter(s=>s.x+s.size>left&&s.x-s.size<right&&s.y+s.size>top&&s.y-s.size<bottom);
    const cover = window.getWorldConquest?.();
    // Local damage is temporary: it visually fades as the guardian restores the world.
    const scarAlpha = cover?.restored ? Math.min(1, cover.coverage / Math.max(1,cover.restorationPeak||1)) : 1;
    for(const s of visible)drawMark(s,(fullQuality?.85:graphicsQuality==="low"?.43:.60)*scarAlpha);
    ctx.globalAlpha=1;
    for(const effect of effects){
      if(effect.x<left-80||effect.x>right+80||effect.y<top-80||effect.y>bottom+80)continue;
      const t=Math.max(0,effect.life/effect.max);
      ctx.save();
      ctx.globalAlpha=t*.7;
      ctx.lineWidth=effect.kind==="steam"?4:2.5;
      ctx.strokeStyle=effect.kind==="steam"?"#c7eaf3":"#b2efff";
      ctx.shadowBlur=graphicsQuality==="high"?12:0;
      ctx.shadowColor=ctx.strokeStyle;
      const scale=1-t;
      for(let i=0;i<3;i++){
        const y=effect.y-(scale*34)+i*10;
        ctx.beginPath();
        ctx.arc(effect.x+(i-1)*19,y,12+i*4+scale*18,
          -.2+scale,2.3+scale);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  };
})();
