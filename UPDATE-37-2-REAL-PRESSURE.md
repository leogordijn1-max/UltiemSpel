# Update 37.2 — Water Bolt, echte vijandendruk, healing en gevaarlijke Guardians

**19 oktober 2026 · Branch:** `feature/living-world-prototype`  
**Status: code-hotfix + Node-regressies. Live browser-heracceptatie OPEN.**

## Waarom deze update bestaat — directe makerfeedback met echte QA

Maker zegt na Update 37: *"healing nu steeds slechter maar dat is niet het probleem. water bolt moet nog steeds slechter, je moet veel vaker geraakt worden en meer damage krijgen en misschien zelfs meer kunnen healen om dat te compenseren, dat je echt constant aan het zoeken bent naar manieren om te healen. daarnaast moeten de boss attacks echt veel gevaarlijker, de nieuwe attacks zijn veeeeel te makkelijk te ontwijken."*

Bron: meegestuurde lokale browser-run `shadow-survivor-qa-water-1601s.json`, **schema 2**, `sandbox:false`, Water/Survivor/Standard/Normal/High, Victory na **1602 gameseconden ≈ 26:42**. Resultaat: **21 hits, 333,86 damage**, **1.938,88 XP**, 19 level-ups, twee echte evoluties (Riptide Lance en Maelstrom), 4 Guardian-kills. Laatste checkpoint (26:30): **175,74/230 HP**, **369,60 geregistreerde healing**, **Vitality 3**, regen **0,50 HP/s**. De tweede helft bevat zeer weinig werkelijke hits: **slechts twee tussen 15:00 en 25:00**, ondanks 52 gelogde nieuwe Guardian-salvo-events over de gehele run. Belangrijk: het JSON registreerde voorheen per hit `amount` en `health` maar **geen aanvalsoorsprong**. Dus 52 boss-salvo-events versus 21 hits bewijst niet rechtstreeks hoeveel secundaire Guardian-projectielen raak waren; de data laat wel zien dat de maker lange veilige periodes ervaart, overeenkomend met diens feedback.

Meer healing wegnemen maakt een gemiste of passief ontwijkbare aanval niet gevaarlijker. Het ontwerpdoel is **agressieve vijanden + echte verwondingen + schaars maar actief na te jagen herstel**, zonder verborgen autohits of onmogelijke bosses.

## Wijzigingen

### Water Bolt heeft minder automatische lane control

- Basisprojectiel nu **14–30 raw damage op level 1–5** (`10 + 4*level` in plaats van `12+5*level`); Riptide multiplier **1,10** (was 1,15).
- Bolt pierce **1** normaal, **2** geëvolueerd (voorheen 2 en 3).
- Rapid Casting-vloer **1,12s** (voorheen 0,98s), basisaanvalscooldown aangepast naar `max(1.18,1.72-0.1*level)` vóór rateberekening. Minder projectielen bij veel Rapid Casting.
- Bolt maximaal **900** aim-distance in plaats van 1100. Water-soak door *Bolt* slechts **0,65s** (was 1,8s), knockback voor gewone enemies **75** in plaats van 170. Andere Water-wapens houden 1,8s soaking en hun oude duwkracht; geen generieke nerf voor heel Water.

### Vaker werkelijk geraakt worden en meer inkomende schade

- `js/combat-difficulty.js`: Normal gewone enemy-threat van 1,0 naar maximaal **1,65** na game-minuut 25 (was 1,50), nog steeds vanaf minuut 5 en zonder extra horde-spawns. Nightmare bouwt eveneens verder op; Easy blijft gelijk.
- Gewone squad-enemies zijn op Normal **iets sneller en schadelijker** (+6% speed en +12% damage); Nightmare behoudt hogere waarden en duidelijke warnings.
- **Melee pursue factor** voor non-boss, non-ranged, non-summoned enemies groeit vanaf game-minuut 3 tot maximaal **1,65 bij >340px afstand**. Dichtbij heeft hij minder effect. Zo worden vertragingen en sterke autoaim niet al bij voorbaat een gegarandeerde onkwetsbare kitestrategie; alleen echte collision veroorzaakt hits.
- Ranged enemy cooldown Normal nu **3,4–4,6s** (was 4,5–6,2); Nightmare 3,1–4,2 en Easy ongewijzigd. Belangrijk: bestaande zichtbare waarschuwingszone blijft; nooit offscreen-schieten.
- Contact damage-iframe van gewone enemy-contact **0,68s** (was 0,85); bossprojectiel **0,64s** (was 0,70). Nog altijd minstens ~0,6s tijd om weg te lopen; korte iframes zijn geen gratis damage.

### Healing niet verder straffen; herstel via risico en positie

