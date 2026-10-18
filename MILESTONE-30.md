# SHADOW SURVIVOR — MIJLPAAL UPDATE 30

> **Overdracht naar een nieuwe chat:** lees ook [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md) voor onze creatieve visie, expliciete afspraken, huidige elementloadouts, workflow en de AI-overdracht. Werk dit kompas samen met de milestone-tracker bij na elke nieuwe update.

**Doel:** een volledig speelbare, uitdagende, begrijpelijke en prettig aanvoelende 25–30 minuten Standard-run. De graphics hoeven nog geen definitieve releasekwaliteit te hebben; alle essentiële systemen moeten wel betrouwbaar zijn.

**Laatste afgeronde update:** 29 — Normal Campaign QA Replay: echte bosskill/evolutie-/Victory-/Endless-functies, herstel van wereld-eindscherm en bescherming tegen same-tick Victory-overwrite.
**Volgende update:** 30 — Milestone review: Combat & Gameplay 2.0, releasecriteria en open browser-QA.
**Planningvoortgang:** **19 / 20 afgerond = 95%**. Dit is een planningsteller, niet een inschatting van grafische/gameplaykwaliteit.
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
| 18 | Encounter Director 3.0: één groot gevecht tegelijk en herstelpauzes | AFGEROND · 347/347 tests · speeltest open |
| 19 | Weapon Feel: voorspellend richten en betrouwbare treffers | AFGEROND · 365/365 tests na correctie · speeltest open |
| 20 | Weapon VFX: eerste visuele kwaliteitslat | AFGEROND · 372/372 tests · browser-visual review open |
| 21 | Wapens en evoluties: keuze, synergie, feedback | AFGEROND · 381/381 tests · gecombineerde browser-speeltest open |
| 22 | Wapen- en vijandbalans: Normal/Easy/Nightmare | AFGEROND · 391/391 tests · echte difficulty/play-feeltest open |
| 23 | Wereldterreinen: gevaren duidelijk en eerlijk | AFGEROND · 402/402 tests · browser-telegraphs/feeltest open |
| 24 | Living World: terreinreacties en duidelijke consequenties | AFGEROND · 412/412 tests · browserflow/playtest open |
| 25 | Boss-flow: volgorde, arena-isolatie, beloningen | AFGEROND · 422/422 tests · volledige bossrun in browser open |
| 26 | Boss attacks: reactietijd en spectaculariteit | AFGEROND · 432/432 tests · handmatige spectaculaire bossplaytest open |
| 27 | UI/HUD: helderheid en leesbaarheid van combat | AFGEROND · 441/441 tests · visuele browsertest open |
| 28 | Performance: FPS, memory en spawnstabiliteit | AFGEROND · 451/451 tests · browser-FPS meting nog open |
| 29 | Volledige Normal-run tests: polish en grootste issues | AFGEROND · 462/462 geautomatiseerde checks · handmatige 25–30-min browserrun OPEN |
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

## Update 18 — afgerond (18 oktober 2026)
**Resultaat:** nieuwe `js/encounter-rhythm.js` deelt de automatisch geplande confrontaties op in **ready → engaged → recover**, met een gedeeld budget voor patrols, special waves en automatische wereldverdediging. Zodra een groep (bij een gewone groep) tot maximaal één overlevende is teruggebracht, begint een herstelperiode van **11 tot 17 seconden** afhankelijk van de voortgang; bij een grote swarm begint herstel wanneer hoogstens drie overblijven. Tijdens gevechten en herstel mogen hoogstens twee ambient vijanden tegelijk bestaan. Nieuwe automatische teams worden pas gepland zodra de herstelperiode is verlopen en de bestaande density-limieten het toestaan. Spawnbronnen rouleren hun tactische variant op basis van de totale encountervolgorde, niet alleen hun eigen teller.

**Bosses:** tijdens boss fights wordt de nieuwe director gepauzeerd en het actieve groepsgevecht gewist. Na de boss geldt een nieuwe herstelperiode van 12 seconden; achterstallige waves worden niet met terugwerkende kracht gespawned. Developer Mode kan nog steeds expliciet patrouilles en verdedigers oproepen.

**XP-behoud:** automatisch gestarte zware patrols, waves en defense squads geven **18–38% extra XP per kill** ten opzichte van hun bestaande `xpValueMultiplier`, oplopend met runvoortgang. Zwermen krijgen die premie niet. Dit compenseert een deel van de lagere frequentie van grote gevechten, zonder meer vijanden of gratis levels. De speler moet de vijanden nog verslaan en XP-orbs verzamelen.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39144440436 — **347 tests geslaagd, 0 gefaald**, waaronder 13 nieuwe checks voor shared pacing, herstelduur, swarm-opruiming, boss-pauze, ambientcap, afwisselende plannen, reset, XP-bonus, handmatige versus automatische spawns en echte integratie.

**Planningvoortgang:** **8 / 20 = 40%** van de geplande updates naar Combat & Gameplay 2.0. Geen gemeten kwaliteitspercentage.

**Handmatige speeltest nog open:** test 10–20 minuten Normal en check of tussen moeilijke groepen ongeveer 11–17 seconden ruimte ontstaat om XP te verzamelen, of er nog genoeg uitdaging blijft, of wereldverdedigers geen tegenaanval tegelijk met een wave beginnen, en of twee evoluties qua verdiende upgrades nog haalbaar blijven. De automatische tests bevestigen scheduling maar geen subjectief speelgevoel of echte gemiddelde XP per run.

**Volgende stap (Update 19):** Weapon Feel Overhaul: targeting, duidelijkheid van projectielen, eerlijke range en stabiele precisie voor de verschillende wapenrollen.

## Update 19 — afgerond (18 oktober 2026)
**Resultaat:** nieuwe pure controller `js/weapon-aim.js` ondersteunt deterministische selectie van zichtbaar bereikbare doelen, per projectiel begrensde bewegingsvoorspelling en segment-vs-cirkel-botsing zodat snelle shots kleine vijanden niet overslaan bij schommelende framerates. `Arcane Bolt` verdeelt maximaal zeven projectielen over gevaarlijke en nabije vijanden zonder willekeurige bijstanders. `Fireball`, `Water Bolt`, `Ice Shards` en uitgaande `Boomerangs` gebruiken de voorspelling, gebaseerd op daadwerkelijk gemeten vijandbeweging en begrensd op korte horizons. `Frost Orb` blijft een homing-controlwapen en behoudt splash/slow; Chain Lightning blijft instant-hit, andere rollen behouden hun identiteit.

**Scope:** geen aanpassingen aan boss-aanvallen, wave-planning, xp, health/damage van vijanden of het aantal wapens, projectielen en upgrades. Het bestaande maximaal zichtbare attackbereik blijft gehandhaafd. Uit prestatieoverwegingen wordt alleen een beperkte lijst zichtbare vijanden gerangschikt en zijn beweging/voorspelling gecapt.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39145332475 — **358 tests geslaagd, 0 gefaald**, waaronder 11 nieuwe tests voor threat-targeting, zichtbaarheid, missile-verdeling, zijwaartse voorspellende hoeken, snelheidslimieten, swept hit-testing en integratie met vijf wapenrollen.

**Planningvoortgang:** **9 / 20 = 45%** van de geplande updates richting Update 30. Dit is niet het kwaliteitspercentage van alle graphics/gameplay.

