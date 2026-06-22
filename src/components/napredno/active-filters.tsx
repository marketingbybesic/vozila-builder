"use client";

/**
 * Pregled trenutno aktivnih filtera kao uklonjivi chips.
 * Dvije varijante:
 *  - <ActiveChips chips={...} onClear> — presentational (napredna, state-based)
 *  - <UrlActiveChips> — čita iz URL searchParams, klik uklanja (sidebar/oglasi)
 */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export type Chip = { id: string; label: string; onRemove: () => void };

export function ActiveChips({
  chips, onClear, className = "",
}: { chips: Chip[]; onClear?: () => void; className?: string }) {
  if (chips.length === 0) return null;
  return (
    <div className={"flex flex-wrap items-center gap-1.5 " + className}>
      <span className="text-[13px] font-semibold text-[var(--color-ink-soft)] mr-0.5">
        Aktivno:
      </span>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={c.onRemove}
          className="group inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-[var(--color-ink)] text-white text-xs hover:bg-[var(--color-ink-soft)] transition-colors"
        >
          {c.label}
          <span className="grid place-items-center size-4 rounded-full group-hover:bg-white/20 transition-colors">
            <X className="size-3" strokeWidth={2.5} />
          </span>
        </button>
      ))}
      {onClear && chips.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 text-xs font-medium text-[var(--color-accent-dark)] hover:underline"
        >
          Poništi sve
        </button>
      )}
    </div>
  );
}

// Ljudski-čitljive oznake za URL ključeve.
const KEY_LABEL: Record<string, string> = {
  q: "Pojam", make: "Marka", model: "Model", subcategory: "Podkategorija",
  priceMin: "Cijena od", priceMax: "Cijena do", yearMin: "Godina od", yearMax: "Godina do",
  kmMin: "km od", kmMax: "km do", powerMin: "Snaga od", powerMax: "Snaga do",
  engineMin: "Obujam od", engineMax: "Obujam do", county: "Županija",
  fuel: "Gorivo", transmission: "Mjenjač", bodyType: "Karoserija", drive: "Pogon",
  color: "Boja", condition: "Stanje", sellerType: "Prodavač", offerType: "Ponuda",
};
const IGNORED = new Set(["sort", "page", "category", "view", "hidePriceless"]);

/** Čita aktivne filtere iz URL-a; klik na chip ga uklanja (live, scroll:false). */
export function UrlActiveChips({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const remove = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params.toString());
      if (value !== undefined) {
        const rest = (next.get(key) ?? "").split(",").filter((v) => v && v !== value);
        if (rest.length) next.set(key, rest.join(","));
        else next.delete(key);
      } else {
        next.delete(key);
      }
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const clearAll = useCallback(() => router.push(pathname, { scroll: false }), [pathname, router]);

  const chips: Chip[] = useMemo(() => {
    const out: Chip[] = [];
    for (const [key, raw] of params.entries()) {
      if (IGNORED.has(key) || !raw) continue;
      const base = key.startsWith("a.") ? key.slice(2) : key;
      const niceKey = KEY_LABEL[base] ?? base;
      // multi (comma) → jedan chip po vrijednosti
      if (raw.includes(",") || ["fuel", "transmission", "bodyType", "drive", "color", "condition", "sellerType", "offerType"].includes(base) || key.startsWith("a.")) {
        const vals = raw.split(",").filter(Boolean);
        if (vals.length > 1) {
          vals.forEach((v) =>
            out.push({ id: `${key}:${v}`, label: v, onRemove: () => remove(key, v) })
          );
          continue;
        }
      }
      const label = KEY_LABEL[base] ? `${niceKey}: ${raw}` : raw;
      out.push({ id: key, label, onRemove: () => remove(key) });
    }
    return out;
  }, [params, remove]);

  if (chips.length === 0) return null;
  return <ActiveChips chips={chips} onClear={clearAll} className={className} />;
}
