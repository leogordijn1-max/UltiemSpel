# Update 34 — Bell Tower & The Last Meme: secundaire aanvallen met identiteit

**Datum:** 19 oktober 2026  
**Branch:** `feature/living-world-prototype`  
**Status:** **Code geïmplementeerd en CI groen: 527/527 tests.** Nieuwe echte Bell-/Meme-browsertest door de maker nog **OPEN**. Update 32.1 Water/Vitality-balance en Update 33 Beau/Shade-browsertests eveneens OPEN.

## Aanleiding — wat de maker echt vond

Uit de eerdere werkelijke Water- en Frost-playtests: de maker vindt **Beau en Mourning Shade hun twee sterkste aanvallen** al geweldig; voor Bell Tower en The Last Meme waren **bijna alleen hun laatste, ultieme aanvallen** leuk en uitdagend. **The Last Meme's laatste aanval** is nadrukkelijk de gewenste kwaliteitslat. Andere attacks moesten cooler en dreigender, maar niet door oneerlijke, onzichtbare schade of zonder uitwijkruimte. Update 33 maakte de gewone aanvallen van Beau/Shade beter; Update 34 doet hetzelfde bij de twee laatste Guardians.

**Bewuste scope:** `js/bell-encounter.js`, `js/meme-encounter.js`, `js/boss-combat.js` en `js/guardian-arena-powers.js` blijven inhoudelijk **ongewijzigd**. Dus **Resonant Sweep / Clockwork Judgment / The Grand Peal**, **Reality Scissors / Broken Orbit / The End of Everything**, vier Guardian Powers en de fameuze eindaanval worden NIET vervangen, afgezwakt of gereset. Dit gaat om de **reguliere salvo's daartussen**; standaard boss/Endless-flow blijft behouden.

## Wat is er echt in de game veranderd?

Nieuwe module **`js/guardian-late-secondary.js`** bevat vier patronen. Bell Tower (`kind:3, variant:2`) en The Last Meme (`kind:3, variant:3, isFinalBoss:true`) krijgen elk twee normale aanvallen die deterministic afwisselen. De module is gekoppeld aan de **echte game-loop**, echte `addBossProjectile` projectielen, bestaande `bossHazards`, `runQaEvent`, en Canvas-tekenfunctie. Er worden geen extra gewone vijanden gespawnd.

| Boss | Patroon | Werkelijke schademechaniek | Speelbare reactie |
|---|---|---|---|
| **Bell Tower** | **CLAPPER'S VERDICT** | Drie Bell-projectielen: snelle rechte klokslag plus twee tragere hoeken; **twee** links/rechts gemarkeerde, vertraagde grondinslagen | Kies een open hoek; als je opzij sprint, let dan op de gemarkeerde flank |
| **Bell Tower** | **SPLIT HOUR** | Drie echte Bell-projectielen vanuit Bell zelf, plus twee vanuit **zichtbaar aangekondigde zij-emitters**; één gemarkeerde late centrumslag | Lees de zijlijnen en verlaat de centrale inslagzone |
| **The Last Meme** | **PIXEL RIP** | Vijf rift-projectielen, snelle centrale breuk, **twee** afzonderlijke diagonale grondinslagen | Niet alleen de middenaanval ontwijken, ook de zijkant van het patroon lezen |
| **The Last Meme** | **GLITCH DOUBLE** | Een snelle centrale rift plus vier flankschoten van **twee zichtbare zijkant-emitters**, en twee uitgestelde voor/achter-inslagen | Zijwaarts bewegen; de grondmarkeringen liggen niet op de volledige uitwijkbaan |

**Eerlijke gevarenzones:**
- De waarschuwing begint bij de echte al bestaande `shotWarning` (Bell Phase I ~1,05s, later ~0,95s; Meme Phase I 1,2s, II 1,05s, III 0,92s in **gameklok**).
- De aim volgt slechts tijdens de eerste **0,35 gameseconde**, daarna lockt de richting/positie via het al bestaande `js/game.js`. De warning wordt ook al in het eerste frame op de daadwerkelijke targetpositie gezet, zodat er geen schokkende sprong van 0,0 naar de speler optreedt.
- `guardianLateSecondaryDanger()` en `guardianLateSecondaryShots()` leveren **dezelfde locaties en snelheden** aan tekenen en later aan de echte projectile-/hazardfuncties. Geen decoratieve "veilige" ruimte claimen die in werkelijkheid door een onzichtbare grote ronde wordt geraakt.
- Low én High tekenen markeringen met duidelijke buitenringen/aanvalslijnen, en High toont naam/extra effect. De oude **brede generieke boss-shot-cones worden niet tegelijkertijd getekend** als een specifiek Bell/Meme- of Beau/Shade-patroon actief is. Dat lost valse waarschuwingen door overlappende UI op.
- De vertraagde **grondinslagen** verschijnen in de bestaande bossHazards-queue met **0,80s extra warning** vóór ze daadwerkelijke damage geven; daarbovenop bestond de eerdere, duidelijke shot-windup.
- Er worden maximaal **vijf nieuwe projectielen plus twee ground-hazards** per normale volley afgegeven. Normale damage volgt de bestaande difficulty-schaalfactor; dash en invulnerability blijven intact.
- De volgende speciale aanval wordt minimaal **1,55 gameseconde na afloop van deze normale shotwarning** gepland om onverwachte immediate overlap met de late grondinslag te vermijden. Dit is geen garantie dat elke projectiel-baan nooit kan kruisen; dat vraagt live QA.
- Verandert het boss-HP-fasegetal midden in de warning? De vorige geplande aanval wordt geannuleerd en kan niet alsnog afvuren met het oude patroon. Ook een dode boss vuurt niet.