**Handmatige speeltest open:** speel met Arcane, Frost Orb en Boomerang, vergelijk runners die zijwaarts bewegen en vijanden in een groep. Controleer of snelle shots op lagere kwaliteit/framerate minder missen zonder onnatuurlijk bij te sturen. Speel ook tegen een boss voor targetingprioriteit. Het gevoel en daadwerkelijke accuracy zijn niet met een volledige browser-run gemeten.

**Volgende stap (Update 20):** eerste echte Weapon VFX-kwaliteitslat: unieke impact-/shotanimaties voor ten minste een kernset wapens, met duidelijk onderscheid tussen lezen van gevaar en cosmetische effecten.

## Update 19 — correctie na feedback (18 oktober 2026)
**Gebruikersfeedback:** Arcane Bolt en Boomerang zijn sinds de Living World-elementenupdate niet meer kiesbaar in Standard/Endless-loadouts. De normale run biedt precies 3 vuurwapens (`flame`, `fireball`, `flameOrbit`), 3 waterwapens (`waterBolt`, `tidalWave`, `whirlpool`) of 3 ijswapens (`frost`, `iceShards`, `glacialPulse`). De oude Arcane/Boomerang-code is nog aanwezig voor historische code/tests, maar niet in het huidige keuzemenu. De eerder gerapporteerde focus van Update 19 op die wapens was onterecht.

**Gerichte reparatie:** `js/elemental-combat.js` gebruikt voor *selecteerbare* Fireball, Water Bolt en Ice Shards de verbeterde doelprioriteit én de al aanwezige begrensde bewegingsvoorspelling. Elementaire projectielen controleren bovendien hun afgelegde lijnsegment op botsingen, inclusief bij snelle Water Bolt, zonder meer schade of projectielen toe te voegen. Tidal Wave/Whirlpool blijven bewust bij hun nabijheidsgerichte area-aim en Frost Orb blijft homing. De andere zes selecteerbare wapens behouden hun verschillende rollen en mechanieken.

**Bewijs:** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39145958214 — **365 tests geslaagd, 0 gefaald**, inclusief 7 nieuwe regressietests die de echte negen kiesbare wapens, actuele elementgerichte targeting, het verschil tussen projectiel- en gebiedsgericht mikken en snelle Water Bolt-collisies controleren.

**Voortgang:** Update 19 blijft **1 update**, dus **9/20 = 45%** richting de Update 30-mijlpaal. De correctie is geen kunstmatige extra stap. Voor toekomstige gameplayverbeteringen altijd éérst controleren of het aangepakte wapen daadwerkelijk via de huidige element-loadout gekozen kan worden.


## Update 20 — afgerond (18 oktober 2026)
**Doel:** een merkbare visuele kwaliteitsstap voor de **negen werkelijk selecteerbare** Fire-, Water- en Frost-wapens, zonder schade, gamebalans, botsingen, bosswaarschuwingen of vijandendichtheid te veranderen.

**Resultaat:** nieuwe cosmetische module js/weapon-vfx.js, geladen na js/elemental-combat.js en getekend in js/render.js bovenop de bestaande wapenafbeelding. Alle negen actieve families krijgen onderscheidende extra Canvas-effecten:
- **Fire:** Flame Cone krijgt bewegende vuurstrengen, Fireball een meerlagige hete komeetstaart en explosiespaken, Flame Orbit gloeiende ringen en bewegende vonksporen.
- **Water:** Water Bolt een dunne drukstraal met parallelle stroming en druppels, Tidal Wave schuimende bewegende kammen, Whirlpool roterende zuigspiralen.
- **Frost:** Frost Orb kristal-/sneeuwvlokaccenten en een spoor, Ice Shards doorschijnende kristal-afterimages, Glacial Pulse een zesarmige ijzige schokgolf.
- Beperkte impactringen worden via window.emitWeaponVfxImpact getriggerd bij huidige elementaire treffers en Frost Orb. Deze zijn puur visueel; de bestaande damage-logica blijft leidend.
- VFX blijven deterministisch, negeren objecten buiten beeld, beperken objectaantallen per render-pass en schalen detail voor Low/Medium/High graphics. Canvas state wordt per effect hersteld. De module verandert geen gameplay objecten.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39148015522 — **372/372 tests geslaagd, 0 gefaald** inclusief **7 nieuwe VFX-regressietests**. Syntaxchecks ook geslaagd. De nieuwe tests controleren de negen actieve wapens, de daadwerkelijke wiring, variatie in tekenprimitieven, geen gameplay-mutatie, viewport-culling, detailverschil Low/High, maximale impact-/projectielvolumes, en reset/expiry.

**Planning:** **10 / 20 = 50%** van geplande updates richting de Update 30-mijlpaal. Dit percentage zegt niets over hoeveel visuele perfectie of definitieve releasekwaliteit al bereikt is.

**Handmatige speeltest staat nog open:** bekijk **elk element** in de browser, met startwapen én twee ontgrendelde wapens; vergelijk Low/Medium/High, 1×/2×/3×, eindeloze en dichte encounters en bossfights. Controleer of trajecten en impacts zichtbaar zijn zonder gevaarstelegraphs of vijanden te verbergen, of FPS niet inzakt en of verschillen visueel overtuigen. De CI-bewijzen zijn geen visuele browsertest. Pas de VFX na gebruikersfeedback gericht aan.

**Nog open voor mijlpaal 30:** complete 25–30 minuten Standard-run, werkelijk verdiende twee evoluties, bossvolgorde en spectaculaire signature-aanvallen in de browser, moeilijkheidsbalans, meetbare late-run FPS en meerdere volledige runs.

**Volgende stap (Update 21):** alleen **actuele** Fire-, Water- en Frost-loadouts en hun evolutions beoordelen op keuzegevoel, onderlinge synergie, progression en duidelijke upgradefeedback; oude Arcane/Boomerang-code niet als speelbaar beschouwen.


## Update 21 — afgerond (18 oktober 2026)
**Doel:** de negen selecteerbare elementwapens daadwerkelijk laten samenwerken en de route naar twee verdiende evoluties begrijpelijk maken, zonder extra wapens, gratis evoluties, vijandenspam of brede balanswijzigingen.

