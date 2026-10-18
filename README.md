# Shadow Survivor

> **Project voortzetten met een nieuwe AI-chat?** Lees eerst [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md) voor visie, sfeer, gemaakte beslissingen en de werkwijze, en [MILESTONE-30.md](MILESTONE-30.md) voor de actuele updateplanning. Deze README bevat op onderdelen nog informatie over oudere versies; de actieve code op de ontwikkelbranch is leidend.


## Bestandsindeling

- `index.html` bevat de interface en laadt scripts in afhankelijkheidsvolgorde.
- `styles.css` bevat de interface, overlays en touch-layout.
- `js/game.js` beheert spelstatus, voortgang, simulatie en hoofdloop.
- `js/controls.js` verbindt toetsenbord, menu's, joystick en dashknop.
- `js/storage.js` normaliseert en versieert lokale voortgang met veilige opslagtoegang.
- `js/progression.js` verwerkt runregistratie en achievements op het moment van de gebeurtenis.
- `js/enemies.js` bevat vijanden, bosses, projectiles en damage.
- `js/weapons.js` bevat Chain Lightning, Boomerang, Flame Cone en Frost Orb.
- `js/upgrades.js` beheert upgrades, XP en evolutierecepten.
- `js/render.js` tekent arena, personages, wapens en effecten.
- `js/audio.js` maakt lichte effecten en ambient geluid met Web Audio.
- `img/` bevat de originele game-afbeeldingen.
- `tests/game-logic.test.js` bevat de automatische gameplay-tests.
- `tests/performance-benchmark.js` vergelijkt targetselectie bij 100, 200 en 300 vijanden.

## Besturing

- Bewegen: WASD of pijltjestoetsen.
- Dash: Shift op desktop, DASH op touchscreens.
- Pauze: P.
- Snelheid: 1, 2 of 3.
- Fullscreen aan/uit: F.

Kies Easy, Normal of Nightmare in het startmenu. Stel daarna één Start Weapon en twee Unlockable Weapons in. Alleen het startwapen is bij de start actief; de twee andere gekozen wapens verschijnen gegarandeerd als level-up unlock. Een evolution vraagt wapenlevel 5, de bijbehorende support-upgrade op level 3 en minstens één verslagen boss. Evolutions zijn de definitieve vorm van hun wapen. Bosses geven beloningen uit je huidige build. Punten uit runs geven permanente gezondheids- of damage-upgrades in het startmenu.

Balansnotities: Emmer Mayo geeft 18% damage per level; permanente damagebonussen blijven apart van de vijf zichtbare upgradelevels. XP-drempels groeien met `floor(vorige drempel × factor + 4)`: factor 1.15 tot level 6, 1.105 tot level 15 en 1.085 daarna. Dat vraagt ongeveer 74 totale XP voor level 5, 334 voor level 10, 872 voor level 15, 1,809 voor level 20 en 3,325 voor level 25. Drifters geven 1 XP, runners 0.8, ranged enemies 2, tanks 5 en elites 2.5× hun typewaarde; bosses geven 14 + 18 per bossnummer. Tijdens bossgevechten leveren nieuw gespawnde vijanden geen XP op, eerder gespawnde vijanden wel. Een grove Normal-run simulatie met gemiddeld 1.2 XP per vijand, 35 seconden voor elk van zeven bossgevechten en 45–105 kills per actieve minuut komt na 25 minuten uit rond level 19–24; dit is een modelinschatting, afhankelijk van XP-ophaaltempo, enemy mix en overleving.

Level-upopties wegen wapens, supports en passives mee; gekozen locked wapens blijven gegarandeerd als unlock-optie staan. Wapenkeuzes krijgen iets meer gewicht, maar bestaande passives worden afgewogen om herhaling te beperken. Synergieën versterken onder meer Frost/Flame, Critical Eye/Force, Heavy Impact met area damage en Spirit Blades met Ward Blades. Vitality geeft +30 max HP en 0.8 HP/s per level; Rapid Casting verlaagt cooldowns multiplicatief met 10% per level. Evolutions vereisen level 5, de support op level 3 en een bosskill; de eerste, tweede en derde evolution kunnen vanaf respectievelijk 10, 17 en 22 minuten gekozen worden. Een evolution vervangt het wapen niet door een extra slot.

Chain Lightning springt maximaal 820 pixels vanaf de speler en valt 15% sneller aan dan voorheen. Eiad Bom start op 85 damage, schaalt gematigder per level en doet 42% van zijn normale schade tegen bosses. Tempest voert twee zelfstandige ketens uit. Ranged Shades schieten alleen zichtbaar binnen 430 pixels en houden afstand tot 300 pixels.

Audio, beste runs, achievements en permanente upgrades worden lokaal opgeslagen in `localStorage`. De Web Audio-effecten beginnen pas nadat je op Start hebt gedrukt. De game draait client-side en is geschikt voor GitHub Pages.

Graphics quality staat in Settings op Low, Medium of High. Dit verandert alleen decoratieve glow, achtergronddecoratie en particlelimieten. Schakel `Show FPS, frametime and object timings` in voor FPS, frametime, enemy-AI-, collision- en renderduur plus entity-aantallen.

Run tests with `node --test tests/game-logic.test.js`. Run the repeatable target-search stress benchmark with `node tests/performance-benchmark.js`.


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
