"use client";

/**
 * Sidebar filter (/oglasi) — isti stil kao napredna pretraga:
 * uniformni dropdownovi (controls.tsx), osnovni filteri + "Više filtera".
 * Live: svaka promjena odmah ažurira URL (scroll:false).
 */

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, DRIVES, COLORS, CONDITIONS, SELLER_TYPES,
} from "@/lib/types";
import { MAKES, getMake } from "@/data/makes";
import { getCategory } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import { getFilterDefs, groupFields, type FilterField } from "@/data/category-filters";
import {
  MultiSelect, SelectField, ColorPicker, RangeInput, TogglePill, Label, type Opt,
} from "@/components/napredno/controls";
import { Settings2, SlidersHorizontal, X } from "lucide-react";

const STATIC_KEYS = new Set([
  "priceEur", "year", "km", "fuel", "transmission", "bodyType", "drive",
  "color", "condition", "sellerType", "county", "make", "model",
]);
const ADVANCED_GROUPS = new Set([
  "Specifikacije", "Električna", "Oprema", "Pravno", "Povijest", "Udobnost",
  "Dimenzije", "Detalji", "Gume", "Felge", "Tekućine", "Ostalo",
]);

const toOpts = (arr: readonly string[]): Opt[] => arr.map((v) => ({ value: v, label: v }));

type Props = { mobile?: boolean; onClose?: () => void };

