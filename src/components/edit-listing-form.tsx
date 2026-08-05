"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, NumberField, TextField } from "@/components/napredno/controls";
import { Textarea } from "@/components/ui/input";
import { updateListingAction } from "@/actions/listings";
import { HR_LOCATIONS, COUNTIES } from "@/data/locations";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, DRIVES, COLORS, CONDITIONS,
  type Listing,
} from "@/lib/types";

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
export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

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
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
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
        {listing.slug && (
          <Link
            href={`/oglasi/${listing.slug}`}
            className="text-sm text-[var(--color-accent-dark)] hover:underline ml-auto"
          >
            Pogledaj oglas →
          </Link>
        )}
      </div>
    </div>
  );
}
