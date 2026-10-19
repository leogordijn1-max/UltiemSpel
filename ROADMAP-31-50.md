# SHADOW SURVIVOR — OFFICIËLE ROADMAP UPDATES 31–50

**Vastgelegd op 18 oktober 2026 · Werkbranch:** `feature/living-world-prototype`  
**Gebruikersvisie:** Shadow Survivor Deel 1 blijft een **2D, top-down survivor-roguelike**, maar krijgt een **extreem vloeiende, hoogwaardige gestileerde 2.5D-presentatie** die **bijna 3D voelt**. **Geen pixelart als doelstijl.** Een mogelijke *Shadow Survivor 2* kan later **werkelijk 3D** worden, maar is geen onderdeel van deze 20 updates.

> **Status:** deze roadmap is het **AFGESPROKEN PLAN**, geen claim dat Updates 31–50 al uitgevoerd zijn. Na Update 30 zijn **11–30 technisch afgerond**; de verified-playable browser-release staat **NO-GO** zolang 6 manuele QA-gates ontbreken. Zie [MILESTONE-30-REVIEW.md](MILESTONE-30-REVIEW.md) en [NORMAL-RUN-QA.md](NORMAL-RUN-QA.md). Houd deze bestanden samen met [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md) bij.

## De visuele ambitie: 2D gameplay, bijna-3D gevoel

**Beoogde art direction:** *Stylized 2.5D dark-fantasy arcade-survivor*, vloeiend getekend in plaats van pixelated, met personages die volume, massa en lichaamsbeweging uitstralen. Een absurde/grappige kern met memorabele eigen personages blijft bestaan; visuele verbetering betekent niet het vervangen van Beau of de andere originele identiteiten door generieke fantasy-assets.

**Illusies van diepte die daadwerkelijk in 2D kunnen:**
- **Contactschaduwen:** zachte schaduw/ambient-occlusion onder personages, bosses en objecten; schaduw schuift/strekt bij bewegen, springen of zweven.
- **Volume:** meerdere kleurwaarden per materiaal, consistente lichtbron, sterk silhouette, rimlight en highlights op duidelijk herkenbare vormen.
- **Laagopbouw:** vloer → sporen/onderliggende magie → contactschaduw → personage → projectielen/impact → gecontroleerde foregrounddeeltjes/UI; dieptesortering waar nuttig.
- **Vloeiende beweging:** frame-interpolatie, poses/animatiecurves, squash-and-stretch, anticipatie, follow-through en kleine visuele terugslag zonder hitboxverandering.
- **Wereld met hoogte:** opstaande brokstukken, randen, schaduwverloop, perspectivische decals en variatie in de arena; map blijft functioneel volledig top-down.
- **Juicy combat:** warmte-/water-/ijsglow, projectieltrails, snelle maar leesbare impactflashes, shockwaves, subtiele camerareacties en grootse Guardian Powers.
- **Living World-verovering:** de omgeving transformeert merkbaar wanneer invasies Fire/Water/Frost sterker worden: **15%, 50%, 85% en alleen na echte winst 100% permanent**.

**Wat we nadrukkelijk NIET doen:** van de huidige game ongemerkt een perspectief-3D-game maken, pixelart als definitieve look kiezen, echte hitzones veranderen voor mooiere effecten, schermvullende blur/bloom toevoegen die gevaar afdekt, vijandenspam toevoegen voor visuele druk, of direct alles omschrijven naar een zware 3D-engine.

**Technische aanpak:** bestaande HTML/JS/Canvas 2D-game als basis. Waar nuttig offscreen buffers en gelaagde sprite-/decal-assets, tween/animatiestate en transparante schaduwen. Eventuele WebGL/enginewissel **alleen** na expliciete prestatie-/scopebeslissing en een kleine proof-of-concept; geen verplicht onderdeel van deze roadmap. Object-/renderpools en Low/Medium/High kwaliteitsstanden moeten bruikbaar blijven.

---

### Nieuw: technische Update 32.1 balance-hotfix na tweede live Water-test (19 oktober 2026)

