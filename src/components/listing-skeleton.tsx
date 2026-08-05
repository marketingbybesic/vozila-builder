/**
 * Kostur kartice oglasa dok se podaci učitavaju (Dino 05.08.2026).
 *
 * ⚠️ Raspored mora ODGOVARATI stvarnoj kartici (200 px slika + tekst + radnje),
 * inače sadržaj "poskoči" kad stigne — to je gore od praznog ekrana.
 * Vidi `app/moj-racun/oglasi/page.tsx`, grid `[200px_1fr_auto]`.
 *
 * `--shimmer-delay` pomiče susjedne kartice u fazi, pa svjetlo putuje niz popis
 * kao val umjesto da sve trepće u isti čas.
 */
export function ListingSkeleton({ index = 0 }: { index?: number }) {
  const delay = `${(index % 4) * 0.12}s`;
  return (
    <article
      aria-hidden
      className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden"
    >
      <div className="grid sm:grid-cols-[200px_1fr_auto] gap-4 p-4">
        <div
          className="skeleton aspect-[4/3] sm:aspect-auto sm:h-32 rounded-md"
          style={{ "--shimmer-delay": delay } as React.CSSProperties}
        />

        <div className="min-w-0 space-y-2.5 py-1">
          <div className="flex items-center gap-2">
            <div className="skeleton h-5 w-16 rounded-full" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
            <div className="skeleton h-3 w-24 rounded" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
          </div>
          <div className="skeleton h-5 w-2/3 rounded" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
          <div className="skeleton h-3 w-1/2 rounded" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
          <div className="flex gap-4 pt-1">
            <div className="skeleton h-3 w-20 rounded" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
            <div className="skeleton h-3 w-20 rounded" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
          </div>
        </div>

        <div className="sm:text-right space-y-2 py-1">
          <div className="skeleton h-6 w-24 rounded sm:ml-auto" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
          <div className="skeleton h-3 w-16 rounded sm:ml-auto" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] px-4 py-2.5 flex gap-2 bg-[var(--color-bg)]/50">
        <div className="skeleton h-6 w-16 rounded-md" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
        <div className="skeleton h-6 w-20 rounded-md" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
        <div className="skeleton h-6 w-16 rounded-md" style={{ "--shimmer-delay": delay } as React.CSSProperties} />
      </div>
    </article>
  );
}

/** Popis kostura — koristi se u `loading.tsx`. */
export function ListingSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <ListingSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
