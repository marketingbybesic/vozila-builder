"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, NumberField, TextField, MultiSelect, PillMultiSelect, TogglePill } from "@/components/napredno/controls";
import { Textarea } from "@/components/ui/input";
import { updateListingAction, setListingStatusAction } from "@/actions/listings";
import { getFilterDefs, type FilterField } from "@/data/category-filters";
import { HR_LOCATIONS, COUNTIES } from "@/data/locations";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, DRIVES, COLORS, CONDITIONS,
  type Listing,
} from "@/lib/types";
import { getCategory, makesForSub, showsModelField } from "@/data/categories";

/**
 * Karlo 09.08. (st. 1): uređivanje mora nuditi i rubrike "Stanje vozila",
 * "Povijest" i "Dodatne opcije" — iste koje prodavač popunjava pri objavi.
 * Polja dolaze IZ SHEME (`category-filters.ts`), kao i u čarobnjaku objave,
 * pa se ne mogu razići s pretragom i prikazom.
 */
const EDITABLE_ATTR_GROUPS = ["Stanje vozila", "Povijest", "Dodatne opcije"] as const;

/** Parovi kvačica koji se međusobno isključuju — isto kao u objavi. */
const STATE_PAIRS: Record<string, string> = {
  roadworthy: "notRoadworthy", notRoadworthy: "roadworthy",
  undamaged: "damaged", damaged: "undamaged",
};

/** Ista semantika kao `collectFeatureLabels` u objavi — `features` (flat lista)
 *  pokreće prikaz opreme na oglasu, pa se mora osvježiti uz `attributes`. */
function collectFeatures(attrs: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const v of Object.values(attrs)) {
    if (Array.isArray(v)) out.push(...(v as string[]));
    else if (typeof v === "string" && v) out.push(v);
  }
  return out;
}

/**
 * Uređivanje postojećeg oglasa (Dino 05.08.2026).
 *
 * ⚠️ Namjerno UŽE od objave: mijenjaju se podaci koji zastarijevaju — cijena,
 * kilometraža, opis, lokacija, stanje. Kategorija, atributi i fotografije se ne
 * diraju jer bi tražili cijeli 6-koračni čarobnjak; za takvu promjenu je bolje
 * objaviti novi oglas.
 *
 * Šalje se PATCH — samo polja koja postoje u formi. Zod ih ima sve kao
 * opcionalna, a adapter izbacuje `undefined` prije upisa.
 */
