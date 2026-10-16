// Stage 2: visual-only world scars, capped to protect performance.
// All positions are in arena/world coordinates; no combat stats are changed.
(() => {
  const MAX_SCARS = 120;
  const liveScars = [];
  const palette = {
    frost: ["#83d9e6", "#bbf6ff"],
    fire: ["#8a503c", "#d27940"],
    ruin: ["#4c4646", "#75665c"],
  };
  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  window.resetWorldScars = () => { liveScars.length = 0; };
  window.addWorldScar = (type, x, y, radius) => {
    if (!palette[type] || !Number.isFinite(x) || !Number.isFinite(y)) return;
    if (graphicsQuality === "low") return;
    const size = Math.max(12, Math.min(90, radius * 0.32));
    // Skip nearly identical overlapping marks.
    if (liveScars.some(s => s.type === type && (s.x-x)**2 + (s.y-y)**2 < 24**2)) return;
    liveScars.push({type, x, y, size, seed:hash(x,y)});
    if (liveScars.length > MAX_SCARS) liveScars.shift();
  };
  const strokeScar = (s, alpha) => {
    const colors = palette[s.type];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x,s.y);
    ctx.rotate(s.seed*Math.PI*2);
    if (s.type === "frost") {
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 1.3;
      for (let arm=0; arm<5; arm++) {
        const angle = arm*Math.PI*2/5;
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(angle)*s.size,Math.sin(angle)*s.size);
        ctx.stroke();
      }
    } else if (s.type === "fire") {
      ctx.fillStyle = colors[0];
      ctx.beginPath();ctx.ellipse(0,0,s.size*1.2,s.size*.55,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=colors[1];ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(0,0,s.size*.75,.2,2.5);ctx.stroke();
    } else {
      ctx.strokeStyle=colors[1];ctx.lineWidth=2;
      for (let i=0;i<4;i++){
        const a=i*Math.PI/2+s.seed;
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a)*s.size*(.7+i*.12),Math.sin(a)*s.size*(.7+i*.12));
        ctx.stroke();
      }
    }
    ctx.restore();
  };
  window.drawWorldScars = (left, top) => {
    if (graphicsQuality === "low") return;
    const right=left+W, bottom=top+H;
    // Historical scars are deterministic and sparse; old runs change the terrain.
    let world;
    try { world=JSON.parse(storageGet("shadowLivingWorldV1","null")); } catch { world=null; }
    if (world && world.runs > 0) {
      const types = ["frost","fire","ruin"];
      for (let i=0;i<types.length;i++) {
        const type=types[i], strength=Math.min(18,Math.floor(Number(world[type])||0));
        if (!strength) continue;
        const step=540;
        const startX=Math.floor(left/step)-1, endX=Math.ceil(right/step)+1;
        const startY=Math.floor(top/step)-1, endY=Math.ceil(bottom/step)+1;
        for(let gx=startX;gx<=endX;gx++) for(let gy=startY;gy<=endY;gy++){
          const n=hash(gx+i*47,gy-i*21);
          if(n>Math.min(.42,strength*.028))continue;
          const s={type,x:(gx+n*.8)*step,y:(gy+hash(gy,gx)*.8)*step,size:20+n*40,seed:n};
          strokeScar(s,.17);
        }
      }
    }
    for(const scar of liveScars) {
      if(scar.x+scar.size<left||scar.x-scar.size>right||scar.y+scar.size<top||scar.y-scar.size>bottom)continue;
      strokeScar(scar,.43);
    }
  };
})();
