import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { MAKES } from "@/data/makes";
import { db } from "@/db";
import { slugify } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sve marke automobila",
  description: "Pregled svih marki automobila — od A do Z. Klikni marku za sve aktivne oglase.",
};

export default async function MarkePage() {
  const { items: all } = await db().listListings({ page: 1 });
  // pull total counts per make via a few pages; simpler is to fetch all active and count
  const counts = await tallyByMake();

  const grouped = MAKES.slice()
    .sort((a, b) => a.name.localeCompare(b.name, "hr"))
    .reduce<Record<string, typeof MAKES>>((acc, m) => {
      const letter = m.name.charAt(0).toUpperCase();
      (acc[letter] ??= []).push(m);
      return acc;
    }, {});

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Sve marke</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {MAKES.length} marki · {Object.values(counts).reduce((s, n) => s + n, 0)} aktivnih oglasa
        </p>
      </header>

      <div className="space-y-8">
        {Object.entries(grouped).map(([letter, list]) => (
          <section key={letter}>
            <h2 className="font-display text-2xl text-[var(--color-accent-dark)] mb-3">{letter}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {list.map((m) => {
                const count = counts[slugify(m.name)] ?? 0;
                return (
                  <Link
                    key={m.slug}
                    href={`/oglasi?make=${m.slug}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-ink)] transition-colors"
                  >
                    <span className="font-medium text-sm">{m.name}</span>
                    {count > 0 && (
                      <span className="text-xs text-[var(--color-muted)]">{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}

async function tallyByMake(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let page = 1; page <= 12; page++) {
    const { items, total } = await db().listListings({ page });
    items.forEach((l) => {
      const k = slugify(l.make);
      counts[k] = (counts[k] ?? 0) + 1;
    });
    if (page * 12 >= total) break;
  }
  return counts;
}
