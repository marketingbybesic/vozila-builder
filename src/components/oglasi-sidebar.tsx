"use client";

/**
 * Desktop wrapper oko FilterSidebar s "Sakrij filtere" / "Prikaži filtere".
 * Kad je skriveno, rezultati zauzmu cijelu širinu (page koristi ovo stanje
 * preko CSS-a: aside se sakrije, grid postane jedan stupac).
 */

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";

export function OglasiSidebar() {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="sticky top-20 inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
      >
        <PanelLeftOpen className="size-4" /> Prikaži filtere
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent-dark)] hover:underline"
      >
        <PanelLeftClose className="size-4" /> Sakrij filtere
      </button>
      <FilterSidebar />
    </div>
  );
}
