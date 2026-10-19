# Shadow Survivor

> **LIVE UPDATE 31 (18 oktober 2026):** De maker leverde twee echte complete browser-JSONs aan: Frost Standard Normal Victory 28:01 (sandboxflag true, maar expliciet géén developer-tools gebruikt; sandbox onderdrukte normale bossrewards) en **Water Standard Normal Victory 26:44, sandboxflag false** (vier Guardians verslagen, twee earned evoluties exact 10:00 en 17:00, drie gewone bossrewards, gemiddelde 143,78 FPS op High). **Update 31 nu technisch én live QA afgerond**; M1/M2 Water aangetoond, M3–M6 slechts gedeeltelijk, **release nog NO-GO**. Zie [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md) en [ROADMAP-31-50.md](ROADMAP-31-50.md). Oudere tekst hieronder over 'nog geen live-run' is historische stand vóór ontvangst van de resultaten.

> **Project voortzetten met een nieuwe AI-chat?** Lees eerst [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md) voor visie, sfeer, gemaakte beslissingen en de werkwijze, en [MILESTONE-30.md](MILESTONE-30.md) voor de actuele updateplanning. Deze README bevat op onderdelen nog informatie over oudere versies; de actieve code op de ontwikkelbranch is leidend.


## Nieuwe gerichte hotfix: Update 38.2 — Constant Pressure

**ACTUEEL — UPDATE 38.2: CONSTANT PRESSURE & UNIEKE GUARDIAN-OPENERS (19 oktober 2026).** Gebaseerd op échte [Fire Standard Normal QA](UPDATE-38-2-CONSTANT-PRESSURE.md): **defeat op 12:35**, 11 hits/183,48 damage, 42 health pickups, 0 Vitality, 2 Guardians gekilled, 1 Meteor Rain evolutie; gewone field had vaak **slechts 1–4 enemies**, early 0 hits. Daarom nu geen healing-nerf, maar **Normal doorgaande ambient mini-packs van 2–4 sterke offscreen enemies**, ambientcap 10–14, 1,65–2,6s entrycadence, kortere recoveries (2,5–3,3s) en waves (38–46s), patrols sneller, globale cap 30. Easy blijft rustiger; Boss-arena blijft geïsoleerd. De **eerste twee normale attacks van Beau, Shade, Bell, Last Meme** hebben nu elk andere echte geometry (voorwaartse charge lane / pack-pincer; laterale spear wall / diagonal phantom corners; chime cross / lengthwise timing corridor; checkerboard rip / forward-back shear) i.p.v. kopieën van cirkels, snellere schadelijke projectielen en 0,52s delayed real hazard na volledig zichtbaar telegraph. Tekenen en collision delen exact dezelfde coördinaten. **584/584 CI groen vóór doc slot; geactualiseerde branch-CI controleren**. **NIET live door maker gespeeld**, FPS/druk/uitwijkbalans en 39's vereiste 3 volle runs blijven OPEN. Volgende stap maker hertest, daarna Update 39 volledige Fire/Water/Frost runs, Update 40 releasegates NO-GO tot bewijs. Geen extra bonus evoluties, geen geknipte signatures of healerf.

## Laatste balansaanpassing: Update 38.1 — Normal Mastery

**ACTUEEL — UPDATE 38.1: NORMAL MOET JE VERDIENEN (19 oktober 2026).** Makerdoel: een nieuwe speler wint doorgaans niet in de eerste Normal-runs; verlies moet leerzaam, zichtbaar en te voorkomen zijn door beter dodgen, Guardian-patronen kennen en actief health pickups zoeken. **GEEN** verborgen winstblokkade, gegarandeerde dood, nep-hits of healing-nerf. Code: gewone Normal enemy-damageramp begint vanaf **4:00 (voorheen 5:00)** en bereikt dezelfde cap **1,65× op 22:00 (voorheen 25:00)**. Guardian normale salvo-cooldowns versnellen gecontroleerd in fase I/II/III met factoren **0,97 / 0,89 / 0,83** (Nightmare nog sneller), minimum **1,35s**; bestaande warningtijden, signature-ultimates en recovery blijven. **Easy onveranderd**, Vitality en healing pickups blijven. Difficulty-menu legt beginner vs Normal uit. Nieuwe regressietests: **578/578 CI groen vóór documentatiewijzigingen**. [UPDATE-38-1-NORMAL-MASTERY.md](UPDATE-38-1-NORMAL-MASTERY.md). **Geen recente menselijke browserrun na deze build**, dus novice-winrate, feel en release-acceptatie nog OPEN. De gevraagde Update 39 blijft drie complete Normal-runs Fire/Water/Frost met UX-fixes; niet doen alsof 39 door deze hotfix klaar is.

## Nieuwste game-update: 38 — All Nine Weapons