De maker leverde ná Update 32 een nieuwe Normal Water JSON aan: **27:01 non-sandbox Victory, 52 hits en 843,71 totale schade maar 242,53/260 HP** vlak voor de overwinning. **Zombie Mike komt nu wél dichterbij**, maar de gewone enemies doen nog veel te weinig damage, ook bij 3× speed; Water Bolt blijft volgens maker te sterk. Deze specifieke run kreeg twee dubbele healthbossrewards en eindigde op **Vitality 4** (oude regen 3,2HP/s); maker noemt ook dat **Vitality 1 in het algemeen al veel te goed** is. **Hotfix 32.1 gebouwd**: vertraagde, afvlakkende Vitality-heal (na 3s safe; level 1 0,35 HP/s, level 4 ~0,89), Normal gewone enemy damage groeit na minuut 5 geleidelijk naar +50% bij 25min (geen extra hordes/boss-ultimates), Water Bolt Rapid Casting minimumcooldown 0,78s plus evolved pierce 4 i.p.v. 5. Extra healing/regen-QA-meetpunten toegevoegd. **Dit is een code-hotfix, nog géén bewezen nieuwe moeilijke browserrun.** Bron/acceptatie in [UPDATE-32-1-SURVIVAL-BALANCE.md](UPDATE-32-1-SURVIVAL-BALANCE.md); 33 blijft Beau/Shade. **Update 31 live PASS, 32/32.1 CODE PASS waar CI bevestigd; live difficulty-gate OPEN.**

## FASE 2 — UPDATES 31–40: VERIFIED PLAYABLE RUN

**Mijlpaaldoel Update 40:** de **echte** Normal-run kunnen spelen, meten, controleren en verbeteren. Niet alleen tijdskiptests: minstens **drie geregistreerde complete browserruns**, verdeeld over Fire/Water/Frost, met twee **daadwerkelijk verdiende** evoluties, faire solo-bossfights, werkelijk save-/Endless-gedrag en meetbare FPS/frametimes. De 6 gates uit Update 30 zijn releaseblokkades totdat er werkelijk bewijs is.

| Update | Werkpakket | Klaar wanneer / toetsbare uitkomst |
|---|---|---|
| **31** | **Run Telemetry & First Live Test — CODE + EERSTE LIVE SPEELTEST AFGEROND** | De game bevat nu `js/run-telemetry.js` (lokale recorder, 30s checkpoints, 5s echte FPS/P95, upgrade-aanbod én gekozen optie, bossphases/kill, einde en JSON-export). **479 tests groen.** **Twee echte browser-JSON's beoordeeld:** Water 26:44 non-sandbox Normal Victory, 4 bosses, 2 earned evolutions op 10:00 en 17:00 en gemeten FPS; Frost 28:01 Victory, sandboxflag ondanks bevestiging dat geen developer tools gebruikt zijn. [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md). M3–M6 blijven deels OPEN. |
| **32** | **Water/Evolution Balance — CODE AFGEROND, LIVE HERTEST OPEN** | Werkelijke Frost/Water-data gebruikt. Nieuwe [UPDATE-32-BALANCE.md](UPDATE-32-BALANCE.md): centrale Water/Bolt/Tidal/Whirlpool crowd-controlweerstand (zware Zombie Mike kan nauwelijks teruggeduwd worden), afnemende herhaalde Water Bolt-push, minder verplichte locked-weapon-keuzes, echte evolutiefocus behouden, bossrewards bij passieve Developer Mode hersteld. **491/491 CI groen.** Normale Water/Frost-browsertests ná de balanswijziging zijn nog **NIET** gespeeld: balance-acceptatie OPEN. **Geen algemene XP-buff.** |
| **33** | **Beau & Mourning Shade Live Boss QA + secundaire moves** | Maker vindt hun **twee sterkste aanvallen** al ziek leuk: bewaren! Vooral **overige** aanvallen tactisch cooler en duidelijker maken, met faire warning/dodge/recovery; fase-3-overlap op 1×/2×/3× testen. |
| **34** | **Bell Tower & The Last Meme: overige aanvallen redesign** | Maker vindt bijna alleen hun **laatste ultimate** echt moeilijk en vet, vooral Meme's finale: **behouden als benchmark**. De niet-ultimate attacks horen ook uitdagende, memorabele en ontwijkbaar gesignaleerde setpieces te worden. Geen unavoidable overlap; finale pas na 25:00 en drie earned Guardians. |
| **35** | **Duidelijk ontworpen unieke enemies + echte tegenstrategie** | Gewone enemies waren veel te makkelijk. Prototypeer max. **drie herkenbare counterrollen** via bestaande Zombie Mike (Anchor: nauwelijks push/Whirlpool), Runner/Pouncer (Phase Stalker: telegraphed flank), Bulwark/Ward (teamprotector). Uiterlijk toont vaardigheid; weerstand/zwakte/waarschuwing zijn echte code. Easy/Normal/Nightmare via slimme tactiek, **geen horde-spam**. |
| **36** | **Measured FPS & Memory** | Werkelijke FPS, P95 frame, AI/collision/draw en geheugengedrag vergelijken op Low/Medium/High, inclusief drukke late game en bosses; concrete regressies repareren. |
| **37** | **World, Save & Endless in Browser** | Invasie, verlies/herstel, winst, save na refresh, unieke bossrewards, eenmalig runrecord en Endless-overgang in live browser nalopen. |
| **38** | **All Nine Weapons + Water Bolt/Frost Orb pressure balance** | Fire/Water/Frost en alle 9 wapens over gewone, heavy, flanker en shield enemies beoordelen; specifiek **Water Bolt attack speed × knockback × damage** en sterke Frost Orb. Bouw mag sterk blijven maar moet niet alle enemies buiten bereik houden. |
| **39** | **Three Complete Normal Runs & UX Fixes** | Minstens drie gedocumenteerde complete runs met bewijs; kritieke bugs opgelost; UI en combat warnings in drukte leesbaar. |
| **40** | **Verified Playable Run Gate Review** | De 6 release-gates stuk voor stuk beoordelen met bewijs en bewust GO / NO-GO beslissen. Bij NO-GO prioriteren we fixes vóór grote graphicsproductie. |

