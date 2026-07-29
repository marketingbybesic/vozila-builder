import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { MapPin, BadgeCheck, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FEATURED_DEALERS } from "@/data/dealers";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ovlašteni trgovci i auto saloni",
  description:
    "Pregled provjerenih auto salona i trgovaca vozilima u Hrvatskoj — ponuda, lokacija i kontakt na jednom mjestu.",
};

/**
 * Karlo 28.07: /trgovci je vraćao 404 iako zaglavlje, podnožje i breadcrumb
 * unutar /trgovci/[id] linkaju na njega — postojala je samo [id] ruta.
 */
export default function TrgovciPage() {
  const totalListings = FEATURED_DEALERS.reduce((s, d) => s + d.listings.length, 0);

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Ovlašteni trgovci
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {FEATURED_DEALERS.length} provjerenih salona · {totalListings} vozila u ponudi
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
        {FEATURED_DEALERS.map((dealer) => (
          <article
            key={dealer.id}
            className="rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] bg-[var(--color-surface)] p-4 md:p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 shrink-0 rounded-full bg-[var(--color-ink)] text-white grid place-items-center text-sm font-bold">
                  {dealer.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold leading-tight truncate">{dealer.name}</h2>
                  <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 shrink-0" />
                    {dealer.city}
                    <span className="inline-flex items-center gap-0.5 ml-1.5 text-[var(--color-accent-dark)]">
                      <BadgeCheck className="size-3 shrink-0" />
                      Provjeren
                    </span>
                  </p>
                </div>
              </div>
              <Link
                href={`/trgovci/${dealer.slug}`}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-dark)] hover:underline"
              >
                Profil
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <ul className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
              {dealer.listings.slice(0, 3).map((l) => (
                <li key={l.slug}>
                  {/* Karlo 28.07: dealer oglasi su statični demo podaci i njihovi
                      slugovi NE postoje u bazi → /oglasi/<slug> daje 404.
                      Vodimo na profil trgovca dok dealeri ne budu pravi oglasi. */}
                  <Link href={`/trgovci/${dealer.slug}`} className="group block">
                    <div className="relative aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-line)]">
                      <Image
                        src={l.image}
                        alt={l.title}
                        fill
                        sizes="(max-width: 768px) 33vw, 160px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-medium truncate">{l.title}</p>
                    <p className="text-[11px] font-bold text-[var(--color-accent-dark)]">
                      {formatPrice(l.price)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Container>
  );
}
