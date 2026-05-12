import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { db } from "@/db";

export const metadata: Metadata = { title: "Spremljeni oglasi" };

export default async function SpremljenoPage() {
  const user = await requireUser();
  const saved = await db().getSavedListings(user.id);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Spremljeni oglasi</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {saved.length === 0
            ? "Pratiš 0 oglasa."
            : `Pratiš ${saved.length} ${saved.length === 1 ? "oglas" : "oglasa"}.`}
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-12 text-center">
          <div className="size-14 mx-auto rounded-full bg-[var(--color-line)] grid place-items-center text-[var(--color-muted)]">
            <Heart className="size-6" />
          </div>
          <h2 className="font-display text-xl mt-5">Još nemaš spremljenih oglasa</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
            Klikni srce na oglasu koji ti se sviđa — vratimo ti se s njim ovdje. Pratimo i promjene cijene.
          </p>
          <Button asChild variant="primary" className="mt-6">
            <Link href="/oglasi">Pretraži oglase</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {saved.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
