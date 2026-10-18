# SHADOW SURVIVOR — MIJLPAAL UPDATE 30
**Doel:** een volledig speelbare, uitdagende, begrijpelijke en prettig aanvoelende 25–30 minuten Standard-run. De graphics hoeven nog geen definitieve releasekwaliteit te hebben; alle essentiële systemen moeten wel betrouwbaar zijn.

**Laatste afgeronde update:** 17 — Enemy Attacks & Telegraph Overhaul: nauwkeurige corridors, schietbanen en aftellende gevarenzones.
**Volgende update:** 18 — Encounter director: ritme, spanning en rustige momenten.
**Planningvoortgang:** **7 / 20 afgerond = 35%**. Dit is een planningsteller, niet een inschatting van grafische/gameplaykwaliteit.
**Meetregel:** na elke afgeronde update wordt deze tracker bijgewerkt; zowel `afgeronde updates / 20` als de inhoudelijke kwaliteitschecks worden gerapporteerd. Update-nummer is geen kwaliteitspercentage.
**Scope:** Updates 11 t/m 30. Later mag een update worden opgesplitst wanneer echte speeltests dat nodig maken.

## Concrete checks voor de mijlpaal
- [ ] Complete Standard-run: Beau → Mourning Shade → Bell Tower → The Last Meme, zonder herhalingsbug
- [ ] Twee evoluties zijn in een realistische Normal-run haalbaar (tijd: 10 en 17 min; geen gratis unlocks)
- [x] De grootste regressietestproblemen zijn opgelost; nieuwe features krijgen automatische tests
- [ ] Vijanden spawnen buiten beeld; te lange weapon range en oneerlijke hits zijn aangepakt
- [ ] Kleine en herkenbare squads blijven ook na minuut 15 spannender dan spam
- [ ] Normal geeft een uitdagende maar leerbare 25–30 minuten ervaring
- [ ] Minimaal één echt gepolijste set enemy-/weapon-animaties als visuele kwaliteitslat
- [ ] Movement, dash, hitfeedback, aanvalstelegrafie en geluid voelen consistent aan
- [ ] Boss fights blijven geïsoleerd, met leerbare en bijzondere aanvallen
- [ ] Drie gerapporteerde volledige runs en verwerking van feedback voor de milestone

## Update-tracker
| Update | Wat maken we beter? | Status |
|---|---|---|
| 11 | Testfundament en bestaande fouten opschonen | AFGEROND · 266/266 tests |
| 12 | Movement & dash: gevoel, responsiviteit, input | AFGEROND · 276/276 tests |
| 13 | Hit feedback: impact, damage, animatie, geluid | AFGEROND · 287/287 tests |
| 14 | XP/evoluties: XP-model, keuzes en mijlpalen | AFGEROND · 299/299 tests · browser-run open |
| 15 | Kleine groepen: attack timing, focus & AI | AFGEROND · 311/311 tests · speeltest open |
| 16 | Unieke archetypes en 16-richtingen-schilden | AFGEROND · 323/323 tests · speeltest open |
| 17 | Enemy Attacks & Telegraph Overhaul | AFGEROND · 334/334 tests · speeltest open |
| 18 | Encounter director: ritme, spanning, rustige momenten | OPEN |
| 19 | Weapon feel: projectielen, range, precisie | OPEN |
| 20 | Weapon VFX: eerste visuele kwaliteitslat | OPEN |
| 21 | Wapens en evoluties: keuze, synergie, feedback | OPEN |
| 22 | Wapen- en vijandbalans: Normal/Easy/Nightmare | OPEN |
| 23 | Wereldterreinen: gevaren duidelijk en eerlijk | OPEN |
| 24 | Living World: terreinreacties en duidelijke consequenties | OPEN |
| 25 | Boss-flow: volgorde, arena-isolatie, beloningen | OPEN |
| 26 | Boss attacks: reactietijd en spectaculariteit | OPEN |
| 27 | UI/HUD: helderheid en leesbaarheid van combat | OPEN |
| 28 | Performance: FPS, memory en spawnstabiliteit | OPEN |
| 29 | Volledige Normal-run tests: polish en grootste issues | OPEN |
| 30 | MILESTONE: Combat & Gameplay 2.0 beoordelen | OPEN |

