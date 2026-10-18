# Update 29 — Normal run QA: echte speeltest en gescripte dekking
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

## Vrijgavebesluit
**Nog geen bevestigde volledige menselijke 25–30-minuten browserrun.** Technisch doorlopen de gescripte scenario's de betrokken bestaande JS-functies en zijn alle regressies groen, maar werkelijk speelgevoel, level-up-aanbod, fight pacing, boss-telegraph overlap, stabiliteit en FPS kunnen pas na een live browserrun als geslaagd worden afgevinkt.

**Voor Update 30:** eerst de lijst open browsertests prioriteren; geen release-/speelbaarheidsclaim baseren op uitsluitend de CI. De maker wil eerst alle gameplay-effecten aanwezig hebben; definitieve VFX-polish is een latere fase.
