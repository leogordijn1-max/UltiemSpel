# UPDATE 32.1 — Normal survival pressure, Vitality en Water Bolt-balance

**Datum:** 19 oktober 2026  
**Branch:** feature/living-world-prototype  
**Status:** **GERICHTE CODE-HOTFIX TECHNISCH GEÏMPLEMENTEERD; nieuwe browserplaytest NA deze hotfix OPEN.** Niet verwarren met de al gespeelde Water-run van vóór deze wijziging.

## 1. Echte makerfeedback + nieuwe lokale Water-JSON

De maker leverde zelf het complete bestand `shadow-survivor-qa-water-1620s.json` aan. **Ruwe JSON (inclusief tijdstempels) is bewust niet naar GitHub geüpload**. De hierna genoemde gegevens zijn uitsluitend technische resultaten, uit dit bestand afgeleid, niet door Node gegenereerde of verzonnen browsermetingen.

- **Standard · Normal · Water · sandbox:false · High graphics · Victory op 27:00,93 gameklok**.
- **52 hits geregistreerd, 843,71 totale geleden damage** (ongeveer 16,23 per gemeten hit). Ongeveer **373 kills op laatste 30s-checkpoint**, level **20**, in totaal **1877,7 XP**.
- Laatste snapshot: **242,53 / 260 HP** bij 27:00,13. Op dat moment dus meer dan **93%** health over, ondanks dat er eerder **ruim 843 HP schade** genomen is.
- Eerste earned evolution **Riptide Lance** op **10:00,02**, tweede **Tsunami** op **19:21,23**. Beide earned en maximaal twee; tweede is later dan het beoogde 17:00 tijdslot maar correct verdiend, zonder gratis levels.
- De maker rapporteert uit eigen speelgevoel: **gewone enemies doen veel te weinig damage; zelfs Vitality 1 en op 3× snelheid is er weinig gevaar; Water Bolt blijft te sterk.** Na de vorige weerstandscorrectie kan **Zombie Mike wél dichterbij komen**. Dit laatste is belangrijke positieve feedback op Update 32, zonder te beweren dat de rest al is opgelost.
- **Belangrijke nuance bij deze specifieke JSON:** gebruiker spreekt in algemene zin over **Vitality 1**, maar in dit ingediende Water-bestand werd bij **Beau 04:25** health **0→2** en bij **Shade 08:59** health **2→4** gekozen als echte dubbele bossrewards. Vanaf dat moment: **260 maximale HP en 3,2 HP/s passieve regen** volgens oude code. De maker is dus niet verkeerd over andere situaties: alleen **dit bestand bevat Vitality 4**.
- Deze run was grotendeels **3× spelsnelheid**, met bossfases ook op lagere spelsnelheid. Gameklok verschilt van echte klok; 3× verhoogt niet intrinsiek de verhouding regen/hit, maar laat zien dat speler zelfs zonder nauwkeurig ontwijken overeind bleef.
- Ter vergelijking: eerdere non-sandbox Water Victory 26:44 had **33 hits, 501 geleden schade, level 21, 395 kills, 2202,78 XP**. Nieuw **52 hits en 843,71 schade**, maar praktisch volle HP. Zonder identical RNG/build is dat geen controlled A/B-bewijs, wel sterk bewijs van te makkelijke sustain.

## 2. Waar kwam het écht vandaan?

1. **Vitality** gaf voorheen per level **+30 Max HP én constant +0,8 HP/s**, zonder herstelpauze na een ontvangen hit. Bij 4 levels stond dat gelijk aan 3,2 HP/s = **192 HP/minuut gameklok**, zolang niet vol. Een 14–21 HP-hit werd al na circa 4–7 seconden weer gecompenseerd. Bossreward +2 twee keer leverde vroeg level 4 en een hoge HP-buffer.
2. Normale enemies begonnen op base **6–16 contact damage** (afhankelijk van archetype), met slechts **+0,004 damage per game-seconde**, zelfs na het eerste kwartier. De Ranged Shade-projectielen deden **9 damage vlak**. Invulnerability 0,7–0,85s per hit en begrijpelijke waarschuwingen zijn bewust eerlijk maar maakten lage sustain-schade nog minder bedreigend.
3. **Water Bolt + Rapid Casting V:** elementair weapon cooldown bij level 5 was 1,0s vóór global rate. Met de bestaande `weaponCooldownMultiplier() = 0.9 ** rate` werd dat circa **0,59s per piercing shot**; Riptide Lance kon **5 doelen** raken. Dat is te veel DPS/crowd-control-uptime in dezelfde sterke build. Zombie Mike kan na Update 32 echter terecht wel door zijn knockback/Whirlpool-resistance naderen.
4. **Geen reden voor hogere vijandenaantallen / massale bossdamagebuffs of een generieke XP-buff**: die zouden de leesbaarheid van de speelwereld en de betekenis van verdiende evoluties kunnen beschadigen.

## 3. Nu écht geïmplementeerd (Update 32.1)

### Vitality — reële keuze tussen overleven en damage