**Resultaat:**
- Nieuwe compacte module js/elemental-synergy.js met **echte cross-weapon combo's**: **IGNITION** (Fire), **UNDERTOW** (Water), **SHATTER** (Frost). Alleen hits van twee *verschillende* wapens binnen hetzelfde element mogen zo'n bonus activeren. Het eerste wapen zet de markering; een ander wapen kan hem binnen 3 seconden benutten.
- De bonus is bewust klein en begrensd: Fire +14% tot maximaal +12 damage tegen gewone vijanden en +0,35 sec brandtijd; Water +10% tot maximaal +12 en een bescheiden extra knockback; Frost +16% tot maximaal +12 en +0,35 sec chill. **Op een boss is de damagebonus per activatie maximaal +4**. Per vijand geldt **1,25 game-seconden cooldown**. Geen gratis schade-ticks, geen stapelbare permanente versterkingen.
- Geïntegreerd in echte aanvallen: Flame Cone en Flame Orbit/Fireball, Water Bolt/Tidal Wave/Whirlpool, Frost Orb/Ice Shards/Glacial Pulse. Ook de Frost Orb-AoE zet het juiste elementmerk zodat vervolgwapens kunnen combineren.
- Wanneer een combo afgaat verschijnt kort de naam bij het doel (kleur per element, maximaal 1 callout per 0,65 game-seconden over het hele scherm). Bij een nieuwe run wordt de callout-timer gewist. De VFX-impact blijft subtiel extra zichtbaar.
- De **level-upkeuzes** tonen nu op de echte wapen-/supportkaarten een concrete evolution-route: hoeveel weapon levels en support levels je al hebt, welke boss- en tijdmijlpaal ontbreekt en welk eindwapen je kunt verdienen. Voor elementwapens tonen kaarten hun **werkelijke huidige combo-partners** of leggen uit dat een tweede wapen nodig is.
- De keuzeweging geeft een bescheiden voorkeur aan **supports die daadwerkelijk passen bij een vrijgespeeld elementwapen en bijna een evolutie opleveren**, in plaats van de oude, onmogelijke Fire+Frost-cross-element bonus. De HUD volgt een dichtstbijzijnde **ontgrendelde** evolutieroute en kan 'BOSS NEEDED' tonen.
- De bestaande evolutievoorwaarden blijven intact: weapon level 5, echte support level 3, een verslagen boss en mijlpalen op 10 en 17 minuten; max. twee Standard-evoluties. Een combo is **geen evolutie of gratis upgrade**.
- De scripts en JS-cacheversies zijn bijgewerkt in index.html. Nieuwe integratie- en regressietests: tests/update-21-elemental-synergy.test.cjs plus aanpassing van één oude regelassertie in tests/encounter-visibility.test.cjs.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39149296644 — **381/381 tests geslaagd, 0 gefaald**; JavaScript-syntaxchecks groen. De nieuwe tests controleren alle negen actieve wapenidentiteiten, activatie en cooldown, geen same-weapon of cross-element exploit, duur van marks, boss-damagecap, Water/Frost-effecten, echte elemental-combat integratie, evolution-upgradehints, focus/HUD, scriptvolgorde en zichtbare, begrensde combo-callouts.

**Planningvoortgang:** **11/20 = 55%** van de geplande updates richting Update 30. Dit is geen percentage gameplay- of visuele perfectie.

**Browser-speeltest nog open:** start elk van Fire/Water/Frost; ontgrendel het tweede elementwapen; laat twee **verschillende** wapens kort achter elkaar hetzelfde doel raken; controleer of Ignition/Undertow/Shatter verschijnen zonder tekstspam en of het verschil subtiel genoeg is. Bekijk upgrade-menu en supportkaarten voor evolution-progress; speel door minuut 10 en 17 met werkelijk verdiende requirements. Ook vergelijking Normal/Easy/Nightmare en boss-schade moeten in de browser nog bevestigd worden. Node/CI bewijst geen prettig spelgevoel.

**Open voor mijlpaal 30:** complete Standard 25–30-minuten-run, twee echt verdiende evoluties, bewezen bossvolgorde en isolatie, eerlijke late-game balans, performance en meerdere volledige browserruns.

**Volgende stap (Update 22):** gerichte balansanalyse en aanpassingen van de negen actieve elementwapens en vijanddruk in **Normal/Easy/Nightmare**. Meet werkelijk speelgevoel en damage, voorkom nieuwe spam en let op de beperkte extra combo-bonussen uit Update 21.


## Update 22 — afgerond (18 oktober 2026)
**Doel:** Easy, Normal en Nightmare anders laten aanvoelen, zonder Nightmare als vijandenspam of overmatige HP-sponsen vorm te geven. Focus ligt op de echte Fire/Water/Frost-builds, leesbare telegraphs en kleine gevaarlijke teams.

**Gewijzigd in de speelbare code:**
- Nieuwe module `js/combat-difficulty.js` levert overzichtelijke, begrensde moeilijkheidsinstellingen. **Normal** is de exacte baseline voor de bestaande squadstatistieken en ranged/shield/bursttimings.
- **Easy:** tactische squads krijgen een kleine extra HP-/damage-/speedverlaging naast de bestaande Easy-profielwaarden. Ranged Shots waarschuwen langer (0,90 s), vuren rustiger en Burstlings geven 1,16 s reactietijd. Een Bulwark laat de verdediging relatief langer openstaan.
- **Nightmare:** de bestaande algemene vijand-HP-vermenigvuldiger ging van 1,28 naar **1,16**; boss-HP van 1,20 naar **1,16**. Tactische squads worden iets sterker/sneller (HP ×1,04, schade ×1,065, snelheid ×1,04), maar hun skillwaarschuwingen blijven eerlijk: ranged 0,64 s en burst 0,86 s, met kortere aanvalscooldowns. De normale enemyDamage-waarde blijft ×1,18 en Normal blijft ×1. De bossvolgorde en boss-isolatie blijven hetzelfde.
- **Geen extra Nightmare-spam:** `js/encounter-pacing.js` gebruikt voor Nightmare dezelfde normale population cap (20 begin, max 26 later), dezelfde ambient limiet en dezelfde ambient spawninterval als Normal. Easy houdt de lagere cap en langere interval. Tactische groepen worden niet groter: de moeilijkheid komt uit bedreiging en timing.
- De moeilijkheidsmodificaties worden bij **patrols, geplande waves en Living World-verdedigingssquads** één keer toegepast; niet op bosses of hun zelfgespawnde minions. Echte drop-/XP-/evolutieregels blijven ongewijzigd.
- Twee bescheiden **wapen-vs-boss** correcties: Flame Orbit doet ×0,82 contactscha­de **alleen tegen een boss** (gewone vijanden onveranderd), en een Frost Orb/ander frost slow vertraagt de boss tot ×0,78 bewegingssnelheid in plaats van ×0,48. Gewone vijanden blijven met Frost ×0,48 vertraagd. Deze correcties beschermen Guardian-movement en het nut van meerdere buildkeuzes, niet als definitieve eindbalans zonder playtest.
- De nieuwe module is vóór enemy/game/elemental code opgenomen in `index.html`. Bestaande tests zijn aangepast waar ze nog de oude 1,28 Nightmare-HP of 1,18 spawnRate verwachtten.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39150233474 — **391 geslaagde tests, 0 fouten** en JS-syntax groen. Tien nieuwe Update 22-tests controleren profielen en telegraphgrenzen, echte patrolstats voor alle drie moeilijkheden, gegarandeerd gelijke Nightmare/Normal vijandlimieten, boss-/summon-uitzonderingen, idempotent toepassen, Frost/FlameOrbit boss-guardrails, en integratie van wave/defense/game/HTML. De eerdere 381 regressietests blijven groen.

**Planningvoortgang:** **12 / 20 = 60%** van de geplande updates richting mijlpaal Update 30. Dit betekent niet dat de game al 60% visueel/gameplay-af is.

**Nog open — handmatige browser-speeltest:** speel minimaal de eerste 8 minuten van elk niveau met vergelijkbare starter/upgrade-route: blijft Easy toegankelijk, Normal uitdagend, Nightmare spannend maar fair? Vergelijk echte HP/time-to-kill, boss-movement onder Frost, Flame Orbit dichtbij de boss en of ranged/burstwaarschuwingen op Nightmare werkelijk te ontwijken zijn. Kijk ook naar de voorjaars-/late-game pacing en de twee volledig verdiende evoluties. Geautomatiseerde tests bewijzen de verhoudingen, niet het daadwerkelijke spelgevoel.

