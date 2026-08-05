"use client";

/**
 * Desktop wrapper oko FilterSidebar s "Sakrij filtere" / "Prikaži filtere".
 * Kad je skriveno, rezultati zauzmu cijelu širinu (page koristi ovo stanje
 * preko CSS-a: aside se sakrije, grid postane jedan stupac).
 */

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";

/**
 * ⚠️ Karlo 05.08.2026: "nedostaje ista ikona na desktopu".
 * Mobilni prekidač koristi ikonu LJEVKA (`Filter`), a desktop je imao ikone
 * panela (`PanelLeftClose/Open`) uz tekst — dvije različite ikone za istu radnju.
 * Sad je i ovdje ljevak, u kvadratnom gumbu istog izgleda kao na mobitelu.
 */
export function OglasiSidebar() {
  const [hidden, setHidden] = useState(false);

  const gumb =
    "relative size-10 shrink-0 grid place-items-center rounded-[var(--radius-md)] border transition-colors";

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        aria-label="Prikaži filtere"
        title="Prikaži filtere"
        className={`${gumb} sticky top-20 border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]`}
      >
        <Filter className="size-4" />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Sakrij filtere"
        title="Sakrij filtere"
        className={`${gumb} mb-3 border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)] hover:bg-[var(--color-accent)]/20`}
      >
        <Filter className="size-4" />
        {/* Križić u kutu — jasno da klik ZATVARA otvoreni panel. */}
        <X className="size-2.5 absolute top-1 right-1 opacity-70" />
      </button>
      <FilterSidebar />
    </div>
  );
}
