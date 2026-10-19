# Update 36.1 — Water pressure en leesbare Guardian-aanvallen

**19 oktober 2026 · Branch:** `feature/living-world-prototype`  
**Status:** gerichte code-hotfix en CI; **nieuwe handmatige Water-/Guardian-hertest NOG OPEN**.

## Makerfeedback na Update 35 (echte non-sandbox browserrun)

De maker heeft een volledige **Water / Standard / Normal / High** run aangeleverd: `shadow-survivor-qa-water-1551s.json` (schema 1: dit is de build **vóór** Update 36-instrumentatie). Resultaat: Victory na **1551,2 gameseconden (25:51)**, vier Guardians verslagen, evoluties **Riptide Lance 600s** en **Maelstrom 1020s**. De run noteert **29 hits**, **493,99 ontvangen HP-damage**, **532,99 geregistreerde healing**; het HP stond kort voor het einde weer **200/200**. De combatfase 17:00–22:00 toont geen geregistreerde hits. Water Bolt was level 5 op 176,98s (nog vóór Beau) en Rapid Casting kreeg level 5 bij de tweede Guardian-beloning rond 494,48s.

**Door maker gerapporteerd:** Water Bolt bleef onredelijk sterk, de nieuwe gewone boss-aanvallen waren drukker/verwarrender maar niet echt moeilijker, en de speler kreeg te weinig damage. In de runtime-data is dit vooral **te weinig bereikbare hits in combinatie met veel tussentijds herstel**, niet uitsluitend een te laag individueel schadegetal. Niet alle hits zijn per vijand/aanvaltype gemarkeerd: de JSON bewijst **niet** welk exact aanvalspatroon ieder hit veroorzaakte.

## Hotfix: beperkte, doelgerichte wijzigingen

1. **Water Bolt onderdrukt melee minder:** `js/enemies.js` voorkomt dat Water Bolt op hetzelfde moment de *generieke knockback (145)* **én** zijn eigen elementaire waterduw toepast. De waterduw, normale schade, waterstatus en bestaande heavy-/Warden-counter-mechanics blijven aanwezig; andere wapens houden hun algemene impact.
2. **Water Bolt DPS/controle proportioneel terug:** `js/elemental-combat.js` krijgt minimumcooldown **0,98s** (was 0,78s); basisprojectiel `12 + 5×level` (was `14 + 6×level`); Riptide Lance damagebonus **1,15** (was 1,20), evolved pierce **3** (was 4). Fire/Frost en andere Water-wapens blijven gelijk.
3. **Vitality blijft nuttig, maar wist geen complete bossfight uit:** `js/combat-difficulty.js` heeft regenbasis **0,23** (was 0,35) met **dezelfde** afvlakkende curve en herstel pas **na 3s zonder hit**. Vitality L2 wordt circa **0,391 HP/s** (was 0,595), HP-cap en overige abilities veranderen niet. Dit is bewust geen globale verhoging van alle inkomende schade.
4. **Beau/Shade gewone salvo's:** `js/guardian-secondary-attacks.js` bevat nu **drie echte projectiellijnen** in plaats van overlappende 5-projectielfans; centerlines zijn sneller, flanks gedifferentieerd en de schade per geraakte aanval iets hoger. Ghost- en terreinmarkeringen blijven echte collisionzones met minstens **0,76s extra zichtbare waarschuwing**. De grote iconische Guardian Powers worden niet gewijzigd.
5. **Bell/Meme gewone salvo's:** `js/guardian-late-secondary.js` vereenvoudigt **Pixel Rip (5→3)** en **Glitch Double (5→3)** tot een centrale dreiging met herkenbare zijkanten, en maakt de resterende projectielen iets sneller/gevaarlijker. Split Hour behoudt twee zichtbare side-emitter-bellen en zijn **5** projectielen. Bestaande ultieme aanvallen en fasevolgorde blijven intact; verzonnen hitzones/nieuwe horde-spawns worden niet toegevoegd.
6. **Cacheversies:** `index.html` verwijst naar bijgewerkte scripts, zodat een browser met cache de hotfix daadwerkelijk binnenhaalt.

## Technische dekking en acceptatie

- Bestaande Update 32, 32.1, 33 en 34-regressietests zijn aan gewijzigde doelwaarden gekoppeld, waarbij hun controle over schade, waarschuwingen en veilige ontsnappingsruimte behouden blijft.
- `tests/update-36-1-water-pressure-hotfix.test.cjs` bewaakt dat Water Bolt geen **dubbele** knockback meer geeft, de minimale cooldown, Vitality L2, alle vier bosses en consistente geometry tussen hazardmarkers en impacts.
- De laatste echte maker-run is van **vóór deze hotfix**. Automatische Node-tests zijn **geen** bewijs dat Water nu uitdagend of boss-aanvallen in de browser beter leesbaar zijn.
- **Eerstvolgende live acceptatietest:** dezelfde Water Standard Normal run met Developer Mode uit; controleer of normale enemies nu daadwerkelijk je bereik halen, je HP ook tussen bosses relevant blijft, 1×/2×/3× aanvoelen als optionele snelheden, en elke Guardianattack één begrijpelijk dodgepatroon heeft. Registreer hits, damage/healing, gekozen upgrades en QA JSON; vraag waar de nieuwe patronen juist onduidelijk zijn. Vergelijk met 29 hits / 493,99 damage / 532,99 heal uit deze baseline.
- **Geen release-GO:** balansacceptatie 32.1–36.1 blijft OPEN, ook als de technische testgroen is. Update 37 World/Save/Endless staat als volgende geplande feature op de roadmap, maar aanhoudende combatproblemen krijgen prioriteit boven nieuwe features.