**Voortgangsvorm voor elke update:**
- **Update:** N / 30
- **Planning:** X / 20 afgerond (Y% van geplande updates)
- **Bewijs:** welke tests en/of speeltests ondersteunen het resultaat?
- **Nog niet klaar:** belangrijkste blocker of risico voor Update 30
- **Volgende stap:** één concreet doel

## Technische beginstand (18 oktober 2026)
De GitHub Actions-run voorafgaand aan Update 11 heeft **244 geslaagde tests en 22 falende tests**. Deze fouten zijn een echte openstaande kwaliteitsschuld; het cijfer is geen indicatie dat 22 gameplayfeatures kapot zijn. Een groot deel zijn oude testharnassen zonder browsercontext en verouderde catalogusverwachtingen.

Zie: https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39135144082

## Update 11 — afgerond (18 oktober 2026)
**Resultaat:** GitHub Actions ging van 244 tests geslaagd / 22 tests gefaald naar **266 geslaagd / 0 gefaald**. Belangrijkste oorzaken: ontbrekende browser-window in geïsoleerde Node-harnassen, fixtures voor boss/loadout, verouderde verwachtingen voor het uitgebreide 15-wapencatalogus en veranderde, daadwerkelijk bedoelde projectilepatronen.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39137427179

**Nog niet gevalideerd:** een complete 25–30-minutenbrowser-run, daadwerkelijke difficulty feel, late-game prestaties en visuele leesbaarheid. Een groene testsuite is geen vervanging voor speeltests.

**Volgende stap (Update 12):** dash, movement, responstijd en input-visuele feedback in één concrete gameplayverbetering. Voeg tests toe en laat na implementatie het nieuwe CI-resultaat zien.

## Update 12 — afgerond (18 oktober 2026)
**Resultaat:** het nieuwe `js/player-movement.js` geeft frame-rate-onafhankelijke acceleratie en snel stoppen, genormaliseerde diagonaalbeweging en een dash met beperkte stuurcorrectie. Dashbescherming duurt nu de volledige dash in plaats van 0,20 seconden bij 0,28 seconden beweging. Dash-ghosts en start-/landingsringen worden getekend afhankelijk van grafische kwaliteit, met vaste grenzen voor aantallen. Focusverlies wist de snelheidsbuffer.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39138001840 — **276 tests geslaagd, 0 gefaald**. Tien aanvullende tests toetsen onder meer snelheid, stoppen, framerates, dashrichting, geheugenlimieten, reset, render en game-integratie.

**Planningvoortgang:** **2 / 20 = 10%**. Niet verwarren met 10% van alle visuele/gameplaykwaliteit.

**Handmatige speeltest, nog open:** vergelijk lopen/diagonaal lopen, stopgedrag, Shift in een andere richting, ontwijken van een Boss-slam en zichtbaarheid van de ghost-trail op Low/High. Automatische tests bewijzen niet of movement al optimaal aanvoelt.

**Volgende stap (Update 13):** Hitfeedback verbeteren: hitflash, impact bij enemy-damage, onderscheid tussen kritieke en normale hits, camera feedback en duidelijkere geluiden.