**Afhankelijkheidsregel:** als na Update 40 een P0-speelbaarheidsbug resteert, mag grafische productie **voorbereid** worden maar moet de gameplayfix voorrang houden. We mogen Visual Foundation niet verwarren met releasebewijs.

---

**Nieuwe gameplay-designrichting na twee live runs:** normale enemies zijn te gemakkelijk, met name door Water Bolt + rate + knockback; eerste twee Guardians hebben al twee sterke signature moves, maar overige attacks mogen cooler; Bell en Meme hebben vooral één indrukwekkende ultimate en hebben meer interessante basis-/mediumattacks nodig. **Nieuwe unieke enemyrollen met leesbaar uiterlijk, abilities en counters** opnemen rond Update 35, 2.5D-visuele uitwerking later. Gedetailleerde bron en codehaken: [PLAYTEST-FEEDBACK-COMBAT-31.md](PLAYTEST-FEEDBACK-COMBAT-31.md). De voorgestelde vijanden zijn **niet geïmplementeerd**.

---

## FASE 3 — UPDATES 41–45: VISUAL IDENTITY & 2.5D FOUNDATION

**Mijlpaaldoel Update 45:** één samenhangende, vloeiende visuele taal en een representatieve **vertical slice** met een player, een enemytype, een boss en een Living World-omgeving, voordat alle assets massaal worden geproduceerd.

| Update | Werkpakket | Klaar wanneer / toetsbare uitkomst |
|---|---|---|
| **41** | **Art Direction Lock-In** | Visuele stijlgids + moodboard/schetsen: kleurpalet, contrast, camera, lichtbron, vormen, materialen, 2.5D-regels, humor en herkenbare Fire/Water/Frost-identiteit. **Geen pixelart**. Maker keurt een heldere referentierichting goed. |
| **42** | **Depth, Lighting & Shadows** | Contactschaduwen en gelaagde verlichting: speler/enemies zweven niet meer op vlakke grond; rimlights, highlights, dieptesortering en duidelijke silhouetten zonder gameplayhitboxes te veranderen. |
| **43** | **Player & Character Redesign** | Nieuwe vloeiende 2.5D-look van de speelbare characters, schaalbare losse lichaamsdelen/sprites en herkenbare idle/run/dash-poses. Eigen personage-identiteiten behouden. |
| **44** | **Enemy & Guardian Designs** | Enemies en vier Guardians krijgen nieuwe zichtbare volume-/kleurtaal, herkenbare rang/silhouetten en karakteristieke vormen. Attacks blijven op achtergrond leesbaar; geen generieke vervanging van de eigen figuren. |
| **45** | **Living World 2.5D Environments + Vertical Slice** | Gelaagde arena, schaduw, hoogte-illusie, Fire/Water/Frost-biomes en de 15/50/85% world-reacties in één werkelijk speelbare testomgeving. Maker beoordeelt of het **bijna 3D voelt** bij volle combat. |