**UPDATE 38 (19 oktober 2026) — ALL NINE WEAPONS, CODE TECHNISCH GEREED; LIVE ELEMENT-QA OPEN.** [UPDATE-38-ALL-NINE-WEAPONS.md](UPDATE-38-ALL-NINE-WEAPONS.md) bevat de 9×4=36 matchups die door de echte `damage()` lopen: Flame Cone, Fireball, Flame Orbit; Water Bolt, Tidal Wave, Whirlpool; Frost Orb, Ice Shards, Glacial Pulse. Rollen: Drifter/gewone, Runner/Phase Stalker, Zombie Mike/Anchor, Bulwark/Warden. Water Bolt blijft na hotfix 37.2 raw 14–30/pierce 1 (Riptide 2), maar krijgt minder damage versus tanks/schilden en kleinere, schaarsere wet-ground sporen. Frost Orb houdt 1 homing-projectile, maar beperkte radius/aim/homing, echte 2,65s min-cooldown ook bij Rate V, minder herhaald chill en een 70%-slow; Ice Shards/Glacial Pulse houden hun eigen sterkere slow en evoluties. Andere 7 wapens behouden hun identiteit met compacte matchupverschillen. Boss-signatures, weerstand, 37.2 healing/hit-pressure, 10/17m evolutiegates en saves/Endless blijven. **573/573 CI groen op code vóór documentatie; menselijke Fire/Water/Frost-runs na deze update NIET uitgevoerd, geen balance- of release-GO. Fase 31–40: 8/10 code gebouwd; volgende Update 39: drie complete Normal runs & UX-fixes.**

## Nieuwe combat-hotfix: Update 37.2 — echte dreiging & actief herstel

**HOTFIX 37.2 · ECHTE WATER-RUN & NIEUWE DREIGING (19 oktober 2026):** Nieuwe Water Standard Normal High Victory 26:42 (schema 2, non-sandbox) eindigde op **21 hits / 333,86 HP damage** en 369,60 HP healing, met slechts twee hits tussen 15:00–25:00 ondanks 52 gelogde secundaire Guardian-volley-events. Maker wil **geen verdere healing-nerfs**, maar vaker echt geraakt worden, forse schade, actieve health pickups en bossaanvallen die écht lastig te ontwijken zijn. De hotfix verlaagt daarom **Water Bolt** damage/pierce/rate/soak/push, verhoogt normal-enemy pursue/damage/ranged attack pressure zonder meer spawns, houdt Vitality intact en verhoogt die iets, en geeft gewonde spelers herstelpickups bij kills. Beau/Shade/Bell/Meme krijgen snellere sterkere gewone projectielen én getekende centre hazards naast flanken, met echte vrijliggende dodge-routes; iconische ults blijven. QA-hit events vermelden nu bron (`enemy_contact`, `enemy_projectile`, `guardian_projectile` enz.). [Volledige code- en maker-testdetails](UPDATE-37-2-REAL-PRESSURE.md). **De hertest in de browser is nog OPEN: niet claimen dat de balans nu daadwerkelijk goed is.** Dit is een combat-hotfix op 37, geen voltooide Update 38; World/Save/Endless-code uit 37 blijft behouden.

## Nieuwste game-update: 37 — Living World, Save & Endless

**UPDATE 37 (19 oktober 2026) — WORLD, SAVE & ENDLESS TECHNISCH GEREED; LIVE BROWSER-QA OPEN.** De game bewaart na refresh eindelijk `runElement`, `worldBefore`, `worldAfter`, `worldImpact` en alle 9 Fire/Water/Frost-runwapens via veilige `shadowProgress` save-versie 4; Records laat nu de wereldreis zien (bv. FROZEN → FLOODED, 100%). Unieke boss-trofeeën blijven na reload behouden, een Standard Victory + Endless gaat door op hetzelfde run-ID en herhaalde Endless-dood kan geen dubbele record-/puntenbeloning maken. World-stages 15/50/85 blijven tijdelijk bij verlies, slechts echte Standard-conquest wordt permanent; als localStorage niet schrijft meldt Victory duidelijk SAVE UNAVAILABLE. Levensgeschiedenis registreert nu ook Water-/nieuwe Fire-/Frost-wapens. [UPDATE-37-WORLD-SAVE-ENDLESS.md](UPDATE-37-WORLD-SAVE-ENDLESS.md) geeft alle technische tests en maker-herteststappen. **559/559 CI groen vóór documentatiebijwerking; de browserrefresh-/Endless-/verliesflow is nog NIET door maker getest, dus geen live GO.** **Update 31–40: 7/10 code gebouwd, alleen 31 live geaccepteerd; volgende 38 alle negen wapens inclusief Water Bolt/Frost Orb, terwijl Update 36.1 balance QA OPEN blijft.**