**Volgende update (23):** terreingevaren eerlijk en leesbaar maken (bijv. waarschuwing, impactzone, reactietijd en visueel onderscheid) zonder World-/Living World-consequenties af te zwakken. De omvangrijke cosmetische VFX-polish blijft voor een latere fase: de maker wil nu vooral dat de effecten bestaan.


## Update 23 — afgerond (18 oktober 2026)
**Doel:** bestaande Living World-terreingevaren duidelijk en eerlijk maken zonder de 18 huidige elementreacties, veroveringsdrempels of boss-isolatie te veranderen. De gebruiker wil de effecten voorlopig functioneel/aanwezig hebben; uitgebreide eind-VFX-polish komt later.

**Resultaat:**
- In `js/world-retaliation.js` gebruikt iedere reaction-zone nu een leesbare toestand: **forming → active** voor doorlopende zones, en bij grote bursts steeds opnieuw **active → recovering → charging → active**.
- **Herhaalde uitbarstingen krijgen nu telkens een eigen 0,95 seconde oplaadwaarschuwing** vóór de nieuwe schadepuls. Previously werd alleen het ontstaan van de permanente scheur gewaarschuwd; latere eruptions begonnen abrupt.
- De oplaadfase gebruikt een naar binnen krimpende waarschuwingsring; actief gevaar toont een stevige rand en een duidelijke centrumring, en een rustende burst toont een **gedimde, gestippelde veilige rand**. De cirkel geeft de daadwerkelijke hitzone aan. Belangrijk: **dit blijft op Low graphics zichtbaar**, niet alleen High.
- De eerste waarschuwing blijft 2,2 / 2,6 / 3,1 seconden voor de drie progressiefasen. De werkelijke uitbarstingsduur (1,05 seconden) en cyclus (3,8 seconden) zijn behouden; de extra telegraph valt in de al bestaande veilige tussenfase, zodat damagefrequentie niet stiekem stijgt.
- De permanente zones worden zonder overlap geplaatst: het algoritme zoekt zo nodig verder naar een vrije plek in steeds grotere ringen, in plaats van na acht mislukte pogingen alsnog op een bestaande hazard te spawnen. **Maximaal alle 24 fasezones** kunnen nog verschijnen en blijven permanent binnen de run. Nieuwe zones ontstaan niet midden op de speler.
- `js/render.js` geeft het zichtbare speelveld mee, zodat offscreen rifts geen extra Canvas-effecten kosten. De hazard-status meldt nu ook **warningPhase**, **secondsUntilChange** en **currentlyDangerous** voor QA/developer-inspectie.
- **Boss-isolatie blijft exact zoals bedoeld**: de reactieklok pauzeert zolang een boss aanwezig is; rifts verdwijnen niet en slaan geen waarschuwingsfase over bij terugkeer.
- Gewone wapensporen blijven visueel; de enige hazarddamage blijft uit de expliciete Live World-reaction-zones. Er zijn geen willekeurige onzichtbare terrein-damage-ticks toegevoegd.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39151060369 — **402/402 automatische tests geslaagd**, 0 gefaald en JS-syntax groen. **11 nieuwe tests** valideren alle 18 reacties, de eerste warnings, herhaalde recovery/charge/eruption, damage pas bij activatie, actieve permanente zones, Low-graphics zichtbaarheid, gestippelde rustende zones, offscreen-culling, bosspause, render/game-wiring en volledige plaatsing van 24 niet-overlappende zones.

**Planning:** **13/20 = 65%** van de geplande updates richting Update 30. Dit is geen percentage definitieve game-/visuele kwaliteit.

**Nog te testen in de browser:** alle drie elementwereldtypes en ten minste één combinatie op 15%, 50% en 85% invasie. Controleer of de krimpende ring in de praktijk vóór een uitbarsting duidelijk genoeg is (ook bij 2×/3× speed en Low quality), of de gestippelde veilige fase intuïtief is, of de zonegrenzen niet door effecten overschaduwd worden en of navigeren tussen meerdere permanente rifts mogelijk blijft. Test dat bosses niet tegelijk met reaction hazards spelers beschadigen. Een groene CI is geen vervanging voor de speeltest.

**Volgende stap (Update 24):** maak de **Living World-terreinreacties en hun gevolgen** nog duidelijker merkbaar in het spel. Richt je op gameplaytelemetrie, reacties op de gekozen invasie versus verdedigde wereld, consequenties na bosswins en run-eindresultaten, niet op grafische eindpolish of nieuwe vijandenspam.


## Update 24 — afgerond (18 oktober 2026)
**Doel:** na de eerlijke hazardwaarschuwingen in Update 23 ook de *gevolgen van de invasie* herkenbaar maken voor de speler, zonder verovering te versnellen, extra hordes te maken of blijvende werelden voortijdig te overschrijven.

**Nieuw in de speelbare game:**
- Nieuwe module `js/world-consequences.js`: aparte, kleine laag bovenop de bestaande `js/world-state.js` (de bron van waarheid over verovering), `js/world-retaliation.js` en `js/world-defense.js`. De module schrijft **niet** zelf naar permanent geheugen en creëert geen vijanden, gratis XP of schade.
- **Zes geordende invader/defender-elementparen**, ieder met drie eigen, leesbare frontnamen voor de **15%, 50%, 85% boss-mijlpalen**: bijv. Burning versus Frozen = Icebound Frontier → The Thawing Line → The Last Winter. Water/Frost/Burning zijn wederzijds *niet* uitwisselbaar. De **18 bestaande echte wereldreacties blijven onveranderd**.
- Een nieuwe, compacte `#worldFront` HUD toont de **verdedigde wereld versus invasiewereld**, bereikt percentage, huidige frontnaam, terrein onder de speler, aantal rifts en actieve verdedigingsteams. De tekst wordt hoogstens eenmaal per 0,4 game-seconden opnieuw opgebouwd en overschaduwt geen boss-waarschuwingen. `styles.css` geeft dit blok een eigen visuele identiteit.
- **Consequentie op de grond:** in echt door de invader veroverde terreinpatches raken gewone *oorspronkelijke verdedigers* klein beetje uit balans, met **×0,94 / ×0,91 / ×0,88 beweging** bij respectievelijk 15% / 50% / 85% verovering. Op hun eigen terrein behouden ze al bestaande native world-affinityvoordelen. **Bosses, summons, dode vijanden, andere affiniteiten, identieke home/invaderwerelden en herstelde runs zijn uitgesloten.** Geen extra damage per tik, geen spreiding van vijanden en geen algemene enemy-nerf buiten veroverde patches.
- Na ieder echt verslagen ordinary boss verschijnt, bovenop bestaande 'WORLD BARRIER SHATTERED', één nieuwe **THE WORLD FIGHTS BACK**-melding met de juiste naam van het front en de identiteit van de verdedigers. Melding wordt per wereldfase gededupliceerd en bij een nieuwe run gereset. De bestaande earned stage logic blijft leidend; Developer Mode's sandbox blijft een niet-persistente test.
- Op Victory / Game Over komt **THE WORLD REMEMBERS** bij de bestaande statistieken: oorspronkelijke wereld, invasie-element, hoogste verdiende veroveringspercentage, uitkomst en definitieve dominante wereld. Alleen de **The Last Meme / echte Standard-victory** mag naar `shadowDominantWorldV1` schrijven. Game Over herstelt de verdedigde wereld. Een boss verdiend op 50% telt ook als de kaarttransitie nog in animatie was (`restorationPeak` neemt het werkelijk verdiende doelpercentage mee).
- `index.html` bevat de nieuwe module na `js/world-state.js`, terwijl normale spel-functies die pas tijdens de run aanroepen; script- en CSS-cacheversies zijn bijgewerkt.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39154500366 — **412/412 tests geslaagd, 0 gefaald**, inclusief **10 nieuwe Update-24-regressietests**. De tests dekken alle zes invader/defendercombinaties en 18 fasenamen, exact territoriumeffect, uitgesloten enemies/bosses, status/HUD throttling, verdiende drie bossmijlpalen, een correct permanente eindoverwinning versus nederlaag, eerlijke 50%-peak tijdens animatie, en spel-/HTML-wiring.

