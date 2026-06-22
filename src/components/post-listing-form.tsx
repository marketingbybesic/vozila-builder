"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, X, Sparkles } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMake } from "@/data/makes";
import { HR_LOCATIONS, COUNTIES } from "@/data/locations";
import { createListingAction } from "@/actions/listings";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
} from "@/lib/types";
import { CATEGORIES, getCategory } from "@/data/categories";
import {
  getFilterDefs, groupFields, type FilterField, type CategoryFilters,
} from "@/data/category-filters";
import {
  SelectField, MultiSelect, RangeSelect, RangeInput, BodyTypePicker,
  ColorPicker, CategoryTabs, TogglePill, TextField, type Opt,
} from "@/components/napredno/controls";
import { formatPrice, formatKm } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Kategorija i osnovno", subtitle: "Vrsta, marka, model" },
  { id: 2, title: "Specifikacije", subtitle: "Tehnički podaci i oprema" },
  { id: 3, title: "Fotografije", subtitle: "Slike vozila" },
  { id: 4, title: "Cijena i opis", subtitle: "Detalji oglasa" },
  { id: 5, title: "Pregled", subtitle: "Provjera i objava" },
];

// Steps za range-kontrole (kao u naprednoj pretrazi).
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 300000];
const POWER_STEPS = [22, 44, 55, 66, 74, 85, 96, 110, 132, 150, 184, 220, 260, 300, 400, 600];
const ENGINE_STEPS = [800, 1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000];

// Stupci koji se mapiraju na tipizirana State polja (ostalo → attributes).
const COLUMN_KEYS = new Set([
  "fuel", "transmission", "bodyType", "drive", "color",
  "engineCc", "powerKw", "doors", "seats", "km",
]);
// Polja koja prva 1. korak već pokriva (marka/model/godina/stanje/podkategorija)
// ili se ovdje ne prikazuju kao spec (cijena/županija/prodavač/starost oglasa idu drugdje).
const SKIP_KEYS = new Set([
  "priceEur", "year", "county", "sellerType", "condition", "subcategory", "adAge",
]);

type Attrs = Record<string, string | string[] | boolean | undefined>;

