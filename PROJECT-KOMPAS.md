# SHADOW SURVIVOR — PROJECTKOMPAS & AI-OVERDRACHT

> **LEES DIT EERST IN EEN NIEUWE CHAT.** Dit document bewaart niet alleen de techniek, maar vooral de **visie, spelidentiteit, gemaakte keuzes, sfeer en manier van samenwerken**. Het is bedoeld om een volgende AI zonder herstart of verkeerde aannames het project te laten voortzetten.
>
> **Live bron van waarheid:** GitHub-repo https://github.com/leogordijn1-max/UltiemSpel — ontwikkelbranch **feature/living-world-prototype** (tenzij die later bewust is vervangen). **MILESTONE-30.md** bevat de gedetailleerde roadmap, updatebewijzen en resterende kwaliteitschecks. Lees altijd de nieuwste GitHub-versie van beide documenten én de daadwerkelijke code voordat je wijzigingen doet.
>
> **Stand bij aanleg:** 18 oktober 2026; afgerond t/m **Update 19 (inclusief reparatie voor de actieve elementwapens)**. Volgende is **Update 20: Weapon VFX**. Mijlpaal Update 30: **9 van 20 geplande updates = 45% planningsvoortgang**, géén percentage uiteindelijke gamekwaliteit. Laatst vastgestelde CI: **365 geslaagde tests**, en GitHub Actions stond groen op commit 65f0700. Verifieer dit opnieuw bij iedere nieuwe sessie.

> **ACTUELE STAND (na Update 25, 18 oktober 2026):** Update 25 is technisch afgerond en gepusht op feature/living-world-prototype. **15/20 = 75% planningsvoortgang** naar mijlpaal 30. **422/422 automatische tests geslaagd**, GitHub Actions-run https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39155406864. **Volgende update: 26 — spectaculaire maar leerbare boss-signature-aanvallen.** Browserplaytests en volledige Normal-runs staan nog open. Verifieer telkens de actuele branch-HEAD en CI.

## 1. De ziel van de game — lees dit vóór de code

**Shadow Survivor** (repo heet UltiemSpel) begon als een grappige, eigen HTML/JavaScript survivor-roguelike met bekende/meme-achtige personages, maar moet uitgroeien tot een **echt leuk, uitdagend en onderscheidend spel**. Niet alleen meer wapens, meer vijanden of grotere cijfers toevoegen. We willen een spel dat je onthoudt omdat **de wereld op je reageert** en omdat gevechten echt iets voorstellen.

**De unieke omkering:** de speler is vanuit het perspectief van de spelwereld eigenlijk de indringer/verwoester. De zogenaamde vijanden zijn de verdedigers van hun thuiswereld. Terwijl jij sterker wordt, blijft de wereld niet passief: ze verdedigt zichzelf, verandert en reageert op de schade die je aanricht. Dit mag grappig, absurd en een beetje duister zijn, zonder dat de gameplay onduidelijk wordt. De werktitel voor dit onderscheidende systeem is **The Living World**.

De ambitie is een **desktopgerichte, ongeveer 25–30 minuten durende Standard-run** die op Normal uitdagend maar leerbaar voelt. Het is de eerste game van de maker; focus op **daadwerkelijk speelplezier en originaliteit**, niet op het zo snel mogelijk releasen op Steam. Graphics mogen iteratief groeien, maar de aanvallen, personages en wereld moeten uiteindelijk spectaculair en samenhangend aanvoelen.

### Ontwerpprincipes waar we niet zomaar van afwijken
1. **Kwaliteit boven hoeveelheid.** Geen vijandenspam als makkelijke moeilijkheidsknop. Liever kleine herkenbare teams met rollen, synergie, waarschuwingen, tegenmaatregelen en ademruimte.
2. **Spectaculair én fair.** De speler moet gevaar kunnen lezen, maar niet zo eenvoudig alles ontwijken dat bossfights betekenisloos worden. Grote aanvallen moeten er ziek uitzien en vragen om echte beweging/timing.
3. **Een wereld met geheugen.** Jouw element en run hebben waarneembare gevolgen. De spelwereld is meer dan een decor of een willekeurige hazardgenerator.
4. **Duidelijke build-keuzes.** Drie relevante wapens binnen één element, zichtbare upgradeprogressie en maximaal twee betekenisvolle evoluties in een Standard-run. Geen oude, niet-selecteerbare systemen als nieuwe feature verkopen.
5. **Itereren op speelgevoel.** Automatische tests zijn essentieel, maar zeggen niet of een aanval er tof uitziet, een boss uitdagend is, XP goed valt of een hele run leuk blijft. Echte speeltestfeedback van de maker weegt zwaar.

## 2. De wereld / het verhaal dat we met gameplay vertellen

