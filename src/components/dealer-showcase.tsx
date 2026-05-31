"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { FEATURED_DEALERS, type Dealer } from "@/data/dealers";

const PER_PAGE = 2; // max 2 trgovca, jedan ispod drugog

/** One dealer block: header + 6 listings in a 3-col grid (2 rows). */
function DealerBlock({ dealer }: { dealer: Dealer }) {
  const cars = dealer.listings.slice(0, 6);
  return (
    <div className="bg-white rounded-[var(--radius-md)] p-3 shadow-sm text-[var(--color-ink)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {dealer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate text-[var(--color-ink)]">
              {dealer.name}
            </div>
            <div className="text-[10px] text-[var(--color-ink-soft)] flex items-center gap-0.5">
              <MapPin className="size-2.5 shrink-0" />
              {dealer.city}
            </div>
          </div>
        </div>
        <Link
          href={`/trgovci/${dealer.slug}`}
          className="text-[10px] font-medium text-[var(--color-ink-soft)] hover:underline shrink-0"
        >
          Svi oglasi &rarr;
        </Link>
      </div>

      {/* 6 listings: 3 columns × 2 rows */}
      <div className="grid grid-cols-3 gap-1.5">
        {cars.map((l) => (
          <Link
            key={l.slug}
            href={`/oglasi/${l.slug}`}
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

  return (
    <div className="bg-[var(--color-accent)] rounded-[var(--radius-lg)] p-4 md:p-5 shadow-xl border border-[var(--color-accent-dark)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg md:text-xl tracking-tight inline-flex items-center gap-2 text-[var(--color-ink)]">
          <Star className="size-4 fill-[var(--color-ink)]" />
          Premium trgovci
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-[var(--color-accent-dark)]">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={prev}
            className="size-6 rounded bg-white/30 text-[var(--color-ink)] flex items-center justify-center hover:bg-white/50 transition-colors"
            aria-label="Prethodni"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={next}
            className="size-6 rounded bg-white/30 text-[var(--color-ink)] flex items-center justify-center hover:bg-white/50 transition-colors"
            aria-label="Sljedeći"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Max 2 dealers, stacked vertically */}
      <div className="flex flex-col gap-2.5 flex-1 animate-fade-in" key={page}>
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
              i === page ? "bg-[var(--color-ink)]" : "bg-white/40"
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
