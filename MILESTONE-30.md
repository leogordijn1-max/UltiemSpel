# SHADOW SURVIVOR — MIJLPAAL UPDATE 30
**Doel:** een volledig speelbare, uitdagende, begrijpelijke en prettig aanvoelende 25–30 minuten Standard-run. De graphics hoeven nog geen definitieve releasekwaliteit te hebben; alle essentiële systemen moeten wel betrouwbaar zijn.

**Laatste afgeronde update:** 13 — Impact & Hit Feedback: kritieke aanvallen, impactringen en geluid.
**Volgende update:** 14 — XP/evoluties: echte 25-minuten balansruns.
**Planningvoortgang:** **3 / 20 afgerond = 15%**. Dit is een planningsteller, niet een inschatting van grafische/gameplaykwaliteit.
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
| 14 | XP/evoluties: echte 25-minuten balansruns | OPEN |
| 15 | Kleine groepen: attack timing, focus & AI | OPEN |
| 16 | Vijandtypes: onderscheidende sterke/zwakke punten | OPEN |
| 17 | Enemy skills: leesbare telegraphs en combinaties | OPEN |
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