### The Living World
- De wereld heeft een **dominante elementtoestand**; de speler kiest per run een **eigen invasie-element**. **Element kiezen verandert NIET meteen de wereld.**
- Na de eerste, tweede en derde normale Guardian/boss-overwinning groeit de invasie naar **15%, 50% en 85%**. Na de eindoverwinning kan dat **100% permanent** worden.
- Tijdens een run mogen lokale sporen ontstaan (bijv. ijs, brandplekken, kraters, watervlaktes, elementaire scheuren). De **definitieve verandering van de dominante wereld** wordt pas na een gewonnen run voor volgende runs opgeslagen. Bij verlies herstelt de verdedigde wereld.
- Er zijn **zes gerichte invasie/wereld-combinaties** voor Fire, Water en Frost (richting maakt uit) en **drie escalatiefasen** met verschillende terreinreacties: in de huidige code **18 reacties**. Niet behandelen als 18 verschillende, handmatig geplaatste permanente niveaus.
- Tegenstanders en Guardians mogen zich aanpassen aan de elementaire indringer. De verdediging is een reactie op wat de speler doet, niet een los, willekeurig systeempje.
- De humoristische lore is belangrijk: de speler denkt de held te zijn, maar de vijanden redden eigenlijk hun wereld van de speler. Laat dat steeds subtiel terugkomen in gevechten, visuele verandering, meldingen en eventueel later de eindrunreflectie.
- Houd **tijdelijke lokale sporen**, **reactief terrein tijdens de run** en **permanent opgeslagen dominante wereld** conceptueel apart.

### Huidige element-loadouts — harde afspraak
De normale Standard/Endless-weaponselectie geeft **exact drie wapens van één gekozen element**, waarvan één startwapen en twee via level-up ontgrendeld:

| Element | Huidige selecteerbare wapens |
| --- | --- |
| Fire | Flame Cone (flame), Fireball (fireball), Flame Orbit (flameOrbit) |
| Water | Water Bolt (waterBolt), Tidal Wave (tidalWave), Whirlpool (whirlpool) |
| Frost | Frost Orb (frost), Ice Shards (iceShards), Glacial Pulse (glacialPulse) |

**LET OP — de fout die eerder is gemaakt:** Arcane Bolt en Boomerang zijn **sinds de elementenupdate geen selecteerbare wapens meer** in een normale run. Er bestaat nog historische code voor Arcane, Boomerang, Bomb, Chain enz. voor legacy-/testdoeleinden. **Werk bij nieuwe gameplay-/VFX-updates eerst aan de negen hierboven genoemde daadwerkelijk speelbare wapens**, tenzij de maker uitdrukkelijk beslist dat het wapenaanbod verandert. Gebruik daarvoor de echte selectie- en upgradecode, niet alleen de oude README of de weaponCatalog.

De maker wil herkenbaar verschillende aanvalstypen, geen negen cosmetische varianten van hetzelfde projectiel. Fire moet branden/druk zetten, Water moet verplaatsen/stromen/controle geven, Frost moet vertragen/bevriezen/ruimte beheersen. De concrete uitvoeringen en evoluties staan in de code en kunnen met feedback worden verbeterd.

### Evolutions
- Normal/Standard richt zich op **maximaal twee evoluties per run**, tijdsmijlpalen **10:00** en **17:00**.
- Een evolutie moet **verdiend** worden: normaal gesproken wapenlevel 5 + juiste support op level 3 + minstens één verslagen boss + het tijdsvenster. Geen gratis evolutie om een simulatie te laten slagen.
- Drie level-upkeuzes, waar mogelijk een relevante upgrade richting een echte evolutie; reservewapens blijven ontgrendelbaar.
- Balansdoel: twee evoluties moeten bij redelijk actieve gameplay **haalbaar** zijn zonder extra vijandenspam. Dat moet nog in volledige browserruns bevestigd worden.

### Bosses / Guardians — heel belangrijk voor de sfeer
Gewenste volgorde Standard: **Beau de Hond → Mourning Shade → Bell Tower → The Last Meme** (de finale rond minuut 25). De daadwerkelijke volgorde is geïmplementeerd maar moet nog met een volledige run worden bewezen.

**Boss fights zijn hun eigen evenement:** geen gewone vijanden in de arena, **behalve minions die de boss zelf bewust oproept**. Guardians hebben veel HP, meerdere fases, een paar relatief gewone aanvallen en daarnaast een paar **extreem opvallende, grote, moeilijk te ontwijken signature-aanvallen**. Dus NIET alleen simpele projectielwaaiers waar je zonder nadenken tussen gaat staan. De gebruiker wees die te makkelijke boss-aanvallen expliciet af.

Gekozen richting voor **Guardian Powers: COMBINATIE C — arena-transformaties plus gigantische aanvallen**. Grote patronen, veranderende veilige/gevaarlijke stukken terrein, indrukwekkende visuele aankondigingen en een voelbare counterattack-window nadat je een zware aanval overleeft. Telegraphs moeten eerlijk blijven: gevaar duidelijk zichtbaar, doelen vergrendeld voordat de klap valt, geen gratis onverwachte schade. Maar maak de patronen niet triviaal; de speler moet kunnen leren en vervolgens goed reageren.

