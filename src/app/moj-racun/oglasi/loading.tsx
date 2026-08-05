import { ListingSkeletonList } from "@/components/listing-skeleton";

/**
 * Prikazuje se dok se `page.tsx` dohvaća na serveru (Next App Router).
 *
 * ⚠️ Dino 05.08.2026: "Moji oglasi dugo se učitavaju i čine se neresponzivnima."
 * Prije NIJEDNA ruta nije imala `loading.tsx` — korisnik je gledao prazan ekran
 * i mislio da je stranica pukla. Kostur zadržava raspored, pa sadržaj ne
 * "poskoči" kad stigne.
 */
export default function Loading() {
  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Moji oglasi</h1>
          <div className="skeleton h-4 w-40 rounded mt-2" />
        </div>
        <div className="skeleton h-11 w-44 rounded-[var(--radius-md)]" />
      </header>

      {/* Kartice statusa */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[64, 84, 92, 76].map((w, i) => (
          <div
            key={w}
            className="skeleton h-9 rounded-[var(--radius-md)]"
            style={{ width: w, "--shimmer-delay": `${i * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </div>

      <ListingSkeletonList count={5} />
    </div>
  );
}
