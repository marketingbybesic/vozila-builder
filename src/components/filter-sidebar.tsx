"use client";

/**
 * Sidebar filter (/oglasi) — uski jednostupčani layout, uniformni dropdownovi.
 * Osnovni filteri + "Više filtera" (otvara full-screen napredna panel).
 * Live: svaka promjena odmah ažurira URL (scroll:false).
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, COLORS, CONDITIONS, SELLER_TYPES,
} from "@/lib/types";
import { MAKES, makeOptionsGrouped, modelOptionsFor } from "@/data/makes";
import { popularMotoSlugsFor } from "@/data/makes-moto";
import { getCategory, makesDbFor, makesForSub, showsModelField, freeTextModelField, freeTextMakeField } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import { getFilterDefs, filterDynamicFields, extractStructuredGroups, type CategoryFilters, type FilterField } from "@/data/category-filters";
import {
  MultiSelect, PillMultiSelect, BOAT_TYPE_ICON, SelectField, TextField, TogglePill, ColorPicker, RangeSelect, RangeInput, BodyTypePicker, type Opt,
} from "@/components/napredno/controls";
import { FilterPanel } from "@/components/napredno/filter-panel";
import { SlidersHorizontal, X } from "lucide-react";
import {
  isAutoDijeloviLayout, isTireFullFormVrsta, isUljaMazivaLikeVrsta,
  makeListForVrsta, makeListIsFlatForVrsta, makeLabelForVrsta,
  makeIsFreeTextForVrsta, makeFreeTextPlaceholderForVrsta,
  modelHiddenForVrsta,
  usesDenseCijenaSteps,
} from "@/lib/dijelovi-vrsta";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
// ⚠️ Karlo 09.09.2026 (st.108-nastavak): ista gušća ljestvica kao napredno-form.tsx
// (st.57/105) — Dijelovi/Multimedija i Gume i felge, sad i sidebar ima paritet.
const MULTIMEDIJA_PRICE_STEPS = [
  25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500,
  600, 700, 800, 900, 1000,
  1500, 2000, 2500, 3000,
];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
// ⚠️ Karlo 09.09.2026: "Obujam (cm³)"/"Snaga (kW)" — hardkodirana polja u
// napredno-form.tsx Motor sekciji (motorSection), nikad nisu postojala u
// bočnom filteru (nisu dio dynamicFields/basicDynamic/advancedDynamic
// mašinerije). Isti step-ljestvice kao napredna pretraga.
const POWER_STEPS = [44, 55, 66, 74, 85, 96, 110, 132, 150, 184, 220, 260, 300];
const ENGINE_STEPS = [1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 5000];
const MOTO_ENGINE_STEPS = [50, 125, 250, 350, 500, 750, 1000, 1500];
const MOTO_POWER_STEPS = [7.5, 15, 22, 30, 37, 56, 75, 93, 112];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1990 + 1 }, (_, i) => YEAR_NOW - i);

const SVI_MODELI = "Svi modeli";
const SVE_MARKE = "Sve marke";

const toOpts = (arr: readonly string[]): Opt[] => arr.map((v) => ({ value: v, label: v }));

type Props = {
  mobile?: boolean;
  onClose?: () => void;
  /**
   * `compact` = bočni stupac na desktopu (Karlo 05.08.2026), uski jednostupčani
   * layout umjesto punog dvostupčanog panela. ⚠️ Karlo 09.09.2026: NIJE više
   * "uži skup polja iza klika" — bočni stupac uvijek prikazuje SVE filtere,
   * identično naprednoj pretrazi, samo u užem rasporedu (nema "Svi filteri"
   * gumba na desktopu). "Više filtera" ostaje SAMO na mobitelu (`!compact`),
   * gdje otvara puni napredni panel preko cijelog ekrana.
   */
  compact?: boolean;
};