export function EditListingForm({ listing }: { listing: Listing & { status?: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Attr polja (jsonb) iz sheme za kategoriju oglasa, samo tri tražene rubrike.
  const [attrs, setAttrs] = useState<Record<string, unknown>>({ ...(listing.attributes ?? {}) });
  const attrGroups = useMemo(() => {
    const fields = getFilterDefs(listing.category).fields.filter((f) => {
      if (f.storage !== "attr") return false;
      if (f.searchOnly) return false;
      if (!EDITABLE_ATTR_GROUPS.includes(f.group as (typeof EDITABLE_ATTR_GROUPS)[number])) return false;
      if (f.scope && f.scope.length > 0) {
        return listing.subcategory ? f.scope.includes(listing.subcategory) : false;
      }
      return true;
    });
    return EDITABLE_ATTR_GROUPS
      .map((name) => ({ name, fields: fields.filter((f) => f.group === name) }))
      .filter((g) => g.fields.length > 0);
  }, [listing.category, listing.subcategory]);

  const setAttr = (key: string, v: unknown) => {
    setOk(false);
    setAttrs((p) => ({ ...p, [key]: v }));
  };
  const toggleState = (f: FilterField) => {
    setOk(false);
    setAttrs((p) => {
      const on = !p[f.key];
      const next = { ...p, [f.key]: on };
      const pair = f.group === "Stanje vozila" ? STATE_PAIRS[f.key] : undefined;
      if (pair && on) next[pair] = false;
      return next;
    });
  };

  /**
   * ⚠️ Karlo 13.08.2026 (st. 3): "kod uređivanja oglasa fali uređivanje slika".
   * Forma je imala SVE osim fotografija — `updateListingAction` ih je već
   * prihvaćao (`images`), samo sučelja nije bilo.
   *
   * Ovdje se slike PRESLAGUJU, briše se višak i bira glavna (prva = naslovna).
   * ⚠️ DODAVANJE novih nije uključeno — `uploadListingPhotoAction` piše na
   * lokalni disk (`public/uploads/`), a na Vercelu je disk efemeran pa bi
   * slika nestala pri sljedećem deployu. Za to treba Supabase Storage bucket
   * (vidi PRODUCTION.md → "Image uploads"). Prijavljeno Dini.
   */
  const [images, setImages] = useState<string[]>([...(listing.images ?? [])]);
  const pomakni = (i: number, smjer: -1 | 1) => {
    setOk(false);
    setImages((p) => {
      const j = i + smjer;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };
  const obrisi = (i: number) => {
    setOk(false);
    setImages((p) => (p.length <= 1 ? p : p.filter((_, k) => k !== i)));
  };
  const naGlavnu = (i: number) => {
    setOk(false);
    setImages((p) => (i === 0 ? p : [p[i], ...p.filter((_, k) => k !== i)]));
  };

  const [s, setS] = useState({
    make: listing.make,
    model: listing.model,
    variant: listing.variant ?? "",
    year: String(listing.year || ""),
    priceEur: String(listing.priceEur || ""),
    km: String(listing.km || ""),
    fuel: listing.fuel,
    transmission: listing.transmission,
    bodyType: listing.bodyType,
    drive: listing.drive,
    color: listing.color,
    condition: listing.condition,
    powerKw: String(listing.powerKw || ""),
    engineCc: String(listing.engineCc || ""),
    county: listing.county,
    city: listing.city,
    description: listing.description,
  });

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => {
    setOk(false);
    setS((p) => ({ ...p, [k]: v }));
  };

  // Popis marki za (pod)kategoriju OVOG oglasa (minimoto/gokart/ATV/UTV… imaju
  // vlastite liste). Vrijednosti su IMENA (baza sprema ime, ne slug), a
  // postojeća vrijednost izvan popisa ostaje kao prva opcija.
  const makeOpts = useMemo(() => {
    const list = makesForSub(listing.category, listing.subcategory ?? undefined)
      ?? getCategory(listing.category)?.makes ?? [];
    const extra = s.make && !list.some((m) => m.name === s.make)
      ? [{ value: s.make, label: s.make }] : [];
    return [...extra, ...list.map((m) => ({ value: m.name, label: m.name }))];
  }, [listing.category, listing.subcategory, s.make]);

  // Grad ovisi o županiji — isti obrazac kao u objavi.
  const cityOptions = (HR_LOCATIONS.find((l) => l.county === s.county)?.cities ?? [])
    .map((c) => ({ value: c, label: c }));

  const submit = () => {
    setErr(null);
    setOk(false);
    start(async () => {
      const res = await updateListingAction({
        id: listing.id,
        make: s.make,
        model: s.model,
        variant: s.variant || undefined,
        year: s.year || undefined,
        priceEur: s.priceEur || undefined,
        km: s.km || undefined,
        fuel: s.fuel,
        transmission: s.transmission,
        bodyType: s.bodyType,
        drive: s.drive,
        color: s.color,
        condition: s.condition,
        powerKw: s.powerKw || undefined,
        engineCc: s.engineCc || undefined,
        county: s.county,
        city: s.city,
        description: s.description,
        // Karlo 13.08. (st. 3): redoslijed slika (prva = naslovna) i brisanje.
        images,
        // Karlo 09.08. (st. 1): rubrike Stanje vozila / Povijest / Dodatne
        // opcije — attributes se šalju CIJELI (uključivo ključeve koje forma ne
        // renderira, npr. `vrsta`), a `features` se izvodi isto kao pri objavi.
        attributes: attrs,
        features: collectFeatures(attrs),
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
  };

  // Karlo 09.08. (st. 2): skica se iz uređivanja mora moći OBJAVITI — javna
  // stranica oglasa za skicu vraća 404, pa je "Pogledaj oglas" bio slijepa ulica.
  const publishDraft = () => {
    setErr(null);
    start(async () => {
      const res = await setListingStatusAction({ id: listing.id, status: "active" });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push(`/oglasi/${listing.slug}`);
    });
  };

  const renderAttrField = (f: FilterField) => {
    if (f.type === "toggle") {
      return <TogglePill key={f.key} on={Boolean(attrs[f.key])} onClick={() => toggleState(f)} label={f.label} />;
    }
    if (f.type === "select") {
      return (
        <SelectField key={f.key} label={f.label} value={(attrs[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)} options={f.options ?? []} placeholder="Odaberi" />
      );
    }
    if (f.type === "text") {
      return (
        <TextField key={f.key} label={f.label} value={(attrs[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)} placeholder={f.placeholder ?? f.label} />
      );
    }
    if (f.type === "range") {
      const dec = f.step && f.step < 1 ? String(f.step).split(".")[1]?.length ?? 1 : 0;
      return (
        <NumberField key={f.key} label={f.label} unit={f.unit} value={(attrs[f.key] as string) ?? ""}
          onChange={(v) => setAttr(f.key, v || undefined)} placeholder="Upiši broj" decimals={dec} />
      );
    }
    // multi — vrijednost normaliziraj u niz (isti oprez kao u objavi: atribut
    // upisan drugdje kao string srušio bi .map u MultiSelectu).
    const raw = attrs[f.key];
    const values = Array.isArray(raw) ? (raw as string[]) : raw != null && raw !== "" ? [String(raw)] : [];
    // ⚠️ Karlo 30.08.2026 (st.22a): "Tip plovila" nacrtan kao izbor (svih 5
    // opcija odmah vidljivo), ne padajući izbornik iza klika.
    if (f.key === "boatType") {
      return (
        <PillMultiSelect key={f.key} label={f.label} values={values}
          onChange={(vs) => setAttr(f.key, vs)} options={f.options ?? []} />
      );
    }
    return (
      <MultiSelect key={f.key} label={f.label} values={values}
        onChange={(vs) => setAttr(f.key, vs)} options={f.options ?? []} placeholder="Odaberi" />
    );
  };

  const opts = (arr: readonly string[]) => arr.map((v) => ({ value: v, label: v }));

  return (
    <div className="max-w-3xl space-y-6">
      <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-4">
        <h2 className="font-display text-xl">Osnovno</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* ⚠️ Karlo 22.08.2026: Marka je bila SLOBODAN TEKST — prodavač
              upiše bilo što i oglas postane nedohvatljiv kroz filtar marke.
              Sad dropdown iz popisa te (pod)kategorije, isti kao objava.
              Postojeća vrijednost izvan popisa ostaje kao prva opcija da se
              stari oglas ne izgubi spremanjem. */}
          {makeOpts.length > 0 ? (
            <SelectField label="Marka" value={s.make} onChange={(v) => set("make", v)} options={makeOpts} placeholder="Odaberi marku" />
          ) : (
            <TextField label="Marka" value={s.make} onChange={(v) => set("make", v)} />
          )}
          {showsModelField(listing.category, listing.subcategory ?? undefined) && (
            <TextField label="Model" value={s.model} onChange={(v) => set("model", v)} />
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Izvedba" optional value={s.variant} onChange={(v) => set("variant", v)} />
          {/* ⚠️ Godina ide kroz `TextField`, NE `NumberField` — potonji grupira
              tisućice pa je 2010 prikazivao kao "2.010". */}
          <TextField
            label="Godina"
            value={s.year}
            onChange={(v) => set("year", v.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="npr. 2019"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Cijena" unit="€" value={s.priceEur} onChange={(v) => set("priceEur", v)} placeholder="npr. 12500" />
          <NumberField label="Kilometraža" unit="km" value={s.km} onChange={(v) => set("km", v)} placeholder="npr. 95000" />
        </div>
        <SelectField label="Stanje" value={s.condition} onChange={(v) => set("condition", v as Listing["condition"])} options={opts(CONDITIONS)} />
      </section>

      {/* ⚠️ Karlo 13.08.2026 (st. 3): uređivanje fotografija — redoslijed,
          naslovna i brisanje. Dodavanje novih traži Storage bucket. */}
      <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-4">
        <h2 className="font-display text-xl">Fotografije</h2>
        <p className="text-sm text-[var(--color-muted)] -mt-2">
          Prva fotografija je naslovna — nju kupci vide u rezultatima.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg)]"
            >
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Fotografija ${i + 1}`} className="absolute inset-0 w-full h-full object-contain" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-ink)] text-[10px] font-bold">
                    Naslovna
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5 border-t border-[var(--color-line)]">
                <div className="flex gap-1">
                  <button type="button" onClick={() => pomakni(i, -1)} disabled={i === 0}
                    className="size-7 grid place-items-center rounded-md border border-[var(--color-line)] text-xs disabled:opacity-30 hover:bg-[var(--color-line)]/40"
                    aria-label="Pomakni lijevo">←</button>
                  <button type="button" onClick={() => pomakni(i, 1)} disabled={i === images.length - 1}
                    className="size-7 grid place-items-center rounded-md border border-[var(--color-line)] text-xs disabled:opacity-30 hover:bg-[var(--color-line)]/40"
                    aria-label="Pomakni desno">→</button>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && (
                    <button type="button" onClick={() => naGlavnu(i)}
                      className="h-7 px-2 rounded-md border border-[var(--color-line)] text-[11px] hover:bg-[var(--color-line)]/40">
                      Naslovna
                    </button>
                  )}
                  <button type="button" onClick={() => obrisi(i)} disabled={images.length <= 1}
                    className="size-7 grid place-items-center rounded-md border border-[var(--color-line)] text-xs text-red-700 disabled:opacity-30 hover:bg-red-600/10"
                    aria-label="Obriši fotografiju">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {images.length <= 1 && (
          <p className="text-xs text-[var(--color-muted)]">
            Oglas mora imati barem jednu fotografiju.
          </p>
        )}
      </section>

      <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-4">
        <h2 className="font-display text-xl">Specifikacije</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Gorivo" value={s.fuel} onChange={(v) => set("fuel", v as Listing["fuel"])} options={opts(FUEL_TYPES)} />
          <SelectField label="Mjenjač" value={s.transmission} onChange={(v) => set("transmission", v as Listing["transmission"])} options={opts(TRANSMISSIONS)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Karoserija" value={s.bodyType} onChange={(v) => set("bodyType", v as Listing["bodyType"])} options={opts(BODY_TYPES)} />
          <SelectField label="Pogon" value={s.drive} onChange={(v) => set("drive", v as Listing["drive"])} options={opts(DRIVES)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Snaga" unit="kW" value={s.powerKw} onChange={(v) => set("powerKw", v)} placeholder="npr. 110" />
          {/* Obujam isto bez grupiranja — 1968 cm³, ne "1.968". */}
          <TextField
            label="Obujam (cm³)"
            value={s.engineCc}
            onChange={(v) => set("engineCc", v.replace(/[^\d]/g, "").slice(0, 5))}
            placeholder="npr. 1968"
          />
        </div>
        <SelectField label="Boja" value={s.color} onChange={(v) => set("color", v as Listing["color"])} options={opts(COLORS)} />
      </section>

      <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-4">
        <h2 className="font-display text-xl">Lokacija i opis</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Županija"
            value={s.county}
            onChange={(v) => { set("county", v); set("city", ""); }}
            options={COUNTIES.map((c) => ({ value: c, label: c }))}
          />
          <SelectField label="Grad" value={s.city} onChange={(v) => set("city", v)} options={cityOptions} placeholder="Odaberi grad" />
        </div>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Opis</span>
          <Textarea
            rows={7}
            value={s.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Opiši vozilo — stanje, oprema, servisna povijest…"
          />
          <span className="block text-xs text-[var(--color-muted)] mt-1">
            {s.description.length} / 2000 znakova (najmanje 30)
          </span>
        </label>
      </section>

      {/* Karlo 09.08. (st. 1): Stanje vozila / Povijest / Dodatne opcije — polja
          iz sheme, ista kao pri objavi. Kvačice u redu, ostala polja u mreži. */}
      {attrGroups.map((g) => (
        <section key={g.name} className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-4">
          <h2 className="font-display text-xl">{g.name}</h2>
          {g.fields.some((f) => f.type === "toggle") && (
            <div className="flex flex-wrap gap-2">
              {g.fields.filter((f) => f.type === "toggle").map(renderAttrField)}
            </div>
          )}
          {g.fields.some((f) => f.type !== "toggle") && (
            <div className="grid sm:grid-cols-2 gap-4">
              {g.fields.filter((f) => f.type !== "toggle").map(renderAttrField)}
            </div>
          )}
        </section>
      ))}

      {err && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 text-[var(--color-danger)] px-4 py-3 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {err}
        </div>
      )}
      {ok && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-green-500/10 text-green-700 px-4 py-3 text-sm">
          <Check className="size-4 shrink-0" />
          Promjene su spremljene.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="accent" onClick={submit} disabled={pending}>
          {pending ? "Spremam..." : "Spremi promjene"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/moj-racun/oglasi">Odustani</Link>
        </Button>
        {/* Karlo 09.08. (st. 2): za SKICU "Pogledaj oglas" vodi na javni 404 —
            umjesto linka stoji gumb koji skicu objavljuje. */}
        {listing.status === "draft" ? (
          <Button variant="primary" onClick={publishDraft} disabled={pending} className="ml-auto">
            {pending ? "Objavljujem..." : "Objavi oglas"}
          </Button>
        ) : listing.slug ? (
          <Link
            href={`/oglasi/${listing.slug}`}
            className="text-sm text-[var(--color-accent-dark)] hover:underline ml-auto"
          >
            Pogledaj oglas →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
