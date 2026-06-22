"use client";

/**
 * Sidebar filter (/oglasi) — uski jednostupčani layout, uniformni dropdownovi.
 * Osnovni filteri + "Više filtera" (otvara full-screen napredna panel).
 * Live: svaka promjena odmah ažurira URL (scroll:false).
 */

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, COLORS, CONDITIONS, SELLER_TYPES,
} from "@/lib/types";
import { MAKES, getMake } from "@/data/makes";
import { getCategory } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import { getFilterDefs, type CategoryFilters } from "@/data/category-filters";
import {
  MultiSelect, SelectField, ColorPicker, RangeSelect, BodyTypePicker, type Opt,
} from "@/components/napredno/controls";
import { FilterPanel } from "@/components/napredno/filter-panel";
import { SlidersHorizontal, X } from "lucide-react";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1990 + 1 }, (_, i) => YEAR_NOW - i);

const toOpts = (arr: readonly string[]): Opt[] => arr.map((v) => ({ value: v, label: v }));

type Props = { mobile?: boolean; onClose?: () => void };

export function FilterSidebar({ mobile, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [panelOpen, setPanelOpen] = useState(false);

  const current = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const update = useCallback(
    (patch: Record<string, string | string[] | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) next.delete(k);
        else if (Array.isArray(v)) next.set(k, v.join(","));
        else next.set(k, v);
      });
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router]
  );

  const arr = (key: string) => (current[key]?.split(",").filter(Boolean) ?? []);
  const setMulti = (key: string, vals: string[]) => update({ [key]: vals });

  const category = current.category ?? "auto";
  const categoryDef = getCategory(category === "" ? "auto" : category);
  const selectedMake = current.make ?? "";
  const makeOptions: Opt[] = useMemo(() => {
    const list = (!category || category === "auto") ? MAKES.map((m) => ({ slug: m.slug, name: m.name })) : (categoryDef?.makes ?? []);
    return list.map((m) => ({ value: m.slug, label: m.name }));
  }, [category, categoryDef]);
  const make = selectedMake && (!category || category === "auto") ? getMake(selectedMake) : undefined;
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(category || "auto"), [category]);
  const bodyOptions = filterDef.fields.find((f) => f.key === "bodyType")?.options ?? toOpts(BODY_TYPES);
  const fuelOptions = filterDef.fields.find((f) => f.key === "fuel")?.options ?? toOpts(FUEL_TYPES);
  const subOpts: Opt[] = (categoryDef?.subcategories ?? [])
    .filter((s) => s.slug !== "auto-oglasi")
    .map((s) => ({ value: s.slug, label: s.name }));

  const body = (
    <div className="space-y-4">
      {subOpts.length > 0 && (
        <SelectField label="Podkategorija" value={current.subcategory ?? ""} onChange={(v) => update({ subcategory: v || null })} options={subOpts} placeholder="Sve podkategorije" />
      )}

      <div className="grid grid-cols-2 gap-2">
        <MultiSelect label="Tip ponude" values={arr("offerType")} onChange={(v) => setMulti("offerType", v)} options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
        <MultiSelect label="Stanje" values={arr("condition")} onChange={(v) => setMulti("condition", v)} options={toOpts(CONDITIONS.filter((c) => c !== "Oldtimer"))} placeholder="Sve" />
      </div>

      <SelectField label="Marka" value={selectedMake} onChange={(v) => update({ make: v || null, model: null })} options={makeOptions} placeholder="Sve marke" />
      {make && (
        <SelectField label="Model" value={current.model ?? ""} onChange={(v) => update({ model: v || null })} options={make.models.map((m) => ({ value: m, label: m }))} placeholder="Svi modeli" />
      )}

      <RangeSelect label="Cijena (€)" unit="€" minValue={current.priceMin ?? ""} maxValue={current.priceMax ?? ""} onMin={(v) => update({ priceMin: v || null })} onMax={(v) => update({ priceMax: v || null })} steps={PRICE_STEPS} />
      <RangeSelect label="Godina" minValue={current.yearMin ?? ""} maxValue={current.yearMax ?? ""} onMin={(v) => update({ yearMin: v || null })} onMax={(v) => update({ yearMax: v || null })} steps={YEARS} fmt={(n) => String(n)} />
      <RangeSelect label="Kilometraža" unit="km" minValue={current.kmMin ?? ""} maxValue={current.kmMax ?? ""} onMin={(v) => update({ kmMin: v || null })} onMax={(v) => update({ kmMax: v || null })} steps={KM_STEPS} />

      <MultiSelect label="Gorivo" values={arr("fuel")} onChange={(v) => setMulti("fuel", v)} options={fuelOptions} placeholder="Sve" />
      <MultiSelect label="Mjenjač" values={arr("transmission")} onChange={(v) => setMulti("transmission", v)} options={toOpts(TRANSMISSIONS)} placeholder="Sve" />
      <BodyTypePicker label="Karoserija" values={arr("bodyType")} onChange={(v) => setMulti("bodyType", v)} options={bodyOptions} />

      <ColorPicker label="Boja" values={arr("color")} onChange={(v) => setMulti("color", v)} options={[...COLORS]} />

      <SelectField label="Županija" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
      <MultiSelect label="Prodavač" values={arr("sellerType")} onChange={(v) => setMulti("sellerType", v)} options={toOpts(SELLER_TYPES)} placeholder="Svi" />

      {/* Više filtera → full-screen napredna panel */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="w-full h-11 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
      >
        <SlidersHorizontal className="size-4" /> Više filtera
      </button>
    </div>
  );

  // ── Mobile: bottom sheet ──
  if (mobile) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
          <div className="relative bg-[var(--color-bg)] rounded-t-2xl max-h-[88vh] flex flex-col animate-slide-up shadow-2xl">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)]">
              <h2 className="font-display text-xl">Filtri</h2>
              <button onClick={onClose} className="size-9 rounded-lg hover:bg-[var(--color-line)] grid place-items-center" aria-label="Zatvori">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">{body}</div>
            <div className="shrink-0 px-4 py-3 border-t border-[var(--color-line)]">
              <button onClick={onClose} className="w-full h-12 rounded-xl bg-[var(--color-accent)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors">
                Prikaži rezultate
              </button>
            </div>
          </div>
        </div>
        {panelOpen && <FilterPanel onClose={() => { setPanelOpen(false); onClose?.(); }} />}
      </>
    );
  }

  // ── Desktop: sticky sidebar ──
  return (
    <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-1">
      {body}
      {pending && <span className="block text-xs text-[var(--color-muted)] animate-pulse mt-3">Učitavanje...</span>}
      {panelOpen && <FilterPanel onClose={() => setPanelOpen(false)} />}
    </aside>
  );
}