Meme-identiteit: Beau de Hond (met MarioVis-visprojectielen), Zombie Mike, Emmer Mayo/The Mayo Master en Eiad Bom vormen een deel van de humor, eigen personages en kunst. Bestaande eigen assets niet zomaar vervangen. De filmische main menu-stijl en de themakeuze **Original/Friends** bestaan in het menu, maar een complete alternatieve assetset is **nog niet** gerealiseerd.

## 3. Hoe deze game aan moet voelen

- Aan het begin duidelijk en uitnodigend; later gevaarlijker en spannender, niet alleen drukker.
- Goede beweging en dash: snel reageren, skill-based uitwijkmogelijkheden, logische bewegingsrichting en zichtbare impact.
- Verschillende vijandrollen (schild, ranged, pouncer, binder, crusher, etc.) laten je tactisch prioriteiten stellen. Een schild dat draait moet **daadwerkelijk naar de speler draaien**, niet alleen visueel lijken te draaien; in Update 16 is hiervoor een 16-richtingenfix gemaakt.
- Vijandenteams hebben herkenbare combinaties en daarna herstelpauzes; houd de arena leesbaar.
- Schade voelt als schade: goede hitfeedback, animaties, scherpe VFX, passende SFX, niet te veel visuele ruis.
- Hoge FPS en goed gedrag in drukke situaties blijven nodig. Ook in late game geen ongecontroleerde objectspam.
- Easy / Normal / Nightmare moeten elk logisch aanvoelen. **Normal** is het belangrijkste balansdoel.
- Bestaande features zoals 1×/2×/3× speed, dash, level-ups, characters, unlocks, Collection, records en Endless behouden, behalve als samen wordt besloten ze te veranderen.

## 4. Waar de echte code staat

Dit is **vanille HTML/CSS/JavaScript met een Canvas-game**, geen game-engine. De scripts gebruiken gedeelde globale state en worden via **index.html in afhankelijkheidsvolgorde** geladen. Verkeerde scriptvolgorde kan ongemerkt problemen geven.

| Onderdeel | Begin bij |
| --- | --- |
| Scriptvolgorde, UI | index.html |
| Hoofdloop, spawns, bossplanning, runstate | js/game.js |
| Upgrades, recepten, level-ups | js/upgrades.js |
| Huidige elementkeuze / actieve loadouts | js/elements.js, js/controls.js, js/cinematic-menu.js |
| Speelbare elementaire wapens | js/elemental-combat.js; bestaande Flame/Frost in js/weapons.js |
| Mikken, voorspellen, swept hit | js/weapon-aim.js |
| Living World en permanente conquest | js/world-state.js, js/living-world.js |
| Reactief terrein, elementreacties, verdediging | js/world-retaliation.js, js/world-visuals.js, js/world-defense.js |
| Adaptatie vijanden en Guardian | js/enemy-adaptation.js, js/guardian-adaptation.js |
| Boss-isolatie / bijzondere patronen | js/boss-isolation.js, js/boss-combat.js |
| Specifieke bosses | js/beau-encounter.js, js/shade-encounter.js, js/bell-encounter.js, js/meme-encounter.js |
| Teams, waves, encounters, telegraphs | js/encounter-pacing.js, js/encounter-rhythm.js, js/encounter-tactics.js, js/enemy-archetypes.js |
| Movement, feedback, rendering, geluid | js/player-movement.js, js/hit-feedback.js, js/render.js, js/audio.js |
| Sandbox / testen zonder permanente save | js/developer-mode.js |
| QA, progressie, storage | tests/, .github/workflows/, js/progression.js, js/storage.js |

**README.md beschrijft deels een oudere spelversie** en bevat bijvoorbeeld oude wapen- en evolutieclaims. Vertrouw voor actuele gameplay méér op de live code + tests + dit kompas + MILESTONE-30.md. Maak documentatie weer consistent wanneer dat bij de update hoort.

## 5. Ontwikkelstrategie: 100 updates als richtlijn, maar geen nepvoortgang

We hebben een **ruwe ambitie van circa 100 kleine/medium updates** voor een eerste goede spelversie besproken. Het is geen bindend eindgetal. De huidige grote tussenmijlpaal is **Update 30 — Combat & Gameplay 2.0**: een volledige 25–30 min Standard-run die technisch betrouwbaar, uitdagend, fair en fijn aanvoelt.

