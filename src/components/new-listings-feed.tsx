"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { SummaryIcon } from "@/components/listing-card";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import { cardSummary } from "@/lib/listing-fields";

function MiniCard({ listing, entering, className = "" }: { listing: Listing; entering: boolean; className?: string }) {
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      className={`group flex gap-3 lg:gap-4 bg-[var(--color-surface)] rounded-[var(--radius-md)] shadow-[var(--shadow-flat)] p-2.5 lg:p-3.5 transition-all duration-500 hover:shadow-[var(--shadow-card)] ${
        entering ? "animate-slide-up" : ""
      } ${className}`}
    >
      {/* Karlo st. 17: na desktopu kartice presitne — slika i tipografija
          povećane SAMO od lg (mobilni nediran). Najsitniji fontovi 10/11px
          dignuti na 12px = ujedno pristupačnost. */}
      <div className="relative w-28 sm:w-32 lg:w-44 aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-line)] shrink-0">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-contain"
          sizes="(min-width: 1024px) 176px, 130px"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="font-bold text-sm lg:text-base truncate group-hover:text-[var(--color-accent-dark)]">
            {listing.title}
          </div>
          <div className="text-[11px] lg:text-xs text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="size-3 lg:size-3.5 shrink-0" />
            {/* ⚠️ Karlo 09.08. (st. 12): `suppressHydrationWarning` je OBAVEZAN.
                Naslovnica je SSG — "prije X h" iz builda ne odgovara klijentovom
                izračunu → React #418, odbaci serversko stablo, i SVI linkovi na
                stranici znaju ostati mrtvi (meni kategorija "ne radi"). */}
            {listing.city} &middot; <span suppressHydrationWarning>{timeAgo(listing.createdAt)}</span>
          </div>
        </div>
        {/* Karlo 28.07: red se mora smjeti prelomiti i skupiti — bez min-w-0
            dugo gorivo ("Električni") gurne karticu preko ruba i cijela
            stranica dobije horizontalni scroll na 390px ekranu. */}
        {/* ⚠️ Karlo 05.08.: ikona se bira po SADRŽAJU (`SummaryIcon`), ne po
            indeksu — inače snaga dobiva ikonu pumpe. Razmak ikona↔tekst
            povećan s `gap-0.5` na `gap-1.5`. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 min-w-0 text-[10px] lg:text-xs text-[var(--color-ink-soft)] mt-1.5">
          {cardSummary(listing).map((part, i) => (
            <span key={part} className={"inline-flex items-center gap-1.5 " + (i === 2 ? "min-w-0" : "shrink-0")}>
              <SummaryIcon part={part} />
              <span className={i === 2 ? "truncate" : ""}>{part}</span>
            </span>
          ))}
        </div>
        <div className="font-display text-base lg:text-xl mt-1">{formatPrice(listing.priceEur)}</div>
      </div>
    </Link>
  );
}

export function NewListingsFeed({ listings }: { listings: Listing[] }) {
  // Karlo 09.08. (st. 11): desktop prikazuje 3 reda × 3 kartice = 9 oglasa.
  // Mobilni i tablet ostaju na 6 — kartice 7–9 su `hidden lg:flex`.
  const [visible, setVisible] = useState(listings.slice(0, 9));
  const [entering, setEntering] = useState(-1);
  const poolRef = useRef(listings);
  const indexRef = useRef(9);

  useEffect(() => {
    poolRef.current = listings;
  }, [listings]);

  useEffect(() => {
    if (poolRef.current.length <= 9) return;
    const timer = setInterval(() => {
      setVisible((prev) => {
        const pool = poolRef.current;
        const nextIdx = indexRef.current % pool.length;
        indexRef.current = nextIdx + 1;
        const next = pool[nextIdx];
        const updated = [next, ...prev.slice(0, 8)];
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
    <div className="grid gap-2.5 lg:gap-4 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      {visible.map((l, i) => (
        <MiniCard
          key={`${l.id}-${i}`}
          listing={l}
          entering={i === entering}
          className={i >= 6 ? "hidden lg:flex" : ""}
        />
      ))}
    </div>
  );
}
