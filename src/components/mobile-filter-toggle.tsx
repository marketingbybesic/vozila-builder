"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";

export function MobileFilterToggle({ count }: { count: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ⚠️ Karlo 05.08.2026: bila ikona klizača (postavke) + tekst "Filtri" —
          gumb je bio širok pa se raspored lomio u dva neporavnata reda.
          Sad je ikona LJEVKA bez teksta, kvadratni gumb iste visine (h-9) kao
          prekidač prikaza i sortiranje pokraj njega → sve u jednom retku.
          Broj aktivnih filtera ide u bedž na uglu (prije "(3)" u tekstu).
          ⚠️ `size-12` = 48 px, ista visina kao izbornik sortiranja (izmjereno);
          sa `size-9` bi gumb bio niži i redak bi opet izgledao neporavnato. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count > 0 ? `Filtri (${count} aktivnih)` : "Filtri"}
        title="Filtri"
        className="lg:hidden relative size-12 shrink-0 grid place-items-center rounded-[var(--radius-md)] border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        <Filter className="size-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--color-accent)] text-[var(--color-ink)] text-[10px] font-bold grid place-items-center">
            {count}
          </span>
        )}
      </button>

      {/* Pop-up SAMO na mobitelu — na desktopu su filteri stalno u bočnom
          stupcu (`OglasiSidebar`), pa bi preklop ondje bio duplikat. */}
      {open && (
        <div className="lg:hidden">
          <FilterSidebar mobile onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
