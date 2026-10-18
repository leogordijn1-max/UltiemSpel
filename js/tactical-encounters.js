// Tactical Encounters 2.0 — designed teams rather than random strong enemies.
// Every composition is constrained by the actual unlock schedule. Ordinary
// patrols and special waves share the same plan; the fourth wave stays a swarm.
(() => {
  "use strict";
  const member=(kind,tactic)=>Object.freeze({kind,tactic});
  const combo=(name,hint,members)=>Object.freeze({
    name,hint,members:Object.freeze(members.map(m=>member(...m)))
  });
  const PHASES=Object.freeze([
    Object.freeze({
      seconds:0,
      combos:Object.freeze([
        combo("BREAK THE LINE","BREAK THE GUARD",[[0,"vanguard"],[1,"pouncer"],[1,"skirmisher"]]),
        combo("SNARE & STRIKE","DODGE THE PULSE",[[0,"binder"],[1,"pouncer"],[0,"vanguard"]]),
        combo("DOUBLE FLANK","WATCH BOTH SIDES",[[1,"pouncer"],[0,"binder"],[1,"skirmisher"]])
      ])
    }),
    Object.freeze({
      seconds:180,
      combos:Object.freeze([
        combo("SUPPRESS & POUNCE","DISABLE THE RANGED SHADE",[[4,"crossfire"],[0,"vanguard"],[1,"pouncer"]]),
        combo("CROSSING FIRE","BREAK THE PINCER",[[1,"skirmisher"],[4,"crossfire"],[1,"pouncer"]]),
        combo("SHIELD THE SNIPER","REMOVE THE GUARD",[[0,"vanguard"],[4,"crossfire"],[0,"binder"]])
      ])
    }),
    Object.freeze({
      seconds:360,
      combos:Object.freeze([
        combo("HAMMER & ANVIL","ESCAPE THE STOMP",[[2,"crusher"],[0,"binder"],[1,"pouncer"],[4,"crossfire"]]),
        combo("THE EXECUTION LINE","DISARM THE SNARE",[[0,"vanguard"],[4,"crossfire"],[2,"crusher"],[1,"pouncer"]]),
        combo("NO SAFE ANGLE","SPLIT THE ENEMIES",[[1,"skirmisher"],[2,"crusher"],[0,"binder"],[4,"crossfire"]])
      ])
    }),
    Object.freeze({
      seconds:540,
      combos:Object.freeze([
        combo("VOLATILE TRAP","BAIT THE EXPLOSION",[[5,"volatile"],[0,"binder"],[1,"pouncer"],[4,"crossfire"]]),
        combo("BLAST CORRIDOR","DON'T GET CORNERED",[[1,"skirmisher"],[5,"volatile"],[2,"crusher"],[0,"vanguard"]]),
        combo("CHAIN REACTION","SPLIT THE GROUP",[[0,"binder"],[5,"volatile"],[4,"crossfire"],[1,"pouncer"]])
      ])
    }),
    Object.freeze({
      seconds:720,
      combos:Object.freeze([
        combo("LAST DEFENSIVE LINE","BREAK THE WARD FIRST",[[6,"ward"],[2,"crusher"],[4,"crossfire"],[1,"pouncer"],[0,"binder"]]),
        combo("SIEGE BREAKERS","ISOLATE THE CRUSHER",[[2,"crusher"],[6,"ward"],[1,"skirmisher"],[5,"volatile"],[4,"crossfire"]]),
        combo("ALL-OUT AMBUSH","KEEP MOVING",[[1,"pouncer"],[4,"crossfire"],[6,"ward"],[5,"volatile"],[0,"binder"]])
      ])
    })
  ]);
  function phase(seconds){
    let selected=PHASES[0];
    for(const stage of PHASES){
      if(seconds>=stage.seconds)selected=stage;
    }
    return selected;
  }
  function pick(seconds=0,sequence=0){
    const stage=phase(Math.max(0,Number(seconds)||0));
    const index=((Math.floor(sequence)%stage.combos.length)+stage.combos.length)%stage.combos.length;
    const result=stage.combos[index];
    // Preview overrides in Developer Mode can unlock types early. Ordinary
    // scheduling, however, never skips the progression gate.
    const roster=window.enemyKindAvailable;
    if(typeof roster==="function"&&!result.members.every(m=>roster(m.kind,seconds)))
      return PHASES[0].combos[index%PHASES[0].combos.length];
    return {
      name:result.name,hint:result.hint,
      members:result.members.map(m=>({...m})),
      kinds:result.members.map(m=>m.kind),
      tactical:true
    };
  }
  window.chooseTacticalEncounter=pick;
  window.getTacticalEncounterPhases=()=>PHASES.map(p=>({
    seconds:p.seconds,combos:p.combos.map(x=>x.name)
  }));
})();
