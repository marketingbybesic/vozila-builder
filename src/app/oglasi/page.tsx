import { Container } from "@/components/ui/container";
import { ListingCard } from "@/components/listing-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SortDropdown } from "@/components/sort-dropdown";
import { Pagination } from "@/components/pagination";
import { MobileFilterToggle } from "@/components/mobile-filter-toggle";
import { SaveSearchButton } from "@/components/save-search-button";
import { db } from "@/db";
import { PAGE_SIZE, parseFilters, activeFilterCount } from "@/lib/filter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Svi oglasi",
  description:
    "Pregledaj tisuće oglasa rabljenih i novih automobila u Hrvatskoj. Filtriraj po marki, modelu, cijeni, godini i kilometraži.",
};

export default async function OglasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  let items: Awaited<ReturnType<ReturnType<typeof db>["listListings"]>>["items"] = [];
  let total = 0;
  try {
    const res = await db().listListings(filters);
    items = res.items;
    total = res.total;
  } catch (err) {
    console.warn("[oglasi] listListings failed:", err);
  }
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterCount = activeFilterCount(filters);

  return (
    <Container className="py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          {filters.make
            ? `Oglasi · ${filters.make.charAt(0).toUpperCase() + filters.make.slice(1)}`
            : "Svi oglasi"}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {total === 0
            ? "Nema oglasa koji odgovaraju filterima"
            : `Pronađeno ${total} ${total === 1 ? "oglas" : total < 5 ? "oglasa" : "oglasa"}`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <MobileFilterToggle count={filterCount} />
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {filterCount > 0 && <SaveSearchButton filters={filters} />}
              <span className="hidden sm:inline text-sm text-[var(--color-muted)]">
                Sortiraj:
              </span>
              <SortDropdown />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)]">
              <h2 className="font-display text-xl mb-2">Nema rezultata</h2>
              <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto">
                Pokušaj proširiti raspon cijene ili godine, ili poništi pojedine filtre.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/oglasi"
            searchParams={sp}
          />
        </div>
      </div>
    </Container>
  );
}
