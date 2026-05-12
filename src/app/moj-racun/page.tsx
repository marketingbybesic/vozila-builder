import Link from "next/link";
import type { Metadata } from "next";
import { Car, Heart, MessageSquare, Eye, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { LISTINGS } from "@/data/listings";

export const metadata: Metadata = { title: "Moj račun" };

export default function MojRacunPage() {
  const myListings = LISTINGS.slice(0, 3);
  const stats = [
    { label: "Aktivni oglasi", value: "3", icon: Car, change: "+1" },
    { label: "Ukupno pregleda", value: "1.847", icon: Eye, change: "+342" },
    { label: "Spremili kupci", value: "28", icon: Heart, change: "+5" },
    { label: "Nove poruke", value: "3", icon: MessageSquare, change: "Danas" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Bok, Ivan</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Ovo se događa s tvojim oglasima u zadnjih 7 dana.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
              <div className="flex items-start justify-between">
                <Icon className="size-5 text-[var(--color-muted)]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-success)] inline-flex items-center gap-0.5">
                  <TrendingUp className="size-3" />
                  {s.change}
                </span>
              </div>
              <div className="font-display text-3xl mt-3 tracking-tight">{s.value}</div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <section className="bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] text-white rounded-[var(--radius-lg)] p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Imaš još jedan auto za prodaju?</h2>
          <p className="mt-1 text-sm text-white/70">Drugi oglas je 4,90 € — dva oglasa u istom danu daju 30% više pregleda.</p>
        </div>
        <Button asChild variant="accent" size="lg">
          <Link href="/objavi">
            <Plus className="size-4" />
            Novi oglas
          </Link>
        </Button>
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl tracking-tight">Tvoji aktivni oglasi</h2>
          <Link href="/moj-racun/oglasi" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-accent-dark)]">
            Svi moji oglasi →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {myListings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </div>
  );
}