**Actuele afgesproken roadmap (na Update 25):**
- **20 — AFGEROND (CI groen, browser-VFX-test nog open):** Eigen visuele accenten voor de negen huidige elementwapens, met render-culling en kwaliteitslimieten.
- **21 — AFGEROND (CI groen, browser-test open):** Drie kleine, echte same-element cross-weapon combo's met een begrensde bonus en overzichtelijke evolutiepaden op upgrade-/supportkaarten.
- **22 — AFGEROND (CI groen, speeltest open):** Difficulty komt uit taktische teamstatistieken en nog leesbare timings, niet extra Nightmare-vijanden. Flame Orbit en Frost-slow tegen bosses begrensd.
- **23 — AFGEROND (CI groen, browsertest open):** Permanente rifts tonen duidelijke aanvallen, herhaalde oplaadwaarschuwingen van 0,95s, zichtbare veilige tussenfases, ook op Low graphics, en ontstaan zonder onderlinge overlap.
- **24 — AFGEROND (CI groen, browsertest open):** Zes rivaliserende world fronts, duidelijke veroveringsstatus en uitkomst in HUD en resultscherm, kleine tactische terreinconsequenties voor native defenders op invaded ground. Alleen final victory verandert de opgeslagen dominante wereld.
- **25 — AFGEROND (CI groen, browserflowtest open):** Standard volgt exact Beau → The Mourning Shade → The Bell Tower → The Last Meme. Finale expliciet afgeschermd tot 3 echte bosskills én 25:00; soloarena en post-boss herstel, echte eenmalige rewards. In Endless na de finale restart de gewone Guardianrotatie bij Beau.
- **26:** Boss attacks — moeilijkheid, timings, spectaculariteit.
- **27:** HUD en combat-UI: leesbaarheid.
- **28:** FPS, performance, memory en stabiele spawns.
- **29:** Volledige Normal-run(s), bugs en polish.
- **30:** Mijlpaalreview: Combat & Gameplay 2.0 en besluit over volgende fase.

Updates 11–19 zijn afgerond in de **planning**, maar speeltests staan bij meerdere onderdelen nog open. Houd een strikte scheiding tussen **code afgerond**, **CI groen**, **browsertest gedaan** en **spelgevoel bewezen**. Geen vooruitgang claimen zonder bewijs.

**Laatste stand:** Update 19 verbeterde de echte elementwapens, Update 20 bouwde hun cosmetische VFX-basis, Update 21 bracht drie kleine same-element combo's en evolutiefeedback, Update 22 maakte difficulty tactischer zonder hordespam, Update 23 gaf hazard-herlaadwaarschuwingen en niet-overlappende rifts, Update 24 maakte invasiegevolgen tactisch merkbaar. **Update 25 is technisch afgerond**: nieuwe js/boss-flow.js centraliseert de bossvolgorde (Beau → The Mourning Shade → The Bell Tower → The Last Meme), beschermt het laatste gevecht tot 3 echte Guardian-overwinningen na minuut 25, en herstart Endless-bossrotatie met Beau in plaats van Shade. Boss HUD noemt het volgende doel. Boss-isolatie beschermt arena zonder reguliere vijanden en geeft een herstelpauze van minimaal 12s (Standard) / 8s (Endless) voor nieuwe waves na gevechten. Rewards/wereldpersistentie alleen via reeds bestaande echte kill/victory-flow. **422 tests groen; browsertest van volledig bosseschema/loot/Endless nog open.** De maker wil effecten voorlopig als functionele basis; definitieve VFX-poolish later. **Volgende: Update 26 spectaculaire, uitdagende, leesbare boss signature-attacks en arena-transformaties.**

## 6. Samenwerking en de 'vibe' die moet meegaan naar de volgende chat

Communiceer **in het Nederlands**, informeel, als een enthousiaste co-creator. De gebruiker praat graag met woorden als **maat, bro, neef, chef, happa, volgendeeee**. Een energieke stijl mag, zolang de inhoud scherp blijft. Geen stijve projectmanagerpraat, geen eindeloze herhaling, geen nep-enthousiasme over half werk. Juist de combinatie van **creatieve ambitie + technische uitvoering + eerlijke feedback** maakt de samenwerking leuk.

Praktisch werken we zo:
1. De maker zegt bijvoorbeeld **'volgende update'**. De AI controleert **eerst de actuele GitHub-branch**, de huidige roadmap en de actieve gameplaycode.
2. De AI bouwt de volgende **afgesproken update echt**, met een concrete zichtbare/spelbare verbetering. Niet alleen ideeën opschrijven of een plan geven als uitvoering gevraagd wordt.
3. Zo nodig worden **gerichte tests** toegevoegd. Controleer JS-syntax en de bestaande suite/CI. Een melding 'tests groen' is uitsluitend juist als die checks daadwerkelijk succesvol draaiden.
4. Werk normaal op **feature/living-world-prototype** of de later overeengekomen werkbranch. **Niet ongemerkt naar main overschakelen**, niet blind mergen of force-pushen. Controleer de actuele head vóór writes.
5. Werk bij dezelfde update óók **MILESTONE-30.md en DIT PROJECT-KOMPAS** bij, met correcte voortgang en nieuwe belangrijke ontwerpbeslissingen/feedback. Houd dat bij voorkeur in dezelfde werkcyclus.
6. Rapporteer bondig: **Update N / 30**, **X/20 en percentage planningsvoortgang**, wat er echt veranderd is, bewijs/tests, welke browsertest nog openstaat, volgende update.
7. De maker **test zelf** en geeft feedback. Bugs, ontbrekende trefzekerheid, te makkelijke bosses, verkeerde loadouts of ontbrekende sfeer moeten serieus worden genomen — pas aan, niet wegredeneren.
8. Kleine extra correcties mogen met een lopende update mee als de gebruiker daarom vraagt. Een reparatie wordt **niet artificieel als extra update geteld**. Houd de teller eerlijk.

