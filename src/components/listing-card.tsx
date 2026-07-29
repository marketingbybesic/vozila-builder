import Link from "next/link";
import Image from "next/image";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/save-button";
import { CompareButton } from "@/components/compare-button";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing, variant = "grid" }: { listing: Listing; variant?: "grid" | "list" }) {
  if (variant === "list") return <ListingRow listing={listing} />;
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      /* Kartica se čita kao FOTOGRAFIJA s podacima, ne kao ograđena kutija: okvir
         je zamijenjen elevationom (prije: okvir + sjena na hoveru + linija iznad
         cijene = trostruko ograđivanje istog sadržaja). */
      className="group relative flex flex-col bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-flat)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1"
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

        <div className="mt-auto pt-3 border-t border-[var(--color-line-soft)] flex items-end justify-between gap-2">
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

/** List (redak) prikaz — slika lijevo, detalji desno. */
function ListingRow({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/oglasi/${listing.slug}`}
      className="group relative flex bg-[var(--color-surface)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-flat)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative w-32 sm:w-52 shrink-0 self-stretch min-h-[112px] bg-[var(--color-line)] overflow-hidden">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 128px, 208px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {listing.featured && (
          <Badge variant="accent" className="absolute top-2 left-2 shadow-sm text-[10px]">Izdvojeno</Badge>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base sm:text-lg leading-tight line-clamp-1 group-hover:text-[var(--color-accent-dark)] transition-colors">
            {listing.make} {listing.model}
          </h3>
          {listing.variant && (
            <p className="text-xs text-[var(--color-muted)] line-clamp-1 mt-0.5">{listing.variant}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-ink-soft)] mt-1.5">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{listing.year}.</span>
            <span className="inline-flex items-center gap-1"><Gauge className="size-3" />{formatKm(listing.km)}</span>
            <span className="inline-flex items-center gap-1"><Fuel className="size-3" />{listing.fuel}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{listing.city}</span>
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="font-display text-lg sm:text-xl text-[var(--color-ink)] tracking-tight">
            {formatPrice(listing.priceEur)}
          </div>
          {listing.originalPriceEur && listing.originalPriceEur > listing.priceEur && (
            <div className="text-xs text-[var(--color-muted)] line-through">
              {formatPrice(listing.originalPriceEur)}
            </div>
          )}
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{timeAgo(listing.createdAt)}</div>
        </div>
      </div>
    </Link>
  );
}
