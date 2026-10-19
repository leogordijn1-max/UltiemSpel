# Projectkompas — Shadow Survivor

**Direction:** a challenging top-down desktop survivor roguelike where the *Living World* visibly responds to the player killing its Guardians. Winning on Normal should feel nearly impossible for a novice, but never secretly impossible: no guaranteed hit, forced first-run loss or unfair collider.

## Invariants

- Three elemental loadouts: **Fire** (Flame Cone, Fireball, Flame Orbit); **Water** (Water Bolt, Tidal Wave, Whirlpool); **Frost** (Frost Orb, Ice Shards, Glacial Pulse). Other classic weapons remain in the code.
- Four boss encounters: **Beau** (charging hunt), **Mourning Shade** (shadow barrage), **Bell Tower** (cross/chime), **The Last Meme** (reality breaks, orbit, endgame). Each warning must match its actual dangerous hitbox.
- Normal asks for constant positional judgment, a few powerful enemies and purposeful health pickups. **Do not nerf healing** to compensate for passive waves.
- Enemy powers are a deterministic contract of **family + its evolution level**; visible elites may modify stats, **not randomly grant an unrelated special power**. Squad positioning/cooperation is contextual, not a different hidden ability.
- Weapon evolutions require earned LV5 weapon, LV3 support, at least one defeated Guardian. **No clock milestone; no 2-evolution cap.** The available three-element loadout remains the practical upper bound for a Standard run.
- Standard wins save world outcome and unlock Endless. Developer/sandbox runs must not award permanent rewards.

## Evolution canon — separate family level and world era

Family rank = `clamp(1 + defeatedOrdinaryGuardians − familyDebutGuardianIndex,1,4)`. **All** normal enemies use the same global world era for thematic colour/spikes, but rank markers (1–4 pips), stats and abilities follow their actual family level. This avoids a newly introduced LV1 unit looking out of place or behaving like LV3.

| Defeated bosses | Drifter + Runner | Ranged Shade + Zombie Mike | Burstling + Bulwark | Global look |
|---:|---|---|---|---|
| 0 | LV1 | Not present | Not present | Era 1 |
| 1 (Beau) | LV2 | LV1 | Not present | Era 2 |
| 2 (Shade) | LV3 | LV2 | LV1 | Era 3 |
| 3 (Bell) | LV4 | LV3 | LV2 | Era 4 |

Introduction also respects original timing: ranged 3m, Mike 6m, Burstling 9m, Bulwark 12m; a late defeated Guardian delays the new family's introduction. Old forms stop spawning after boss transition. Six families × four actual levels = 24 family forms for the later major visual redesign.

## Family power identity (every member at same level)

| Family | First form | LV2 | LV3 | LV4 |
|---|---|---|---|---|
| **Drifter** | Pursuit | Intercepts distant player faster | Nearby Drifters rally each other's pursuit | Relentless closing speed |
| **Runner** | Fast sprint | Lateral feint | Phase-hunt / faster pursuit | Stronger repeated feint |
| **Zombie Mike** | Slow, tough | Warned seismic stomp | Anchor against displacement | Larger, faster, stronger quake |
| **Ranged Shade** | Single guided orb | Two projectiles | Three projectiles | Rapid triple volleys |
| **Burstling** | Moving warned detonation | Follow-up chasing shard | Three chasing shards | Five faster shards |
| **Bulwark** | Frontal timed shield | Longer guard/escort | Squad protection Warden | Extended guard and shorter exposure |

Actual enemy abilities must be stronger **in combat**, not merely have higher HP or a name. Each level keeps its family silhouette and adds its own mutation. The team's composition changes how they position themselves; two LV2 Mikes cannot randomly have different core spells.

## High-pressure boss response

- Beau: four chained, individually warned chase charges; distinct normal shotgun/crossfire.
- Shade: three tighter radial salvoes; marked narrow escape channel; phantom hazard circles overlap so camping between them is no longer the easy answer.
- Bell: distinct cross and lengthwise chime corridors.
- Meme: closer 12-sector orbit, larger projectiles, unsafe center and a learnable but narrow exit.
- Damage requires collision; drawn warning coordinates must equal true damage positions. Bosses must feel overwhelming, **not randomly invisible or mechanically unwinnable**.

## UX and performance

- Every upgrade/evolution card occupies one fixed footprint; show name, level and its **most important effect**, not 7 paragraphs.
- In-play HUD prioritizes **HP, XP, current level, time, next wave/boss and current world era**. Detailed upgrades live in the paused **Current Build** view.
- No floating multi-line combat instructions during a fight; animated boss attack telegraphs remain.
- Desktop/high quality, with bounded ordinary population and visible collision clarity; profile at 1× and 3×.

## Implementation notes

Production logic is in `js/enemy-evolution.js`, `js/enemy-counter-roles.js`, `js/enemy-archetypes.js`, `js/encounter-tactics.js`, `js/enemies.js`, `js/upgrades.js`, `js/game.js`, and boss-specific `js/*-encounter.js`. Keep shared logic centralized instead of adding per-update duplicate variants. Avoid expanding the script list before the next visual redesign.
