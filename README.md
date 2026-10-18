# Shadow Survivor

> **Project voortzetten met een nieuwe AI-chat?** Lees eerst [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md) voor visie, sfeer, gemaakte beslissingen en de werkwijze, en [MILESTONE-30.md](MILESTONE-30.md) voor de actuele updateplanning. Deze README bevat op onderdelen nog informatie over oudere versies; de actieve code op de ontwikkelbranch is leidend.


## Actuele stand — Mijlpaal Update 30 (18 oktober 2026)

**Combat & Gameplay 2.0: 20/20 geplande stappen voltooid.** De technische modules en regressietests zijn geïntegreerd, maar de game is **nog niet als volledig speelbaar en uitgebalanceerd vrijgegeven**: een echte doorlopende Normal-browserrun van 25–30 minuten, daadwerkelijk haalbare dubbele evoluties, FPS en overlappende bossaanvallen vereisen nog handmatige speeltests.

- [ROADMAP-31-50.md](ROADMAP-31-50.md): **officiële planning voor Verified Playable Run (31–40), vloeiende stylized 2.5D art direction (41–45), animatie/VFX (46–50)** en het mogelijke toekomstige 3D-vervolg.
- [RUN-TEST-31.md](RUN-TEST-31.md): **vanaf Update 31 werkende, lokale run-telemetrie**; Settings → QA recording, Standard Normal spelen, pauzeren of uitspelen, **DOWNLOAD QA REPORT · JSON** en zelf delen. Het eerste live bewijs staat nog OPEN.
- [MILESTONE-30-REVIEW.md](MILESTONE-30-REVIEW.md): evidence, GO/NO-GO, bekende risico's, plan voor Updates 31–40.
- [NORMAL-RUN-QA.md](NORMAL-RUN-QA.md): afvinkbare checkpoints voor echte 25–30-minutenspeeltests.
- [MILESTONE-30.md](MILESTONE-30.md): volledige geschiedenis en tracker Updates 11–30.
- [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md): spelvisie, grenzen, projectoverdracht en koers.

**Toekomstig grafisch doel (gepland, nog niet gebouwd):** een hoogwaardige, supervloeiende **stylized 2.5D top-down look die bijna 3D voelt** door contactschaduw, volume, dynamische verlichting, gelaagde VFX en soepele animatie. **Geen pixelart** als stijlkeuze; voor een mogelijk deel 2 pas echt 3D. Echte visual-designproductie staat in de roadmap gepland voor **Updates 41–50**, ná geverifieerde gameplay in 31–40.

### Wat kun je nu spelen?

- **Mode:** Standard in Easy, Normal of Nightmare. Na een echte overwinning op The Last Meme wordt Endless ontgrendeld.
- **Drie elementbuilds, ieder met precies drie speelbare wapens:**
  - **Fire:** Flame Cone, Fireball, Flame Orbit.
  - **Water:** Water Bolt, Tidal Wave, Whirlpool.
  - **Frost:** Frost Orb, Ice Shards, Glacial Pulse.
- Je begint met één gekozen wapen; de twee andere wapens van datzelfde element worden beschikbaar via level-ups. Legacy-wapens (zoals Arcane Bolt en Boomerang) staan nog in oudere broncode en in de historische updates hieronder, maar zijn **geen** huidige selecteerbare buildopties.
- **Maximaal twee evoluties in een Standard-run:** vanaf **10:00** en **17:00** gameklok, mits wapenlevel **5**, de juiste support-upgrade **3** en minstens één verslagen boss. Ze worden niet gratis toegekend. Het verkrijgen van voldoende levels is nog niet bewezen met een echte volledig gespeelde run.
- **Bossroute:** Beau de Hond → The Mourning Shade → The Bell Tower → The Last Meme (de finale na minimaal drie echte Guardian-overwinningen én minuut **25:00**).
- **Bossgevechten:** geïsoleerde arena's. Alleen door de boss zelf gesummonde minions mogen verschijnen. Vier bijzondere fase-3 Guardian Powers plus hun eigen, eerder bestaande aanvallen; waarschuwingen, dodge en schadezones blijven actief.
- **Living World:** bij de eerste drie bosses groeit de tijdelijke invasie naar 15%, 50%, 85%; alleen een echte Standard-finalevictory schrijft de nieuwe dominante wereld permanent weg. Na Victory verdergaan in Endless bewaart je build en huidige run.

### Speeltest / QA-opname sinds Update 31

De game registreert tijdens normale browserruns optioneel **lokale meetgegevens**: level- en XP-voortgang, echte upgrade-aanbiedingen en gekozen keuzes, bossfases en -kills, evoluties, schade, 30-seconden-checkpoints en iedere 5 seconden uit browserframes berekende FPS/P95. Via **Settings** staat `Record local run QA data` aan/uit (standaard aan, **geen automatische upload**). Tijdens pauze, Victory of Game Over kun je een **JSON-rapport downloaden** of een samenvatting kopiëren; bij verlaten ook op het hoofdmenu. Volg [RUN-TEST-31.md](RUN-TEST-31.md). **Technisch ingebouwd en automatisch getest; nog geen door een speler bewezen volledige Normal-run.**

