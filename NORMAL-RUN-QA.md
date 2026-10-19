# Update 29–31 — Normal run QA: echte speeltest, gescripte dekking en lokale runtime-telemetrie

> **LIVE UPDATE 31 (18 oktober 2026):** De maker leverde twee echte complete browser-JSONs aan: Frost Standard Normal Victory 28:01 (sandboxflag true, maar expliciet géén developer-tools gebruikt; sandbox onderdrukte normale bossrewards) en **Water Standard Normal Victory 26:44, sandboxflag false** (vier Guardians verslagen, twee earned evoluties exact 10:00 en 17:00, drie gewone bossrewards, gemiddelde 143,78 FPS op High). **Update 31 nu technisch én live QA afgerond**; M1/M2 Water aangetoond, M3–M6 slechts gedeeltelijk, **release nog NO-GO**. Zie [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md) en [ROADMAP-31-50.md](ROADMAP-31-50.md). Oudere tekst hieronder over 'nog geen live-run' is historische stand vóór ontvangst van de resultaten.
**Update-31-runtime-QA:** lokale JSON-recorder nu technisch gebouwd, met echte upgrade-aanbiedingen, gemaakte keuzes, levels, bossfases en browser-FPS. **Volg [RUN-TEST-31.md](RUN-TEST-31.md)** voor de eerste menselijke Normal-speeltest en expliciete export. De checklist hieronder blijft OPEN totdat daadwerkelijk bewijs is geleverd.

**Stand: 18 oktober 2026. Branch:** `feature/living-world-prototype`

## Wat is bewezen?
- Automatische CI op de nieuwste gameplayfixes: **462 tests geslaagd, 0 gefaald**, zie https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39159657297.
- Nieuwe `tests/update-29-full-normal-run.test.cjs` voert **een versnelde, deterministische campagne-replay** uit met **ECHTE JS-functies** voor bossconstructors, `damage()` / bossdeath, world stages, evolution-eligibility, `evolveWeapon()`, `showVictory()`, `continueEndlessAfterVictory()`, `end()` en het opslaan van de run.
- Fire / Water / Frost: drie gewone Guardians, twee geconfigureerde *verdiende* evolution-prerequisites met tijdgates 10:00 en 17:00, finale pas na 25:00, Victory na 26:40, en een blijvende veroverde wereld.
- Tests verifiëren geen gratis derde evolutie, geen vroegtijdige final-boss, geen dubbele overwinning of runrecord na Endless, en correcte terugkeer naar de verdedigde wereld bij verlies.
- Twee echte, kleine fouten gerepareerd: **Game Over na een gewonnen Standard-run + latere Endless-dood noemt nu de werkelijk veroverde wereld**; en **achtergebleven schade in dezelfde simulatietick als The Last Meme-kill kan het Victory-scherm niet meer overschrijven**, terwijl doodgaan in Endless daarna nog wel kan.
- Het replay-script **springt bewust over simulatiekloktijden** en stelt voor de evolutietests vereiste wapen-/supportlevels direct in. Daarmee test het de *regels en overgangen*, NIET of de speler in een echte run genoeg XP en aangeboden upgrades kan krijgen, of de bossgevechten kan winnen, of de game 26 minuten stabiel blijft draaien.

## Verplicht voor handmatige browservalidatie vóór een echte Gameplay 2.0 release
Start op **Normal, 1×** met standaard, zonder Developer God Mode. Noteer tijd, character, element, wapens, FPS (wanneer ingeschakeld) en duur. Herhaal kritieke checkpoints op 2× / 3× en met Low / High graphics waar mogelijk.