**Planning:** **14/20 = 70%** van de geplande updates richting Update 30 — *geen* percentage daadwerkelijke gameplay- of visuele afwerking.

**Browser-QA staat nog open:** speel als Fire/Water/Frost tegenover een *andere* verdedigende wereld; check na Beau, Mourning Shade en Bell Tower hoe de frontlinie en terrain patches veranderen, en of verdedigers zichtbaar verschillen op native vs. occupied terrain. Test Live World-reakties naast de wereld-HUD, en de run-summary na zowel een mislukking als de finale overwinning. Meet of lange HUD-status niet met andere elementen overlapt op small screens. Controleer het terreinvoordeel bij 1×/2×/3× en of het tactisch genoeg aanvoelt. Automatische tests garanderen deze visuele/subjectieve ervaring niet.

**Volgende (Update 25):** controleer daadwerkelijk de **bossvolgorde Beau → Mourning Shade → Bell Tower → The Last Meme**, begin/einde van boss-isolatie, minions uitsluitend door de boss, beloningen, eind-overgang naar Endless, geen voortijdige veroveringsopslag; regressietests én handmatige bossflow waar mogelijk. Behoud spectaculaire en leerbare boss-aanvallen als kernvisie; definitieve VFX-polish nog later.


## Update 25 — afgerond (18 oktober 2026)
**Doel:** een betrouwbare Standard bossroute in een solitaire arena, zonder reguliere vijanden of verborgen dubbele rewards; na de eindbaas een logisch doorlopende Endless-bossrotatie. **Update 26** blijft gereserveerd voor de werkelijk spectaculaire boss-aanvallen.

**Resultaat:**
- Nieuwe lichte pure module `js/boss-flow.js`, geladen in `index.html` na de bestaande gamecode en vóór de boss-isolatiemodule, met standaardvolgorde **Beau de Hond → The Mourning Shade → The Bell Tower → The Last Meme**. De bestaande `nextBossEncounter()` in `js/enemies.js` gebruikt die autoriteit tijdens echte runs, met veilige legacy fallback voor geïsoleerde tests.
- `spawnFinalBoss()` controleert nu expliciet: Standard Mode, **precies 3 daadwerkelijk verslagen gewone Guardians**, minuut **25:00** bereikt en final boss nog niet verslagen. **Developer Mode** houdt de opzettelijke Quick Test-mogelijkheid, maar buiten Standard mag de finale ook daar niet zomaar worden gestart.
- Belangrijke bugfix: na een echte overwinning op **The Last Meme** begint de **Endless**-Guardianrotatie met **Beau**, daarna Shade, daarna Bell, en niet met Shade omdat Standard-boss #4 de teller verschoven had. Voor een verse Endless-run begint de rotatie ook met Beau. Dit verandert niets aan de normale drie-bossvolgorde in Standard.
- Boss-countdown in de HUD noemt nu expliciet **de volgende Guardian bij naam**, inclusief de eindbaas na de derde reguliere boss. De namen zijn afgestemd op `bossCatalog`: **THE MOURNING SHADE** en **THE BELL TOWER**.
- De bestaande `js/boss-isolation.js` blijft reguliere vijanden, oude shots en terreinscars verwijderen zonder kill-/XP-/loot-beloning. Gewone spawns, waves, patrols en wereldverdediging blijven geblokkeerd zolang de boss leeft; alleen expliciete boss-summons mogen tijdens de bossgevechten verschijnen.
- Na `finishBossIsolation()` worden tijdelijke minions en projectielen volledig weggehaald. Als de wavestatus tijdens het gevecht op 0/negatief terechtkwam, geeft de game nu een **minimale herstelruimte van 12 game-seconden in Standard of 8 in Endless** voordat die wave kan beginnen. Bestaande wave-timers langer dan dit worden *niet* onnodig verzet. Dit voorkomt een directe catch-up-horde als de boss-rewardkaart sluit.
- Bestaande loot blijft de echte `awardBossLoot`-handler gebruiken; `damage()` markeert een gestorven boss onmiddellijk dood, zodat herhaalde treffers diezelfde boss geen tweede beloning geven. De finale gebruikt bestaande `grantFinalVictory()` met een eenmalige victory-/career-unlock; `continueEndlessAfterVictory()` gebruikt dezelfde run zonder dubbele recordcreatie. Het world state systeem blijft uitsluitend **na echte final boss victory** permanent overschrijven.
- De tests in `tests/boss-isolation.test.cjs` en `tests/boss-sequence-xp.test.cjs` zijn aangepast waar ze op de oude syntaxis van `spawnFinalBoss()` of variantberekening stonden; die tests controleren nu de nieuwe beveiliging, zonder de originele belonings- en XP-regels te veranderen.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39155406864 — **422/422 tests geslaagd, 0 fouten**, inclusief **10 nieuwe boss-flowtests** voor de Standard timeline, finale-gates/Developer-sandbox, echte Beau/Shade/Bell-identiteiten, nieuwe Beau-cyclus in Endless, één bosskill/trophy, geïsoleerde arena zonder XP-wegwerpbeloningen, post-bossherstel, HUD-namen en bestaande Victory/Endless-opslag. JavaScript-syntaxchecks groen.

**Planningvoortgang:** **15/20 = 75%** van geplande updates richting de eerste Combat & Gameplay 2.0-mijlpaal. Dit is *geen* garantie dat de boss-flow al in een complete 25–30 minuten browserrun doorlopen is.

**Handmatige browser-QA open:** doorloop Standard met Beau, Mourning Shade en Bell Tower; check soloarena, alleen door boss gesummonde minions en uitblijven van wave/spawn na reward. Wacht op The Last Meme rond minuut 25 en controleer de echte wereldverovering, finale loot en exact één victorybonus/record. Kies **CONTINUE IN ENDLESS MODE** en bevestig dat Beau de eerste terugkerende Guardian is, gevolgd door Shade en Bell. Test herstart/main menu, Developer Mode quick bosses en late boss-verslagen zonder volgordesprong.

**Volgende stap — Update 26:** elke boss ten minste één of twee goed leesbare normale aanvallen en daarnaast **indrukwekkende, gevaarlijke signature-aanvallen** geven: Arena-transformaties + gigantische aanvallen (Guardian Powers). Boss fights moeten zelfstandig zijn en hun sterke aanvallen moeten aim, timing en toegankelijke dodgepaden hebben. VFX als goede basis, definitieve art-polish later.


