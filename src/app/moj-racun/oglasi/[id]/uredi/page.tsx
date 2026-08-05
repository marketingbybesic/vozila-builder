import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { EditListingForm } from "@/components/edit-listing-form";
import { requireUser } from "@/lib/session";
import { db } from "@/db";

export const metadata: Metadata = { title: "Uredi oglas" };

/**
 * Uređivanje vlastitog oglasa (Dino 05.08.2026: "Uredi ne radi u prikazu mojih
 * oglasa").
 *
 * ⚠️ Oglas se dohvaća preko `getListingsByUser`, NE `getListingBySlug` —
 * potonji traži `status = "active"`, pa se pauzirani oglas ili skica ne bi
 * mogli urediti. Ujedno je to i provjera vlasništva: popis vraća samo oglase
 * prijavljenog korisnika.
 */
export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const mine = await db().getListingsByUser(user.id);
  const listing = mine.find((l) => l.id === id);
  if (!listing) notFound();

  return (
    <div>
      <Link
        href="/moj-racun/oglasi"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-4"
      >
        <ChevronLeft className="size-4" />
        Moji oglasi
      </Link>

      <h1 className="font-display text-3xl md:text-4xl tracking-tight">Uredi oglas</h1>
      <p className="text-sm text-[var(--color-muted)] mt-1 mb-8">
        {listing.make} {listing.model}
        {listing.variant ? ` ${listing.variant}` : ""} · {listing.year}.
      </p>

      <EditListingForm listing={listing} />
    </div>
  );
}