**Visuele kwaliteitsgate Update 45:** (1) duidelijke consistentie; (2) player en boss direct van de achtergrond te onderscheiden; (3) de arena toont diepte; (4) gameplay bij Low blijft eerlijk; (5) geen onacceptabele frametime-/memory-regressie. Bij mislukking eerst design verbeteren, niet doorbouwen naar honderden losse effects.

---

## FASE 4 — UPDATES 46–50: ANIMATION & VFX LOCK-IN

**Mijlpaaldoel Update 50:** een complete, visueel samenhangende *2.5D vertical slice* waarin movement, aanvalshits, evoluties en Guardian Powers werkelijk spectaculair en vloeiend zijn. **Niet gelijkstellen aan volledige content-/releasepolish.**

| Update | Werkpakket | Klaar wanneer / toetsbare uitkomst |
|---|---|---|
| **46** | **Smooth Movement & Combat Animation** | Vloeiende player/enemy/bossbeweging, anticipatie, squash/stretch, hitstops waar fair, kleine recoil en death/knockback-reactions. Input-/hitbox-respons blijven onmiddellijk; geen storende inputlag. |
| **47** | **Fire / Water / Frost Weapon VFX** | Alle **9 echte wapens** krijgen gelaagde trails, vloeiende impact, reflectie-/glow-/particle-identiteit; steeds eigen silhouette, schermzichtbaarheid en duidelijke hitzone. Geen extra damage door alleen visuele effecten. |
| **48** | **Evolution & Combo Spectacle** | Zichtbare, betekenisvolle transformatie van maximaal twee earned evoluties, combo-impact Ignition/Undertow/Shatter en consistente level-/rewardfeedback zonder hard-to-read chaos. |
| **49** | **Guardian Cinematics & Arena Transformations** | Vier memorabele bossintro-/phase-wissels, grote doch begrijpelijke Guardian Powers (Beau lanes, Shade eclipse, Bell cross, Meme reality tiles), subtiel cameragebruik, timing/telegraph voorrang op spektakel. |
| **50** | **2.5D Visual Milestone & Optimization** | Vertical slice (wereld + characters + 9 wapens + 4 bosses) vergelijken met art guide, Low/Medium/High-optimalisatie en bewuste visual-polish backlog. Maker geeft een **GO / REWORK** op de stijl. |

**Bescherming tegen 'mooi maar onspeelbaar':** bij alle art-/VFX-updates moet de echte collision overeenkomen met visual tell; dash/iframes en targeting blijven; projectielen/evoluties blijven duidelijk; 1×/2×/3× speed en low-quality/desktop performancenormen worden gecontroleerd. Camerashake en bloom instelbaar; reduced motion serieus nemen.

---

## Hoe we voortgang bijhouden

- **Update 30:** 20/20 voltooide *geplande* technische/combat-updates. **Releasegates nog OPEN.**
- **Updates 31–40:** **Update 31 live + technisch afgerond (1/10 volledig geaccepteerd). Update 32 TECHNISCH gebouwd (2/10 code-implementaties), maar Water/Frost LIVE BALANSHERTEST OPEN.** Water 26:44 Victory + 2 earned evoluties exact 10:00 en 17:00; Frost 28:01 Victory sandboxflag true, maker zegt geen developerfuncties gebruikt. [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md). **M3–M6 nog gedeeltelijk open, release NO-GO.**
- **Updates 41–45:** momenteel **0/5**; de 2.5D art direction is **gekozen als doel**, de assetstijl nog **niet definitief getekend/goedgekeurd**.
- **Updates 46–50:** momenteel **0/5**; 3D-gevoel via vloeiende, gelaagde 2D-animatie/VFX is **het doel**, niet reeds gerealiseerd.
- Na iedere werkelijk geïmplementeerde update: GitHub commit, syntax/regressietests, waar relevant browser screenshot/video of FPS, beide projectdocumenten en deze roadmap bijwerken. **Een roadmappunt is niet voltooid doordat we erover praten.**
- **Mijlpaal 40:** Verified Playable Run. **Mijlpaal 45:** 2.5D Visual Foundation. **Mijlpaal 50:** Animation & VFX Vertical Slice.

## Mogelijke toekomst: een echte 3D sequel

Een **eventuele** Shadow Survivor 2 mag later 3D movement, ruimere arena's, cinematografische bosses en een uitgebreidere Living World krijgen. **Geen echte 3D-camera, enginewissel of 3D-sequel bouwen in Updates 31–50**. We ontwikkelen eerst een zelfstandige, sterke, herkenbare 2D-game met een bijna-3D-look, zodat een vervolg voortbouwt op een bewezen concept.

