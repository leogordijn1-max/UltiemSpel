# 🏆 Update 30 — Combat & Gameplay 2.0: mijlpaalreview

**Datum:** 18 oktober 2026  
**Repository:** [leogordijn1-max/UltiemSpel](https://github.com/leogordijn1-max/UltiemSpel)  
**Branch:** `feature/living-world-prototype`  
**Updatevolgorde:** 11–30 = **20/20 geplande updates afgerond (100% planningsvoortgang)**.  
**Uitkomst:** **TECHNISCHE MIJLPAAL GEHAALD · GEVERIFIEERDE SPEELBARE RELEASE: NOG NIET VRIJGEGEVEN.**

> **Waarom dit onderscheid?** Een succesvolle CI-run, de 26:40 gescripte campagne-replay en tien afzonderlijke controles bewijzen belangrijke regels, toestandovergangen en regressieveiligheid. Ze bewijzen **niet** dat een mens op Normal daadwerkelijk 25–30 minuten overleeft, eerlijk twee evoluties verdient, de vier bosses kan ontwijken of dat de FPS lang genoeg stabiel blijft. Dit reviewdocument maakt die onzekerheid expliciet in plaats van een kunstmatige kwaliteitsscore te geven.

## 1. Bewijs van deze mijlpaal

| Bewijs | Status | Wat is bevestigd? | Wat niet? |
|---|---|---|---|
| JavaScript-syntaxcontrole via GitHub Actions | **TECHNISCH PASS** | Huidige JS en testbestanden zijn syntactisch geldig in Node.js 22 | Echte browsergedragingen/graphics |
| **462/462 automatische regressietests** | **TECHNISCH PASS** | Gameplayregels, eerdere fixes, projectielen, boss-/world-/evolutiecondities in de tests | Volledige menselijke run of algemene performance |
| `scripts/milestone-30-audit.cjs` | **10/10 TECHNISCH PASS** | 10 afzonderlijke functionele/source checks; zie onderstaande matrix | Een geslaagde releaseverklaring |
| `tests/update-29-full-normal-run.test.cjs` | **TECHNISCH PASS** | Fire/Water/Frost, drie echte Guardian-kills, win op 26:40, world persistence, level-5/support-3 evolution time-gates, Endless recordflow | Werkelijk verdiende XP/level-upopties, realtime 60-FPS-combat, overlevingsbalans |
| `NORMAL-RUN-QA.md` | **6 HANDMATIGE RELEASEBLOKKADES OPEN** | De checkpoints en acceptatiecriteria zijn vastgelegd | Nog geen volledig uitgevoerde browserruns |
| Definitieve combatfeel en VFX-afwerking | **UITGESTELD** | Alle basis-Canvas-warningmechanismen bestaan | VFX-polish op releasekwaliteit is bewust geen Update-30-eis |

**Verifieerbare CI:** [laatste volledige 462-tests + milestone-audit](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39160892259). De workflow controleert syntax, draait **alle** `.test.js` en `.test.cjs` bestanden en voert vervolgens `node scripts/milestone-30-audit.cjs` uit.

## 2. Technische acceptance gates (10/10 PASS)

De audit wordt **bij iedere push** op deze branch uitgevoerd. Lokale opdracht: `node scripts/milestone-30-audit.cjs`.

| Gate | Status | Bewijs/onderdeel |
|---|---|---|
| ELEMENTS | PASS | 3 elementgroepen × 3 echte wapens; geen Arcane/Boomerang in actieve selectie |
| BOSSES | PASS | Beau → The Mourning Shade → The Bell Tower → The Last Meme; laatste na minuut 25 én drie behaalde Guardian-kills; Endless begint met Beau |
| EVOLUTIONS | PASS | Een verslagen boss, wapenlevel 5 en de juiste support op level 3; eerste op 10:00, tweede op 17:00; geen derde |
| ISOLATION | PASS | Gewone vijanden en projectielen verdwijnen uit de bossarena zonder gratis XP; alleen boss-summons toegestaan; herstelpauze na boss |
| WORLD | PASS | Wereldfront 15% → 50% → 85%; uitsluitend verdiende Standard-overwinning schrijft permanente invaderworld |
| POWERS | PASS | Vier verschillende Phase-III-Guardian Powers, visuele/feitelijke gevarenzones en reset |
| HUD | PASS | Bosswarning en escape-advice baseren zich op werkelijke collisiongeometrie van **die ene** power |
| PERFORMANCE | PASS | Hergebruik enemy-spatial-buckets en render-culling aanwezig; fixed-step-simulatie intact |
| VICTORY | PASS | Laatste klap kan niet door same-tick schade worden overschreven; Endless hervat en overlijden werkt weer |
| AUTOMATION | PASS | Complete GitHub Actions-suite en expliciete browser-QA-checkpoints aanwezig |

**Statusinterpretatie:** deze checks draaien op Node en zijn onderdeel van een testbasis. **PASS is niet hetzelfde als 'combat en gamefeel zijn live bewezen'.**

## 3. Zes release-gates zijn nog OPEN

| Gate | Waarom dit belangrijk is | Vereist voordat we *verified playable* zeggen |
|---|---|---|
| **M1 · Echte Normal-run 25–30 minuten** | Tijdskiptests slaan 26 minuten vijanden, render en reacties over | Minstens één ononderbroken run met checkpoints, begin- en eindstatus, geen blocker |
| **M2 · Echt twee evoluties verdienen** | Replay stelt de vereiste upgrades rechtstreeks in | Met echte XP en level-upkeuzes een wapen tot 5 + juiste support tot 3 ×2 vóór/met de finale |
| **M3 · Vier eerlijke bossfights** | Spectaculaire Phase-III-hazards kunnen met oude showcase-projectielen stapelen | Beau, Shade, Bell, Meme in browser bekijken en ontwijken; check 1×/2×/3×, Low/High, geen niet-aangekondigde onvermijdbare hit |
| **M4 · World/save/Victory/Endless live** | Vooral modals, input, reset en localStorage zijn browsergedrag | Minstens één echte overwinning en één verlies; saved-world na refresh; geen dubbele beloning |
| **M5 · Gemeten FPS/geheugen** | Node-objecttests bewijzen niet hoeveel de GPU op een echte pc aankan | FPS, P95-frame, AI-/collision-/drawtijd op licht, druk en bossscenario; geen grote late-run degradatie |
| **M6 · Drie geregistreerde complete runs** | Eén toevallige goede run bewijst balans niet | Drie vastgelegde Normal-runs, verspreid over Fire/Water/Frost, inclusief verbeterpunten en minimaal één succesvolle 25–30m-run |

**Totdat M1–M6 zijn afgevinkt: NO-GO voor 'volledig speelgeteste eerste release'.** Dit houdt een informeel speelbaar prototype niet tegen.

## 4. Bekende product- en technische risico's (prioriteit)

| Prioriteit | Risico | Impact | Aanpak |
|---|---|---|---|
| **P0** | Twee echte evoluties kunnen in de praktijk te zeldzaam zijn door XP-tempo of upgrade-aanbod | Speler mist hoofdprogressie tijdens 25–30m run | Neem normale level-upkeuzes/XP bij 10:00, 17:00 en 24:00 op; stuur aanbod/groei bij, geen gratis evoluties |
| **P0** | Meerdere bossattacks overlappen en de 'safe for this power'-marker kan door ander gevaar lopen | Onterecht/eerlijkheidsschadend Game Over | Vier boss Phase-III-testcases live, verminder combinatiedruk zonder signatuur-aanvallen te verwijderen |
| **P0** | Nog geen menselijke bewezen Normal-run van begin tot The Last Meme | Geen releasebewijs | Drie complete runs met vast QA-format en reproduceerbare bugs |
| **P1** | Niet gemeten FPS/P95 bij hoge vijanddichtheid en grote Canvas-effects | Spelen kan traag worden ondanks CI-groen | FPS-overlay, stabiele browserscènes, vóór/na-metingen |
| **P1** | Moeilijkheidsbalans (Easy/Normal/Nightmare) kan subjectief scheef zijn | Normal te makkelijk/moeilijk; frustratie | Waarnemingen vastleggen: hits, deaths, moment, elementen, wins, rewards |
| **P1** | Bugmeldingen zonder reproduceerbare stappen/video zijn moeilijk te prioriteren | Vergissingen/veel herwerk | Repro-template in `NORMAL-RUN-QA.md`, log screenshots/video plus seed/tijd indien bekend |
| **P2** | Basis-VFX zijn visueel nog niet definitief en UI kan te druk zijn | Minder 'wow' / leesbaarheid | Na gameplay-fixes een uniforme visuele stijl en VFX-tuning |
| **P2** | Historische README/archiefcode kan verouderde buildideeën suggereren | Latere AI/ontwikkelaar pakt verkeerde wapens | README geactualiseerd; oude Update 4–8-notities duidelijk als historisch gelabeld |

## 5. Het volgende concrete plan — Updates 31–40

**Nieuwe fase: 'Verified Playable Run'**. Geen tien willekeurige ideeën toevoegen: eerst de ervaring die we al hebben bouwen, **echt spelen, meten en verbeteren**. Elke update gaat pas op AFGEROND zodra code/CI én relevante observaties uit de browser eerlijk zijn vastgelegd.

| Update | Onderwerp | Concreet klaar wanneer… |
|---|---|---|
| **31** | **Run-telemetrie & eerste echte Normal-run** | Een reproduceerbaar testverslag met tijden, levels, XP, builds, bossfase, schade, FPS en een vast bugformat; één volledige runpoging gedocumenteerd |
| **32** | **Echte evolutie-economie** | Test data op 10/17min; upgrades kunnen eerlijk via level-ups twee builds naar 5+3 brengen of noodzakelijke doelgerichte balansfixes zijn getest |
| **33** | **Beau & Mourning Shade — live boss QA** | Fase-3-aanvallen, recovery en soloarena op 1×/2×/3× getest; P0 overlaps opgelost |
| **34** | **Bell Tower & The Last Meme — live boss QA** | Eerlijke ontwijkroutes en echte signatuursetpieces; daadwerkelijke finale na 25:00 werkt |
| **35** | **Enemy density & difficulty live** | Normal geeft tactische druk zonder hordespam, Easy en Nightmare verschillen betekenisvol; 15–25min fightgevoel getest |
| **36** | **Live FPS & geheugen** | FPS/P95-frames op Low/Medium/High en late-wave/bossgesprekken gemeten; duidelijke regressies opgelost |
| **37** | **World conquest & saves live** | World aftermath, herstel bij defeat, permanent saved winner, menu/refresh, Endless-overgang en rewards gecontroleerd |
| **38** | **Wapenbalans & level-upgamefeel** | Fire/Water/Frost en alle negen wapens voldoende bruikbaar; ontbrekende combos/te sterke evoluties gecorrigeerd |
| **39** | **Drie complete Normal-runs + polish** | Drie complete, geregistreerde runs; major blockers gesloten, begrijpelijke HUD/UX en feedback verwerkt |
| **40** | **Verified Playable Run — vrijgavebeslissing** | Acceptatietabel M1–M6 met concreet bewijs, groen CI, en een verantwoord GO/NO-GO met eerlijke restlijst |

**Hierna, als M1–M6 geslaagd zijn:** verder werken aan onderscheidende gameplay / levende wereld en unieke interactie, sterkere animaties, audiovisuele afwerking, UX en eigen identiteit. De eerder besproken **±100 updates** blijft een grove ambitie, geen contract of voltooiingspercentage.

### Aansluitend grafisch traject — Updates 41–50

**Nieuw makerbesluit:** de eerste Shadow Survivor blijft 2D top-down met een **vloeiende stylized 2.5D-look, bijna 3D-gevoel, geen pixelart**. Een mogelijke latere sequel mag werkelijk 3D worden. De concrete art direction, contactschaduwen, volume, character/enemy/boss-redesign en Living World-diepte staan gepland voor **41–45**; animaties, negen weapon-VFX, evoluties en grote boss-setpieces voor **46–50**. **[ROADMAP-31-50.md](ROADMAP-31-50.md)** is nu het officiële vervolgplan. Het besluit maakt NO-GO-manuele gameplaychecks 31–40 niet automatisch PASS en verandert de voltooide teller 11–30 niet.

## 6. Hoe we deze review blijven bijwerken

- De enige bron van spelwaarheid blijft de **werkelijke code op GitHub**. De CI is bewijs voor automatische checks.
- Houd `MILESTONE-30.md`, `PROJECT-KOMPAS.md` en vanaf nu dit reviewbestand bij wanneer een open gate echt nieuwe evidentie krijgt.
- `NORMAL-RUN-QA.md` bevat de stappen voor handmatige tests; markeer een check pas geslaagd na *een daadwerkelijk uitgevoerde* browsertest, niet vanwege een screenshotconcept of Node-replay.
- Geen kwaliteitsscore als 'game 100% klaar' verwarren met **20/20 geplande update-items afgerond**.
- **Makerafspraak:** de visuele effecten hoeven voorlopig vooral te *bestaan*; we werken nog veel aan hun kwaliteit. Gameplay, eerlijke bossaanvallen en herkenbare Living World blijven voorrang houden.
