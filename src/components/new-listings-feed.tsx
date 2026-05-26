"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";
import type { Listing } from "@/lib/types";

function MiniCard({ listing, entering }: { listing: Listing; entering: boolean }) {
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      className={`group flex gap-3 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-line)] p-2.5 transition-all duration-500 hover:border-[var(--color-ink-soft)] hover:shadow-[var(--shadow-card)] ${
        entering ? "animate-slide-up" : ""
      }`}
    >
      <div className="relative w-28 sm:w-32 aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-line)] shrink-0">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="130px"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="font-bold text-sm truncate group-hover:text-[var(--color-accent-dark)]">
            {listing.title}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="size-3 shrink-0" />
            {listing.city} &middot; {timeAgo(listing.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-ink-soft)] mt-1.5">
          <span className="inline-flex items-center gap-0.5"><Calendar className="size-3" />{listing.year}</span>
          <span className="inline-flex items-center gap-0.5"><Gauge className="size-3" />{formatKm(listing.km)}</span>
          <span className="inline-flex items-center gap-0.5"><Fuel className="size-3" />{listing.fuel}</span>
        </div>
        <div className="font-display text-base mt-1">{formatPrice(listing.priceEur)}</div>
      </div>
    </Link>
  );
}

export function NewListingsFeed({ listings }: { listings: Listing[] }) {
  const [visible, setVisible] = useState(listings.slice(0, 6));
  const [entering, setEntering] = useState(-1);
  const poolRef = useRef(listings);
  const indexRef = useRef(6);

  useEffect(() => {
    poolRef.current = listings;
  }, [listings]);

  useEffect(() => {
    if (poolRef.current.length <= 6) return;
    const timer = setInterval(() => {
      setVisible((prev) => {
        const pool = poolRef.current;
        const nextIdx = indexRef.current % pool.length;
        indexRef.current = nextIdx + 1;
        const next = pool[nextIdx];
        const updated = [next, ...prev.slice(0, 5)];
        return updated;
      });
      setEntering(0);
      setTimeout(() => setEntering(-1), 600);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((l, i) => (
        <MiniCard key={`${l.id}-${i}`} listing={l} entering={i === entering} />
      ))}
    </div>
  );
}
