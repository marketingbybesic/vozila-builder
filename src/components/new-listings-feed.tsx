"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { SummaryIcon } from "@/components/listing-card";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import { cardSummary } from "@/lib/listing-fields";

function MiniCard({ listing, entering }: { listing: Listing; entering: boolean }) {
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      className={`group flex gap-3 bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-flat)] p-2.5 transition-all duration-500 hover:shadow-[var(--shadow-card)] ${
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
        {/* Karlo 28.07: red se mora smjeti prelomiti i skupiti — bez min-w-0
            dugo gorivo ("Električni") gurne karticu preko ruba i cijela
            stranica dobije horizontalni scroll na 390px ekranu. */}
        {/* ⚠️ Karlo 05.08.: ikona se bira po SADRŽAJU (`SummaryIcon`), ne po
            indeksu — inače snaga dobiva ikonu pumpe. Razmak ikona↔tekst
            povećan s `gap-0.5` na `gap-1.5`. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 min-w-0 text-[10px] text-[var(--color-ink-soft)] mt-1.5">
          {cardSummary(listing).map((part, i) => (
            <span key={part} className={"inline-flex items-center gap-1.5 " + (i === 2 ? "min-w-0" : "shrink-0")}>
              <SummaryIcon part={part} />
              <span className={i === 2 ? "truncate" : ""}>{part}</span>
            </span>
          ))}
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

  // Karlo 28.07: grid stavke se po zadanom ne smiju skupiti ispod svoje
  // min-content širine → kartica naraste preko 390px ekrana i cijela stranica
  // dobije horizontalni scroll. minmax(0,1fr) to dopušta na svakoj razini.
  return (
    <div className="grid gap-2.5 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      {visible.map((l, i) => (
        <MiniCard key={`${l.id}-${i}`} listing={l} entering={i === entering} />
      ))}
    </div>
  );
}