export function FilterSidebar({ mobile, onClose, compact }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [panelOpen, setPanelOpen] = useState(false);
  /** Karlo 26.08.2026: je li Model polje fokusirano (tada je prazno za upis). */
  const [modelFocus, setModelFocus] = useState(false);
  const [modelDraft, setModelDraft] = useState("");
  const modelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Karlo 30.08.2026 (st.23): isti obrazac za Marka (plovila — slobodan upis). */
  const [makeFocus, setMakeFocus] = useState(false);
  const [makeDraft, setMakeDraft] = useState("");
  const makeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * ⚠️ Karlo 13.08.2026 (st. 1): mobilni filtar nije pokazivao KOLIKO je
   * rezultata pronađeno — korisnik bira filtre naslijepo i mora zatvoriti panel
   * da vidi ishod. Sad gumb piše "Prikaži N vozila" i broj se mijenja uživo.
   *
   * ⚠️ Broji SERVER (`/api/count`), ne klijent. Klijentsko brojanje nad
   * `LISTINGS` je demo seed od ~52 oglasa i davalo bi izmišljen broj — ista
   * greška zbog koje je `/api/count` i nastao (vidi komentar u toj ruti).
   */
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const qs = params.toString();
  useEffect(() => {
    if (!mobile) return;
    let otkazano = false;
    const t = setTimeout(() => {
      fetch(`/api/count?${qs}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!otkazano && d && typeof d.total === "number") setLiveCount(d.total); })
        .catch(() => { /* brojač je informativan — tiho preskoči */ });
    }, 250); // debounce: filtri se mijenjaju u nizu
    return () => { otkazano = true; clearTimeout(t); };
  }, [qs, mobile]);

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
  const subcategory = current.subcategory ?? "";
  /** Karlo 31.08.2026 (st.26/27), prošireno 01.09.2026 (st.46, kao
   * napredno-form.tsx): "Auto dijelovi"-stil sad vrijedi za CIJELU
   * kategoriju Dijelovi i oprema, ne samo podkategoriju "Auto dijelovi". */
  const isAutoDijelovi = isAutoDijeloviLayout(category);
  /** Karlo 31.08.2026 (st.30): "Oprema za kampere i kamping" dobiva IDENTIČNU
   * pretragu kao Auto dijelovi (samo Vrsta ostaje njena postojeća lista). */
  const isKampingOprema = category === "prosti-cas" && subcategory === "kamping-oprema";
  const usesPartsLayout = isAutoDijelovi || isKampingOprema;
  // ⚠️ Karlo 09.09.2026 (st.108-nastavak): trenutna Vrsta (za Dijelovi/Gume i
  // felge i Dijelovi/Ulja i tekućine — obje mogu biti multi ILI select, isti
  // "goli string ili niz" oblik kao napredno-form.tsx currentVrsta). Odabir
  // iz sheme: multi Vrsta polja spremaju "a.vrsta" kao zarezom odvojen niz,
  // select Vrsta polja (Ulja i tekućine, st.99) golu vrijednost.
  const vrstaRaw = current["a.vrsta"] ?? "";
  const currentVrsta = vrstaRaw.includes(",") ? vrstaRaw.split(",")[0] : vrstaRaw;
  const isTireFullForm = isTireFullFormVrsta(category, subcategory, currentVrsta);
  const isUljaMazivaLike = isUljaMazivaLikeVrsta(currentVrsta);
  const makeOptions: Opt[] = useMemo(() => {
    // ⚠️ Karlo 18.08.2026: ATV (moto) i UTV (gospodarska) imaju VLASTITE
    // popise marki s avto.neta — override ispred popisa kategorije.
    // ⚠️ Karlo 09.09.2026 (st.108-nastavak): Vrsta-specifični popis (Ljetne
    // gume/Moto gume/Ulja maziva/felge-za-marku/itd., iz dijelovi-vrsta.ts)
    // MORA stajati ispred podkategorijskog popisa — ista logika kao
    // napredno-form.tsx (vidi taj file za puno obrazloženje po Vrsti).
    const vrstaList = makeListForVrsta(currentVrsta);
    const subList = vrstaList ?? makesForSub(category, subcategory);
    const list = subList ?? ((!category || category === "auto") ? MAKES.map((m) => ({ slug: m.slug, name: m.name })) : (categoryDef?.makes ?? []));
    // ⚠️ Karlo 09.09.2026 (st.108-nastavak): neke Vrste (Ljetne gume, Ulja
    // maziva...) traže PLOSNATU listu čak i unutar Dijelovi kategorije koja
    // inače grupira — isti obrazac kao napredno-form.tsx isLjetneGume/
    // ulja-maziva-aditivi grane.
    if (makeListIsFlatForVrsta(category, subcategory, currentVrsta)) return list.map((m) => ({ value: m.slug, label: m.name }));
    // ⚠️ Karlo 12.08.2026: auto → popularne na vrhu pa cijela abeceda.
    // Ostale kategorije (moto/gospodarska/…) imaju vlastite, kratke popise —
    // ondje grupiranje nema smisla, ide plosnato kao i prije.
    // ⚠️ Karlo 17.08.2026: i MOTO dobiva grupe (vlastitih 10 popularnih).
    if (!category || category === "auto") return makeOptionsGrouped(list);
    // ⚠️ Karlo 17.08.2026: SKUTERI imaju vlastite popularne marke (Kymco/Piaggio/Sym),
    // razlicite od motocikala → biraj po podkategoriji.
    if (category === "moto") return makeOptionsGrouped(list, popularMotoSlugsFor(subcategory));
    // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi koristi puni auto popis →
    // grupe kao auto, ne plosnata lista.
    if (usesPartsLayout) return makeOptionsGrouped(list);
    return list.map((m) => ({ value: m.slug, label: m.name }));
    // ⚠️ Karlo 18.08.2026: `subcategory` MORA biti u ovisnostima — bez
    // toga promjena podkategorije u sidebaru (skuter→moped) zadrži staru grupu
    // "Najpopularnije" jer se memo ne preračuna (kategorija se nije mijenjala).
  }, [category, categoryDef, subcategory, currentVrsta, usesPartsLayout]);
  // Karlo 29.07: modeli iz baze TE kategorije (prije samo auto → moto i
  // gospodarska marke nisu imale nijedan model ni ovdje u sidebaru).
  const modelOptions: Opt[] = useMemo(() => {
    if (!selectedMake) return [];
    // ⚠️ Karlo 12.08.2026: zadnja stavka je uvijek "Modela nema na listi" —
    // i kod marki bez ijednog modela (AEV), gdje je to jedini izbor.
    return modelOptionsFor(
      (makesForSub(category, current.subcategory ?? "") ?? makesDbFor(category || "auto"))
        .find((m) => m.slug === selectedMake)?.models ?? []
    );
  }, [category, selectedMake, current.subcategory]);
  const filterDef: CategoryFilters = useMemo(() => getFilterDefs(category || "auto"), [category]);
  /**
   * ⚠️ Karlo 17.08.2026: `.find()` uzima PRVO polje s tim ključem u kategoriji,
   * bez obzira na podkategoriju. U gospodarskoj su dva `fuel` zapisa (kamionsko
   * "Gorivo" i UTV "Pogon"), pa je UTV dobivao kamionsku oznaku i opcije.
   * Bira se polje koje odgovara podkategoriji, pa ono bez scope-a.
   */
  const poljeZa = (key: string) => {
    const kand = filterDef.fields.filter((f) => f.key === key);
    const sub = current.subcategory ?? "";
    return kand.find((f) => f.scope?.length && sub && f.scope.includes(sub))
        ?? kand.find((f) => !f.scope?.length)
        ?? kand[0];
  };
  const bodyOptions = poljeZa("bodyType")?.options ?? toOpts(BODY_TYPES);
  const fuelOptions = poljeZa("fuel")?.options ?? toOpts(FUEL_TYPES);
  // U motou se polje zove "Pogon", ne "Gorivo" — uzmi naziv iz sheme.
  const fuelLabel = poljeZa("fuel")?.label ?? "Gorivo";
  const subOpts: Opt[] = (categoryDef?.subcategories ?? [])
    .map((s) => ({ value: s.slug, label: s.name }));

  /**
   * ⚠️ Karlo 09.09.2026: "identična polja kao u naprednoj pretrazi i istim
   * redoslijedom" — bočni filter sad koristi ISTI `filterDynamicFields`/
   * `extractStructuredGroups` izračun kao napredno-form.tsx (category-
   * filters.ts, dijeljen izvor istine), umjesto vlastite pojednostavljene
   * `vrstaFields`/Dimenzije-only verzije. `vrstaGroup` (Vrsta polje/a) i
   * `dimenzijeGroup`/`detaljiAboveGroup` renderiraju se NIŽE u body-ju TOČNO
   * istim redoslijedom kao napredna pretraga (Podkategorija → Vrsta → Tip
   * ponude/Stanje → Marka/Model → Prikaži bez cijene/Garancija → Dimenzije →
   * Detalji → Cijena...).
   */
  const isLjetneGumeSidebar = category === "dijelovi" && subcategory === "gume" && isTireFullForm;
  const dynamicFields = useMemo(
    () => filterDynamicFields(filterDef.fields, subcategory, currentVrsta, { isLjetneGume: isLjetneGumeSidebar, isUljaMazivaLike }),
    [filterDef, subcategory, currentVrsta, isLjetneGumeSidebar, isUljaMazivaLike]
  );
  const { vrstaGroup, dimenzijeGroup, detaljiAboveGroup, basicDynamic, advancedDynamic } = useMemo(
    () => extractStructuredGroups(dynamicFields, currentVrsta),
    [dynamicFields, currentVrsta]
  );
  const vrstaFields = vrstaGroup?.fields ?? [];
  /**
   * ⚠️ Karlo 09.09.2026: generički renderer za dynamicFields grupe (Dimenzije/
   * Detalji IZNAD Cijene + basicDynamic/advancedDynamic ISPOD Cijene) — isti
   * skup tipova kao napredno-form.tsx `renderField` (toggle/range/select/
   * text/boatType/multi), da NIJEDNO polje ne izostane samo zato što bočni
   * filter nije znao taj tip renderirati (npr. "OEM / kataloški broj" i
   * "Proizvođač dijela" su bili nevidljivi u sidebaru za sve Dijelovi Vrste
   * BEZ posebnog Dimenzije/Detalji-iznad-Cijene tretmana).
   */
  const renderDynField = (f: FilterField) => {
    if (f.type === "toggle") {
      return (
        <TogglePill
          key={f.key}
          on={current[`a.${f.key}`] === "1"}
          onClick={() => update({ [`a.${f.key}`]: current[`a.${f.key}`] === "1" ? null : "1" })}
          label={f.label}
        />
      );
    }
    if (f.type === "range") {
      if (f.steps && f.steps.length > 0) {
        const raw = current[`a.${f.key}`] ?? "";
        const [lo, hi] = raw.includes("..") ? raw.split("..") : ["", ""];
        const setRange = (min: string, max: string) => update({ [`a.${f.key}`]: min || max ? `${min}..${max}` : null });
        return (
          <RangeSelect key={f.key} label={f.label} unit={f.unit} minValue={lo} maxValue={hi}
            onMin={(v) => setRange(v, hi)} onMax={(v) => setRange(lo, v)} steps={f.steps} maxOnly={f.maxOnly} />
        );
      }
      // ⚠️ Karlo 09.09.2026 (bugfix): polja BEZ `steps` (npr. e-skuteri/e-
      // bicikli "Snaga motora"/"Kapacitet baterije"/"Doseg" — group
      // "Električna") su bila POTPUNO nevidljiva u sidebaru — vraćalo se
      // `null` umjesto slobodnog unosa. napredno-form.tsx za isti slučaj
      // koristi RangeInput (dva broja, "min..max" u jednom URL ključu).
      return (
        <RangeInput key={f.key} label={f.label} unit={f.unit}
          value={current[`a.${f.key}`] ?? undefined}
          onSet={(v) => update({ [`a.${f.key}`]: v ?? null })} />
      );
    }
    if (f.type === "select") {
      return (
        <SelectField key={f.key} label={f.label} value={current[`a.${f.key}`] ?? ""}
          onChange={(v) => update({ [`a.${f.key}`]: v || null })} options={f.options ?? []} placeholder="Sve"
          hideClear={f.key === "vrsta" && subcategory === "ulja-tekucine"} />
      );
    }
    if (f.type === "text") {
      return (
        <TextField key={f.key} label={f.label} value={current[`a.${f.key}`] ?? ""}
          onChange={(v) => update({ [`a.${f.key}`]: v || null })} placeholder={f.label} />
      );
    }
    if (f.key === "boatType") {
      return (
        <PillMultiSelect key={f.key} label={f.label} values={arr(`a.${f.key}`)} onChange={(v) => setMulti(`a.${f.key}`, v)}
          options={f.options ?? []} iconFor={(v) => BOAT_TYPE_ICON[v]} />
      );
    }
    // multi
    return (
      <MultiSelect key={f.key} label={f.label} values={arr(`a.${f.key}`)} onChange={(v) => setMulti(`a.${f.key}`, v)}
        options={f.options ?? []} placeholder="Sve" />
    );
  };

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
        <SelectField label="Podkategorija" value={current.subcategory ?? ""} onChange={(v) => {
          // ⚠️ Karlo 22.08.2026: nova podkategorija može imati DRUGI popis
          // marki (minimoto/gokart/ATV/UTV…) — marka koje u njemu nema mora
          // van iz URL-a, inače ostane nevidljiv filtar s 0 rezultata.
          const list = makesForSub(category, v) ?? categoryDef?.makes ?? [];
          const makeOstaje = !selectedMake || list.some((m) => m.slug === selectedMake);
          update(makeOstaje ? { subcategory: v || null } : { subcategory: v || null, make: null, model: null });
        }} options={subOpts} placeholder="Sve podkategorije" />
      )}

      {/* Stil (moto) / Tip vozila (kamioni) — ODMAH ispod Podkategorije */}
      {vrstaFields.map((f) =>
        // ⚠️ Karlo 09.09.2026 (Slobodno vrijeme parity): kamping-oprema (i Gume
        // i felge, kad im zatreba isti tretman) biraju Vrstu kroz slikoviti
        // gate u naprednoj pretrazi (needsVrstaPick) — jednom kad je Vrsta
        // odabrana, napredno-form.tsx je NE prikazuje kao multi-select
        // checkbox listu nego kao SelectField single-select ("Sve vrste",
        // vrijednost uvijek TOČNO jedna). Bez ove grane bočni filter je Vrstu
        // (za kamping-opremu) renderirao kao MultiSelect — kriv widget/
        // semantika, iako je opcijski popis identičan.
        f.key === "vrsta" && isKampingOprema ? (
          <SelectField
            key={f.key}
            label="Vrsta"
            value={arr(`a.${f.key}`)[0] ?? current[`a.${f.key}`] ?? ""}
            onChange={(v) => update({ [`a.${f.key}`]: v || null })}
            options={f.options ?? []}
            placeholder="Sve vrste"
          />
        ) : // ⚠️ Karlo 30.08.2026 (st.22a): "Tip plovila" nacrtan kao izbor (svih
        // 5 opcija odmah vidljivo), ne padajući izbornik iza klika.
        f.key === "boatType" ? (
          <PillMultiSelect
            key={f.key}
            label={f.label}
            values={arr(`a.${f.key}`)}
            onChange={(v) => setMulti(`a.${f.key}`, v)}
            options={f.options ?? []}
            iconFor={(v) => BOAT_TYPE_ICON[v]}
          />
        ) : f.type === "multi" ? (
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
            // ⚠️ Karlo 09.09.2026 (st.103, sidebar-nastavak): Ulja i tekućine
            // → Vrsta nema "Sve" opciju za brisanje odabira.
            hideClear={f.key === "vrsta" && subcategory === "ulja-tekucine"}
          />
        )
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Karlo 30.07: filter je bio MRTAV — pisao se kao goli `offerType`, a polje je
            `storage:"attr"`, pa ga `parseFilters` nikad nije uhvatio (nije ni u
            RESERVED_PARAMS ni `a.`-prefiksiran) → korisnik filtrira, ništa se ne mijenja.
            Attr polja MORAJU ići kroz `a.` prefiks. */}
        {/* ⚠️ Karlo 26.08.2026: ručni filtar — poštuje scope polja. */}
        {filterDef.fields.some((f) => f.key === "offerType" && (!f.scope?.length || f.scope.includes(current.subcategory ?? ""))) && (
          <MultiSelect label="Tip ponude" values={arr("a.offerType").length ? arr("a.offerType") : arr("offerType")} onChange={(v) => setMulti("a.offerType", v)} options={[{ value: "Prodaja", label: "Prodaja" }, { value: "Najam", label: "Najam" }]} placeholder="Sve" />
        )}
        {/* ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi — "Stanje" → "Stanje
            predmeta" (Novo/Polovno/Obnovljeno). Svugdje drugdje nepromijenjeno.
            ⚠️ Karlo 09.09.2026 (st.100/107, sidebar-nastavak): Ulja, maziva i
            aditivi + Autokozmetika — Stanje predmeta POTPUNO uklonjeno.
            ⚠️ Karlo 09.09.2026 (Slobodno vrijeme parity): naziv "Stanje" nije
            odgovarao naprednoj pretrazi ("Stanje vozila") — ispravljeno. */}
        {isUljaMazivaLike ? null : usesPartsLayout ? (
          <MultiSelect label="Stanje predmeta" values={arr("condition")} onChange={(v) => setMulti("condition", v)}
            options={toOpts(["Novo", "Polovno", "Obnovljeno"])} placeholder="Sve" />
        ) : (
          <MultiSelect label="Stanje vozila" values={arr("condition")} onChange={(v) => setMulti("condition", v)} options={toOpts(CONDITIONS.filter((c) => c !== "Oldtimer"))} placeholder="Sve" />
        )}
      </div>

      {/* ⚠️ Karlo 30.08.2026 (st.23): Plovila — Marka slobodan upis, bez
          ponuđenog fiksnog popisa. Isti debounce obrazac kao Model (upis po
          znaku bi remountao polje i gubio slova — vidi komentar niže).
          ⚠️ Karlo 09.09.2026 (st.107, sidebar-nastavak): Autokozmetika i njega
          vozila — isto slobodan upis, Vrsta-razina uvjet (`makeIsFreeTextForVrsta`). */}
      {freeTextMakeField(category, subcategory) || makeIsFreeTextForVrsta(currentVrsta) ? (
        <TextField
          label="Marka"
          value={makeFocus ? makeDraft : (current.make || SVE_MARKE)}
          onChange={(v) => {
            setMakeDraft(v);
            if (makeTimer.current) clearTimeout(makeTimer.current);
            makeTimer.current = setTimeout(() => update({ make: v.trim() || null, model: null }), 400);
          }}
          onFocus={() => { setMakeDraft(current.make ?? ""); setMakeFocus(true); }}
          onBlur={() => {
            if (makeTimer.current) clearTimeout(makeTimer.current);
            update({ make: makeDraft.trim() || null, model: null });
            setMakeFocus(false);
          }}
          placeholder={makeFreeTextPlaceholderForVrsta(category, subcategory, currentVrsta)}
        />
      ) : (
        <SelectField
          // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi — "Marka" → "Za marku".
          // ⚠️ Karlo 09.09.2026 (st.86-106, sidebar-nastavak): Vrsta-specifični
          // nazivi (Za Marku/Marka za felge/ulja) — `makeLabelForVrsta`.
          label={makeLabelForVrsta(usesPartsLayout, isTireFullForm, currentVrsta)}
          value={selectedMake} onChange={(v) => update({ make: v || null, model: null })} options={makeOptions} placeholder="Sve marke" />
      )}
      {/* ⚠️ Karlo 26.08.2026: kamioni — slobodan upis modela; prazno = svi modeli.
          ⚠️ Karlo 09.09.2026 (st.59-107, sidebar-nastavak): Model potpuno
          uklonjen za neke Vrste (Ljetne gume/felge/Distancijeri/TPMS/Ulja
          maziva/Autokozmetika) — `modelHiddenForVrsta`.
          ⚠️ Karlo 09.09.2026 (bugfix): "Model" je NESTAO za sve ostale Vrste
          BEZ marke odabrane (npr. Auto dijelovi/"Motor, dijelovi motora i
          brtve") — sidebar je imao DVA NEOVISNA uvjeta (select I text), pa
          kad `modelOptions.length === 0` (nema marke) I `freeTextModelField`
          false, NIJEDAN se nije okinuo. napredno-form.tsx ima JEDAN ternary:
          select AKO ima opcija i nije free-text, INAČE text (uklj. baš ovaj
          "još nema marke" slučaj) — isti obrazac ovdje. */}
      {!modelHiddenForVrsta(category, subcategory, currentVrsta) && showsModelField(category, subcategory) && (
        modelOptions.length > 0 && !freeTextModelField(category, subcategory) ? (
          <SelectField label="Model" value={current.model ?? ""} onChange={(v) => update({ model: v || null })} options={modelOptions} placeholder="Svi modeli" />
        ) : (
          <TextField
            label="Model"
            /* ⚠️ Karlo 26.08.2026: prije klika u polju PIŠE "Svi modeli" (prava
               vrijednost, ne sivi placeholder) SAMO kod slobodnog upisa
               (kamioni/autobusi) — isti uvjet kao napredno-form.tsx `value`
               (freeTextModelField && !focus && !model). Za "još nema marke"
               slučaj (Auto dijelovi i sl.) polje ostaje prazno, "Svi modeli"
               dolazi kroz `placeholder`.
               ⚠️ Tipkanje ide u LOKALNO stanje, a URL se ažurira tek 400 ms
               nakon zadnjeg znaka — `update()` radi router.push, pa bi upis po
               znaku remountao polje i gubio slova (uhvaćeno: "FH16" → "6"). */
            value={modelFocus ? modelDraft : freeTextModelField(category, subcategory) ? (current.model || SVI_MODELI) : (current.model ?? "")}
            onChange={(v) => {
              setModelDraft(v);
              if (modelTimer.current) clearTimeout(modelTimer.current);
              modelTimer.current = setTimeout(() => update({ model: v.trim() || null }), 400);
            }}
            onFocus={() => { setModelDraft(current.model ?? ""); setModelFocus(true); }}
            onBlur={() => {
              if (modelTimer.current) clearTimeout(modelTimer.current);
              update({ model: modelDraft.trim() || null });
              setModelFocus(false);
            }}
            placeholder={selectedMake ? "npr. Golf, A4, X3..." : SVI_MODELI}
          />
        )
      )}

      {/* ⚠️ Karlo 09.09.2026 (identičan redoslijed kao napredna pretraga):
          "Prikaži oglase bez cijene" + Garancija + Ljetni/Zimski komplet
          (Kompleti gume+felge) — ista pozicija (ODMAH ispod Marka/Model,
          PRIJE Dimenzije/Cijena) kao u napredno-form.tsx. Ova 3 polja u
          bočnom filteru prije NISU postojala uopće.
          ⚠️ Karlo 09.09.2026 (responsive fix): "Prikaži oglase bez cijene" u
          uskom bočnom stupcu (2 stupca u ~260px) ne stane u pola širine bez
          loma teksta u 3-4 retka — dobiva VLASTITI puni redak, Garancija/
          Ljetni/Zimski komplet ostaju u 2-stupčanom retku ispod (ista logika
          kao "grid-cols-2" napredno-form.tsx, samo prilagođena širini). */}
      <TogglePill
        on={current.hidePriceless !== "1"}
        onClick={() => update({ hidePriceless: current.hidePriceless === "1" ? null : "1" })}
        label="Prikaži oglase bez cijene"
      />
      {(!isUljaMazivaLike && filterDef.fields.some((f) => f.key === "warranty" && (!f.scope?.length || f.scope.includes(subcategory))) || currentVrsta === "kompleti-gume-felge") && (
        <div className="grid grid-cols-2 gap-2">
          {!isUljaMazivaLike && filterDef.fields.some((f) => f.key === "warranty" && (!f.scope?.length || f.scope.includes(subcategory))) && (
            <TogglePill on={current["a.warranty"] === "1"} onClick={() => update({ "a.warranty": current["a.warranty"] === "1" ? null : "1" })} label="Garancija" />
          )}
          {currentVrsta === "kompleti-gume-felge" && (
            <>
              <TogglePill on={current["a.kompletLjetni"] === "1"} onClick={() => update({ "a.kompletLjetni": current["a.kompletLjetni"] === "1" ? null : "1" })} label="Ljetni komplet" />
              <TogglePill on={current["a.kompletZimski"] === "1"} onClick={() => update({ "a.kompletZimski": current["a.kompletZimski"] === "1" ? null : "1" })} label="Zimski komplet" />
            </>
          )}
        </div>
      )}

      {/* ⚠️ Karlo 09.09.2026 (st.108-nastavak, identičan redoslijed): "Dimenzije"
          (Ljetne gume/felge/Distancijeri...) i "Detalji" (Viskoznost ulja) —
          isti obrazac kao "iznad Cijene" panel u naprednoj pretrazi, ODMAH
          IZNAD Cijene (ne odmah ispod Vrste kao u prvoj verziji). */}
      {dimenzijeGroup && dimenzijeGroup.fields.map(renderDynField)}
      {detaljiAboveGroup && detaljiAboveGroup.fields.map(renderDynField)}

      {/* ⚠️ Karlo 09.09.2026 (st.57/105, sidebar-nastavak): gušća ljestvica
          (25€ koraci) za Multimedija/Gume i felge/Ulja maziva-slične Vrste. */}
      <RangeSelect label="Cijena (€)" unit="€" minValue={current.priceMin ?? ""} maxValue={current.priceMax ?? ""} onMin={(v) => update({ priceMin: v || null })} onMax={(v) => update({ priceMax: v || null })}
        steps={usesDenseCijenaSteps(category, subcategory, currentVrsta) ? MULTIMEDIJA_PRICE_STEPS : PRICE_STEPS} />
      {/* ⚠️ Karlo 31.08.2026 (st.27): Auto dijelovi — "Godina" maknuta (dio
          nema godinu proizvodnje kao vozilo). */}
      {!usesPartsLayout && (
        <RangeSelect label="Godina" minValue={current.yearMin ?? ""} maxValue={current.yearMax ?? ""} onMin={(v) => update({ yearMin: v || null })} onMax={(v) => update({ yearMax: v || null })} steps={YEARS} fmt={(n) => String(n)} />
      )}
      {hasField("km") && (
        <RangeSelect label="Kilometraža" unit="km" minValue={current.kmMin ?? ""} maxValue={current.kmMax ?? ""} onMin={(v) => update({ kmMin: v || null })} onMax={(v) => update({ kmMax: v || null })} steps={KM_STEPS} />
      )}

      {/* ⚠️ Karlo 09.09.2026 (Slobodno vrijeme parity): napredno-form.tsx
          renderira "Motor" sekciju (Gorivo/Mjenjač/Karoserija) KAO ZASEBAN
          panel PRIJE basicDynamic panela (linija ~1044/1048) — obrnut
          redoslijed od prijašnje sidebar verzije uzrokovao je da su npr.
          Kamperi "Vozilo oštećeno"/"Vozilo u kvaru" (basicDynamic) ispadali
          PRIJE "Gorivo"/"Mjenjač", umjesto poslije. Redoslijed ovdje sad
          prati taj isti obrazac.
          ⚠️ Karlo 09.09.2026: "nepotrebno da imamo Više filtera, neka se
          odmah pokazuju svi filteri na desktopu" — `compact` više NE skriva
          ništa iza klika, cijeli bočni stupac (desktop) uvijek prikazuje SVE
          filtere, identično naprednoj pretrazi. */}
      {hasField("engineCc") && (
        <RangeSelect label="Obujam (cm³)" unit="cm³" minValue={current.engineMin ?? ""} maxValue={current.engineMax ?? ""} onMin={(v) => update({ engineMin: v || null })} onMax={(v) => update({ engineMax: v || null })} steps={category === "moto" ? MOTO_ENGINE_STEPS : ENGINE_STEPS} />
      )}
      {hasField("powerKw") && (
        <RangeSelect label="Snaga (kW)" unit="kW" minValue={current.powerMin ?? ""} maxValue={current.powerMax ?? ""} onMin={(v) => update({ powerMin: v || null })} onMax={(v) => update({ powerMax: v || null })} steps={category === "moto" ? MOTO_POWER_STEPS : POWER_STEPS} />
      )}
      {hasField("fuel") && (
        <MultiSelect label={fuelLabel} values={arr("fuel")} onChange={(v) => setMulti("fuel", v)} options={fuelOptions} placeholder="Sve" />
      )}
      {hasField("transmission") && (
        <MultiSelect label="Mjenjač" values={arr("transmission")} onChange={(v) => setMulti("transmission", v)} options={toOpts(TRANSMISSIONS)} placeholder="Sve" />
      )}
      {/* Karlo 29.07: Karoserija se prikazuje samo ako je kategorija/podkategorija
          stvarno ima — motocikl je nema, a prije je visjela svugdje. */}
      {hasField("bodyType") && (
        <BodyTypePicker label="Karoserija" values={arr("bodyType")} onChange={(v) => setMulti("bodyType", v)} options={bodyOptions} />
      )}

      {/* ⚠️ Karlo 09.09.2026: `basicDynamic` grupe (npr. "Detalji" — OEM /
          kataloški broj + Proizvođač dijela — za Vrste BEZ posebnog Dimenzije/
          Detalji-iznad-Cijene tretmana, poput "Motor, dijelovi motora i
          brtve"; ili "Vozilo oštećeno"/"Vozilo u kvaru" za Kamperi) su
          nedostajale u bočnom filteru u potpunosti — ista pozicija kao
          napredno-form.tsx (odmah IZA Motor sekcije/Gorivo/Mjenjač). */}
      {basicDynamic.flatMap((g) => g.fields).map(renderDynField)}

      {/* ⚠️ Karlo 09.09.2026 (parity): "Boja" → "Boja vozila" — isti naziv kao napredna pretraga. */}
      {hasField("color") && (
        <ColorPicker label="Boja vozila" values={arr("color")} onChange={(v) => setMulti("color", v)} options={(poljeZa("color")?.options?.map((o) => o.label) ?? [...COLORS]) as string[]} />
      )}

      {/* ⚠️ Karlo 09.09.2026 (Slobodno vrijeme parity): `advancedDynamic` MORA
          stajati PRIJE Lokacija/Prodavač — napredno-form.tsx redoslijed je
          6. VIŠE FILTERA (advancedDynamic) → 7. LOKACIJA I PRODAVAČ (zadnje).
          Sve preostale grupe koje napredna skriva iza "Više filtera"
          (Specifikacije/Oprema/Povijest/Pravno/Vlasništvo/Broj vlasnika/itd.). */}
      {advancedDynamic.flatMap((g) => g.fields).map(renderDynField)}

      {/* ⚠️ Karlo 09.09.2026 (Slobodno vrijeme parity): "Županija" → "Lokacija
          (županija)" — isti naziv kao napredna pretraga; ZADNJE polje, isto
          kao napredno-form.tsx "7. LOKACIJA I PRODAVAČ". */}
      <SelectField label="Lokacija (županija)" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
      <MultiSelect label="Prodavač" values={arr("sellerType")} onChange={(v) => setMulti("sellerType", v)} options={toOpts(SELLER_TYPES)} placeholder="Svi" />

      {/* ⚠️ Karlo 13.08.2026 (st. 2) → 09.09.2026: "Više filtera" ostaje SAMO
          za mobitel (`!compact` — otvara puni napredni panel preko cijelog
          ekrana, gdje uski jednostupčani prikaz nema smisla). Desktop
          (`compact`) gumb je uklonjen — sve je već vidljivo iznad. */}
      {!compact && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="w-full h-11 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
        >
          <SlidersHorizontal className="size-4" />
          Više filtera
        </button>
      )}
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
              <div>
                <h2 className="font-display text-xl">Filtri</h2>
                {/* ⚠️ Karlo 13.08.2026 (st. 1): broj se vidi ODMAH pri otvaranju
                    panela, ne tek na gumbu na dnu. */}
                {liveCount !== null && (
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Pronađeno {liveCount} {liveCount === 1 ? "oglas" : "oglasa"}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="size-9 rounded-lg hover:bg-[var(--color-line)] grid place-items-center" aria-label="Zatvori">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">{body}</div>
            <div className="shrink-0 px-4 py-3 border-t border-[var(--color-line)]">
              {/* ⚠️ Karlo 13.08.2026 (st. 1): broj pronađenih rezultata. Dok
                  brojač još učitava, ostaje neutralan tekst — bolje nego da
                  bljesne kriva brojka. */}
              <button onClick={onClose} className="w-full h-12 rounded-xl bg-[var(--color-accent)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors">
                {liveCount === null
                  ? "Prikaži rezultate"
                  : `Prikaži ${liveCount} ${liveCount === 1 ? "oglas" : "oglasa"}`}
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
