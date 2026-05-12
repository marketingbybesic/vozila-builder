import type { Metadata } from "next";
import { SavedListingsView } from "@/components/saved-listings-view";

export const metadata: Metadata = { title: "Spremljeni oglasi" };

export default function SpremljenoPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Spremljeni oglasi</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Oglasi koje pratiš. Dobit ćeš obavijest ako prodavač spusti cijenu.
        </p>
      </header>

      <SavedListingsView />
    </div>
  );
}