## Update 13 — afgerond (18 oktober 2026)
**Resultaat:** nieuwe module `js/hit-feedback.js` geeft normale hits subtiele ringen, kritieke treffers een grotere goudkleurige indicator, zware hits een eigen effect, en kills/bosskills een duidelijke impact. Zware treffers geven alleen beperkt cameraschudden wanneer de vijand dichtbij en zichtbaar is. Bij veel projectielen zijn de effecten en audio gelimiteerd; Low Quality gebruikt minder visuele details. `js/audio.js` kent aparte, begrensde `crit`- en `impact`-geluiden. Schade, XP, knockback en bossvolgorde blijven ongewijzigd.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39138871742 — **287 automatische tests geslaagd, 0 gefaald** (11 nieuwe checks voor zichtbaarheid, audio, effecten, camerabeweging, throttling en integratie).

**Planningvoortgang:** **3 / 20 = 15%** van de geplande updates richting Update 30.

**Handmatige speeltest nog open:** vergelijk normale hit, kritieke hit, een zware aanval, een kill en bossdamage. Controleer leesbaarheid bij meerdere aanvallende vijanden, Low/High-kwaliteit en hoge attackspeed. Pas geluid/impact aan op basis van speelgevoel; tests bewijzen de visuele kwaliteit niet.

**Volgende stap (Update 14):** XP- en evolutiecurve over complete 25-minuten runs vergelijken, controleren dat twee evoluties realistisch haalbaar zijn zonder vijandenspam of gratis levels.

## Update 14 — afgerond (18 oktober 2026)
**Resultaat:** twee mogelijke evoluties per run, beschikbaar vanaf minuut 10 en 17 zodra beide upgradevoorwaarden én één gedode boss zijn verdiend. Klaarstaande evoluties worden automatisch aangeboden wanneer hun tijdmijlpaal is bereikt, ook zonder nieuwe XP-pickup. De drie level-upkeuzes bevatten waar mogelijk één relevante recipe-upgrade; een gegarandeerde unlock van een gekozen reservewapen blijft altijd behouden. Er worden geen gratis levels/evoluties toegekend. Het HUD toont evolutieteller, tijd en ontbrekende support-/wapenlevels.

**XP-balans:** vanaf minuut 10 maximaal +16% XP bij zware tactische patrouilles/waves en verdedigers; goedkope zwermvijanden blijven ongewijzigd. Waardevolle XP-orbs (waarde ≥6) trekken maximaal 95 pixels verder aan; ze moeten nog fysiek verzameld worden. Normale XP-drops en HP-pickups houden hun gewone afstand.

**Onderbouwing:** elf nieuwe tests + één regressietest bovenop eerdere controles, waaronder de echte evolutieregels, level-upkeuzes met twee willekeurige unlocks en een **vereenvoudigd 25-minuten-Normal-model** dat de bestaande vijandensamenstellingen, XP-waardes, fasen en levelcurve gebruikt. De gemodelleerde 'redelijk actieve run' is haalbaar met ten minste 15 gekozen upgrades zonder extra enemy spam. Een minder actieve run levert aantoonbaar minder XP op. Dit is een balansscenario, **geen gespeelde of gemeten volledige browser-run**, en biedt geen garantie voor elke speler.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39140141035 — **299 tests geslaagd, 0 gefaald**.

**Planningvoortgang:** **4 / 20 = 20%** van geplande updates richting Update 30.

**Handmatige speeltest nog open:** check op 10:00 of de eerste evolutie verschijnt na voldoen aan de voorwaarden, op 17:00 de tweede, de voortgang in de HUD en de XP-verwerving tussen 10–25 minuten. Controleer of jouw eigen speelniveau genoeg XP oplevert, zonder verhoogde achtergrondvijandendichtheid. Daarna eventueel XP per moeilijkheid nauwkeuriger balanceren.

**Volgende stap (Update 15):** verder met kleine vijandengroepen: synergieën, focus/prioriteit, aanvallen en betere telegraph-timing.