## Integratie per codebestand

- **`js/game.js`**: berekent echte `warningX/Y` al bij het beginnen van shotwarning; `prepareGuardianLateSecondary(e,time)` na het starten van een gewone Bell/Meme shot-warning; cancelt bij Bell fase II/III en Meme fase II/III.
- **`js/enemies.js`**: kiest bij een voorbereide normale Bell/Meme-volley `fireGuardianLateSecondary()` en brengt de echte projectielen en gemarkeerde ground hazards in dezelfde bestaande systemen als alle andere bossprojectielen. Als er geen plan is, blijven de oorspronkelijke `bossFire`/`finalBossFire` fallback-routines bestaan; Bell/Meme signature en showcase-methodes zijn ongewijzigd.
- **`js/render.js`**: tekent de echte gevaren met `drawGuardianLateSecondary()` op Low/High. Slaat de generieke old-style breedte-cue over wanneer `lateSecondary` of `secondaryVolley` actief is, zodat geen dubbele/tegenstrijdige markering optreedt.
- **`index.html`**: laadt de nieuwe module na `boss-combat.js` en de Update-33-module, maar vóór de specifieke `bell-encounter.js` / `meme-encounter.js`; versietags bijgewerkt.
- **QA:** bij iedere daadwerkelijk gestarte geplande normale aanval één `boss_secondary_attack`-event met bossnaam, patroon, fase, waarschuwingduur. Geen internetupload: speler downloadt lokaal JSON via bestaande QA-paneel.

## Testbewijs — technisch groen maar nog geen live speelgevoel

**[GitHub Actions-run met 527/527 geslaagde tests](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39238642036)**.

**13 nieuwe Update-34 regressietests** in `tests/update-34-late-guardians.test.cjs`: alleen de juiste bossvariant, deterministische vier-pattern-rotatie, geen schade vóór warning of dubbele salvo, alle echte projectile- en hazardwaarden, flankschutters op veilige afstanden van het doel, gemarkeerde hitzone = werkelijke collision, brede uitwijkmogelijkheden buiten gevaarcirkels, phase interrupt en geen post-death attack, Low/High-tekening, bescherming van `The Grand Peal` en `The End of Everything`, bijbehorende scripts/real-hooks.

**Bewijsgrens:** er is nog **geen daadwerkelijk gespeelde nieuwe Bell/Meme Normal-run na deze update**. De geautomatiseerde tests bewijzen functiecall- en geometriegedrag van deze subsystemen, niet of de maker deze aanvallen al visueel dik genoeg vindt, of er in de volledige arena geen ongewenste combinatie met minions/boss-projectiles voorkomt, of het FPS-effect op Low/High meevalt. Volledige Verified Playable Release blijft **NO-GO**.

## Later testen als de maker weer speelt

1. **Bell Tower:** herken **CLAPPER'S VERDICT** en **SPLIT HOUR** in Phase I/II; de gewone aanval moet spannender worden zonder dat de geliefde **THE GRAND PEAL** ontbreekt. Check dat flankemitters en echte schoten op hetzelfde moment verschijnen.
2. **Last Meme:** herken **PIXEL RIP** en **GLITCH DOUBLE** in alle phases. De laatste grote **THE END OF EVERYTHING** moet nog even dik en moeilijk blijven. Begin op 1×; herhaal desnoods op 2×/3×.
3. De **laatste 0,35s aim-lock**: zodra de aanvaller heeft gelockt, beweeg expres opzij. Markeringen en late grondinslagen horen op dezelfde plek te blijven. Let op of dash/outside markers werkelijke veilige keuzes zijn.
4. **Low/Medium/High**, vooral druk rond 25:00 met boss + summoned minions; niet onopzettelijk FPS verliezen door extra Canvas-waarschuwingslijnen. Neem QA-JSON en noteer zowel plezier als vermeende onzichtbare hits.
5. **De update 32.1 survival-herplaytest staat NOG OPEN**: heeft Vitality-herstelpauze de Water-run uitdagender gemaakt? Wat gebeurt er met Zombie Mike en Water Bolt? Dit staat los van de technische Update-34-done-staat.
6. Bij een vreemd overlapmoment: noteer bossnaam, fase, naam van nieuw patroon, spelsnelheid en approximate gameklok; met `boss_secondary_attack` kan de log helpen reproduceren.

## Volgende update

**35 — Unieke enemy-rollen met silhouette = ability en echte tegenstrategie:** zware **Anchor** (veel minder knockback/Whirlpool), flankende **Phase Stalker**, zichtbare beschermende **Warden**, zoveel mogelijk als evolutie van bestaande Zombie Mike/Runner/Bulwark, niet blind extra horden. Later bij Updates 41–50 de bijna-3D-vloeiende stylized 2.5D-uitstraling.
