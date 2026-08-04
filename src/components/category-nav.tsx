"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Bike, Truck, Caravan, ChevronDown } from "lucide-react";
import { Backhoe, Wheel } from "@/components/icons/tabler";
import { cn } from "@/lib/utils";
import { CATEGORIES, subcategoryHref, subChildHref, hasChildren } from "@/data/categories";
import { ChevronLeft } from "lucide-react";

const ICONS = {
  car: Car,
  bike: Bike,
  truck: Truck,
  excavator: Backhoe,
  camper: Caravan,
  brakedisc: Wheel,
} as const;

/**
 * variant "grid" — 3×2 kvadrati (mobilni, zadano; nepromijenjeno ponašanje)
 * variant "bar"  — vodoravna traka za desktop hero IZNAD tražilice.
 *   Traka nosi glavnu navigaciju pa mora biti vizualno najjača stvar u heru:
 *   veći dodirni cilj, ikona lijevo od teksta (brže se čita od centrirane),
 *   aktivna kategorija dobiva punu accent podlogu umjesto 15% tinte koja se
 *   na tamnoj pozadini jedva razaznavala.
 */
export function CategoryNav({
  variant = "grid",
  compact = false,
}: {
  variant?: "grid" | "bar";
  /**
   * ⚠️ `compact` = traka u SVIJETLOM sticky zaglavlju (Karlo 04.08.2026).
   * Obična `bar` varijanta je stilizirana za TAMNU podlogu heroja (bijeli tekst,
   * `bg-black/25`) — bez ovog prekidača tekst bi u zaglavlju bio bijelo na
   * bijelom. Uz to je niža i sitnija da ne jede ekran pri scrollanju.
   */
  compact?: boolean;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openSubSlug, setOpenSubSlug] = useState<string | null>(null);

  const openCategory = CATEGORIES.find((c) => c.slug === openSlug);
  const openSub = openCategory?.subcategories.find((s) => s.slug === openSubSlug);

  const selectCategory = (slug: string) => {
    setOpenSlug((prev) => (prev === slug ? null : slug));
    setOpenSubSlug(null);
  };

  const isBar = variant === "bar";

  return (
    <nav aria-label="Kategorije vozila">
      <ul
        className={cn(
          isBar
            ? compact
              // Zaglavlje: bez okvira i podloge — traka se stapa s njim.
              ? "flex items-stretch gap-1"
              // Karlo 28.07: tamnija podloga trake (bila white/[0.04]) diže
              // kontrast bijelog teksta iznad WCAG AA praga 4.5:1.
              : "flex items-stretch gap-1.5 rounded-[var(--radius-lg)] border border-white/10 bg-black/25 p-1.5"
            // `auto-rows-fr` — SVI reci jednake visine, ne samo kartice unutar
            // jednog retka. Bez toga je 1. red 78px, a 2. red 85px (dvoredni
            // nazivi), pa mreža izgleda neuredno.
            : "grid grid-cols-3 md:grid-cols-6 gap-2 auto-rows-fr"
        )}
      >
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon];
          const isOpen = openSlug === cat.slug;
          /**
           * Karlo 02.08.: "mehanizacija još uvijek nije poravnata sa slobodno
           * vrijeme". Izmjereno na 390 px: MEHANIZACIJA 78 px, a SLOBODNO
           * VRIJEME i DIJELOVI I OPREMA 85 px — `min-h-[78px]` je MINIMALNA
           * visina, pa naziv u dva reda naraste karticu dok susjedi ostanu niži.
           * `<li>` se sad rasteže na visinu retka (`h-full`), a gumb ga
           * popunjava → svi u retku imaju isti donji rub.
           */
          return (
            <li key={cat.slug} className={cn("h-full", isBar && "flex-1 min-w-0")}>
              <button
                type="button"
                onClick={() => selectCategory(cat.slug)}
                aria-expanded={isOpen}
                className={cn(
                  "group relative transition-all",
                  isBar
                    ? cn(
                        "flex items-center justify-center gap-2 w-full rounded-[var(--radius-md)] cursor-pointer",
                        // Kompaktna traka je niža i sitnija — ne smije jesti ekran.
                        compact
                          ? "min-h-9 px-2 py-1.5"
                          : "min-h-12 px-2.5 xl:px-3 py-2",
                        isOpen
                          ? "bg-[var(--color-accent)] text-[var(--color-ink)] shadow-sm"
                          : compact
                            // Zaglavlje je SVIJETLO → tamni tekst (bijeli bi nestao).
                            ? "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/50 hover:text-[var(--color-ink)]"
                            // Karlo 28.07: bilo text-white/90 → izmjereno 3.72:1
                            // iz piksela, ispod WCAG AA (4.5:1). Puna bijela = 13.2:1.
                            : "text-white hover:bg-white/10"
                      )
                    : cn(
                        // `h-full` uz `min-h` — kartica popunjava visinu retka
                        // koju diktira najviši naziv (npr. "SLOBODNO VRIJEME").
                        // ⚠️ Dino 04.08.: MEHANIZACIJA je "visjela" niže od
                        // susjeda. `justify-center` centrira blok (ikona+naziv)
                        // po visini kartice — naziv u JEDNOM retku daje niži
                        // blok, pa se ikona spusti; naziv u DVA retka je gura
                        // gore. Zato `justify-start`: ikona kreće s istog mjesta
                        // u svim karticama, a naziv ispod nje dobiva fiksni
                        // prostor za dva retka (vidi `min-h-[2.2em]` na spanu).
                        "flex flex-col items-center justify-start gap-1.5 w-full h-full min-h-[78px] px-2 py-3 rounded-[var(--radius-md)] border",
                        isOpen
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                          : "border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:border-white/30"
                      )
                )}
              >
                <Icon className={cn("shrink-0", isBar ? (compact ? "size-4" : "size-[18px]") : "size-5")} />
                <span
                  className={cn(
                    "leading-tight uppercase tracking-wide font-semibold text-balance",
                    isBar
                      // Karlo 28.07: NE truncate — na 1024px je rezao
                      // "GOSPODARS…"/"MEHANIZACI…". Tekst se smije prelomiti,
                      // a font se malo smanji dok ne bude mjesta za pun naziv.
                      ? compact
                        ? "text-[10px] xl:text-[11px] text-center"
                        : "text-[11px] xl:text-xs text-center"
                      // `min-h-[2.2em]` = prostor za DVA retka i kad naziv ima
                      // samo jedan → naziv i ikona stoje na istoj visini u
                      // svih 6 kartica (MEHANIZACIJA vs SLOBODNO VRIJEME).
                      : "text-[11px] font-medium text-center min-h-[2.2em] flex items-center justify-center"
                  )}
                >
                  {cat.name}
                </span>
                <ChevronDown
                  className={cn(
                    "transition-transform",
                    isBar
                      ? cn(
                          // ispod xl nema mjesta — naziv kategorije je važniji
                          "size-3.5 shrink-0 hidden xl:block",
                          isOpen
                            ? "rotate-180 text-[var(--color-ink)]/60"
                            // Svijetlo zaglavlje → tamna strelica; tamni hero → bijela.
                            : compact ? "text-[var(--color-muted)]" : "text-white/40"
                        )
                      : cn(
                          "absolute top-1.5 right-1.5 size-3 text-white/40",
                          isOpen && "rotate-180 text-[var(--color-accent)]"
                        )
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Subcategory submenu — opens for the selected category.
          Napredna pretraga je SAMO za auto → samo auto ima napredna-link header,
          ostale kategorije vode podkategorije na obične rezultate (/oglasi). */}
      {openCategory && (
        <div
          className={cn(
            "mt-2 rounded-[var(--radius-md)] p-3 animate-fade-in",
            compact
              // ⚠️ Sadržaj panela je pisan BIJELIM tonovima (za tamni hero).
              // U svijetlom zaglavlju zato panelu dajemo TAMNU podlogu — tako
              // sav postojeći tekst ostaje čitljiv, bez diranja 40-ak klasa
              // unutar njega. Sjena + `z-50` jer pluta preko sadržaja stranice.
              ? "border border-[var(--color-line)] bg-[var(--color-ink)] shadow-[0_20px_48px_rgb(2_8_20/35%)] relative z-50"
              : "border border-white/15 bg-white/[0.06]",
          )}
        >
          {openSub && hasChildren(openSub) ? (
            // 2. nivo — children odabrane podkategorije (dijelovi)
            <>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setOpenSubSlug(null)}
                  className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-white/60 hover:text-white transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                  {openCategory.name}
                </button>
                <span className="text-white/30">/</span>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-accent)]">
                  {openSub.name}
                </span>
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <li>
                  <Link
                    href={subcategoryHref(openCategory.slug, openSub.slug)}
                    className="block rounded-[var(--radius-sm)] px-2.5 py-2 text-xs font-medium text-[var(--color-accent)] bg-white/[0.04] hover:bg-white/10 transition-colors"
                  >
                    Sve: {openSub.name}
                  </Link>
                </li>
                {openSub.children!.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={subChildHref(openCategory.slug, openSub.slug, child.slug)}
                      className="block rounded-[var(--radius-sm)] px-2.5 py-2 text-xs text-white/85 bg-white/[0.04] hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            // 1. nivo — podkategorije
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-accent)]">
                  {openCategory.name}
                </span>
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {openCategory.subcategories.map((sub) =>
                  hasChildren(sub) ? (
                    <li key={sub.slug}>
                      <button
                        type="button"
                        onClick={() => setOpenSubSlug(sub.slug)}
                        className="w-full flex items-center justify-between gap-1 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs text-white/85 bg-white/[0.04] hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span className="text-left">{sub.name}</span>
                        <ChevronDown className="size-3.5 -rotate-90 text-white/40 shrink-0" />
                      </button>
                    </li>
                  ) : (
                    <li key={sub.slug}>
                      <Link
                        href={subcategoryHref(openCategory.slug, sub.slug)}
                        className="block rounded-[var(--radius-sm)] px-2.5 py-2 text-xs text-white/85 bg-white/[0.04] hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