## Update 26 — afgerond (18 oktober 2026)
**Doel:** de vier echte solo-bossgevechten qua dreiging en vorm naar een hoger niveau brengen. Niet alleen makkelijk te ontwijken projectielen, maar **arena-transformaties gecombineerd met grote, spelergerichte Guardian Powers**, duidelijk gemarkeerde dodgeroutes en zelfverzekerde collision. De maker wil later nog veel VFX-polish; deze update maakt de gameplay en duidelijke basis-Canvas-signaturen concreet, niet de definitieve illustratiekwaliteit.

**Werkelijk gebouwd:**
- Nieuwe zelfstandige module `js/guardian-arena-powers.js` naast de bestaande gedetailleerde modules `js/beau-encounter.js`, `js/shade-encounter.js`, `js/bell-encounter.js` en `js/meme-encounter.js`. Elke bestaande fase-3 ultimate start nu een extra **eigen arena-Set Piece**. De gewone aanvallen, bestaande unique attacks, boss-HP en soloarena zijn NIET vervangen.
- **Beau de Hond — HOUND'S KILL ZONES:** drie reusachtige parallelle dodelijke charge-corridors; de speler moet zijwaarts uit de aanvalsweg stappen, door een brede opening tussen de gangen.
- **The Mourning Shade — ECLIPSE OF THE LOST:** dodelijke schaduwkern en drie brede donkere zones; daartussen zijn veilige, zichtbaar open lichte sectoren waar de speler gericht heen kan bewegen.
- **The Bell Tower — THE FINAL TOLL:** een arena-brede resonante kruisaanval (verticale en horizontale slag), met brede diagonale veilige kwadranten waar de speler naartoe moet dodgen.
- **The Last Meme — REALITY FRACTURE:** een 5×5 rooster van enorme wisselende gevaarlijke en veilige werkelijkheidstegels; het gevaar wisselt per beat, zodat de speler telkens opnieuw positie moet kiezen.
- **Elk van deze vier powers heeft drie grote slagen**, met aanvankelijke waarschuwing van **1,45 game-seconden**, daarna **1,08 seconde per herhaalde waarschuwing**. Het doel volgt de speler alleen tijdens de eerste 0,38 seconde en wordt vervolgens vastgezet; de aanval mag daarna niet alsnog heimelijk van richting veranderen. Alleen bij het einde van de aangekondigde waarschuwing kan een slag raken, en een andere plek dan het zichtbare gevarengebied blijft veilig.
- Het gevaar wordt **direct met dezelfde geometriefunctie berekend als de getekende vormen**; de nieuwe aanvallen respecteren player-dash, tryDodge, bestaande invulnerability, Developer invincibility en bestaande `recordPlayerHit`/Game-Over-afhandeling. Een per-aanval getriggerde slag kan maximaal één keer damage aanbrengen. Basis damage per slag 16/18/20 (finale 19/21/23), geschaald met de bestaande difficulty enemyDamage, niet een aparte onbegrensde multiplier.
- **Arena-getransformeerde backdrop** (Fire/Shadow/Bell/Reality) én groot, contrastrijk contour van werkelijk gevaarlijke zones. De impactring en alle gevaarlijke contouren blijven ook op **Low graphics** zichtbaar. High heeft extra gekleurde grondvulling. Bestaande boss-showcase tekenen en projectielen blijven actief.
- De boss zelf bezit de enige actieve extra aanval. De helper heeft **geen nieuwe enemies, minions, XP, loot, timers of persistent storage**. Nieuwe run, bossdeaf, phase-interrupt en bossarena-exit wissen de state. Geen hits van een oude Guardian die naar de volgende fight doorsijpelen.
- `index.html` laadt `js/guardian-arena-powers.js` vóór de showcase encountermodules. `js/game.js` roept de aanvallen in de bestaande boss-tick aan en verwerkt hun hits via het gewone damage-/dodgesysteem. `js/render.js` tekent de transformatie onder de speler en de warnings rond de boss. Cacheversies bijgewerkt. Oude testasserties voor de vorige Beau-scriptversie en exacte resetregel zijn aangepast.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39156381005 — **432/432 tests geslaagd, 0 gefaald**, incl. 10 nieuwe integratie-/vormtests in `tests/update-26-guardian-arena-powers.test.cjs`. Ze controleren vier visueel/mechanisch verschillende sets, echte gevaarlijke centrumpositie, **bereikbare veilige zones** binnen 1,45 seconden basisloopsnelheid, voorspellend volgen en targetlock, exact drie schadekansen zonder dubbele hits, weglopen voor impact, reset/owner-isolatie, Low-graphics tekenen, werkelijke Phase-III-encounterstart en damage via gewone dodge/invuln-pipeline.

**Planning:** **16 / 20 = 80%** van de geplande updates richting Mijlpaal 30; GEEN uitspraak dat alle art/combat nu 80% gepolijst zijn.

**Nog te bewijzen in een echte browserrun:** Force Phase III via Developer Mode voor ieder van de vier Guardians. Bekijk de enorme lanes/eclips/plus/kruis/tegels op Low/High, kijk of het spel de waarschuwingen en 1×/2×/3× snelheidsstanden werkelijk leesbaar toont, of de escape routes tijdens overlappende bestaande showcasetelegraphs nog eerlijk blijven, en of de drie beats heftig maar niet oneerlijk zijn. Controleer of één gewone attack plus deze ultimate daadwerkelijk gevaarlijk genoeg voelt zonder dat een onzichtbare collision de speler raakt. Als eerdere showcase-hazards de nieuwe fase-3-powers laten overlappen op onvermijdbare wijze, verlaag overlappende druk in een volgende gerichte balanspass. Automatische tests zijn **geen** complete 25–30 min browserplaytest.

**Volgende Update 27:** leesbaarheid/hiërarchie van combat-HUD en **bosswaarschuwingen**. Prioriteit bij extreem drukke bossfights: niet méér cosmetische VFX maar duidelijk onderscheid tussen levensgevaar, veilige paden, recovery, HP en dashstatus. Daarna Update 28 performance; Update 29 full Normal QA; Update 30 milestone review.


## Update 27 — afgerond (18 oktober 2026)
**Doel:** de vele bestaande bossaanvallen en de vier nieuwe Guardian Powers uit Update 26 zo presenteren dat de speler **het echte gevaar, een plek om te ontwijken en het moment om terug te slaan** kan herkennen. Geen combat-rework of kostbare definitieve VFX-polish.