## Update 15 — afgerond (18 oktober 2026)
**Resultaat:** de bestaande tactische teams werken daadwerkelijk samen in hun beweging en reactietiming. Vanguard/Ward beweegt tussen speler en kwetsbare Ranged Shade of Binder in plaats van alleen recht op de speler af te lopen. Skirmishers nemen de actuele bewegingssnelheid mee in hun flankhoek en dreigen vanuit verschillende richtingen. Binder- en Crusher-terreinwaarschuwingen beginnen niet tegelijk, zodat zware crowd-control en slam nog te ontwijken zijn; de bestaande Binder→Pouncer en Crusher→Crossfire-combo's blijven bestaan.

**Counterplay:** dood je een Vanguard of Ward, dan verliest de groep onmiddellijk diens beschermingsbonus en ontvangt de rest **drie seconden +16% schade**. Een Pouncer kan daarna sneller een aanval voorbereiden, maar de waarschuwing blijft verplicht. Een gedode Binder kan geen toekomstige combo-dashes versterken. Een zichtbare schildbreuk toont `FORMATION BROKEN · OPENING 3s` maximaal eenmaal per groep en geeft de blootgestelde units een amberkleurige ring.

**Scope/risico:** geen nieuwe types, geen extra gespawnde vijanden, geen wijzigingen aan de hoeveelheid XP, geen extra boss-minions en geen aanvallen buiten beeld. Dit is nog geen menselijke speelbalanstest. Developer Mode heeft al `SPAWN TOUGH PATROL` om de groep te testen.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39140683981 — **311/311 tests geslaagd**. Twaalf nieuwe tests toetsen schildinterceptie, flankvoorspelling, telegrafie, schadevenster, beperkte meldingen, teamgrenzen, offscreen/boss-uitzonderingen en daadwerkelijke integratie.

**Planningvoortgang:** **5 / 20 = 25%** naar Combat & Gameplay 2.0 bij Update 30.

**Handmatige speeltest nog open:** in Developer Mode een patrouille oproepen; eerst de Vanguard/Ward uitschakelen en controleren of de rest drie seconden merkbaar kwetsbaarder wordt; Runner-flanken vergelijken bij stilstand versus bewegen; check of Binder en Crusher niet tegelijk onvermijdelijke cirkels uitvoeren. Gevoel, zichtbaarheid en balans kunnen na echte speeltest worden bijgesteld.

**Volgende stap (Update 16):** uitgesproken unieke vijandtypes met herkenbare sterkten/zwakten en aanvallen die duidelijk verschillen per rol.

## Update 16 — afgerond (18 oktober 2026)
**Resultaat:** de nieuwe `js/enemy-archetypes.js` geeft bestaande vijandtypes herkenbare specifieke rollen en zwaktes, zonder nieuwe vijandenspawns. Runners krijgen af en toe een tijdelijke laterale feint, Zombie Mike een duidelijk aangekondigde grondslag (uitsluitend buiten de al bestaande Crusher-tactiek), Drifters zijn kwetsbaarder voor Pulse, Runners voor Frost, Zombie Mike voor Bomb, Ranged Shades voor schade van dichtbij en Burstlings voor Lightning. Deze verschillen zijn toegevoegd aan de ingame vijandenencyclopedie. Ranged Shade blijft zijn afstandsaanvallen gebruiken, Burstling zijn explosiewaarschuwing en Bulwark zijn bestaande shield-fases.

**Schildfix:** Bulwark-schilden volgen de **positie van de speler met 16 discrete richtingen (22,5° per richting)** in plaats van een vaste oriëntatie. De getekende boog aan de voorkant komt nu overeen met de daadwerkelijke schadebescherming: `×0.55` vanaf de voorkant terwijl het schild actief is, `×1.15` vanaf de zijkant/achterkant, `×1` als het schild uit staat. De visuele bogen van tactische guards en wereldverdedigers gebruiken dezelfde richting. Het schild wordt niet bepaald door de looprichting van de vijand.