### Besturing

Bewegen met **WASD / pijltjes**, dash met **Shift** (op touchscreens een DASH-knop), pauzeren met **P**, gametempo **1×/2×/3×** en fullscreen met **F**. In **Settings** kies je Low/Medium/High graphics, FPS-overlay en eventueel Developer Mode voor gecontroleerde tests.

### Techniek

Statische HTML5, Canvas, CSS en JavaScript zonder verplichte server. `index.html` laadt de modules in hun benodigde volgorde. Kernbestanden: `js/game.js` (status en vaste 1/60s-simulatie), `js/enemies.js` (damage, AI en bosses), `js/elemental-combat.js` en `js/weapons.js` (actieve elementwapens), `js/upgrades.js` (keuzes/evoluties), `js/boss-flow.js` + `js/boss-isolation.js` (bossroute/arena), `js/guardian-arena-powers.js` (grote aanvallen), `js/world-state.js` (invasie/opslag), `js/render.js` en `js/combat-hud.js` (Canvas/HUD), `js/developer-mode.js` (lokale veilige tests).

Automatische tests op Node.js 22:

```bash
node --test tests/*.test.js tests/*.test.cjs
node scripts/milestone-30-audit.cjs
node tests/performance-benchmark.js
```

De audit print **technische PASS-checks** én **OPEN handmatige browserchecks**. Een groene Node/CI-run is nadrukkelijk **niet** hetzelfde als een geverifieerde, volledig gespeelde en uitgebalanceerde release.

## Historisch update-archief (Updates 4–8)

De onderstaande historische secties beschrijven de game in eerdere fasen en zijn **niet leidend** voor de huidige selecteerbare wapens, twee-evolutiegrens, bossroute, XP-economie of releasedatum. Raadpleeg voor de huidige versie bovenstaande uitleg en de daadwerkelijke code.

## Update 4: Weapon evolutions

Death Pulse now levels from 1 to 5 and can evolve into **Eclipse** (Death Pulse 5 + Expanding Aura 3 + boss defeated + evolution milestone). Eclipse sends a second shockwave with a brief slow. Mega Eiad gains a weaker secondary blast. Chain Lightning has a 600-pixel opening target range; Flame Cone auto-aims at nearby enemies; Frost Orb's tracking is faster. Tempest still fires two independent lightning chains.

## Update 5: Waves, enemies and boss telegraphs

Every wave has a recognizable theme: Drifter Swarm, Runner Rush, Heavy Horde, Ranged Raid, Elite Ambush or Chaos Mix. Waves pause during bossfights, and the HUD explicitly indicates that pause. Standard spawning remains mixed. **Burstlings** flash a visible explosion circle before detonating, while **Bulwarks** alternate between shielded and vulnerable states. Elite enemies can charge after a warning, briefly sprint or gain extra armor. Melee enemies use a modest intermittent separation check to reduce stacking.

Ranged Shades must be on screen and within attack range before beginning an aimed 0.7-second warning; their projectile locks its direction at warning start and curves only moderately. Boss attacks now begin with visible warnings. Beau de Hond still fires MarioVis shotgun volleys, the Mourning Shade makes gapped radial rings and the Bell Tower fires aimed bell-bolt lanes. Each boss changes behavior below half HP and may summon different minions.

Run all gameplay tests using `node --test tests/*.test.js`. These changes target desktop and should be tuned after full 20–30 minute playtests.


## Update 6: Victory, Final Boss & Endless Mode

**Standard Mode** starts with one selected weapon and two reserve weapons. Around **25 minutes of simulated play time**, the final boss **The Last Meme** appears. Its three phases trigger at approximately 66% and 33% remaining HP. It uses a telegraphed rift volley with a safe middle gap, a shadow ring with a safe opening and a ground circle locked to the player's position at the start of the warning. The final boss currently has original Canvas placeholder art; do not replace existing custom meme images.

A final boss victory immediately grants **12 permanent points**, awards the **Nightbreaker** achievement and **permanently unlocks Endless Mode** on this device. The Victory screen offers **Claim Victory / Main Menu** or **Continue in Endless Mode**. Continuing preserves the player's weapons, XP, level, health, upgrades, evolutions and ongoing run record. Earned performance points are only added for the *difference* since the Victory checkpoint, not paid twice.

Once unlocked, the main menu shows **Endless Mode · New Run**. New Endless runs start with the normal three-weapon loadout and scaling remains standard until minute 25; after that, every two minutes adds a bounded difficulty tier (higher enemy HP, damage and modest additional speed/spawn pressure). Existing bosses continue to recur in Endless Mode.

Victory state, unlocks and records are in version-3 `localStorage`. Older version-2 saves are migrated without removing existing points, achievements or completed runs. Records are tracked separately for **Standard vs. Endless** and **Easy / Normal / Nightmare**. The game's automatic Node checks cover old saves, one-time rewards, final boss combat and Endless continuation.

Run all gameplay checks with:

```bash
node --test tests/*.test.js
```