## Belangrijke combat-hotfix: Update 36.1

**UPDATE 36.1 — WATER/COMBAT HOTFIX NA ECHTE UPDATE-35-RUN (19 oktober 2026).** De maker leverde een non-sandbox Water Standard Normal Victory 25:51 aan: 29 hits, 493,99 damage, 532,99 healing, twee evoluties en alle vier Guardians. Feedback: Water Bolt te sterk, boss-aanvallen verwarrender maar niet spannender, te weinig binnenkomende damage. Analyse toonde dubbele Water Bolt-knockback (generiek + water), een zeer sterke Rapid Casting/Riptide-setup en veel Vitality-herstel. Code-hotfix: **één** Bolt-duw i.p.v. twee, Bolt-cooldown minimaal 0,98s, lichtere schade/pierce, Vitality L2 ~0,391 HP/s i.p.v. ~0,595, minder (3) overlappende boss-projectiellijnen met snellere/duidelijkere aanvallen en echte waarschuwingen. Geen extra hordes, geen verwijderde ultieme Guardian Powers. **Nieuwe handmatige browsertest na de hotfix nog OPEN**; de aangeleverde run was schema 1 (vóór Update 36-telemetrie). [UPDATE-36-1-WATER-PRESSURE-HOTFIX.md](UPDATE-36-1-WATER-PRESSURE-HOTFIX.md) is het volledige verslag. **Prioriteit: deze nieuwe balans eerst echt testen en zo nodig verder corrigeren vóór andere grote features.**

## Nieuwste game-update: 36 — FPS & Memory (19 oktober 2026)

**Update 36 is technisch gebouwd; de handmatige browser-performancegate is nog OPEN.** Het lokale QA-rapport heeft nu 5s FPS/P95 over maximaal 1.200 echte frames, gemiddelde AI/collision/render-ms per frame, frametimepieken en >33ms-stutters, kwaliteits-, snelheids- en Guardian-labels, en optionele Chromium-heapmetingen (`null` als niet beschikbaar). Daarnaast worden particle-/tekstarrays in-place opgeruimd om onnodige tijdelijke arrays te vermijden. Nieuw offline script: `node scripts/performance-report.cjs <qa.json>`. **Geen daadwerkelijke nieuwe Low/Medium/High/3×- of late Guardian-browsertest gedaan; geen FPS-winst of lekvrijheid bewezen.** [UPDATE-36-PERFORMANCE.md](UPDATE-36-PERFORMANCE.md) bevat het volledige speeltestprotocol en de resterende acceptatie. Fase Updates 31–40: **6/10 code gebouwd; alleen 31 live geaccepteerd**. Na de open browserchecks volgt **Update 37 — World/Save/Endless**.

## Historisch: game-update 35 — Unique Enemy Counters (19 oktober 2026)

**Op `feature/living-world-prototype` daadwerkelijk in de game gebouwd en 539/539 automatische tests groen:** bestaande Zombie Mike wordt **THE ANCHOR** (zware verankerde voeten, praktisch ongevoelig voor Whirlpool, Bomb-hit maakt hem 2,6s kwetsbaarder), tactische Pouncer-Runner wordt **PHASE STALKER** (duidelijk gewaarschuwde diagonale dash met een 1,6s counterattackvenster), Ward-Bulwark wordt **THE WARDEN** (beschermt maximaal twee echte teamgenoten met zichtbare verbindingen zolang zijn schild omhoog is). Alle drie krijgen functionele Low/High-Canvas-silhouetten en echte Water/Whirlpool-/hitinteracties, **zonder extra normale vijanden/spawnspam**. De QA-JSON telt nu hoeveel van elk type tijdens de run zichtbaar zijn. [UPDATE-35-ENEMY-COUNTERS.md](UPDATE-35-ENEMY-COUNTERS.md) bevat techniek, daadwerkelijke cijfers en Playtest-protocol. **De maker heeft deze rollen nog NIET in een nieuwe normale Water-/Frost-browserrun gespeeld**; survival-/boss-QA van 32.1/33/34 blijft eveneens open. Volgende: **Update 36 — performance- en memory-stress**; later 41–50 de veel mooiere, supervloeiende 2.5D-designs.

## Laatste game-update: 34 — Bell Tower & The Last Meme (19 oktober 2026)