**Veiligheid en scope:** geen extra vijanden; geen verborgen gebiedsaanvallen buiten beeld; extra grondslag gebruikt dezelfde dodge-/invulnerabilitychecks als bestaande tactische attacks. Bosses en summons krijgen geen nieuwe archetypevaardigheden. Bestaande testgevallen blijven behouden.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39142021538 — **323/323 automatische tests geslaagd**, inclusief 12 nieuwe tests voor alle 16 richtingen, richtingsafhankelijke shield damage, unieke zwaktes, telegraph-dodges, boss-isolatie en in-game integratie.

**Planningvoortgang:** **6 / 20 = 30%** van de updates naar mijlpaal 30. Niet het percentage totale gameplay-/visualkwaliteit.

**Handmatige speeltest nog open:** loop rondom een Bulwark of verdediger en kijk of het schild richting jou roteert; probeer projectielen uit verschillende richtingen; test Zombie Mike's grondslag en Runner-feint en vergelijk de ingame encyclopedie. Met volledige browserruns evalueren we vervolgens hoe fair de abilities in echte encounters aanvoelen.

**Volgende stap (Update 17):** nog betere leesbaarheid van vijandelijke aanvalstelegrafie en combinaties, zodat uitdaging niet afhankelijk is van verrassingsschade.

## Update 17 — afgerond (18 oktober 2026)
**Resultaat:** vijandelijke gevaren worden vóór hun uitvoering nauwkeuriger aangegeven, met een zichtbare aftelling. Pouncers tonen nu de **volledige breedte van hun dash-corridor** (lichaamsradius + spelersradius + marge) en een conservatieve, gebonden chargelengte in plaats van een misleidende dunne lijn. De chargehoek ligt vanaf het begin van de waarschuwing vast. Crusher en Binder hebben voortaan helder gemarkeerde cirkels die naar het exacte impactmoment vollopen. Zombie Mike's stomp en de Burstling-explosie tonen een extra voortgangsring en optioneel randmarkeringen. Zelfs op Low graphics blijven de hoofdcontouren zichtbaar.

**Crossfire:** de Ranged Shade toont nu vooraf **de centrumschotlijn plus de vier tactische fanbanen**, en een radiale tijdindicator. De extra schietrichtingen worden vastgelegd zodra de 0,7s waarschuwing begint. Een Crusher die pas tijdens die waarschuwing start/stopt, kan de fan daarom niet onverwacht veranderen. Wanneer de vijand de attack range verlaat worden de geplande richtingen gewist; er schiet dan niets alsnog buiten beeld.

**Fairness en performance:** waarschuwingen 0,68s Pouncer, 0,85s Binder, 0,95s Crusher; geen nieuw type, nieuwe vijanden of projectielspam. De bestaande limieten op projectielen en encounters blijven van kracht. Boss-aanvallen en XP blijven ongewijzigd. Nieuwe visuals zijn Canvas-paden binnen de bestaande renderingloop, geen extra object-/particlespawns.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39143053126 — **334 tests geslaagd, 0 gefaald**, waaronder 11 nieuwe regressietests voor chargewidth, echte bewegingsrichting, waarschuwingen op Low/High, Crossfire-windups, vergrendelde aanvalshoeken, projectile-caps en boss-/spawngrenzen.

**Planningvoortgang:** **7 / 20 = 35%** van geplande updates naar Combat & Gameplay 2.0, **niet** een kwaliteitsscore.

**Handmatig nog te testen:** via F9 een Tough Patrol oproepen. Ontwijk de aangewezen Pouncer-corridor, controleer of de doelen van Crossfire daadwerkelijk overeenkomen met de vooraf getoonde richtingen en of Crusher, Binder, Burstling en Zombie Mike genoeg reactietijd geven bij 1x én 2x/3x snelheid. Controleer Low en High graphics in een drukke late-game groep. Nog geen volledige browsertest uitgevoerd.

**Volgende stap (Update 18):** Encounter Director: gecontroleerde opbouw van spanning, variatie in combinaties, rustige momenten en minder onderlinge overlap zonder enemy spam.