**Smaak / makerbesluit:** “ik wil voor deze game echt een lijp goed vloeiende stijl, dat het bijna 3d voelt, en dan misschien later als meer een soort deel 2 van het spel 3d”. Dit is voortaan de leidende visuele richting voor alle designs, revisies en vervolgstappen.

## Update 31 — technische implementatie én echte browserplaytest (18 oktober 2026)

- `js/run-telemetry.js` verzamelt **uitsluitend lokaal/in geheugen** gegevens van een werkelijk lopende game (geen fetch of auto-upload). Nieuwe run begint eigen rapport; Developer Mode krijgt duidelijk `sandbox:true`.
- Registratie: 30s gameklok snapshots met levels/XP/needed/unlocked/upgrades/HP/wereld/boss, level-upaanbiedingen en gekozen upgrades, upgrade- en bossbeloningen, **de werkelijke twee evoluties**, boss spawns/phase transitions/defeats, hits, death/Victory/Endless; 5s FPS/P95/AI/collision/draw/objectmetingen uit echte realtime browserframes. Ruwe per-framebuffers en eventlijsten zijn beperkt qua geheugen.
- Settings heeft nu **Record local run QA data** (aan, uitzetbaar); pauzemenu/Victory/Game Over/hoofdmenu leveren **DOWNLOAD QA REPORT · JSON** en **COPY QA SUMMARY**. De gebruiker deelt het bestand alleen zelf.
- `tests/update-31-run-telemetry.test.cjs` voegde **11 specifieke tests** toe; GitHub Actions is **479/479 groen**, technische milestone-audit Update 30 blijft groen. Rapport en handmatige procedures: [RUN-TEST-31.md](RUN-TEST-31.md).
- **Eerste echte browserrun geaccepteerd:** Water sandbox:false, Standard Normal Victory 26:44 met twee echte evoluties exact 10:00/17:00. Daarnaast Frost 28:01, sandboxflag true maar maker gebruikte geen developerfuncties; gewone bossrewards ontbraken door sandboxlogica. Detailgegevens in [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md). **M1/M2 aantoonbaar Water PASS; M3–M6 blijven onvolledig.** Volgende Update 32.


## Update 32 — implementation handoff (19 oktober 2026; code PASS, live balance QA OPEN)

- **Nieuw:** [UPDATE-32-BALANCE.md](UPDATE-32-BALANCE.md). Volledige onderbouwing, onderscheid werkelijk gespeelde 31-data en nog ongeteste nieuwe waterbalans, met expliciete twee browsertestscenario's.
- **Code:** js/crowd-control.js gedeelde movement-/knockbackweerstand op alle fysieke Water-paden in js/elemental-combat.js en js/enemies.js: gewone enemies sterk verplaatsbaar, maar Zombie Mike zware massa; Water Bolt herhaalde extra recoil verminderd zonder zijn damage, rate of pierce plat te nerfen. Whirlpool, Tidal Wave en combo-pulls volgen dezelfde regel.
- **Levelup:** js/upgrades.js biedt locked weapons standaard vroeg en periodiek, niet bij bijna elke level-up; evolutionFocusKey blijft behulpzaam en de twee earned evolutiongates 10:00/17:00 (weapon 5 + support 3) ongewijzigd.
- **Frost sandboxprobleem:** js/developer-mode.js maakt onderscheid tussen sandboxflag en daadwerkelijk gebruikt ontwikkeltool; passief Developer Mode slaat bossreward-keuzes niet langer over, maar toolgebruik / open F9 krijgt geen modal. Save-sandboxbescherming blijft intact.
- **Tests:** **491/491 groen, 0 fouten** ([CI na code](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39230706344)), waaronder 12 nieuwe regressies en aangepaste oude keuzeassumpties. **Nog geen nieuwe daadwerkelijk gespeelde Water/Frost-run ná de fixes**. Dit blijft de hoogste volgende verificatieprioriteit.
- **Volgende geplande code-update:** 33 — Beau/Shade secundaire aanvallen, hun twee sterke signatures behouden. Nieuwe enemy-counterrollen en unieke visuele silhouette bij 35/41–50. **Als de nieuwe Water-run nog onwinbaar makkelijk blijft, eerst verdere gerichte rebalance vóór doorgaan.**
