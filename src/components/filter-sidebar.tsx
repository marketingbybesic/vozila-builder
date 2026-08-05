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
import { MAKES } from "@/data/makes";
import { getCategory, makesDbFor } from "@/data/categories";
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

type Props = {
  mobile?: boolean;
  onClose?: () => void;
  /**
   * `compact` = uži set filtera za BOČNI STUPAC na desktopu (Karlo 05.08.2026).
   * Prikazuje samo osnovna polja koja stanu u visinu ekrana bez scrollanja;
   * ostatak se otvara gumbom "Svi filteri". Pop-up (mobilni) i napredni panel
   * uvijek prikazuju SVE.
   */
  compact?: boolean;
};

export function FilterSidebar({ mobile, onClose, compact }: Props) {
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
  // Karlo 29.07: modeli iz baze TE kategorije (prije samo auto → moto i
  // gospodarska marke nisu imale nijedan model ni ovdje u sidebaru).
  const modelOptions: Opt[] = useMemo(() => {
    if (!selectedMake) return [];
    return (makesDbFor(category || "auto").find((m) => m.slug === selectedMake)?.models ?? [])
      .map((m) => ({ value: m, label: m }));
  }, [category, selectedMake]);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(category || "auto"), [category]);
  const bodyOptions = filterDef.fields.find((f) => f.key === "bodyType")?.options ?? toOpts(BODY_TYPES);
  const fuelOptions = filterDef.fields.find((f) => f.key === "fuel")?.options ?? toOpts(FUEL_TYPES);
  // U motou se polje zove "Pogon", ne "Gorivo" — uzmi naziv iz sheme.
  const fuelLabel = filterDef.fields.find((f) => f.key === "fuel")?.label ?? "Gorivo";
  const subOpts: Opt[] = (categoryDef?.subcategories ?? [])
    .map((s) => ({ value: s.slug, label: s.name }));

  /**
   * Karlo 29.07: sidebar je bio HARDKODIRAN za auto pa moto nije imao "Stil",
   * a kamioni "Tip vozila" — iako oboje postoji u shemi i radi u naprednoj.
   * Sad čita ista `group: "Vrsta"` attr polja i poštuje `scope`, pa stoje
   * ODMAH ispod Podkategorije (isti redoslijed kao napredna pretraga).
   */
  const subcategory = current.subcategory ?? "";
  const vrstaFields = useMemo(
    () =>
      filterDef.fields.filter((f) => {
        if (f.group !== "Vrsta" || f.storage !== "attr") return false;
        if (f.searchable === false) return false;
        if (f.scope && f.scope.length > 0) {
          return subcategory ? f.scope.includes(subcategory) : false;
        }
        return true;
      }),
    [filterDef, subcategory]
  );

  // Isti gating kao napredna/objava: polje postoji samo ako ga kategorija ima
  // I ako scope dopušta trenutnu podkategoriju.
  const hasField = (key: string) =>
    filterDef.fields.some((f) => {
      if (f.key !== key) return false;
      if (f.scope && f.scope.length > 0) {
        return subcategory ? f.scope.includes(subcategory) : false;
      }
      return true;
    });

  const body = (
    <div className="space-y-4">
      {subOpts.length > 0 && (
        <SelectField label="Podkategorija" value={current.subcategory ?? ""} onChange={(v) => update({ subcategory: v || null })} options={subOpts} placeholder="Sve podkategorije" />
      )}

      {/* Stil (moto) / Tip vozila (kamioni) — ODMAH ispod Podkategorije */}
      {vrstaFields.map((f) =>
        f.type === "multi" ? (
          <MultiSelect
            key={f.key}
            label={f.label}
            values={arr(`a.${f.key}`)}
            onChange={(v) => setMulti(`a.${f.key}`, v)}
            options={f.options ?? []}
            placeholder="Sve"
          />
        ) : (
          <SelectField
            key={f.key}
            label={f.label}
            value={current[`a.${f.key}`] ?? ""}
            onChange={(v) => update({ [`a.${f.key}`]: v || null })}
            options={f.options ?? []}
            placeholder="Sve"
          />
        )
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Karlo 30.07: filter je bio MRTAV — pisao se kao goli `offerType`, a polje je
            `storage:"attr"`, pa ga `parseFilters` nikad nije uhvatio (nije ni u
            RESERVED_PARAMS ni `a.`-prefiksiran) → korisnik filtrira, ništa se ne mijenja.
            Attr polja MORAJU ići kroz `a.` prefiks. */}
        <MultiSelect label="Tip ponude" values={arr("a.offerType").length ? arr("a.offerType") : arr("offerType")} onChange={(v) => setMulti("a.offerType", v)} options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
        <MultiSelect label="Stanje" values={arr("condition")} onChange={(v) => setMulti("condition", v)} options={toOpts(CONDITIONS.filter((c) => c !== "Oldtimer"))} placeholder="Sve" />
      </div>

      <SelectField label="Marka" value={selectedMake} onChange={(v) => update({ make: v || null, model: null })} options={makeOptions} placeholder="Sve marke" />
      {modelOptions.length > 0 && (
        <SelectField label="Model" value={current.model ?? ""} onChange={(v) => update({ model: v || null })} options={modelOptions} placeholder="Svi modeli" />
      )}

      <RangeSelect label="Cijena (€)" unit="€" minValue={current.priceMin ?? ""} maxValue={current.priceMax ?? ""} onMin={(v) => update({ priceMin: v || null })} onMax={(v) => update({ priceMax: v || null })} steps={PRICE_STEPS} />
      <RangeSelect label="Godina" minValue={current.yearMin ?? ""} maxValue={current.yearMax ?? ""} onMin={(v) => update({ yearMin: v || null })} onMax={(v) => update({ yearMax: v || null })} steps={YEARS} fmt={(n) => String(n)} />
      {hasField("km") && (
        <RangeSelect label="Kilometraža" unit="km" minValue={current.kmMin ?? ""} maxValue={current.kmMax ?? ""} onMin={(v) => update({ kmMin: v || null })} onMax={(v) => update({ kmMax: v || null })} steps={KM_STEPS} />
      )}

      {hasField("fuel") && (
        <MultiSelect label={fuelLabel} values={arr("fuel")} onChange={(v) => setMulti("fuel", v)} options={fuelOptions} placeholder="Sve" />
      )}

      {/* ⚠️ Karlo 05.08.2026: lokacija pripada u BRZE filtere — kupci najčešće
          traže vozilo u svojoj županiji. U punom prikazu stoji niže (uz
          Prodavača), pa se ovdje renderira samo u `compact` načinu. */}
      {compact && (
        <SelectField label="Županija" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
      )}

      {/**
       * ⚠️ Karlo 05.08.2026: "ne stanu svi filteri, napravi osnovni set koji
       * stane punom visinom, a napredni u pop-upu."
       *
       * U SIDEBARU (`compact`) staju samo polja iznad — Podkategorija, Tip
       * ponude, Stanje, Marka/Model, Cijena, Godina, Kilometraža, Gorivo.
       * Sve ispod (Mjenjač, Karoserija s ikonama, Boja s uzorcima, Županija,
       * Prodavač) je visoko i gura panel izvan ekrana → ide u "Više filtera".
       *
       * U pop-upu (mobilni i "Više filtera") prikazuje se SVE, kao dosad.
       */}
      {!compact && (
        <>
          {hasField("transmission") && (
            <MultiSelect label="Mjenjač" values={arr("transmission")} onChange={(v) => setMulti("transmission", v)} options={toOpts(TRANSMISSIONS)} placeholder="Sve" />
          )}
          {/* Karlo 29.07: Karoserija se prikazuje samo ako je kategorija/podkategorija
              stvarno ima — motocikl je nema, a prije je visjela svugdje. */}
          {hasField("bodyType") && (
            <BodyTypePicker label="Karoserija" values={arr("bodyType")} onChange={(v) => setMulti("bodyType", v)} options={bodyOptions} />
          )}

          {hasField("color") && (
            <ColorPicker label="Boja" values={arr("color")} onChange={(v) => setMulti("color", v)} options={[...COLORS]} />
          )}

          <SelectField label="Županija" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
          <MultiSelect label="Prodavač" values={arr("sellerType")} onChange={(v) => setMulti("sellerType", v)} options={toOpts(SELLER_TYPES)} placeholder="Svi" />
        </>
      )}

      {/* Više filtera → full-screen napredna panel */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="w-full h-11 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
      >
        <SlidersHorizontal className="size-4" /> {compact ? "Svi filteri" : "Više filtera"}
      </button>
    </div>
  );

  // ── Mobile: bottom sheet ──
  if (mobile) {
    return (
      <>
        {/* Ladica odozdo — SAMO mobitel (Karlo: "mobile je savršen").
            Na desktopu filteri žive u bočnom stupcu, ne u preklopu. */}
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
    /* Dino 31.07: filter je bio niz od 12 identičnih polja koja lebde na pozadini —
       najveći ostatak "generičkog" dojma. Sada je jedna ploha (bijela kartica s
       elevationom) pa se čita kao ALAT, a ne kao obrazac. Polja i redoslijed
       ostaju identični. Padding 21 px (Fibonacci).

       ⚠️ Karlo 05.08.2026: ovdje je bio VLASTITI `sticky top-20` + `max-h` +
       scroll — isto što već radi roditelj (`OglasiSidebar` / `<aside>` u
       `app/oglasi/page.tsx`). Dva sticky elementa jedan u drugome gurala su
       bijelu plohu 62 px NIŽE od prve kartice oglasa. Sad je ovo obična ploha;
       pozicioniranje je isključivo na roditelju. */
    <aside>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] ring-1 ring-[var(--color-line-soft)] p-[21px]">
      {body}
      {pending && <span className="block text-xs text-[var(--color-muted)] animate-pulse mt-3">Učitavanje...</span>}
      </div>
      {panelOpen && <FilterPanel onClose={() => setPanelOpen(false)} />}
    </aside>
  );
}