**Gebouwd en aangesloten:**
- Nieuwe zelfstandige presentatielaag `js/combat-hud.js` plus compact `#bossCombatCue` direct onder de boss-HP-balk in `index.html`. CSS in `styles.css` ondersteunt desktop, 620px en kleiner, Low graphics, de donkere bossarena en `prefers-reduced-motion`.
- **Prioriteit in waarschuwingen:** een actieve Guardian Power gaat boven normale boss-shots/charges, showcase-aanvallen en recoverymeldingen. Het paneel toont de **exacte aanval**, **BEAT 1/3…3/3**, **tijd tot impact** en een geanimeerde countdownbalk. Afgeronde tijd wordt **conservatief naar boven op tienden** afgerond zodat de HUD niet minder reactietijd suggereert dan je daadwerkelijk hebt.
- **Doel volgen versus doel vergrendeld:** tijdens de eerste 0,38 gameseconde — wanneer de boss de speler nog trackt — toont de HUD `TARGET TRACKING · BAIT, THEN DODGE` en **geen misleidende vaste veilige pijl**. Na de bestaande target-lock zoekt hij met **dezelfde collisionfunctie `guardianArenaPowerThreat()`** naar de kortste nabijgelegen veilige bestemming in acht richtingen, met extra randmarge; de Canvas-helper `drawCombatHudEscape` tekent daar een subtiele **turquoise stippellijn en kleine cirkel**. De richting/afstand is slechts **veilig voor déze Guardian Power**, niet voor tegelijk bestaande showcase-shots of andere projectielen. Als geen nabije plek beschikbaar is, toont de HUD een dash-/trapped-waarschuwing, niet een verzonnen veilige plek.
- **Dynamisch en licht:** de safe-route-sampling is beperkt tot maximaal acht richtingen en enkele afstanden, met korte `0,13 game-seconde` cache en invalidatie na voldoende player movement, een nieuwe beat, andere oriëntatie of een nieuwe run. Er worden geen extra aanvallen, vijanden of permanente states gecreëerd.
- **Herstel als kans:** zodra `boss.specialRecoveryUntil` actief is, laat de HUD een afzonderlijk turquoise `COUNTERATTACK`-venster zien. Hij belooft de +42%-damagebonus **alleen als `bossCombatDamageMultiplier()` die bonus daadwerkelijk zou geven**. Ook de overige warningmogelijkheden, boss showcases en dash-cooldown worden herkenbaar weergegeven.
- De echte power-status uit `js/guardian-arena-powers.js` geeft nu ook `lockAt` terug (read-only status); power-timing, hit-geometrie en schade blijven volledig ongewijzigd. `js/game.js` koppelt de HUD aan het echte boss/tijd/dash-state, `js/render.js` tekent de route op wereldcoördinaten en `js/boss-isolation.js` wist cache na boss exit of run reset. `index.html` gebruikt vernieuwde JS/CSS-cacheversies.
- Waarschuwingen blijven visueel compact; het paneel is **verborgen als er geen actueel relevant gevaar of herstelvenster is**. Voor mobiele weergave krijgt het compactere typografie in plaats van een fullscreenlaag.

**Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39157580799 — **441/441 tests geslaagd, 0 fouten** en JS syntaxchecks groen. **9 nieuwe Update 27-tests** valideren UI-tijd/beat/dash, Guardian-prioriteit, vier feitelijk veilige bestemmingen, geen fake pijl voor target lock, individuele veilige-zone claims, counterattack/damagebonuskoppeling, andere warning-/showcasecategorieën, invalidate/reset en daadwerkelijke DOM/CSS/Canvas-script-wiring. Eén verouderde boss-isolation-stringtest is bijgewerkt op de nieuwe resetvolgorde.

**Voortgang:** **17/20 = 85%** van de geplande updates richting Combat & Gameplay 2.0 bij Update 30. Het percentage is geen maatstaf voor hoeveel gameplay/art al gepolijst is.

**Nog handmatig te beoordelen:** vier fase-3 bosses in Developer Mode, 1×/2×/3× speed, Low/High graphics en kleine viewport. Kijk of de veilige pijlen bij snel bewegen stabiel blijven, of bestaande boss-projectielen het gemarkeerde pad kruisen, of het paneel leesbaar blijft naast de bossbalk, en of groene `COUNTERATTACK` echt samenvalt met een uit te buiten attack window. De tests bewijzen geometrie en wiring, niet de subjectieve visuele leesbaarheid.

**Volgende Update 28:** **performance** bij volle arena's, FPS, Canvas-tekenkosten, objectlimieten, object lifetime, late-run enemy density en effecten in Normal/Nightmare. Behoud de **echte hitzones en minimaal noodzakelijke waarschuwingen op Low**, en verander de spelbalans niet om benchmarkcijfers mooier te maken. Na 28 volgen 29 (volledige Normal-run QA) en 30 (mijlpaalreview).


## Update 28 — afgerond (18 oktober 2026)
**Doel:** onnodige CPU-, geheugen- en Canvas-werkzaamheden schrappen zonder de game makkelijker te maken. In het bijzonder mag een hogere FPS **niet** worden verkregen door spawns, schadeberekening, hitzones, 16-direction shields, terrain-damage of bosswarnings te verminderen. De maker wil functionele visuele basis behouden; definitieve VFX-polish volgt later.

**Gebouwd op feature/living-world-prototype:**
- In `js/enemies.js` gebruikt `rebuildEnemyGrid()` nu een **stabiele Map en gerecyclede cel-arrays**, in plaats van voor elke vaste gametick een nieuwe Map en voor elke gevulde cel een nieuwe array te alloceren. Vrijgekomen arrays worden meteen gewist om referenties naar dode/moved enemies los te laten. Het spare-pool is **begrensd op 256 lege buckets**; de bestaande cellengrootte 140, de ordening en alle `nearbyEnemies`/`nearestEnemy` queryregels blijven intact. Juist bij 2×/3× snelheid voorkomt dit terugkerende allocaties en GC-druk.
- `js/render.js` heeft nu **alleen-voor-tekenen** viewporthelpers `renderEffectVisible()` en `renderSegmentVisible()`. Onzichtbare **Frost Zones, lightning-segmenten, Flame Cone-bursts en explosion-ringen** worden niet meer getekend of van dure glow-traces voorzien; events blijven leven en kunnen hun volle damage en status blijven toepassen. De lijnculler behoudt ook gigantische projectielen die het scherm *doorsnijden* terwijl beide eindpunten offscreen liggen. Ook bommen en finale gemarkeerde ground-hazards krijgen een goedkope cullingcheck zonder nieuw spread-object per iteratie.
- De **vignette Canvas radial gradient** die voorheen iedere draw opnieuw werd aangemaakt, wordt nu per grootte **1× aangemaakt en gecachet** in `getVignettePaint()`. Bij een echte viewportresize wordt de cache opnieuw opgebouwd; visueel blijft dezelfde vignette over.
- `js/world-visuals.js` gebruikt nu direct een loop over de scherven/scars met viewportcontrole in plaats van `scars.filter(...)` en een tijdelijke zichtbare array aan te maken, zonder opgeslagen terreinwijzigingen of in-game wereldschade aan te passen.
- `js/game.js` vervangt de HTML-kaarten van de drie huidige elementwapens in de HUD **alleen als de markup werkelijk verandert**, in plaats van iedere ca. 0,12 game-seconde DOM-nodes te vervangen. De waarde wordt bij reset gewist, zodat een nieuwe run zijn eigen loadout toont. HP, Boss HP, dash, aura, bosswarnings, de Live World-status en schade-feedback blijven onafhankelijk bijgewerkt worden.
- `index.html` cachebust alle vier aangepaste modules. **Niets gewijzigd** aan Normal/Easy/Nightmare spawn limieten, XP, twee earned evoluties, boss-arena-isolatie, gevaren en attack-hitlogica.

