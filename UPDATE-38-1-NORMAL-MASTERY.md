# Update 38.1 — Normal Mastery, eerste runs zijn om te leren

**19 oktober 2026 · branch `feature/living-world-prototype`**  
**Status: CODE GEBOUWD / 578 NODE-TESTS GROEN — echte browseracceptatie OPEN.**

## Nieuwe maker-designregel

> Iemand die nieuw is in de game moet normaal gesproken zijn eerste runs op Normal **niet kunnen winnen**. Een overwinning moet verdiend worden door kennis van vijanden, aanvallen, dodges, healing en de twee evoluties.

**Interpretatie:** dit is een **spelontwerpdoel, geen verborgen verliesgarantie**. Er is geen systeem toegevoegd dat eerste-run-wins tegenhoudt, geen onzichtbare autohits, geen kunstmatig stat-verlies op de eerste paar runs, geen extra boss of gegarandeerd Game Over. Een zeer goede speler kan vanaf run 1 winnen. Easy blijft een leerstand.

De maker heeft **nog niet** gespeeld op de nieuwste Update 38-wapens en 37.2 combat pressure. Dit zijn dus kleine, gecontroleerde veranderingen in plaats van een nieuwe grote moeilijkheidsoverschrijving.

## Gerichte implementatie

### 1. Gewone vijanden worden midden in een Normal-run al serieus gevaarlijk

`js/combat-difficulty.js` houdt dezelfde **maximale** Normal-schademultiplier van `1.65×`, maar bouwt hem vanaf **4:00** op naar de cap op **22:00** in plaats van 5:00 → 25:00. Voorbeelden:

| Spelklok | Oude multiplier | Nieuwe multiplier |
|---|---:|---:|
| 3:00 | 1,00× | 1,00× |
| 5:00 | 1,00× | ~1,04× |
| 10:00 | ~1,16× | ~1,22× |
| 15:00 | ~1,33× | ~1,40× |
| 20:00 | ~1,49× | ~1,58× |
| 22:00+ | maximum 1,65× pas op 25:00 | 1,65× |

De eerste minuten blijven gelijk; er zijn geen extra spawns, geen onzichtbare hitboxes en geen lagere healingwaarden. Easy blijft voor deze modifier altijd `1×`.

### 2. Guardians worden in latere fases minder vrijblijvend

Nieuwe **`guardianNormalAttackCooldown(seconds, difficulty, phase)`** in `js/combat-difficulty.js`, daadwerkelijk aangeroepen door `scheduleBossNormalVolley()` in `js/enemies.js`. Hij wijzigt uitsluitend de pauze tussen **gewone** schietsalvo's.

| Fase | Normal cooldownfactor | Nightmare cooldownfactor | Easy |
|---|---:|---:|---|
| I | 0,97× | 0,93× | onveranderd |
| II | 0,89× | 0,85× | onveranderd |
| III | 0,83× | 0,79× | onveranderd |

Bij een voorbeeld van een gewone Guardian: 2,55s in fase I → ~2,47s Normal; 2,05s in fase II → ~1,82s; 1,85s in fase III → ~1,54s. Alle vier Guardians (ook Last Meme/Endless) gebruiken bestaande afwisselende volleys; minimumcooldown 1,35s. *Special Recovery*, de kleurrijke fase-III-ultimates, de projectiel-/hazard-warningduren en precieze collisiongeometrie **zijn niet ingekort**. Ook boss-spawns, boss-HP, 10/17-minuut-evoluties, loot en save/Endless zijn ongewijzigd.

### 3. Moeilijkheidsverwachtingen vooraf in het menu

`index.html` geeft een korte uitleg: **Easy** om mechanics te leren; **Normal** is uitdagend, vereist dodgekennis en het najagen van healing; je eerste overwinning moet verdiend aanvoelen. Easy mag niet per ongeluk zwaarder worden door dit doel.

## Tests en beperkingen

Nieuw `tests/update-38-1-normal-mastery.test.cjs` controleert concrete 4:00→22:00 curve, Easy/no-modifier, phase I/II/III, Nightmare niet makkelijker dan Normal, de **echte** boss-cooldownscheduler, behoud van waarschuwingen en boss-recovery, bestaande Vitality en health-pickups, geen extra spawns en menu-uitleg. Update-32.1 en Update-37.2 regressies aangepast omdat ze terecht nog de vorige Normal-cijfertabel verwachtten.

**578/578 tests groen** op de code: https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39259687944 (controleer nogmaals branch-HEAD na documentatie).

Node en pure-function-tests meten geen daadwerkelijke newcomer-winrate. Dit is *geen* bevestiging dat een nieuwe speler waarschijnlijk verliest. Ook laatste Water-hit-sources, de vernieuwde Frost Orb en alle 36 weapon-matchups uit Update 38 blijven in de **echte browser** te verifiëren.

## Aanbevolen eerstvolgende makerplaytest

Speel **één gewone Water Standard Normal run**, Developer Mode UIT, QA recording AAN en bij voorkeur 1× tijdens bosses. Vergelijk met de non-sandbox Water-baseline van **26:42, 21 hits, 333,86 damage** (die baseline was vóór Updates 37.2 en 38.1). Let per blok van 5 minuten op `hit.source`, HP, recovery-keuzes, green pickups en of je op 10:00–20:00 daadwerkelijk in gevaar komt. Bij iedere Guardian: voel je een echte noodzaak om patronen te herkennen, maar kun je nog steeds eerlijke veilige routes zien?

**Succescriterium op Normal:** een beginner leert door concrete eigen fouten en verliest waarschijnlijk een paar keer, terwijl een geoefende speler op basis van skill een overwinning kan halen. Niet eerst drie onvermijdelijke verliezen inbouwen. Voor een statistische uitspraak over nieuwe spelers zijn meerdere echte beginnersruns nodig; één ervaren maker-run bewijst dit niet.

Na de eerste herbeoordeling volgen de drie complete Fire/Water/Frost-runs voor **Update 39**, dan de zes GO/NO-GO releasecriteria voor **Update 40**. M3–M6 blijven voorlopig OPEN.