type State = {
  category: string;
  subcategory: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  condition: string;
  // tipizirani stupci (mogu biti prazni za kategorije koje ih ne koriste)
  fuel: string;
  transmission: string;
  bodyType: string;
  drive: string;
  color: string;
  km: string;
  engineCc: string;
  powerKw: string;
  doors: string;
  seats: string;
  // dinamički atributi (jsonb) iz sheme
  attributes: Attrs;
  photos: string[];
  priceEur: string;
  description: string;
  county: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

const empty: State = {
  category: "auto", subcategory: "",
  make: "", model: "", variant: "", year: "", condition: "Rabljeno",
  fuel: "", transmission: "", bodyType: "", drive: "", color: "",
  km: "", engineCc: "", powerKw: "", doors: "5", seats: "5",
  attributes: {},
  photos: [],
  priceEur: "", description: "",
  county: "", city: "",
  firstName: "", lastName: "", phone: "", email: "",
};

// Safe enum default — za kategorije koje nemaju neki obavezni enum stupac,
// akcija (zod) i dalje traži valjanu vrijednost; pošalji prvu valjanu opciju.
const firstFuel = FUEL_TYPES[0];
const firstTransmission = TRANSMISSIONS[0];
const firstBody = BODY_TYPES[0];
const firstDrive = DRIVES[0];
const firstColor = COLORS[0];

export function PostListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [s, setS] = useState<State>(empty);
  const [submitted, setSubmitted] = useState<{ slug: string } | false>(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setAttr = (key: string, v: State["attributes"][string]) =>
    setS((p) => ({ ...p, attributes: { ...p.attributes, [key]: v } }));

  const categoryDef = getCategory(s.category);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(s.category), [s.category]);

  // Marka po kategoriji (kao napredno-form): categoryDef.makes.
  const makeOptions: Opt[] = useMemo(
    () => (categoryDef?.makes ?? []).map((m) => ({ value: m.slug, label: m.name })),
    [categoryDef]
  );
  // Modeli postoje samo za auto (MAKES.models); ostale kategorije → tekst.
  const makeObj = s.category === "auto" && s.make ? getMake(s.make) : undefined;
  const modelOptions: Opt[] = useMemo(
    () => (makeObj?.models ?? []).map((m) => ({ value: m, label: m })),
    [makeObj]
  );

  const cities = useMemo(() => {
    const loc = HR_LOCATIONS.find((l) => l.county === s.county);
    return loc?.cities ?? [];
  }, [s.county]);

  // hasField gating (mirror napredno-form).
  const hasField = (key: string) => filterDef.fields.some((f) => f.key === key);

  // Spec polja koja se renderiraju u koraku 2 (schema-driven), uz scope filtriranje.
  const specFields = useMemo(
    () => filterDef.fields.filter((f) => {
      if (SKIP_KEYS.has(f.key)) return false;
      if (f.scope && f.scope.length > 0) {
        return s.subcategory ? f.scope.includes(s.subcategory) : false;
      }
      return true;
    }),
    [filterDef, s.subcategory]
  );
  const specGroups = useMemo(() => groupFields(specFields), [specFields]);

  // Promjena kategorije → reset kategorija-ovisnih polja.
  const changeCategory = (slug: string) => {
    setS((p) => ({
      ...p,
      category: slug, subcategory: "",
      make: "", model: "",
      fuel: "", transmission: "", bodyType: "", drive: "", color: "",
      km: "", engineCc: "", powerKw: "",
      attributes: {},
    }));
  };

  // Obavezna spec polja po kategoriji (ne hardkodiraj auto za sve).
  const requiredSpecKeys = useMemo(() => {
    // 1) publishRequired iz sheme (npr. operatingHours za mehanizaciju)
    const fromSchema = filterDef.fields
      .filter((f) => f.publishRequired && !(f.scope && f.scope.length > 0 && (!s.subcategory || !f.scope.includes(s.subcategory))))
      .map((f) => f.key);
    // 2) sensible per-category essentials (samo ako kategorija to polje ima)
    const essentials: Record<string, string[]> = {
      auto: ["fuel", "transmission", "bodyType", "km", "powerKw"],
      moto: ["fuel", "powerKw"],
      gospodarska: ["fuel", "transmission", "powerKw"],
      mehanizacija: ["fuel", "powerKw"],
      "prosti-cas": [],
      dijelovi: [],
    };
    const base = (essentials[s.category] ?? []).filter((k) => hasField(k));
    return Array.from(new Set([...fromSchema, ...base]));
  }, [filterDef, s.category, s.subcategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vrijednost obaveznog ključa (column → State, attr → attributes).
  const specValueFilled = (key: string): boolean => {
    if (COLUMN_KEYS.has(key)) {
      const v = s[key as keyof State];
      return typeof v === "string" ? v.trim().length > 0 : !!v;
    }
    const a = s.attributes[key];
    if (Array.isArray(a)) return a.length > 0;
    return a !== undefined && a !== "" && a !== false;
  };

  const stepValid = useMemo(() => {
    if (step === 1) return !!(s.category && s.make && s.model && s.year && s.condition);
    if (step === 2) return requiredSpecKeys.every(specValueFilled);
    if (step === 3) return s.photos.length >= 1;
    if (step === 4) return !!(s.priceEur && s.description.length >= 30 && s.county && s.city && s.firstName && s.phone);
    return true;
  }, [step, s, requiredSpecKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  if (submitted) {
    return (
      <div className="mt-10 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-10 text-center">
        <div className="size-16 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)] grid place-items-center mx-auto">
          <Check className="size-7" />
        </div>
        <h2 className="font-display text-2xl mt-5">Oglas je objavljen</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          Tvoj oglas je sada vidljiv na Auti.hr. Provjeri ga na detaljnoj stranici ili upravljaj iz svog računa.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/moj-racun/oglasi">Moji oglasi</Link>
          </Button>
          <Button asChild variant="primary">
            <Link href={`/oglasi/${submitted.slug}`}>Pogledaj oglas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    setSubmitErr(null);
    // Prikupi sva attr polja koja su trenutno relevantna (scope) i ne-stupci.
    const attributes: Attrs = { ...s.attributes };
    // Subcategory ide u attributes (akcija ga ne prima kao stupac).
    if (s.subcategory) attributes.subcategory = s.subcategory;

    start(async () => {
      const res = await createListingAction({
        // — kategorija/podkategorija (akcija ih trenutno ne koristi za sve, ali
        //   ne škodi — zod strip-a nepoznate ključeve, a buduća verzija ih čita) —
        category: s.category,
        subcategory: s.subcategory || undefined,
        make: makeOptions.find((m) => m.value === s.make)?.label ?? s.make,
        model: s.model,
        variant: s.variant || undefined,
        year: s.year,
        priceEur: s.priceEur,
        // — tipizirani stupci: za kategorije bez polja pošalji valjani default —
        km: hasField("km") ? (s.km || 0) : 0,
        fuel: hasField("fuel") ? (s.fuel || firstFuel) : firstFuel,
        transmission: hasField("transmission") ? (s.transmission || firstTransmission) : firstTransmission,
        bodyType: hasField("bodyType") ? (s.bodyType || firstBody) : firstBody,
        drive: hasField("drive") ? (s.drive || firstDrive) : firstDrive,
        color: hasField("color") ? (s.color || firstColor) : firstColor,
        condition: s.condition,
        engineCc: s.engineCc || 0,
        powerKw: hasField("powerKw") ? (s.powerKw || 0) : 0,
        doors: hasField("doors") ? (s.doors || 5) : 5,
        seats: hasField("seats") ? (s.seats || 5) : 5,
        city: s.city,
        county: s.county,
        description: s.description,
        // Oprema/atributi → akcija prima `features` (string[]); zadrži kompatibilnost
        // šaljući flat listu odabranih attr-multi vrijednosti, a strukturu u attributes.
        features: collectFeatureLabels(s.attributes),
        attributes,
        images: s.photos,
      });
      if (res.ok) {
        setSubmitted({ slug: res.slug });
        router.refresh();
      } else {
        setSubmitErr(res.error);
      }
    });
  };

  // Renderer za jedno spec polje iz sheme (mirror napredno-form, ali single-value
  // za column polja i edit za attr polja).
  const renderSpecField = (f: FilterField) => {
    const isColumn = COLUMN_KEYS.has(f.key);

    // ── COLUMN polja (tipizirana, single-value u objavi) ──
    if (isColumn) {
      const colVal = (s[f.key as keyof State] as string) ?? "";
      const setCol = (v: string) => set(f.key as keyof State, v as never);

      if (f.key === "bodyType") {
        return (
          <BodyTypePicker
            key={f.key}
            label={f.label}
            values={colVal ? [colVal] : []}
            onChange={(vals) => setCol(vals.length ? vals[vals.length - 1] : "")}
            options={f.options ?? []}
            cols={3}
          />
        );
      }
      if (f.key === "color") {
        return (
          <ColorPicker
            key={f.key}
            label={f.label}
            values={colVal ? [colVal] : []}
            onChange={(vals) => setCol(vals.length ? vals[vals.length - 1] : "")}
            options={(f.options ?? []).map((o) => o.label)}
          />
        );
      }
      if (f.type === "range") {
        // km/powerKw/engineCc → jedinstvena vrijednost (objava), select sa steps
        const steps = f.key === "km" ? KM_STEPS : f.key === "powerKw" ? POWER_STEPS : ENGINE_STEPS;
        return (
          <div key={f.key}>
            <SelectField
              label={`${f.label}${f.unit ? ` (${f.unit})` : ""}`}
              value={colVal}
              onChange={setCol}
              placeholder="Odaberi"
              options={steps.map((n) => ({ value: String(n), label: n.toLocaleString("hr-HR") + (f.unit ? ` ${f.unit}` : "") }))}
            />
          </div>
        );
      }
      // multi/select column (fuel/transmission/drive/doors/seats) → single SelectField
      return (
        <SelectField
          key={f.key}
          label={f.label}
          value={colVal}
          onChange={setCol}
          placeholder="Odaberi"
          options={f.options ?? []}
        />
      );
    }

    // ── ATTR polja (jsonb) ──
    if (f.type === "toggle") {
      return (
        <TogglePill
          key={f.key}
          on={Boolean(s.attributes[f.key])}
          onClick={() => setAttr(f.key, !s.attributes[f.key])}
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
          value={s.attributes[f.key] as string | undefined}
          onSet={(v) => setAttr(f.key, v)}
        />
      );
    }
    if (f.type === "select") {
      return (
        <SelectField
          key={f.key}
          label={f.label}
          value={(s.attributes[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)}
          options={f.options ?? []}
          placeholder="Odaberi"
        />
      );
    }
    if (f.type === "text") {
      return (
        <TextField
          key={f.key}
          label={f.label}
          value={(s.attributes[f.key] as string) ?? ""}
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
        values={(s.attributes[f.key] as string[] | undefined) ?? []}
        onChange={(v) => setAttr(f.key, v)}
        options={f.options ?? []}
        placeholder="Odaberi"
      />
    );
  };

  // Toggle-grupe (npr. Oprema/Udobnost s mnogo togglova) — kompaktni grid.
  const renderSpecGroup = (g: { name: string; fields: FilterField[] }) => {
    const allToggle = g.fields.every((f) => f.type === "toggle" && !COLUMN_KEYS.has(f.key));
    const allBodyOrColor = g.fields.every((f) => f.key === "bodyType" || f.key === "color");
    return (
      <div key={g.name} className="space-y-3">
        <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          {g.name}
        </div>
        <div className={allBodyOrColor ? "space-y-4" : (allToggle ? "grid sm:grid-cols-2 gap-2" : "grid sm:grid-cols-2 gap-4")}>
          {g.fields.map(renderSpecField)}
        </div>
      </div>
    );
  };

  return (
    <>
      <ol className="mt-8 grid grid-cols-5 gap-2">
        {STEPS.map((st) => {
          const done = st.id < step;
          const active = st.id === step;
          return (
            <li key={st.id} className="flex flex-col items-center text-center gap-1.5">
              <div
                className={
                  "size-9 rounded-full grid place-items-center text-xs font-semibold border-2 transition-all " +
                  (active
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : done
                    ? "bg-[var(--color-success)] text-white border-[var(--color-success)]"
                    : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-line)]")
                }
              >
                {done ? <Check className="size-4" /> : st.id}
              </div>
              <div className="hidden sm:block">
                <div className={"text-xs font-medium " + (active ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]")}>
                  {st.title}
                </div>
                <div className="text-[10px] text-[var(--color-muted)] hidden md:block">{st.subtitle}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 h-1 bg-[var(--color-line)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      <div className="mt-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6 md:p-8 animate-fade-in" key={step}>
        {step === 1 && (
          <div className="space-y-5">
            <FormHeader title="Kategorija i osnovno" desc="Što prodaješ?" />
            <Field label="Kategorija">
              <CategoryTabs categories={CATEGORIES} value={s.category} onChange={changeCategory} />
            </Field>
            {categoryDef && categoryDef.subcategories.length > 0 && (
              <SelectField
                label="Podkategorija"
                value={s.subcategory}
                onChange={(v) => set("subcategory", v)}
                placeholder="Odaberi podkategoriju"
                options={categoryDef.subcategories
                  .filter((sc) => sc.slug !== "auto-oglasi")
                  .map((sc) => ({ value: sc.slug, label: sc.name }))}
              />
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                label="Marka"
                value={s.make}
                onChange={(v) => { set("make", v); set("model", ""); }}
                placeholder="Odaberi marku"
                options={makeOptions}
              />
              {modelOptions.length > 0 ? (
                <SelectField
                  label="Model"
                  value={s.model}
                  onChange={(v) => set("model", v)}
                  placeholder={s.make ? "Odaberi model" : "Prvo odaberi marku"}
                  options={modelOptions}
                />
              ) : (
                <TextField
                  label="Model"
                  value={s.model}
                  onChange={(v) => set("model", v)}
                  placeholder={s.make ? "Upiši model" : "Prvo odaberi marku"}
                />
              )}
              <TextField
                label="Izvedba (opcionalno)"
                value={s.variant}
                onChange={(v) => set("variant", v)}
                placeholder="npr. 2.0 TDI Style DSG"
              />
              <SelectField
                label="Godina proizvodnje"
                value={s.year}
                onChange={(v) => set("year", v)}
                placeholder="Odaberi godinu"
                options={Array.from({ length: 37 }, (_, i) => 2026 - i).map((y) => ({ value: String(y), label: `${y}.` }))}
              />
            </div>
            <Field label="Stanje">
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => set("condition", c)}
                    className={"h-11 rounded-md border text-sm transition-all " + (s.condition === c ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <FormHeader title="Specifikacije" desc={`Tehnički podaci za: ${categoryDef?.name ?? s.category}`} />
            {specGroups.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Za ovu kategoriju nema dodatnih specifikacija. Nastavi dalje.</p>
            ) : (
              <div className="space-y-6">
                {specGroups.map(renderSpecGroup)}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <FormHeader title="Fotografije" desc="Prva slika je naslovna - odaberi najljepši kut" />
            <PhotoUploader photos={s.photos} onChange={(p) => set("photos", p)} />
            <div className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] rounded-md p-3 leading-relaxed">
              <strong className="text-[var(--color-ink)]">Savjet:</strong> kvalitetne fotografije pri dnevnom svjetlu povećavaju šansu prodaje. Slikaj iz svih kutova - prednja strana, bok, stražnja, interijer, prtljažnik, kotači. Izbjegavaj filtere.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <FormHeader title="Cijena, opis i kontakt" desc="Što kupac mora znati?" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cijena (€)">
                <Input type="number" inputMode="numeric" value={s.priceEur} onChange={(e) => set("priceEur", e.target.value)} placeholder="npr. 15900" />
              </Field>
              <div className="self-end">
                <div className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Provjeri cijene sličnih vozila prije objave. Realna cijena = brža prodaja.
                </div>
              </div>
            </div>
            <Field label={`Opis (${s.description.length}/2000)`}>
              <Textarea
                value={s.description}
                onChange={(e) => set("description", e.target.value.slice(0, 2000))}
                placeholder="Stanje vozila, povijest servisiranja, što je novo zamijenjeno, da li je iz prvog vlasništva, garažirano, registracija..."
                className="min-h-[160px]"
              />
              {s.description.length < 30 && (
                <div className="text-xs text-[var(--color-muted)] mt-1">Minimalno 30 znakova</div>
              )}
            </Field>

            <div className="border-t border-[var(--color-line)] pt-5">
              <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">Lokacija</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Županija"
                  value={s.county}
                  onChange={(v) => { set("county", v); set("city", ""); }}
                  placeholder="Odaberi županiju"
                  options={COUNTIES.map((c) => ({ value: c, label: c }))}
                />
                {cities.length > 0 ? (
                  <SelectField
                    label="Grad"
                    value={s.city}
                    onChange={(v) => set("city", v)}
                    placeholder={s.county ? "Odaberi grad" : "Prvo odaberi županiju"}
                    options={cities.map((c) => ({ value: c, label: c }))}
                  />
                ) : (
                  <TextField
                    label="Grad"
                    value={s.city}
                    onChange={(v) => set("city", v)}
                    placeholder={s.county ? "Upiši grad" : "Prvo odaberi županiju"}
                  />
                )}
              </div>
            </div>

            <div className="border-t border-[var(--color-line)] pt-5">
              <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">Tvoji kontakt podaci</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Ime">
                  <Input value={s.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </Field>
                <Field label="Prezime">
                  <Input value={s.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </Field>
                <Field label="Telefon">
                  <Input type="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+385 91 234 5678" />
                </Field>
                <Field label="E-mail">
                  <Input type="email" value={s.email} onChange={(e) => set("email", e.target.value)} placeholder="ime@primjer.hr" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <FormHeader title="Pregled prije objave" desc="Provjeri sve podatke" icon={<Sparkles className="size-5" />} />
            <ReviewPreview state={s} makeLabel={makeOptions.find((m) => m.value === s.make)?.label ?? s.make} />
            <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-md p-4 text-sm">
              <div className="font-medium text-[var(--color-ink)] mb-1">Prvi oglas — besplatno</div>
              <p className="text-[var(--color-ink-soft)] text-xs leading-relaxed">
                Ova objava se ne naplaćuje. Sljedeći oglasi iz tvog računa naplaćuju se prema cjeniku (od 4,90 €).
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-line)]">
          <Button
            variant="ghost"
            onClick={() => setStep((p) => Math.max(1, p - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="size-4" />
            Natrag
          </Button>

          {step < STEPS.length ? (
            <Button variant="primary" onClick={() => setStep((p) => p + 1)} disabled={!stepValid}>
              Nastavi
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitErr && (
                <span className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 px-3 py-1.5 rounded-md">
                  {submitErr}
                </span>
              )}
              <Button variant="accent" size="lg" onClick={handleSubmit} disabled={pending}>
                <Check className="size-4" />
                {pending ? "Objavljujem..." : "Objavi oglas"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Skupi sve odabrane attr-multi/-select labele u flat listu (za `features`).
function collectFeatureLabels(attrs: Attrs): string[] {
  const out: string[] = [];
  for (const v of Object.values(attrs)) {
    if (Array.isArray(v)) out.push(...v);
    else if (typeof v === "string" && v) out.push(v);
    else if (v === true) { /* toggle bez labele — preskoči */ }
  }
  return out;
}

function FormHeader({ title, desc, icon }: { title: string; desc: string; icon?: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <p className="text-sm text-[var(--color-muted)] mt-0.5">{desc}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [busy, setBusy] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    const remaining = Math.max(0, 10 - photos.length);
    const arr = Array.from(files).slice(0, remaining);
    let done = 0;
    const next = [...photos];
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") next.push(reader.result);
        done++;
        if (done === arr.length) {
          onChange(next);
          setBusy(false);
        }
      };
      reader.onerror = () => {
        done++;
        if (done === arr.length) {
          onChange(next);
          setBusy(false);
        }
      };
      reader.readAsDataURL(file);
    });
    if (arr.length === 0) setBusy(false);
  };

  const removeAt = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block border-2 border-dashed border-[var(--color-line)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-colors bg-[var(--color-bg)]">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={photos.length >= 10}
        />
        <Upload className="size-8 mx-auto text-[var(--color-muted)]" />
        <div className="mt-3 font-medium">
          {photos.length >= 10 ? "Maksimalno 10 fotografija" : "Klikni za upload ili povuci datoteke"}
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-1">
          {photos.length}/10 · JPG, PNG, WebP · max 10 MB svaka
        </div>
        {busy && <Badge variant="outline" className="mt-3 animate-pulse">Obrada...</Badge>}
      </label>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-[4/3] rounded-md overflow-hidden bg-[var(--color-line)] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <Badge variant="accent" className="absolute top-1 left-1 text-[10px] px-1.5 py-0">
                  Naslovna
                </Badge>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white grid place-items-center hover:bg-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Ukloni fotografiju"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewPreview({ state: s, makeLabel }: { state: State; makeLabel: string }) {
  const price = s.priceEur ? formatPrice(Number(s.priceEur)) : "—";
  const km = s.km ? formatKm(Number(s.km)) : "—";
  const make = makeLabel || "—";
  const featureLabels = collectFeatureLabels(s.attributes);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden">
      {s.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.photos[0]} alt="" className="w-full aspect-[16/9] object-cover" />
      )}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-2xl">
            {make} {s.model} {s.variant && <span className="italic text-[var(--color-ink-soft)] font-normal">{s.variant}</span>}
          </h3>
          <p className="text-sm text-[var(--color-muted)]">{s.year && `${s.year}. · `}{s.city || "—"}, {s.county || "—"}</p>
        </div>
        <div className="font-display text-3xl">{price}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t border-[var(--color-line)]">
          {s.km && <Spec k="Kilometraža" v={km} />}
          {s.fuel && <Spec k="Gorivo" v={s.fuel} />}
          {s.transmission && <Spec k="Mjenjač" v={s.transmission} />}
          {s.bodyType && <Spec k="Karoserija" v={s.bodyType} />}
          {s.drive && <Spec k="Pogon" v={s.drive} />}
          {s.powerKw && <Spec k="Snaga" v={`${s.powerKw} kW`} />}
        </div>
        {s.description && (
          <p className="text-sm text-[var(--color-ink-soft)] pt-3 border-t border-[var(--color-line)] line-clamp-4">
            {s.description}
          </p>
        )}
        {featureLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--color-line)]">
            {featureLabels.slice(0, 8).map((f) => <Badge key={f} variant="neutral">{f}</Badge>)}
            {featureLabels.length > 8 && <Badge variant="outline">+ {featureLabels.length - 8}</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