**Belangrijk:** AI kan GitHub niet zelfstandig tussen chats door controleren of bijwerken. Dit bestand wordt bijgewerkt **wanneer er in een actieve chat een update wordt uitgevoerd**, niet automatisch op de achtergrond. In een nieuwe chat: vraag de AI expliciet beide documenten te lezen en in toekomstige updatecommits bij te werken.

## 7. Checklist voor iedere toekomstige game-update

- [ ] De huidige branch/head en MILESTONE-30.md gelezen.
- [ ] Zeker dat de beoogde feature **speelbaar/bereikbaar** is vanuit het huidige element-/runmenu.
- [ ] Geen fundamentele visie of eerder besloten beperking stilzwijgend teruggedraaid.
- [ ] Relevante code, scriptvolgorde en oude tests op regressies gecontroleerd.
- [ ] Nieuwe tests/CI-resultaten eerlijk vermeld; browsertest niet als gedaan voorgesteld als alleen Node-tests liepen.
- [ ] MILESTONE-30.md geactualiseerd met bewijs, voortgang en open punten.
- [ ] PROJECT-KOMPAS.md geactualiseerd **indien status, ontwerpbeslissing, architectuur, spelvisie of open risico veranderde**; werk ten minste het statusblok en logboek bij bij elke update.
- [ ] Afgeronde update aan de gebruiker samengevat inclusief de echte progressiestand.

### Update-log voor contextoverdracht (nieuwste bovenaan)
Gebruik per update dit compacte stramien en bewaar de belangrijkste beslissingen. Laat oude commits het technische detail leveren.

**18-10-2026 — Update 25: Boss Flow Overhaul technisch afgerond**
- Werkbranch: feature/living-world-prototype. Nieuwe **js/boss-flow.js** (route, tijd, Endless reset, recovery floor); wijzigingen in js/enemies.js, js/boss-isolation.js, js/game.js, index.html, en nieuwe tests/update-25-boss-flow.test.cjs (10 tests); oude boss tests zijn bijgewerkt.
- **Canonieke Standard-volgorde:** Beau de Hond → **The Mourning Shade** → **The Bell Tower** → **The Last Meme**. Eerste 3 Guardians echt verslaan vóór de finale. The Last Meme komt pas **na 25:00 en 3 bosskills**; Developer Mode mag een finale opzettelijk snel testen zonder de normale Standard-route te wijzigen.
- **Gefixte Endless-rotatie:** na de The Last Meme victory telt de finale als boss #4; zonder fix sprong boss #5 naar Shade. Nu start Endless na zo'n victory met Beau (#5), daarna Shade (#6), Bell (#7), opnieuw Beau (#8). Een verse Endless-run begint eveneens met Beau. HUD noemt de eerstvolgende Guardian met canonieke naam.
- **Eerlijke boss-arena:** geen gewone enemyspawns/waves/patrols/world-defense; alleen bestaande boss-summons. Bij begin en einde worden vijanden, minions, enemy/boss-shots en lokale terreinscars zonder XP of extra kills opgeschoond. Een timer die tijdens de bossfight bijna negatief is geraakt krijgt na het duel nog **12s Standard / 8s Endless** om geen verrassingswave direct na boss-reward te geven; normale langere timers blijven staan. Dit is een herstelvloer, niet extra spawnspam.
- **Loot en progressie onveranderd:** awardBossLoot, final victory bonus, one-run-record-idempotentie en permanente world conquest lopen nog steeds via bestaande echte bossdeath/final-victory code. De nieuwe helper kent geen gratis loot, vijanden of damage. Dubbele hit op een dode boss levert niets op.
- **Bewijs:** GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39155406864 — **422/422 automatische tests geslaagd**, 0 fouten. Nieuwe tests draaien echte boss constructors, gates, een bossdeath/trophy, soloarena met minions, cleanup, Endless rotatie, HUD namen en bekende win/endless-regels. Browser-flow tot einde blijft open.
- **Mijlpaal Update 30: 15/20 = 75% geplande updates**, geen claim dat het hele spel subjectief 75% af is.
- **VOLGENDE UPDATE 26 — uiterst belangrijke visie:** bosses zijn **solo-gevechten met heel veel HP**, behoud 1–2 gewone attacks maar voeg meerdere echt spectaculaire, gevaarlijke **Guardian Powers** toe. Combineer **arena-transformaties + gigantische aanvallen**; attacks moeten gericht op de speler zijn of afsnijden/area denial doen, met *duidelijke maar spannende* dodge-telegraphs. Geen losse spam-vijanden (alleen door de boss zelf gesummonde minions). Graphics mogen basis-Canvas VFX zijn maar wel opvallend; geen eindpolish nodig.
- **Test later live:** een volledige 25–30 minuten Normal run voor boss-volgorde/tijden/rewards en alle vier solo-fights; claim dat niet als afgerond.

