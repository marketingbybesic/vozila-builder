"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { FEATURED_DEALERS, type Dealer } from "@/data/dealers";

const PER_PAGE = 2; // max 2 trgovca, jedan ispod drugog

/** One dealer block: header + 3 listings u jednom redu.
    Karlo 29.07: bilo 6 (2 reda) — narančasti blok je bio dvostruko viši od
    pretrage pa hero nije stao u jedan ekran. */
function DealerBlock({ dealer }: { dealer: Dealer }) {
  const cars = dealer.listings.slice(0, 3);
  return (
    <div className="bg-white rounded-[var(--radius-md)] p-2.5 shadow-sm text-[var(--color-ink)] flex-1 flex flex-col justify-center">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* ⚠️ Dino 05.08.2026: logotip I ime vode na profil trgovca — prije su
            bili obični `<div>`-ovi, pa je jedini ulaz bio "Svi oglasi →".
            Cijelo zaglavlje je jedan link (veći dodirni cilj na mobitelu). */}
        <Link
          href={`/trgovci/${dealer.slug}`}
          className="flex items-center gap-2 min-w-0 group/dealer rounded-md -m-1 p-1 hover:bg-[var(--color-line)]/40 transition-colors"
        >
          {dealer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dealer.logoUrl}
              alt={dealer.name}
              className="size-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {dealer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate text-[var(--color-ink)] group-hover/dealer:text-[var(--color-accent-dark)] transition-colors">
              {dealer.name}
            </div>
            <div className="text-[10px] text-[var(--color-ink-soft)] flex items-center gap-0.5">
              <MapPin className="size-2.5 shrink-0" />
              {dealer.city}
            </div>
          </div>
        </Link>
        <Link
          href={`/trgovci/${dealer.slug}`}
          className="text-[10px] font-medium text-[var(--color-ink-soft)] hover:underline shrink-0"
        >
          Svi oglasi &rarr;
        </Link>
      </div>

      {/* 3 listings u jednom redu.
          ⚠️ Karlo 05.08.2026: klik na sliku auta sad vodi na PRAVI OGLAS.
          Prije je vodio na profil trgovca jer su ovi oglasi bili statični demo
          bez zapisa u bazi (404). Skripta `scripts/seed-dealers.mts` seedala ih
          je kao prave oglase pravih korisnika, pa slug sada postoji. */}
      <div className="grid grid-cols-3 gap-1.5">
        {cars.map((l) => (
          <Link
            key={l.slug}
            href={`/oglasi/${l.slug}`}
            prefetch={false}
            className="group relative rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-line)]"
          >
            <div className="aspect-[4/3] relative">
              <Image
                src={l.image}
                alt={l.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="140px"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4">
              <div className="text-[10px] text-white font-bold">
                {l.price.toLocaleString("hr-HR")} &euro;
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Shared 2-dealers-stacked panel with paging. Used on desktop and mobile. */
export function DealerShowcase() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(FEATURED_DEALERS.length / PER_PAGE);

  const next = useCallback(() => {
    setPage((p) => (p + 1) % totalPages);
  }, [totalPages]);

  const prev = useCallback(() => {
    setPage((p) => (p - 1 + totalPages) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  const visible = FEATURED_DEALERS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // Dino 31.07: puna narančasta uz hero fotografiju tukla se sa slikom i
  // nadglasavala tražilicu (najvažniji element). Sada tamna staklena ploha sa
  // ZLATNIM rubom — isti brand-akcent, ali se uklapa u fotografiju. Naslov i
  // cijene ostaju narančasti, pa Premium trgovci i dalje "svijetle".
  return (
    <div className="bg-[var(--color-ink)]/85 backdrop-blur-sm rounded-[var(--radius-lg)] p-[13px] md:p-[21px] shadow-[0_24px_64px_rgb(2_8_20/55%)] ring-1 ring-[var(--color-accent)]/45 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg md:text-xl tracking-tight inline-flex items-center gap-2 text-[var(--color-accent)]">
          <Star className="size-4 fill-[var(--color-accent)]" />
          Premium trgovci
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-white/60">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={prev}
            className="size-6 rounded bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Prethodni"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={next}
            className="size-6 rounded bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Sljedeći"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Max 2 dealers, stacked vertically.
          Karlo 29.07: panel se `h-full`-om razvlači do visine bijelog, pa je
          `flex-1` sam ostavljao praznu žutu traku ispod zadnje kartice.
          `justify-between` + `justify-center` u kartici raspoređuju višak
          prostora IZMEĐU i UNUTAR kartica umjesto da se skupi na dnu. */}
      <div className="flex flex-col gap-2.5 flex-1 justify-between animate-fade-in" key={page}>
        {visible.map((d) => (
          <DealerBlock key={d.id} dealer={d} />
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`size-2 rounded-full transition-colors ${
              i === page ? "bg-[var(--color-accent)]" : "bg-white/25"
            }`}
            aria-label={`Stranica ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Mobile uses the same stacked panel — no horizontal scroll. */
export function DealerShowcaseMobile() {
  return <DealerShowcase />;
}
