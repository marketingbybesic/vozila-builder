"use client";

/**
 * Napredna pretraga — jedan koherentan sustav, dinamički po kategoriji.
 *
 * Forma se gradi iz category-filters.ts (FILTER_DEFS) prema ?category=.
 * Osnovni filteri uvijek vidljivi; napredni iza "Više filtera".
 * Multi → dropdown + chips; boja → swatch+naziv; range → dva selecta/inputa.
 * Vizualni indikatori: ikona po sekciji + badge s brojem odabranog.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAKES } from "@/data/makes";
import { LISTINGS } from "@/data/listings";
import { applyFilters } from "@/lib/filter";
import type { ListingFilters } from "@/lib/types";
import { getCategory } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import {
  getFilterDefs, groupFields, type FilterField, type CategoryFilters,
} from "@/data/category-filters";
import {
  Car, Gauge, Palette, ShieldCheck, Sofa, Tag, DoorOpen,
  History, MapPin, Settings2, Zap, Boxes, Ruler, ListFilter, Search, RotateCcw,
  Wrench, CircleDot, Droplets, Scale, FileText,
} from "lucide-react";
import {
  MultiSelect, SelectField, ColorPicker, RangeSelect, RangeInput, TogglePill, TextField, Label,
  BodyTypePicker, type Opt,
} from "@/components/napredno/controls";
import { ActiveChips, type Chip } from "@/components/napredno/active-filters";
import type { LucideIcon } from "lucide-react";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
const POWER_STEPS = [44, 55, 66, 74, 85, 96, 110, 132, 150, 184, 220, 260, 300];
const ENGINE_STEPS = [1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1900 + 1 }, (_, i) => YEAR_NOW - i);

type AttrValue = string | string[] | boolean | undefined;

// Grupe koje su "osnovne" (uvijek vidljive). Ostalo ide iza "Više filtera".
const BASIC_GROUPS = new Set(["Vrsta", "Motor", "Karoserija", "Vrata i sjedala", "Cijena", "Boja"]);

// Jedinstvena ikona po nazivu grupe (vizualni indikator koji vodi oko, bez ponavljanja).
const GROUP_ICON: Record<string, LucideIcon> = {
  Vrsta: Car, Motor: Gauge, Karoserija: ListFilter, "Vrata i sjedala": DoorOpen, Cijena: Tag, Boja: Palette,
  Specifikacije: Ruler, Električna: Zap, Oprema: Settings2, Pravno: ShieldCheck,
  Povijest: History, Udobnost: Sofa, Dimenzije: Scale, Detalji: FileText,
  Gume: CircleDot, Felge: Wrench, Tekućine: Droplets, Ostalo: Boxes,
};

export function NaprednoForm({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const initCategory = sp.get("category") ?? "auto";
  const [category] = useState<string>(initCategory);
  const categoryDef = getCategory(category);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(category), [category]);

  // Inicijalizacija iz URL-a (panel se otvori s trenutnim filterima).
  const g = (k: string) => sp.get(k) ?? "";
  const gArr = (k: string) => (sp.get(k)?.split(",").filter(Boolean) ?? []);

  // ── Hardkodirani (tipizirani) filteri zajednički svim vozilima ──
  const [subcategory, setSubcategory] = useState(g("subcategory"));
  const [make, setMake] = useState(g("make"));
  const [model, setModel] = useState(g("model"));
  const [q, setQ] = useState(g("q"));
  const [priceMin, setPriceMin] = useState(g("priceMin"));
  const [priceMax, setPriceMax] = useState(g("priceMax"));
  const [yearMin, setYearMin] = useState(g("yearMin"));
  const [yearMax, setYearMax] = useState(g("yearMax"));
  const [kmMin, setKmMin] = useState(g("kmMin"));
  const [kmMax, setKmMax] = useState(g("kmMax"));
  const [powerMin, setPowerMin] = useState(g("powerMin"));
  const [powerMax, setPowerMax] = useState(g("powerMax"));
  const [engineMin, setEngineMin] = useState(g("engineMin"));
  const [engineMax, setEngineMax] = useState(g("engineMax"));
  const [fuel, setFuel] = useState<string[]>(gArr("fuel"));
  const [transmission, setTransmission] = useState<string[]>(gArr("transmission"));
  const [bodyType, setBodyType] = useState<string[]>(gArr("bodyType"));
  const [color, setColor] = useState<string[]>(gArr("color"));
  const [condition, setCondition] = useState<string[]>(gArr("condition"));
  const [offerType, setOfferType] = useState<string[]>(gArr("offerType"));
  const [sellerType, setSellerType] = useState<string[]>(gArr("sellerType"));
  const [county, setCounty] = useState(g("county"));
  const [showWithoutPrice, setShowWithoutPrice] = useState(sp.get("hidePriceless") !== "1");
  const [warranty, setWarranty] = useState(sp.get("a.warranty") === "1");

  // ── Dinamički atributni filteri (jsonb) iz category-filters.ts ──
  const [attrs, setAttrs] = useState<Record<string, AttrValue>>(() => {
    const o: Record<string, AttrValue> = {};
    for (const [k, v] of sp.entries()) {
      if (!k.startsWith("a.") || k === "a.warranty") continue;
      const key = k.slice(2);
      o[key] = v.includes(",") ? v.split(",").filter(Boolean) : (v === "1" ? true : v);
    }
    return o;
  });
  const [showMore, setShowMore] = useState(false);

  const isAuto = category === "auto";

  const makeOptions: Opt[] = useMemo(() => {
    const list = categoryDef?.makes ?? MAKES.map((m) => ({ slug: m.slug, name: m.name }));
    return list.map((m) => ({ value: m.slug, label: m.name }));
  }, [categoryDef]);
  const modelOptions = useMemo(() => {
    if (!make) return [];
    return (MAKES.find((m) => m.slug === make)?.models ?? []).map((m) => ({ value: m, label: m }));
  }, [make]);

  const setAttr = (key: string, v: AttrValue) => setAttrs((a) => ({ ...a, [key]: v }));

  // Polja koja su "column" storage i NISU već pokrivena hardkodiranim kontrolama
  // renderiraju se generički; attr polja uvijek generički.
  const HANDLED_COLUMNS = new Set([
    "priceEur", "year", "km", "county", "sellerType", "condition",
    "fuel", "transmission", "powerKw", "engineCc", "bodyType", "drive", "color",
  ]);

  // Grupiraj dinamička polja, izuzmi ona koja već imamo kao hardkodirana.
  const dynamicFields = useMemo(
    () => filterDef.fields.filter((f) => f.storage === "attr" || !HANDLED_COLUMNS.has(f.key)),
    [filterDef]
  );
  const dynamicGroups = useMemo(() => groupFields(dynamicFields), [dynamicFields]);
  const basicDynamic = dynamicGroups.filter((g) => BASIC_GROUPS.has(g.name));
  const advancedDynamic = dynamicGroups.filter((g) => !BASIC_GROUPS.has(g.name));

  // Broj aktivnih atributa (za badge na "Više filtera").
  const attrActiveCount = useMemo(() => {
    let n = 0;
    for (const v of Object.values(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      n += Array.isArray(v) ? v.length : 1;
    }
    return n;
  }, [attrs]);

  // ── Živi brojač rezultata ──
  const liveCount = useMemo(() => {
    const attrsClean: Record<string, string | number | boolean | string[]> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      attrsClean[k] = v as string | number | boolean | string[];
    }
    if (warranty) attrsClean.warranty = true;
    const f: ListingFilters = {
      category: category as ListingFilters["category"],
      subcategory: subcategory || undefined,
      make: make || undefined,
      model: model || undefined,
      q: q || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      yearMin: yearMin ? Number(yearMin) : undefined,
      yearMax: yearMax ? Number(yearMax) : undefined,
      kmMin: kmMin ? Number(kmMin) : undefined,
      kmMax: kmMax ? Number(kmMax) : undefined,
      powerMin: powerMin ? Number(powerMin) : undefined,
      powerMax: powerMax ? Number(powerMax) : undefined,
      engineMin: engineMin ? Number(engineMin) : undefined,
      engineMax: engineMax ? Number(engineMax) : undefined,
      fuel: fuel.length ? (fuel as ListingFilters["fuel"]) : undefined,
      transmission: transmission.length ? (transmission as ListingFilters["transmission"]) : undefined,
      bodyType: bodyType.length ? (bodyType as ListingFilters["bodyType"]) : undefined,
      color: color.length ? (color as ListingFilters["color"]) : undefined,
      condition: condition.length ? (condition as ListingFilters["condition"]) : undefined,
      sellerType: sellerType.length ? (sellerType as ListingFilters["sellerType"]) : undefined,
      county: county || undefined,
      attrs: Object.keys(attrsClean).length ? attrsClean : undefined,
    };
    return applyFilters(LISTINGS, f).length;
  }, [category, subcategory, make, model, q, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax,
      powerMin, powerMax, engineMin, engineMax, fuel, transmission, bodyType, color,
      condition, sellerType, county, attrs, warranty]);

  const totalActive = useMemo(() => {
    let n = 0;
    [make, model, q, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, powerMin, powerMax,
      engineMin, engineMax, county].forEach((v) => v && n++);
    [fuel, transmission, bodyType, color, condition, offerType, sellerType, subcategory ? [subcategory] : []]
      .forEach((a) => (n += a.length));
    n += attrActiveCount + (warranty ? 1 : 0) + (showWithoutPrice ? 0 : 1);
    return n;
  }, [make, model, q, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, powerMin, powerMax,
      engineMin, engineMax, county, fuel, transmission, bodyType, color, condition,
      offerType, sellerType, subcategory, attrActiveCount, warranty, showWithoutPrice]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const out = new URLSearchParams();
    const set = (k: string, v: string | null) => { if (v) out.set(k, v); };
    set("category", category);
    set("subcategory", subcategory);
    set("make", make); set("model", model); set("q", q);
    set("priceMin", priceMin); set("priceMax", priceMax);
    set("yearMin", yearMin); set("yearMax", yearMax);
    set("kmMin", kmMin); set("kmMax", kmMax);
    set("powerMin", powerMin); set("powerMax", powerMax);
    set("engineMin", engineMin); set("engineMax", engineMax);
    set("county", county);
    if (!showWithoutPrice) set("hidePriceless", "1");
    if (warranty) set("a.warranty", "1");
    for (const [name, vs] of [
      ["fuel", fuel], ["transmission", transmission], ["bodyType", bodyType],
      ["color", color], ["condition", condition],
      ["offerType", offerType], ["sellerType", sellerType],
    ] as const) {
      if (vs.length) out.set(name, vs.join(","));
    }
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v)) { if (v.length) out.set(`a.${k}`, v.join(",")); }
      else if (typeof v === "boolean") { if (v) out.set(`a.${k}`, "1"); }
      else out.set(`a.${k}`, String(v));
    }
    const qs = out.toString();
    startTransition(() => {
      router.push(qs ? `/oglasi?${qs}` : "/oglasi");
      onClose?.();
    });
  };

  const reset = () => {
    setSubcategory(""); setMake(""); setModel(""); setQ("");
    setPriceMin(""); setPriceMax(""); setYearMin(""); setYearMax(""); setKmMin(""); setKmMax("");
    setPowerMin(""); setPowerMax(""); setEngineMin(""); setEngineMax("");
    setFuel([]); setTransmission([]); setBodyType([]); setColor([]);
    setCondition([]); setOfferType([]); setSellerType([]); setCounty("");
    setShowWithoutPrice(true); setWarranty(false); setAttrs({});
  };

  // Chips pregled trenutno aktivnih filtera (uklonjivi).
  const activeChips: Chip[] = useMemo(() => {
    const out: Chip[] = [];
    const single = (val: string, label: string, clear: () => void) => {
      if (val) out.push({ id: label, label: `${label}: ${val}`, onRemove: clear });
    };
    const multi = (vals: string[], setter: (v: string[]) => void) => {
      vals.forEach((v) =>
        out.push({ id: `${v}`, label: v, onRemove: () => setter(vals.filter((x) => x !== v)) })
      );
    };
    if (subcategory) {
      const nm = categoryDef?.subcategories.find((s) => s.slug === subcategory)?.name ?? subcategory;
      out.push({ id: "sub", label: nm, onRemove: () => setSubcategory("") });
    }
    multi(offerType, setOfferType);
    multi(condition, setCondition);
    if (make) {
      const nm = makeOptions.find((m) => m.value === make)?.label ?? make;
      out.push({ id: "make", label: nm, onRemove: () => { setMake(""); setModel(""); } });
    }
    single(model, "Model", () => setModel(""));
    if (isAuto) single(q, "Tip", () => setQ(""));
    single(priceMin, "Cijena od", () => setPriceMin(""));
    single(priceMax, "Cijena do", () => setPriceMax(""));
    single(yearMin, "Godina od", () => setYearMin(""));
    single(yearMax, "Godina do", () => setYearMax(""));
    single(kmMin, "km od", () => setKmMin(""));
    single(kmMax, "km do", () => setKmMax(""));
    single(engineMin, "Obujam od", () => setEngineMin(""));
    single(engineMax, "Obujam do", () => setEngineMax(""));
    single(powerMin, "Snaga od", () => setPowerMin(""));
    single(powerMax, "Snaga do", () => setPowerMax(""));
    multi(fuel, setFuel);
    multi(transmission, setTransmission);
    multi(bodyType, setBodyType);
    multi(color, setColor);
    if (warranty) out.push({ id: "garancija", label: "Garancija", onRemove: () => setWarranty(false) });
    // dinamički atributi
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v)) v.forEach((x) => out.push({ id: `${k}:${x}`, label: x, onRemove: () => setAttr(k, v.filter((y) => y !== x)) }));
      else if (v === true) out.push({ id: k, label: k, onRemove: () => setAttr(k, undefined) });
      else out.push({ id: k, label: String(v), onRemove: () => setAttr(k, undefined) });
    }
    if (county) out.push({ id: "county", label: county, onRemove: () => setCounty("") });
    multi(sellerType, setSellerType);
    return out;
  }, [subcategory, categoryDef, offerType, condition, make, makeOptions, model, isAuto, q,
      priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, engineMin, engineMax, powerMin, powerMax,
      fuel, transmission, bodyType, color, warranty, attrs, county, sellerType]);

  // Renderer za jedno dinamičko polje (attr ili neobrađeni column).
  const renderField = (f: FilterField) => {
    if (f.type === "toggle") {
      return (
        <TogglePill
          key={f.key}
          on={Boolean(attrs[f.key])}
          onClick={() => setAttr(f.key, !attrs[f.key])}
          label={f.label}
        />
      );
    }
    if (f.type === "range") {
      return (
        <RangeInput
          key={f.key}
          label={f.label}
          unit={f.unit}
          value={attrs[f.key] as string | undefined}
          onSet={(v) => setAttr(f.key, v)}
        />
      );
    }
    if (f.type === "select") {
      return (
        <SelectField
          key={f.key}
          label={f.label}
          value={(attrs[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)}
          options={f.options ?? []}
        />
      );
    }
    if (f.type === "text") {
      return (
        <TextField
          key={f.key}
          label={f.label}
          value={(attrs[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)}
          placeholder={f.label}
        />
      );
    }
    // multi
    return (
      <MultiSelect
        key={f.key}
        label={f.label}
        values={(attrs[f.key] as string[] | undefined) ?? []}
        onChange={(v) => setAttr(f.key, v)}
        options={f.options ?? []}
        placeholder="Sve"
      />
    );
  };

  const renderDynGroup = (g: { name: string; fields: FilterField[] }) => {
    const GIcon = GROUP_ICON[g.name] ?? ListFilter;
    return (
      <div key={g.name} className="space-y-3">
        <SectionHead icon={GIcon} title={g.name} />
        <div className="grid sm:grid-cols-2 gap-3">
          {g.fields.map(renderField)}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-7 pb-28">
      {/* Chips pregled aktivnih filtera */}
      {activeChips.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent)]/[0.04] p-3 sm:p-4">
          <ActiveChips chips={activeChips} onClear={reset} />
        </div>
      )}

      {/* ── 1. OSNOVNO (najvažnije, istaknuto) ── */}
      <Panel>
        {categoryDef && categoryDef.subcategories.length > 0 && (
          <SelectField
            label="Podkategorija"
            value={subcategory}
            onChange={setSubcategory}
            options={categoryDef.subcategories
              .filter((s) => s.slug !== "auto-oglasi")
              .map((s) => ({ value: s.slug, label: s.name }))}
            placeholder="Sve podkategorije"
          />
        )}
        {/* Tip ponude + Stanje vozila ODMAH ispod Podkategorije */}
        <div className="grid sm:grid-cols-2 gap-3">
          <MultiSelect label="Tip ponude" values={offerType} onChange={setOfferType}
            options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
          <MultiSelect label="Stanje vozila" values={condition} onChange={setCondition}
            options={[{ value: "Rabljeno", label: "Rabljeno" }, { value: "Novo", label: "Novo" }]} placeholder="Sve" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField label="Marka" value={make} onChange={(v) => { setMake(v); setModel(""); }} options={makeOptions} placeholder="Sve marke" />
          {modelOptions.length > 0 ? (
            <SelectField label="Model" value={model} onChange={setModel} options={modelOptions} placeholder="Svi modeli" />
          ) : (
            <TextField label="Model" value={model} onChange={setModel} placeholder={make ? "npr. Golf, A4, X3..." : "Svi modeli"} />
          )}
        </div>
        {isAuto && (
          <TextField label="TIP" value={q} onChange={setQ} placeholder="npr. GTI, Avant, Quattro, M Sport..." />
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <TogglePill on={showWithoutPrice} onClick={() => setShowWithoutPrice((s) => !s)} label="Prikaži oglase bez cijene" />
          <TogglePill on={warranty} onClick={() => setWarranty((s) => !s)} label="Garancija" />
        </div>
      </Panel>

      {/* ── 2. CIJENA, GODINA, KILOMETRAŽA ── */}
      <Panel>
        <SectionHead icon={Tag} title="Cijena, godina, kilometraža" />
        {/* Tag ikona je jedinstvena za cjenovnu sekciju */}
        <RangeSelect label="Cijena (€)" unit="€" minValue={priceMin} maxValue={priceMax} onMin={setPriceMin} onMax={setPriceMax} steps={PRICE_STEPS} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Godina</Label>
            <div className="grid grid-cols-2 gap-2">
              <SelectField value={yearMin} onChange={setYearMin} placeholder="Od" options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
              <SelectField value={yearMax} onChange={setYearMax} placeholder="Do" options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
            </div>
          </div>
          <RangeSelect label="Kilometraža" unit="km" minValue={kmMin} maxValue={kmMax} onMin={setKmMin} onMax={setKmMax} steps={KM_STEPS} />
        </div>
      </Panel>

      {/* ── 4. MOTOR + KAROSERIJA ── */}
      <Panel>
        <SectionHead icon={Gauge} title="Motor i karoserija" />
        <div className="grid sm:grid-cols-2 gap-3">
          <RangeSelect label="Obujam (cm³)" unit="cm³" minValue={engineMin} maxValue={engineMax} onMin={setEngineMin} onMax={setEngineMax} steps={ENGINE_STEPS} />
          <RangeSelect label="Snaga (kW)" unit="kW" minValue={powerMin} maxValue={powerMax} onMin={setPowerMin} onMax={setPowerMax} steps={POWER_STEPS} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <MultiSelect label="Vrsta goriva" values={fuel} onChange={setFuel}
            options={fuelOpts(filterDef)} placeholder="Sve" />
          <MultiSelect label="Mjenjač" values={transmission} onChange={setTransmission}
            options={[{ value: "Ručni", label: "Ručni" }, { value: "Automatski", label: "Automatski" }]} placeholder="Sve" />
        </div>
        <BodyTypePicker label="Oblik karoserije" values={bodyType} onChange={setBodyType}
          options={bodyOpts(filterDef)} cols={3} />
      </Panel>

      {/* ── 5. Osnovne dinamičke grupe (Vrata i sjedala, PDV, Stil...) — IZNAD Boje ── */}
      {basicDynamic.length > 0 && (
        <Panel>{basicDynamic.map(renderDynGroup)}</Panel>
      )}

      {/* ── 6. BOJE (uvijek vidljivo, swatch+naziv) ── */}
      <Panel>
        <SectionHead icon={Palette} title="Boje" />
        <ColorPicker label="Boja vozila" values={color} onChange={setColor} options={colorOpts(filterDef)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <MultiSelect label="Tip boje" values={(attrs.colorType as string[] | undefined) ?? []}
            onChange={(v) => setAttr("colorType", v)}
            options={[{ value: "metalik", label: "Metalik" }, { value: "mat", label: "Mat" }]} placeholder="Sve" />
          <SelectField label="Boja unutrašnjosti" value={(attrs.upholsteryColor as string) ?? ""}
            onChange={(v) => setAttr("upholsteryColor", v || undefined)}
            options={["Crna", "Bež", "Smeđa", "Siva", "Bijela", "Crvena"].map((c) => ({ value: c, label: c }))} />
        </div>
      </Panel>

      {/* ── 6. VIŠE FILTERA (oprema/povijest/specifikacije) ── */}
      {advancedDynamic.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            className="w-full h-12 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
          >
            <Settings2 className="size-4" />
            {showMore ? "Sakrij dodatne filtere" : "Više filtera"}
            {!showMore && attrActiveCount > 0 && (
              <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-[var(--color-accent)] text-white text-[11px] font-semibold">
                {attrActiveCount}
              </span>
            )}
          </button>
          {showMore && (
            <Panel className="mt-4">{advancedDynamic.map(renderDynGroup)}</Panel>
          )}
        </div>
      )}

      {/* ── 7. LOKACIJA I PRODAVAČ (zadnje) ── */}
      <Panel>
        <SectionHead icon={MapPin} title="Lokacija i prodavač" />
        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField label="Lokacija (županija)" value={county} onChange={setCounty}
            options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
          <MultiSelect label="Prodavač" values={sellerType} onChange={setSellerType}
            options={[{ value: "Privatni", label: "Privatni" }, { value: "Trgovac", label: "Trgovac" }]} placeholder="Svi" />
        </div>
      </Panel>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          {totalActive > 0 && (
            <button type="button" onClick={reset}
              className="h-12 px-4 rounded-xl border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 flex items-center gap-2 transition-colors">
              <RotateCcw className="size-4" /> Poništi
            </button>
          )}
          <button type="submit" disabled={pending}
            className="flex-1 h-12 px-6 rounded-xl bg-[var(--color-accent)] text-[var(--color-ink)] text-sm font-semibold hover:bg-[var(--color-accent-dark)] hover:text-white disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            <Search className="size-4" />
            {pending ? "Tražim..." : `Prikaži ${liveCount} ${liveCount === 1 ? "vozilo" : "vozila"}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Sub-helpers ──────────────────────────────────────────────────────────

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={"rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 " + className}>
      {children}
    </section>
  );
}

function SectionHead({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center size-8 rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent-dark)]">
        <Icon className="size-4.5" />
      </span>
      <h2 className="font-display text-lg tracking-tight text-[var(--color-ink)]">{title}</h2>
    </div>
  );
}

// Opcije izvučene iz filterDef (po kategoriji), s fallbackom.
function optsFromField(def: CategoryFilters, key: string, fallback: Opt[]): Opt[] {
  const f = def.fields.find((x) => x.key === key);
  return f?.options ?? fallback;
}
function fuelOpts(def: CategoryFilters): Opt[] {
  return optsFromField(def, "fuel", ["Benzin", "Dizel", "Hibrid", "Električni", "Plin"].map((v) => ({ value: v, label: v })));
}
function bodyOpts(def: CategoryFilters): Opt[] {
  return optsFromField(def, "bodyType",
    ["Microcar", "Limuzina", "Hatchback", "Karavan", "Monovolumen", "SUV", "Coupe", "Cabrio", "Pickup"].map((v) => ({ value: v, label: v })));
}
function colorOpts(def: CategoryFilters): string[] {
  const f = def.fields.find((x) => x.key === "color");
  return f?.options?.map((o) => o.label) ?? ["Crna", "Bijela", "Siva", "Srebrna", "Plava", "Crvena", "Zelena", "Smeđa", "Žuta", "Narančasta"];
}
