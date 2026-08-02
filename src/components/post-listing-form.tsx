"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, X, Sparkles, GripVertical, Star, AlertCircle } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CATEGORIES, getCategory, makesDbFor } from "@/data/categories";
import {
  getFilterDefs, groupFields, type FilterField, type CategoryFilters,
} from "@/data/category-filters";
import {
  SelectField, MultiSelect, NumberField, BodyTypePicker, MonthYearField,
  ColorPicker, CategoryCards, SubcategoryButtons, TogglePill, TextField, type Opt,
} from "@/components/napredno/controls";
import { formatPrice, formatKm } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Kategorija", subtitle: "Što prodaješ?" },
  { id: 2, title: "Osnovno", subtitle: "Marka, model, godina" },
  { id: 3, title: "Specifikacije", subtitle: "Tehnički podaci" },
  { id: 4, title: "Fotografije", subtitle: "Slike vozila" },
  { id: 5, title: "Cijena i opis", subtitle: "Detalji oglasa" },
  { id: 6, title: "Pregled", subtitle: "Provjera i objava" },
];

// Stupci koji se mapiraju na tipizirana State polja (ostalo → attributes).
const COLUMN_KEYS = new Set([
  "fuel", "transmission", "bodyType", "drive", "color",
  "engineCc", "powerKw", "doors", "seats", "km",
]);
// Polja koja prva 1. korak već pokriva (marka/model/godina/stanje/podkategorija)
// ili se ovdje ne prikazuju kao spec (cijena/županija/prodavač/starost oglasa idu drugdje).
const SKIP_KEYS = new Set([
  "priceEur", "year", "county", "sellerType", "condition", "subcategory", "adAge",
  // Karlo 31.07: dokumenti se renderiraju ručno u koraku 2 ("Osnovno"),
  // pa ih korak 3 ("Specifikacije") ne smije ponoviti.
  "vin", "firstRegistration", "roadworthyUntil",
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

/**
 * Karlo 31.07: "po defaultu je da" — vozilo se prodaje u cijelosti, u voznom
 * je stanju i neoštećeno. Prodavač mijenja samo ako NIJE tako.
 */
const STATE_DEFAULTS: Attrs = { soldWhole: true, roadworthy: true, undamaged: true };

const empty: State = {
  category: "auto", subcategory: "",
  make: "", model: "", variant: "", year: "", condition: "Rabljeno",
  fuel: "", transmission: "", bodyType: "", drive: "", color: "",
  km: "", engineCc: "", powerKw: "", doors: "5", seats: "5",
  attributes: { ...STATE_DEFAULTS },
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
  /**
   * Sažetak "još X podataka" ne smije vikati na prazan korak koji korisnik tek
   * otvara. Pali se na prvi pokušaj "Nastavi" ili čim nešto upiše, i resetira
   * se pri prelasku na sljedeći korak.
   */
  const [showMissing, setShowMissing] = useState(false);
  const [pending, start] = useTransition();

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setAttr = (key: string, v: State["attributes"][string]) =>
    setS((p) => ({ ...p, attributes: { ...p.attributes, [key]: v } }));

  /**
   * Karlo 31.07: kvačice u "Stanju vozila" idu u PAROVIMA koji se isključuju.
   * Uključivanje jedne gasi njezin par (i obrnuto), pa vozilo nikad ne može
   * biti istovremeno vozno i nevozno, ni oštećeno i neoštećeno.
   */
  const STATE_PAIRS: Record<string, string> = {
    roadworthy: "notRoadworthy", notRoadworthy: "roadworthy",
    undamaged: "damaged", damaged: "undamaged",
  };
  const toggleSellerState = (key: string, on: boolean) =>
    setS((p) => {
      const next = { ...p.attributes, [key]: on };
      const pair = STATE_PAIRS[key];
      // Gasi suprotnu kvačicu samo pri UKLJUČIVANJU — gašenjem obje korisnik
      // smije ostaviti "neizjašnjeno".
      if (pair && on) next[pair] = false;
      return { ...p, attributes: next };
    });

  const categoryDef = getCategory(s.category);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(s.category), [s.category]);

  // Marka po kategoriji (kao napredno-form): categoryDef.makes.
  const makeOptions: Opt[] = useMemo(
    () => (categoryDef?.makes ?? []).map((m) => ({ value: m.slug, label: m.name })),
    [categoryDef]
  );
  // Karlo 31.07: "Osobni auto" je sad PRAVA podkategorija — više se ne izuzima.
  const subcatOptions: Opt[] = useMemo(
    () => (categoryDef?.subcategories ?? [])
      .map((sc) => ({ value: sc.slug, label: sc.name })),
    [categoryDef]
  );
  /**
   * Karlo 31.07: podkategorije koje imaju JOŠ JEDNU razinu (Auto dijelovi,
   * Oprema za kampere i kamping…) moraju se moći odabrati do kraja — prodavač
   * bira točan tip artikla, ne samo skupinu.
   *
   * ⚠️ Bez ovoga drugi nivo nikad nije bio popunjen: pretraga ga filtrira preko
   * `attributes.vrsta` (vidi `subChildHref`), a objava taj atribut nije nigdje
   * postavljala — pa su sve podrubrike 2. nivoa vraćale 0 rezultata.
   */
  const childOptions: Opt[] = useMemo(() => {
    const sub = (categoryDef?.subcategories ?? []).find((sc) => sc.slug === s.subcategory);
    return (sub?.children ?? []).map((c) => ({ value: c.slug, label: c.name }));
  }, [categoryDef, s.subcategory]);
  // Karlo 27.07: modeli dolaze iz baze TE kategorije (auto/moto/gospodarska).
  // Kategorije bez baze i dalje padaju na slobodan tekstualni unos.
  const modelOptions: Opt[] = useMemo(
    () => {
      if (!s.make) return [];
      return (makesDbFor(s.category).find((m) => m.slug === s.make)?.models ?? [])
        .map((m) => ({ value: m, label: m }));
    },
    [s.category, s.make]
  );

  const cities = useMemo(() => {
    const loc = HR_LOCATIONS.find((l) => l.county === s.county);
    return loc?.cities ?? [];
  }, [s.county]);

  // hasField gating (mirror napredno-form) — uključujući `scope`, da objava ne
  // traži polje koje pretraga za tu podkategoriju uopće ne prikazuje.
  const fieldDef = (key: string) =>
    filterDef.fields.find((f) => {
      if (f.key !== key) return false;
      if (f.scope && f.scope.length > 0) {
        return s.subcategory ? f.scope.includes(s.subcategory) : false;
      }
      return true;
    });
  const hasField = (key: string) => fieldDef(key) !== undefined;
  /** Oznaka iz sheme (mehanizacija zove VIN "Broj šasije / serijski broj"). */
  const labelOf = (key: string, fallback: string) => fieldDef(key)?.label ?? fallback;

  // Spec polja koja se renderiraju u koraku 2 (schema-driven), uz scope filtriranje.
  const specFields = useMemo(
    () => filterDef.fields.filter((f) => {
      if (SKIP_KEYS.has(f.key)) return false;
      // Polja koja postoje samo kao filter pretrage (npr. "Prikaz oštećenih")
      // nemaju smisla u objavi — prodavač ne bira hoće li se oglas prikazivati.
      if (f.searchOnly) return false;
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
      attributes: { ...STATE_DEFAULTS },
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

  /**
   * Što još nedostaje na trenutnom koraku — JEDAN izvor istine.
   *
   * ⚠️ Dino 01.08.: "ne radi gumb za dalje". Gumb je RADIO ispravno (opis 16/30
   * znakova), ali NIGDJE nije pisalo zašto je siv — forma izgleda popunjeno, a
   * "Nastavi" ne reagira. Zato validacija sad vraća POPIS naziva polja koja fale,
   * a `stepValid` je izveden iz njega. Ne raditi drugu granu za poruku — razišla
   * bi se od validacije i lagala bi korisniku.
   */
  const missingFields = useMemo<string[]>(() => {
    const m: string[] = [];
    // Karlo 30.07: podkategorija je OBAVEZNA kad postoji.
    // Sva specifikacijska polja su scope-ana po podkategoriji — bez nje objava
    // prikazuje prazan korak "Specifikacije" (gospodarska 40→0 polja, slobodno
    // vrijeme 48→1), pa oglas nema podatke po kojima ga pretraga filtrira.
    if (step === 1) {
      if (!s.category) m.push("Kategorija");
      if (subcatOptions.length > 0 && !s.subcategory) m.push("Podkategorija");
      // Karlo 31.07: ako podkategorija ima 2. nivo, i on je obavezan — inače
      // prodavač preskoči izbor, `attributes.vrsta` ostane prazan i oglas se
      // NIKAD ne pojavi u toj podrubrici (isti razlog kao i za podkategoriju).
      if (childOptions.length > 0 && !s.attributes.vrsta) m.push("Vrsta artikla");
      return m;
    }
    if (step === 2) {
      if (!s.make) m.push("Marka");
      if (!s.model) m.push("Model");
      if (!s.year) m.push("Godina proizvodnje");
      if (!s.condition) m.push("Stanje");
      return m;
    }
    if (step === 3) {
      // Oznake iz SHEME — hardkodirani popis bi se razišao s `category-filters.ts`.
      for (const k of requiredSpecKeys) {
        if (!specValueFilled(k)) m.push(labelOf(k, k));
      }
      return m;
    }
    if (step === 4) {
      if (s.photos.length < 1) m.push("barem jedna fotografija");
      return m;
    }
    if (step === 5) {
      if (!s.priceEur) m.push("Cijena");
      if (s.description.trim().length < 30) {
        const left = 30 - s.description.trim().length;
        m.push(`Opis (još ${left} ${left === 1 ? "znak" : left < 5 ? "znaka" : "znakova"})`);
      }
      if (!s.county) m.push("Županija");
      if (!s.city) m.push("Grad");
      if (!s.firstName) m.push("Ime");
      if (!s.phone) m.push("Telefon");
      return m;
    }
    return m;
  }, [step, s, requiredSpecKeys, subcatOptions.length, childOptions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const stepValid = missingFields.length === 0;

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

    /**
     * ⚠️ Kvačice "Stanja vozila" → `damageState` / `engineRuns`.
     *
     * Kupčev filter "Prikaz oštećenih / u kvaru" NE ČITA nove kvačice nego
     * `isDamaged()`/`isBroken()` u lib/filter.ts, a oni gledaju baš ta dva
     * ključa. Bez ovog prevođenja oglas označen kao oštećen prošao bi kroz
     * filter "sakrij oštećene" — kvar koji se ne vidi u objavi, nego tek
     * kupcu u rezultatima.
     */
    if (attributes.damaged === true) {
      attributes.damageState = "osteceno";
    } else if (attributes.undamaged === true) {
      delete attributes.damageState;
    }
    if (attributes.broken === true || attributes.notRoadworthy === true) {
      attributes.engineRuns = attributes.broken === true ? "ne-pali" : "pali-ne-vozi";
    } else if (attributes.roadworthy === true) {
      attributes.engineRuns = "da";
    }

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
    const req = requiredSpecKeys.includes(f.key);
    const opt = !req; // sve ostalo nije obavezno

    // ── COLUMN polja (tipizirana, single-value u objavi) ──
    if (isColumn) {
      const colVal = (s[f.key as keyof State] as string) ?? "";
      const setCol = (v: string) => set(f.key as keyof State, v as never);

      if (f.key === "bodyType") {
        return (
          <BodyTypePicker
            key={f.key}
            label={f.label}
            required={req}
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
            required={req}
            values={colVal ? [colVal] : []}
            onChange={(vals) => setCol(vals.length ? vals[vals.length - 1] : "")}
            options={(f.options ?? []).map((o) => o.label)}
          />
        );
      }
      if (f.type === "range") {
        // km/powerKw/engineCc → RUČNI brojčani unos (precizno), ne dropdown sa steps.
        return (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            required={req}
            value={colVal}
            onChange={setCol}
            placeholder={f.key === "km" ? "npr. 95000" : f.key === "powerKw" ? "npr. 110" : "npr. 1968"}
          />
        );
      }
      // multi/select column (fuel/transmission/drive/doors/seats) → single SelectField
      return (
        <SelectField
          key={f.key}
          label={f.label}
          required={req}
          value={colVal}
          onChange={setCol}
          placeholder="Odaberi"
          options={f.options ?? []}
        />
      );
    }

    // ── ATTR polja (jsonb) ──
    if (f.type === "toggle") {
      // Kvačice iz "Stanja vozila" idu kroz toggleSellerState (parovi se gase).
      const paired = f.group === "Stanje vozila";
      return (
        <TogglePill
          key={f.key}
          on={Boolean(s.attributes[f.key])}
          onClick={() =>
            paired
              ? toggleSellerState(f.key, !s.attributes[f.key])
              : setAttr(f.key, !s.attributes[f.key])
          }
          label={f.label}
        />
      );
    }
    if (f.type === "range") {
      // attr range (radni sati, težina, nosivost, dimenzije...) → RUČNI brojčani unos.
      return (
        <NumberField
          key={f.key}
          label={f.label}
          unit={f.unit}
          required={req}
          value={(s.attributes[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)}
          placeholder="Upiši broj"
        />
      );
    }
    if (f.type === "select") {
      return (
        <SelectField
          key={f.key}
          label={f.label}
          required={req}
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
          required={req}
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
      <div key={g.name} className="space-y-3.5">
        <SectionHead>{g.name}</SectionHead>
        <div className={allBodyOrColor ? "space-y-4" : (allToggle ? "grid sm:grid-cols-2 gap-2.5" : "grid sm:grid-cols-2 gap-3 sm:gap-4")}>
          {g.fields.map(renderSpecField)}
        </div>
      </div>
    );
  };

  return (
    <>
      <ol className="mt-8 grid grid-cols-6 gap-2">
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

      {/* Dino 02.08.: "nisam znao koliko i što treba biti."
          Sažetak stoji na VRHU koraka — vidi se prije skrolanja, ne tek kod gumba.
          Pojavljuje se tek nakon prvog pokušaja "Nastavi" ili prvog unosa, da ne
          viče na korisnika prije nego je išta stigao upisati. */}
      {missingFields.length > 0 && showMissing && (
        <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3">
          <AlertCircle className="size-4 text-[var(--color-danger)] shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-[var(--color-danger)]">
              Još {missingFields.length} {missingFields.length === 1 ? "podatak" : missingFields.length < 5 ? "podatka" : "podataka"} za nastavak
            </div>
            <div className="text-[var(--color-ink-soft)] mt-0.5">{missingFields.join(" · ")}</div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6 md:p-8 animate-fade-in" key={step}>
        {step === 1 && (
          <div className="space-y-8">
            <FormHeader title="Što prodaješ?" desc="Odaberi kategoriju oglasa" />
            <CategoryCards categories={CATEGORIES} value={s.category} onChange={changeCategory} />
            {subcatOptions.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                  Podkategorija
                </div>
                <SubcategoryButtons
                  options={subcatOptions}
                  value={s.subcategory}
                  onChange={(v) => {
                    set("subcategory", v);
                    // promjena podkategorije poništava izbor 2. nivoa
                    setAttr("vrsta", undefined);
                  }}
                />
              </div>
            )}

            {/* 2. nivo — samo za podkategorije koje ga imaju. Sprema se u
                `attributes.vrsta`, isti ključ po kojem pretraga filtrira. */}
            {childOptions.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                  Vrsta artikla
                </div>
                <SubcategoryButtons
                  options={childOptions}
                  value={(s.attributes.vrsta as string) ?? ""}
                  onChange={(v) => setAttr("vrsta", v || undefined)}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <FormHeader title="Osnovno" desc="Marka, model i godina" />
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
                /* Karlo 31.07: "(opcionalno)" nije govorilo ČEMU polje služi.
                   Vrijednost završava u naslovu oglasa (buildListing slaže
                   marka + model + izvedba), pa oznaka to sad i kaže. */
                label="Izvedba (tekst u naslovu oglasa)"
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
              {/* Karlo 31.07: prva registracija ide ODMAH ISPOD godine proizvodnje —
                  mjesec iz padajućeg, godina ručno. */}
              {hasField("firstRegistration") && (
                <MonthYearField
                  label={labelOf("firstRegistration", "Prva registracija")}
                  optional
                  value={(s.attributes.firstRegistration as string) ?? ""}
                  onChange={(v) => setAttr("firstRegistration", v)}
                />
              )}
              {hasField("roadworthyUntil") && (
                <MonthYearField
                  label={labelOf("roadworthyUntil", "Tehnički vrijedi do")}
                  optional
                  value={(s.attributes.roadworthyUntil as string) ?? ""}
                  onChange={(v) => setAttr("roadworthyUntil", v)}
                  /* Tehnički se izdaje unaprijed, ne unatrag — nema smisla nuditi
                     1950. Donja granica je prošla godina (zaostali/istekli tehnički). */
                  minYear={new Date().getFullYear() - 1}
                />
              )}
              {hasField("vin") && (
                <TextField
                  label={labelOf("vin", "Broj šasije (VIN)")}
                  optional
                  value={(s.attributes.vin as string) ?? ""}
                  onChange={(v) => setAttr("vin", v.toUpperCase().slice(0, 17) || undefined)}
                  placeholder="npr. WVWZZZ1KZAW123456"
                />
              )}
            </div>
            <Field label="Stanje">
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => set("condition", c)}
                    className={"h-11 rounded-xl border text-sm transition-all " + (s.condition === c ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            <FormHeader title="Specifikacije" desc={`Tehnički podaci za: ${categoryDef?.name ?? s.category}`} />
            {specGroups.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Za ovu kategoriju nema dodatnih specifikacija. Nastavi dalje.</p>
            ) : (
              <div className="space-y-7">
                {specGroups.map(renderSpecGroup)}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <FormHeader title="Fotografije" desc="Prva slika je naslovna - odaberi najljepši kut" />
            <PhotoUploader photos={s.photos} onChange={(p) => set("photos", p)} />
            <div className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] rounded-md p-3 leading-relaxed">
              <strong className="text-[var(--color-ink)]">Savjet:</strong> kvalitetne fotografije pri dnevnom svjetlu povećavaju šansu prodaje. Slikaj iz svih kutova - prednja strana, bok, stražnja, interijer, prtljažnik, kotači. Izbjegavaj filtere.
            </div>
          </div>
        )}

        {step === 5 && (
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
              {/* Bilo sivo kao i svaki drugi savjet → nije se čitalo kao razlog
                  zašto je "Nastavi" siv. Sad crveno + koliko točno fali. */}
              {s.description.trim().length < 30 && (
                <div className="text-xs text-[var(--color-danger)] mt-1">
                  Opis mora imati barem 30 znakova — još {30 - s.description.trim().length}.
                </div>
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

        {step === 6 && (
          <div className="space-y-5">
            <FormHeader title="Pregled prije objave" desc="Provjeri sve podatke" icon={<Sparkles className="size-5" />} />
            <ReviewPreview
              state={s}
              makeLabel={makeOptions.find((m) => m.value === s.make)?.label ?? s.make}
              categoryLabel={categoryDef?.name ?? s.category}
              subcategoryLabel={subcatOptions.find((sc) => sc.value === s.subcategory)?.label ?? ""}
              filterDef={filterDef}
            />
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
            <div className="flex flex-col items-end gap-2">
              {/* Sivi gumb bez objašnjenja = korisnik misli da je forma pokvarena.
                  Popis dolazi iz `missingFields` — iste logike koja gasi gumb. */}
              {missingFields.length > 0 && (
                <span className="text-xs text-[var(--color-ink-soft)] text-right max-w-xs">
                  Za nastavak popuni:{" "}
                  <span className="text-[var(--color-danger)] font-medium">
                    {missingFields.join(", ")}
                  </span>
                </span>
              )}
              {/* Onemogućen gumb NE prima klik → korisnik klikne i ništa se ne
                  dogodi. Omotač hvata klik i pokazuje sažetak na vrhu. */}
              <span
                onClick={() => {
                  if (!stepValid) {
                    setShowMissing(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowMissing(false);
                    setStep((p) => p + 1);
                  }}
                  disabled={!stepValid}
                >
                  Nastavi
                  <ChevronRight className="size-4" />
                </Button>
              </span>
            </div>
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

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
      <span className="text-[13px] uppercase tracking-widest font-semibold text-[var(--color-ink-soft)]">
        {children}
      </span>
      <span className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}

/**
 * ⚠️⚠️ ZAŠTO SE SLIKA SMANJUJE U PREGLEDNIKU (Dino 02.08.: "mali oglasi prolaze,
 * veliki ne").
 *
 * Fotografije se spremaju kao **base64 data-URL** u sam zapis oglasa. Server
 * action u Nextu ima **zadani limit tijela od 1 MB**, a base64 još napuhne
 * datoteku za ~33 %. Sučelje je pisalo "max 10 MB svaka" × 10 slika = do 100 MB
 * kroz kanal od 1 MB → objava tiho padne. Karlov oglas `lst-1235` ima jednu
 * sliku od 839 KB (zapis 860 KB) — prošao je za dlaku; sve veće nisu.
 *
 * Zato svaku sliku prije slanja skaliramo na max 1600 px i JPEG q=0.82, pa
 * po potrebi stišćemo dalje dok ne stane u ciljanu težinu. Time i stranica
 * oglasa postaje bitno lakša.
 */
const MAX_EDGE = 1600;
const TARGET_BYTES = 700 * 1024; // ~700 KB po slici nakon base64

async function compressImage(file: File): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("čitanje datoteke nije uspjelo"));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("slika se ne može otvoriti"));
    i.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // bez canvasa radije šaljemo original nego ništa
  ctx.drawImage(img, 0, 0, w, h);

  let q = 0.82;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length > TARGET_BYTES && q > 0.4) {
    q -= 0.12;
    out = canvas.toDataURL("image/jpeg", q);
  }
  // Ako je original (npr. mali PNG) ipak lakši, zadrži njega.
  return out.length < dataUrl.length ? out : dataUrl;
}

function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setPhotoErr(null);
    setBusy(true);
    const remaining = Math.max(0, 10 - photos.length);
    const all = Array.from(files);
    const arr = all.slice(0, remaining);
    const odbijeno: string[] = [];
    if (all.length > remaining) {
      odbijeno.push(`primljeno prvih ${remaining} — najviše je 10 fotografija`);
    }

    const next = [...photos];
    for (const file of arr) {
      try {
        next.push(await compressImage(file));
      } catch {
        odbijeno.push(`"${file.name}" nije slika koju možemo obraditi`);
      }
    }
    onChange(next);
    setPhotoErr(odbijeno.length ? odbijeno.join(" · ") : null);
    setBusy(false);
  };

  const removeAt = (i: number) => onChange(photos.filter((_, idx) => idx !== i));
  const makeMain = (i: number) => {
    if (i === 0) return;
    const next = [...photos];
    const [pic] = next.splice(i, 1);
    next.unshift(pic);
    onChange(next);
  };
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [pic] = next.splice(from, 1);
    next.splice(to, 0, pic);
    onChange(next);
  };
  const [dragI, setDragI] = useState<number | null>(null);

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
          {/* Prije je pisalo "max 10 MB svaka" — netočno: takva slika nikad ne
              prođe (server action prima ~1 MB). Sad se slika smanjuje sama. */}
          {photos.length}/10 · JPG, PNG, WebP · velike fotografije smanjujemo automatski
        </div>
        {busy && <Badge variant="outline" className="mt-3 animate-pulse">Obrada fotografija...</Badge>}
      </label>
      {photoErr && (
        <div className="mt-2 text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 px-3 py-2 rounded-md">
          {photoErr}
        </div>
      )}

      {photos.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
            <GripVertical className="size-3.5 text-[var(--color-muted)]" />
            Povuci za promjenu redoslijeda · prva slika je naslovna · klikni zvjezdicu da postaviš naslovnu
          </div>
          <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {photos.map((p, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragI(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragI !== null) move(dragI, i); setDragI(null); }}
                onDragEnd={() => setDragI(null)}
                className={
                  "relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--color-line)] group cursor-grab active:cursor-grabbing border-2 transition-all " +
                  (i === 0 ? "border-[var(--color-accent)]" : "border-transparent") +
                  (dragI === i ? " opacity-50 scale-95" : "")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="w-full h-full object-cover pointer-events-none" />

                {/* Numeracija (redni broj) */}
                <span className="absolute bottom-1 left-1 size-5 rounded-full bg-black/65 text-white text-[11px] font-semibold grid place-items-center">
                  {i + 1}
                </span>

                {i === 0 ? (
                  <Badge variant="accent" className="absolute top-1 left-1 text-[10px] px-1.5 py-0">
                    Naslovna
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeMain(i)}
                    title="Postavi kao naslovnu"
                    aria-label="Postavi kao naslovnu sliku"
                    className="absolute top-1 left-1 size-6 rounded-full bg-black/55 text-white grid place-items-center hover:bg-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Star className="size-3" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-black/65 text-white grid place-items-center hover:bg-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Ukloni fotografiju"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewPreview({
  state: s, makeLabel, categoryLabel, subcategoryLabel, filterDef,
}: {
  state: State; makeLabel: string;
  categoryLabel: string; subcategoryLabel: string; filterDef: CategoryFilters;
}) {
  const price = s.priceEur ? formatPrice(Number(s.priceEur)) : "—";
  const km = s.km ? formatKm(Number(s.km)) : "—";
  const make = makeLabel || "—";
  const featureLabels = collectFeatureLabels(s.attributes);

  // Lijepi prikaz popunjenih schema-atributa: label iz sheme + čitljiva vrijednost.
  const attrRows: { k: string; v: string }[] = [];
  for (const f of filterDef.fields) {
    if (f.storage !== "attr" || f.key === "subcategory" || f.key === "adAge") continue;
    const raw = s.attributes[f.key];
    if (raw === undefined || raw === "" || raw === false) continue;
    if (Array.isArray(raw) && raw.length === 0) continue;
    const labelFor = (val: string) => f.options?.find((o) => o.value === val)?.label ?? val;
    let v: string;
    if (raw === true) v = "Da";
    else if (Array.isArray(raw)) v = raw.map(labelFor).join(", ");
    else v = labelFor(String(raw));
    attrRows.push({ k: f.label, v });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden">
      {s.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.photos[0]} alt="" className="w-full aspect-[16/9] object-cover" />
      )}
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="accent">{categoryLabel}</Badge>
          {subcategoryLabel && <Badge variant="neutral">{subcategoryLabel}</Badge>}
        </div>
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
          {s.color && <Spec k="Boja" v={s.color} />}
          {s.condition && <Spec k="Stanje" v={s.condition} />}
        </div>
        {/* Pregled je rezao na 12 atributa i 8 opreme, pa je obećavao manje nego
            što oglas stvarno ima. Pregled = ono što kupac vidi, bez skraćivanja. */}
        {attrRows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t border-[var(--color-line)]">
            {attrRows.map((r) => <Spec key={r.k} k={r.k} v={r.v} />)}
          </div>
        )}
        {s.description && (
          <p className="text-sm text-[var(--color-ink-soft)] pt-3 border-t border-[var(--color-line)] whitespace-pre-line">
            {s.description}
          </p>
        )}
        {featureLabels.length > 0 && (
          <div className="pt-3 border-t border-[var(--color-line)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Oprema ({featureLabels.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {featureLabels.map((f) => <Badge key={f} variant="neutral">{f}</Badge>)}
            </div>
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