**Note:** A full 25-minute playtest is still recommended to verify the final boss challenge, visual telegraphs and late-game performance before merging this update.


## Update 7: playable characters and long-term progression

Select a survivor before the existing three-weapon loadout. All **eight original weapons** remain available, with no additional slot introduced by abilities. Four characters have different gameplay effects:

- **The Survivor** (free): Soul Rush grants 25% extra movement for three seconds after 20 kills, with a cooldown.
- **Zombie Mike** (Boss Hunter achievement / 3 lifetime boss kills): Undead Rage gives +17% damage below 45% HP. Starts with +20 HP and moves 3% slower.
- **Beau de Hond** (first-kill trophy from Beau boss): Fish Barrage automatically launches three MarioVis projectiles every 12 seconds near enemies. Starts 5% faster; Fish Barrage is an ability, not an extra weapon.
- **The Mayo Master** (24 permanent points): Mayo Madness grants 15% more damage for four seconds after 25 kills, with a cooldown. Starts with 15 less HP.

The **Permanent Shop** now has four sections:
1. **Stats**: the original HP and damage upgrades plus capped small movement, XP, pickup radius and dash cooldown improvements.
2. **Weapons**: optional masteries for all eight existing weapons. A purchased mastery starts that weapon at level 2 **only when chosen as the start weapon**. Weapons still level normally to 5 and require the same evolution support/passive/boss rules.
3. **Characters**: buy The Mayo Master with points. Earn Zombie Mike through Boss Hunter and Beau through the Beau boss trophy.
4. **Cosmetics**: Classic, Neon Mayhem, Golden Survivor and Void Walker (the latter requires the Nightbreaker victory achievement). Cosmetics only affect visual appearance, never gameplay power.

The **first kill** of each ordinary boss awards a permanent named trophy and two bonus points, **only once per boss**, while the final boss awards its collectible trophy without an extra point bonus. Character unlocks, cosmetics, shop receipts and weapon masteries are saved locally in the existing version-3 save format; existing progress and assets remain intact. The stats refund button reimburses the **amount originally paid**, including the older flat costs, without deleting cosmetics, masteries or characters.

**New achievements:** Good Dog (defeat Beau) and Master of Arms (purchase four masteries). Player records now also remember the selected character. The UI and gameplay are desktop-first.

Run tests using `node --test tests/*.test.js`; use a browser to verify character artwork, power cooldowns, selection and responsive layout before merging.


## Update 8 — Final UI Polish, Collection, Run Analytics and Audio

### Screen improvements
- Desktop-first **pause menu**: resume, current build, controls reference, settings, restart (with confirmation), or main menu (with confirmation). Back from settings returns to pause instead of abandoning the run. Esc/P pause and resume when gameplay is active.
- Fullscreen toggles with **F**. Navigating between menu screens does not exit fullscreen; changing fullscreen requires a dedicated action.
- Keyboard shortcuts are ignored while editing a field or while level-up / reward screens are active. Movement keys reset when the browser loses focus.
- The existing HUD, level-up choices and three-weapon loadout remain intact, with added keyboard help, clearer layouts, scrollable large panels and accessible focus outlines.

### Encyclopedia vs Collection
- The encyclopedia always provides the information needed to choose weapons and plan evolutions.
- The **Collection** is a separate main-menu destination that hides undiscovered weapons, evolutions, enemies, bosses and characters behind a question mark with a discovery hint. New entries appear as they are encountered, equipped, evolved or played. Passive descriptions remain public.
- Six information categories: Weapons, Evolutions, Upgrades, Enemies, Bosses, Characters.
- Discoveries are saved in the existing localStorage progression file; older saves migrate safely and keep prior purchases/achievements.

### Run statistics
- Accurate central outgoing-damage tracking by weapon (Arcane Bolt, Spirit Blades, Eiad Bom, Chain Lightning, Boomerang, Flame Cone, Frost Orb, Death Pulse and Beau's Fish Barrage).
- Damage attribution counts effective damage only, not overkill. Burn damage counts toward Flame Cone, and lightning jumps toward Chain Lightning.
- Run records now also include incoming damage, healing, dodges, projectile blocks, critical hits, XP and collected souls plus evolution count and selected weapons.
- Victory and Game Over show a readable run breakdown; Records offers expandable details for the five most recent top runs.
- Old runs without analytics display an honest 'not recorded' note instead of zero values.

### Audio and effects
- Added synthesized SFX for victory, evolution, lightning, flame, frost, fish shots, boomerangs, dash and boss warnings; important cues no longer depend on a global cooldown used for ordinary hits.
- Throttle repeated hits/XP/kills and limit simultaneous sounds to avoid deafening audio. Audio volume and mute settings remain in the existing Settings screen.
- Existing custom meme images and boss/projectile identities are preserved.

### Validation
- **Run automated tests:** `node --test tests/*.test.js`
- **Manual browser test:** check main menu, Collection updates after first encounters, settings while paused, fullscreen through multiple screens, weapon damage accounting, extended run/Game Over/Victory stats and the final-boss / Endless transition.
- **Desktop-first:** the user prioritizes laptop and desktop play. This update does not intentionally remove existing touch support.
