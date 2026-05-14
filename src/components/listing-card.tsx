import Link from "next/link";
import Image from "next/image";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/save-button";
import { CompareButton } from "@/components/compare-button";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      className="group relative flex flex-col bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden transition-all duration-200 hover:border-[var(--color-ink-soft)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-[var(--color-line)] overflow-hidden">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.featured && (
            <Badge variant="accent" className="shadow-sm">Izdvojeno</Badge>
          )}
          {listing.condition === "Novo" && (
            <Badge variant="ink" className="shadow-sm">Novo</Badge>
          )}
        </div>
        <SaveButton listingId={listing.id} />
        <CompareButton slug={listing.slug} />
        <div className="absolute bottom-3 right-3">
          <Badge variant="outline" className="bg-white/90 backdrop-blur border-transparent">
            {listing.sellerType}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="font-display text-lg leading-tight line-clamp-1 group-hover:text-[var(--color-accent-dark)] transition-colors">
            {listing.make} {listing.model}
          </h3>
          {listing.variant && (
            <p className="text-xs text-[var(--color-muted)] line-clamp-1 mt-0.5">
              {listing.variant}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-[var(--color-ink-soft)]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" />
            {listing.year}.
          </span>
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3" />
            {formatKm(listing.km)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Fuel className="size-3" />
            {listing.fuel}
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-[var(--color-line)] flex items-end justify-between gap-2">
          <div>
            <div className="font-display text-xl text-[var(--color-ink)] tracking-tight inline-flex items-baseline gap-2 flex-wrap">
              {formatPrice(listing.priceEur)}
              {listing.originalPriceEur && listing.originalPriceEur > listing.priceEur && (
                <>
                  <span className="text-sm text-[var(--color-muted)] line-through decoration-1 font-normal">
                    {formatPrice(listing.originalPriceEur)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent-dark)]">
                    -{Math.round(((listing.originalPriceEur - listing.priceEur) / listing.originalPriceEur) * 100)}%
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-[var(--color-muted)] inline-flex items-center gap-1 mt-0.5">
              <MapPin className="size-3" />
              {listing.city}
            </div>
          </div>
          <span className="text-[11px] text-[var(--color-muted)]">
            {timeAgo(listing.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
