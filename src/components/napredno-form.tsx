"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAKES } from "@/data/makes";
import { LISTINGS } from "@/data/listings";
import { applyFilters } from "@/lib/filter";
import type { ListingFilters } from "@/lib/types";
import { getCategory } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import { getFilterDefs, groupFields, type FilterField } from "@/data/category-filters";
import { ChevronDown } from "lucide-react";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, DRIVES, COLORS, CONDITIONS, SELLER_TYPES,
} from "@/lib/types";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
// avto.net "Moč motorja" (snaga kW) i "Prostornina" (obujam ccm) koraci
const POWER_STEPS = [44, 55, 66, 74, 85, 96, 110, 132, 150, 184, 220, 260, 300];
const ENGINE_STEPS = [1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000];
const EURO_NORMS = ["EURO 3", "EURO 4", "EURO 5", "EURO 6", "EURO 6d", "EURO 7"] as const;
const DOORS_OPTS = ["2/3", "4/5"] as const;
const SEATS_OPTS = ["2", "4", "5", "6", "7", "8", "9"] as const;
const YEAR_NOW = new Date().getFullYear();
// Njuškalo-style wide range: current year back to 1900 for oldtimers
const YEAR_OLDEST = 1900;
const YEARS = Array.from({ length: YEAR_NOW - YEAR_OLDEST + 1 }, (_, i) => YEAR_NOW - i);

type AttrValue = string | string[] | boolean | undefined;