- Nog steeds **+30 Max HP per level** (ook normale bossreward +2 blijft waardevol).
- Na iedere geregistreerde **echte speler-hit**: **3 seconden geen passieve Vitality-healing**. Daarna herstel volgens de progressief afvlakkende formule `0.35 * (1 - 0.70 ** level) / 0.30` HP/s (max level 5). De formule wordt maximaal op level 5 toegepast.
- Bij Vitality **L1: 0,35 HP/s** (was 0,8); bij **L4: ongeveer 0,89 HP/s** (was 3,2). In hevig gevecht, door steeds nieuwe hits, gaat het herstel opnieuw op cooldown. De max-HP-keuze is behouden, geen onzichtbare healing tussen iedere hit.
- Iedere speler-hit loopt reeds via `recordPlayerHit`; dit reset de herstelklok. De klok wordt bij `reset()` geleegd en gebruikt de *gameklok* (dus snelheden 1×/2×/3× laten timing correct opschalen). Health drops, bestaande veilige i-frames, dodges en player HP-rewards blijven intact.
- Nieuwe Vitality-upgradeomschrijving toont de **juiste echte HP/s** en **3 seconden safe recovery**, niet de oude onjuiste `0.8 × level`-tekst.

### Normale vijandenschade — later meer druk, geen horde spam

- Nieuwe pure functie `enemyThreatMultiplier(growthTime,difficulty)` in js/combat-difficulty.js.
- **Normal:** de eerste 5 minuten geen extra schade, van 5:00 tot 25:00 groeit bonus **geleidelijk** van 0 naar **+50% normale enemy damage**, daarna capped. Op 15:00 is het +25%.
- **Nightmare:** eigen minder grote extra late damage-curve (+38%) boven op bestaande grotere Nightmare-basismultiplier; **Easy** geen nieuwe bonus. Alle bestaand leesbare warning windows blijven.
- Dezelfde druk werkt voor **gewone vijanden die aanraken**, **Ranged Shade-schoten** en **waarschuwingsskills** zoals Zombie Mike-stomp, maar wordt **NIET** op de persoonlijke bossaanvallen, fase-3 ultimates of boss-summoned minions gezet. Geen plotselinge dubbele factor op boss projectile/hazard.
- Geen extra vijanden, hogere boss-health, extra RNG-kills of teleportende onontwijkbare aanvallen.

### Water Bolt — sterk blijven, minder oneindige barrage

- **Minimaal 0,78 game-seconde cooldown** per Water Bolt, ook na maximaal Rapid Casting. Voorheen circa 0,59s bij Water Bolt level 5 + rate 5.
- Riptide Lance evolution pierce **4 doelen** in plaats van 5. On-evolved Water Bolt blijft 2.
- Damageformule, basisevolutie, unlock- en levelsysteem, normale water-soak/knockback-resistance en overige elementwapens blijven hetzelfde. De vorige Update-32 zware-enemy-weerstand wordt **behouden**.
- Doel: zonder de Water-fantasie kapot te maken voorkomen dat alle gewone vijanden permanent buiten bereik blijven.

### Extra gegevens voor volgende QA JSON

Iedere 30s-snapshot bevat voortaan **cumulatieve daadwerkelijke healing**, **Vitality HP/s na recovery** en **hoeveel seconden herstel na een hit nog geblokkeerd is**. Zo kan de maker straks expliciet zien of survivability te hoog is, in plaats van alleen Damage Taken + Eind-HP.

## 4. Tests / scope

- **10 nieuwe `tests/update-32-1-survival-pressure.test.cjs` checks**, boven op de Update-32-tests: constante schade vroeg/geleidelijke late Normal-scaling, Easy/Nightmare aparte pressure, 3s heal lockout, diminishing regen, all 3 normale damage routes, bosspowers uitgesloten, run timer reset, Vitality UX, Water Bolt cooldown/pierce en correcte scriptversies plus nieuwe QA-healingvelden.
- Bestaande regressietests en syntaxchecks zijn in GitHub Actions opgenomen. Kijk naar [laatste CI](https://github.com/leogordijn1-max/UltiemSpel/actions?query=branch%3Afeature%2Fliving-world-prototype) voor de exacte eindstand; **nooit beweren dat deze hotfix al live Browser Normal is gevalideerd door alleen een groene CI**.
- **Deze update is een gerichte 32.1-balance-hotfix, geen inhoudelijke Update 33.** Volgende geplande grotere verbetering blijft Beau / The Mourning Shade hun secundaire aanvallen spannender maken, hun twee geliefde sterkste powers behouden.

## 5. Aan maker — wanneer wel écht acceptabel?

Nieuwe **Water · Normal · sandbox UIT**, bij voorkeur met vergelijkbare Water Bolt + Rapid Casting + (sommige) Vitality en Heavy Impact, en opnieuw lokaal QA JSON exporteren:
1. **Eerste 5 minuten**: gewone enemies zijn niet plotseling unfair; spelsnelheid 3× is niet automatisch death.
2. **10–20 minuten**: wil je vijanden ontwijken? Vitality moet helpen bij herstel na een adempauze, **niet tijdens elk gevaar alles negatief maken**.
3. **Na 20 minuten**: minder brute Water Bolt-hold-back, maar nog steeds een sterke build; Zombie Mike blijft naderbaar. Let op echte melee en ranged druk.
4. **Bosses**: dezelfde favoriete ultieme fase-3 attacks, geen onverwachte nieuwe damage-spikes van deze hotfix; noemenswaardige warning + safe route blijft mogelijk.
5. **QA JSON**: hits, damage, HP-checkpoints, nieuwe healing/vitalityRegen/recoveryBlocked, levels, twee evoluties en echte bosskills. Een nieuwe Frost-run later is nodig voor buildvergelijking; geen algemene release-GO zonder open M3–M6.

**Acceptatie:** Normal mag uitdagend en fair voelen, ook met een sterke Water-build en één Vitality-level; 3× speed mag niet als automatische invincibility fungeren; echte survivalreacties moeten nut hebben.
