// Update 26 — arena-sized Guardian Powers. All gameplay collision areas match
// their ground telegraphs. Triggered by existing Phase-III cinematic ultimates.
// No projectiles, enemies, background timers, persistence or free rewards.
(() => {
  "use strict";
  const TAU = Math.PI * 2;
  const NAMES = Object.freeze([
    "HOUND'S KILL ZONES", "ECLIPSE OF THE LOST",
    "THE FINAL TOLL", "REALITY FRACTURE"
  ]);
  const COLORS = Object.freeze(["#ffab72","#bf99ff","#ffe19b","#ff80db"]);
  const INITIAL_TELL = 1.45, REPEAT_TELL = 1.08;
  const LOCK_AFTER = .38, ACTIVE_TIME = .24, REST_TIME = .27;
  const BEATS = 3;
  let state = null;

  const variantOf = e => e?.isFinalBoss ? 3 : e?.variant;
  const finite = n => typeof n === "number" && Number.isFinite(n);
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const targetOf = (e,p) => {
    const aimed = window.bossCombatPredictTarget?.(e,p) || p;
    const x = finite(aimed?.x) ? aimed.x : p.x;
    const y = finite(aimed?.y) ? aimed.y : p.y;
    const angle = Math.atan2(y-e.y,x-e.x);
    return {x,y,angle};
  };
  function begin(e,now,player) {
    const variant = variantOf(e);
    if (!e || e.kind !== 3 || ![0,1,2,3].includes(variant) ||
        !player || !finite(now) || state) return false;
    const t = targetOf(e,player);
    state = {
      owner:e,variant,centerX:t.x,centerY:t.y,angle:t.angle,
      beat:0,stage:"warning",started:now,lockAt:now+LOCK_AFTER,
      until:now+INITIAL_TELL,warningStart:now,warningLength:INITIAL_TELL,
      strikes:0
    };
    return true;
  }
  function cancel(e) {
    if (!state || (e && e !== state.owner)) return false;
    state=null;return true;
  }
  function pointThreat(s,x,y,playerRadius=0) {
    if(!s || !finite(x) || !finite(y)) return false;
    const dx=x-s.centerX,dy=y-s.centerY;
    const cos=Math.cos(s.angle),sin=Math.sin(s.angle);
    const u=dx*cos+dy*sin,v=-dx*sin+dy*cos;
    const radius=clamp(playerRadius||0,0,28);
    if(s.variant===0) {
      // Three deadly charge roads; the corridors between them stay open.
      return Math.abs(u)<=455+radius &&
        [-230,0,230].some(offset=>Math.abs(v-offset)<=59+radius);
    }
    if(s.variant===1) {
      // Eclipse: a dangerous heart with three giant dark wedges and
      // equally generous bright wedges. Moving outward into the light works.
      const distance=Math.hypot(dx,dy);
      if(distance<=83+radius)return true;
      if(distance>420+radius)return false;
      const a=Math.atan2(dy,dx)-s.angle-s.beat*.36;
      const folded=Math.atan2(Math.sin(a*3),Math.cos(a*3));
      return Math.abs(folded)<.92+radius/Math.max(125,distance)*1.4;
    }
    if(s.variant===2) {
      // A colossal cross-chime. Diagonal quadrants are safe, not tiny gaps.
      return Math.abs(u)<=460+radius && Math.abs(v)<=65+radius ||
        Math.abs(v)<=460+radius && Math.abs(u)<=65+radius;
    }
    // Final Meme: checkerboard that actually flips each beat; off-board is safe.
    // Pixel footprint is the same 160px squares shown in draw(). A mild
    // radius margin protects against visual near-miss inconsistencies.
    if(Math.abs(u)>400+radius||Math.abs(v)>400+radius)return false;
    const step=160,half=step/2;
    const xx=Math.floor((u+half)/step),yy=Math.floor((v+half)/step);
    const parity=(xx+yy+s.beat)%2===0;
    if(parity)return true;
    // Only expand into adjacent dark cells near a border.
    const ux=((u+half)%step+step)%step;
    const vy=((v+half)%step+step)%step;
    return (Math.min(ux,step-ux)<=radius ||
      Math.min(vy,step-vy)<=radius) && (
        (Math.min(ux,step-ux)<=radius && (xx+(ux<half?-1:1)+yy+s.beat)%2===0) ||
        (Math.min(vy,step-vy)<=radius && (xx+yy+(vy<half?-1:1)+s.beat)%2===0)
      );
  }
  function update(e,now,player,hooks={}) {
    if (!state || e!==state.owner || !player || !finite(now))return false;
    const s=state;
    if(s.stage==="warning") {
      if(now<s.lockAt) {
        const target=targetOf(e,player);
        s.centerX=target.x;s.centerY=target.y;s.angle=target.angle;
      }
      if(now<s.until)return true;
      // Exactly one impact at the END of the corresponding visible warning.
      s.stage="impact";s.until=now+ACTIVE_TIME;s.strikes++;
      const amount=(s.variant===3?19:16)+s.beat*2;
      if(pointThreat(s,player.x,player.y,player.r||0))
        hooks.hit?.(amount,s.variant);
      hooks.puff?.(s.centerX,s.centerY,COLORS[s.variant],16);
      hooks.shake?.(s.variant===3?12:8);
    } else if(s.stage==="impact" && now>=s.until) {
      s.stage="rest";s.until=now+REST_TIME;
    } else if(s.stage==="rest" && now>=s.until) {
      if(s.beat+1>=BEATS){cancel(e);return false;}
      s.beat++;
      const target=targetOf(e,player);
      s.centerX=target.x;s.centerY=target.y;s.angle=target.angle;
      s.stage="warning";s.started=now;s.warningStart=now;
      s.warningLength=REPEAT_TELL;s.until=now+REPEAT_TELL;
      s.lockAt=now+Math.min(LOCK_AFTER,REPEAT_TELL*.35);
    }
    return true;
  }
  function status() {
    if(!state)return {active:false};
    return {
      active:true,variant:state.variant,name:NAMES[state.variant],
      stage:state.stage,beat:state.beat,strikes:state.strikes,
      centerX:state.centerX,centerY:state.centerY,
      angle:state.angle,lockAt:state.lockAt,warningLength:state.warningLength,
      warningUntil:state.stage==="warning"?state.until:0
    };
  }
  function shape(ctx,s,quality,drawDanger,dangerStyle) {
    const low=quality==="low";
    ctx.save();ctx.translate(s.centerX,s.centerY);ctx.rotate(s.angle);
    const fill=()=>{if(drawDanger)ctx.fill();ctx.stroke();};
    const rect=(x,y,w,h)=>{
      ctx.beginPath();ctx.rect(x,y,w,h);fill();
    };
    if(s.variant===0) {
      for(const offset of [-230,0,230])
        rect(-455,offset-59,910,118);
    } else if(s.variant===1) {
      // Circular core, then three equal 105-degree dark sectors. The
      // remaining arcs are visible safe corridors on the arena floor.
      ctx.beginPath();ctx.arc(0,0,83,0,TAU);fill();
      for(let i=0;i<3;i++) {
        const center=i*TAU/3+s.beat*.36;
        const half=.92/3;
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.arc(0,0,420,center-half,center+half);ctx.closePath();fill();
      }
    } else if(s.variant===2) {
      rect(-460,-65,920,130);
      rect(-65,-460,130,920);
    } else {
      const step=160;
      for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){
        if((x+y+s.beat)%2===0)rect(x*step-80,y*step-80,step,step);
        else if(!low){
          ctx.globalAlpha=.38;ctx.strokeStyle="#a9ffdd";
          ctx.beginPath();ctx.rect(x*step-78,y*step-78,step-4,step-4);
          ctx.stroke();
          ctx.strokeStyle=dangerStyle;ctx.globalAlpha=1;
        }
      }
    }
    ctx.restore();
  }
  function drawBackdrop(e,ctx,now,player,quality,w,h) {
    if(!state||state.owner!==e||!player)return;
    const s=state;
    ctx.save();
    ctx.fillStyle=["rgba(66,20,6,.25)","rgba(18,6,46,.39)",
      "rgba(49,38,4,.32)","rgba(37,5,42,.42)"][s.variant];
    ctx.fillRect(player.x-w/2,player.y-h/2,w,h);
    ctx.restore();
  }
  function drawWarning(e,ctx,now,quality) {
    if(!state||state.owner!==e)return;
    const s=state,warning=s.stage==="warning";
    const remaining=warning?clamp((s.until-now)/s.warningLength,0,1):0;
    ctx.save();
    ctx.globalAlpha=warning?.55+(1-remaining)*.37:s.stage==="impact"?.90:.22;
    ctx.strokeStyle=COLORS[s.variant];ctx.fillStyle=COLORS[s.variant];
    ctx.lineWidth=quality==="low"?3.5:4.5;
    ctx.setLineDash(warning?[13,9]:[]);
    shape(ctx,s,quality,false,COLORS[s.variant]);
    ctx.setLineDash([]);
    // A solid inner strike reticle communicates the lock and tells the
    // player where the giant attack is focused, even on Low quality.
    ctx.globalAlpha=warning?.70+(1-remaining)*.22:.7;
    ctx.strokeStyle="#fff5d7";ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(s.centerX,s.centerY,25+remaining*60,0,TAU);ctx.stroke();
    if(quality!=="low") {
      ctx.globalAlpha=warning?.14+(1-remaining)*.14:s.stage==="impact"?.31:.07;
      ctx.fillStyle=COLORS[s.variant];ctx.strokeStyle=COLORS[s.variant];
      shape(ctx,s,quality,true,COLORS[s.variant]);
    }
    ctx.restore();
  }
  window.beginGuardianArenaPower=begin;
  window.updateGuardianArenaPower=update;
  window.interruptGuardianArenaPower=cancel;
  window.resetGuardianArenaPower=()=>cancel();
  window.guardianArenaPowerThreat=pointThreat;
  window.guardianArenaPowerStatus=status;
  window.drawGuardianArenaPowerBackdrop=drawBackdrop;
  window.drawGuardianArenaPowerWarning=drawWarning;
  window.guardianArenaPowerCatalog=NAMES;
})();