**18-10-2026 — Update 24: Living World Consequences technisch afgerond**
- Branch: feature/living-world-prototype. Nieuwe **js/world-consequences.js** (leesbare gevolgen, geen bron van waarheid voor saved world), geïntegreerd in **js/world-state.js**, **js/game.js**, **js/controls.js**, **index.html** en **styles.css**. Tests: tests/update-24-world-consequences.test.cjs (10 nieuwe).
- Zes ordered invasies kregen elk **drie eigen worldfrontnamen** bij de earned boss thresholds van 15%, 50%, 85%. Bestaande 18 elemental reactions, max. 24 blijvende hazard zones en alle bestaande defenders/faction-affiniteiten blijven.
- De HUD toont verdedigende versus invader wereld, territory percentage en front, hoeveel rifts en squads er zijn en het element van de grond waar de speler staat. De status wordt beperkt geüpdatet (één keer per 0,4 game-seconde), niet op elke frame.
- **Nieuwe tactische consequentie, begrensd**: reguliere levende verdedigers met de native-world affinity krijgen op echt veroverde terreinpatches in drie fases speed multipliers 0,94/0,91/0,88. Native terrain behoudt de oorspronkelijke affinityvoordelen. Bosses, summons, dead, foreign affinity, zelfde invader/original en herstelde/world-conquered runs uitgesloten. Geen passive damage of extra vijanden.
- Na echte Beau, Shade en Bell Tower overwinningen verschijnt één gededupliceerde **THE WORLD FIGHTS BACK**-melding met de unieke frontnaam. De originele bossstage- en conquestregel blijft ongewijzigd; geen gratis opmars.
- **THE WORLD REMEMBERS** in Victory/Game-Over panel noemt originele world, invader, hoogste earned percentage en of world saved / reclaimed is. Verliezen schrijft niet naar local saved dominant world. Finale winst verandert deze wereld wél. De resultssummary telt verdiende bossstages ook als de 1,9 s cosmetische overgang nog niet voltooid is (fix in `restorationPeak`).
- Bewijs: GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39154500366 — **412/412 tests geslaagd, 0 gefaald**. Niet doen alsof een echte complete 25–30 min browser-run automatisch bewezen is.
- Mijlpaal: **14/20 = 70% van de geplande updates**, niet een kwaliteitsscore.
- Open QA: duel Fire/Water/Frost tegenover elk van de andere werelden, 15/50/85% overgang, native/invader patches vergelijken, Game-Over versus Final-Victory resultaat, readability van HUD op klein scherm en daadwerkelijk speelgevoel na >15 min.
- **Volgende: Update 25 — boss-flow/arena-isolatie/beloningen** en vervolgens Update 26 voor extreem spectaculaire, maar leerbare boss-signature-aanvallen. Bosses moeten vooral géén gewone vijanden in hun soloarena krijgen tenzij de boss zelf minions summon.
- **Makerafspraak**: VFX-polish hoeft nu nog niet perfect te zijn; geef prioriteit aan complete, begrijpelijke, uitdagende gameplay.