export function FilterSidebar({ mobile, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(false);

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
  const filterDef = useMemo(() => getFilterDefs(category || "auto"), [category]);
  const attrFields = useMemo(
    () => filterDef.fields.filter((f) => f.storage === "attr" && !STATIC_KEYS.has(f.key)),
    [filterDef]
  );
  const attrGroups = useMemo(() => groupFields(attrFields), [attrFields]);
  const basicAttr = attrGroups.filter((g) => !ADVANCED_GROUPS.has(g.name));
  const advancedAttr = attrGroups.filter((g) => ADVANCED_GROUPS.has(g.name));
  const subOpts: Opt[] = (categoryDef?.subcategories ?? [])
    .filter((s) => s.slug !== "auto-oglasi")
    .map((s) => ({ value: s.slug, label: s.name }));

  // ── dinamički attr kontroleri ──
  const attrArr = (key: string) => (current[`a.${key}`]?.split(",").filter(Boolean) ?? []);
  const attrSetMulti = (key: string, vals: string[]) => update({ [`a.${key}`]: vals });
  const attrVal = (key: string) => current[`a.${key}`] ?? "";

  const advancedActive = useMemo(
    () => advancedAttr.some((g) => g.fields.some((f) => current[`a.${f.key}`])),
    [advancedAttr, current]
  );

  const renderAttr = (f: FilterField) => {
    if (f.type === "toggle")
      return <TogglePill key={f.key} on={attrVal(f.key) === "1"} onClick={() => update({ [`a.${f.key}`]: attrVal(f.key) === "1" ? null : "1" })} label={f.label} />;
    if (f.type === "range")
      return <RangeInput key={f.key} label={f.label} unit={f.unit} value={attrVal(f.key) || undefined} onSet={(v) => update({ [`a.${f.key}`]: v ?? null })} />;
    if (f.type === "select")
      return <SelectField key={f.key} label={f.label} value={attrVal(f.key)} onChange={(v) => update({ [`a.${f.key}`]: v || null })} options={f.options ?? []} />;
    if (f.type === "text")
      return <SelectField key={f.key} label={f.label} value={attrVal(f.key)} onChange={(v) => update({ [`a.${f.key}`]: v || null })} options={f.options ?? []} />;
    return <MultiSelect key={f.key} label={f.label} values={attrArr(f.key)} onChange={(v) => attrSetMulti(f.key, v)} options={f.options ?? []} placeholder="Sve" />;
  };

  return (
    <aside className={mobile ? "h-full overflow-y-auto scrollbar-thin" : "sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-1"}>
      {mobile && (
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[var(--color-bg)] z-10 pb-3 border-b border-[var(--color-line)]">
          <h2 className="font-display text-xl">Filtri</h2>
          <button onClick={onClose} className="size-9 rounded-lg hover:bg-[var(--color-line)] grid place-items-center" aria-label="Zatvori">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Podkategorija */}
        {subOpts.length > 0 && (
          <SelectField label="Podkategorija" value={current.subcategory ?? ""} onChange={(v) => update({ subcategory: v || null })} options={subOpts} placeholder="Sve podkategorije" />
        )}

        {/* Ponuda + stanje */}
        <div className="grid grid-cols-2 gap-2">
          <MultiSelect label="Tip ponude" values={arr("offerType")} onChange={(v) => setMulti("offerType", v)} options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
          <MultiSelect label="Stanje" values={arr("condition")} onChange={(v) => setMulti("condition", v)} options={toOpts(CONDITIONS.filter((c) => c !== "Oldtimer"))} placeholder="Sve" />
        </div>

        {/* Marka + model */}
        <SelectField label="Marka" value={selectedMake} onChange={(v) => update({ make: v || null, model: null })} options={makeOptions} placeholder="Sve marke" />
        {make && (
          <SelectField label="Model" value={current.model ?? ""} onChange={(v) => update({ model: v || null })} options={make.models.map((m) => ({ value: m, label: m }))} placeholder="Svi modeli" />
        )}

        {/* Cijena / godina / km */}
        <RangeInput label="Cijena (€)" value={rangeStr(current.priceMin, current.priceMax)} onSet={(v) => update(splitRange(v, "priceMin", "priceMax"))} />
        <div className="grid grid-cols-2 gap-2">
          <RangeInput label="Godina" value={rangeStr(current.yearMin, current.yearMax)} onSet={(v) => update(splitRange(v, "yearMin", "yearMax"))} />
          <RangeInput label="Kilometraža" value={rangeStr(current.kmMin, current.kmMax)} onSet={(v) => update(splitRange(v, "kmMin", "kmMax"))} />
        </div>

        {/* Motor */}
        <div className="grid grid-cols-2 gap-2">
          <MultiSelect label="Gorivo" values={arr("fuel")} onChange={(v) => setMulti("fuel", v)} options={toOpts(FUEL_TYPES)} placeholder="Sve" />
          <MultiSelect label="Mjenjač" values={arr("transmission")} onChange={(v) => setMulti("transmission", v)} options={toOpts(TRANSMISSIONS)} placeholder="Sve" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MultiSelect label="Karoserija" values={arr("bodyType")} onChange={(v) => setMulti("bodyType", v)} options={toOpts(BODY_TYPES)} placeholder="Sve" />
          <MultiSelect label="Pogon" values={arr("drive")} onChange={(v) => setMulti("drive", v)} options={toOpts(DRIVES)} placeholder="Sve" />
        </div>

        {/* Boje */}
        <ColorPicker label="Boja" values={arr("color")} onChange={(v) => setMulti("color", v)} options={[...COLORS]} />

        {/* Lokacija + prodavač */}
        <SelectField label="Županija" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
        <MultiSelect label="Prodavač" values={arr("sellerType")} onChange={(v) => setMulti("sellerType", v)} options={toOpts(SELLER_TYPES)} placeholder="Svi" />

        {/* Osnovne dinamičke grupe (npr. PDV, Stil) */}
        {basicAttr.map((g) => (
          <div key={g.name} className="space-y-3">
            <Label>{g.name}</Label>
            {g.fields.map(renderAttr)}
          </div>
        ))}

        {/* Više filtera */}
        {advancedAttr.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              aria-expanded={showMore}
              className="w-full h-11 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
            >
              <SlidersHorizontal className="size-4" />
              {showMore ? "Sakrij dodatne filtere" : "Više filtera"}
              {!showMore && advancedActive && (
                <span className="size-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </button>
            {showMore && (
              <div className="mt-3 space-y-4 pt-2">
                {advancedAttr.map((g) => (
                  <div key={g.name} className="space-y-3">
                    <Label>{g.name}</Label>
                    {g.fields.map(renderAttr)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mobile && (
          <div className="sticky bottom-0 bg-[var(--color-bg)] pt-4 -mx-4 px-4 border-t border-[var(--color-line)] mt-4">
            <button onClick={onClose} className="w-full h-12 rounded-xl bg-[var(--color-accent)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors flex items-center justify-center gap-2">
              <Settings2 className="size-4" /> Prikaži rezultate
            </button>
          </div>
        )}

        {pending && <span className="block text-xs text-[var(--color-muted)] animate-pulse">Učitavanje...</span>}
      </div>
    </aside>
  );
}

// "min..max" iz dva URL parametra, i obratno.
function rangeStr(min?: string, max?: string): string | undefined {
  if (!min && !max) return undefined;
  return `${min ?? ""}..${max ?? ""}`;
}
function splitRange(v: string | undefined, minKey: string, maxKey: string): Record<string, string | null> {
  if (!v || !v.includes("..")) return { [minKey]: null, [maxKey]: null };
  const [min, max] = v.split("..");
  return { [minKey]: min || null, [maxKey]: max || null };
}
