# UPDATE 32 — Water Bolt, Crowd Control & Evolution-aanbod

**Datum:** 19 oktober 2026 · **Branch:** feature/living-world-prototype  
**Stand:** TECHNISCH GEÏMPLEMENTEERD · **Nieuwe echte Water- en Frost-browsertests na deze wijzigingen staan OPEN.** Er zijn nog geen nieuwe geteste FPS-, difficulty- of winrate-claims.

## 1. Gebruikersbewijs en uitgangspunt

Zie [PLAYTEST-31-FROST-WATER.md](PLAYTEST-31-FROST-WATER.md) en [PLAYTEST-FEEDBACK-COMBAT-31.md](PLAYTEST-FEEDBACK-COMBAT-31.md).

| | Frost | Water |
|---|---:|---:|
| Echte oude Standard Normal-run (gameklok) | 28:01 Victory | 26:44 Victory |
| Sandbox | true, **maker gebruikte géén tools** | false |
| Eindlevel | 15 | 21 |
| Totale XP | 957,25 | 2.202,78 |
| Gewone bossrewardkeuzes | 0 door sandboxregel | 3 |
| Eerste/ tweede evolutie | 13:59 / 22:52 | 10:00 / 17:00 |
| Makerfeedback | Frost Orb sterk | **Water Bolt met rate, knockback en damage veel te OP** |

**Conclusie:** Water heeft daadwerkelijk beide earned evoluties op schema gehaald. Daarom **geen algemene XP-buff of gratis evoluties**. De Frost-run was niet economisch gelijkwaardig, omdat de normale bossbeloningen alleen door de ingeschakelde Developer Mode wegvielen. Maker gebruikt geen developeracties, maar de game sloeg de beloningsmenu's toch over.

## 2. Werkelijke codewijzigingen

### Eén weerstandssysteem voor ALLE fysieke Water-effecten

Nieuwe JS-module: **js/crowd-control.js**, geladen vóór js/enemies.js. Gedeelde functies: enemyCrowdControlResistance en applyEnemyCrowdControl. Zij veranderen de fysieke push/pull, **niet** damage, XP, loot, projectiel-hitboxes of de bestaande 25-minuten-bossroute.

| Vijandtype | Baseline knockback-/Whirlpool-verplaatsingskracht |
|---|---:|
| Gewone Drifter/Runner/Ranged Shade | 100% |
| **Zombie Mike — zwaar** | **12%** |
| Guardian boss | 10% |
| Bulwark met of zonder schild | 55% |
| Elite enemy | 55% |

Hierboven staan movementfactoren, **geen damage-immuniteit**. Bonusmodificatoren: Waterdamage-hit 80%, extra Water Bolt-recoil 70%, en bij herhaalde Water Bolt-hit op dezelfde vijand binnen 0,9s nog eens 42% van die extra recoil; Tidal Wave 85%; Whirlpool gebruikt de baselinefactor. Heavy Impact geeft zwaarwegende enemies kortere impact-slow.

**Gebruikte paden in echte code:** js/enemies.js damage-knockback, js/elemental-combat.js Water Bolt/on-hit status, Tidal Wave, Whirlpool pull én Whirlpool combo-bonus. De voorheen los opgetelde Water-krachten negeerden fysieke massa op meerdere plekken; dit is nu één consistent model.

**Water Bolt damage, attack cooldown, pierce en evolutie blijven hetzelfde.** Sterk Water blijft leuk, maar snelle hits mogen niet zo eenvoudig elk type vijand op afstand houden. Of deze verandering voor de maker goed genoeg is moet de nieuwe browserrun uitwijzen.

### Geen gegarandeerd ongekozen wapen op ieder level-upmenu

js/upgrades.js reserveerde voorheen op **ieder** level altijd een locked wapenkaart. In Frost stond Glacial Pulse daardoor 13/14 level-ups in beeld, terwijl de maker dat nauwelijks koos; bij Water gebeurde dat 12/20 keer met Whirlpool.

**Nu:** eerste levels (<=3) reserveren nog steeds een unlock, daarna slechts periodiek wanneer (level + bossesDefeated) modulo 3 gelijk is aan 0. Op andere levels kunnen locked wapens nog **eerlijk via de bestaande gewogen loting** verschijnen. De belangrijke bestaande evolutionFocusKey-keuze is nog steeds aanwezig; drie verschillende keuzes waar beschikbaar; normale upgrade-/bossbeloningen blijven verdiend. Geen grotere XP-drop, niet automatisch level 5, niet gratis ondersteuning.

**Twee evoluties:** tijdgates **10:00 en 17:00**, minimaal één verslagen boss, weapon level 5, juiste support level 3: **onveranderd**.

### Aan =/= daadwerkelijk gebruikt: Developer Mode