**18-10-2026 — Update 23: Terrain Hazards Overhaul technisch afgerond**
- Branch: feature/living-world-prototype. In js/world-retaliation.js krijgen alle zes elementparen op elk van drie conqueststadia een expliciete hazardfase. De reacties zelf (18), fases 15%/50%/85% en permanente rifts blijven ongewijzigd.
- **Fix voor oneerlijke schade:** zwaar terrein dat elke 3,8 gameseconden gedurende 1,05 seconde uitbarst, waarschuwt **ook voor herhaalde** eruptions vanaf 0,95 seconde vóór de volgende burst. Eerst waarschuwden alleen nieuw ontstane zones. Danger is pas actief nadat de countdown afloopt.
- Op het Canvas betekenen **krimpende heldere ringen: waarschuwing**, **volle gekleurde zone met centrumring: actief**, **dof/gestippeld: een burst is in rustfase en momenteel veilig**. Ook op Low zijn de basiswaarschuwingen zichtbaar; high krijgt extra elementdetails. js/render.js geeft de viewport door om offscreen-rifts niet te tekenen.
- Nieuwe rifts worden in oplopend ruimere ringen geplaatst zonder op oude gevarenzones te stapelen of direct op de speler te ontstaan. Alle 24 permanente fasezones blijven technisch mogelijk. Boss-isolatie blijft gerespecteerd; rift-timers pauzeren tijdens bosses. Wapen-terreinsporen worden niet plots gevaarlijk.
- Leesbaar inspecteerbaar in getWorldRetaliationStatus(): warningPhase, secondsUntilChange en currentlyDangerous. Dit geeft developer/browser-QA precieze fase-informatie.
- Bewijs: **402/402 geslaagde automatische tests** en syntax groen: https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39151060369. 11 nieuwe tests dekken alle 18 reacties, warning → active, repeat/recovery/charge, Low waarschuwingen, afstandsculling, 24 zones zonder overlap en pausestand.
- **Nog niet bewezen:** echte browser-vibe / dodgemogelijkheid, 2×/3× speed, meerdere rifts op het scherm, visuele prioriteit naast andere aanvallen, late-run performance en een volledige 25–30 min Standard-run.
- Mijlpaal: **13/20 = 65% van geplande updates**, géén subjectieve gamekwaliteit.
- **Volgende Update 24:** de gevolgen van invasie-element versus verdedigde wereld, bosswins en dynamische terreingedragingen duidelijker merkbaar maken; geen grote eind-VFX-polish of nieuwe vijandenspam.

**18-10-2026 — Update 22: Weapon & Enemy Balance technisch afgerond**
- Werkbranch: feature/living-world-prototype. Nieuwe js/combat-difficulty.js; wijzigingen in js/enemies.js, js/encounter-pacing.js, js/world-defense.js, js/game.js, js/elemental-combat.js, index.html en tests.
- **Visie bevestigd: moeilijke gevechten = gevaarlijke kleine teams, niet méér vijandenspam of onnatuurlijk veel HP.** Normal blijft de baseline; Easy heeft lagere squadstats en langere, goed leesbare ranged/burstwaarschuwingen; Nightmare krijgt iets scherpere timing en gevaarlijkere teams, maar **niet meer gelijktijdige vijanden of meer ambient spawns** dan Normal.
- Nightmare-HP factor verlaagd 1,28 → 1,16 (boss 1,20 → 1,16), terwijl ploegstats een beetje stijgen; normaal vijandenschadeprofiel Nightmare blijft 1,18. Ranged waarschuwing minstens 0,64 s, Burstling 0,86 s, schild laat een echt countervenster. Easy telegraphs zijn rustiger. Geen nieuwe enemy types, geen andere bossvolgorde, geen gratis XP.
- **Wapenbijstelling, beperkt tot twee duidelijke uitschieters:** Flame Orbit heeft ×0,82 hitdamage tegen bosses (gewoon vijanden niet), Frost-slow bosses ×0,78 movement in plaats van ×0,48 (gewone vijanden behouden ×0,48).
- Tests: 10 extra regressietests, 1 oude difficulty-snapshot bijgewerkt. **391/391 groen, 0 fouten** in https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39150233474. Dit bewijst codeverhoudingen/integratie, NIET de subjectieve ervaring.
- Open QA: een vergelijkbare Easy/Normal/Nightmare-run (liefst ook over minuut 15), Frost tegen Guardian, Flame Orbit dichtbij een boss, reactietijd ranged/burst en impact van de kleinere Nightmare density. Geen volledige Standard-run bewezen.
- Mijlpaal: **12/20 = 60% geplande updates**, NIET het gamekwaliteitpercentage.
- **Volgende: Update 23 — terreintelegraphs en eerlijke reactietijd.** Uitgebreide cosmetische weapon-VFX-polish later.

**18-10-2026 — Update 21: Elemental Synergy & Evolution Feedback technisch afgerond**
- Werkbranch: feature/living-world-prototype. js/elemental-synergy.js is toegevoegd; js/elemental-combat.js, js/weapons.js, js/game.js, js/upgrades.js, index.html en tests zijn bijgewerkt.
- De negen selecteerbare elementwapens kunnen combinaties maken door **afwisselend verschillende wapens van hetzelfde element op dezelfde vijand** te raken. Fire = **IGNITION** (kleine schade-/brandbonus), Water = **UNDERTOW** (kleine schade-/knockbackbonus), Frost = **SHATTER** (kleine schade-/chillbonus).
- Combo-markeringen verlopen na 3 seconden; max 1 bonus per vijand per 1,25 seconden. Bonus beperkt tot 12 damage op normale vijanden en 4 op bosses. Geen bonus door herhaald schieten met hetzelfde wapen, geen cross-element bonus, geen gratis evolution of XP. Bij een echte combo is er een korte, gekleurde tekst bij het doel, met globale throttling.
- Het upgrade-/supportmenu toont nu **concrete** voortgang voor wapenlevel, supportlevel, boss vereiste en tijdmijlpaal plus combo-partners. Echte evolutie-supports worden bescheiden vaker aangeboden. Twee evoluties blijven volledig verdiend en pas vanaf 10:00 en 17:00 mogelijk.
- Voorafgaand makerbesluit: Update 20-VFX hoeven nu alleen te bestaan; het is een **basis**, geen finale art pass. Schuif uitgebreide graphics-polish naar later in plaats van Update 21 ermee te blokkeren.
- Bewijs: https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39149296644 — **381/381 tests groen, 0 fouten**. Totaal 9 nieuwe tests voor Update 21 en één aangepaste oude regelassertie.
- **Nog niet bewezen:** browser-feel en balans van de drie combo's, progressiescherm in echte run, twee realistisch behaalde evoluties, 25–30 minuten complete run. Ga dat niet als afgerond presenteren.
- Mijlpaal: **11/20 geplande stappen = 55%** (géén subjectief kwaliteitspercentage).
- **Volgende: Update 22 — wapen-/vijandbalans Normal/Easy/Nightmare**, uitsluitend actieve Fire/Water/Frost-wapens en eerlijke groepsgevechten.

