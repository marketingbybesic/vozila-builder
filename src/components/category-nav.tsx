"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Bike, Truck, Caravan, ChevronDown } from "lucide-react";
import { Backhoe, Wheel } from "@/components/icons/tabler";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/data/categories";

const ICONS = {
  car: Car,
  bike: Bike,
  truck: Truck,
  excavator: Backhoe,
  camper: Caravan,
  brakedisc: Wheel,
} as const;

export function CategoryNav() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const openCategory = CATEGORIES.find((c) => c.slug === openSlug);

  return (
    <nav aria-label="Kategorije vozila">
      <ul className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon];
          const isOpen = openSlug === cat.slug;
          return (
            <li key={cat.slug}>
              <button
                type="button"
                onClick={() => setOpenSlug(isOpen ? null : cat.slug)}
                aria-expanded={isOpen}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 w-full min-h-[78px] px-2 py-3 rounded-[var(--radius-md)] border transition-all",
                  isOpen
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white"
                    : "border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:border-white/30"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[11px] leading-tight uppercase tracking-wide font-medium text-center text-balance">
                  {cat.name}
                </span>
                <ChevronDown
                  className={cn(
                    "absolute top-1.5 right-1.5 size-3 text-white/40 transition-transform",
                    isOpen && "rotate-180 text-[var(--color-accent)]"
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
        <div className="mt-2 rounded-[var(--radius-md)] border border-white/15 bg-white/[0.06] p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            {openCategory.slug === "auto" ? (
              <Link
                href={`/oglasi/napredno?category=auto`}
                className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-accent)] hover:text-white transition-colors"
              >
                {openCategory.subLabel ?? openCategory.name} - Napredna pretraga
              </Link>
            ) : (
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-accent)]">
                {openCategory.name}
              </span>
            )}
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {openCategory.subcategories.map((sub) => (
              <li key={sub.slug}>
                <Link
                  href={
                    openCategory.slug === "auto"
                      ? `/oglasi/napredno?category=auto&subcategory=${sub.slug}`
                      : `/oglasi?category=${openCategory.slug}&subcategory=${sub.slug}`
                  }
                  className="block rounded-[var(--radius-sm)] px-2.5 py-2 text-xs text-white/85 bg-white/[0.04] hover:bg-white/10 hover:text-white transition-colors"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
