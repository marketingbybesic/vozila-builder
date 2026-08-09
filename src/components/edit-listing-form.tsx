"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, NumberField, TextField, MultiSelect, TogglePill } from "@/components/napredno/controls";
import { Textarea } from "@/components/ui/input";
import { updateListingAction, setListingStatusAction } from "@/actions/listings";
import { getFilterDefs, type FilterField } from "@/data/category-filters";
import { HR_LOCATIONS, COUNTIES } from "@/data/locations";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, DRIVES, COLORS, CONDITIONS,
  type Listing,
} from "@/lib/types";

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
          <TextField label="Marka" value={s.make} onChange={(v) => set("make", v)} />
          <TextField label="Model" value={s.model} onChange={(v) => set("model", v)} />
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
