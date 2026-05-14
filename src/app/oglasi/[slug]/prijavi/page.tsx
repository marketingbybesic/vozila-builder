import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { db } from "@/db";
import { reportListingAction } from "@/actions/reports";

export const metadata: Metadata = {
  title: "Prijavi oglas",
  description: "Prijavi sumnjiv oglas. Naš tim provjerava svaku prijavu.",
};

export default async function ReportListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await db().getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <Container className="py-10 max-w-2xl">
      <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
        <span>›</span>
        <Link href={`/oglasi/${slug}`} className="hover:text-[var(--color-ink)] truncate">
          {listing.title}
        </Link>
        <span>›</span>
        <span className="text-[var(--color-ink-soft)]">Prijavi</span>
      </nav>

      <h1 className="font-display text-3xl tracking-tight">Prijavi oglas</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Pomažeš nam očuvati kvalitetu Auti.hr. Sve prijave čita admin tim u 24h.
      </p>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm">
        <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-1">
          Oglas
        </div>
        <div className="font-medium">{listing.title}</div>
        <div className="text-xs text-[var(--color-muted)] mt-0.5">
          {listing.city} · {listing.sellerName}
        </div>
      </div>

      <form action={reportListingAction} className="mt-6 space-y-4">
        <input type="hidden" name="listingId" value={listing.id} />
        <input type="hidden" name="slug" value={listing.slug} />

        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-1.5">
            Razlog prijave
          </label>
          <select
            id="reason"
            name="reason"
            required
            defaultValue="fraud"
            className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-sm"
          >
            <option value="fraud">Sumnja na prijevaru</option>
            <option value="duplicate">Duplikat oglasa</option>
            <option value="wrong-data">Netočni podaci</option>
            <option value="inappropriate">Neprikladan sadržaj</option>
            <option value="other">Ostalo</option>
          </select>
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-1.5">
            Opis (min 20 znakova)
          </label>
          <textarea
            id="body"
            name="body"
            required
            minLength={20}
            maxLength={2000}
            rows={6}
            className="w-full p-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-sm leading-relaxed"
            placeholder="Što je sumnjivo? Što si primijetio?"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="h-11 px-5 rounded-md bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-soft)]"
          >
            Pošalji prijavu
          </button>
          <Link
            href={`/oglasi/${slug}`}
            className="h-11 px-5 rounded-md border border-[var(--color-line)] inline-flex items-center text-sm font-medium hover:bg-[var(--color-line)]/40"
          >
            Odustani
          </Link>
        </div>
      </form>
    </Container>
  );
}