- **Vitality regen juist een beetje omhoog:** basislevel 1 **0,25 HP/s** (was 0,23); nog steeds pas 3s na vorige hit en afvlakkend per level.
- Wanneer speler **onder 83% HP** is, kan het verslaan van een gewone vijand/elite een **groene health pickup** geven. Kans voor runners volgens bestaande difficulty-dropfactor, andere normale enemies 8,5%, elite 14%; pickup waarde **14, 16 of 22 HP** volgens vijandtype. Bestaande pickup-/magnetmechaniek neemt alleen health bij daadwerkelijke collection aan — geen automatische globale instantheal bij een kill.
- Geen speciale XP/drop-bonus bij bosses en geen loot-spam door summons; geldigheid gekoppeld aan werkelijk gewonde speler. Regen blijft complementair aan tactisch pickups najagen.

### Alle Guardians: normale salvo's zijn daadwerkelijk dreigender

- Beau/Shade: **echte zichtbare target-centre trap** toegevoegd aan het patroon waar vroeger alleen flank gemarkeerd was; daarmee wordt rechtuit blijven lopen of midden blijven campen niet langer automatisch veilig. Flankzones en dreigingen blijven zichtbaar via dezelfde geometry die collision berekent.
- Bell/Meme: soortgelijke centre trap toegevoegd voor Clapper's Verdict, Pixel Rip en Glitch Double; Split Hour behoudt een gemarkeerde center strike. Maximaal **drie getekende circles** voor patronen, geen random extra onzichtbare damage.
- Aanvalsprojectielen **sneller** (Beau/Shade `365+24*phase`, Bell/Meme `370+24*phase`) en **harder raak** (meestal 15–17 + 3 × phase). Gewone salvo-cooldowns ingekort; doel blijft gedurende de eerste **0,57s** van het bestaande windup volgen in plaats van 0,35s, daarna doel/waarschuwingen vergrendeld. Alle live schades liggen op werkelijk gemarkeerde posities, met minstens 0,76/0,8s vertraagde impact.
- Alle geliefde **signature attacks, Phase III cinematic ultimates**, bossvolgorde, XP-rewards en World/Save-flow van Update 37 blijven onaangeraakt.
- Geen screenwide instant damage of extra onuitwijkbare horde; bestaande tests zoeken expliciet een ruime veilige flank op >400px.

### Betere QA voor de volgende run

Vanaf deze build bevatten nieuwe `hit`-events naast amount/health een optionele `source`: `enemy_contact`, `enemy_projectile`, `guardian_contact`, `guardian_projectile`, `guardian_hazard` of `unknown` voor de overige bestaande sources. Daardoor kan de volgende playtest precies laten zien of gewone vijanden echt vaker aansluiten en of de boss-projectielen/area's raken. Oude schema-2 exports blijven te lezen.

## Technische controle

Aangepast in `js/elemental-combat.js`, `js/combat-difficulty.js`, `js/enemies.js`, `js/game.js`, `js/guardian-secondary-attacks.js`, `js/guardian-late-secondary.js`, `js/upgrades.js`, `index.html`. Nieuwe tests: `tests/update-37-2-real-pressure.test.cjs`; oudere regressies bijgewerkt met de actuele balance-acceptatie (oude waardetests waren niet langer waar).

Deze tests checken echte cooldown-/pursuitfuncties, behoud van niet-Water cooldowns, gerichte drop- en pickupflow, waarschuwingen met exacte collisioncoördinaten, werkelijk snelle projectielen en vrij bereikbare ontsnappingspaden. **GitHub Actions moet op de laatste HEAD groen zijn voordat we dit als technisch gereed aanduiden.** Dit is NIET de menselijke live test. In Node-VM simulaties kun je niet bewezen voelen of een bossfight spanning heeft.

## Makeracceptatie volgende Water Standard Normal run

1. Maak minimaal één volledige run, liefst 1× tijdens bossgevechten; 2×/3× daarna waar haalbaar. Export nieuwe QA JSON. Bekijk **hits per 5min**, schade per window en of vooral de periode 15–25min nu echt gevaarlijk is; vergelijkt baseline 21 hits, 333,86 damage, twee hits in 15–25min.
2. Bekijk of *makkelijk rechtdoor lopen* nog steeds alle Beau/Shade/Bell/Meme-salvo's ontwijkt; is er een echte betekenisvolle dodge/positie-keuze? Is elke gemarkeerde cirkel aanwezig vóór hij schade doet? Is de afstand tussen snelheid/telegraph op 1×/2×/3× fair?
3. Kijk of je na meerdere hits **bewust moet draaien richting health pickups**, zonder dat dezelfde voorraad automatisch op volle HP terugkomt en zonder dat gebrek aan pickups een willekeurige instadiefstraf wordt.
4. Maak onderscheid tussen aangeleerde bossmechanica (mag je na oefenen goed ontwijken) en ontbrekende dreiging (nooit uitgedaagd, zelfs als je passief loopt).
5. Exporteer `hit.source`-tellingen zodat we bossprojectiles/hazards/contact gescheiden kunnen onderzoeken. Houd ook XP/evolution-gates 10:00/17:00, live FPS op High/Low en The Last Meme's iconische finale intact.

**Geen live balance GO totdat maker heeft gespeeld.** Dit is een gerichte Update **37.2**, niet de volledige geplande Update 38 All Nine Weapons. Update 38 blijft later Fire/Water/Frost over alle 9 wapens + specifiek Frost Orb vergelijken.
