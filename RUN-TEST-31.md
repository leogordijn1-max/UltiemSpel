# UPDATE 31 — De eerste ECHTE Normal-run met meetdata

**Status:** technische QA-recorder geïmplementeerd en automatisch getest. **Er is nog geen aantoonbaar daadwerkelijk door een speler gespeelde run uitgevoerd of geüpload.** Deze handleiding is bedoeld om die ontbrekende gegevens te verzamelen.

## Waarom deze test?

De oude Update-29-test sprong in code naar 26:40 en stelde de evolutie-vereisten in een fixture in. Dit zegt niets over de gewone XP-economie, welke drie upgrades je werkelijk aangeboden krijgt, en of de bosses in de praktijk fair en leuk zijn. Daarom bevat de game vanaf Update 31 een lokale, optionele recorder. **Hij verstuurt niets automatisch naar internet en schrijft het verslag niet permanent weg**: alleen jij kiest of je het lokaal downloadt of een korte samenvatting kopieert.

## Starten — stap voor stap

1. Open `index.html` op `feature/living-world-prototype` in je browser (via je gewone lokale ontwikkelserver of GitHub Pages op de relevante branch).
2. Open **Settings** en controleer dat **Record local run QA data** aanstaat. Standaard staat dit aan, maar je kunt het uitzetten. Het aan- of uitzetten gaat voor nieuwe runs; bij uitschakelen midden in een run blijft het tot dan toe verzamelde verslag exporteerbaar.
3. Kies **Normal**, **Standard**, één van **Fire/Water/Frost**, en je character en startwapen. **Developer God Mode en geforceerde upgrades UIT** voor een echte test. Een Developer Mode-run wordt automatisch als `sandbox: true` gelabeld.
4. Start en speel zoals normaal. Niet bewust tijd vooruit springen; registreer mislukte runs óók. Speel indien mogelijk tot ongeveer 25–30 minuten of tot je echte Game Over.
5. Voor een tussentijds verslag: druk **P** om te pauzeren en klik **DOWNLOAD QA REPORT · JSON**. Je kunt daarnaast **COPY QA SUMMARY** gebruiken. De QA-recorder is ook bereikbaar op de eindschermen **Victory** en **Game Over** en in het hoofdmenu na het verlaten van een run.
6. **Download je JSON voordat je op Restart klikt of een nieuwe run begint**. De recorder is lokaal/in geheugen; een nieuwe run wist de vorige actieve rapportage. Downloaden laat het spel ongemoeid. Bewaar het bestand met de automatisch gegenereerde naam `shadow-survivor-qa-<element>-<speeltijd>s.json`.
7. Upload dat JSON-bestand in de ChatGPT-gamechat en beschrijf kort waar de run niet leuk, te moeilijk of onduidelijk voelde. Daarmee kunnen we bij Update 32 eerlijk de echte level-up-/evolutie-economie analyseren.

## Wat meten we daadwerkelijk?

| Datapunt | Herkomst | Frequentie |
|---|---|---|
| Gameklok, level, XP, vereiste XP, totaal verzamelde XP | Echte `js/game.js`- en `runStats`-waarde | Start en elke **30 game-seconden** |
| HP, schade genomen, kills, bosskills, invasiepercentage | Echt spelstate | Elke 30 game-seconden en bij relevante events |
| Beschikbare / ontgrendelde wapens, evoluties, support-/wapenlevels | Werkelijke huidige `upgrades`, `selectedWeapons`, `unlockedWeapons`, `evolutions` | Elke 30 game-seconden |
| **Aangeboden drie level-upkeuzes** en de daadwerkelijk gekozen optie | Echte `choices()`- en `makeUpgradeChoice()`-handlers | Elke echte aanbieding/keuze |
| Bossrewardkeuzes, boss-spawn, bosskill en bossovergang | Echte encounter-/damage-handlers | Bij gebeurtenis |
| Herkomst van een evolutie, required weapon/support-level en aantal verslagen bosses | Echte `evolveWeapon()`-handler | Bij evolutie |
| HP-hit, bossfases en runuitkomst (win, defeat, Endless, verlaten) | Echte damage-/runhandlers | Bij gebeurtenis |
| FPS, P95-browserframetijd, AI/hit/draw ms en objectaantallen | **Echte getekende browserframes**, niet tijdskiptests | Elke **5 seconden actieve realtime** |
| Runmateriaal | Lokaal JSON. Geen netwerkcall. | Alleen bij handmatig klikken op **DOWNLOAD** |

**Let op:** de performance-samples geven *gemeten browserframetijd op die pc en browser*, en zijn niet uit te wisselen met Node-simulatie of metingen op een andere pc. Pauzes, alt-tab-onzin en Developer Mode worden onderscheiden. De laatste 120 frame-duren worden gebruikt voor P95; extreme vertraagde frames boven .5s worden niet meegeteld.

## Noteer voor een eerlijke beoordeling

Bij de checkpoints **03:00, 10:00, 17:00, 25:00 en het einde**: de daadwerkelijke level, wapen- en supportlevels, je gekozen build, al behaalde evoluties, HP, welke boss je bereikte, en of de aanvallen logisch te lezen waren.

**Vooral belangrijk vóór Update 32:** hoeveel keer is het betreffende wapenlevel aangeboden, hoeveel keer de juiste support, en wanneer heb je L5 en support L3 werkelijk kunnen halen? De JSON-events `upgrade_offer`, `upgrade_chosen` en `evolution` beantwoorden dit, zonder te gokken.

**Regressiepunten:** geen losse normale enemies tijdens solo-boss; juiste Beau → Shade → Bell → Meme-volgorde; 15/50/85/100 wereldverovering; max. 2 Standard-evoluties; na echte Victory geen dubbele beloning in Endless; bij Game Over eerlijke wereld-/runstatus.

## Wanneer is Update 31 écht helemaal geaccepteerd?

- **Code/CI: technisch gereed** zodra alle tests slagen en de exportknoppen werken.
- **Live browsercheck: OPEN** totdat ten minste één daadwerkelijke Normal-run is gedaan, de JSON is geëxporteerd en de waarnemingen zijn beoordeeld.
- Deze speeltest hoeft niet meteen gewonnen te zijn. Een echte nederlaag met data is waardevol; het **feit dat de volledige game fair te winnen is**, blijft apart open tot de 6 releasegates van mijlpaal 40 werkelijk bewezen zijn.

**Geen automatische upload of achtergrondmonitoring.** Jij bepaalt of je het verslag deelt. De focus blijft de 25–30-minutenloop, een eerlijke Living World en maximale twee daadwerkelijk verdiende evoluties. Graphics: vloeiend 2.5D vanaf Updates 41–50, zoals afgesproken.
