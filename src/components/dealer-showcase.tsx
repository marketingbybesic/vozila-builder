"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { FEATURED_DEALERS, type Dealer } from "@/data/dealers";

function DealerRow({ dealer }: { dealer: Dealer }) {
  const cars = dealer.listings.slice(0, 3);
  return (
    <div className="flex gap-3 text-[var(--color-ink)]">
      {/* Dealer info — left side */}
      <div className="w-28 shrink-0 flex flex-col items-center justify-center text-center">
        <div className="size-10 rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold mb-1.5">
          {dealer.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
        </div>
        <div className="text-xs font-bold leading-tight text-[var(--color-ink)]">{dealer.name}</div>
        <div className="text-[10px] text-[var(--color-ink-soft)] flex items-center gap-0.5 mt-0.5">
          <MapPin className="size-2.5 shrink-0" />
          {dealer.city}
        </div>
        <Link
          href={`/trgovci/${dealer.slug}`}
          className="mt-1 text-[10px] font-medium text-[var(--color-ink-soft)] hover:underline"
        >
          Svi oglasi &rarr;
        </Link>
      </div>
      {/* 3 car thumbnails — right side */}
      <div className="flex-1 grid grid-cols-3 gap-1.5">
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
                sizes="120px"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4">
              <div className="text-[9px] text-white leading-tight truncate">{l.title}</div>
              <div className="text-[10px] text-white font-bold">{l.price.toLocaleString("hr-HR")} &euro;</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DealerShowcase() {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const totalPages = Math.ceil(FEATURED_DEALERS.length / perPage);

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

  const visible = FEATURED_DEALERS.slice(page * perPage, page * perPage + perPage);

  return (
    <div className="bg-[var(--color-accent)] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xl border border-[var(--color-accent-dark)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg md:text-xl tracking-tight inline-flex items-center gap-2 text-[var(--color-ink)]">
          <Star className="size-4 fill-[var(--color-ink)]" />
          Premium trgovci
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-[var(--color-accent-dark)]">{page + 1}/{totalPages}</span>
          <button onClick={prev} className="size-6 rounded bg-white/30 text-[var(--color-ink)] flex items-center justify-center hover:bg-white/50 transition-colors" aria-label="Prethodni">
            <ChevronLeft className="size-3.5" />
          </button>
          <button onClick={next} className="size-6 rounded bg-white/30 text-[var(--color-ink)] flex items-center justify-center hover:bg-white/50 transition-colors" aria-label="Sljedeći">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Three dealers stacked — fill available space */}
      <div className="flex flex-col gap-2 flex-1 animate-fade-in" key={page}>
        {visible.map((d) => (
          <div key={d.id} className="bg-white rounded-[var(--radius-md)] p-2.5 shadow-sm flex-1 flex flex-col justify-center">
            <DealerRow dealer={d} />
          </div>
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

function MobileDealerCard({ dealer }: { dealer: Dealer }) {
  const cars = dealer.listings.slice(0, 3);
  return (
    <div className="text-[var(--color-ink)]">
      <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-[var(--color-line)]">
        <div className="size-10 rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold shrink-0">
          {dealer.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-base leading-tight break-words text-[var(--color-ink)]">{dealer.name}</div>
          <div className="text-xs text-[var(--color-ink-soft)] flex items-center gap-0.5 mt-0.5">
            <MapPin className="size-3 shrink-0" />
            {dealer.city}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {cars.map((l) => (
          <Link
            key={l.slug}
            href={`/oglasi/${l.slug}`}
            className="group relative rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-line)]"
          >
            <div className="aspect-[3/4] relative">
              <Image
                src={l.image}
                alt={l.title}
                fill
                className="object-cover"
                sizes="140px"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-5">
              <div className="text-[11px] text-white font-bold">{l.price.toLocaleString("hr-HR")} &euro;</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DealerShowcaseMobile() {
  return (
    <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
      <div className="flex gap-3" style={{ width: `${FEATURED_DEALERS.length * 290}px` }}>
        {FEATURED_DEALERS.map((d) => (
          <div
            key={d.id}
            className="w-[275px] shrink-0 bg-[var(--color-surface)] text-[var(--color-ink)] rounded-[var(--radius-md)] border border-[var(--color-line)] p-3"
          >
            <MobileDealerCard dealer={d} />
          </div>
        ))}
      </div>
    </div>
  );
}
