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
import { getFilterDefs, type CategoryFilters } from "@/data/category-filters";
import {
  MultiSelect, PillMultiSelect, BOAT_TYPE_ICON, SelectField, TextField, ColorPicker, RangeSelect, BodyTypePicker, type Opt,
} from "@/components/napredno/controls";
import { FilterPanel } from "@/components/napredno/filter-panel";
import { SlidersHorizontal, X } from "lucide-react";

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 1990 + 1 }, (_, i) => YEAR_NOW - i);

const SVI_MODELI = "Svi modeli";
const SVE_MARKE = "Sve marke";

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
  /** Karlo 13.08.2026 (st. 2): je li bočni stupac proširen na SVE filtere. */
  const [sviFilteri, setSviFilteri] = useState(false);
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
  const makeOptions: Opt[] = useMemo(() => {
    // ⚠️ Karlo 18.08.2026: ATV (moto) i UTV (gospodarska) imaju VLASTITE
    // popise marki s avto.neta — override ispred popisa kategorije.
    const subList = makesForSub(category, current.subcategory ?? "");
    const list = subList ?? ((!category || category === "auto") ? MAKES.map((m) => ({ slug: m.slug, name: m.name })) : (categoryDef?.makes ?? []));
    // ⚠️ Karlo 12.08.2026: auto → popularne na vrhu pa cijela abeceda.
    // Ostale kategorije (moto/gospodarska/…) imaju vlastite, kratke popise —
    // ondje grupiranje nema smisla, ide plosnato kao i prije.
    // ⚠️ Karlo 17.08.2026: i MOTO dobiva grupe (vlastitih 10 popularnih).
    if (!category || category === "auto") return makeOptionsGrouped(list);
    // ⚠️ Karlo 17.08.2026: SKUTERI imaju vlastite popularne marke (Kymco/Piaggio/Sym),
    // razlicite od motocikala → biraj po podkategoriji.
    if (category === "moto") return makeOptionsGrouped(list, popularMotoSlugsFor(current.subcategory ?? ""));
    // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi koristi puni auto popis →
    // grupe kao auto, ne plosnata lista.
    if (category === "dijelovi" && current.subcategory === "auto-dijelovi") return makeOptionsGrouped(list);
    return list.map((m) => ({ value: m.slug, label: m.name }));
    // ⚠️ Karlo 18.08.2026: `current.subcategory` MORA biti u ovisnostima — bez
    // toga promjena podkategorije u sidebaru (skuter→moped) zadrži staru grupu
    // "Najpopularnije" jer se memo ne preračuna (kategorija se nije mijenjala).
  }, [category, categoryDef, current.subcategory]);
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
        // ⚠️ Karlo 30.08.2026 (st.22a): "Tip plovila" nacrtan kao izbor (svih
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
            predmeta" (Novo/Polovno/Obnovljeno). Svugdje drugdje nepromijenjeno. */}
        {category === "dijelovi" && current.subcategory === "auto-dijelovi" ? (
          <MultiSelect label="Stanje predmeta" values={arr("condition")} onChange={(v) => setMulti("condition", v)}
            options={toOpts(["Novo", "Polovno", "Obnovljeno"])} placeholder="Sve" />
        ) : (
          <MultiSelect label="Stanje" values={arr("condition")} onChange={(v) => setMulti("condition", v)} options={toOpts(CONDITIONS.filter((c) => c !== "Oldtimer"))} placeholder="Sve" />
        )}
      </div>

      {/* ⚠️ Karlo 30.08.2026 (st.23): Plovila — Marka slobodan upis, bez
          ponuđenog fiksnog popisa. Isti debounce obrazac kao Model (upis po
          znaku bi remountao polje i gubio slova — vidi komentar niže). */}
      {freeTextMakeField(category, current.subcategory ?? "") ? (
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
        />
      ) : (
        <SelectField
          // ⚠️ Karlo 31.08.2026 (st.26): Auto dijelovi — "Marka" → "Za marku".
          label={category === "dijelovi" && current.subcategory === "auto-dijelovi" ? "Za marku" : "Marka"}
          value={selectedMake} onChange={(v) => update({ make: v || null, model: null })} options={makeOptions} placeholder="Sve marke" />
      )}
      {/* ⚠️ Karlo 26.08.2026: kamioni — slobodan upis modela; prazno = svi modeli. */}
      {showsModelField(category, current.subcategory ?? "") && freeTextModelField(category, current.subcategory ?? "") && (
        <TextField
          label="Model"
          /* ⚠️ Karlo 26.08.2026: prije klika u polju PIŠE "Svi modeli" (prava
             vrijednost, ne sivi placeholder); na fokus se isprazni za upis.
             ⚠️ Tipkanje ide u LOKALNO stanje, a URL se ažurira tek 400 ms
             nakon zadnjeg znaka — `update()` radi router.push, pa bi upis po
             znaku remountao polje i gubio slova (uhvaćeno: "FH16" → "6"). */
          value={modelFocus ? modelDraft : (current.model || SVI_MODELI)}
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
        />
      )}
      {modelOptions.length > 0 && showsModelField(category, current.subcategory ?? "") && !freeTextModelField(category, current.subcategory ?? "") && (
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
      {(!compact || sviFilteri) && (
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
            <ColorPicker label="Boja" values={arr("color")} onChange={(v) => setMulti("color", v)} options={(poljeZa("color")?.options?.map((o) => o.label) ?? [...COLORS]) as string[]} />
          )}

          {/* U `compact` je Županija već gore među brzim filterima — bez ovog
              uvjeta bi se u proširenom stupcu pojavila DVAPUT. */}
          {!compact && (
            <SelectField label="Županija" value={current.county ?? ""} onChange={(v) => update({ county: v || null })} options={COUNTIES.map((c) => ({ value: c, label: c }))} placeholder="Sve županije" />
          )}
          <MultiSelect label="Prodavač" values={arr("sellerType")} onChange={(v) => setMulti("sellerType", v)} options={toOpts(SELLER_TYPES)} placeholder="Svi" />
        </>
      )}

      {/**
       * ⚠️ Karlo 13.08.2026 (st. 2): "Svi filteri" je BACAO na naprednu pretragu
       * (full-screen panel) umjesto da izlista ostatak filtera u stupcu.
       * Sad u bočnom stupcu (`compact`) samo proširuje stupac na licu mjesta;
       * puni panel ostaje samo za pop-up varijantu ("Više filtera").
       */}
      <button
        type="button"
        onClick={() => (compact ? setSviFilteri((s) => !s) : setPanelOpen(true))}
        className="w-full h-11 px-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] transition-colors"
      >
        <SlidersHorizontal className="size-4" />
        {compact ? (sviFilteri ? "Manje filtera" : "Svi filteri") : "Više filtera"}
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