| Checkpoint | Concrete acceptatie-eis | Stand |
|---|---|---|
| 00:00–03:00 | Starter werkt, gekozen element heeft uitsluitend de 3 selecteerbare Fire/Water/Frost-wapens; geen Arcane/Boomerang in level-up | Open: browsertest |
| ~03:00 — Beau | Alleen Beau en eigen summoned minions; zichtbare, ontwijkbaar aangekondigde attacks; echte kill geeft één beloning en 15% wereldimpact | Open: browsertest |
| ~06:00–10:00 — Shade | Geen reguliere spawn tijdens boss, geen onmiddellijke catch-up wave, geen onterechte boss damage | Open: browsertest |
| 10:00 — Evolution 1 | Alleen bij wapen 5 + support 3 + één verslagen boss; werkelijk verdient via levels, niet Developer edits | Open: browsertest |
| ~09:00–17:00 — Bell | Derde gewone boss; 50%/85% wereldfront; alle hoofdtelegraphs en vooral fase 3 overlap eerlijk | Open: browsertest |
| 17:00 — Evolution 2 | Tweede wapen 5 + juiste support 3; tweede maar **geen derde** evolution in Standard | Open: browsertest |
| 17:00–25:00 | Voelbare uitdaging maar geen horde-spam; hazardwarnings en counters leesbaar; FPS/draw/AI/collision niet verslechteren | Open: browsertest |
| 25:00+ — The Last Meme | Pas na drie earned Guardians; start solo; vier-fase/bestaande showcase + nieuwe Reality Fracture niet oneerlijk gestapeld | Open: browsertest |
| Victory ~25–30min | Win exact één keer; Final Victory bonus en één record; wereld permanent 100% veroverd; modal blijft staan bij late projectile-hit | Regels getest; browsertest open |
| Continue Endless | Verandert **dezelfde** run naar Endless, zelfde build/HP; eerstvolgende ordinary boss is Beau en geen tweede winbonus | Regels getest; browsertest open |
| Endless Game Over | Toont *de veroverde invaderwereld*, 100% peak en correct runrecord; echte doodgaan blijft mogelijk | Regels getest; browsertest open |
| Standard defeat | Bewaard oorspronkelijke verdedigende wereld, hoogste verdiende percentage in summary; geen Victory/Endless unlock | Regels getest; browsertest open |

## Herhaalbare extra QA
- **Drie elementen / zes wereldparen:** start Fire/Water/Frost tegen een andere dominante wereld en let op werkelijk bewoonde terreinen, speciale combinaties, rifts en defender pressure.
- **Drie moeilijkheidsgraden:** op Easy en Nightmare vergelijk boss telegraph timing en tactical teams met Normal; geen extra Nightmare-vijanden voor schijnmoeilijkheid.
- **Boss fase III + 2×/3×:** controleer bereikbare veilige routes bij Beau, Shade, Bell en Meme. De turquoise pijl zegt alleen “safe from THIS power”; andere attacks kunnen de route kruisen. Video/screenshot met exacte boss en tijd is nuttig bij fouten.
- **Memory / FPS:** vergelijk een zware golf, een boss en een drukke terreinzone, bij Low/Medium/High. Neem de echte P95-frame, AI-, hit- en draw-tijden op. Node-regressies bewijzen geen numerieke FPS-winst.
- **Refresh/start opnieuw:** saved world en earned trophies/records blijven, tijdelijke conquest/scars verdwijnen; geen blijvende sandbox rewards.

## Update 38.1 — Normal moet leerbaar maar voor beginners moeilijk zijn

**ACTUEEL — UPDATE 38.1: NORMAL MOET JE VERDIENEN (19 oktober 2026).** Makerdoel: een nieuwe speler wint doorgaans niet in de eerste Normal-runs; verlies moet leerzaam, zichtbaar en te voorkomen zijn door beter dodgen, Guardian-patronen kennen en actief health pickups zoeken. **GEEN** verborgen winstblokkade, gegarandeerde dood, nep-hits of healing-nerf. Code: gewone Normal enemy-damageramp begint vanaf **4:00 (voorheen 5:00)** en bereikt dezelfde cap **1,65× op 22:00 (voorheen 25:00)**. Guardian normale salvo-cooldowns versnellen gecontroleerd in fase I/II/III met factoren **0,97 / 0,89 / 0,83** (Nightmare nog sneller), minimum **1,35s**; bestaande warningtijden, signature-ultimates en recovery blijven. **Easy onveranderd**, Vitality en healing pickups blijven. Difficulty-menu legt beginner vs Normal uit. Nieuwe regressietests: **578/578 CI groen vóór documentatiewijzigingen**. [UPDATE-38-1-NORMAL-MASTERY.md](UPDATE-38-1-NORMAL-MASTERY.md). **Geen recente menselijke browserrun na deze build**, dus novice-winrate, feel en release-acceptatie nog OPEN. De gevraagde Update 39 blijft drie complete Normal-runs Fire/Water/Frost met UX-fixes; niet doen alsof 39 door deze hotfix klaar is.

