import { Container } from "@/components/ui/container";
import { ListingCard } from "@/components/listing-card";
import { OglasiSidebar } from "@/components/oglasi-sidebar";
import { SortDropdown } from "@/components/sort-dropdown";
import { Pagination } from "@/components/pagination";
import { MobileFilterToggle } from "@/components/mobile-filter-toggle";
import { SaveSearchButton } from "@/components/save-search-button";
import { UrlActiveChips } from "@/components/napredno/active-filters";
import { ViewToggle } from "@/components/view-toggle";
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
  const view = sp.view === "list" ? "list" : "grid";
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
    <Container className="py-[34px] md:py-[55px]">
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

      {/* ⚠️ Karlo 05.08.2026: na DESKTOPU filteri ostaju u bočnom stupcu, u punoj
          visini ekrana i bez scrollanja stranice (panel ima vlastiti scroll).
          Na mobitelu je pop-up (ljevak gore lijevo). */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block">
          <OglasiSidebar />
        </aside>

        <div>
          {/* ⚠️ Karlo 05.08.2026: `flex-wrap` je na uskom ekranu lomio redak —
              "Filtri" je ostajao sam gore, a prekidač prikaza i sortiranje
              padali su u drugi red. Sad je jedan redak: ljevak lijevo,
              ostalo desno; sortiranje se skuplja (`min-w-0`) umjesto da lomi. */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            <MobileFilterToggle count={filterCount} />
            <div className="ml-auto flex items-center gap-2 min-w-0">
              {filterCount > 0 && <SaveSearchButton filters={filters} />}
              <ViewToggle />
              <span className="hidden sm:inline text-sm text-[var(--color-muted)] shrink-0">
                Sortiraj:
              </span>
              <SortDropdown />
            </div>
          </div>

          {/* Chips pregled aktivnih filtera */}
          <UrlActiveChips className="mb-6" />

          {items.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)]">
              <h2 className="font-display text-xl mb-2">Nema rezultata</h2>
              <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto">
                Pokušaj proširiti raspon cijene ili godine, ili poništi pojedine filtre.
              </p>
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col gap-3">
              {items.map((l) => (
                <ListingCard key={l.id} listing={l} variant="list" />
              ))}
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
