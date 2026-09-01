"use client";

/**
 * Napredna pretraga — jedan koherentan sustav, dinamički po kategoriji.
 *
 * Forma se gradi iz category-filters.ts (FILTER_DEFS) prema ?category=.
 * Osnovni filteri uvijek vidljivi; napredni iza "Više filtera".
 * Multi → dropdown + chips; boja → swatch+naziv; range → dva selecta/inputa.
 * Vizualni indikatori: ikona po sekciji + badge s brojem odabranog.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAKES, makeOptionsGrouped, modelOptionsFor } from "@/data/makes";
import { popularMotoSlugsFor } from "@/data/makes-moto";
import { LISTINGS } from "@/data/listings";
import { applyFilters } from "@/lib/filter";
import type { ListingFilters } from "@/lib/types";
import { getCategory, CATEGORIES, makesDbFor, makesForSub, showsModelField, freeTextModelField, freeTextMakeField } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import {
  getFilterDefs, groupFields, type FilterField, type CategoryFilters,
} from "@/data/category-filters";
import {
  Car, Gauge, Palette, ShieldCheck, Sofa, Tag, DoorOpen, ChevronRight,
  History, MapPin, Settings2, Zap, Boxes, Ruler, ListFilter, Search, RotateCcw,
  Wrench, CircleDot, Droplets, Scale, FileText,
} from "lucide-react";
import {
  MultiSelect, PillMultiSelect, BOAT_TYPE_ICON, SelectField, ColorPicker, RangeSelect, RangeInput, TogglePill, TextField, Label,
  BodyTypePicker, CategoryTabs, SubcategoryIconGrid, type Opt,
} from "@/components/napredno/controls";
import { ActiveChips, type Chip } from "@/components/napredno/active-filters";
import type { LucideIcon } from "lucide-react";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
const POWER_STEPS = [44, 55, 66, 74, 85, 96, 110, 132, 150, 184, 220, 260, 300];
const ENGINE_STEPS = [1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000];
// Karlo 27.07: moto ima vlastite ljestvice (auto ostaje nepromijenjen).
const MOTO_ENGINE_STEPS = [50, 125, 250, 350, 500, 750, 1000, 1500];
const MOTO_POWER_STEPS = [7.5, 15, 22, 30, 37, 56, 75, 93, 112];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1900 + 1 }, (_, i) => YEAR_NOW - i);
const SVI_MODELI = "Svi modeli";
// ⚠️ Karlo 30.08.2026 (st.23): Plovila — Marka slobodan upis, isti obrazac
// kao SVI_MODELI za free-text Model (kamioni/mehanizacija).
const SVE_MARKE = "Sve marke";

type AttrValue = string | string[] | boolean | undefined;

// Grupe koje su "osnovne" (uvijek vidljive). Ostalo ide iza "Više filtera".
// Karlo 30.07: "Stanje vozila"/"Stanje mehanizacije" moraju biti ODMAH vidljivi —
// odluka "prikaži oštećene?" je osnovna, ne napredna. Isto vrijedi za nosivost
// viličara. Bez ovoga bi grupe završile skrivene iza gumba "Više filtera".
const BASIC_GROUPS = new Set(["Vrsta", "Motor", "Karoserija", "Vrata i sjedala", "Cijena", "Boja", "Specifikacije", "Detalji", "Osovine i nosivost", "Nosivost, visina dizanja", "Dimenzije i upotrebljivost", "Stanje vozila", "Stanje mehanizacije"]);

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
  const [category, setCategoryState] = useState<string>(initCategory);
  // Picker glavnih kategorija SAMO na čistom /oglasi/napredno (bez ?category=).
  // Čim je kategorija određena (mehanizacija, moto, ili iz submenu-a) → bez pickera,
  // samo prilagođena polja za tu kategoriju.
  const hasUrlCategory = !!sp.get("category");
  const showCategoryPicker = !hasUrlCategory;
  const categoryDef = getCategory(category);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(category), [category]);

  // Inicijalizacija iz URL-a (panel se otvori s trenutnim filterima).
  const g = (k: string) => sp.get(k) ?? "";
  const gArr = (k: string) => (sp.get(k)?.split(",").filter(Boolean) ?? []);

  // ── Hardkodirani (tipizirani) filteri zajednički svim vozilima ──
  const [subcategory, setSubcategory] = useState(g("subcategory"));
  // Podkategorija iz URL-a = kontekst stranice (ne korisnikov chip filter).
  // ⚠️ Karlo 22.08.2026: popisi MARKI i MODELA prate `subcategory` (odabir u
  // formi — minimoto/gokart/atv imaju vlastite liste), a `contextSubcategory`
  // ostaje za scope/chipove; prije je puna moto lista stajala dok korisnik u
  // naprednoj bira Minimoto.
  const contextSubcategory = g("subcategory");
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
  // `a.offerType` je ispravan ključ (attr polje). Stari goli `offerType` čitamo kao
  // fallback da linkovi/bookmarkovi iz prije popravka i dalje rade.
  const [offerType, setOfferType] = useState<string[]>(
    gArr("a.offerType").length ? gArr("a.offerType") : gArr("offerType")
  );
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
  /** Karlo 26.08.2026: fokus na Model polju (kamioni/autobusi — slobodan upis). */
  const [modelFocus, setModelFocus] = useState(false);
  /** Karlo 30.08.2026 (st.23): fokus na Marka polju (plovila — slobodan upis). */
  const [makeFocus, setMakeFocus] = useState(false);

  const isAuto = category === "auto";
  const isMoto = category === "moto";
  const isGospodarska = category === "gospodarska";
  /** Karlo 31.08.2026 (st.26/27), prošireno 01.09.2026 (st.39): "Auto
   * dijelovi" je imao ISPRAVNA polja/ponašanje napredne pretrage (Za marku s
   * punim popisom auto marki, Stanje predmeta, grupirane "Najpopularnije
   * marke") — Karlo je tražio da se to primijeni na CIJELU kategoriju
   * Dijelovi i oprema, ne samo tu jednu podkategoriju. Ime zastavice ostaje
   * (koristi se posvuda), sad samo pokriva čitavu kategoriju umjesto jedne
   * podkategorije. */
  const isAutoDijelovi = category === "dijelovi";
  /** Karlo 31.08.2026 (st.30): "Oprema za kampere i kamping" (Slobodno
   * vrijeme) dobiva IDENTIČNU pretragu kao Auto dijelovi (Za marku, Stanje
   * predmeta, skrivena Godina) — SAMO Vrsta ostaje njena postojeća lista. */
  const isKampingOprema = category === "prosti-cas" && subcategory === "kamping-oprema";
  const usesPartsLayout = isAutoDijelovi || isKampingOprema;
  /** Karlo 31.08.2026: Dijelovi i oprema, Slobodno vrijeme, Moto, Gospodarska
   * i Mehanizacija — kad je kategorija odabrana ali podkategorija JOŠ NIJE,
   * prikaži SAMO slikoviti odabir podkategorije (ništa drugo). Nema "Sve
   * podkategorije" — mora se izabrati jedna prije nego se otvori ostatak
   * forme. */
  const usesSubPickGrid =
    category === "dijelovi" || category === "prosti-cas" || category === "moto" || category === "gospodarska" || category === "mehanizacija";
  const needsSubPick = usesSubPickGrid && !subcategory;
  /** Karlo 31.08.2026 (st.36): Slobodno vrijeme → Oprema za kampere i kamping
   * ide JOŠ jednu razinu dublje — kad je podkategorija odabrana ali "Vrsta"
   * (djeca kamping-oprema) JOŠ NIJE, prikaži SAMO slikoviti odabir Vrste
   * (isti mehanizam kao needsSubPick, jednu razinu niže). Nema "Sve vrste" —
   * mora se izabrati jedna prije nego se otvori ostatak forme. */
  const vrstaValue = attrs.vrsta;
  // `a.vrsta` iz URL-a (npr. drill-down link) stiže kao GOLI string kad nema
  // zareza (vidi parsing gore), ne kao niz — provjera mora pokriti oba oblika.
  const hasVrsta = Array.isArray(vrstaValue) ? vrstaValue.length > 0 : Boolean(vrstaValue);
  const needsVrstaPick = isKampingOprema && !hasVrsta;

  const makeOptions: Opt[] = useMemo(() => {
    // ⚠️ Karlo 12.08.2026: puni auto popis (203 marke) dobiva grupe — popularne
    // na vrhu, pa cijela abeceda. Moto/gospodarska imaju vlastite kratke
    // popise i ostaju plosnate.
    // ⚠️ Uvjetuj po KATEGORIJI, ne po `categoryDef?.makes` — auto kategorija
    // također ima `makes` (isti AUTO_MAKES), pa bi provjera postojanja uvijek
    // pala u plosnatu granu i grupe se ne bi vidjele.
    // ⚠️ Karlo 18.08.2026: ATV (moto) i UTV (gospodarska) imaju VLASTITE
    // popise marki s avto.neta — override ispred popisa kategorije.
    const list = makesForSub(category, subcategory)
      ?? categoryDef?.makes ?? MAKES.map((m) => ({ slug: m.slug, name: m.name }));
    // ⚠️ Karlo 17.08.2026: i MOTO dobiva grupe (vlastitih 10 popularnih).
    if (!category || category === "auto") return makeOptionsGrouped(list);
    // ⚠️ Karlo 17.08.2026: SKUTERI imaju vlastite popularne marke (Kymco/Piaggio/Sym),
    // razlicite od motocikala → biraj po podkategoriji.
    if (category === "moto") return makeOptionsGrouped(list, popularMotoSlugsFor(subcategory));
    // ⚠️ Karlo 01.09.2026 (st.40): Dijelovi/Moto dijelovi i oprema — spojeni
    // popis SVIH marki Mota (MOTO_DIJELOVI_MAKES), ne AUTO_MAKES. Grupa
    // "Najpopularnije" mora tražiti MOTO slugove (Honda/Yamaha/Piaggio...),
    // ne auto slugove (Audi/BMW...) — inače prazna/kriva grupa kao st.38.
    if (category === "dijelovi" && subcategory === "moto-dijelovi") return makeOptionsGrouped(list, popularMotoSlugsFor());
    // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi koristi puni auto popis
    // (isti kao Osobni auto) → i grupe kao auto, ne plosnata lista.
    // ⚠️ Karlo 01.09.2026 (st.38): SAMO auto-dijelovi — kamping-oprema od
    // ovog datuma NIJE više na AUTO_MAKES (vidi makesForSub), pa bi grupa
    // "Najpopularnije" (Audi/BMW/Citroen…) tražila auto slugove u popisu
    // kamperske opreme i vraćala krivi/prazan rezultat. usesPartsLayout i
    // dalje vrijedi za "Stanje predmeta" (obje rubrike), samo ne i ovdje.
    if (isAutoDijelovi) return makeOptionsGrouped(list);
    return list.map((m) => ({ value: m.slug, label: m.name }));
    // ⚠️ Karlo 18.08.2026: isti propust kao u filter-sidebaru — bez
    // podkategorije u ovisnostima klijentska navigacija na drugu
    // podkategoriju zadrži krivu grupu popularnih marki.
  }, [category, categoryDef, subcategory]);
  // Karlo 27.07: modeli se biraju iz baze TE kategorije (prije je uvijek gledao
  // AUTO bazu → moto/gospodarska marke nikad nisu imale modele).
  const modelOptions = useMemo(() => {
    if (!make) return [];
    // ⚠️ Karlo 12.08.2026: zadnja stavka uvijek "Modela nema na listi".
    return modelOptionsFor(
      (makesForSub(category, subcategory) ?? makesDbFor(category))
        .find((m) => m.slug === make)?.models ?? []
    );
  }, [make, category, subcategory]);

  const setAttr = (key: string, v: AttrValue) => setAttrs((a) => ({ ...a, [key]: v }));

  // Polja koja su "column" storage i NISU već pokrivena hardkodiranim kontrolama
  // renderiraju se generički; attr polja uvijek generički.
  const HANDLED_COLUMNS = new Set([
    "priceEur", "year", "km", "county", "sellerType", "condition",
    "fuel", "transmission", "powerKw", "engineCc", "bodyType", "drive", "color",
  ]);

  // Grupiraj dinamička polja, izuzmi ona koja već imamo kao hardkodirana
  // I poštuj `scope`: polje s scope-om prikaži samo za tu podkategoriju.
  const dynamicFields = useMemo(
    () => filterDef.fields.filter((f) => {
      // Karlo 09.08. (st. 9): "Garancija" iz sheme se NE renderira ovdje —
      // gornji osnovni panel već ima ručni TogglePill (isti a.warranty URL
      // ključ), pa se polje pojavljivalo dvaput. Samo prikaz; objava netaknuta.
      if (f.key === "warranty") return false;
      // ⚠️ Karlo 26.08.2026 (screenshot 22:25): "Tip ponude" se pojavljivao
      // DVAPUT — gore ručni MultiSelect ispod podkategorije + isti filtar iz
      // sheme u rubrici "Ostalo". Donji (shemski) se ne renderira; gornji radi
      // preko istog `a.offerType` ključa, pa filtriranje ostaje netaknuto.
      if (f.key === "offerType") return false;
      if (!(f.storage === "attr" || !HANDLED_COLUMNS.has(f.key))) return false;
      if (f.searchable === false) return false;
      if (f.scope && f.scope.length > 0) {
        return subcategory ? f.scope.includes(subcategory) : false;
      }
      return true;
    }),
    [filterDef, subcategory]
  );
  const dynamicGroups = useMemo(() => groupFields(dynamicFields), [dynamicFields]);
  // Grupe koje hardkodirane sekcije već pokrivaju (Motor/Karoserija/Boja/Cijena)
  // ne smiju se duplicirati gore — njihovi dodatni attr specifični filteri
  // (cilindri, takt, tip boje...) idu u "Više filtera".
  const HARDCODED_GROUPS = new Set(["Motor", "Karoserija", "Boja", "Cijena"]);
  // Karlo 27.07: grupa "Vrsta" (Vrsta vozila + Stil / Tip vozila) mora stajati
  // ODMAH ispod podkategorije, a ne iza Cijene i Motora — zato se vadi iz
  // basicDynamic i renderira zasebno u 1. panelu.
  const vrstaGroup = dynamicGroups.find((g) => g.name === "Vrsta");
  // Karlo 29.07: preostala polja grupe "Motor" idu U hardkodiranu Motor sekciju
  // (motorSection), a iz "Više filtera" se izuzimaju — inače dvije rubrike MOTOR.
  const motorRest = dynamicGroups.find((g) => g.name === "Motor")?.fields ?? [];
  // Isto za "Cijena" (PDV) i "Boja" (Tip boje) — inače nastaju duple rubrike.
  const cijenaRest = dynamicGroups.find((g) => g.name === "Cijena")?.fields ?? [];
  const bojaRest = dynamicGroups.find((g) => g.name === "Boja")?.fields ?? [];
  const basicDynamic = dynamicGroups.filter(
    (g) => !["Vrsta", "Motor", "Cijena", "Boja"].includes(g.name) &&
           BASIC_GROUPS.has(g.name) && !HARDCODED_GROUPS.has(g.name)
  );
  const advancedDynamic = dynamicGroups.filter(
    (g) => !["Motor", "Cijena", "Boja"].includes(g.name) &&
           (!BASIC_GROUPS.has(g.name) || HARDCODED_GROUPS.has(g.name))
  );

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
      // Karlo 30.07: `offerType` je `storage:"attr"`, ne kolona — bez `a.` prefiksa
      // `parseFilters` ga TIHO ODBACI i filter "Tip ponude" ne radi ništa.
      ["a.offerType", offerType], ["sellerType", sellerType],
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

  // Promjena kategorije preko pickera → resetiraj kategorija-ovisne filtere
  // (opcije marki/goriva/karoserije/atributa se razlikuju po kategoriji).
  const changeCategory = (slug: string) => {
    setCategoryState(slug);
    setSubcategory(""); setMake(""); setModel("");
    setFuel([]); setTransmission([]); setBodyType([]); setColor([]);
    setEngineMin(""); setEngineMax(""); setPowerMin(""); setPowerMax("");
    setKmMin(""); setKmMax(""); setAttrs({});
  };

  /**
   * ⚠️ Karlo 13.08.2026 (st. 4): iz gornjeg menija se biralo Auto/Osobni pa
   * Moto/Skuter — a forma je ostajala na Auto. Uzrok: stanje se čitalo iz URL-a
   * SAMO pri prvom montiranju (`useState(g(...))`), a klik u meniju vodi na
   * ISTU rutu `/oglasi/napredno` s drugim parametrima → React ne montira
   * komponentu ponovno, pa se ništa nije mijenjalo (mjereno: URL se nije ni
   * promijenio jer je Next preskočio navigaciju na identičnu rutu).
   * Sad pratimo `?category=` i `?subcategory=` iz URL-a i primjenjujemo ih.
   */
  const urlCategory = sp.get("category") ?? "";
  const urlSubcategory = sp.get("subcategory") ?? "";
  useEffect(() => {
    if (urlCategory && urlCategory !== category) {
      // ista logika kao ručna promjena: nova kategorija = čist kontekst
      changeCategory(urlCategory);
      setSubcategory(urlSubcategory);
    } else if (urlSubcategory !== subcategory && urlCategory === category) {
      setSubcategory(urlSubcategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, urlSubcategory]);

  // hasField: prikaži hardkodiranu sekciju samo ako kategorija ima to polje.
  // Karlo 27.07: mora poštovati `scope` kao i dynamicFields — inače polje koje
  // je scope-om izbačeno iz podkategorije (npr. Obujam kod kamiona) i dalje
  // visi u hardkodiranoj sekciji "Motor i karoserija".
  const hasField = (key: string) =>
    filterDef.fields.some((f) => {
      if (f.key !== key) return false;
      if (f.scope && f.scope.length > 0) {
        return subcategory ? f.scope.includes(subcategory) : false;
      }
      return true;
    });

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
    // Podkategorija je chip SAMO ako ju je korisnik promijenio (ne kontekst stranice iz URL-a).
    if (subcategory && subcategory !== contextSubcategory) {
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
  }, [subcategory, contextSubcategory, categoryDef, offerType, condition, make, makeOptions, model, isAuto, q,
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
      // Polja s fiksnom ljestvicom (`steps`) dobivaju Od/Do izbornik umjesto
      // dva slobodna brojčana polja — isti pattern kao Cijena/Kilometraža.
      if (f.steps && f.steps.length > 0) {
        const raw = (attrs[f.key] as string | undefined) ?? "";
        const [lo, hi] = raw.includes("..") ? raw.split("..") : ["", ""];
        const setRange = (min: string, max: string) =>
          setAttr(f.key, min || max ? `${min}..${max}` : undefined);
        return (
          <RangeSelect
            key={f.key}
            label={f.label}
            unit={f.unit}
            minValue={lo}
            maxValue={hi}
            onMin={(v) => setRange(v, hi)}
            onMax={(v) => setRange(lo, v)}
            steps={f.steps}
            maxOnly={f.maxOnly}
          />
        );
      }
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
          {...(f.placeholder ? { placeholder: f.placeholder } : {})}
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
    // ⚠️ Karlo 30.08.2026 (st.22a): "Tip plovila" nacrtan kao izbor (svih 5
    // opcija odmah vidljivo), ne padajući izbornik iza klika.
    if (f.key === "boatType") {
      return (
        <PillMultiSelect
          key={f.key}
          label={f.label}
          values={(attrs[f.key] as string[] | undefined) ?? []}
          onChange={(v) => setAttr(f.key, v)}
          options={f.options ?? []}
          iconFor={(v) => BOAT_TYPE_ICON[v]}
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
      // Karlo st. 15: crta između rubrika unutar istog panela ("Više filtera"
      // slaže OPREMU/POVIJEST/SPECIFIKACIJE bez ikakve podjele). `first:` je
      // gasi kad je rubrika prvi element panela; s panelovim space-y-4 linija
      // stoji simetrično (16px razmaka iznad i ispod).
      <div key={g.name} className="space-y-3 border-t border-[var(--color-line)] pt-4 first:border-t-0 first:pt-0">
        <SectionHead icon={GIcon} title={g.name} />
        <div className="grid sm:grid-cols-2 gap-3">
          {g.fields.map(renderField)}
        </div>
      </div>
    );
  };

  /**
   * Karlo 29.07: Motor+karoserija izdvojen u varijablu jer se kod GOSPODARSKE
   * renderira IZNAD cijene (Oblik karoserije je tamo prvi kriterij izbora),
   * a kod ostalih kategorija ostaje na starom mjestu ispod cijene.
   */
  const bodyPicker = hasField("bodyType") ? (
    <BodyTypePicker label="Oblik karoserije" values={bodyType} onChange={setBodyType}
      options={bodyOpts(filterDef, contextSubcategory)} cols={3} />
  ) : null;

  const motorSection =
    // ⚠️ Karlo 31.08.2026: Plovila je izgubio cijelu Motor rubriku kad je
    // powerKw maknut (st.26) — panel se gasio na hasField("powerKw") i sl.,
    // ne znajući da generička "Motor" polja (Broj motora, Snaga HP, Radni
    // sati) i dalje postoje i idu u isti panel preko motorRest niže.
    hasField("engineCc") || hasField("powerKw") || hasField("fuel") || hasField("bodyType") || motorRest.length > 0 ? (
      <Panel>
        <SectionHead icon={Gauge} title={hasField("bodyType") ? "Motor i karoserija" : "Motor"} />
        {isGospodarska && bodyPicker}
        {(hasField("engineCc") || hasField("powerKw")) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {hasField("engineCc") && (
              <RangeSelect label="Obujam (cm³)" unit="cm³" minValue={engineMin} maxValue={engineMax} onMin={setEngineMin} onMax={setEngineMax} steps={isMoto ? MOTO_ENGINE_STEPS : ENGINE_STEPS} />
            )}
            {hasField("powerKw") && (
              <RangeSelect label="Snaga (kW)" unit="kW" minValue={powerMin} maxValue={powerMax} onMin={setPowerMin} onMax={setPowerMax} steps={isMoto ? MOTO_POWER_STEPS : POWER_STEPS} />
            )}
          </div>
        )}
        {(hasField("fuel") || hasField("transmission")) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {hasField("fuel") && (
              <MultiSelect label={fuelLabel(filterDef, contextSubcategory)} values={fuel} onChange={setFuel}
                options={fuelOpts(filterDef, contextSubcategory)} placeholder="Sve" />
            )}
            {hasField("transmission") && (
              <MultiSelect label="Mjenjač" values={transmission} onChange={setTransmission}
                options={transmissionOpts(filterDef, contextSubcategory)} placeholder="Sve" />
            )}
          </div>
        )}
        {!isGospodarska && bodyPicker}
        {/* Preostala Motor polja (Cilindri, Takt, Prijenos) — prije su išla u
            "Više filtera" pod istim naslovom, pa je MOTOR bio dvaput. */}
        {motorRest.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">{motorRest.map(renderField)}</div>
        )}
      </Panel>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-7 pb-28">
      {/* Izbornik glavnih kategorija SAMO na čistom /oglasi/napredno (bez ?category=) */}
      {showCategoryPicker && (
        <CategoryTabs categories={CATEGORIES} value={category} onChange={changeCategory} />
      )}

      {/* Kontekst kategorije + "Svi oglasi" izlaz (kad je kategorija određena) */}
      {hasUrlCategory && categoryDef && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-soft)]">
            <span className="grid place-items-center size-7 rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent-dark)]">
              <Search className="size-4" />
            </span>
            Pretraga: {categoryDef.name}
            {subcategory && (
              <span className="text-[var(--color-muted)]">
                · {categoryDef.subcategories.find((sc) => sc.slug === subcategory)?.name ?? subcategory}
              </span>
            )}
          </span>
          <a
            href={subcategory ? `/oglasi?category=${category}&subcategory=${subcategory}` : `/oglasi?category=${category}`}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Svi oglasi
            <ChevronRight className="size-4" />
          </a>
        </div>
      )}

      {/* ⚠️ Karlo 31.08.2026: Dijelovi i oprema I Slobodno vrijeme — dok
          podkategorija nije odabrana, prikaži SAMO slikoviti odabir (ništa
          drugo iz forme). Nema "Sve podkategorije" — jedna se MORA izabrati.
          Tek nakon odabira otvara se ostatak forme, kao i za sve druge
          kategorije. */}
      {needsSubPick && categoryDef && (
        <Panel>
          <SectionHead icon={ListFilter} title="Podkategorija" />
          <SubcategoryIconGrid
            options={categoryDef.subcategories.map((s) => ({ value: s.slug, label: s.name, icon: s.icon }))}
            value={subcategory}
            onChange={(v) => {
              setSubcategory(v);
              const list = makesForSub(category, v) ?? categoryDef?.makes ?? [];
              if (make && !list.some((m) => m.slug === make)) { setMake(""); setModel(""); }
            }}
          />
        </Panel>
      )}

      {/* ⚠️ Karlo 31.08.2026 (st.36): Oprema za kampere i kamping — jednu
          razinu ispod podkategorije, isti mehanizam za "Vrsta" (djeca
          kamping-oprema). Nema "Sve vrste" — jedna se MORA izabrati prije
          nego se otvori ostatak forme. */}
      {!needsSubPick && needsVrstaPick && vrstaGroup && (
        <Panel>
          <SectionHead icon={ListFilter} title="Vrsta" />
          <SubcategoryIconGrid
            options={(vrstaGroup.fields[0]?.options ?? []).map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
            value={Array.isArray(vrstaValue) ? (vrstaValue[0] ?? "") : (vrstaValue as string | undefined) ?? ""}
            onChange={(v) => setAttr("vrsta", [v])}
          />
        </Panel>
      )}

      {!needsSubPick && !needsVrstaPick && (
      <>
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
            onChange={(v) => {
              setSubcategory(v);
              // Nova podkategorija može imati DRUGI popis marki (minimoto,
              // go-kart, ATV…) — marka koje u njemu nema mora van, inače
              // ostane nevidljiv filtar koji pretrazi vraća 0 rezultata.
              const list = makesForSub(category, v) ?? categoryDef?.makes ?? [];
              if (make && !list.some((m) => m.slug === make)) { setMake(""); setModel(""); }
            }}
            options={categoryDef.subcategories
              .map((s) => ({ value: s.slug, label: s.name }))}
            placeholder="Sve podkategorije"
          />
        )}
        {/* Karlo 27.07: "Stil" (moto) / "Tip vozila" (kamioni) ide ODMAH ispod
            podkategorije — grupa "Vrsta" renderirana ovdje, ne dolje uz Boje.
            ⚠️ Karlo 31.08.2026 (st.36): kamping-oprema svoju "Vrsta" već bira
            kroz slikoviti gate iznad (needsVrstaPick) — ovdje bi se ponovila
            kao multi-select checkbox lista, pa se za nju preskače. */}
        {vrstaGroup && !isKampingOprema && renderDynGroup(vrstaGroup)}
        {/* ⚠️ Karlo 01.09.2026 (st.37): kamping-oprema — kad je Vrsta već
            odabrana kroz slikoviti gate, korisnik unutar forme nije imao
            NIKAKAV vidljivi trag koju je Vrstu odabrao ni način da je
            promijeni. Dropdown, ista vizualna razina kao "Podkategorija"
            odmah iznad — isti sub.children popis (bez ikona, kao i sve
            druge SelectField opcije), stvarna vrijednost i dalje ostaje
            attrs.vrsta (niz s 1 elementom, isti ključ kao gate). */}
        {isKampingOprema && vrstaGroup && (
          <SelectField
            label="Vrsta"
            value={Array.isArray(vrstaValue) ? (vrstaValue[0] ?? "") : (vrstaValue as string | undefined) ?? ""}
            onChange={(v) => setAttr("vrsta", v ? [v] : undefined)}
            options={(vrstaGroup.fields[0]?.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Sve vrste"
          />
        )}
        {/* Tip ponude + Stanje vozila ODMAH ispod Podkategorije */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* ⚠️ Karlo 26.08.2026: "Tip ponude" je RUČNI MultiSelect (izvan sheme),
              pa mora sam poštovati `scope` — inače ostane vidljiv i ondje gdje je
              polje maknuto (mobilne kućice, moduli za kamper). Isto kao Garancija. */}
          {filterDef.fields.some((f) => f.key === "offerType" && (!f.scope?.length || f.scope.includes(subcategory))) && (
            <MultiSelect label="Tip ponude" values={offerType} onChange={setOfferType}
              options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
          )}
          {/* ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi — "Stanje vozila" →
              "Stanje predmeta" (Novo/Polovno/Obnovljeno umjesto Rabljeno/Novo).
              Svugdje drugdje ostaje nepromijenjeno. */}
          {usesPartsLayout ? (
            <MultiSelect label="Stanje predmeta" values={condition} onChange={setCondition}
              options={[{ value: "Novo", label: "Novo" }, { value: "Polovno", label: "Polovno" }, { value: "Obnovljeno", label: "Obnovljeno" }]} placeholder="Sve" />
          ) : (
            <MultiSelect label="Stanje vozila" values={condition} onChange={setCondition}
              options={[{ value: "Rabljeno", label: "Rabljeno" }, { value: "Novo", label: "Novo" }]} placeholder="Sve" />
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* ⚠️ Karlo 30.08.2026 (st.23): Plovila — Marka slobodan upis, bez
              ponuđenog fiksnog popisa (isti obrazac kao free-text Model). */}
          {freeTextMakeField(category, subcategory) ? (
            <TextField
              label="Marka"
              value={!makeFocus && !make ? SVE_MARKE : make}
              onChange={(v) => { const nv = v === SVE_MARKE ? "" : v; setMake(nv); setModel(""); }}
              onFocus={() => setMakeFocus(true)}
              onBlur={() => setMakeFocus(false)}
              placeholder="npr. Jeanneau, Bavaria..."
            />
          ) : (
            <SelectField
              // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi — "Marka" → "Za marku"
              // (pojašnjava da bira marku VOZILA kojem dio odgovara, ne
              // proizvođača dijela).
              label={usesPartsLayout ? "Za marku" : "Marka"}
              value={make} onChange={(v) => { setMake(v); setModel(""); }} options={makeOptions} placeholder="Sve marke" />
          )}
          {/* ⚠️ Karlo 26.08.2026: kamioni — slobodan upis modela (prazno = svi). */}
          {!showsModelField(category, subcategory) ? null : (modelOptions.length > 0 && !freeTextModelField(category, subcategory)) ? (
            <SelectField label="Model" value={model} onChange={setModel} options={modelOptions} placeholder="Svi modeli" />
          ) : (
            <TextField
              label="Model"
              /* ⚠️ Karlo 26.08.2026: kod kamiona/autobusa u polju PIŠE "Svi
                 modeli" dok se ne klikne (prava vrijednost, ne placeholder). */
              value={freeTextModelField(category, subcategory) && !modelFocus && !model ? SVI_MODELI : model}
              onChange={(v) => setModel(v === SVI_MODELI ? "" : v)}
              onFocus={() => setModelFocus(true)}
              onBlur={() => setModelFocus(false)}
              placeholder={make ? "npr. Golf, A4, X3..." : SVI_MODELI}
            />
          )}
        </div>
        {isAuto && (
          <TextField label="TIP" value={q} onChange={setQ} placeholder="npr. GTI, Avant, Quattro, M Sport..." />
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <TogglePill on={showWithoutPrice} onClick={() => setShowWithoutPrice((s) => !s)} label="Prikaži oglase bez cijene" />
          {/* ⚠️ Karlo 26.08.2026: mobilne kućice nemaju Garanciju — gumb je ručni
              (izvan sheme), pa ga se mora ovdje uvjetovati, inače ostane vidljiv
              iako je polje maknuto iz `PROSTI_CAS_FIELDS`. */}
          {filterDef.fields.some((f) => f.key === "warranty" && (!f.scope?.length || f.scope.includes(subcategory))) && (
            <TogglePill on={warranty} onClick={() => setWarranty((s) => !s)} label="Garancija" />
          )}
        </div>
      </Panel>

      {/* Karlo 29.07: kod GOSPODARSKE Motor i karoserija stoji IZNAD cijene. */}
      {isGospodarska && motorSection}

      {/* ── 2. CIJENA, GODINA (+ km samo ako kategorija koristi km) ── */}
      <Panel>
        {/* ⚠️ Karlo 31.08.2026 (st.27): Auto dijelovi — "Godina" maknuta (dio
            nema godinu proizvodnje kao vozilo), pa naslov postaje "Cijena". */}
        <SectionHead icon={Tag} title={usesPartsLayout ? "Cijena" : hasField("km") ? "Cijena, godina, kilometraža" : "Cijena i godina"} />
        <RangeSelect label="Cijena (€)" unit="€" minValue={priceMin} maxValue={priceMax} onMin={setPriceMin} onMax={setPriceMax} steps={PRICE_STEPS} />
        <div className="grid sm:grid-cols-2 gap-3">
          {!usesPartsLayout && (
            <div>
              <Label>Godina</Label>
              <div className="grid grid-cols-2 gap-2">
                <SelectField value={yearMin} onChange={setYearMin} placeholder="Od" options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
                <SelectField value={yearMax} onChange={setYearMax} placeholder="Do" options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
              </div>
            </div>
          )}
          {hasField("km") && (
            <RangeSelect label="Kilometraža" unit="km" minValue={kmMin} maxValue={kmMax} onMin={setKmMin} onMax={setKmMax} steps={KM_STEPS} />
          )}
        </div>
        {/* Karlo 29.07: polja grupe "Cijena" (PDV) idu OVDJE — prije su pravila
            zasebnu rubriku "CIJENA" ispod, uz već postojeću "CIJENA, GODINA…". */}
        {cijenaRest.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">{cijenaRest.map(renderField)}</div>
        )}
      </Panel>

      {/* ── 3. MOTOR + KAROSERIJA — kod gospodarske je renderirana IZNAD cijene ── */}
      {!isGospodarska && motorSection}

      {/* ── 5. Osnovne dinamičke grupe (Vrata i sjedala, PDV, Stil...) — IZNAD Boje ── */}
      {basicDynamic.length > 0 && (
        <Panel>{basicDynamic.map(renderDynGroup)}</Panel>
      )}

      {/* ── 5. BOJE (samo ako kategorija ima boju — npr. ne za dijelove/mehanizaciju) ── */}
      {hasField("color") && (
        <Panel>
          <SectionHead icon={Palette} title="Boje" />
          <ColorPicker label="Boja vozila" values={color} onChange={setColor} options={colorOpts(filterDef, contextSubcategory)} />
          {/* Karlo 31.07: "Tip boje" i "Boja tapacirunga" bili su OVDJE hardkodirani,
              pa ih je vidjela samo napredna pretraga — prodavač ih nije mogao
              upisati. Sada su prava polja sheme (group "Boja" / "Vrata i sjedala")
              i renderiraju se dinamički kao i sva ostala; hardkodirani duplikat
              je uklonjen da se ne prikažu dvaput. */}
          {/* Preostala Boja polja (npr. "Tip boje") idu ovdje, ne kao zasebna rubrika.
              ⚠️ Prije je ovo bilo `!isAuto` jer je AUTO imao hardkodirani "Tip boje";
              otkad je on pravo polje sheme, uvjet `!isAuto` bi ga za AUTO — jedinu
              kategoriju koja ga ima — potpuno sakrio. */}
          {bojaRest.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">{bojaRest.map(renderField)}</div>
          )}
        </Panel>
      )}

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
      </>
      )}

      {/* ── Sticky CTA — skriven dok Dijelovi čeka odabir podkategorije
          (nema smisla "Prikaži N" bez podkategorije za tu kategoriju), i
          dok kamping-oprema čeka odabir Vrste (st.36). ── */}
      {!needsSubPick && !needsVrstaPick && (
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
      )}
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
/**
 * ⚠️ Karlo 17.08.2026: ove funkcije su uzimale PRVO polje s tim ključem u
 * kategoriji, BEZ obzira na podkategoriju. U gospodarskoj postoje dva `fuel`
 * zapisa — kamionsko "Gorivo" (prvo) i UTV "Pogon" (drugo, scope ["utv"]) — pa
 * je UTV uvijek dobivao kamionsku oznaku i 8 boja umjesto ATV-ovih 9.
 * Isti problem za color/bodyType/transmission.
 * Zato biramo polje koje ODGOVARA podkategoriji, s fallbackom na ono bez scope-a.
 */
function poljeZa(def: CategoryFilters, key: string, sub: string) {
  const kand = def.fields.filter((x) => x.key === key);
  return kand.find((x) => x.scope?.length && sub && x.scope.includes(sub))
      ?? kand.find((x) => !x.scope?.length)
      ?? kand[0];
}
function optsFromField(def: CategoryFilters, key: string, fallback: Opt[], sub = ""): Opt[] {
  return poljeZa(def, key, sub)?.options ?? fallback;
}
function fuelOpts(def: CategoryFilters, sub = ""): Opt[] {
  return optsFromField(def, "fuel", ["Benzin", "Dizel", "Hibrid", "Električni", "Plin"].map((v) => ({ value: v, label: v })), sub);
}
// Naziv polja goriva (moto/mehanizacija/UTV ga zovu "Pogon").
function fuelLabel(def: CategoryFilters, sub = ""): string {
  return poljeZa(def, "fuel", sub)?.label ?? "Vrsta goriva";
}
function transmissionOpts(def: CategoryFilters, sub = ""): Opt[] {
  return optsFromField(def, "transmission", [{ value: "Ručni", label: "Ručni" }, { value: "Automatski", label: "Automatski" }], sub);
}
function bodyOpts(def: CategoryFilters, sub = ""): Opt[] {
  return optsFromField(def, "bodyType",
    ["Microcar", "Limuzina", "Hatchback", "Karavan", "Monovolumen", "SUV", "Coupe", "Cabrio", "Pickup"].map((v) => ({ value: v, label: v })), sub);
}
function colorOpts(def: CategoryFilters, sub = ""): string[] {
  const f = poljeZa(def, "color", sub);
  return f?.options?.map((o) => o.label) ?? ["Crna", "Bijela", "Siva", "Srebrna", "Plava", "Crvena", "Zelena", "Smeđa", "Žuta", "Narančasta"];
}