**18-10-2026 — Update 20: Elemental Weapon VFX technisch afgerond**
- Werkbranch: feature/living-world-prototype. Nieuwe visual-only module: js/weapon-vfx.js; de andere wijzigingen staan in index.html, js/elemental-combat.js, js/weapons.js, js/render.js en tests/update-20-weapon-vfx.test.cjs.
- Visie toegepast: alleen de negen actuele Fire-, Water- en Frost-wapens zijn verrijkt; geen terugkeer naar niet-selecteerbare Arcane/Boomerang, geen automatische balans- of schadeverandering.
- Effecten: Fireball-comettrails/explosies, Flame Cone-vuurstrengen, Flame Orbit-gloed; Water Bolt-stroming, Tidal Wave-schuim, Whirlpool-spiralen; Frost Orb-kristallen, Ice Shards-afterimages en Glacial Pulse-ijsspaken.
- Bewijs: 372/372 tests geslaagd in GitHub Actions https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39148015522, waaronder 7 nieuwe VFX-tests. De module cullt buiten beeld, houdt effecten beperkt en schaalt tussen Low/Medium/High.
- **Nog niet bewezen:** browser-feel, visuele leesbaarheid bij drukke gevechten, impact bij bosses, 2×/3× en gemeten FPS. Test door de maker is nodig.
- Mijlpaal: **10/20 = 50% van de geplande updates**, geen kwaliteitspercentage.
- **Volgende: Update 21 — huidige elementwapens en evoluties: keuzegevoel, synergie en upgradefeedback.**

**18-10-2026 — Initieel overdrachtsmoment / na Update 19**
- Branch: feature/living-world-prototype; geverifieerde head vóór aanleg: 65f0700.
- Laatste update: 19, inclusief fix voor de negen echte Fire/Water/Frost-wapens.
- Roadmap: 9/20 = 45% van geplande stappen naar Update 30.
- Tests: CI groen; milestone vermeldt 365 geslaagde automatische tests na de fix. Volledige Normal-runs en daadwerkelijke balans-/feeltests nog open.
- Belangrijkste ontwerpwaarschuwing: **Arcane Bolt en Boomerang niet als huidige normale wapens behandelen**.
- Volgende: **Update 20 — Weapon VFX**, met focus op leesbare, spectaculaire visuele feedback van de huidige elementwapens.
- Nog open voor milestone: echte volledige bossreeks, twee behaalde evoluties in Normal, balans van moeilijke tactische gevechten, boss-spectaculariteit, late-game FPS en meerdere echte runs.

## 8. Voor de volgende AI: wat te doen bij het eerste bericht

**Als de maker zegt 'we gaan verder met de game' of 'volgende update':**
1. Open de GitHub-repo en verifieer de **nieuwste** branch/head. Begin niet automatisch met oude main.
2. Lees PROJECT-KOMPAS.md én MILESTONE-30.md volledig, inclusief nieuwste log en correcties. De status in deze tekst is een **momentopname**; recente commits kunnen intussen verder zijn.
3. Bekijk de bestanden die het volgende geplande onderdeel in werkelijkheid aansturen.
4. Respecteer de visie: **Living World, vijanden als wereldverdedigers, drie wapens per element, boss-isolatie, spectaculaire Guardian Powers, vaardigheidsgerichte gevechten, echte speeltests en onze informele samenwerking**.
5. Voer de gevraagde update uit in GitHub, check tests en werk **beide documenten** mee bij.
6. Vraag de maker niet eerst om de hele vorige chat opnieuw uit te leggen. Dit document bestaat juist om dat te voorkomen.

**De kern in één zin:** bouw geen generieke Vampire Survivors-kloon met méér chaos; bouw een grappig-duistere survivor waarin de **wereld terugvecht, de speler haar verandert, de bosses memorabel zijn en iedere update merkbaar dichter bij een bijzonder spel brengt**.
