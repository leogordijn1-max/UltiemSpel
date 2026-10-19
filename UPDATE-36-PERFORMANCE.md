# Update 36 — FPS, P95 en memory-benchmark

**19 oktober 2026 · branch `feature/living-world-prototype`**

**Status: code gebouwd, echte browserperformance-acceptatie OPEN.**

## Technisch gebouwd

- `js/run-telemetry.js` maakt per ongeveer 5 seconden **actieve, echte browserframes** een sample met FPS, P95, piekframe en aantal frames boven 33,33 ms. De P95 gebruikt maximaal 1.200 frames van het venster (niet alleen de laatste 120 zoals eerder). Het rapport blijft begrensd tot 420 vensters.
- Ieder sample krijgt **gemiddelde gemeten AI-, collision- en render-ms per frame**, niet de laatste momentopname van de 5 seconden. Ook huidige vijanden, projectielen en effecten staan erbij.
- Elk venster bevat `graphicsQuality`, `gameSpeed` en `encounter` (field/Guardian). Als een waarde midden in het venster verandert, wordt die `mixed`; zo vergelijken we geen ongelijke instellingen.
- Optioneel `heapUsedMB` via `performance.memory.usedJSHeapSize` als de browser deze niet-standaard functie aanbiedt (vooral Chromium). Anders `null` — niet nul. Heapgebruik verandert ook door garbagecollection en bewijst zonder herhaald onderzoek geen leak.
- `js/game.js` ruimt `particles` en `texts` **in-place** op, zonder twee nieuwe arrays per simulatiestap. Volgorde, VFX-levensduur, damage, collisions, spawns, warnings, Boss- en Water-mechanics blijven gelijk.
- Nieuw: `node scripts/performance-report.cjs bestand.json` analyseert de lokaal geëxporteerde QA JSON zonder upload. Het groepeert FPS, gemiddelde en slechtste *5-seconden*-P95, AI/collision/draw-ms, hoogste vijandenaantal en beschikbare heapmetingen per kwaliteit × snelheid × boss. De P95-statistiek is **geen exacte runbrede P95**.

## Maker-playtest (nog open)

1. Speel **Standard Normal** met **Settings → QA recording AAN** en **Developer Mode UIT**, op dezelfde desktop/browser/resolutie. Begin met High en speel zo mogelijk 25–30 minuten.
2. Let op drukte rond minuut 6 (The Anchor), minuut 12 (Warden), de laatste waves en de vier Guardian-fases. Speel ook delen op **1×, 2×, 3×** en controleer dat waarschuwingen/hitzones zichtbaar en ontwijkbaar blijven.
3. Herhaal het liefst vergelijkbaar op **Medium** en **Low** met hetzelfde element en een soortgelijke build. Vergelijk alleen vensters met gelijke labels en vergelijkbare vijandenaantallen. Sla `mixed` over.
4. Exporteer via **DOWNLOAD QA REPORT · JSON** en analyseer lokaal met `node scripts/performance-report.cjs pad/naar/bestand.json`. Onderzoek P95-vensters boven 33,3 ms, haperingen boven 50 ms, CPU- of rendertijdpieken en boss-overlap.
5. Bij memory-zorgen: vergelijk meerdere overeenkomende vroege/late momenten; maak indien nodig Chrome DevTools heap snapshots over herhaalde runs. Heapstijging alleen is geen lekbewijs. Browser zonder heap-API retourneert `null`.

**Node-tests controleren meetfuncties, rapportage en arraygedrag, maar er is in Update 36 geen echte live-browserrun of GPU-/geheugenmeting door de maker uitgevoerd.** Dus nog geen echte FPS-winst bewezen en performance-releasegate nog OPEN. Eerdere Update 32.1, 33, 34 en 35 browser-QA blijft ook open. Volgende geplande stap na deze code: **Update 37 — World, Save & Endless browserflow**.