**Code geïmplementeerd in `feature/living-world-prototype` en 527/527 automatische tests groen.** Bell Tower wisselt nu zijn normale aanvallen **CLAPPER'S VERDICT** en **SPLIT HOUR** af; The Last Meme heeft **PIXEL RIP** en **GLITCH DOUBLE**. Zijschutters en grondgevaar worden vóór de impact duidelijk getekend en gebruiken werkelijke projectiel-/damagefuncties; extra **0,8 gameseconde** hazardwaarschuwing, correcte aim lock en fase-annulering, geen extra gewone enemies. **Bestaande geweldige Phase-III-ultimates en Meme's grote finaleaanval blijven intact.** [UPDATE-34-LATE-GUARDIANS.md](UPDATE-34-LATE-GUARDIANS.md) beschrijft code, patronen en noodzakelijke browserchecks. **De maker heeft de nieuwe Bell-/Meme-bossmoves nog niet live getest**; Update 32.1 Water/Vitality-survival- en Update 33 Beau/Shade-livechecks eveneens open. Volgende feature 35: unieke counter-enemies met herkenbare visuele identiteit.

## Nieuwe bossaanvallen — Update 33 (19 oktober 2026)

**Code gebouwd op `feature/living-world-prototype`: 514/514 tests groen.** Beau heeft nu **FANG SWEEP** en **PACK CROSSFIRE**, The Mourning Shade **MOURNING LANCES** en **PHANTOM MIRRORS**. Het zijn **werkelijk andere, afwisselende normale aanvallen**, met vanaf het eerste warningframe getekende gevaarzones en echte projectielen (soms vanaf zichtbare flankschutters), extra warning voordat grondinslagen raken, fase-interrupt en behoud van de geliefde bestaande signatures en Phase-III-ultimates. Geen extra horde-enemies; geen aanpassing van Bell/Meme. Zie **[UPDATE-33-GUARDIAN-SECONDARY.md](UPDATE-33-GUARDIAN-SECONDARY.md)**. **Live boss-QA is nog OPEN:** de maker gaat later op Low/High en 1×/2×/3× kijken of ze werkelijk cool, spannend en eerlijk zijn. Ook Water/Vitality/enemy-pressure van Update 32.1 moeten nog in de browser hertest worden. **Volgende feature: 34 Bell/Meme overige aanvallen verbeteren met behoud van hun favoriete ultieme powers.**

## Laatste balance-hotfix: Update 32.1 (19 oktober 2026)

Na de eerste Update-32-fix speelde de maker nog een Water Normal Standard-run: **27:01 Victory, 52 hits, 843,71 cumulatieve schade, toch 243/260 HP**. De maker bevestigt dat Zombie Mike dichterbij kan komen, maar de gewone vijanden en Water Bolt nog steeds te weinig gevaar opleveren. **Let op:** de nieuwe JSON toont **Vitality 4** door +2 bossrewards na zowel Beau als Shade, ook al rapporteert maker dat in andere situaties Vitality 1 al veel te sterk is. De oude regen was ononderbroken 3,2 HP/s bij Vitality 4. **Update 32.1 is daarom technisch gepusht:** Vitality regen vertraagt 3s na hits en groeit afvlakkend (L1 0,35; L4 ~0,89 HP/s), gewone enemies worden na minuut 5 geleidelijk gevaarlijker tot +50% damage op minuut 25 in Normal, Water Bolt vuurt maximaal elke 0,78s en Riptide Lance piercet vier in plaats van vijf doelen. Geen extra hordes of boss-ultimates gebufft. Nieuwe QA-snapshots meten healing. **Nog géén nieuwe handmatige Water/Frost-browserrun na deze hotfix**; zie [UPDATE-32-1-SURVIVAL-BALANCE.md](UPDATE-32-1-SURVIVAL-BALANCE.md) en [ROADMAP-31-50.md](ROADMAP-31-50.md).

## Nieuwste ontwikkelstatus: Update 32 (19 oktober 2026)

**Update 31 volledig geaccepteerd:** echte Water Normal 26:44 Victory met twee verdiende evoluties exact op 10:00 en 17:00; Frost 28:01 Victory met sandboxflag, hoewel maker geen developerfuncties gebruikte. **Update 32 technisch geïmplementeerd (491/491 groene tests), maar nog niet opnieuw in de browser gespeeltest**. Eén fysiek knockback-model zorgt ervoor dat zware vijanden zich veel beter tegen Water Bolt/Whirlpool verzetten; herhaalde Water Bolt-duw is verminderd maar damage/schietsnelheid blijven. Het level-upmenu reserveert minder vaak een locked weapon en Developer Mode zonder gebruikte cheats toont weer normale bossrewards (blijft een sandbox zonder permanente opslag). **Lees [UPDATE-32-BALANCE.md](UPDATE-32-BALANCE.md)** en [ROADMAP-31-50.md](ROADMAP-31-50.md) voor de details en volgende QA. Voor definitieve balance-acceptatie: speel één nieuwe non-sandbox Water-run en een Frost-run, exporteer JSON en geef aan of Normal nu moeilijker maar nog leuk voelt. M3–M6/release blijven deels OPEN.

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