**Automatische regressies en bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39158717600 — **451/451 tests geslaagd, 0 gefaald**, JavaScript-syntax groen. **10 nieuwe tests** in `tests/update-28-performance.test.cjs` verifiëren dat de Map en de bucket-arrays daadwerkelijk hergebruikt worden; dat bewegende en gestorven enemies geen stale spatial hits opleveren; dat celqueries voor 1/80/260/600 enemies op zeven radii en meerdere ticks exact dezelfde set leveren als een brute-force zoekopdracht; dat nearest targeting niet verschuift; dat het pool klein blijft; dat viewportculling randen, explosies en lange kruislijnen correct behandelt; dat de gradient ondanks 500 reads één object blijft en na resize vernieuwt; en dat bestaande Guardian-warnings niet zijn uitgezet. De oude boss-isolation resetvolgorde-test is bijgewerkt met de nieuwe, onschadelijke HUD-cache reset.

**Planningsvoortgang:** **18 van 20 = 90%** van de *geplande* updates naar Combat & Gameplay 2.0. Dit is geen gemeten gameprestatiewinst en niet het aandeel art dat af is.

**Nog open — daadwerkelijk meten en spelen:** gebruik in de browser de FPS/debug-overlay (bestaand) en Developer Mode om vergelijkbare groepen van ±100/200/300 enemies plus projectielen en live area effects op **1×/2×/3×, Low/Medium/High** te vergelijken. Leg gemiddelde FPS en `AI / hit / draw ms` vast op dezelfde computer en met dezelfde loadout. Bevestig via echte runs dat shots offscreen blijven bewegen, geen verdwenen waarschuwingen of gemiste collisions ontstaan, real-world worldscars/retaliation zichtbaar blijven en de HUD na een loadout-upgrade direct bijwerkt. Geen numerieke FPS-claim zonder browsermeting. Controleer geheugen over een lange Normal-run om eventuele leaks te detecteren.

**Volgende Update 29:** de **volledige 25–30 minuten Normal-run** en eventuele grootste blockers prioriteren. Loop de drie earned Guardians, twee earned evoluties, alle drie wapen-elementen, de Last Meme na 25:00, het win-/fail-/Endless-verloop en de nu zwaardere phase-three Guardian Powers door. Koppel browser- en CI-verificatie aan concrete bugfixes en maak niets 'geplaytest' wat alleen via Node is getest. Daarna Update 30: eerste milestone review.


## Update 29 — afgerond (18 oktober 2026)
**Doel:** de volledige 25–30-minuten Standard Normal-campagne integraal toetsen, echte blokkades repareren en onderscheid maken tussen gescripte gameplay-asserties en **daadwerkelijk gespeeld in de browser**. Vanwege ontbrekende browser-/visuele playtestaccess is deze update bewust een **scripted QA replay**, geen valse belofte van een menselijke volledige run.

**Concreet gebouwd en gerepareerd:**
- Nieuwe `tests/update-29-full-normal-run.test.cjs`: **11 extra tests**, waaronder gesimuleerde complete **26:40 Normal-campagnes** voor Fire/Water/Frost met de **echte geïmporteerde** `js/boss-flow.js`, `js/world-state.js`, `js/progression.js`, `js/upgrades.js`, `js/enemies.js`, `js/boss-isolation.js` en de echte uit `js/game.js` geëxtraheerde eindscherm- en Endless-functies. De test gebruikt echte bossconstructors, `damage()` en bossdeath, drie world thresholds **15/50/85%**, exacte eerste tweede evolution time-gates 10:00 en 17:00, finale **niet vóór 25:00** en definitieve World Victory op 26:40. Daarna doorgaan in Endless met Beau als eerste terugkerende boss en geen dubbele wins/rewards/run-records. Ook defeat/herstel en geen premature/derde evolutie worden gecontroleerd.
- **Nuance over de replay:** dit script simuleert geen 60 FPS-render, bootst geen autonome 26 minuten vijandengevechten of daadwerkelijke upgrade-aanbiedingen na en geeft voor de evolutiechecks de juiste vereiste weapon-level 5 en support-level 3 direct in de testfixture. Het bewijst de echte *regels, guards, verdelingen en levenscyclus*, niet dat je in een normale run voldoende XP verdient, twee keer eerlijk kunt evolueren of vier bosses overleeft. Voor dat onderscheid is `NORMAL-RUN-QA.md` met open tests bijgehouden.
- **Echte bugfix 1 (`js/game.js`):** na een gewonnen Standard en een latere Endless-death meldde Game Over tegenstrijdig dat de *oorspronkelijke* verdedigde wereld was veroverd. Nu toont het de daadwerkelijke **invader-/gewonnen wereld** bij Endless-death, de verdiende piekverovering **100%**, en bij een vroegtijdige Standard-death de oorspronkelijke wereld met het echt behaalde maximum (bv. 50% na twee earned bosskills). De reeds opgeslagen wereldstatus wordt hierdoor niet aangepast.
- **Echte bugfix 2 (`js/game.js`):** een final-boss-kill gebeurt soms halverwege een 1/60 simulatiestap. Oude projectielen konden in de resterende tick alsnog `end()` aanroepen en zo de net verdiende **VICTORY**-modal overschrijven. `end()` weigert nu enkel wanneer `gameState === "victory"`; na `CONTINUE IN ENDLESS MODE` is gameState opnieuw `playing`, zodat een nieuwe dood wel correct Game Over wordt. Eén nieuwe test dwingt precies deze overgang af en bewaakt de eenmalige runreward.
- **Nieuw permanent QA-document:** `NORMAL-RUN-QA.md` met concrete handmatige acceptatiecheckpoints van 00:00 tot 25–30min, elk van de vier Guardians, twee earned evoluties, de 18 Living World-reacties, 3 moeilijkheden, low/high, 1×/2×/3×, HUD/power overlap, rewards, verlies/victory/Endless en geheugen/FPS. **Open browsertests zijn expliciet NIET afgevinkt.**

**CI-verificatie:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39159657297 — **462 tests geslaagd / 0 fouten** inclusief 11 nieuwe Update-29 regressies, JavaScript-syntax groen. Een nieuwere docs-only workflow mag daarna ook groen worden; controleer altijd de actuele branch-HEAD.

**Planningsvoortgang:** **19/20 = 95%** van de geplande updates naar Update 30. Dit is geen percentage spelkwaliteit, grafische afwerking of bewezen speelbaarheid.

**OPEN tot vrijgave:** volledige **echte** Standard Normal-browserrun van 25–30min met Fire/Water/Frost; kunnen verdienen van weapon L5 + support L3 *via normaal gespeelde XP en daadwerkelijk aanbod*, fase-3 Guardian Powers plus bestaande showcases zonder oneerlijke overlap; aanhoudende FPS/stabiliteit, eventuele late-game balans; volledige handmatige boss-/wereld-/Endless-overgang. De gescripte 26:40 QA replay is géén praktische spell- of survivabilitybenchmark.

**Volgende — Update 30:** beslismoment Combat & Gameplay 2.0: inventariseer echte bewezen acceptatiecriteria en bekende risico's, markeer scenario's eerlijk als PASS / AUTOMATISCH PASS, MANUEEL OPEN of FAIL, maak een gerichte vervolg-roadmap naar de eerste daadwerkelijk volledig speelgeteste versie. Houd de makerafspraak aan dat VFX voor nu vooral bestaan en gameplay voorrang heeft boven eindpolish. Geen definitieve kwaliteits-/releaseclaims zonder browsertests.