**Makercheck volgende echte run:** speel Standard Normal 1× met QA recording aan en Developer Mode uit. Kijk vooral naar gewone enemy-hits en ontvangen damage in minuten 5–10, 10–15, 15–20 en 20–25; naar health pickups en hoeveel pogingen elke Guardian vraagt; en of de snellere fase II/III normale salvo's *nog steeds goed te lezen en te ontwijken zijn*. De latere pass/failcriteria zijn *skill-based difficulty* en plezier, niet een geprogrammeerd verplicht aantal nederlagen. Vergelijk met de historische Water 26:42/21 hits/334 damage, maar dit was nog vóór 37.2, 38 en 38.1.

## Update 38 — All Nine Weapons maker-heracceptatie OPEN (19 oktober 2026)

**Technische 9×4 vijandrollenmatrix en 37.2 bosspressure/healing samen aanwezig; minstens één echte non-sandbox complete Fire/Water/Frost Normal-run per element nodig.** [Volledig testprotocol Update 38](UPDATE-38-ALL-NINE-WEAPONS.md). Vergelijk Water Bolt Rate V, Riptide, resized wet trails, echte hits per 5m, `hit.source` en health pickup loop met oude Water 26:42/21 hits/333,86 damage. Test Frost Orb op Rate V: herhaald Glacier-koude-effect mag geen perma lockdown geven; Ice Shards/Crystal Storm en Glacial Pulse/Absolute Zero houden hun eigen slows en twee verdiende evoluties. Fire heeft nog geen eerlijke complete non-sandbox baseline. **Geen live-GO op basis van tests alleen**; Update 39 levert 3 gedocumenteerde elementruns op.

## Update 37.2 — Water/Healing/Boss-pressure re-test OPEN (19 oktober 2026)

**Nieuwe non-sandbox Water-run van maker: 26:42 Victory, 21 hits, 333,86 damage; 369,6 healing en twee hits tussen 15:00–25:00.** De maker wil meer echte hits, meer damage, *betere herstelopties die hij actief moet zoeken* en echt moeilijkere secundaire bossaanvallen. [37.2 ontwerp/implementatie](UPDATE-37-2-REAL-PRESSURE.md). Bij de eerstvolgende non-sandbox browserrun: check boss locktracking 0,57s, centre/flank warnings, geen onmogelijke 1×/3× overlap met oude ultimates, hits per 5min, damage per bron in nieuw `hit.source`, Water Bolt DPS/soak/pierce, normale enemy pursuit en groen heal-loot bij echte kills wanneer speler <83% HP is. **Balance live acceptance OPEN, ongeacht groene Node-tests**.

## Update 37 — World, Save & Endless, technische test PASS / maker-browsercheck OPEN (19 oktober 2026)

**559/559 Node-/integratietests groen op code na Update 37; menselijk geklikte browsertest nog OPEN.** [UPDATE-37-WORLD-SAVE-ENDLESS.md](UPDATE-37-WORLD-SAVE-ENDLESS.md) bevat alle technische bevindingen. Belangrijkste concrete fix: save-versie 4 houdt Fire/Water/Frost-loadouts en worldBefore/runElement/worldAfter/worldImpact nu ook na **refresh** vast. Personal Records toont de wereldreis. Gewonnen Standard → Endless blijft één runrecord; een tweede terminal callback kan geen dubbele punten/records maken. Een onbeschikbare localStorage wordt niet langer “100% permanent” genoemd. Water/Fire/Frost wapenimpact blijft éénmaal in de World history bewaard. Test later handmatig: (a) 15/50/85% invasie en nederlaag, originele wereld na refresh; (b) echte Standard Win, nieuwe dominante wereld én runhistorie na refresh; (c) via Victory CONTINUE ENDLESS,zelfde build/HP/XP, geen dubbel record/bonus, en sterf om te controleren; (d) terugkerende Beau-trofee zonder dubbele beloning. **Update 36.1 Water/Guardian-difficulty-feel blijft apart OPEN en mag niet stilzwijgend als opgelost worden beschouwd.**

## Update 35 — nieuwe enemyrollen live QA OPEN (19 oktober 2026)