export function NaprednoForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  // Napredna pretraga je ISKLJUČIVO za automobile (Karlo, 2026-06-09).
  // Kategorija je uvijek "auto" — nema biranja drugih kategorija.
  const initSubcategory = sp.get("subcategory") ?? "";
  const [category] = useState<string>("auto");
  const [subcategory, setSubcategory] = useState<string>(initSubcategory);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [q, setQ] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [kmMin, setKmMin] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [fuel, setFuel] = useState<string[]>([]);
  const [transmission, setTransmission] = useState<string[]>([]);
  const [powerMin, setPowerMin] = useState("");
  const [powerMax, setPowerMax] = useState("");
  const [engineMin, setEngineMin] = useState("");
  const [engineMax, setEngineMax] = useState("");
  const [bodyType, setBodyType] = useState<string[]>([]);
  const [drive, setDrive] = useState<string[]>([]);
  const [doors, setDoors] = useState<string[]>([]);
  const [seats, setSeats] = useState<string[]>([]);
  const [color, setColor] = useState<string[]>([]);
  const [euroNorm, setEuroNorm] = useState<string[]>([]);
  const [condition, setCondition] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<string[]>([]);
  const [county, setCounty] = useState("");
  const [attrs, setAttrs] = useState<Record<string, AttrValue>>({});

  const categoryDef = category ? getCategory(category) : undefined;
  const makeOptions = useMemo(() => {
    if (!category) return MAKES.map((m) => ({ slug: m.slug, name: m.name }));
    return categoryDef?.makes ?? [];
  }, [category, categoryDef]);
  // Ovisni model dropdown (avto.net logika: marka → filtrirani modeli).
  // Auto marke imaju model-liste; ostale kategorije nemaju → fallback na text.
  const selectedMakeModels = useMemo(() => {
    if (!make) return [];
    return MAKES.find((m) => m.slug === make)?.models ?? [];
  }, [make]);
  const filterDef = useMemo(() => getFilterDefs(category || "auto"), [category]);
  const attrFields = useMemo(
    () => filterDef.fields.filter((f) => f.storage === "attr"),
    [filterDef]
  );
  const attrGroups = useMemo(() => groupFields(attrFields), [attrFields]);

  // Živi brojač rezultata (avto.net "Najdenih: N") — računa se klijentski
  // nad LISTINGS dok korisnik mijenja filtere, prije submita.
  const liveCount = useMemo(() => {
    const attrsClean: Record<string, string | number | boolean | string[]> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      attrsClean[k] = v as string | number | boolean | string[];
    }
    const f: ListingFilters = {
      category: (category || undefined) as ListingFilters["category"],
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
      drive: drive.length ? (drive as ListingFilters["drive"]) : undefined,
      doors: doors.length ? doors : undefined,
      seats: seats.length ? seats : undefined,
      color: color.length ? (color as ListingFilters["color"]) : undefined,
      euroNorm: euroNorm.length ? euroNorm : undefined,
      condition: condition.length ? (condition as ListingFilters["condition"]) : undefined,
      sellerType: sellerType.length ? (sellerType as ListingFilters["sellerType"]) : undefined,
      county: county || undefined,
      attrs: Object.keys(attrsClean).length ? attrsClean : undefined,
    };
    return applyFilters(LISTINGS, f).length;
  }, [category, subcategory, make, model, q, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, powerMin, powerMax, engineMin, engineMax, fuel, transmission, bodyType, drive, doors, seats, color, euroNorm, condition, sellerType, county, attrs]);

  const setAttr = (key: string, v: AttrValue) =>
    setAttrs((a) => ({ ...a, [key]: v }));
  const toggleAttrMulti = (key: string, v: string) => {
    setAttrs((a) => {
      const cur = (a[key] as string[] | undefined) ?? [];
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return { ...a, [key]: next };
    });
  };
  const toggleAttrBool = (key: string) =>
    setAttrs((a) => ({ ...a, [key]: !a[key] }));

  function arrToQ(name: string, vs: string[]) { return vs.length ? [name, vs.join(",")] : null; }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    const set = (k: string, v: string | null) => { if (v) sp.set(k, v); };
    if (category) set("category", category);
    if (subcategory) set("subcategory", subcategory);
    if (make) set("make", make);
    if (model) set("model", model);
    if (q) set("q", q);
    if (priceMin) set("priceMin", priceMin);
    if (priceMax) set("priceMax", priceMax);
    if (yearMin) set("yearMin", yearMin);
    if (yearMax) set("yearMax", yearMax);
    if (kmMin) set("kmMin", kmMin);
    if (kmMax) set("kmMax", kmMax);
    if (powerMin) set("powerMin", powerMin);
    if (powerMax) set("powerMax", powerMax);
    if (engineMin) set("engineMin", engineMin);
    if (engineMax) set("engineMax", engineMax);
    if (county) set("county", county);
    for (const [name, vs] of [
      ["fuel", fuel], ["transmission", transmission], ["bodyType", bodyType],
      ["drive", drive], ["doors", doors], ["seats", seats], ["color", color],
      ["euroNorm", euroNorm], ["condition", condition], ["sellerType", sellerType],
    ] as const) {
      const r = arrToQ(name, vs);
      if (r) sp.set(r[0], r[1]);
    }
    // Attributes
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === "" || v === false) continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue;
        sp.set(`a.${k}`, v.join(","));
      } else if (typeof v === "boolean") {
        if (v) sp.set(`a.${k}`, "1");
      } else {
        sp.set(`a.${k}`, String(v));
      }
    }
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/oglasi?${qs}` : "/oglasi"));
  };

  const reset = () => {
    setSubcategory(""); setMake(""); setModel(""); setQ("");
    setPriceMin(""); setPriceMax(""); setYearMin(""); setYearMax(""); setKmMin(""); setKmMax("");
    setPowerMin(""); setPowerMax(""); setEngineMin(""); setEngineMax("");
    setFuel([]); setTransmission([]); setBodyType([]); setDrive([]); setDoors([]); setSeats([]);
    setColor([]); setEuroNorm([]); setCondition([]); setSellerType([]);
    setCounty(""); setAttrs({});
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="Vrsta auta">
        <Row>
          {categoryDef && categoryDef.subcategories.length > 0 && (
            <Field label="Podkategorija">
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={selectCls}>
                <option value="">Sve podkategorije</option>
                {categoryDef.subcategories.map((sc) => (
                  <option key={sc.slug} value={sc.slug}>{sc.name}</option>
                ))}
              </select>
            </Field>
          )}
        </Row>
      </Section>

      <Section title="Osnovno">
        <Field label="Pojam">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="npr. xenon, koža, automatik..."
            className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]"
          />
        </Field>
        <Row>
          <Field label="Marka">
            <select value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }} className={selectCls}>
              <option value="">Sve marke</option>
              {makeOptions.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Model">
            {selectedMakeModels.length > 0 ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} className={selectCls}>
                <option value="">Svi modeli</option>
                {selectedMakeModels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                type="text"
                disabled={!make && !!category && category !== "auto"}
                placeholder={make ? "npr. Golf, A4, X3..." : "Prvo odaberi marku"}
                className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] disabled:opacity-50"
              />
            )}
          </Field>
        </Row>
      </Section>

      {/* ── Redoslijed 1:1 kao avto.net napredna pretraga (vidi AVTONET-FORM-REFERENCE.md) ──
          Stanje → Karoserija(oblik) → Marka/Model → Cijena+Godina+Km →
          Motor(obujam→snaga→gorivo→mjenjač) → Oprema → Boja → Lokacija/prodavač */}

      <Section title="Stanje">
        <Field label="Stanje vozila">
          <CheckGroup options={CONDITIONS} values={condition} onChange={setCondition} />
        </Field>
      </Section>

      <Section title="Oblik karoserije">
        <CheckGroup options={BODY_TYPES} values={bodyType} onChange={setBodyType} />
      </Section>

      {/* avto.net "Cena, starost, prevoženih km" — sve u jednoj sekciji */}
      <Section title="Cijena, godina, kilometraža">
        <Row>
          <Field label="Cijena od (€)">
            <select value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {PRICE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} €</option>)}
            </select>
          </Field>
          <Field label="Cijena do (€)">
            <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {PRICE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} €</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Godina od">
            <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Godina do">
            <select value={yearMax} onChange={(e) => setYearMax(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Kilometri od">
            <select value={kmMin} onChange={(e) => setKmMin(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {KM_STEPS.map((k) => <option key={k} value={k}>{k.toLocaleString("hr-HR")} km</option>)}
            </select>
          </Field>
          <Field label="Kilometri do">
            <select value={kmMax} onChange={(e) => setKmMax(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {KM_STEPS.map((k) => <option key={k} value={k}>{k.toLocaleString("hr-HR")} km</option>)}
            </select>
          </Field>
        </Row>
      </Section>

      {/* avto.net "Gorivo, motor, menjalnik": Prostornina → Moč → Gorivo → Menjalnik */}
      <Section title="Gorivo, motor, mjenjač">
        <Row>
          <Field label="Obujam od (cm³)">
            <select value={engineMin} onChange={(e) => setEngineMin(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {ENGINE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} cm³</option>)}
            </select>
          </Field>
          <Field label="Obujam do (cm³)">
            <select value={engineMax} onChange={(e) => setEngineMax(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {ENGINE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} cm³</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Snaga od (kW)">
            <select value={powerMin} onChange={(e) => setPowerMin(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {POWER_STEPS.map((p) => <option key={p} value={p}>{p} kW</option>)}
            </select>
          </Field>
          <Field label="Snaga do (kW)">
            <select value={powerMax} onChange={(e) => setPowerMax(e.target.value)} className={selectCls}>
              <option value="">Bez granice</option>
              {POWER_STEPS.map((p) => <option key={p} value={p}>{p} kW</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Vrsta goriva">
          <CheckGroup options={FUEL_TYPES} values={fuel} onChange={setFuel} />
        </Field>
        <Field label="Mjenjač">
          <CheckGroup options={TRANSMISSIONS} values={transmission} onChange={setTransmission} />
        </Field>
      </Section>

      {/* avto.net "Dodatna oprema" + pogon/vrata/sjedala + emisija */}
      <Section title="Dodatna oprema i specifikacije" collapsible defaultOpen={false}>
        <Field label="Pogon">
          <CheckGroup options={DRIVES} values={drive} onChange={setDrive} />
        </Field>
        <Field label="Broj vrata">
          <CheckGroup options={DOORS_OPTS} values={doors} onChange={setDoors} />
        </Field>
        <Field label="Broj sjedala">
          <CheckGroup options={SEATS_OPTS} values={seats} onChange={setSeats} />
        </Field>
        <Field label="Emisijska norma (EURO)">
          <CheckGroup options={EURO_NORMS} values={euroNorm} onChange={setEuroNorm} />
        </Field>
      </Section>

      <Section title="Boja vozila" collapsible defaultOpen={false}>
        <Field label="Boja">
          <CheckGroup options={COLORS} values={color} onChange={setColor} />
        </Field>
      </Section>

      {/* avto.net "Drugi pogoji, omejitve" — lokacija + prodavač zadnji */}
      <Section title="Lokacija i prodavač">
        <Row>
          <Field label="Lokacija (županija)">
            <select value={county} onChange={(e) => setCounty(e.target.value)} className={selectCls}>
              <option value="">Sve županije</option>
              {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Prodavač">
            <CheckGroup options={SELLER_TYPES} values={sellerType} onChange={setSellerType} />
          </Field>
        </Row>
      </Section>

      {attrGroups.length > 0 && (
        <Section title={`Specifični filtri · ${filterDef.label}`}>
          {attrGroups.map((g) => (
            <div key={g.name} className="space-y-3 pt-2">
              <h3 className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                {g.name}
              </h3>
              {g.fields.map((f) => (
                <AttrField
                  key={f.key}
                  field={f}
                  value={attrs[f.key]}
                  onSet={(v) => setAttr(f.key, v)}
                  onToggle={() => toggleAttrBool(f.key)}
                  onMulti={(v) => toggleAttrMulti(f.key, v)}
                />
              ))}
            </div>
          ))}
        </Section>
      )}

      <div className="flex gap-2 sticky bottom-0 z-10 bg-[var(--color-bg)] p-3 rounded-md border-t border-[var(--color-line)] -mx-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <button
          type="submit"
          disabled={pending}
          className="h-11 px-6 rounded-md bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-soft)] disabled:opacity-60"
        >
          {pending
            ? "Tražim..."
            : `Prikaži ${liveCount} ${liveCount === 1 ? "vozilo" : liveCount < 5 ? "vozila" : "vozila"}`}
        </button>
        <button
          type="button"
          onClick={reset}
          className="h-11 px-5 rounded-md border border-[var(--color-line)] text-sm font-medium hover:bg-[var(--color-line)]/40"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

const selectCls = "w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-sm";

function Section({
  title, children, collapsible = false, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!collapsible) {
    return (
      <section>
        <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }
  return (
    <section className="border-t border-[var(--color-line)] pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 mt-3">{children}</div>}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1.5 font-medium text-[var(--color-ink)]">{label}</span>
      {children}
    </label>
  );
}

function CheckGroup({
  options, values, onChange,
}: { options: readonly string[]; values: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => {
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={
              "px-3 py-1.5 rounded-full border text-xs transition-colors " +
              (active
                ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
            }
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function AttrField({
  field, value, onSet, onToggle, onMulti,
}: {
  field: FilterField;
  value: AttrValue;
  onSet: (v: string | undefined) => void;
  onToggle: () => void;
  onMulti: (v: string) => void;
}) {
  if (field.type === "toggle") {
    const on = Boolean(value);
    return (
      <button
        type="button"
        onClick={onToggle}
        className={
          "w-full text-left text-sm px-3 py-2 rounded-md border flex items-center justify-between transition-colors " +
          (on ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
              : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
        }
      >
        <span>{field.label}</span>
        <span className={"size-2 rounded-full " + (on ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]")} />
      </button>
    );
  }

  if (field.type === "range") {
    const raw = (value as string) ?? "";
    const [minS, maxS] = raw.includes("..") ? raw.split("..") : ["", ""];
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
          {field.label}{field.unit ? ` (${field.unit})` : ""}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            defaultValue={minS}
            placeholder={field.min !== undefined ? String(field.min) : "Min"}
            onBlur={(e) => {
              const v = e.target.value;
              if (!v && !maxS) onSet(undefined);
              else onSet(`${v}..${maxS}`);
            }}
            className={selectCls}
          />
          <input
            type="number"
            defaultValue={maxS}
            placeholder={field.max !== undefined ? String(field.max) : "Max"}
            onBlur={(e) => {
              const v = e.target.value;
              if (!v && !minS) onSet(undefined);
              else onSet(`${minS}..${v}`);
            }}
            className={selectCls}
          />
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
        <select value={(value as string) ?? ""} onChange={(e) => onSet(e.target.value || undefined)} className={selectCls}>
          <option value="">Sve</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "multi") {
    const vs = (value as string[] | undefined) ?? [];
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const active = vs.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onMulti(o.value)}
                className={
                  "px-3 py-1.5 rounded-full border text-xs transition-colors " +
                  (active
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
      <input
        defaultValue={(value as string) ?? ""}
        placeholder={field.label}
        onBlur={(e) => onSet(e.target.value || undefined)}
        className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]"
      />
    </div>
  );
}