- js/developer-mode.js maakt apart onderscheid tussen **Developer Mode stond aan** en **een developerknop is daadwerkelijk ingedrukt**. Een gebruikte actie verschijnt ook in de QA-events als developer_action_used.
- Normale bossrewardkeuzes na gewone Guardians verschijnen voortaan **ook in een passieve sandbox zonder toolsgebruik**, mits het F9-paneel niet open staat. **Na werkelijk gebruik van developeracties** blijft dat menu uitgeschakeld.
- Het aanzetten van een Developer Sandbox blijft **wel** permanente carrière-/worldsave-wijzigingen blokkeren! Geen exploits. Voor de meest betrouwbare Normal-playtest: **Developer Mode UIT vóór starten**.

## 3. Automatische verificatie

**491/491 Node-tests geslaagd; 0 failures**, inclusief **10 nieuwe Update-32-tests** en **2 nieuwe Developer Mode-tests**, plus aangepaste legacy-evolutionkeuzeregels. Code-check: [GitHub Actions-run](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39230706344).

Nieuwe tests verifiëren: echte fysieke weerstand van Zombie Mike/Bulwark/elites/boss; minder spam-recoil Water Bolt en herstel na rust; Whirlpool respecteert massa; geen NaN of ghost pushes; werkelijke Water movementpaden; juiste wapenaanbiedingen met behoud evolution focus; geen gratis evoluties; de echte 10/17min-gates; passieve developerinstelling zonder F9/cheats en daadwerkelijk developer-toolgebruik. Bestaande Update-30 technische audit blijft PASS.

**Een groene test zegt NIET:** nieuwe Water-run nu uitdagend, alle vijandendesigns visueel klaar of twee evoluties voor iedere speler gegarandeerd.

## 4. Browser QA — wat moet de maker testen?

**Run A: Water · Standard · Normal · Developer Mode UIT.**

1. Herhaal zoveel mogelijk dezelfde sterke **Water Bolt + Rapid Casting + Heavy Impact**-route (laat bossrewards gewoon verschijnen).
2. Let vooral op **Zombie Mike** en **Bulwark**: komt een heavy nu wél langzaam dichterbij, ook binnen Whirlpool? Hij moet schade blijven ontvangen en ontwijkbaar zijn; immuniteit zonder counterplay is niet de bedoeling.
3. Let op wat er gebeurt na herhaalde Water Bolt-hits: nog steeds sterk, maar worden gewone vijanden niet eindeloos weggeblazen?
4. Tel hoe vaak Whirlpool als locked keuze verschijnt tegenover andere zinvolle upgradeopties. Halen twee verdiende evoluties na de wijzigingen nog steeds 10:00/17:00 of redelijk daarna?
5. Speel bij voorkeur tot minimaal 17:00 of tot de finale; exporteer een nieuw QA-JSON met de bestaande DOWNLOAD QA REPORT-knop en geef je speelgevoel (te makkelijk / spannend / frustrerend) door.

**Run B: Frost · Standard · Normal · Developer Mode UIT.**

1. Controleer dat normale bossrewardkeuzes terug zijn en bekijk de werkelijke supportprogressie voor Glacier en Crystal Storm.
2. Controleer de afwisseling met de Glacial Pulse-unlock op het level-upscherm en het moment van 1e/2e evolutie.
3. Exporteer het JSON-verslag voor een **eerlijke non-sandbox vergelijking** met Water.

**Bij eventuele extra test in sandbox:** alleen Developer Mode aan geeft nog steeds de normale in-run bossrewards; eenmaal daadwerkelijk tools gebruikt? QA-event developer_action_used en testregels voor bossreward F9. De run is ondanks die beloningen nog steeds een **sandbox zonder permanente opslag**.

## 5. Bewuste grenzen en volgende fase

- **Update 32 is technisch afgerond, live balance-acceptatie open.** De nieuwe Water- en Frost-runs zijn nog niet uitgevoerd, en dus mag Update 32 nog niet als **volledig live gevalideerde moeilijkheid** worden gepresenteerd.
- De maker vindt **Beau en Shade hun twee beste attacks erg gaaf**; secundaire aanvallen komen bij Update 33. Bij **Bell en The Last Meme** moeten vooral de overige aanvallen omhoog naar het niveau van hun ultieme finishing move: Update 34.
- De door de maker gewenste nieuwe **visueel zware, nauwelijks verplaatsbare Anchor**, slimme Phase Stalker en teamprotector Warden komen als een paar duidelijk ontworpen tactische enemyrollen richting **Update 35**, met stylized 2.5D designs bij 41–50. **Deze Update 32 wijzigt bestaande fysieke weerstanden; hij introduceert nog geen drie compleet nieuwe enemyassets.**
- Onveranderd vrijgavebeeld: Update 31 gaf bewijs van een echte Water Victory, maar bossfairness, world-save/Endless, Low/Medium memory/FPS en Fire- en nieuwe Frost-/Watervergelijking blijven onderdeel van milestone-40 QA.
