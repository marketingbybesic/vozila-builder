"use client";

/**
 * Desktop wrapper oko FilterSidebar — bočni stupac s brzim filterima.
 * Kad je skriveno, rezultati zauzmu cijelu širinu (page koristi ovo stanje
 * preko CSS-a: aside se sakrije, grid postane jedan stupac).
 */

import { FilterSidebar } from "@/components/filter-sidebar";

/**
 * Bočni filteri na DESKTOPU (Karlo 05.08.2026).
 *
 * ⚠️ "Filteri ostaju u sidebaru u punoj visini bez da osoba mora scrollati."
 * Zato: visina `calc(100vh - 8rem)` i VLASTITI okomiti scroll. Panel stoji na
 * mjestu dok se rezultati desno pomiču, a dugačak popis filtera se kotrlja
 * unutar panela — ne pomiče cijelu stranicu.
 *
 * ⚠️ `sticky` NIJE ovdje nego na roditeljskom `<aside>` u `app/oglasi/page.tsx`,
 * uz `self-start`. Bez toga se grid stavka rastegne na visinu retka (1626 px),
 * pa `sticky` dijete unutar nje otpluta do dna i uopće se ne zalijepi.
 *
 * Prekidač za skrivanje je UKLONJEN — Karlo: "ikona ne mora skrivati filtere".
 * Na mobitelu filteri idu kroz pop-up (`MobileFilterToggle`).
 *
 * ⚠️ Karlo 05.08.2026 (2): "podigni gore da kreće od ruba oglasa" — naslov
 * "Filtri" iznad panela spuštao ga je ~44 px ispod prve kartice. Maknut je;
 * ljevak u traci iznad ionako označava filtere, pa naslov nije nosio značenje.
 */
export function OglasiSidebar() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* `min-h-0` je nužan — bez njega flex dijete ne dopušta scroll djetetu.
          Scroll ostaje kao zaštita: na niskim ekranima (npr. 768 px) i osnovni
          set može premašiti visinu. */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        <FilterSidebar compact />
      </div>
    </div>
  );
}
