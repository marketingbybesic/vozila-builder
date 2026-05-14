import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ListingCard } from "@/components/listing-card";
import { db } from "@/db";

export const metadata: Metadata = {
  title: "Najnoviji oglasi",
  description: "Posljednjih 100 oglasa rabljenih i novih automobila u Hrvatskoj.",
};

export default async function NajnovijiPage() {
  const { items } = await db().listListings({ sort: "newest", page: 1 });

  // listListings paginates at 12; we want last 100 — fetch a few pages
  const allItems = await fetchUpTo100();

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Najnoviji oglasi</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Posljednjih {allItems.length} oglasa — od najnovijeg prema starijem.
        </p>
        <Link
          href="/oglasi"
          className="inline-block mt-3 text-sm font-medium text-[var(--color-accent-dark)] hover:underline"
        >
          Vidi sve oglase →
        </Link>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allItems.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </Container>
  );
}

async function fetchUpTo100() {
  const out = [];
  for (let page = 1; page <= 9; page++) {
    const { items, total } = await db().listListings({ sort: "newest", page });
    out.push(...items);
    if (out.length >= 100 || out.length >= total) break;
  }
  return out.slice(0, 100);
}