**539/539 Node-tests geslaagd**, maar **nog geen nieuwe browserplaytest nadat Anchor/Stalker/Warden zijn ingebouwd**. In een volgende non-sandbox Standard Normal Water-run: **na ca. 6:00 Anchor**: verankerde voeten, Whirlpool duwt nauwelijks, Bomb breekt tijdelijk pantser en hij blijft gewoon damage krijgen; **tactische Pouncer-teams Phase Stalker**: herken twee afterimages, reageer op de 0,86s diagonale dash-waarschuwing en benut 1,6s kwetsbare recovery; **vanaf ca. 12:00 Ward-Bulwark Warden**: zichtbaar turquoise schild met maximaal twee echte beschermlinks, beschermde vijanden worden minder door Water geslingerd totdat schild zakt of Warden verslagen is. QA-JSON bevat per 30 game-seconden `counterRoles.anchor`, `counterRoles.phaseStalker`, `counterRoles.warden`; Low en High moeten beide begrijpelijk zijn. Test ook 1×/3× en komende waves zonder grote FPS-stutter. [UPDATE-35-ENEMY-COUNTERS.md](UPDATE-35-ENEMY-COUNTERS.md) bevat exacte verwachtingen. **Water/Vitality 32.1, bossfights 33/34, Fire/Frost en save/Endless release-gates blijven OPEN.**

## Update 34: nieuwe Bell/Meme normale aanvallen — live QA OPEN

**Technische controle:** nieuwe module `js/guardian-late-secondary.js`, **527/527 Node-tests groen**. **The Last Meme zijn geliefde finaleaanval blijft onaangeraakt**. Bij Bell Tower graag **CLAPPER'S VERDICT / SPLIT HOUR** bekijken; bij The Last Meme **PIXEL RIP / GLITCH DOUBLE**. Zijn de gemarkeerde impactzones en aangekondigde schietrichtingen op Low/High zichtbaar? Kun je bij 1×/2×/3× echt ontwijken en is geen overlap met de bestaande geweldige arena-ultimates onmogelijk om uit te lopen? QA-export bevat `boss_secondary_attack`-events. **Nog geen nieuwe gespeelde bossrun**; geen live PASS. Handmatige details in [UPDATE-34-LATE-GUARDIANS.md](UPDATE-34-LATE-GUARDIANS.md); ook eerdere Water/Vitality- en Beau/Shade-herchecks staan nog open.

## Nieuwe boss-QA nadat Update 33 is geïmplementeerd (19 oktober 2026)

**TECHNISCH 514/514 groen, live gebruikersacceptatie NOG NIET UITGEVOERD.** Beau heeft FANG SWEEP/PACK CROSSFIRE, Shade MOURNING LANCES/PHANTOM MIRRORS als echte alternatieve *normale* salvo's met vooraf getekende impactzones. Bestaande door maker geliefde showcase-/fase-3-aanvallen zijn behouden. Tijdens volgende Playtest graag **Low/High-graphics, 1×/2×/3× snelheid**, zien of de markeringen overeenkomen met de werkelijke danger zones, of er veilige dodgeroutes zijn en of de nieuwe aanvallen hun zwaarste twee bestaande aanvallen niet oneerlijk overlappen. Gebruik de nieuwe `boss_secondary_attack`-events in de QA-JSON. Zie [UPDATE-33-GUARDIAN-SECONDARY.md](UPDATE-33-GUARDIAN-SECONDARY.md). **Update 32.1 survival/Water hertest en M3–M6 blijven eveneens OPEN.**

## Vrijgavebesluit — actuele live QA op 18 oktober 2026

**M1 PASS voor Water** (26:44 non-sandbox Standard Normal Victory), **M2 PASS voor Water** (evoluties 10:00/17:00 met echt verdiende weapon/supportlevels). Frost 28:01 heeft sandboxflag true zonder developerfuncties door de maker, waardoor gewone bossrewardkeuzes ontbraken. **M3–M6 gedeeltelijk OPEN**, wegens onbewezen telegraph-fairness, refresh/Endless, Low/Medium/memory, en ontbrekende Fire-run. [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md).

## Vrijgavebesluit (historische checklisttekst vóór live QA)
**Nog geen bevestigde volledige menselijke 25–30-minuten browserrun.** Technisch doorlopen de gescripte scenario's de betrokken bestaande JS-functies en zijn alle regressies groen, maar werkelijk speelgevoel, level-up-aanbod, fight pacing, boss-telegraph overlap, stabiliteit en FPS kunnen pas na een live browserrun als geslaagd worden afgevinkt.

**Voor Update 30:** eerst de lijst open browsertests prioriteren; geen release-/speelbaarheidsclaim baseren op uitsluitend de CI. De maker wil eerst alle gameplay-effecten aanwezig hebben; definitieve VFX-polish is een latere fase.
